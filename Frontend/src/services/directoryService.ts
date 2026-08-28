/**
 * People and organisation directory.
 *
 * Endpoint map (future DRF):
 *   GET    /api/students/                     → listStudents
 *   GET    /api/students/:id/                 → getStudent
 *   PATCH  /api/students/me/                  → updateStudentProfile
 *   GET    /api/companies/                    → listCompanies
 *   GET    /api/companies/:id/                → getCompany
 *   PATCH  /api/companies/me/                 → updateCompanyProfile
 *   POST   /api/companies/me/submit-verification/ → submitForVerification
 *   POST   /api/companies/:id/verify/         → decideVerification   (COORDINATOR)
 *   GET    /api/companies/me/supervisors/     → listWorkplaceSupervisors
 *   POST   /api/companies/me/supervisors/     → createWorkplaceSupervisor
 *   DELETE /api/companies/me/supervisors/:id/ → deleteWorkplaceSupervisor
 *   GET    /api/supervisors/                  → listSupervisors (with workload)
 */

import { badRequest, forbidden, notFound } from '../types/api';
import type { PageQuery, Paginated } from '../types/api';
import type { CompanyVerificationStatus } from '../types/enums';
import type {
  CompanyProfile,
  CoordinatorProfile,
  StudentProfile,
  SupervisorProfile,
  WorkplaceSupervisor } from
'../types/models';
import type {
  CompanyDirectoryView,
  StudentDirectoryView,
  SupervisorWorkloadView } from
'../types/views';
import { supervisorWorkload } from '../domain/rules';
import { nextId, nowISO, pushAudit, pushNotification, read, write } from './store';
import { matchesSearch, paginate, request } from './transport';
import { requireActor, requireRole } from './session';

/* ------------------------------ students ------------------------------ */

export interface StudentQuery extends PageQuery {
  search?: string;
  department?: string;
  yearOfStudy?: number;
  placementStatus?: string;
}

export function listStudents(query: StudentQuery = {}): Promise<Paginated<StudentDirectoryView>> {
  return request(() => {
    requireRole('COORDINATOR', 'ADMIN');
    return read((db) => {
      const rows: StudentDirectoryView[] = db.students.map((s) => {
        const placement = db.placements.find(
          (p) => p.studentId === s.id && p.status !== 'CANCELLED'
        );
        const docs = db.documents.filter((d) => d.ownerId === s.id);
        return {
          ...s,
          applicationCount: db.applications.filter((a) => a.studentId === s.id).length,
          placementStatus: placement?.status ?? null,
          companyName: placement ?
          db.companies.find((c) => c.id === placement.companyId)?.name ?? null :
          null,
          documentsApproved: docs.filter((d) => d.status === 'APPROVED').length,
          documentsTotal: docs.length
        };
      });
      const filtered = rows.filter(
        (r) =>
        matchesSearch(query.search, r.fullName, r.studentNumber, r.programme, r.email) && (
        !query.department || r.department === query.department) && (
        !query.yearOfStudy || r.yearOfStudy === query.yearOfStudy) && (
        !query.placementStatus || r.placementStatus === query.placementStatus)
      );
      return paginate(filtered, query);
    });
  });
}

export function getStudent(id: string): Promise<StudentProfile> {
  return request(() => {
    const actor = requireActor();
    return read((db) => {
      const student = db.students.find((s) => s.id === id);
      if (!student) throw notFound('Student not found.');
      if (actor.role === 'STUDENT' && actor.profileId !== id) throw forbidden();
      if (actor.role === 'SUPERVISOR') {
        const assigned = db.placements.some(
          (p) => p.studentId === id && p.academicSupervisorId === actor.profileId
        );
        if (!assigned) throw forbidden('This student is not assigned to you.');
      }
      if (actor.role === 'COMPANY') {
        const related = db.applications.some(
          (a) => a.studentId === id && a.companyId === actor.profileId
        );
        if (!related) throw forbidden('This student has not applied to your organisation.');
      }
      return student;
    });
  });
}

export function getMyStudentProfile(): Promise<StudentProfile> {
  return request(() => {
    const actor = requireRole('STUDENT');
    return read((db) => {
      const student = db.students.find((s) => s.id === actor.profileId);
      if (!student) throw notFound('Student profile not found.');
      return student;
    });
  });
}

export type StudentProfileUpdate = Partial<
  Pick<
    StudentProfile,
    'fullName' |
    'phone' |
    'gender' |
    'dateOfBirth' |
    'address' |
    'faculty' |
    'department' |
    'programme' |
    'yearOfStudy' |
    'expectedGraduation' |
    'bio' |
    'skills'>>;



