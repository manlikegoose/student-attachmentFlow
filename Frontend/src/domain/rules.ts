/**
 * AttachHub — the single source of truth for workflow rules.
 *
 * Every state transition and business rule in the product is declared here and nowhere
 * else. UI components ask this module what is permitted; they never re-derive it.
 *
 * IMPORTANT: front-end enforcement is a user-experience guarantee, NOT a security
 * boundary. Each exported rule below must be re-implemented server-side as a DRF
 * permission class or serializer validation. See docs/domain-rules.md for the
 * backend checklist, which is generated from this file's contents.
 */

import type {
  ApplicationStatus,
  DocumentType,
  OpportunityStatus,
  PlacementStatus,
  Rating,
  UserRole } from
'../types/enums';
import { REQUIRED_STUDENT_DOCUMENTS } from '../types/enums';
import type {
  Application,
  CompanyProfile,
  DocumentRecord,
  EvaluationScores,
  Opportunity,
  Placement,
  SupervisorProfile } from
'../types/models';

/* ------------------------------------------------------------------ *
 * Transition maps — arbitrary status changes are impossible by design
 * ------------------------------------------------------------------ */

export const APPLICATION_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  SUBMITTED: ['UNDER_COMPANY_REVIEW', 'WITHDRAWN'],
  UNDER_COMPANY_REVIEW: ['COMPANY_ACCEPTED', 'COMPANY_REJECTED', 'WITHDRAWN'],
  COMPANY_ACCEPTED: ['UNIVERSITY_REVIEW', 'WITHDRAWN'],
  UNIVERSITY_REVIEW: ['UNIVERSITY_APPROVED', 'UNIVERSITY_REJECTED', 'WITHDRAWN'],
  COMPANY_REJECTED: [],
  UNIVERSITY_APPROVED: [],
  UNIVERSITY_REJECTED: [],
  WITHDRAWN: []
};

export const PLACEMENT_TRANSITIONS: Record<PlacementStatus, PlacementStatus[]> = {
  PENDING: ['APPROVED', 'CANCELLED'],
  APPROVED: ['UPCOMING', 'ACTIVE', 'CANCELLED'],
  UPCOMING: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: []
};

export const OPPORTUNITY_TRANSITIONS: Record<OpportunityStatus, OpportunityStatus[]> = {
  DRAFT: ['PENDING_APPROVAL', 'CANCELLED'],
  PENDING_APPROVAL: ['PUBLISHED', 'DRAFT', 'CANCELLED'],
  PUBLISHED: ['CLOSED', 'CANCELLED'],
  CLOSED: ['PUBLISHED', 'CANCELLED'],
  CANCELLED: []
};

export function canTransitionApplication(from: ApplicationStatus, to: ApplicationStatus) {
  return APPLICATION_TRANSITIONS[from].includes(to);
}
export function canTransitionPlacement(from: PlacementStatus, to: PlacementStatus) {
  return PLACEMENT_TRANSITIONS[from].includes(to);
}
export function canTransitionOpportunity(from: OpportunityStatus, to: OpportunityStatus) {
  return OPPORTUNITY_TRANSITIONS[from].includes(to);
}

/** Application states that still occupy the student's "one active application" slot. */
export const ACTIVE_APPLICATION_STATUSES: ApplicationStatus[] = [
'SUBMITTED',
'UNDER_COMPANY_REVIEW',
'COMPANY_ACCEPTED',
'UNIVERSITY_REVIEW'];


export const TERMINAL_APPLICATION_STATUSES: ApplicationStatus[] = [
'COMPANY_REJECTED',
'UNIVERSITY_REJECTED',
'UNIVERSITY_APPROVED',
'WITHDRAWN'];


/* ------------------------------------------------------------------ *
 * Rule results
 * ------------------------------------------------------------------ */

export interface RuleResult {
  allowed: boolean;
  reason?: string;
}
const ok: RuleResult = { allowed: true };
const no = (reason: string): RuleResult => ({ allowed: false, reason });

/* ------------------------------------------------------------------ *
 * Rule 1 — unverified companies cannot publish opportunities
 * ------------------------------------------------------------------ */

export function canPublishOpportunity(company: CompanyProfile): RuleResult {
  if (company.verificationStatus !== 'VERIFIED') {
    return no(
      'Your company must be verified by the university before opportunities can be published.'
    );
  }
  return ok;
}

