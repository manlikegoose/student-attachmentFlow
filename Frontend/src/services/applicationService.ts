/**
 * Application service — the spine of the attachment workflow.
 *
 * Endpoint map (future DRF):
 *   GET    /api/applications/                  → listApplications (role-scoped queryset)
 *   GET    /api/applications/:id/              → getApplication
 *   POST   /api/applications/                  → createApplication        (STUDENT)
 *   POST   /api/applications/:id/withdraw/     → withdrawApplication      (STUDENT, owner)
 *   POST   /api/applications/:id/company-decision/    → companyDecision   (COMPANY, owner)
 *   POST   /api/applications/:id/university-decision/ → universityDecision(COORDINATOR)
 */

import { badRequest, forbidden, notFound } from '../types/api';
import type { PageQuery, Paginated } from '../types/api';
import type { ApplicationStatus } from '../types/enums';
import type { Application, Placement } from '../types/models';
import type { ApplicationView, StudentBrief } from '../types/views';
import {
  ACTIVE_APPLICATION_STATUSES,
  canApply,
  canCompanyDecide,
  canTransitionApplication,
  canUniversityDecide,
  checkRequiredDocuments } from
'../domain/rules';
import type { Database } from './store';
import { nextId, nowISO, pushAudit, pushNotification, read, write } from './store';
import { matchesSearch, paginate, request } from './transport';
import { requireActor, requireRole } from './session';
import { toCompanyBrief } from './opportunityService';

export function toStudentBrief(db: Database, studentId: string): StudentBrief {
  const s = db.students.find((x) => x.id === studentId);
  if (!s) throw notFound('Student not found.');
  return {
    id: s.id,
    fullName: s.fullName,
    studentNumber: s.studentNumber,
    programme: s.programme,
    department: s.department,
    yearOfStudy: s.yearOfStudy,
    email: s.email,
    phone: s.phone
  };
}

function toApplicationView(db: Database, a: Application): ApplicationView {
  const o = db.opportunities.find((x) => x.id === a.opportunityId);
  if (!o) throw notFound('Opportunity not found.');
  return {
    ...a,
    student: toStudentBrief(db, a.studentId),
    opportunity: {
      id: o.id,
      title: o.title,
      startDate: o.startDate,
      endDate: o.endDate,
      town: o.town,
      workMode: o.workMode,
      department: o.department
    },
    company: toCompanyBrief(db, a.companyId),
    documents: db.documents.filter((d) => a.documentIds.includes(d.id))
  };
}

export interface ApplicationQuery extends PageQuery {
  search?: string;
  status?: ApplicationStatus;
  opportunityId?: string;
  studentId?: string;
  companyId?: string;
  /** Coordinator shortcut for the university review queue. */
  awaitingUniversityReview?: boolean;
}

function scopeForActor(db: Database, actor: ReturnType<typeof requireActor>): Application[] {
  switch (actor.role) {
    case 'STUDENT':
      return db.applications.filter((a) => a.studentId === actor.profileId);
    case 'COMPANY':
      return db.applications.filter((a) => a.companyId === actor.profileId);
    case 'COORDINATOR':
    case 'ADMIN':
      return db.applications.slice();
    case 'SUPERVISOR':{
        const studentIds = db.placements.
        filter((p) => p.academicSupervisorId === actor.profileId).
        map((p) => p.studentId);
        return db.applications.filter((a) => studentIds.includes(a.studentId));
      }
    default:
      return [];
  }
}

export function listApplications(
query: ApplicationQuery = {})
: Promise<Paginated<ApplicationView>> {
  return request(() => {
    const actor = requireActor();
    return read((db) => {
      const rows = scopeForActor(db, actor).
      filter((a) => {
        const student = db.students.find((s) => s.id === a.studentId);
        const opportunity = db.opportunities.find((o) => o.id === a.opportunityId);
        return (
          matchesSearch(query.search, student?.fullName, student?.studentNumber, opportunity?.title) && (
          !query.status || a.status === query.status) && (
          !query.opportunityId || a.opportunityId === query.opportunityId) && (
          !query.studentId || a.studentId === query.studentId) && (
          !query.companyId || a.companyId === query.companyId) && (
          !query.awaitingUniversityReview || a.status === 'UNIVERSITY_REVIEW'));

      }).
      sort((a, b) => a.submittedAt < b.submittedAt ? 1 : -1).
      map((a) => toApplicationView(db, a));
      return paginate(rows, query);
    });
  });
}