export function updateStudentProfile(patch: StudentProfileUpdate): Promise<StudentProfile> {
  return request(() => {
    const actor = requireRole('STUDENT');
    return write((db) => {
      const student = db.students.find((s) => s.id === actor.profileId);
      if (!student) throw notFound('Student profile not found.');
      if (patch.yearOfStudy !== undefined && (patch.yearOfStudy < 1 || patch.yearOfStudy > 6)) {
        throw badRequest({ yearOfStudy: ['Year of study must be between 1 and 6.'] });
      }
      Object.assign(student, patch, { updatedAt: nowISO() });
      const user = db.users.find((u) => u.id === student.userId);
      if (user && patch.fullName) user.fullName = patch.fullName;
      if (user && patch.phone) user.phone = patch.phone;
      return student;
    });
  });
}

/* ------------------------------ companies ------------------------------ */

export interface CompanyQuery extends PageQuery {
  search?: string;
  verificationStatus?: CompanyVerificationStatus;
  industry?: string;
  town?: string;
}

export function listCompanies(query: CompanyQuery = {}): Promise<Paginated<CompanyDirectoryView>> {
  return request(() => {
    requireActor();
    return read((db) => {
      const rows: CompanyDirectoryView[] = db.companies.map((c) => {
        const opps = db.opportunities.filter((o) => o.companyId === c.id);
        return {
          ...c,
          opportunityCount: opps.length,
          publishedOpportunityCount: opps.filter((o) => o.status === 'PUBLISHED').length,
          applicantCount: db.applications.filter((a) => a.companyId === c.id).length,
          activeInterns: db.placements.filter((p) => p.companyId === c.id && p.status === 'ACTIVE').
          length
        };
      });
      const filtered = rows.filter(
        (r) =>
        matchesSearch(query.search, r.name, r.industry, r.town, r.email) && (
        !query.verificationStatus || r.verificationStatus === query.verificationStatus) && (
        !query.industry || r.industry === query.industry) && (
        !query.town || r.town === query.town)
      );
      return paginate(filtered, query);
    });
  });
}

export function getCompany(id: string): Promise<CompanyProfile> {
  return request(() =>
  read((db) => {
    const company = db.companies.find((c) => c.id === id);
    if (!company) throw notFound('Company not found.');
    return company;
  })
  );
}

export function getMyCompanyProfile(): Promise<CompanyProfile> {
  return request(() => {
    const actor = requireRole('COMPANY');
    return read((db) => {
      const company = db.companies.find((c) => c.id === actor.profileId);
      if (!company) throw notFound('Company profile not found.');
      return company;
    });
  });
}

export type CompanyProfileUpdate = Partial<
  Pick<
    CompanyProfile,
    'name' |
    'phone' |
    'industry' |
    'location' |
    'town' |
    'website' |
    'registrationNumber' |
    'description'>>;



export function updateCompanyProfile(patch: CompanyProfileUpdate): Promise<CompanyProfile> {
  return request(() => {
    const actor = requireRole('COMPANY');
    return write((db) => {
      const company = db.companies.find((c) => c.id === actor.profileId);
      if (!company) throw notFound('Company profile not found.');
      Object.assign(company, patch);
      return company;
    });
  });
}

export function submitForVerification(): Promise<CompanyProfile> {
  return request(() => {
    const actor = requireRole('COMPANY');
    return write((db) => {
      const company = db.companies.find((c) => c.id === actor.profileId);
      if (!company) throw notFound('Company profile not found.');
      if (company.verificationStatus === 'VERIFIED') {
        throw badRequest({ detail: 'This organisation is already verified.' });
      }
      if (!company.registrationNumber) {
        throw badRequest({
          registrationNumber: ['A company registration number is required for verification.']
        });
      }
      if (!company.description || company.description.length < 40) {
        throw badRequest({
          description: ['Provide a description of at least 40 characters for the reviewer.']
        });
      }
      company.verificationStatus = 'PENDING_VERIFICATION';
      db.coordinators.forEach((c) =>
      pushNotification(db, {
        userId: c.userId,
        type: 'COMPANY',
        title: 'Company awaiting verification',
        message: `${company.name} submitted verification details.`,
        link: `/coordinator/companies/${company.id}`
      })
      );
      return company;
    });
  });
}