/* ------------------------------------------------------------------ *
 * Rules 2 & 3 — opportunity must be open; no duplicate active application
 * ------------------------------------------------------------------ */

export function isOpportunityOpen(opportunity: Opportunity, today = new Date()): RuleResult {
  if (opportunity.status !== 'PUBLISHED') {
    return no('This opportunity is not currently open for applications.');
  }
  if (new Date(opportunity.applicationDeadline) < startOfDay(today)) {
    return no('The application deadline for this opportunity has passed.');
  }
  if (opportunity.slotsFilled >= opportunity.slots) {
    return no('All slots for this opportunity have been filled.');
  }
  return ok;
}

export function canApply(
opportunity: Opportunity,
studentApplications: Application[],
today = new Date())
: RuleResult {
  const open = isOpportunityOpen(opportunity, today);
  if (!open.allowed) return open;

  const duplicate = studentApplications.find(
    (a) => a.opportunityId === opportunity.id && ACTIVE_APPLICATION_STATUSES.includes(a.status)
  );
  if (duplicate) {
    return no('You already have an active application for this opportunity.');
  }

  const placed = studentApplications.find((a) => a.status === 'UNIVERSITY_APPROVED');
  if (placed) {
    return no('You already hold an approved placement for this attachment period.');
  }
  return ok;
}

/* ------------------------------------------------------------------ *
 * Rules 4, 5, 6, 7 — review stage authority
 * ------------------------------------------------------------------ */

export function canCompanyDecide(application: Application, role: UserRole): RuleResult {
  if (role !== 'COMPANY') return no('Only the host company can make this decision.');
  if (!['SUBMITTED', 'UNDER_COMPANY_REVIEW'].includes(application.status)) {
    return no('This application is no longer at the company review stage.');
  }
  return ok;
}

export function canUniversityDecide(application: Application, role: UserRole): RuleResult {
  if (role !== 'COORDINATOR') return no('Only a university coordinator can approve placements.');
  if (application.status !== 'UNIVERSITY_REVIEW') {
    return no('This application is not awaiting university review.');
  }
  return ok;
}

/* ------------------------------------------------------------------ *
 * Rule 12 — required documents approved before university approval
 * ------------------------------------------------------------------ */

export interface DocumentReadiness {
  ready: boolean;
  missing: DocumentType[];
  unapproved: DocumentType[];
}

export function checkRequiredDocuments(documents: DocumentRecord[]): DocumentReadiness {
  const missing: DocumentType[] = [];
  const unapproved: DocumentType[] = [];
  for (const required of REQUIRED_STUDENT_DOCUMENTS) {
    const match = documents.filter((d) => d.type === required);
    if (match.length === 0) {
      missing.push(required);
    } else if (!match.some((d) => d.status === 'APPROVED')) {
      unapproved.push(required);
    }
  }
  return { ready: missing.length === 0 && unapproved.length === 0, missing, unapproved };
}

/* ------------------------------------------------------------------ *
 * Rule 8 — only coordinators assign supervisors; capacity is advisory
 * ------------------------------------------------------------------ */

export interface WorkloadInfo {
  supervisorId: string;
  assigned: number;
  capacity: number;
  atCapacity: boolean;
  overCapacity: boolean;
}

export function supervisorWorkload(
supervisor: SupervisorProfile,
placements: Placement[])
: WorkloadInfo {
  const assigned = placements.filter(
    (p) =>
    p.academicSupervisorId === supervisor.id &&
    ['APPROVED', 'UPCOMING', 'ACTIVE'].includes(p.status)
  ).length;
  return {
    supervisorId: supervisor.id,
    assigned,
    capacity: supervisor.capacity,
    atCapacity: assigned >= supervisor.capacity,
    overCapacity: assigned > supervisor.capacity
  };
}

export function canAssignSupervisor(role: UserRole, placement: Placement): RuleResult {
  if (role !== 'COORDINATOR') return no('Only a university coordinator can assign supervisors.');
  if (!['PENDING', 'APPROVED', 'UPCOMING', 'ACTIVE'].includes(placement.status)) {
    return no('Supervisors can only be assigned to an open placement.');
  }
  return ok;
}

