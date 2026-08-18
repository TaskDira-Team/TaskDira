import { getAllPages } from './httpClient';
import { readStoredSession, writeStoredSession } from './httpClient';
import { store } from './store';

/**
 * The real (integer) household id used to build household-scoped API URLs.
 *
 * This is deliberately separate from `getActiveHouseholdId()`, which keeps
 * returning the mock household id so the domains still on mock (tasks,
 * rewards) go on filtering their seed data correctly. The two converge when
 * the households domain is wired.
 */
export async function getRealHouseholdId() {
  if (store.realHouseholdId) return store.realHouseholdId;

  // The server is the only authority on which households the caller belongs to.
  // A remembered id is a preference, never a source of truth: trusting one from
  // a previous session sends writes to a household the user cannot access, and
  // the API rejects them with a 404 that reads like a silent failure.
  const households = await getAllPages('/api/households');
  if (households.length === 0) return null;

  const session = readStoredSession();
  const remembered = session?.householdId;
  const chosen = households.find((h) => h.id === remembered) ?? households[0];

  store.realHouseholdId = chosen.id;
  if (session && session.householdId !== chosen.id) {
    writeStoredSession({ ...session, householdId: chosen.id });
  }
  return chosen.id;
}

export function setRealHouseholdId(householdId) {
  store.realHouseholdId = householdId ?? null;
}

export function clearRealHouseholdId() {
  store.realHouseholdId = null;
}
