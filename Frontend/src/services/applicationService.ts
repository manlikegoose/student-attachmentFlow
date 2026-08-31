import { apiFetch } from './apiClient';
import { badRequest, forbidden, notFound, ApiError } from '../types/api';
import type { PageQuery, Paginated } from '../types/api';
import type { ApplicationStatus } from '../types/enums';
import type { ApplicationView } from '../types/views';

export interface ApplicationQuery extends PageQuery {
  search?: string;
  status?: ApplicationStatus;
  opportunityId?: string;
  studentId?: string;
  companyId?: string;
  awaitingUniversityReview?: boolean;
}

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

export async function listApplications(query: ApplicationQuery = {}): Promise<Paginated<ApplicationView>> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value.toString());
    }
  });

  const res = await apiFetch(`/applications/?${params.toString()}`);
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

export async function getApplication(id: string): Promise<ApplicationView> {
  const res = await apiFetch(`/applications/${id}/`);
  return await handleResponse(res);
}

export interface ApplicationInput {
  opportunityId: string;
  coverLetter: string;
  documentIds: string[];
}

export async function createApplication(input: ApplicationInput): Promise<ApplicationView> {
  const res = await apiFetch(`/applications/`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
  return await handleResponse(res);
}

export async function withdrawApplication(id: string): Promise<ApplicationView> {
  const res = await apiFetch(`/applications/${id}/withdraw/`, { method: 'POST' });
  return await handleResponse(res);
}

export async function companyDecision(id: string, decision: 'ACCEPT' | 'REJECT', reason: string): Promise<ApplicationView> {
  const res = await apiFetch(`/applications/${id}/company-decision/`, {
    method: 'POST',
    body: JSON.stringify({ decision, reason })
  });
  return await handleResponse(res);
}

export async function universityDecision(id: string, decision: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION', reason: string): Promise<{ application: ApplicationView; placementId: string | null; }> {
  const res = await apiFetch(`/applications/${id}/university-decision/`, {
    method: 'POST',
    body: JSON.stringify({ decision, reason })
  });
  return await handleResponse(res);
}