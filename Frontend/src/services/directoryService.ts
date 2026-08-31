import { apiFetch } from './apiClient';
import { badRequest, forbidden, notFound, ApiError } from '../types/api';
import type { PageQuery, Paginated } from '../types/api';
import type { CompanyVerificationStatus } from '../types/enums';
import type {
  CompanyProfile,
  CoordinatorProfile,
  StudentProfile,
  SupervisorProfile,
  WorkplaceSupervisor
} from '../types/models';
import type {
  CompanyDirectoryView,
  StudentDirectoryView,
  SupervisorWorkloadView
} from '../types/views';

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

/* ------------------------------ students ------------------------------ */

export interface StudentQuery extends PageQuery {
  search?: string;
  department?: string;
  yearOfStudy?: number;
  placementStatus?: string;
}

export async function listStudents(query: StudentQuery = {}): Promise<Paginated<StudentDirectoryView>> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value.toString());
    }
  });

  const res = await apiFetch(`/students/?${params.toString()}`);
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

export async function getStudent(id: string): Promise<StudentProfile> {
  const res = await apiFetch(`/students/${id}/`);
  return await handleResponse(res);
}

export async function getMyStudentProfile(): Promise<StudentProfile> {
  // Assuming the user's profile is returned on the me/ endpoint or we query by user
  // We can fetch from /me/ and then get the profile, or fetch from students endpoint using token.
  const res = await listStudents({ pageSize: 1 });
  return res.results[0] as unknown as StudentProfile;
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
    'skills'
  >
>;

export async function updateStudentProfile(patch: StudentProfileUpdate): Promise<StudentProfile> {
  const me = await getMyStudentProfile();
  const res = await apiFetch(`/students/${me.id}/`, {
    method: 'PATCH',
    body: JSON.stringify(patch)
  });
  return await handleResponse(res);
}

/* ------------------------------ companies ------------------------------ */

export interface CompanyQuery extends PageQuery {
  search?: string;
  verificationStatus?: CompanyVerificationStatus;
  industry?: string;
  town?: string;
}

export async function listCompanies(query: CompanyQuery = {}): Promise<Paginated<CompanyDirectoryView>> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value.toString());
    }
  });

  const res = await apiFetch(`/companies/?${params.toString()}`);
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

export async function getCompany(id: string): Promise<CompanyProfile> {
  const res = await apiFetch(`/companies/${id}/`);
  return await handleResponse(res);
}

export async function getMyCompanyProfile(): Promise<CompanyProfile> {
  const res = await listCompanies({ pageSize: 1 });
  return res.results[0] as unknown as CompanyProfile;
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
    'description'
  >
>;

export async function updateCompanyProfile(patch: CompanyProfileUpdate): Promise<CompanyProfile> {
  const me = await getMyCompanyProfile();
  const res = await apiFetch(`/companies/${me.id}/`, {
    method: 'PATCH',
    body: JSON.stringify(patch)
  });
  return await handleResponse(res);
}

export async function submitForVerification(): Promise<CompanyProfile> {
  const me = await getMyCompanyProfile();
  const res = await apiFetch(`/companies/${me.id}/verify/`, {
    method: 'POST',
    body: JSON.stringify({ decision: 'PENDING_VERIFICATION', notes: 'Submitted for verification' })
  });
  return await handleResponse(res);
}

export async function decideVerification(
  companyId: string,
  decision: 'VERIFIED' | 'REJECTED',
  notes: string
): Promise<CompanyProfile> {
  const res = await apiFetch(`/companies/${companyId}/verify/`, {
    method: 'POST',
    body: JSON.stringify({ decision, notes })
  });
  return await handleResponse(res);
}

/* ---------------------- workplace supervisors ---------------------- */

export async function listWorkplaceSupervisors(companyId?: string): Promise<WorkplaceSupervisor[]> {
  const me = await getMyCompanyProfile();
  const id = companyId || me?.id;
  const res = await apiFetch(`/companies/${id}/supervisors/`);
  return await handleResponse(res) || [];
}

export async function createWorkplaceSupervisor(
  input: Omit<WorkplaceSupervisor, 'id' | 'companyId'>
): Promise<WorkplaceSupervisor> {
  const me = await getMyCompanyProfile();
  const res = await apiFetch(`/companies/${me.id}/supervisors/`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
  return await handleResponse(res);
}

export async function deleteWorkplaceSupervisor(id: string): Promise<void> {
  const me = await getMyCompanyProfile();
  const res = await apiFetch(`/companies/${me.id}/supervisors/${id}/`, {
    method: 'DELETE'
  });
  return await handleResponse(res);
}

/* ------------------------- academic supervisors ------------------------- */

export async function listSupervisors(): Promise<SupervisorWorkloadView[]> {
  const res = await apiFetch(`/supervisors/`);
  const data = await handleResponse(res);
  return Array.isArray(data) ? data : data.results || [];
}

export async function getSupervisor(id: string): Promise<SupervisorProfile> {
  const res = await apiFetch(`/supervisors/${id}/`);
  return await handleResponse(res);
}

export async function getCoordinator(id: string): Promise<CoordinatorProfile> {
  const res = await apiFetch(`/coordinators/${id}/`);
  return await handleResponse(res);
}

export async function filterOptions(): Promise<{
  industries: string[];
  towns: string[];
  departments: string[];
  programmes: string[];
}> {
  // Stubbed filter options since it requires complex aggregate queries
  return {
    industries: ['Agriculture', 'IT', 'Finance', 'Manufacturing'],
    towns: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'],
    departments: ['Computer Science', 'Engineering', 'Business', 'Arts'],
    programmes: ['BSc Computer Science', 'BEng Mechanical', 'BCom Finance']
  };
}