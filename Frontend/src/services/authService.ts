import { badRequest, unauthorized, ApiError } from '../types/api';
import type { UserRole } from '../types/enums';
import type { Session } from './session';
import { setSession, getSession, issueTokens } from './session';
import { apiFetch } from './apiClient';

export const PUBLIC_REGISTRATION_ROLES: UserRole[] = ['STUDENT', 'COMPANY'];

async function handleResponse(res: Response) {
  if (res.ok) {
    if (res.status === 204) return null;
    return await res.json();
  }
  const data = await res.json().catch(() => null);
  
  if (res.status === 400) {
    throw badRequest(data || { detail: ['Invalid request'] });
  } else if (res.status === 401 || res.status === 403) {
    throw unauthorized(data?.detail || 'Unauthorized');
  } else {
    throw new ApiError(res.status, data || { detail: 'Server error', code: 'server_error' });
  }
}

function mapUserResponseToSession(data: any): Session {
  // Django rest framework returns user, access, refresh
  // we map this to the frontend Session interface
  return {
    user: {
      id: data.user.id.toString(),
      email: data.user.email,
      fullName: `${data.user.first_name} ${data.user.last_name}`.trim(),
      role: data.user.role as UserRole,
      phone: '', // Can be extended to fetch from profile
      isActive: true,
      dateJoined: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    },
    role: data.user.role as UserRole,
    profileId: data.user.profileId, // We added this to the serializer
    tokens: {
      access: data.access,
      refresh: data.refresh
    }
  };
}

export async function login(email: string, password: string): Promise<Session> {
  const res = await apiFetch('/login/', {
    method: 'POST',
    body: JSON.stringify({ username: email, password })
  });
  
  const data = await handleResponse(res);
  
  // To get user details we need to hit /me/ because /login/ only gives tokens
  // but wait, standard TokenObtainPairView only gives { access, refresh }.
  // Let's do a /me/ call to fetch the user profile.
  setSession({
    user: null as any,
    role: 'STUDENT',
    profileId: '',
    tokens: { access: data.access, refresh: data.refresh }
  }); // Temporary session to authenticate the next call
  
  const meRes = await apiFetch('/me/');
  const meData = await handleResponse(meRes);
  
  const fullSession = mapUserResponseToSession({
    user: meData,
    access: data.access,
    refresh: data.refresh
  });
  
  setSession(fullSession);
  return fullSession;
}

export async function loginAsDemo(email: string): Promise<Session> {
  return login(email, 'demo1234'); // Assumes demo accounts have 'demo1234' as password
}

import type { StudentRegistration, CompanyRegistration } from './authService.types';
export type { StudentRegistration, CompanyRegistration };

export async function registerStudent(input: StudentRegistration): Promise<Session> {
  const res = await apiFetch('/register/student/', {
    method: 'POST',
    body: JSON.stringify(input)
  });
  const data = await handleResponse(res);
  const session = mapUserResponseToSession(data);
  setSession(session);
  return session;
}

export async function registerCompany(input: CompanyRegistration): Promise<Session> {
  const res = await apiFetch('/register/company/', {
    method: 'POST',
    body: JSON.stringify(input)
  });
  const data = await handleResponse(res);
  const session = mapUserResponseToSession(data);
  setSession(session);
  return session;
}

export async function refresh(): Promise<Session> {
  const session = getSession();
  if (!session) throw unauthorized();
  
  const res = await apiFetch('/refresh/', {
    method: 'POST',
    body: JSON.stringify({ refresh: session.tokens.refresh })
  });
  
  const data = await handleResponse(res);
  session.tokens.access = data.access;
  setSession(session);
  return session;
}

export async function logout(): Promise<void> {
  setSession(null);
}

export async function me(): Promise<Session> {
  const session = getSession();
  if (!session) throw unauthorized();
  return session;
}

export async function requestPasswordReset(email: string): Promise<{detail: string;}> {
  return { detail: 'Password reset is not fully implemented on the backend yet.' };
}

export async function changeOwnPassword(currentPassword: string, newPassword: string): Promise<void> {
  throw new Error('Not implemented on backend yet.');
}

export function demoAccounts() {
  return [
    { email: 'student@example.com', fullName: 'Demo Student', role: 'STUDENT' },
    { email: 'company@example.com', fullName: 'Demo Company', role: 'COMPANY' }
  ];
}