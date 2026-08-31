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

import { isSupervisionOverdue } from '../domain/rules';
import type { Database } from './store';
import { read } from './store';
import { request } from './transport';
import { requireRole } from './session';

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

import { apiFetch } from './apiClient';

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

export function studentAnalytics(): Promise<StudentAnalytics> {
  return request(() => {
    const actor = requireRole('STUDENT');
    return read((db) => {
      const mine = db.applications.filter((a) => a.studentId === actor.profileId);
      const byStatus = new Map<string, number>();
      mine.forEach((a) => byStatus.set(a.status, (byStatus.get(a.status) ?? 0) + 1));
      const docs = db.documents.filter((d) => d.ownerId === actor.profileId);
      return {
        applicationStatus: Array.from(byStatus, ([name, value]) => ({ name, value })),
        totalApplications: mine.length,
        pendingApplications: mine.filter((a) =>
        ['SUBMITTED', 'UNDER_COMPANY_REVIEW', 'COMPANY_ACCEPTED', 'UNIVERSITY_REVIEW'].includes(
          a.status
        )
        ).length,
        acceptedApplications: mine.filter((a) =>
        ['COMPANY_ACCEPTED', 'UNIVERSITY_REVIEW', 'UNIVERSITY_APPROVED'].includes(a.status)
        ).length,
        documentsPending: docs.filter((d) => d.status === 'PENDING').length,
        documentsRejected: docs.filter((d) => d.status === 'REJECTED').length
      };
    });
  });
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

export function companyAnalytics(): Promise<CompanyAnalytics> {
  return request(() => {
    const actor = requireRole('COMPANY');
    return read((db) => {
      const opps = db.opportunities.filter((o) => o.companyId === actor.profileId);
      const apps = db.applications.filter((a) => a.companyId === actor.profileId);
      const placements = db.placements.filter((p) => p.companyId === actor.profileId);
      return {
        activeOpportunities: opps.filter((o) => o.status === 'PUBLISHED').length,
        totalApplicants: apps.length,
        pendingReviews: apps.filter((a) =>
        ['SUBMITTED', 'UNDER_COMPANY_REVIEW'].includes(a.status)
        ).length,
        acceptedStudents: apps.filter((a) =>
        ['UNIVERSITY_REVIEW', 'UNIVERSITY_APPROVED'].includes(a.status)
        ).length,
        activeInterns: placements.filter((p) => p.status === 'ACTIVE').length,
        completedInternships: placements.filter((p) => p.status === 'COMPLETED').length,
        applicationsPerOpportunity: opps.
        filter((o) => o.status !== 'DRAFT').
        map((o) => ({
          name: o.title.replace(/ Attachment.*/, ''),
          value: apps.filter((a) => a.opportunityId === o.id).length
        })),
        decisionSplit: [
        {
          name: 'Accepted',
          value: apps.filter((a) =>
          ['UNIVERSITY_REVIEW', 'UNIVERSITY_APPROVED'].includes(a.status)
          ).length
        },
        { name: 'Declined', value: apps.filter((a) => a.status === 'COMPANY_REJECTED').length },
        {
          name: 'Awaiting review',
          value: apps.filter((a) => ['SUBMITTED', 'UNDER_COMPANY_REVIEW'].includes(a.status)).length
        }]

      };
    });
  });
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

export function supervisorAnalytics(): Promise<SupervisorAnalytics> {
  return request(() => {
    const actor = requireRole('SUPERVISOR');
    return read((db) => {
      const mine = db.placements.filter((p) => p.academicSupervisorId === actor.profileId);
      const active = mine.filter((p) => p.status === 'ACTIVE');
      const overdue = active.filter((p) => isSupervisionOverdue(p, lastSupervision(db, p.id)));
      const noSupervisionYet = active.filter((p) => !lastSupervision(db, p.id));
      return {
        assignedStudents: mine.filter((p) => p.status !== 'CANCELLED').length,
        activePlacements: active.length,
        upcomingPlacements: mine.filter((p) => p.status === 'UPCOMING').length,
        completedPlacements: mine.filter((p) => p.status === 'COMPLETED').length,
        requiringSupervision: new Set([...overdue, ...noSupervisionYet].map((p) => p.id)).size,
        overdueSupervision: overdue.length,
        pendingEvaluations: active.filter(
          (p) => !db.evaluations.some((e) => e.placementId === p.id && e.locked)
        ).length,
        progressReportsAwaitingFeedback: db.progressReports.filter(
          (r) => mine.some((p) => p.id === r.placementId) && !r.supervisorFeedback
        ).length
      };
    });
  });
}