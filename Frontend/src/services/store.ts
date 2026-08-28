/**
 * In-browser data store.
 *
 * This is the mock transport's backing database. It is the ONLY module that holds
 * mutable domain state. When the Django API lands, this file and `transport.ts` are
 * deleted and each service module swaps its body for an Axios call — no consumer of
 * the services changes.
 */

import {
  companies as seedCompanies,
  coordinators as seedCoordinators,
  credentials as seedCredentials,
  students as seedStudents,
  supervisors as seedSupervisors,
  users as seedUsers,
  workplaceSupervisors as seedWorkplaceSupervisors } from
'../data/seedPeople';
import { opportunities as seedOpportunities } from '../data/seedOpportunities';
import {
  applications as seedApplications,
  auditLog as seedAuditLog,
  documents as seedDocuments,
  evaluations as seedEvaluations,
  notifications as seedNotifications,
  placements as seedPlacements,
  progressReports as seedProgressReports,
  supervisionReports as seedSupervisionReports } from
'../data/seedWorkflow';
import type {
  AccountCredential,
  Application,
  AuditLogEntry,
  CompanyProfile,
  CoordinatorProfile,
  DocumentRecord,
  Evaluation,
  Notification,
  Opportunity,
  Placement,
  ProgressReport,
  StudentProfile,
  SupervisionReport,
  SupervisorProfile,
  User,
  WorkplaceSupervisor } from
'../types/models';

export interface Database {
  users: User[];
  credentials: AccountCredential[];
  students: StudentProfile[];
  companies: CompanyProfile[];
  workplaceSupervisors: WorkplaceSupervisor[];
  supervisors: SupervisorProfile[];
  coordinators: CoordinatorProfile[];
  opportunities: Opportunity[];
  applications: Application[];
  placements: Placement[];
  documents: DocumentRecord[];
  supervisionReports: SupervisionReport[];
  progressReports: ProgressReport[];
  evaluations: Evaluation[];
  notifications: Notification[];
  auditLog: AuditLogEntry[];
}

const STORAGE_KEY = 'attachhub.db.v1';

function freshDatabase(): Database {
  return clone({
    users: seedUsers,
    credentials: seedCredentials,
    students: seedStudents,
    companies: seedCompanies,
    workplaceSupervisors: seedWorkplaceSupervisors,
    supervisors: seedSupervisors,
    coordinators: seedCoordinators,
    opportunities: seedOpportunities,
    applications: seedApplications,
    placements: seedPlacements,
    documents: seedDocuments,
    supervisionReports: seedSupervisionReports,
    progressReports: seedProgressReports,
    evaluations: seedEvaluations,
    notifications: seedNotifications,
    auditLog: seedAuditLog
  });
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function load(): Database {
  if (typeof window === 'undefined') return freshDatabase();
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return freshDatabase();
    const parsed = JSON.parse(raw) as Database;
    // Guard against a stale shape from an earlier build.
    if (!parsed.users || !parsed.opportunities) return freshDatabase();
    return parsed;
  } catch {
    return freshDatabase();
  }
}

let db: Database = load();

function persist() {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {

    /* storage quota — the demo continues in memory */}
}

type Listener = () => void;
const listeners = new Set<Listener>();

/** Subscribe to any committed mutation. Used by contexts that mirror store state. */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  listeners.forEach((l) => l());
}

/** Read a snapshot. Always returns a deep copy so callers cannot mutate state directly. */
export function read<T>(selector: (database: Database) => T): T {
  return clone(selector(db));
}

/** Apply a mutation, persist it and notify subscribers. */
export function write<T>(mutator: (database: Database) => T): T {
  const result = mutator(db);
  persist();
  emit();
  return clone(result);
}

/** Restore the seeded state — used by the demo reset control. */
export function resetDatabase() {
  db = freshDatabase();
  persist();
  emit();
}

/* ------------------------------------------------------------------ *
 * Shared helpers used across service modules
 * ------------------------------------------------------------------ */

let counter = 0;
export function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}${counter.toString(36)}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Record an in-app notification. In production this call is made by the backend
 * notification service, which will later fan out to email / SMS / WhatsApp.
 */
export function pushNotification(
database: Database,
input: Omit<Notification, 'id' | 'createdAt' | 'read'>)
{
  database.notifications.unshift({
    ...input,
    id: nextId('nt'),
    createdAt: nowISO(),
    read: false
  });
}

/** Record an audit entry. Ordinary users can never modify these. */
export function pushAudit(
database: Database,
input: Omit<AuditLogEntry, 'id' | 'createdAt'>)
{
  database.auditLog.unshift({ ...input, id: nextId('au'), createdAt: nowISO() });
}

/** Resolve the user account row that owns a given role profile id. */
export function userIdForProfile(database: Database, profileId: string): string | null {
  return (
    database.students.find((s) => s.id === profileId)?.userId ??
    database.companies.find((c) => c.id === profileId)?.userId ??
    database.supervisors.find((s) => s.id === profileId)?.userId ??
    database.coordinators.find((c) => c.id === profileId)?.userId ??
    null);

}

export function coordinatorUserIds(database: Database): string[] {
  return database.coordinators.map((c) => c.userId);
}