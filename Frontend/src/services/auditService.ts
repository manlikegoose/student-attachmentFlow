/**
 * Audit service. Read-only by design — there is no create, update or delete endpoint
 * exposed to any role. Entries are written only by the workflow services.
 *
 * Endpoint map (future DRF):
 *   GET /api/audit-logs/  → listAuditLog (COORDINATOR / ADMIN only)
 */

import type { PageQuery, Paginated } from '../types/api';
import type { AuditAction, UserRole } from '../types/enums';
import type { AuditLogEntry } from '../types/models';
import { read } from './store';
import { matchesSearch, paginate, request } from './transport';
import { requireRole } from './session';

export interface AuditQuery extends PageQuery {
  search?: string;
  action?: AuditAction;
  actorRole?: UserRole;
  objectType?: string;
  from?: string;
  to?: string;
}

export function listAuditLog(query: AuditQuery = {}): Promise<Paginated<AuditLogEntry>> {
  return request(() => {
    requireRole('COORDINATOR', 'ADMIN');
    return read((db) => {
      const rows = db.auditLog.
      filter(
        (e) =>
        matchesSearch(query.search, e.actorName, e.objectLabel, e.objectType) && (
        !query.action || e.action === query.action) && (
        !query.actorRole || e.actorRole === query.actorRole) && (
        !query.objectType || e.objectType === query.objectType) && (
        !query.from || e.createdAt >= query.from) && (
        !query.to || e.createdAt <= `${query.to}T23:59:59`)
      ).
      sort((a, b) => a.createdAt < b.createdAt ? 1 : -1);
      return paginate(rows, query);
    });
  });
}

export function auditObjectTypes(): Promise<string[]> {
  return request(() => {
    requireRole('COORDINATOR', 'ADMIN');
    return read((db) => Array.from(new Set(db.auditLog.map((e) => e.objectType))).sort());
  });
}