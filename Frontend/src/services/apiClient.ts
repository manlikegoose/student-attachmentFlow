import { getSession, setSession, isExpired } from './session';

const API_BASE = 'http://localhost:8000/api';

async function refreshTokens(): Promise<string | null> {
  const session = getSession();
  if (!session || !session.tokens.refresh || isExpired(session.tokens.refresh)) {
    return null;
  }
  
  try {
    const res = await fetch(`${API_BASE}/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: session.tokens.refresh }),
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    session.tokens.access = data.access;
    setSession(session);
    return data.access;
  } catch {
    return null;
  }
}

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const session = getSession();
  let token = session?.tokens.access;

  // Optimistic refresh check
  if (token && isExpired(token)) {
    token = (await refreshTokens()) || undefined;
    if (!token) {
      setSession(null);
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('auth:logout'));
    }
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401
  if (response.status === 401 && token) {
    token = (await refreshTokens()) || undefined;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });
    } else {
      setSession(null);
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('auth:logout'));
    }
  }

  return response;
}
