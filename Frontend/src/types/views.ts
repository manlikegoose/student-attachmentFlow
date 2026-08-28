/**
 * Read models returned by the services.
 *
 * These mirror the nested read-only representations a DRF serializer would return
 * (e.g. `OpportunitySerializer` embedding a `CompanyBriefSerializer`), so components
 * never have to join records themselves.
 */

import type {
  Application,
  CompanyProfile,
  DocumentRecord,
  Evaluation,
  Opportunity,
  Placement,
  ProgressReport,
  StudentProfile,
  SupervisionReport,
  SupervisorProfile,
  WorkplaceSupervisor } from
'./models';

export interface CompanyBrief {
  id: string;
  name: string;
  logoText: string;
  industry: string;
  town: string;
  location: string;
  verificationStatus: CompanyProfile['verificationStatus'];
}

export interface StudentBrief {
  id: string;
  fullName: string;
  studentNumber: string;
  programme: string;
  department: string;
  yearOfStudy: number;
  email: string;
  phone: string;
}

export interface OpportunityView extends Opportunity {
  company: CompanyBrief;
  slotsRemaining: number;
  /** True when the opportunity is published, in date and has slots left. */
  isOpen: boolean;
  applicationCount: number;
}

export interface ApplicationView extends Application {
  student: StudentBrief;
  opportunity: Pick<Opportunity, 'id' | 'title' | 'startDate' | 'endDate' | 'town' | 'workMode' | 'department'>;
  company: CompanyBrief;
  documents: DocumentRecord[];
}

export interface PlacementView extends Placement {
  student: StudentBrief;
  company: CompanyBrief;
  opportunity: Pick<Opportunity, 'id' | 'title' | 'department' | 'workMode' | 'town'>;
  workplaceSupervisor: WorkplaceSupervisor | null;
  academicSupervisor: SupervisorProfile | null;
  supervisionCount: number;
  lastSupervisionDate: string | null;
  supervisionOverdue: boolean;
  evaluation: Evaluation | null;
  progressReportCount: number;
}

export interface SupervisionReportView extends SupervisionReport {
  student: StudentBrief;
  companyName: string;
}

export interface ProgressReportView extends ProgressReport {
  student: StudentBrief;
  companyName: string;
}

export interface SupervisorWorkloadView extends SupervisorProfile {
  assigned: number;
  atCapacity: boolean;
  overCapacity: boolean;
  activePlacements: number;
  completedPlacements: number;
  pendingEvaluations: number;
}

export interface StudentDirectoryView extends StudentProfile {
  applicationCount: number;
  placementStatus: Placement['status'] | null;
  companyName: string | null;
  documentsApproved: number;
  documentsTotal: number;
}

export interface CompanyDirectoryView extends CompanyProfile {
  opportunityCount: number;
  publishedOpportunityCount: number;
  applicantCount: number;
  activeInterns: number;
}