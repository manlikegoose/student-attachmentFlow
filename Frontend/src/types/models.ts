/**
 * AttachHub — domain entities.
 *
 * PROVISIONAL MODELS. Field names and relationships follow the product brief and are
 * expected to be reconciled with the approved ERD before backend implementation.
 * Everything downstream (services, UI) reads these types, so the reconciliation is a
 * contained edit within `types/`.
 *
 * Relationships are expressed as string ids (matching DRF primary keys) plus optional
 * denormalised display fields that a serializer would supply as read-only nested data.
 */

import type {
  ApplicationStatus,
  AuditAction,
  CompanyVerificationStatus,
  DocumentStatus,
  DocumentType,
  EvaluationRecommendation,
  NotificationType,
  OpportunityStatus,
  PlacementStatus,
  Rating,
  SupervisionType,
  UserRole,
  WorkMode } from
'./enums';

export type ID = string;
/** ISO-8601 date (YYYY-MM-DD) or datetime string, as DRF serializes them. */
export type ISODate = string;

export interface User {
  id: ID;
  email: string;
  phone: string;
  role: UserRole;
  fullName: string;
  avatarUrl?: string | null;
  isActive: boolean;
  dateJoined: ISODate;
  lastLogin?: ISODate | null;
}

export interface StudentProfile {
  id: ID;
  userId: ID;
  // personal
  fullName: string;
  email: string;
  phone: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  dateOfBirth?: ISODate | null;
  address?: string | null;
  // academic
  studentNumber: string;
  university: string;
  faculty: string;
  department: string;
  programme: string;
  yearOfStudy: number;
  expectedGraduation: ISODate;
  // profile
  bio?: string | null;
  skills: string[];
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface CompanyProfile {
  id: ID;
  userId: ID;
  name: string;
  email: string;
  phone: string;
  industry: string;
  location: string;
  town: string;
  website?: string | null;
  registrationNumber?: string | null;
  description: string;
  logoText: string;
  verificationStatus: CompanyVerificationStatus;
  verifiedAt?: ISODate | null;
  verifiedById?: ID | null;
  verificationNotes?: string | null;
  createdAt: ISODate;
}

/** A company-side mentor. Not a system user in the MVP — managed by the company. */
export interface WorkplaceSupervisor {
  id: ID;
  companyId: ID;
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  department: string;
}

export interface SupervisorProfile {
  id: ID;
  userId: ID;
  fullName: string;
  email: string;
  phone: string;
  staffNumber: string;
  department: string;
  faculty: string;
  title: string;
  /** Recommended maximum number of concurrent students. Assignment past this warns. */
  capacity: number;
}

export interface CoordinatorProfile {
  id: ID;
  userId: ID;
  fullName: string;
  email: string;
  phone: string;
  staffNumber: string;
  department: string;
  title: string;
}

export interface Opportunity {
  id: ID;
  title: string;
  description: string;
  companyId: ID;
  department: string;
  industry: string;
  location: string;
  town: string;
  workMode: WorkMode;
  startDate: ISODate;
  endDate: ISODate;
  /** Duration in weeks — derived at creation, stored for filterability. */
  durationWeeks: number;
  slots: number;
  slotsFilled: number;
  applicationDeadline: ISODate;
  requirements: string[];
  preferredSkills: string[];
  responsibilities: string[];
  status: OpportunityStatus;
  createdAt: ISODate;
  publishedAt?: ISODate | null;
  approvedById?: ID | null;
  reviewNote?: string | null;
}

export interface Application {
  id: ID;
  studentId: ID;
  opportunityId: ID;
  companyId: ID;
  status: ApplicationStatus;
  coverLetter: string;
  documentIds: ID[];
  submittedAt: ISODate;
  updatedAt: ISODate;
  // company stage
  companyDecisionById?: ID | null;
  companyDecisionAt?: ISODate | null;
  companyDecisionReason?: string | null;
  // university stage
  universityDecisionById?: ID | null;
  universityDecisionAt?: ISODate | null;
  universityDecisionReason?: string | null;
  /** Set when a coordinator sends the application back for revision. */
  revisionRequested?: boolean;
}

export interface Placement {
  id: ID;
  applicationId: ID;
  studentId: ID;
  companyId: ID;
  opportunityId: ID;
  startDate: ISODate;
  endDate: ISODate;
  workplaceSupervisorId?: ID | null;
  academicSupervisorId?: ID | null;
  status: PlacementStatus;
  approvedAt?: ISODate | null;
  approvedById?: ID | null;
  supervisorAssignedAt?: ISODate | null;
  completedAt?: ISODate | null;
  createdAt: ISODate;
}

export interface DocumentRecord {
  id: ID;
  ownerId: ID;
  ownerRole: UserRole;
  type: DocumentType;
  /** Original filename as uploaded. */
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: ISODate;
  status: DocumentStatus;
  reviewedById?: ID | null;
  reviewedAt?: ISODate | null;
  reviewComment?: string | null;
  /**
   * Local object URL in this build. In production this becomes a signed URL issued by
   * the API after an authorization check — never a public static path.
   */
  previewUrl?: string | null;
}

export interface SupervisionReport {
  id: ID;
  placementId: ID;
  studentId: ID;
  supervisorId: ID;
  date: ISODate;
  type: SupervisionType;
  studentPresent: boolean;
  progressSummary: string;
  technicalProgress: string;
  challenges: string;
  strengths: string;
  areasForImprovement: string;
  recommendations: string;
  supervisorComments: string;
  /** Immutable once true; only a coordinator may reopen. */
  submitted: boolean;
  submittedAt?: ISODate | null;
  createdAt: ISODate;
}

export interface ProgressReport {
  id: ID;
  placementId: ID;
  studentId: ID;
  periodStart: ISODate;
  periodEnd: ISODate;
  activitiesCompleted: string;
  skillsLearned: string;
  challenges: string;
  achievements: string;
  nextGoals: string;
  submittedAt: ISODate;
  reviewedById?: ID | null;
  reviewedAt?: ISODate | null;
  supervisorFeedback?: string | null;
}

export interface EvaluationScores {
  technicalSkills: Rating;
  communication: Rating;
  teamwork: Rating;
  professionalism: Rating;
  punctuality: Rating;
  problemSolving: Rating;
  adaptability: Rating;
  overallPerformance: Rating;
}

export interface Evaluation {
  id: ID;
  placementId: ID;
  studentId: ID;
  evaluatorId: ID;
  evaluatorRole: Extract<UserRole, 'SUPERVISOR' | 'COMPANY'>;
  scores: EvaluationScores;
  strengths: string;
  weaknesses: string;
  recommendations: string;
  overallComments: string;
  /** Mean of the eight rubric scores, 0–5, one decimal. Derived, stored for reporting. */
  finalScore: number;
  recommendation: EvaluationRecommendation;
  locked: boolean;
  submittedAt?: ISODate | null;
  createdAt: ISODate;
}

export interface Notification {
  id: ID;
  userId: ID;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: ISODate;
  /** In-app deep link to the related object. */
  link?: string | null;
}

export interface AuditLogEntry {
  id: ID;
  actorId: ID;
  actorName: string;
  actorRole: UserRole;
  action: AuditAction;
  objectType: string;
  objectId: ID;
  objectLabel: string;
  createdAt: ISODate;
  metadata?: Record<string, string | number | boolean | null>;
}

/** Credentials record. Passwords are never stored like this server-side — see docs. */
export interface AccountCredential {
  userId: ID;
  email: string;
  password: string;
}