/* ------------------------------------------------------------------ *
 * Rules 9, 10, 11 — object-level access
 * ------------------------------------------------------------------ */

export interface Actor {
  role: UserRole;
  /** Profile id for the actor's role — student, company, supervisor or coordinator id. */
  profileId: string;
}

export function canViewPlacement(actor: Actor, placement: Placement): boolean {
  switch (actor.role) {
    case 'STUDENT':
      return placement.studentId === actor.profileId;
    case 'COMPANY':
      return placement.companyId === actor.profileId;
    case 'SUPERVISOR':
      return placement.academicSupervisorId === actor.profileId;
    case 'COORDINATOR':
    case 'ADMIN':
      return true;
    default:
      return false;
  }
}

export function canViewDocument(
actor: Actor,
document: DocumentRecord,
linkedApplications: Application[],
linkedPlacements: Placement[])
: boolean {
  if (actor.role === 'COORDINATOR' || actor.role === 'ADMIN') return true;
  if (document.ownerId === actor.profileId) return true;
  if (actor.role === 'COMPANY') {
    // A company may read documents attached to an application addressed to it.
    return linkedApplications.some(
      (a) => a.companyId === actor.profileId && a.documentIds.includes(document.id)
    );
  }
  if (actor.role === 'SUPERVISOR') {
    return linkedPlacements.some(
      (p) => p.academicSupervisorId === actor.profileId && p.studentId === document.ownerId
    );
  }
  return false;
}

/* ------------------------------------------------------------------ *
 * Rules 13, 14 — immutability of completed work
 * ------------------------------------------------------------------ */

export function canEditSupervisionReport(
report: {submitted: boolean;supervisorId: string;},
actor: Actor)
: RuleResult {
  if (actor.role === 'COORDINATOR') return ok;
  if (actor.role !== 'SUPERVISOR' || report.supervisorId !== actor.profileId) {
    return no('Only the authoring supervisor can edit this report.');
  }
  if (report.submitted) {
    return no('This report has been submitted and is locked. Ask a coordinator to reopen it.');
  }
  return ok;
}

export function canEditEvaluation(
evaluation: {locked: boolean;evaluatorId: string;},
actor: Actor)
: RuleResult {
  if (evaluation.locked && actor.role !== 'COORDINATOR') {
    return no('This evaluation is locked. Only a coordinator can reopen it.');
  }
  if (
  !evaluation.locked &&
  actor.role !== 'COORDINATOR' &&
  evaluation.evaluatorId !== actor.profileId)
  {
    return no('Only the assigned evaluator can complete this evaluation.');
  }
  return ok;
}

export function canCompletePlacement(placement: Placement, hasEvaluation: boolean): RuleResult {
  if (placement.status !== 'ACTIVE') {
    return no('Only an active placement can be completed.');
  }
  if (!hasEvaluation) {
    return no('A submitted final evaluation is required before completion.');
  }
  return ok;
}

/* ------------------------------------------------------------------ *
 * Derived values
 * ------------------------------------------------------------------ */

export function computeFinalScore(scores: EvaluationScores): number {
  const values = Object.values(scores) as Rating[];
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.round(mean * 10) / 10;
}

export function recommendationForScore(score: number) {
  if (score >= 4.5) return 'HIGHLY_RECOMMENDED' as const;
  if (score >= 3.5) return 'RECOMMENDED' as const;
  if (score >= 2.5) return 'RECOMMENDED_WITH_RESERVATION' as const;
  return 'NOT_RECOMMENDED' as const;
}

/** Supervision is expected at least once every 30 days on an active placement. */
export const SUPERVISION_INTERVAL_DAYS = 30;

export function isSupervisionOverdue(
placement: Placement,
lastReportDate: string | null,
today = new Date())
: boolean {
  if (placement.status !== 'ACTIVE') return false;
  const reference = lastReportDate ? new Date(lastReportDate) : new Date(placement.startDate);
  const days = (startOfDay(today).getTime() - startOfDay(reference).getTime()) / 86_400_000;
  return days > SUPERVISION_INTERVAL_DAYS;
}

/* ------------------------------------------------------------------ *
 * The student-facing 10-step lifecycle, derived — never stored
 * ------------------------------------------------------------------ */

export type TimelineState = 'complete' | 'current' | 'upcoming' | 'blocked';

