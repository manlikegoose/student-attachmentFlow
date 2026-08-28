/**
 * Authentication service.
 *
 * Endpoint map (future DRF):
 *   POST   /api/auth/login/              → login
 *   POST   /api/auth/register/student/   → registerStudent
 *   POST   /api/auth/register/company/   → registerCompany
 *   POST   /api/auth/refresh/            → refresh
 *   POST   /api/auth/logout/             → logout
 *   GET    /api/auth/me/                 → me
 *   POST   /api/auth/password-reset/     → requestPasswordReset (architected, see docs)
 */

import { badRequest, notFound, unauthorized } from '../types/api';
import type { UserRole } from '../types/enums';
import type { CompanyProfile, StudentProfile, User } from '../types/models';
import { UNIVERSITY, DEMO_PASSWORD } from '../data/seedPeople';
import { nextId, nowISO, pushNotification, read, write } from './store';
import type { Database } from './store';
import { issueTokens, getSession, isExpired, setSession } from './session';
import type { Session } from './session';
import { request } from './transport';

function profileIdFor(database: Database, user: User): string {
  switch (user.role) {
    case 'STUDENT':
      return database.students.find((s) => s.userId === user.id)?.id ?? '';
    case 'COMPANY':
      return database.companies.find((c) => c.userId === user.id)?.id ?? '';
    case 'SUPERVISOR':
      return database.supervisors.find((s) => s.userId === user.id)?.id ?? '';
    case 'COORDINATOR':
    case 'ADMIN':
      return database.coordinators.find((c) => c.userId === user.id)?.id ?? '';
    default:
      return '';
  }
}

function buildSession(database: Database, user: User): Session {
  return {
    user,
    role: user.role,
    profileId: profileIdFor(database, user),
    tokens: issueTokens(user.id)
  };
}

export function login(email: string, password: string): Promise<Session> {
  return request(() =>
  write((db) => {
    const normalized = email.trim().toLowerCase();
    const credential = db.credentials.find((c) => c.email.toLowerCase() === normalized);
    if (!credential || credential.password !== password) {
      // Deliberately non-specific: never reveal whether the account exists.
      throw unauthorized('No active account was found with the supplied credentials.');
    }
    const user = db.users.find((u) => u.id === credential.userId);
    if (!user || !user.isActive) {
      throw unauthorized('This account is not active. Contact the attachment office.');
    }
    user.lastLogin = nowISO();
    const session = buildSession(db, user);
    setSession(session);
    return session;
  })
  );
}

/** Demo convenience: sign in as a seeded persona without typing the shared password. */
export function loginAsDemo(email: string): Promise<Session> {
  return login(email, DEMO_PASSWORD);
}

export interface StudentRegistration {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  studentNumber: string;
  university: string;
  programme: string;
  yearOfStudy: number;
}

export function registerStudent(input: StudentRegistration): Promise<Session> {
  return request(() =>
  write((db) => {
    assertEmailAvailable(db, input.email);
    const userId = nextId('u-std');
    const user: User = {
      id: userId,
      email: input.email.trim(),
      phone: input.phone,
      role: 'STUDENT',
      fullName: input.fullName,
      isActive: true,
      dateJoined: nowISO(),
      lastLogin: nowISO()
    };
    const profile: StudentProfile = {
      id: nextId('std'),
      userId,
      fullName: input.fullName,
      email: input.email.trim(),
      phone: input.phone,
      gender: null,
      dateOfBirth: null,
      address: null,
      studentNumber: input.studentNumber,
      university: input.university || UNIVERSITY,
      faculty: 'Faculty of Science, Engineering and Technology',
      department: '',
      programme: input.programme,
      yearOfStudy: input.yearOfStudy,
      expectedGraduation: '',
      bio: null,
      skills: [],
      createdAt: nowISO(),
      updatedAt: nowISO()
    };
    db.users.push(user);
    db.students.push(profile);
    db.credentials.push({ userId, email: user.email, password: input.password });
    pushNotification(db, {
      userId,
      type: 'SYSTEM',
      title: 'Welcome to AttachHub',
      message:
      'Complete your profile and upload your CV, introduction letter and insurance cover before applying.',
      link: '/student/profile'
    });
    const session = buildSession(db, user);
    setSession(session);
    return session;
  })
  );
}

