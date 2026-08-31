/**
 * Supervision service — academic supervision records and student progress reports.
 *
 * Endpoint map (future DRF):
 *   GET   /api/supervisions/            → listSupervisionReports (role-scoped)
 *   POST  /api/supervisions/            → createSupervisionReport (SUPERVISOR)
 *   PATCH /api/supervisions/:id/        → updateSupervisionReport (author, unsubmitted)
 *   POST  /api/supervisions/:id/submit/ → submitSupervisionReport (author)
 *   POST  /api/supervisions/:id/reopen/ → reopenSupervisionReport (COORDINATOR)
 *   GET   /api/progress-reports/        → listProgressReports
 *   POST  /api/progress-reports/        → createProgressReport   (STUDENT)
 *   POST  /api/progress-reports/:id/feedback/ → giveProgressFeedback (SUPERVISOR)
 */

import { badRequest, forbidden, notFound } from '../types/api';
import type { PageQuery, Paginated } from '../types/api';
import type { SupervisionType } from '../types/enums';
import type { ProgressReport, SupervisionReport } from '../types/models';
import type { ProgressReportView, SupervisionReportView } from '../types/views';
import { canEditSupervisionReport, canViewPlacement } from '../domain/rules';
import type { Database } from './store';
import { nextId, nowISO, pushAudit, pushNotification, read, write } from './store';
import { paginate, request } from './transport';
import { requireActor, requireRole } from './session';
import type { StudentBrief } from '../types/views';

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

function toSupervisionView(db: Database, r: SupervisionReport): SupervisionReportView {
  const placement = db.placements.find((p) => p.id === r.placementId);
  return {
    ...r,
    student: toStudentBrief(db, r.studentId),
    companyName: db.companies.find((c) => c.id === placement?.companyId)?.name ?? '—'
  };
}

function toProgressView(db: Database, r: ProgressReport): ProgressReportView {
  const placement = db.placements.find((p) => p.id === r.placementId);
  return {
    ...r,
    student: toStudentBrief(db, r.studentId),
    companyName: db.companies.find((c) => c.id === placement?.companyId)?.name ?? '—'
  };
}

export interface SupervisionQuery extends PageQuery {
  placementId?: string;
  studentId?: string;
  supervisorId?: string;
  submitted?: boolean;
}

export function listSupervisionReports(
query: SupervisionQuery = {})
: Promise<Paginated<SupervisionReportView>> {
  return request(() => {
    const actor = requireActor();
    return read((db) => {
      const rows = db.supervisionReports.
      filter((r) => {
        const placement = db.placements.find((p) => p.id === r.placementId);
        if (!placement || !canViewPlacement(actor, placement)) return false;
        // A student sees only submitted reports about their own placement.
        if (actor.role === 'STUDENT' && !r.submitted) return false;
        return (
          (!query.placementId || r.placementId === query.placementId) && (
          !query.studentId || r.studentId === query.studentId) && (
          !query.supervisorId || r.supervisorId === query.supervisorId) && (
          query.submitted === undefined || r.submitted === query.submitted));

      }).
      sort((a, b) => a.date < b.date ? 1 : -1).
      map((r) => toSupervisionView(db, r));
      return paginate(rows, query);
    });
  });
}

export function getSupervisionReport(id: string): Promise<SupervisionReportView> {
  return request(() => {
    const actor = requireActor();
    return read((db) => {
      const r = db.supervisionReports.find((x) => x.id === id);
      if (!r) throw notFound('Supervision report not found.');
      const placement = db.placements.find((p) => p.id === r.placementId);
      if (!placement || !canViewPlacement(actor, placement)) throw forbidden();
      if (actor.role === 'STUDENT' && !r.submitted) throw forbidden();
      return toSupervisionView(db, r);
    });
  });
}

export interface SupervisionInput {
  placementId: string;
  date: string;
  type: SupervisionType;
  studentPresent: boolean;
  progressSummary: string;
  technicalProgress: string;
  challenges: string;
  strengths: string;
  areasForImprovement: string;
  recommendations: string;
  supervisorComments: string;
}