export function decideVerification(
companyId: string,
decision: 'VERIFIED' | 'REJECTED',
notes: string)
: Promise<CompanyProfile> {
  return request(() => {
    const actor = requireRole('COORDINATOR', 'ADMIN');
    return write((db) => {
      const company = db.companies.find((c) => c.id === companyId);
      if (!company) throw notFound('Company not found.');
      if (company.verificationStatus === 'REGISTERED') {
        throw badRequest({
          detail: 'This organisation has not yet submitted verification details.'
        });
      }
      if (decision === 'REJECTED' && !notes.trim()) {
        throw badRequest({ notes: ['A reason is required when rejecting verification.'] });
      }
      company.verificationStatus = decision;
      company.verificationNotes = notes.trim() || null;
      company.verifiedAt = decision === 'VERIFIED' ? nowISO() : null;
      company.verifiedById = actor.profileId;

      pushNotification(db, {
        userId: company.userId,
        type: 'COMPANY',
        title: decision === 'VERIFIED' ? 'Your organisation is verified' : 'Verification declined',
        message:
        decision === 'VERIFIED' ?
        'You can now publish attachment opportunities on AttachHub.' :
        `Verification was declined: ${notes}`,
        link: '/company/profile'
      });
      pushAudit(db, {
        actorId: actor.profileId,
        actorName: actor.fullName,
        actorRole: actor.role,
        action: decision === 'VERIFIED' ? 'COMPANY_VERIFIED' : 'COMPANY_REJECTED',
        objectType: 'Company',
        objectId: company.id,
        objectLabel: company.name,
        metadata: notes ? { notes } : undefined
      });
      return company;
    });
  });
}

/* ---------------------- workplace supervisors ---------------------- */

export function listWorkplaceSupervisors(companyId?: string): Promise<WorkplaceSupervisor[]> {
  return request(() => {
    const actor = requireActor();
    const target = companyId ?? actor.profileId;
    if (actor.role === 'COMPANY' && target !== actor.profileId) throw forbidden();
    return read((db) => db.workplaceSupervisors.filter((w) => w.companyId === target));
  });
}

export function createWorkplaceSupervisor(
input: Omit<WorkplaceSupervisor, 'id' | 'companyId'>)
: Promise<WorkplaceSupervisor> {
  return request(() => {
    const actor = requireRole('COMPANY');
    return write((db) => {
      if (!input.fullName.trim()) throw badRequest({ fullName: ['Enter a full name.'] });
      if (!input.email.includes('@')) throw badRequest({ email: ['Enter a valid email address.'] });
      const record: WorkplaceSupervisor = { ...input, id: nextId('wsup'), companyId: actor.profileId };
      db.workplaceSupervisors.push(record);
      return record;
    });
  });
}

export function deleteWorkplaceSupervisor(id: string): Promise<void> {
  return request(() => {
    const actor = requireRole('COMPANY');
    write((db) => {
      const record = db.workplaceSupervisors.find((w) => w.id === id);
      if (!record) throw notFound('Workplace supervisor not found.');
      if (record.companyId !== actor.profileId) throw forbidden();
      const assigned = db.placements.some(
        (p) => p.workplaceSupervisorId === id && p.status !== 'COMPLETED' && p.status !== 'CANCELLED'
      );
      if (assigned) {
        throw badRequest({
          detail: 'This supervisor is assigned to an open placement and cannot be removed.'
        });
      }
      db.workplaceSupervisors = db.workplaceSupervisors.filter((w) => w.id !== id);
    });
  });
}

/* ------------------------- academic supervisors ------------------------- */

export function listSupervisors(): Promise<SupervisorWorkloadView[]> {
  return request(() => {
    requireRole('COORDINATOR', 'ADMIN', 'SUPERVISOR');
    return read((db) =>
    db.supervisors.map((s) => {
      const workload = supervisorWorkload(s, db.placements);
      const mine = db.placements.filter((p) => p.academicSupervisorId === s.id);
      return {
        ...s,
        assigned: workload.assigned,
        atCapacity: workload.atCapacity,
        overCapacity: workload.overCapacity,
        activePlacements: mine.filter((p) => p.status === 'ACTIVE').length,
        completedPlacements: mine.filter((p) => p.status === 'COMPLETED').length,
        pendingEvaluations: mine.filter(
          (p) =>
          p.status === 'ACTIVE' && !db.evaluations.some((e) => e.placementId === p.id && e.locked)
        ).length
      };
    })
    );
  });
}

export function getSupervisor(id: string): Promise<SupervisorProfile> {
  return request(() =>
  read((db) => {
    const supervisor = db.supervisors.find((s) => s.id === id);
    if (!supervisor) throw notFound('Supervisor not found.');
    return supervisor;
  })
  );
}

export function getCoordinator(id: string): Promise<CoordinatorProfile> {
  return request(() =>
  read((db) => {
    const coordinator = db.coordinators.find((c) => c.id === id);
    if (!coordinator) throw notFound('Coordinator not found.');
    return coordinator;
  })
  );
}

/** Filter vocabularies, derived from live data rather than hard-coded in the UI. */
export function filterOptions(): Promise<{
  industries: string[];
  towns: string[];
  departments: string[];
  programmes: string[];
}> {
  return request(() =>
  read((db) => ({
    industries: unique(db.companies.map((c) => c.industry)),
    towns: unique(db.companies.map((c) => c.town)),
    departments: unique(db.students.map((s) => s.department)),
    programmes: unique(db.students.map((s) => s.programme))
  }))
  );
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}