export function getApplication(id: string): Promise<ApplicationView> {
  return request(() => {
    const actor = requireActor();
    return read((db) => {
      const a = db.applications.find((x) => x.id === id);
      if (!a) throw notFound('Application not found.');
      const permitted =
      actor.role === 'STUDENT' && a.studentId === actor.profileId ||
      actor.role === 'COMPANY' && a.companyId === actor.profileId ||
      actor.role === 'COORDINATOR' ||
      actor.role === 'ADMIN' ||
      actor.role === 'SUPERVISOR' &&
      db.placements.some(
        (p) => p.studentId === a.studentId && p.academicSupervisorId === actor.profileId
      );
      if (!permitted) throw forbidden();
      return toApplicationView(db, a);
    });
  });
}

export interface ApplicationInput {
  opportunityId: string;
  coverLetter: string;
  documentIds: string[];
}

export function createApplication(input: ApplicationInput): Promise<ApplicationView> {
  return request(() => {
    const actor = requireRole('STUDENT');
    return write((db) => {
      const opportunity = db.opportunities.find((o) => o.id === input.opportunityId);
      if (!opportunity) throw notFound('Opportunity not found.');

      const existing = db.applications.filter((a) => a.studentId === actor.profileId);
      const gate = canApply(opportunity, existing);
      if (!gate.allowed) throw badRequest({ detail: gate.reason ?? 'You cannot apply right now.' });

      if (input.coverLetter.trim().length < 60) {
        throw badRequest({
          coverLetter: ['Your cover letter should be at least 60 characters.']
        });
      }
      const owned = db.documents.filter(
        (d) => d.ownerId === actor.profileId && input.documentIds.includes(d.id)
      );
      if (owned.length !== input.documentIds.length) {
        throw badRequest({ documentIds: ['One or more selected documents could not be found.'] });
      }
      const hasCv = owned.some((d) => d.type === 'CV');
      if (!hasCv) {
        throw badRequest({ documentIds: ['Attach your CV before submitting an application.'] });
      }

      const record: Application = {
        id: nextId('app'),
        studentId: actor.profileId,
        opportunityId: opportunity.id,
        companyId: opportunity.companyId,
        status: 'SUBMITTED',
        coverLetter: input.coverLetter.trim(),
        documentIds: input.documentIds,
        submittedAt: nowISO(),
        updatedAt: nowISO()
      };
      db.applications.push(record);

      const student = db.students.find((s) => s.id === actor.profileId);
      const company = db.companies.find((c) => c.id === opportunity.companyId);

      pushNotification(db, {
        userId: actor.userId,
        type: 'APPLICATION',
        title: 'Application submitted',
        message: `Your application to ${company?.name ?? 'the host organisation'} for ${opportunity.title} has been submitted.`,
        link: `/student/applications/${record.id}`
      });
      if (company) {
        pushNotification(db, {
          userId: company.userId,
          type: 'APPLICATION',
          title: 'New application received',
          message: `${student?.fullName ?? 'A student'} applied for ${opportunity.title}.`,
          link: `/company/applications/${record.id}`
        });
      }
      pushAudit(db, {
        actorId: actor.profileId,
        actorName: actor.fullName,
        actorRole: actor.role,
        action: 'APPLICATION_SUBMITTED',
        objectType: 'Application',
        objectId: record.id,
        objectLabel: `${student?.fullName ?? 'Student'} — ${opportunity.title}`
      });
      return toApplicationView(db, record);
    });
  });
}

