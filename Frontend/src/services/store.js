import {
  HOUSEHOLD,
  INITIAL_USERS,
  INITIAL_TASKS,
  INITIAL_MEMBERS,
  INITIAL_POINTS_LEDGER,
  INITIAL_CATEGORIES,
  INITIAL_REWARDS,
  INITIAL_NOTIFICATIONS,
} from '../data/mockData';

export const store = {
  households: [structuredClone(HOUSEHOLD)],
  activeHouseholdId: HOUSEHOLD.id,
  household: null,
  users: structuredClone(INITIAL_USERS),
  members: structuredClone(INITIAL_MEMBERS),
  tasks: structuredClone(INITIAL_TASKS),

  taskArchive: [],

  monthlyLeaderboardHistory: [],

  lastMonthlyResetKey: null,
  categories: structuredClone(INITIAL_CATEGORIES),
  pointsLedger: structuredClone(INITIAL_POINTS_LEDGER),
  rewards: structuredClone(INITIAL_REWARDS),
  notifications: structuredClone(INITIAL_NOTIFICATIONS),
  currentUser: null,
  sessionToken: null,
};

store.household = store.households[0];

export const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

export const generateId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function getRawUser(userId) {
  return store.users.find((u) => u.id === userId);
}

export function getActiveHouseholdId() {
  return store.activeHouseholdId || store.households[0]?.id;
}

export function getActiveHousehold() {
  const id = getActiveHouseholdId();
  return store.households.find((h) => h.id === id) || store.households[0];
}

export function setActiveHousehold(householdId) {
  const h = store.households.find((x) => x.id === householdId);
  if (!h) throw new Error('דירה/משפחה לא נמצאה');
  store.activeHouseholdId = householdId;
  store.household = h;
  return h;
}

export function activateHouseholdForUser(userId) {
  const membership = store.members.find((m) => m.userId === userId);
  if (membership) return setActiveHousehold(membership.householdId);
  return getActiveHousehold();
}

export function assertCurrentUser() {
  if (!store.currentUser) throw new Error('יש להתחבר למערכת');
  return getRawUser(store.currentUser.id);
}

export function recalculateRanks(householdId = getActiveHouseholdId()) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const rows = store.pointsLedger
    .filter((l) => l.householdId === householdId && l.month === month && l.year === year)
    .sort((a, b) => b.totalPoints - a.totalPoints);
  rows.forEach((row, i) => {
    row.rank = i + 1;
  });
}

export function seedHouseholdDefaults(householdId) {
  INITIAL_CATEGORIES.forEach((template) => {
    const exists = store.categories.some(
      (c) => c.id === template.id && c.householdId === householdId
    );
    if (!exists) {
      store.categories.push({ ...structuredClone(template), householdId });
    }
  });

  INITIAL_REWARDS.forEach((r) => {
    store.rewards.push({
      ...structuredClone(r),
      id: generateId('reward'),
      householdId,
      requiredPoints: r.requiredPoints ?? r.cost ?? 50,
      cost: r.cost ?? r.requiredPoints ?? 50,
      unlocked: false,
      category: r.category || 'tier1',
      code: r.code || `CODE-${Date.now().toString(36).toUpperCase()}`,
    });
  });
}