function validateSupervision(input: SupervisionInput, submitting: boolean) {
  const errors: Record<string, string[]> = {};
  if (!input.date) errors.date = ['Select the supervision date.'];
  if (input.date > nowISO().slice(0, 10)) errors.date = ['The supervision date cannot be in the future.'];
  if (submitting) {
    if (input.progressSummary.trim().length < 40)
    errors.progressSummary = ['Provide a progress summary of at least 40 characters.'];
    if (!input.technicalProgress.trim())
    errors.technicalProgress = ['Describe the student’s technical progress.'];
    if (!input.recommendations.trim()) errors.recommendations = ['Record your recommendations.'];
  }
  if (Object.keys(errors).length) throw badRequest(errors);
}

export function createSupervisionReport(
input: SupervisionInput,
submit: boolean)
: Promise<SupervisionReportView> {
  return request(() => {
    const actor = requireRole('SUPERVISOR');
    return write((db) => {
      const placement = db.placements.find((p) => p.id === input.placementId);
      if (!placement) throw notFound('Placement not found.');
      if (placement.academicSupervisorId !== actor.profileId) {
        throw forbidden('This student is not assigned to you.');
      }
      validateSupervision(input, submit);

      const record: SupervisionReport = {
        ...input,
        id: nextId('sr'),
        studentId: placement.studentId,
        supervisorId: actor.profileId,
        submitted: submit,
        submittedAt: submit ? nowISO() : null,
        createdAt: nowISO()
      };
      db.supervisionReports.push(record);
      if (submit) notifySubmission(db, record, actor);
      return toSupervisionView(db, record);
    });
  });
}

export function updateSupervisionReport(
id: string,
input: SupervisionInput,
submit: boolean)
: Promise<SupervisionReportView> {
  return request(() => {
    const actor = requireRole('SUPERVISOR', 'COORDINATOR');
    return write((db) => {
      const record = db.supervisionReports.find((r) => r.id === id);
      if (!record) throw notFound('Supervision report not found.');
      const gate = canEditSupervisionReport(record, actor);
      if (!gate.allowed) throw forbidden(gate.reason);
      validateSupervision(input, submit);
      Object.assign(record, input);
      if (submit && !record.submitted) {
        record.submitted = true;
        record.submittedAt = nowISO();
        notifySubmission(db, record, actor);
      }
      return toSupervisionView(db, record);
    });
  });
}

function notifySubmission(
db: Database,
record: SupervisionReport,
actor: ReturnType<typeof requireActor>)
{
  const student = db.students.find((s) => s.id === record.studentId);
  const supervisor = db.supervisors.find((s) => s.id === record.supervisorId);
  if (student) {
    pushNotification(db, {
      userId: student.userId,
      type: 'SUPERVISION',
      title: 'Supervision report submitted',
      message: `${supervisor?.fullName ?? 'Your academic supervisor'} recorded a supervision session dated ${record.date}.`,
      link: '/student/placement'
    });
  }
  db.coordinators.forEach((c) =>
  pushNotification(db, {
    userId: c.userId,
    type: 'SUPERVISION',
    title: 'Supervision report submitted',
    message: `${supervisor?.fullName ?? 'A supervisor'} submitted a report for ${student?.fullName ?? 'a student'}.`,
    link: `/coordinator/placements/${record.placementId}`
  })
  );
  pushAudit(db, {
    actorId: actor.profileId,
    actorName: actor.fullName,
    actorRole: actor.role,
    action: 'SUPERVISION_SUBMITTED',
    objectType: 'SupervisionReport',
    objectId: record.id,
    objectLabel: `${student?.fullName ?? 'Student'} — ${record.type.replace(/_/g, ' ').toLowerCase()}`
  });
}

export function reopenSupervisionReport(id: string, reason: string): Promise<SupervisionReportView> {
  return request(() => {
    const actor = requireRole('COORDINATOR', 'ADMIN');
    return write((db) => {
      const record = db.supervisionReports.find((r) => r.id === id);
      if (!record) throw notFound('Supervision report not found.');
      if (!record.submitted) throw badRequest({ detail: 'This report is not locked.' });
      if (!reason.trim()) throw badRequest({ reason: ['A reason is required.'] });
      record.submitted = false;
      record.submittedAt = null;
      const supervisor = db.supervisors.find((s) => s.id === record.supervisorId);
      if (supervisor) {
        pushNotification(db, {
          userId: supervisor.userId,
          type: 'SUPERVISION',
          title: 'Supervision report reopened',
          message: `The attachment office reopened a report for editing: ${reason}`,
          link: '/supervisor/reports'
        });
      }
      pushAudit(db, {
        actorId: actor.profileId,
        actorName: actor.fullName,
        actorRole: actor.role,
        action: 'EVALUATION_REOPENED',
        objectType: 'SupervisionReport',
        objectId: record.id,
        objectLabel: `Report reopened — ${reason}`
      });
      return toSupervisionView(db, record);
    });
  });
}

