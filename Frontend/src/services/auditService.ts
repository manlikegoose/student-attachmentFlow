/**
 * Audit service. Read-only by design — there is no create, update or delete endpoint
 * exposed to any role. Entries are written only by the workflow services.
 *
 * Endpoint map (future DRF):
 *   GET /api/audit-logs/  → listAuditLog (COORDINATOR / ADMIN only)
 */

import { apiFetch } from './apiClient';
import type { PageQuery, Paginated } from '../types/api';
import type { AuditAction, UserRole } from '../types/enums';
import type { AuditLogEntry } from '../types/models';

export interface AuditQuery extends PageQuery {
  search?: string;
  action?: AuditAction;
  actorRole?: UserRole;
  objectType?: string;
  from?: string;
  to?: string;
}

export async function listAuditLog(query: AuditQuery = {}): Promise<Paginated<AuditLogEntry>> {
  const params = new URLSearchParams();
  if (query.page) params.append('page', query.page.toString());
  if (query.pageSize) params.append('pageSize', query.pageSize.toString());
  if (query.search) params.append('search', query.search);
  if (query.action) params.append('action', query.action);
  if (query.actorRole) params.append('actorRole', query.actorRole);
  if (query.objectType) params.append('objectType', query.objectType);
  if (query.from) params.append('from', query.from);
  if (query.to) params.append('to', query.to);

  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await apiFetch(`/audit-logs/${qs}`);
  if (!res.ok) throw new Error('Failed to fetch audit log');
  return res.json();
}

export async function auditObjectTypes(): Promise<string[]> {
  const res = await apiFetch('/audit-logs/object-types/');
  if (!res.ok) throw new Error('Failed to fetch object types');
  return res.json();
}