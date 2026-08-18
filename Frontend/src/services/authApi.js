import { http, clearStoredSession, readStoredSession, writeStoredSession } from './httpClient';

function parseAvatarState(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function toSession(payload) {
  return {
    token: payload.token,
    userId: payload.userId,
    expiresAt: payload.expiresAt,
    householdId: payload.householdId ?? null,
    fullName: payload.fullName,
    email: payload.email,
  };
}

export async function loginRequest(email, password) {
  const payload = await http.post('/api/auth/login', { email, password }, { auth: false });
  const session = toSession(payload);
  writeStoredSession(session);
  return session;
}

export async function registerRequest({ fullName, email, password, householdName }) {
  const payload = await http.post(
    '/api/auth/register',
    { fullName, email, password, householdName },
    { auth: false }
  );
  const session = toSession(payload);
  writeStoredSession(session);
  return { ...session, householdName: payload.householdName };
}

export async function logoutRequest() {
  try {
    await http.post('/api/auth/logout');
  } catch {
    // a dead or already-invalid token still ends the local session
  } finally {
    clearStoredSession();
  }
}

export async function fetchCurrentUser() {
  const session = readStoredSession();
  if (!session?.token || !session?.userId) return null;

  const user = await http.get(`/api/users/${session.userId}`);
  if (!user) return null;

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    avatarState: parseAvatarState(user.avatarState),
    createdAt: user.createdAt,
    session,
  };
}

export function storedSession() {
  return readStoredSession();
}
