/**
 * Placement service.
 *
 * Endpoint map (future DRF):
 *   GET   /api/placements/                       → listPlacements (role-scoped)
 *   GET   /api/placements/:id/                   → getPlacement
 *   POST  /api/placements/:id/assign-supervisor/ → assignAcademicSupervisor (COORDINATOR)
 *   POST  /api/placements/:id/workplace-supervisor/ → assignWorkplaceSupervisor (COMPANY)
 *   POST  /api/placements/:id/activate/          → activatePlacement (COORDINATOR)
 *   POST  /api/placements/:id/complete/          → completePlacement (COORDINATOR)
 *   POST  /api/placements/:id/cancel/            → cancelPlacement   (COORDINATOR)
 */

import { badRequest, forbidden, notFound } from '../types/api';
import type { PageQuery, Paginated } from '../types/api';
import type { PlacementStatus } from '../types/enums';
import type { Placement } from '../types/models';
import type { PlacementView } from '../types/views';
import {
  canAssignSupervisor,
  canCompletePlacement,
  canTransitionPlacement,
  canViewPlacement,
  isSupervisionOverdue,
  supervisorWorkload } from
'../domain/rules';
import type { Database } from './store';
import { nowISO, pushAudit, pushNotification, read, todayISO, write } from './store';
import { matchesSearch, paginate, request } from './transport';
import { requireActor, requireRole } from './session';
import { toCompanyBrief } from './opportunityService';
import { toStudentBrief } from './applicationService';

export function toPlacementView(db: Database, p: Placement): PlacementView {
  const o = db.opportunities.find((x) => x.id === p.opportunityId);
  const reports = db.supervisionReports.
  filter((r) => r.placementId === p.id && r.submitted).
  sort((a, b) => a.date < b.date ? 1 : -1);
  const lastSupervisionDate = reports[0]?.date ?? null;
  return {
    ...p,
    student: toStudentBrief(db, p.studentId),
    company: toCompanyBrief(db, p.companyId),
    opportunity: {
      id: o?.id ?? '',
      title: o?.title ?? 'Attachment',
      department: o?.department ?? '',
      workMode: o?.workMode ?? 'ONSITE',
      town: o?.town ?? ''
    },
    workplaceSupervisor:
    db.workplaceSupervisors.find((w) => w.id === p.workplaceSupervisorId) ?? null,
    academicSupervisor: db.supervisors.find((s) => s.id === p.academicSupervisorId) ?? null,
    supervisionCount: reports.length,
    lastSupervisionDate,
    supervisionOverdue: isSupervisionOverdue(p, lastSupervisionDate),
    evaluation: db.evaluations.find((e) => e.placementId === p.id) ?? null,
    progressReportCount: db.progressReports.filter((r) => r.placementId === p.id).length
  };
}

export interface PlacementQuery extends PageQuery {
  search?: string;
  status?: PlacementStatus;
  supervisorId?: string;
  companyId?: string;
  studentId?: string;
  unassignedOnly?: boolean;
  overdueOnly?: boolean;
}

function scope(db: Database, actor: ReturnType<typeof requireActor>): Placement[] {
  return db.placements.filter((p) => canViewPlacement(actor, p));
}

export function listPlacements(query: PlacementQuery = {}): Promise<Paginated<PlacementView>> {
  return request(() => {
    const actor = requireActor();
    return read((db) => {
      const rows = scope(db, actor).
      map((p) => toPlacementView(db, p)).
      filter(
        (v) =>
        matchesSearch(query.search, v.student.fullName, v.student.studentNumber, v.company.name) && (
        !query.status || v.status === query.status) && (
        !query.supervisorId || v.academicSupervisorId === query.supervisorId) && (
        !query.companyId || v.companyId === query.companyId) && (
        !query.studentId || v.studentId === query.studentId) && (
        !query.unassignedOnly || !v.academicSupervisorId) && (
        !query.overdueOnly || v.supervisionOverdue)
      ).
      sort((a, b) => a.startDate < b.startDate ? 1 : -1);
      return paginate(rows, query);
    });
  });
}