/* --------------------------- progress reports --------------------------- */

export interface ProgressQuery extends PageQuery {
  placementId?: string;
  studentId?: string;
  awaitingFeedback?: boolean;
}

export function listProgressReports(
query: ProgressQuery = {})
: Promise<Paginated<ProgressReportView>> {
  return request(() => {
    const actor = requireActor();
    return read((db) => {
      const rows = db.progressReports.
      filter((r) => {
        const placement = db.placements.find((p) => p.id === r.placementId);
        if (!placement || !canViewPlacement(actor, placement)) return false;
        return (
          (!query.placementId || r.placementId === query.placementId) && (
          !query.studentId || r.studentId === query.studentId) && (
          !query.awaitingFeedback || !r.supervisorFeedback));

      }).
      sort((a, b) => a.periodStart < b.periodStart ? 1 : -1).
      map((r) => toProgressView(db, r));
      return paginate(rows, query);
    });
  });
}

export interface ProgressInput {
  periodStart: string;
  periodEnd: string;
  activitiesCompleted: string;
  skillsLearned: string;
  challenges: string;
  achievements: string;
  nextGoals: string;
}

export function createProgressReport(input: ProgressInput): Promise<ProgressReportView> {
  return request(() => {
    const actor = requireRole('STUDENT');
    return write((db) => {
      const placement = db.placements.find(
        (p) => p.studentId === actor.profileId && ['ACTIVE', 'UPCOMING'].includes(p.status)
      );
      if (!placement) {
        throw badRequest({ detail: 'You do not have an active placement to report against.' });
      }
      const errors: Record<string, string[]> = {};
      if (!input.periodStart) errors.periodStart = ['Select the start of the reporting period.'];
      if (!input.periodEnd) errors.periodEnd = ['Select the end of the reporting period.'];
      if (input.periodStart && input.periodEnd && input.periodEnd < input.periodStart)
      errors.periodEnd = ['The period end must fall after the start.'];
      if (input.activitiesCompleted.trim().length < 40)
      errors.activitiesCompleted = ['Describe your activities in at least 40 characters.'];
      if (!input.skillsLearned.trim()) errors.skillsLearned = ['List the skills you developed.'];
      if (!input.nextGoals.trim()) errors.nextGoals = ['State your goals for the next period.'];
      if (Object.keys(errors).length) throw badRequest(errors);

      const record: ProgressReport = {
        ...input,
        id: nextId('pr'),
        placementId: placement.id,
        studentId: actor.profileId,
        submittedAt: nowISO()
      };
      db.progressReports.push(record);

      const supervisor = db.supervisors.find((s) => s.id === placement.academicSupervisorId);
      if (supervisor) {
        pushNotification(db, {
          userId: supervisor.userId,
          type: 'SUPERVISION',
          title: 'Progress report submitted',
          message: `${actor.fullName} submitted a progress report for ${input.periodStart} – ${input.periodEnd}.`,
          link: `/supervisor/placements/${placement.id}`
        });
      }
      return toProgressView(db, record);
    });
  });
}

export function giveProgressFeedback(id: string, feedback: string): Promise<ProgressReportView> {
  return request(() => {
    const actor = requireRole('SUPERVISOR');
    return write((db) => {
      const record = db.progressReports.find((r) => r.id === id);
      if (!record) throw notFound('Progress report not found.');
      const placement = db.placements.find((p) => p.id === record.placementId);
      if (!placement || placement.academicSupervisorId !== actor.profileId) throw forbidden();
      if (!feedback.trim()) throw badRequest({ feedback: ['Enter your feedback.'] });
      record.supervisorFeedback = feedback.trim();
      record.reviewedById = actor.profileId;
      record.reviewedAt = nowISO();
      const student = db.students.find((s) => s.id === record.studentId);
      if (student) {
        pushNotification(db, {
          userId: student.userId,
          type: 'SUPERVISION',
          title: 'Feedback on your progress report',
          message: `${actor.fullName} reviewed your report for ${record.periodStart} – ${record.periodEnd}.`,
          link: '/student/reports'
        });
      }
      return toProgressView(db, record);
    });
  });
}