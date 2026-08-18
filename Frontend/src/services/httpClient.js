import { API_BASE_URL, SESSION_STORAGE_KEY } from './config';

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

const STATUS_MESSAGES = {
  400: 'הבקשה אינה תקינה',
  401: 'ההתחברות פגה — יש להתחבר מחדש',
  403: 'אין הרשאה לפעולה זו',
  404: 'הפריט לא נמצא',
  409: 'הפעולה מתנגשת עם המצב הנוכחי',
  500: 'שגיאת שרת — נסו שוב',
};

let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export function readStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeStoredSession(session) {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

export function clearStoredSession() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

function authHeader() {
  const token = readStoredSession()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function errorMessage(status, body) {
  if (body && typeof body === 'object') {
    const detail = body.detail || body.title;
    if (detail && typeof detail === 'string') return detail;
  }
  return STATUS_MESSAGES[status] || `שגיאה בלתי צפויה (${status})`;
}

export async function request(path, { method = 'GET', body, auth = true, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) Object.assign(headers, authHeader());

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (cause) {
    throw new ApiError('אין חיבור לשרת — בדקו שהשרת פועל', 0, { cause: String(cause) });
  }

  if (response.status === 204) return null;

  const parsed = await parseBody(response);

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredSession();
      if (unauthorizedHandler) unauthorizedHandler();
    }
    throw new ApiError(errorMessage(response.status, parsed), response.status, parsed);
  }

  return parsed;
}

export const http = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  del: (path, options) => request(path, { ...options, method: 'DELETE' }),
};

export async function getAllPages(path, { pageSize = 100, maxPages = 20, ...options } = {}) {
  const separator = path.includes('?') ? '&' : '?';
  const items = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const result = await http.get(`${path}${separator}page=${page}&pageSize=${pageSize}`, options);
    if (Array.isArray(result)) return result;

    items.push(...(result?.items ?? []));

    const totalPages = result?.totalPages ?? 1;
    if (page >= totalPages) break;
  }

  return items;
}
