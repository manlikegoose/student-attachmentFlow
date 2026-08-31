import { apiFetch } from './apiClient';
import { badRequest, forbidden, notFound, ApiError } from '../types/api';
import type { PageQuery, Paginated } from '../types/api';
import type { PlacementStatus } from '../types/enums';
import type { PlacementView } from '../types/views';

export interface PlacementQuery extends PageQuery {
  search?: string;
  status?: PlacementStatus;
  supervisorId?: string;
  companyId?: string;
  studentId?: string;
  unassignedOnly?: boolean;
  overdueOnly?: boolean;
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

export async function listPlacements(query: PlacementQuery = {}): Promise<Paginated<PlacementView>> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value.toString());
    }
  });

  const res = await apiFetch(`/applications/placements/?${params.toString()}`);
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

export async function getPlacement(id: string): Promise<PlacementView> {
  const res = await apiFetch(`/applications/placements/${id}/`);
  return await handleResponse(res);
}

export async function getMyPlacement(): Promise<PlacementView | null> {
  const res = await listPlacements({ pageSize: 1 });
  return res.results.length > 0 ? res.results[0] : null;
}

export async function assignAcademicSupervisor(placementId: string, supervisorId: string, acknowledgeOverCapacity = false): Promise<PlacementView> {
  const res = await apiFetch(`/applications/placements/${placementId}/assign-supervisor/`, {
    method: 'POST',
    body: JSON.stringify({ supervisorId, acknowledgeOverCapacity })
  });
  return await handleResponse(res);
}

export async function assignWorkplaceSupervisor(placementId: string, workplaceSupervisorId: string): Promise<PlacementView> {
  const res = await apiFetch(`/applications/placements/${placementId}/workplace-supervisor/`, {
    method: 'POST',
    body: JSON.stringify({ workplaceSupervisorId })
  });
  return await handleResponse(res);
}

export async function activatePlacement(id: string): Promise<PlacementView> {
  const res = await apiFetch(`/applications/placements/${id}/activate/`, {
    method: 'POST'
  });
  return await handleResponse(res);
}

export async function completePlacement(id: string): Promise<PlacementView> {
  const res = await apiFetch(`/applications/placements/${id}/complete/`, {
    method: 'POST'
  });
  return await handleResponse(res);
}

export async function cancelPlacement(id: string, reason: string): Promise<PlacementView> {
  const res = await apiFetch(`/applications/placements/${id}/cancel/`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
  return await handleResponse(res);
}