export interface CompanyRegistration {
  name: string;
  email: string;
  phone: string;
  password: string;
  location: string;
  town: string;
  industry: string;
}

export function registerCompany(input: CompanyRegistration): Promise<Session> {
  return request(() =>
  write((db) => {
    assertEmailAvailable(db, input.email);
    const userId = nextId('u-co');
    const user: User = {
      id: userId,
      email: input.email.trim(),
      phone: input.phone,
      role: 'COMPANY',
      fullName: input.name,
      isActive: true,
      dateJoined: nowISO(),
      lastLogin: nowISO()
    };
    const profile: CompanyProfile = {
      id: nextId('co'),
      userId,
      name: input.name,
      email: input.email.trim(),
      phone: input.phone,
      industry: input.industry,
      location: input.location,
      town: input.town,
      website: null,
      registrationNumber: null,
      description: '',
      logoText: initials(input.name),
      verificationStatus: 'REGISTERED',
      createdAt: nowISO()
    };
    db.users.push(user);
    db.companies.push(profile);
    db.credentials.push({ userId, email: user.email, password: input.password });
    pushNotification(db, {
      userId,
      type: 'COMPANY',
      title: 'Complete your verification',
      message:
      'Submit your registration details for university verification. Opportunities can only be published once your organisation is verified.',
      link: '/company/profile'
    });
    const session = buildSession(db, user);
    setSession(session);
    return session;
  })
  );
}

function assertEmailAvailable(db: Database, email: string) {
  const normalized = email.trim().toLowerCase();
  if (db.credentials.some((c) => c.email.toLowerCase() === normalized)) {
    throw badRequest({ email: ['An account with this email address already exists.'] });
  }
}

function initials(name: string) {
  return name.
  split(/\s+/).
  filter(Boolean).
  slice(0, 2).
  map((w) => w[0]?.toUpperCase() ?? '').
  join('');
}

/** Coordinator and supervisor accounts are never created through public registration. */
export const PUBLIC_REGISTRATION_ROLES: UserRole[] = ['STUDENT', 'COMPANY'];

export function refresh(): Promise<Session> {
  return request(() => {
    const session = getSession();
    if (!session || isExpired(session.tokens.refresh)) {
      setSession(null);
      throw unauthorized('Your session has expired. Please sign in again.');
    }
    const renewed: Session = { ...session, tokens: issueTokens(session.user.id) };
    setSession(renewed);
    return renewed;
  });
}

export function logout(): Promise<void> {
  return request(() => {
    setSession(null);
  });
}

export function me(): Promise<Session> {
  return request(() => {
    const session = getSession();
    if (!session) throw unauthorized();
    return session;
  });
}

/**
 * Password reset is architected but not delivered in this build: the backend issues a
 * signed, single-use token by email. The UI collects the address and reports the
 * outcome without confirming whether the account exists.
 */
export function requestPasswordReset(email: string): Promise<{detail: string;}> {
  return request(() => {
    if (!email.includes('@')) {
      throw badRequest({ email: ['Enter a valid email address.'] });
    }
    return {
      detail:
      'If an account exists for that address, a reset link has been sent. Reset delivery is handled by the backend email service.'
    };
  });
}

export function changeOwnPassword(currentPassword: string, newPassword: string): Promise<void> {
  return request(() =>
  write((db) => {
    const session = getSession();
    if (!session) throw unauthorized();
    const credential = db.credentials.find((c) => c.userId === session.user.id);
    if (!credential) throw notFound('Account not found.');
    if (credential.password !== currentPassword) {
      throw badRequest({ currentPassword: ['Your current password is incorrect.'] });
    }
    if (newPassword.length < 8) {
      throw badRequest({ newPassword: ['Password must be at least 8 characters.'] });
    }
    credential.password = newPassword;
  })
  );
}

/** All seeded accounts, for the demo sign-in panel. */
export function demoAccounts() {
  return read((db) =>
  db.users.map((u) => ({
    email: u.email,
    fullName: u.fullName,
    role: u.role
  }))
  );
}