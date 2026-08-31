import { apiFetch } from './apiClient';
import { badRequest, forbidden, notFound, ApiError } from '../types/api';
import type { PageQuery, Paginated } from '../types/api';
import type { Evaluation, EvaluationScores } from '../types/models';

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

export interface EvaluationQuery extends PageQuery {
  placementId?: string;
  studentId?: string;
  evaluatorId?: string;
}

export async function listEvaluations(query: EvaluationQuery = {}): Promise<Paginated<Evaluation>> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value.toString());
    }
  });

  const res = await apiFetch(`/supervision/evaluations/?${params.toString()}`);
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

export async function getEvaluation(id: string): Promise<Evaluation> {
  const res = await apiFetch(`/supervision/evaluations/${id}/`);
  return await handleResponse(res);
}

export interface EvaluationInput {
  placementId: string;
  scores: EvaluationScores;
  recommendation: string;
  feedback: string;
}

export async function submitEvaluation(input: EvaluationInput): Promise<Evaluation> {
  const res = await apiFetch(`/supervision/evaluations/`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
  return await handleResponse(res);
}

export async function reopenEvaluation(id: string, reason: string): Promise<Evaluation> {
  const res = await apiFetch(`/supervision/evaluations/${id}/reopen/`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
  return await handleResponse(res);
}