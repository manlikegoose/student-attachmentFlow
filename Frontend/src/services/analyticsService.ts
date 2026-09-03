/**
 * Analytics service. Every figure below answers a question a real user of that role
 * asks; nothing is computed purely to fill a chart.
 *
 * Endpoint map (future DRF):
 *   GET /api/analytics/coordinator/  → coordinatorAnalytics
 *   GET /api/analytics/student/      → studentAnalytics
 *   GET /api/analytics/company/      → companyAnalytics
 *   GET /api/analytics/supervisor/   → supervisorAnalytics
 */

import { apiFetch } from './apiClient';

export interface NamedCount {
  name: string;
  value: number;
}

export interface CoordinatorAnalytics {
  totals: {
    students: number;
    companies: number;
    verifiedCompanies: number;
    pendingVerification: number;
    activeOpportunities: number;
    applications: number;
    pendingApplications: number;
    approvedPlacements: number;
    activePlacements: number;
    completedPlacements: number;
    overdueSupervision: number;
  };
  queues: {
    companyVerification: number;
    opportunityApproval: number;
    universityReview: number;
    unassignedSupervisor: number;
    documentReview: number;
  };
  completionRate: number;
  applicationsByMonth: NamedCount[];
  placementsByProgramme: NamedCount[];
  placementStatus: NamedCount[];
  opportunitiesByIndustry: NamedCount[];
  companyParticipation: {name: string;opportunities: number;placements: number;}[];
}

export async function coordinatorAnalytics(): Promise<CoordinatorAnalytics> {
  const res = await apiFetch('/analytics/coordinator/');
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export interface StudentAnalytics {
  applicationStatus: NamedCount[];
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
  documentsPending: number;
  documentsRejected: number;
}

export async function studentAnalytics(): Promise<StudentAnalytics> {
  const res = await apiFetch('/analytics/student/');
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export interface CompanyAnalytics {
  activeOpportunities: number;
  totalApplicants: number;
  pendingReviews: number;
  acceptedStudents: number;
  activeInterns: number;
  completedInternships: number;
  applicationsPerOpportunity: NamedCount[];
  decisionSplit: NamedCount[];
}

export async function companyAnalytics(): Promise<CompanyAnalytics> {
  const res = await apiFetch('/analytics/company/');
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export interface SupervisorAnalytics {
  assignedStudents: number;
  activePlacements: number;
  upcomingPlacements: number;
  completedPlacements: number;
  requiringSupervision: number;
  overdueSupervision: number;
  pendingEvaluations: number;
  progressReportsAwaitingFeedback: number;
}

export async function supervisorAnalytics(): Promise<SupervisorAnalytics> {
  const res = await apiFetch('/analytics/supervisor/');
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}