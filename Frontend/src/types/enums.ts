/**
 * AttachHub — domain enumerations.
 *
 * PROVISIONAL: these values mirror the field vocabulary agreed in the product brief.
 * They are the single source of truth for the front end and are intended to be
 * mirrored exactly by Django `TextChoices` once the approved ERD lands.
 * Aligning to the final ERD should only ever require editing this directory.
 */

export const USER_ROLES = ['STUDENT', 'COMPANY', 'COORDINATOR', 'SUPERVISOR', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const OPPORTUNITY_STATUSES = [
'DRAFT',
'PENDING_APPROVAL',
'PUBLISHED',
'CLOSED',
'CANCELLED'] as
const;
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export const APPLICATION_STATUSES = [
'SUBMITTED',
'UNDER_COMPANY_REVIEW',
'COMPANY_ACCEPTED',
'COMPANY_REJECTED',
'UNIVERSITY_REVIEW',
'UNIVERSITY_APPROVED',
'UNIVERSITY_REJECTED',
'WITHDRAWN'] as
const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const PLACEMENT_STATUSES = [
'PENDING',
'APPROVED',
'UPCOMING',
'ACTIVE',
'COMPLETED',
'CANCELLED'] as
const;
export type PlacementStatus = (typeof PLACEMENT_STATUSES)[number];

export const COMPANY_VERIFICATION_STATUSES = [
'REGISTERED',
'PENDING_VERIFICATION',
'VERIFIED',
'REJECTED'] as
const;
export type CompanyVerificationStatus = (typeof COMPANY_VERIFICATION_STATUSES)[number];

export const DOCUMENT_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const DOCUMENT_TYPES = [
'CV',
'INTRODUCTION_LETTER',
'INSURANCE',
'ACADEMIC_TRANSCRIPT',
'ACCEPTANCE_LETTER',
'COMPANY_REGISTRATION',
'OTHER'] as
const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/** Documents a coordinator must see APPROVED before granting university approval. */
export const REQUIRED_STUDENT_DOCUMENTS: DocumentType[] = [
'CV',
'INTRODUCTION_LETTER',
'INSURANCE'];


export const WORK_MODES = ['ONSITE', 'HYBRID', 'REMOTE'] as const;
export type WorkMode = (typeof WORK_MODES)[number];

export const SUPERVISION_TYPES = [
'PHYSICAL_VISIT',
'VIRTUAL_MEETING',
'PHONE_CALL',
'OTHER'] as
const;
export type SupervisionType = (typeof SUPERVISION_TYPES)[number];

export const NOTIFICATION_TYPES = [
'APPLICATION',
'PLACEMENT',
'DOCUMENT',
'SUPERVISION',
'EVALUATION',
'COMPANY',
'SYSTEM'] as
const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const AUDIT_ACTIONS = [
'COMPANY_VERIFIED',
'COMPANY_REJECTED',
'OPPORTUNITY_APPROVED',
'OPPORTUNITY_REJECTED',
'OPPORTUNITY_PUBLISHED',
'APPLICATION_SUBMITTED',
'APPLICATION_ACCEPTED',
'APPLICATION_REJECTED',
'APPLICATION_WITHDRAWN',
'PLACEMENT_APPROVED',
'PLACEMENT_REJECTED',
'PLACEMENT_COMPLETED',
'SUPERVISOR_ASSIGNED',
'DOCUMENT_APPROVED',
'DOCUMENT_REJECTED',
'SUPERVISION_SUBMITTED',
'EVALUATION_SUBMITTED',
'EVALUATION_REOPENED'] as
const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const RATING_SCALE = [1, 2, 3, 4, 5] as const;
export type Rating = (typeof RATING_SCALE)[number];

export const RATING_LABELS: Record<Rating, string> = {
  1: 'Poor',
  2: 'Needs Improvement',
  3: 'Satisfactory',
  4: 'Good',
  5: 'Excellent'
};

export const EVALUATION_RECOMMENDATIONS = [
'HIGHLY_RECOMMENDED',
'RECOMMENDED',
'RECOMMENDED_WITH_RESERVATION',
'NOT_RECOMMENDED'] as
const;
export type EvaluationRecommendation = (typeof EVALUATION_RECOMMENDATIONS)[number];

/** Human-readable labels. Kept beside the enums so UI never hand-writes a status string. */
export const LABELS: Record<string, string> = {
  // roles
  STUDENT: 'Student',
  COMPANY: 'Company',
  COORDINATOR: 'Coordinator',
  SUPERVISOR: 'Academic Supervisor',
  ADMIN: 'Administrator',
  // opportunity
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending approval',
  PUBLISHED: 'Published',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
  // application
  SUBMITTED: 'Submitted',
  UNDER_COMPANY_REVIEW: 'Under company review',
  COMPANY_ACCEPTED: 'Company accepted',
  COMPANY_REJECTED: 'Company rejected',
  UNIVERSITY_REVIEW: 'University review',
  UNIVERSITY_APPROVED: 'University approved',
  UNIVERSITY_REJECTED: 'University rejected',
  WITHDRAWN: 'Withdrawn',
  // placement
  PENDING: 'Pending',
  APPROVED: 'Approved',
  UPCOMING: 'Upcoming',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  // company verification
  REGISTERED: 'Registered',
  PENDING_VERIFICATION: 'Pending verification',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
  // documents
  CV: 'Curriculum Vitae',
  INTRODUCTION_LETTER: 'Introduction letter',
  INSURANCE: 'Insurance cover',
  ACADEMIC_TRANSCRIPT: 'Academic transcript',
  ACCEPTANCE_LETTER: 'Acceptance letter',
  COMPANY_REGISTRATION: 'Company registration',
  OTHER: 'Other',
  // work mode
  ONSITE: 'On-site',
  HYBRID: 'Hybrid',
  REMOTE: 'Remote',
  // supervision
  PHYSICAL_VISIT: 'Physical visit',
  VIRTUAL_MEETING: 'Virtual meeting',
  PHONE_CALL: 'Phone call',
  // evaluation
  HIGHLY_RECOMMENDED: 'Highly recommended',
  RECOMMENDED: 'Recommended',
  RECOMMENDED_WITH_RESERVATION: 'Recommended with reservation',
  NOT_RECOMMENDED: 'Not recommended'
};

export function label(value: string | null | undefined): string {
  if (!value) return '—';
  return LABELS[value] ?? value.replace(/_/g, ' ').toLowerCase();
}