export function getPlacement(id: string): Promise<PlacementView> {
  return request(() => {
    const actor = requireActor();
    return read((db) => {
      const p = db.placements.find((x) => x.id === id);
      if (!p) throw notFound('Placement not found.');
      if (!canViewPlacement(actor, p)) throw forbidden();
      return toPlacementView(db, p);
    });
  });
}

/** The student's own placement, if one exists. */
export function getMyPlacement(): Promise<PlacementView | null> {
  return request(() => {
    const actor = requireRole('STUDENT');
    return read((db) => {
      const p = db.placements.
      filter((x) => x.studentId === actor.profileId && x.status !== 'CANCELLED').
      sort((a, b) => a.createdAt < b.createdAt ? 1 : -1)[0];
      return p ? toPlacementView(db, p) : null;
    });
  });
}

export function assignAcademicSupervisor(
placementId: string,
supervisorId: string,
acknowledgeOverCapacity = false)
: Promise<PlacementView> {
  return request(() => {
    const actor = requireRole('COORDINATOR', 'ADMIN');
    return write((db) => {
      const p = db.placements.find((x) => x.id === placementId);
      if (!p) throw notFound('Placement not found.');
      const gate = canAssignSupervisor(actor.role, p);
      if (!gate.allowed) throw forbidden(gate.reason);

      const supervisor = db.supervisors.find((s) => s.id === supervisorId);
      if (!supervisor) throw notFound('Supervisor not found.');

      const workload = supervisorWorkload(supervisor, db.placements);
      if (workload.atCapacity && !acknowledgeOverCapacity) {
        throw badRequest({
          detail: `${supervisor.fullName} is at the recommended capacity of ${supervisor.capacity} students. Confirm to assign anyway.`,
          code: 'capacity_warning'
        });
      }

      p.academicSupervisorId = supervisor.id;
      p.supervisorAssignedAt = nowISO();
      // Assignment is what makes a placement operational.
      if (p.status === 'APPROVED') {
        p.status = p.startDate > todayISO() ? 'UPCOMING' : 'ACTIVE';
      }

      const student = db.students.find((s) => s.id === p.studentId);
      const company = db.companies.find((c) => c.id === p.companyId);
      if (student) {
        pushNotification(db, {
          userId: student.userId,
          type: 'PLACEMENT',
          title: 'You have been assigned an academic supervisor',
          message: `${supervisor.fullName} will supervise your attachment at ${company?.name ?? 'your host organisation'}.`,
          link: '/student/placement'
        });
      }
      pushNotification(db, {
        userId: supervisor.userId,
        type: 'PLACEMENT',
        title: 'New student assigned',
        message: `${student?.fullName ?? 'A student'} has been assigned to you for supervision at ${company?.name ?? 'a host organisation'}.`,
        link: `/supervisor/placements/${p.id}`
      });
      pushAudit(db, {
        actorId: actor.profileId,
        actorName: actor.fullName,
        actorRole: actor.role,
        action: 'SUPERVISOR_ASSIGNED',
        objectType: 'Placement',
        objectId: p.id,
        objectLabel: `${student?.fullName ?? 'Student'} — ${supervisor.fullName}`,
        metadata: {
          supervisor: supervisor.fullName,
          overCapacity: workload.atCapacity
        }
      });
      return toPlacementView(db, p);
    });
  });
}

