import {
  DEFAULT_AVATAR_CONFIG as DEFAULT_AVATAR_STATE,
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
  realHouseholdId: null,
  // Off until the real proof pipeline exists; the mock proof flow cannot gate
  // completion because nothing persists a PendingApproval state.
  proofApprovalRequired: false,
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
  const raw = getRawUser(store.currentUser.id);
  if (!raw) return store.currentUser;
  // The raw record holds no role fields, so permission helpers would read every
  // caller as a non-admin. Carry the resolved role from the enriched user.
  return {
    ...raw,
    userRole: store.currentUser.userRole,
    role: store.currentUser.role,
    permissionRole: store.currentUser.permissionRole,
    isAdmin: store.currentUser.isAdmin,
  };
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

export function upsertUser(user) {
  const index = store.users.findIndex((u) => u.id === user.id);
  if (index === -1) {
    store.users.push(user);
    return store.users[store.users.length - 1];
  }
  store.users[index] = { ...store.users[index], ...user };
  return store.users[index];
}

export function ensureMembership(userId, householdId = getActiveHouseholdId(), role = 'Member') {
  let membership = store.members.find((m) => m.userId === userId && m.householdId === householdId);
  if (!membership) {
    membership = { householdId, userId, role, joinedAt: new Date().toISOString() };
    store.members.push(membership);
  }
  return membership;
}

export function ensureLedgerEntry(userId, householdId = getActiveHouseholdId()) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  let ledger = store.pointsLedger.find(
    (l) => l.userId === userId && l.householdId === householdId && l.month === month && l.year === year
  );
  if (!ledger) {
    ledger = {
      id: `ledger-${userId}-${householdId}`,
      householdId,
      userId,
      totalPoints: 0,
      balance: 0,
      rank: 99,
      month,
      year,
    };
    store.pointsLedger.push(ledger);
    recalculateRanks(householdId);
  }
  return ledger;
}

/**
 * Bridges a real backend user into the in-memory cache so the domains still on
 * mock (tasks, rewards, leaderboard) keep resolving membership, role and points.
 */
export function hydrateAuthenticatedUser({ id, fullName, email, avatarState, createdAt, role, familyRole }) {
  const householdId = getActiveHouseholdId();
  const existing = getRawUser(id);

  const user = upsertUser({
    ...(existing ?? {}),
    id,
    fullName,
    email,
    avatarState: avatarState ?? existing?.avatarState ?? DEFAULT_AVATAR_STATE,
    createdAt: createdAt ?? existing?.createdAt ?? new Date().toISOString(),
    familyRole: familyRole ?? existing?.familyRole ?? null,
    streakDays: existing?.streakDays ?? 0,
    tasksCompletedThisMonth: existing?.tasksCompletedThisMonth ?? 0,
    onboarded: true,
  });

  ensureMembership(id, householdId, role ?? 'Admin');
  ensureLedgerEntry(id, householdId);

  return user;
}

/**
 * Mirrors a batch of real household members into the cache so `enrichUser`
 * resolves role, points and rank while other domains are still on mock.
 */
export function hydrateHouseholdMembers(entries) {
  const householdId = getActiveHouseholdId();

  const hydrated = entries.map(({ user, role, joinedAt, points, balance }) => {
    const existing = getRawUser(user.id);
    const record = upsertUser({
      ...(existing ?? {}),
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      avatarState: user.avatarState ?? existing?.avatarState ?? DEFAULT_AVATAR_STATE,
      createdAt: user.createdAt ?? existing?.createdAt ?? new Date().toISOString(),
      familyRole: user.familyRole ?? existing?.familyRole ?? null,
      streakDays: existing?.streakDays ?? 0,
      tasksCompletedThisMonth: existing?.tasksCompletedThisMonth ?? 0,
      onboarded: true,
    });

    const membership = ensureMembership(user.id, householdId, role);
    membership.role = role;
    if (joinedAt) membership.joinedAt = joinedAt;

    const ledger = ensureLedgerEntry(user.id, householdId);
    if (typeof points === 'number') ledger.totalPoints = points;
    if (typeof balance === 'number') ledger.balance = balance;

    return record;
  });

  recalculateRanks(householdId);
  return hydrated;
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
