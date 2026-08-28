/**
 * Opportunity service.
 *
 * Endpoint map (future DRF):
 *   GET    /api/opportunities/            → listOpportunities   (public: PUBLISHED only)
 *   GET    /api/opportunities/:id/        → getOpportunity
 *   POST   /api/opportunities/            → createOpportunity   (COMPANY)
 *   PATCH  /api/opportunities/:id/        → updateOpportunity   (COMPANY, owner)
 *   POST   /api/opportunities/:id/submit/ → submitForApproval   (COMPANY, owner)
 *   POST   /api/opportunities/:id/review/ → decideApproval      (COORDINATOR)
 *   POST   /api/opportunities/:id/close/  → closeOpportunity    (COMPANY, owner)
 */

import { badRequest, forbidden, notFound } from '../types/api';
import type { PageQuery, Paginated } from '../types/api';
import type { OpportunityStatus, WorkMode } from '../types/enums';
import type { Opportunity } from '../types/models';
import type { CompanyBrief, OpportunityView } from '../types/views';
import { canPublishOpportunity, canTransitionOpportunity, isOpportunityOpen } from '../domain/rules';
import type { Database } from './store';
import { nextId, nowISO, pushAudit, pushNotification, read, write } from './store';
import { matchesSearch, paginate, request } from './transport';
import { getSession, requireActor, requireRole } from './session';

export function toCompanyBrief(db: Database, companyId: string): CompanyBrief {
  const c = db.companies.find((x) => x.id === companyId);
  if (!c) throw notFound('Company not found.');
  return {
    id: c.id,
    name: c.name,
    logoText: c.logoText,
    industry: c.industry,
    town: c.town,
    location: c.location,
    verificationStatus: c.verificationStatus
  };
}

export function toOpportunityView(db: Database, o: Opportunity): OpportunityView {
  return {
    ...o,
    company: toCompanyBrief(db, o.companyId),
    slotsRemaining: Math.max(0, o.slots - o.slotsFilled),
    isOpen: isOpportunityOpen(o).allowed,
    applicationCount: db.applications.filter((a) => a.opportunityId === o.id).length
  };
}

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
  /** Coordinator/company views opt in to non-published rows. */
  includeAllStatuses?: boolean;
}

export function listOpportunities(
query: OpportunityQuery = {})
: Promise<Paginated<OpportunityView>> {
  return request(() =>
  read((db) => {
    const session = getSession();
    const role = session?.role;
    let rows = db.opportunities.slice();

    if (role === 'COMPANY') {
      rows = query.companyId ?
      rows.filter((o) => o.companyId === query.companyId) :
      rows.filter((o) => o.companyId === session?.profileId);
    } else if (role === 'COORDINATOR' || role === 'ADMIN') {
      if (query.companyId) rows = rows.filter((o) => o.companyId === query.companyId);
    } else {
      // Students and anonymous visitors only ever see published postings.
      rows = rows.filter((o) => o.status === 'PUBLISHED');
    }

    if (query.status) rows = rows.filter((o) => o.status === query.status);
    if (!query.status && !query.includeAllStatuses && (role === 'COORDINATOR' || role === 'ADMIN')) {

      // default coordinator view keeps everything; explicit for readability
    }
    const filtered = rows.
    filter((o) => {
      const company = db.companies.find((c) => c.id === o.companyId);
      return (
        matchesSearch(query.search, o.title, company?.name, o.department, o.description) && (
        !query.town || o.town === query.town) && (
        !query.industry || o.industry === query.industry) && (
        !query.workMode || o.workMode === query.workMode) && (
        !query.maxDurationWeeks || o.durationWeeks <= query.maxDurationWeeks) && (
        !query.deadlineBefore || o.applicationDeadline <= query.deadlineBefore) && (
        !query.skill ||
        o.preferredSkills.some((s) => s.toLowerCase() === query.skill?.toLowerCase())));

    }).
    sort((a, b) => a.applicationDeadline < b.applicationDeadline ? -1 : 1).
    map((o) => toOpportunityView(db, o));

    return paginate(filtered, query);
  })
  );
}