export function withdrawApplication(id: string): Promise<ApplicationView> {
  return request(() => {
    const actor = requireRole('STUDENT');
    return write((db) => {
      const a = db.applications.find((x) => x.id === id);
      if (!a) throw notFound('Application not found.');
      if (a.studentId !== actor.profileId) throw forbidden();
      if (!canTransitionApplication(a.status, 'WITHDRAWN')) {
        throw badRequest({ detail: 'This application can no longer be withdrawn.' });
      }
      a.status = 'WITHDRAWN';
      a.updatedAt = nowISO();
      const opportunity = db.opportunities.find((o) => o.id === a.opportunityId);
      pushAudit(db, {
        actorId: actor.profileId,
        actorName: actor.fullName,
        actorRole: actor.role,
        action: 'APPLICATION_WITHDRAWN',
        objectType: 'Application',
        objectId: a.id,
        objectLabel: `${actor.fullName} — ${opportunity?.title ?? 'opportunity'}`
      });
      return toApplicationView(db, a);
    });
  });
}

/** Company review stage. Acceptance forwards the application to the university. */
export function companyDecision(
id: string,
decision: 'ACCEPT' | 'REJECT',
reason: string)
: Promise<ApplicationView> {
  return request(() => {
    const actor = requireRole('COMPANY');
    return write((db) => {
      const a = db.applications.find((x) => x.id === id);
      if (!a) throw notFound('Application not found.');
      if (a.companyId !== actor.profileId) throw forbidden();
      const gate = canCompanyDecide(a, actor.role);
      if (!gate.allowed) throw badRequest({ detail: gate.reason! });
      if (decision === 'REJECT' && !reason.trim()) {
        throw badRequest({ reason: ['A reason is required when declining an applicant.'] });
      }

      const student = db.students.find((s) => s.id === a.studentId);
      const opportunity = db.opportunities.find((o) => o.id === a.opportunityId);
      const company = db.companies.find((c) => c.id === a.companyId);

      a.status = decision === 'ACCEPT' ? 'UNIVERSITY_REVIEW' : 'COMPANY_REJECTED';
      a.companyDecisionById = actor.profileId;
      a.companyDecisionAt = nowISO();
      a.companyDecisionReason = reason.trim() || null;
      a.updatedAt = nowISO();

      if (student) {
        pushNotification(db, {
          userId: student.userId,
          type: 'APPLICATION',
          title:
          decision === 'ACCEPT' ?
          `Your application was accepted by ${company?.name ?? 'the host organisation'}` :
          'Application not successful',
          message:
          decision === 'ACCEPT' ?
          `${company?.name ?? 'The host organisation'} accepted your application for ${opportunity?.title}. It is now awaiting university approval.` :
          `${company?.name ?? 'The host organisation'} did not proceed with your application for ${opportunity?.title}. ${reason}`,
          link: `/student/applications/${a.id}`
        });
      }
      if (decision === 'ACCEPT') {
        db.coordinators.forEach((c) =>
        pushNotification(db, {
          userId: c.userId,
          type: 'APPLICATION',
          title: 'Application awaiting university review',
          message: `${student?.fullName ?? 'A student'} — ${opportunity?.title} at ${company?.name}.`,
          link: `/coordinator/applications/${a.id}`
        })
        );
      }
      pushAudit(db, {
        actorId: actor.profileId,
        actorName: actor.fullName,
        actorRole: actor.role,
        action: decision === 'ACCEPT' ? 'APPLICATION_ACCEPTED' : 'APPLICATION_REJECTED',
        objectType: 'Application',
        objectId: a.id,
        objectLabel: `${student?.fullName ?? 'Student'} — ${opportunity?.title ?? ''}`,
        metadata: reason ? { reason } : undefined
      });
      return toApplicationView(db, a);
    });
  });
}

/**
 * University review stage. Approval creates the Placement — a separate entity with its
 * own lifecycle, never a status flag on the application.
 */
