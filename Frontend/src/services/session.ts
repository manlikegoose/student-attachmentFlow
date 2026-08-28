/**
 * Session handling.
 *
 * Stands in for SimpleJWT. Tokens are opaque strings with a decodable expiry so that
 * expiry / refresh handling can be exercised end to end. When the real backend lands,
 * only `issueTokens` and `isExpired` are replaced — the shape the app consumes is
 * identical to a SimpleJWT access/refresh pair.
 */

import type { AuthTokens } from '../types/api';
import { forbidden, unauthorized } from '../types/api';
import type { UserRole } from '../types/enums';
import type { User } from '../types/models';
import type { Actor } from '../domain/rules';

export interface Session {
  user: User;
  role: UserRole;
  /** Role profile id: std-*, co-*, sup-* or coord-*. */
  profileId: string;
  tokens: AuthTokens;
}

const SESSION_KEY = 'attachhub.session.v1';

const ACCESS_TTL_MS = 30 * 60 * 1000;
const REFRESH_TTL_MS = 24 * 60 * 60 * 1000;

export function issueTokens(userId: string): AuthTokens {
  const now = Date.now();
  return {
    access: encode({ sub: userId, type: 'access', exp: now + ACCESS_TTL_MS }),
    refresh: encode({ sub: userId, type: 'refresh', exp: now + REFRESH_TTL_MS })
  };
}

interface TokenPayload {
  sub: string;
  type: 'access' | 'refresh';
  exp: number;
}

function encode(payload: TokenPayload): string {
  return btoa(JSON.stringify(payload)).replace(/=+$/, '');
}

export function decode(token: string): TokenPayload | null {
  try {
    return JSON.parse(atob(token)) as TokenPayload;
  } catch {
    return null;
  }
}

export function isExpired(token: string): boolean {
  const payload = decode(token);
  if (!payload) return true;
  return payload.exp <= Date.now();
}

let current: Session | null = restore();

function restore(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (isExpired(parsed.tokens.refresh)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getSession(): Session | null {
  return current;
}

export function setSession(session: Session | null) {
  current = session;
  if (typeof window === 'undefined') return;
  if (session) {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    window.sessionStorage.removeItem(SESSION_KEY);
  }
}

/**
 * The server-side equivalent of `request.user`. Every protected service call starts
 * here, which is what makes the permission checks in `domain/rules` reachable.
 */
export function requireActor(): Actor & {userId: string;fullName: string;} {
  const session = current;
  if (!session) throw unauthorized();
  if (isExpired(session.tokens.access)) {
    throw unauthorized('Your session has expired. Please sign in again.');
  }
  return {
    role: session.role,
    profileId: session.profileId,
    userId: session.user.id,
    fullName: session.user.fullName
  };
}

export function requireRole(...roles: UserRole[]) {
  const actor = requireActor();
  if (!roles.includes(actor.role)) {
    throw forbidden();
  }
  return actor;
}