export function assignWorkplaceSupervisor(
placementId: string,
workplaceSupervisorId: string)
: Promise<PlacementView> {
  return request(() => {
    const actor = requireRole('COMPANY');
    return write((db) => {
      const p = db.placements.find((x) => x.id === placementId);
      if (!p) throw notFound('Placement not found.');
      if (p.companyId !== actor.profileId) throw forbidden();
      const w = db.workplaceSupervisors.find(
        (x) => x.id === workplaceSupervisorId && x.companyId === actor.profileId
      );
      if (!w) throw notFound('Workplace supervisor not found.');
      p.workplaceSupervisorId = w.id;
      const student = db.students.find((s) => s.id === p.studentId);
      if (student) {
        pushNotification(db, {
          userId: student.userId,
          type: 'PLACEMENT',
          title: 'Workplace supervisor assigned',
          message: `${w.fullName} (${w.jobTitle}) is your workplace supervisor.`,
          link: '/student/placement'
        });
      }
      return toPlacementView(db, p);
    });
  });
}

export function activatePlacement(id: string): Promise<PlacementView> {
  return request(() => {
    const actor = requireRole('COORDINATOR', 'ADMIN');
    return write((db) => {
      const p = db.placements.find((x) => x.id === id);
      if (!p) throw notFound('Placement not found.');
      if (!canTransitionPlacement(p.status, 'ACTIVE')) {
        throw badRequest({ detail: 'This placement cannot be activated from its current state.' });
      }
      if (!p.academicSupervisorId) {
        throw badRequest({ detail: 'Assign an academic supervisor before activating the placement.' });
      }
      p.status = 'ACTIVE';
      void actor;
      return toPlacementView(db, p);
    });
  });
}

export function completePlacement(id: string): Promise<PlacementView> {
  return request(() => {
    const actor = requireRole('COORDINATOR', 'ADMIN', 'SUPERVISOR');
    return write((db) => {
      const p = db.placements.find((x) => x.id === id);
      if (!p) throw notFound('Placement not found.');
      if (actor.role === 'SUPERVISOR' && p.academicSupervisorId !== actor.profileId) throw forbidden();
      const evaluation = db.evaluations.find((e) => e.placementId === p.id && e.locked);
      const gate = canCompletePlacement(p, !!evaluation);
      if (!gate.allowed) throw badRequest({ detail: gate.reason! });

      p.status = 'COMPLETED';
      p.completedAt = nowISO();

      const student = db.students.find((s) => s.id === p.studentId);
      const company = db.companies.find((c) => c.id === p.companyId);
      if (student) {
        pushNotification(db, {
          userId: student.userId,
          type: 'PLACEMENT',
          title: 'Placement completed',
          message: `Your attachment at ${company?.name ?? 'your host organisation'} has been marked completed.`,
          link: '/student/placement'
        });
      }
      pushAudit(db, {
        actorId: actor.profileId,
        actorName: actor.fullName,
        actorRole: actor.role,
        action: 'PLACEMENT_COMPLETED',
        objectType: 'Placement',
        objectId: p.id,
        objectLabel: `${student?.fullName ?? 'Student'} — ${company?.name ?? ''}`
      });
      return toPlacementView(db, p);
    });
  });
}

export function cancelPlacement(id: string, reason: string): Promise<PlacementView> {
  return request(() => {
    const actor = requireRole('COORDINATOR', 'ADMIN');
    return write((db) => {
      const p = db.placements.find((x) => x.id === id);
      if (!p) throw notFound('Placement not found.');
      if (!canTransitionPlacement(p.status, 'CANCELLED')) {
        throw badRequest({ detail: 'A completed placement cannot be cancelled.' });
      }
      if (!reason.trim()) throw badRequest({ reason: ['A reason is required.'] });
      p.status = 'CANCELLED';
      const student = db.students.find((s) => s.id === p.studentId);
      if (student) {
        pushNotification(db, {
          userId: student.userId,
          type: 'PLACEMENT',
          title: 'Placement cancelled',
          message: reason,
          link: '/student/placement'
        });
      }
      pushAudit(db, {
        actorId: actor.profileId,
        actorName: actor.fullName,
        actorRole: actor.role,
        action: 'PLACEMENT_REJECTED',
        objectType: 'Placement',
        objectId: p.id,
        objectLabel: `${student?.fullName ?? 'Student'} — cancelled`,
        metadata: { reason }
      });
      return toPlacementView(db, p);
    });
  });
}