export interface TimelineStep {
  key: string;
  label: string;
  state: TimelineState;
  detail?: string;
}

export function buildLifecycleTimeline(
application: Application | null,
placement: Placement | null,
hasSupervision: boolean,
hasEvaluation: boolean)
: TimelineStep[] {
  const s = application?.status;
  const p = placement?.status;

  const reached = (test: boolean, current: boolean, detail?: string): TimelineStep['state'] =>
  test ? 'complete' : current ? 'current' : 'upcoming';

  const companyReviewed = !!s && s !== 'SUBMITTED';
  const companyAccepted = !!s && ['COMPANY_ACCEPTED', 'UNIVERSITY_REVIEW', 'UNIVERSITY_APPROVED'].includes(s);
  const universityReviewed = !!s && ['UNIVERSITY_REVIEW', 'UNIVERSITY_APPROVED', 'UNIVERSITY_REJECTED'].includes(s);
  const universityApproved = s === 'UNIVERSITY_APPROVED';
  const supervisorAssigned = !!placement?.academicSupervisorId;
  const started = !!p && ['ACTIVE', 'COMPLETED'].includes(p);
  const completed = p === 'COMPLETED';

  const rejected = !!s && ['COMPANY_REJECTED', 'UNIVERSITY_REJECTED', 'WITHDRAWN'].includes(s);

  const steps: TimelineStep[] = [
  { key: 'submitted', label: 'Application submitted', state: application ? 'complete' : 'upcoming' },
  { key: 'company_review', label: 'Company reviewed', state: reached(companyReviewed, s === 'SUBMITTED' || s === 'UNDER_COMPANY_REVIEW') },
  { key: 'company_accept', label: 'Company accepted', state: reached(companyAccepted, s === 'UNDER_COMPANY_REVIEW') },
  { key: 'uni_review', label: 'University reviewed', state: reached(universityReviewed, s === 'COMPANY_ACCEPTED') },
  { key: 'uni_approve', label: 'University approved', state: reached(universityApproved, s === 'UNIVERSITY_REVIEW') },
  { key: 'supervisor', label: 'Supervisor assigned', state: reached(supervisorAssigned, universityApproved && !supervisorAssigned) },
  { key: 'started', label: 'Attachment started', state: reached(started, supervisorAssigned && !started) },
  { key: 'in_progress', label: 'Supervision in progress', state: reached(hasSupervision, started && !hasSupervision) },
  { key: 'evaluation', label: 'Final evaluation', state: reached(hasEvaluation, hasSupervision && !hasEvaluation) },
  { key: 'completed', label: 'Completed', state: reached(completed, hasEvaluation && !completed) }];


  if (rejected) {
    const idx = steps.findIndex((st) => st.state !== 'complete');
    for (let i = Math.max(idx, 0); i < steps.length; i += 1) {
      steps[i] = { ...steps[i], state: 'blocked' };
    }
    if (idx >= 0) {
      steps[idx] = {
        ...steps[idx],
        detail: s === 'WITHDRAWN' ? 'Application withdrawn' : 'Application did not proceed'
      };
    }
  }
  return steps;
}

/* ------------------------------------------------------------------ *
 * helpers
 * ------------------------------------------------------------------ */

export function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Profile completion, expressed as the checklist the student actually sees. */
export function profileCompletion(
profile: {
  phone?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
  bio?: string | null;
  skills: string[];
  department: string;
  programme: string;
},
documents: DocumentRecord[])
: {percent: number;items: {label: string;done: boolean;}[];} {
  const items = [
  { label: 'Contact details', done: !!profile.phone && !!profile.address },
  { label: 'Date of birth', done: !!profile.dateOfBirth },
  { label: 'Academic details', done: !!profile.department && !!profile.programme },
  { label: 'Professional summary', done: !!profile.bio && profile.bio.length > 40 },
  { label: 'At least three skills', done: (profile.skills?.length || 0) >= 3 },
  { label: 'CV uploaded', done: documents.some((d) => d.type === 'CV') },
  {
    label: 'Introduction letter uploaded',
    done: documents.some((d) => d.type === 'INTRODUCTION_LETTER')
  },
  { label: 'Insurance uploaded', done: documents.some((d) => d.type === 'INSURANCE') }];

  const done = items.filter((i) => i.done).length;
  return { percent: Math.round(done / items.length * 100), items };
}