export function getOpportunity(id: string): Promise<OpportunityView> {
  return request(() =>
  read((db) => {
    const o = db.opportunities.find((x) => x.id === id);
    if (!o) throw notFound('Opportunity not found.');
    const session = getSession();
    if (o.status !== 'PUBLISHED') {
      const role = session?.role;
      const isOwner = role === 'COMPANY' && session?.profileId === o.companyId;
      const isStaff = role === 'COORDINATOR' || role === 'ADMIN';
      if (!isOwner && !isStaff) throw notFound('Opportunity not found.');
    }
    return toOpportunityView(db, o);
  })
  );
}

export type OpportunityInput = Omit<
  Opportunity,
  'id' | 'companyId' | 'slotsFilled' | 'status' | 'createdAt' | 'publishedAt' | 'approvedById' | 'reviewNote'>;


function validate(input: OpportunityInput) {
  const errors: Record<string, string[]> = {};
  if (!input.title.trim()) errors.title = ['Enter a title.'];
  if (input.description.trim().length < 40)
  errors.description = ['Provide a description of at least 40 characters.'];
  if (!input.startDate) errors.startDate = ['Select a start date.'];
  if (!input.endDate) errors.endDate = ['Select an end date.'];
  if (input.startDate && input.endDate && input.endDate <= input.startDate)
  errors.endDate = ['The end date must fall after the start date.'];
  if (input.applicationDeadline && input.startDate && input.applicationDeadline > input.startDate)
  errors.applicationDeadline = ['The deadline must fall on or before the start date.'];
  if (input.slots < 1) errors.slots = ['At least one slot is required.'];
  if (input.slots > 50) errors.slots = ['Slots must be 50 or fewer.'];
  if (Object.keys(errors).length) throw badRequest(errors);
}

export function createOpportunity(
input: OpportunityInput,
submit: boolean)
: Promise<OpportunityView> {
  return request(() => {
    const actor = requireRole('COMPANY');
    return write((db) => {
      validate(input);
      const company = db.companies.find((c) => c.id === actor.profileId);
      if (!company) throw notFound('Company profile not found.');
      if (submit) {
        const gate = canPublishOpportunity(company);
        if (!gate.allowed) throw forbidden(gate.reason);
      }
      const record: Opportunity = {
        ...input,
        id: nextId('opp'),
        companyId: company.id,
        slotsFilled: 0,
        status: submit ? 'PENDING_APPROVAL' : 'DRAFT',
        createdAt: nowISO(),
        publishedAt: null
      };
      db.opportunities.push(record);
      if (submit) notifyCoordinatorsOfSubmission(db, record, company.name);
      return toOpportunityView(db, record);
    });
  });
}

export function updateOpportunity(
id: string,
input: OpportunityInput)
: Promise<OpportunityView> {
  return request(() => {
    const actor = requireRole('COMPANY');
    return write((db) => {
      const record = db.opportunities.find((o) => o.id === id);
      if (!record) throw notFound('Opportunity not found.');
      if (record.companyId !== actor.profileId) throw forbidden();
      if (record.status === 'CANCELLED') {
        throw badRequest({ detail: 'A cancelled opportunity cannot be edited.' });
      }
      validate(input);
      if (input.slots < record.slotsFilled) {
        throw badRequest({
          slots: [`Slots cannot be fewer than the ${record.slotsFilled} already filled.`]
        });
      }
      Object.assign(record, input);
      return toOpportunityView(db, record);
    });
  });
}

