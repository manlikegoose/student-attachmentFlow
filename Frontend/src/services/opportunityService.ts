import { apiFetch } from './apiClient';
import { badRequest, forbidden, notFound, ApiError } from '../types/api';
import type { PageQuery, Paginated } from '../types/api';
import type { OpportunityStatus, WorkMode } from '../types/enums';
import type { Opportunity } from '../types/models';
import type { OpportunityView } from '../types/views';

export interface OpportunityQuery extends PageQuery {
  search?: string;
  town?: string;
  industry?: string;
  skill?: string;
  workMode?: WorkMode;
  maxDurationWeeks?: number;
  deadlineBefore?: string;
  status?: OpportunityStatus;
  companyId?: string;
  includeAllStatuses?: boolean;
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

export async function listOpportunities(query: OpportunityQuery = {}): Promise<Paginated<OpportunityView>> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value.toString());
    }
  });
  
  const res = await apiFetch(`/opportunities/?${params.toString()}`);
  const data = await handleResponse(res);
  // Assuming the backend returns an array or paginated object. 
  // Let's wrap it in the expected paginated structure if it's an array.
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

export async function getOpportunity(id: string): Promise<OpportunityView> {
  const res = await apiFetch(`/opportunities/${id}/`);
  return await handleResponse(res);
}

export type OpportunityInput = Omit<
  Opportunity,
  'id' | 'companyId' | 'slotsFilled' | 'status' | 'createdAt' | 'publishedAt' | 'approvedById' | 'reviewNote'
>;

export async function createOpportunity(input: OpportunityInput, submit: boolean): Promise<OpportunityView> {
  const res = await apiFetch(`/opportunities/?submit=${submit}`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
  return await handleResponse(res);
}

export async function updateOpportunity(id: string, input: OpportunityInput): Promise<OpportunityView> {
  const res = await apiFetch(`/opportunities/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(input)
  });
  return await handleResponse(res);
}

export async function submitForApproval(id: string): Promise<OpportunityView> {
  const res = await apiFetch(`/opportunities/${id}/submit/`, { method: 'POST' });
  return await handleResponse(res);
}

export async function decideApproval(id: string, decision: 'APPROVE' | 'REJECT', note: string): Promise<OpportunityView> {
  const res = await apiFetch(`/opportunities/${id}/review/`, {
    method: 'POST',
    body: JSON.stringify({ decision, note })
  });
  return await handleResponse(res);
}

export async function closeOpportunity(id: string): Promise<OpportunityView> {
  const res = await apiFetch(`/opportunities/${id}/close/`, { method: 'POST' });
  return await handleResponse(res);
}

export async function skillOptions(): Promise<string[]> {
  // Can be a dedicated endpoint, but for now we'll fetch all opportunities and extract skills.
  // In a real production app, this would be `apiFetch('/skills/')`.
  const res = await apiFetch('/opportunities/');
  const data = await handleResponse(res);
  const opps = Array.isArray(data) ? data : (data.results || []);
  const skills = new Set<string>();
  opps.forEach((o: any) => {
    if (o.status === 'PUBLISHED' && o.preferredSkills) {
      o.preferredSkills.forEach((s: string) => skills.add(s));
    }
  });
  return Array.from(skills).sort();
}