export const API_BASE_URL =
  import.meta.env?.VITE_API_URL?.replace(/\/+$/, '') || 'http://localhost:5188';

function flag(name, fallback) {
  const raw = import.meta.env?.[name];
  if (raw === undefined || raw === '') return fallback;
  return raw === 'true' || raw === '1';
}

export const USE_REAL_API = {
  auth: flag('VITE_REAL_AUTH', true),
  users: flag('VITE_REAL_USERS', true),
  households: flag('VITE_REAL_HOUSEHOLDS', true),
  tasks: flag('VITE_REAL_TASKS', true),
  rewards: flag('VITE_REAL_REWARDS', true),
};

/**
 * On by default, so no env file is needed to run the new shell. The old
 * light-theme app remains reachable as an escape hatch: VITE_NEW_UI=false.
 */
export const USE_NEW_UI = flag('VITE_NEW_UI', true);

export const SESSION_STORAGE_KEY = 'taskdira_session_v1';