export function submitForApproval(id: string): Promise<OpportunityView> {
  return request(() => {
    const actor = requireRole('COMPANY');
    return write((db) => {
      const record = db.opportunities.find((o) => o.id === id);
      if (!record) throw notFound('Opportunity not found.');
      if (record.companyId !== actor.profileId) throw forbidden();
      const company = db.companies.find((c) => c.id === record.companyId);
      if (!company) throw notFound('Company not found.');
      const gate = canPublishOpportunity(company);
      if (!gate.allowed) throw forbidden(gate.reason);
      if (!canTransitionOpportunity(record.status, 'PENDING_APPROVAL')) {
        throw badRequest({ detail: `A ${record.status.toLowerCase()} posting cannot be submitted.` });
      }
      record.status = 'PENDING_APPROVAL';
      notifyCoordinatorsOfSubmission(db, record, company.name);
      return toOpportunityView(db, record);
    });
  });
}

function notifyCoordinatorsOfSubmission(db: Database, o: Opportunity, companyName: string) {
  db.coordinators.forEach((c) =>
  pushNotification(db, {
    userId: c.userId,
    type: 'COMPANY',
    title: 'Opportunity awaiting approval',
    message: `${companyName} submitted “${o.title}” for approval.`,
    link: '/coordinator/opportunities'
  })
  );
}

export function decideApproval(
id: string,
decision: 'APPROVE' | 'REJECT',
note: string)
: Promise<OpportunityView> {
  return request(() => {
    const actor = requireRole('COORDINATOR', 'ADMIN');
    return write((db) => {
      const record = db.opportunities.find((o) => o.id === id);
      if (!record) throw notFound('Opportunity not found.');
      if (record.status !== 'PENDING_APPROVAL') {
        throw badRequest({ detail: 'This posting is not awaiting approval.' });
      }
      if (decision === 'REJECT' && !note.trim()) {
        throw badRequest({ note: ['A reason is required when returning a posting.'] });
      }
      const company = db.companies.find((c) => c.id === record.companyId);
      record.status = decision === 'APPROVE' ? 'PUBLISHED' : 'DRAFT';
      record.reviewNote = note.trim() || null;
      record.approvedById = actor.profileId;
      record.publishedAt = decision === 'APPROVE' ? nowISO() : null;

      if (company) {
        pushNotification(db, {
          userId: company.userId,
          type: 'COMPANY',
          title: decision === 'APPROVE' ? 'Opportunity published' : 'Opportunity returned',
          message:
          decision === 'APPROVE' ?
          `“${record.title}” is now live and open to students.` :
          `“${record.title}” was returned for revision: ${note}`,
          link: `/company/opportunities/${record.id}`
        });
      }
      pushAudit(db, {
        actorId: actor.profileId,
        actorName: actor.fullName,
        actorRole: actor.role,
        action: decision === 'APPROVE' ? 'OPPORTUNITY_APPROVED' : 'OPPORTUNITY_REJECTED',
        objectType: 'Opportunity',
        objectId: record.id,
        objectLabel: `${record.title} — ${company?.name ?? 'Unknown company'}`,
        metadata: note ? { note } : undefined
      });
      return toOpportunityView(db, record);
    });
  });
}

export function closeOpportunity(id: string): Promise<OpportunityView> {
  return request(() => {
    const actor = requireActor();
    return write((db) => {
      const record = db.opportunities.find((o) => o.id === id);
      if (!record) throw notFound('Opportunity not found.');
      const isOwner = actor.role === 'COMPANY' && record.companyId === actor.profileId;
      const isStaff = actor.role === 'COORDINATOR' || actor.role === 'ADMIN';
      if (!isOwner && !isStaff) throw forbidden();
      if (!canTransitionOpportunity(record.status, 'CLOSED')) {
        throw badRequest({ detail: 'Only a published posting can be closed.' });
      }
      record.status = 'CLOSED';
      return toOpportunityView(db, record);
    });
  });
}

/** Distinct skills across published postings — powers the student skill filter. */
export function skillOptions(): Promise<string[]> {
  return request(() =>
  read((db) =>
  Array.from(
    new Set(db.opportunities.flatMap((o) => o.status === 'PUBLISHED' ? o.preferredSkills : []))
  ).sort()
  )
  );
}