export function universityDecision(
id: string,
decision: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION',
reason: string)
: Promise<{application: ApplicationView;placementId: string | null;}> {
  return request(() => {
    const actor = requireRole('COORDINATOR', 'ADMIN');
    return write((db) => {
      const a = db.applications.find((x) => x.id === id);
      if (!a) throw notFound('Application not found.');
      const gate = canUniversityDecide(a, actor.role);
      if (!gate.allowed) throw badRequest({ detail: gate.reason! });
      if (decision !== 'APPROVE' && !reason.trim()) {
        throw badRequest({ reason: ['A reason is required for this decision.'] });
      }

      const student = db.students.find((s) => s.id === a.studentId);
      const opportunity = db.opportunities.find((o) => o.id === a.opportunityId);
      const company = db.companies.find((c) => c.id === a.companyId);
      if (!student || !opportunity) throw notFound('Related records not found.');

      if (decision === 'APPROVE') {
        const readiness = checkRequiredDocuments(db.documents.filter((d) => d.ownerId === student.id));
        if (!readiness.ready) {
          throw badRequest({
            detail:
            'Required documents are not yet approved for this student. Approve the outstanding documents first.'
          });
        }
      }

      let placementId: string | null = null;

      if (decision === 'REQUEST_REVISION') {
        a.revisionRequested = true;
        a.universityDecisionReason = reason.trim();
        a.updatedAt = nowISO();
      } else if (decision === 'REJECT') {
        a.status = 'UNIVERSITY_REJECTED';
        a.universityDecisionById = actor.profileId;
        a.universityDecisionAt = nowISO();
        a.universityDecisionReason = reason.trim();
        a.updatedAt = nowISO();
      } else {
        a.status = 'UNIVERSITY_APPROVED';
        a.universityDecisionById = actor.profileId;
        a.universityDecisionAt = nowISO();
        a.universityDecisionReason = reason.trim() || null;
        a.updatedAt = nowISO();

        const placement: Placement = {
          id: nextId('pl'),
          applicationId: a.id,
          studentId: a.studentId,
          companyId: a.companyId,
          opportunityId: a.opportunityId,
          startDate: opportunity.startDate,
          endDate: opportunity.endDate,
          workplaceSupervisorId: null,
          academicSupervisorId: null,
          status: 'APPROVED',
          approvedAt: nowISO(),
          approvedById: actor.profileId,
          createdAt: nowISO()
        };
        db.placements.push(placement);
        placementId = placement.id;
        opportunity.slotsFilled = Math.min(opportunity.slots, opportunity.slotsFilled + 1);
        if (opportunity.slotsFilled >= opportunity.slots && opportunity.status === 'PUBLISHED') {
          opportunity.status = 'CLOSED';
        }

        // Any other active applications by this student are superseded.
        db.applications.
        filter(
          (other) =>
          other.studentId === a.studentId &&
          other.id !== a.id &&
          ACTIVE_APPLICATION_STATUSES.includes(other.status)
        ).
        forEach((other) => {
          other.status = 'WITHDRAWN';
          other.updatedAt = nowISO();
        });
      }

      const titles: Record<typeof decision, string> = {
        APPROVE: 'Your placement has been approved',
        REJECT: 'Your placement was not approved',
        REQUEST_REVISION: 'Revision requested on your application'
      };
      pushNotification(db, {
        userId: student.userId,
        type: 'PLACEMENT',
        title: titles[decision],
        message:
        decision === 'APPROVE' ?
        `The university approved your placement at ${company?.name}. An academic supervisor will be assigned shortly.` :
        reason,
        link: decision === 'APPROVE' ? '/student/placement' : `/student/applications/${a.id}`
      });
      if (company && decision === 'APPROVE') {
        pushNotification(db, {
          userId: company.userId,
          type: 'PLACEMENT',
          title: 'Placement approved by the university',
          message: `${student.fullName} is confirmed for ${opportunity.title}.`,
          link: '/company/students'
        });
      }
      if (decision !== 'REQUEST_REVISION') {
        pushAudit(db, {
          actorId: actor.profileId,
          actorName: actor.fullName,
          actorRole: actor.role,
          action: decision === 'APPROVE' ? 'PLACEMENT_APPROVED' : 'PLACEMENT_REJECTED',
          objectType: decision === 'APPROVE' ? 'Placement' : 'Application',
          objectId: placementId ?? a.id,
          objectLabel: `${student.fullName} — ${company?.name ?? opportunity.title}`,
          metadata: reason ? { reason } : undefined
        });
      }

      return { application: toApplicationView(db, a), placementId };
    });
  });
}