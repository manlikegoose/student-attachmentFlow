import { apiFetch } from './apiClient';
import { badRequest, forbidden, notFound, ApiError } from '../types/api';
import type { PageQuery, Paginated } from '../types/api';
import type { ProgressReport, SupervisionReport } from '../types/models';
import type { ProgressReportView, SupervisionReportView } from '../types/views';

async function handleResponse(res: Response) {
  if (res.ok) {
    if (res.status === 204) return null;
    return await res.json();
  }
  const data = await res.json().catch(() => null);
  if (res.status === 400) throw badRequest(data || { detail: ['Invalid request'] });
  if (res.status === 401 || res.status === 403) throw forbidden(data?.detail || 'Unauthorized');
  if (res.status === 404) throw notFound(data?.detail || 'Not found');
  throw new ApiError(res.status, data || { detail: 'Server error', code: 'server_error' });
}

export interface SupervisionQuery extends PageQuery {
  placementId?: string;
  supervisorId?: string;
  studentId?: string;
}

export async function listSupervisionReports(query: SupervisionQuery = {}): Promise<Paginated<SupervisionReportView>> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value.toString());
    }
  });

  const res = await apiFetch(`/supervision/reports/?${params.toString()}`);
  const data = await handleResponse(res);
  
  if (Array.isArray(data)) {
    return {
      results: data,
      totalCount: data.length,
      page: query.page || 1,
      pageSize: query.pageSize || 10,
      totalPages: Math.ceil(data.length / (query.pageSize || 10))
    };
  }
  return data;
}

export async function getSupervisionReport(id: string): Promise<SupervisionReportView> {
  const res = await apiFetch(`/supervision/reports/${id}/`);
  return await handleResponse(res);
}

export type SupervisionInput = Pick<SupervisionReport, 'date' | 'type' | 'rating' | 'notes'>;

export async function createSupervisionReport(
  placementId: string,
  input: SupervisionInput,
  submit: boolean
): Promise<SupervisionReportView> {
  const payload = { ...input, placementId, submit };
  const res = await apiFetch(`/supervision/reports/`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return await handleResponse(res);
}

export async function updateSupervisionReport(
  id: string,
  input: SupervisionInput,
  submit: boolean
): Promise<SupervisionReportView> {
  const payload = { ...input, submit };
  const res = await apiFetch(`/supervision/reports/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  return await handleResponse(res);
}

export async function reopenSupervisionReport(id: string, reason: string): Promise<SupervisionReportView> {
  const res = await apiFetch(`/supervision/reports/${id}/reopen/`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
  return await handleResponse(res);
}

/* --------------------------- progress reports --------------------------- */

export interface ProgressQuery extends PageQuery {
  placementId?: string;
  studentId?: string;
  awaitingFeedback?: boolean;
}

export async function listProgressReports(query: ProgressQuery = {}): Promise<Paginated<ProgressReportView>> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value.toString());
    }
  });

  const res = await apiFetch(`/supervision/progress/?${params.toString()}`);
  const data = await handleResponse(res);
  
  if (Array.isArray(data)) {
    return {
      results: data,
      totalCount: data.length,
      page: query.page || 1,
      pageSize: query.pageSize || 10,
      totalPages: Math.ceil(data.length / (query.pageSize || 10))
    };
  }
  return data;
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

export async function createProgressReport(input: ProgressInput): Promise<ProgressReportView> {
  const res = await apiFetch(`/supervision/progress/`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
  return await handleResponse(res);
}

export async function giveProgressFeedback(id: string, feedback: string): Promise<ProgressReportView> {
  const res = await apiFetch(`/supervision/progress/${id}/feedback/`, {
    method: 'POST',
    body: JSON.stringify({ feedback })
  });
  return await handleResponse(res);
}