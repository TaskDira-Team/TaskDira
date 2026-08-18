import { DEFAULT_AVATAR_CONFIG, TASK_STATUSES, ROLES, HOUSEHOLD } from '../data/mockData';
import { enrichReward } from '../data/gamification';
import { readFileAsDataUrl, buildCustomAvatarConfig } from './avatarService';
import {
  isAdmin,
  canEditTaskFully,
  canDeleteTask,
  canChangePoints,
  canSetDueDate,
  canReassign,
  canMoveTask,
  canClaimTask,
  canApproveTask,
  canSubmitProof,
} from '../utils/permissions';
import { store, delay, generateId, getRawUser, assertCurrentUser, recalculateRanks, setActiveHousehold, activateHouseholdForUser, seedHouseholdDefaults, getActiveHouseholdId, getActiveHousehold, hydrateAuthenticatedUser, upsertUser, hydrateHouseholdMembers } from './store';
import { USE_REAL_API } from './config';
import { loginRequest, registerRequest, logoutRequest, fetchCurrentUser, storedSession } from './authApi';
import { updateUserProfile, fetchHouseholdRoster, fetchBalance } from './usersRemote';
import { setRealHouseholdId, clearRealHouseholdId } from './householdContext';
import {
  fetchHousehold,
  findUserByEmail,
  addMember,
  updateMemberRole,
  removeMember as removeMemberRemote,
} from './householdsRemote';
import { resetCategoryCache } from './tasksRemote';
import {
  fetchRewardsRemote,
  fetchRewardRemote,
  createRewardRemote,
  updateRewardRemote,
  deleteRewardRemote,
  claimRewardRemote,
} from './rewardsRemote';
import { enrichUser, getLedgerEntry } from './mappers';
import {
  fetchUsers,
  updateUserPoints,
  deductPoints,
  getLeaderboard,
  resetMonthlyScores,
  ensureMonthlyRollover,
  getMonthlyLeaderboardHistory,
} from './usersApi';
import {
  fetchTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  submitTaskProof,
  approveTask,
  rejectTask,
  claimTask,
  deleteTask,
  toggleSubItem,
  addSubItems,
} from './tasksApi';
import { processAssistantMessage, botCreateTask, botDeleteTask, botCompleteTask, verifyAssistantPin, ASSISTANT_PIN } from './assistantBot';

export {
  fetchTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  submitTaskProof,
  approveTask,
  rejectTask,
  fetchUsers,
  updateUserPoints,
  toggleSubItem,
  addSubItems,
};

export { getUserLevel, getActivityBadge, getGlowRing } from '../data/gamification';

const SESSION_KEY = 'taskdira_session_v1';

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function removeStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function saveSession(userId, householdId) {
  const hid = householdId || getActiveHouseholdId();
  const member = store.members.find((m) => m.userId === userId && m.householdId === hid);
  const token = `td.mock.${userId}.${Date.now()}`;
  writeStorage(
    SESSION_KEY,
    JSON.stringify({
      token,
      userId,
      householdId: hid,
      role: member?.role ?? ROLES.MEMBER,
    })
  );
  store.sessionToken = token;
  return token;
}

function clearSession() {
  removeStorage(SESSION_KEY);
  store.sessionToken = null;
}

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function formatHouseholdDisplay(h) {
  return h.address ? `${h.name} — ${h.address}` : h.name;
}

/**
 * Membership errors carry meaning the generic HTTP map cannot express: 403 is a
 * member reaching for an admin action, 409 is an admin trying to demote
 * themselves. Anything else keeps the message the client already produced.
 */
function toMemberError(err) {
  if (err?.status === 403) return new Error('אין הרשאה לפעולה זו');
  if (err?.status === 409) {
    const detail = err.body?.detail ?? '';
    if (detail.includes('own admin role')) {
      return new Error('לא ניתן להסיר את הרשאת המנהל של עצמך');
    }
    return new Error(detail || err.message);
  }
  if (err?.status === 404) return new Error('המשתמש אינו חבר בבית');
  return err;
}

function adoptRealUser(session, extra = {}) {
  const raw = hydrateAuthenticatedUser({
    id: session.userId,
    fullName: session.fullName,
    email: session.email,
    ...extra,
  });
  store.currentUser = {
    ...enrichUser(raw),
    token: session.token,
    activeHouseholdId: getActiveHouseholdId(),
  };
  store.sessionToken = session.token;
  return store.currentUser;
}

export const auth = {
  async login(email, password) {
    if (USE_REAL_API.auth) {
      clearRealHouseholdId();
      resetCategoryCache();
      const session = await loginRequest(email, password);
      return adoptRealUser(session);
    }
    await delay();
    const user = store.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === password
    );
    if (!user) throw new Error('אימייל או סיסמה שגויים');
    activateHouseholdForUser(user.id);
    const token = saveSession(user.id, getActiveHouseholdId());
    store.currentUser = enrichUser(user);
    store.currentUser.token = token;
    store.currentUser.activeHouseholdId = getActiveHouseholdId();
    return store.currentUser;
  },

  async register(data) {
    if (USE_REAL_API.auth) {
      const householdName = (data.householdName || '').trim();
      if (!householdName) throw new Error('נא להזין שם דירה / משפחה');

      const session = await registerRequest({
        fullName: (data.fullName || data.name || '').trim(),
        email: (data.email || '').trim(),
        password: data.password || data.passwordHash,
        householdName,
      });

      setRealHouseholdId(session.householdId);
      return adoptRealUser(session, {
        avatarState: data.avatarState || data.avatarConfig || DEFAULT_AVATAR_CONFIG,
        role: ROLES.ADMIN,
      });
    }
    await delay(600);
    if (store.users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      throw new Error('כתובת האימייל כבר רשומה במערכת');
    }
    if (!(data.householdName || '').trim()) {
      throw new Error('נא להזין שם דירה / משפחה');
    }

    const now = new Date().toISOString();
    const householdId = generateId('household');
    const newHousehold = {
      id: householdId,
      name: data.householdName.trim(),
      adminUserId: null,
      createdAt: now,
      address: (data.address || '').trim(),
      requireProofApproval: false,
      monthlyGoalPoints: 400,
    };
    store.households.push(newHousehold);
    setActiveHousehold(householdId);
    seedHouseholdDefaults(householdId);

    const avatarState = data.avatarState || data.avatarConfig || DEFAULT_AVATAR_CONFIG;
    const newUser = {
      id: generateId('user'),
      fullName: (data.fullName || data.name || '').trim(),
      email: data.email.trim(),
      passwordHash: data.password || data.passwordHash,
      avatarState,
      createdAt: now,
      familyRole: data.familyRole || data.role || 'roommate',
      streakDays: 1,
      tasksCompletedThisMonth: 0,
      onboarded: true,
    };
    store.users.push(newUser);

    store.members.push({
      householdId,
      userId: newUser.id,
      role: ROLES.ADMIN,
      joinedAt: now,
    });
    newHousehold.adminUserId = newUser.id;

    const d = new Date();
    store.pointsLedger.push({
      id: `ledger-${newUser.id}-${householdId}`,
      householdId,
      userId: newUser.id,
      totalPoints: 0,
      rank: 1,
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    });
    recalculateRanks(householdId);

    const token = saveSession(newUser.id, householdId);
    store.currentUser = enrichUser(newUser);
    store.currentUser.token = token;
    store.currentUser.activeHouseholdId = householdId;
    return store.currentUser;
  },

  async refresh() {
    if (USE_REAL_API.auth) {
      const session = storedSession();
      if (!session?.token) {
        store.currentUser = null;
        store.sessionToken = null;
        return null;
      }
      try {
        const me = await fetchCurrentUser();
        if (!me) {
          store.currentUser = null;
          store.sessionToken = null;
          return null;
        }
        return adoptRealUser(
          { ...session, fullName: me.fullName, email: me.email },
          { avatarState: me.avatarState, createdAt: me.createdAt }
        );
      } catch {
        store.currentUser = null;
        store.sessionToken = null;
        return null;
      }
    }
    await delay(100);
    const session = readSession();
    if (!session?.userId) {
      store.currentUser = null;
      return null;
    }
    const raw = getRawUser(session.userId);
    if (!raw) {
      clearSession();
      return null;
    }
    if (session.householdId) {
      try {
        setActiveHousehold(session.householdId);
      } catch {
        activateHouseholdForUser(session.userId);
      }
    } else {
      activateHouseholdForUser(session.userId);
    }
    await ensureMonthlyRollover();
    store.currentUser = {
      ...enrichUser(raw),
      token: session.token,
      activeHouseholdId: getActiveHouseholdId(),
    };
    store.sessionToken = session.token;
    return store.currentUser;
  },

  async logout() {
    if (USE_REAL_API.auth) {
      await logoutRequest();
      store.currentUser = null;
      store.sessionToken = null;
      clearRealHouseholdId();
      return;
    }
    await delay(200);
    clearSession();
    store.currentUser = null;
    store.sessionToken = null;
    try {
      setActiveHousehold(HOUSEHOLD.id);
    } catch {
      store.activeHouseholdId = null;
      store.household = store.households[0] || null;
    }
  },

  getSessionToken() {
    if (USE_REAL_API.auth) return storedSession()?.token ?? null;
    return readSession()?.token ?? store.sessionToken ?? null;
  },
};

export const household = {
  async getHousehold() {
    if (USE_REAL_API.households) {
      const real = await fetchHousehold();
      if (real) return real;
    }
    await delay(150);
    const h = getActiveHousehold();
    return {
      ...h,
      displayName: formatHouseholdDisplay(h),
      memberCount: store.members.filter((m) => m.householdId === h.id).length,
      activeHouseholdId: h.id,
    };
  },

  async getMembers() {
    if (USE_REAL_API.households) {
      const roster = await fetchHouseholdRoster();
      hydrateHouseholdMembers(roster);
      return roster.map((entry) => ({
        householdId: store.realHouseholdId,
        userId: entry.user.id,
        role: entry.role,
        joinedAt: entry.joinedAt,
        user: enrichUser(getRawUser(entry.user.id)),
      }));
    }
    await delay();
    const hid = getActiveHouseholdId();
    return store.members
      .filter((m) => m.householdId === hid)
      .map((m) => {
        const u = enrichUser(getRawUser(m.userId));
        return { ...m, user: u };
      });
  },

  async inviteUser({ email, role = ROLES.MEMBER }) {
    if (USE_REAL_API.households) {
      if (!store.currentUser) throw new Error('יש להתחבר למערכת');
      if (!isAdmin(store.currentUser)) throw new Error('רק מנהל יכול להזמין משתמשים');

      const found = await findUserByEmail(email);
      if (!found) {
        throw new Error('הזמנת משתמש חדש – יש להירשם תחילה עם אותו אימייל');
      }

      const roster = await fetchHouseholdRoster();
      if (roster.some((entry) => entry.user.id === found.id)) {
        throw new Error('המשתמש כבר חבר בבית');
      }

      await addMember(found.id, role);

      const refreshed = await fetchHouseholdRoster();
      hydrateHouseholdMembers(refreshed);
      const raw = getRawUser(found.id);
      return raw ? enrichUser(raw) : null;
    }
    await delay(500);
    assertCurrentUser();
    if (!isAdmin(store.currentUser)) throw new Error('רק מנהל יכול להזמין משתמשים');
    const hid = getActiveHouseholdId();
    const existing = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      if (store.members.some((m) => m.userId === existing.id && m.householdId === hid)) {
        throw new Error('המשתמש כבר חבר בבית');
      }
      store.members.push({
        householdId: hid,
        userId: existing.id,
        role,
        joinedAt: new Date().toISOString(),
      });
      const d = new Date();
      if (!store.pointsLedger.some((l) => l.userId === existing.id && l.householdId === hid)) {
        store.pointsLedger.push({
          id: `ledger-${existing.id}-${hid}`,
          householdId: hid,
          userId: existing.id,
          totalPoints: 0,
          rank: 99,
          month: d.getMonth() + 1,
          year: d.getFullYear(),
        });
        recalculateRanks(hid);
      }
      return enrichUser(existing);
    }
    throw new Error('הזמנת משתמש חדש – יש להירשם תחילה עם אותו אימייל');
  },

  async changeMemberRole(userId, role) {
    if (USE_REAL_API.households) {
      if (!store.currentUser) throw new Error('יש להתחבר למערכת');
      if (!isAdmin(store.currentUser)) throw new Error('רק מנהל יכול לשנות תפקידים');

      try {
        await updateMemberRole(userId, role);
      } catch (err) {
        throw toMemberError(err);
      }

      const refreshed = await fetchHouseholdRoster();
      hydrateHouseholdMembers(refreshed);
      return refreshed;
    }
    await delay(200);
    const hid = getActiveHouseholdId();
    const membership = store.members.find((m) => m.userId === userId && m.householdId === hid);
    if (!membership) throw new Error('המשתמש אינו חבר בבית');
    membership.role = role;
    return store.members.filter((m) => m.householdId === hid);
  },

  async removeMember(userId) {
    if (USE_REAL_API.households) {
      const actor = store.currentUser;
      if (!actor) throw new Error('יש להתחבר למערכת');
      // The API allows anyone to remove themselves; removing someone else is
      // an admin action.
      const isSelf = actor.id === userId;
      if (!isSelf && !isAdmin(actor)) throw new Error('רק מנהל יכול להסיר חברים');

      try {
        await removeMemberRemote(userId);
      } catch (err) {
        throw toMemberError(err);
      }

      if (isSelf) return [];

      const refreshed = await fetchHouseholdRoster();
      hydrateHouseholdMembers(refreshed);
      return refreshed;
    }
    await delay(200);
    const hid = getActiveHouseholdId();
    store.members = store.members.filter((m) => !(m.userId === userId && m.householdId === hid));
    return store.members.filter((m) => m.householdId === hid);
  },

  async resetMonthlyScore() {
    return resetMonthlyScores();
  },

  async switchHousehold(householdId) {
    if (USE_REAL_API.households) {
      setRealHouseholdId(householdId);
      const refreshed = await fetchHouseholdRoster();
      hydrateHouseholdMembers(refreshed);
      return fetchHousehold();
    }
    setActiveHousehold(householdId);
    const user = assertCurrentUser();
    saveSession(user.id, householdId);
    store.currentUser = enrichUser(user);
    return getActiveHousehold();
  },
};

export const tasks = {
  getTasks: fetchTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  submitTaskProof,
  approveTask,
  rejectTask,
  claimTask,
  toggleSubItem,
  addSubItems,
};

export const gamification = {
  getLeaderboard,
  async redeemReward(rewardId) {
    if (USE_REAL_API.rewards) {
      const actor = assertCurrentUser();
      let claimed;
      try {
        claimed = await claimRewardRemote(rewardId);
      } catch (err) {
        if (err?.status === 409) {
          throw new Error(
            err.body?.detail?.includes('already been claimed')
              ? 'הפרס כבר מומש'
              : 'אין מספיק נקודות למימוש פרס זה'
          );
        }
        if (err?.status === 404) throw new Error('פרס לא נמצא');
        throw err;
      }

      // The spend row lands server-side, so the wallet is re-read rather than
      // decremented locally. XP is untouched by a redemption.
      const ledger = getLedgerEntry(actor.id);
      if (ledger) ledger.balance = await fetchBalance(actor.id);

      const raw = getRawUser(actor.id);
      if (raw && store.currentUser?.id === actor.id) {
        store.currentUser = {
          ...enrichUser(raw),
          token: store.currentUser.token,
          activeHouseholdId: store.currentUser.activeHouseholdId,
        };
      }

      const reward = enrichReward(claimed ?? { id: rewardId }, ledger?.totalPoints ?? 0);
      return { reward, user: store.currentUser };
    }
    await delay(500);
    const actor = assertCurrentUser();
    const ledger = getLedgerEntry(actor.id);
    const monthlyPoints = ledger?.totalPoints ?? 0;
    const raw = store.rewards.find((r) => r.id === rewardId);
    if (!raw) throw new Error('פרס לא נמצא');
    const reward = enrichReward(raw, monthlyPoints);
    if (!reward.unlocked) {
      throw new Error(`הפרס נעול — נדרשות ${reward.requiredPoints} נקודות חודשיות`);
    }
    const user = await deductPoints(actor.id, reward.cost);
    return { reward, user };
  },
  async getRewards() {
    if (USE_REAL_API.rewards) {
      const actor = assertCurrentUser();
      const ledger = getLedgerEntry(actor.id);
      const xpPoints = ledger?.totalPoints ?? 0;
      const balance = ledger?.balance ?? xpPoints;
      const rewards = await fetchRewardsRemote();
      return rewards
        .map((r) => enrichReward(r, xpPoints, balance))
        .sort((a, b) => a.requiredPoints - b.requiredPoints);
    }
    await delay(200);
    const actor = assertCurrentUser();
    const hid = getActiveHouseholdId();
    const ledger = getLedgerEntry(actor.id);
    const monthlyPoints = ledger?.totalPoints ?? 0;
    return store.rewards
      .filter((r) => r.householdId === hid)
      .map((r) => enrichReward(r, monthlyPoints))
      .sort((a, b) => a.requiredPoints - b.requiredPoints);
  },
  async createReward(data) {
    if (USE_REAL_API.rewards) {
      assertCurrentUser();
      if (!isAdmin(store.currentUser)) throw new Error('רק מנהל הבית יכול ליצור פרסים');
      const requiredPoints = Number(data.requiredPoints ?? data.cost) || 10;
      const created = await createRewardRemote({
        title: (data.title || '').trim(),
        requiredPoints,
        emoji: data.emoji,
        description: data.description?.trim(),
        cost: Number(data.cost ?? requiredPoints) || requiredPoints,
        category: data.category,
      });
      return enrichReward(created, 0);
    }
    assertCurrentUser();
    if (!isAdmin(store.currentUser)) throw new Error('רק מנהל הבית יכול ליצור פרסים');
    await delay();
    const requiredPoints = Number(data.requiredPoints ?? data.cost) || 10;
    const reward = {
      id: generateId('reward'),
      householdId: getActiveHouseholdId(),
      title: data.title.trim(),
      emoji: data.emoji || '🎁',
      requiredPoints,
      cost: Number(data.cost) || requiredPoints,
      unlocked: false,
      category: data.category || (requiredPoints >= 200 ? 'tier3' : requiredPoints >= 100 ? 'tier2' : 'tier1'),
      code: data.code || `CODE-${Date.now().toString(36).toUpperCase()}`,
      description: data.description?.trim() || '',
    };
    store.rewards.push(reward);
    return enrichReward(reward, 0);
  },
  async updateReward(id, data) {
    if (USE_REAL_API.rewards) {
      assertCurrentUser();
      if (!isAdmin(store.currentUser)) throw new Error('רק מנהל הבית יכול לערוך פרסים');
      const current = await fetchRewardRemote(id);
      if (!current) throw new Error('פרס לא נמצא');
      const requiredPoints =
        Number(data.requiredPoints ?? current.requiredPoints) || current.requiredPoints;
      const updated = await updateRewardRemote(id, {
        title: (data.title ?? current.title).trim(),
        requiredPoints,
        emoji: data.emoji ?? current.emoji,
        description: (data.description ?? current.description)?.trim(),
        cost: Number(data.cost ?? current.cost ?? requiredPoints) || requiredPoints,
        category: data.category ?? current.category,
      });
      return enrichReward(updated ?? current, 0);
    }
    assertCurrentUser();
    if (!isAdmin(store.currentUser)) throw new Error('רק מנהל הבית יכול לערוך פרסים');
    await delay();
    const index = store.rewards.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('פרס לא נמצא');
    const next = { ...store.rewards[index], ...data };
    if (data.requiredPoints !== undefined || data.cost !== undefined) {
      next.requiredPoints = Number(data.requiredPoints ?? data.cost ?? next.requiredPoints);
      next.cost = Number(data.cost ?? data.requiredPoints ?? next.cost);
    }
    store.rewards[index] = next;
    return enrichReward(next, 0);
  },
  async deleteReward(id) {
    if (USE_REAL_API.rewards) {
      assertCurrentUser();
      if (!isAdmin(store.currentUser)) throw new Error('רק מנהל הבית יכול למחוק פרסים');
      const current = await fetchRewardRemote(id);
      if (!current) throw new Error('פרס לא נמצא');
      await deleteRewardRemote(id);
      return enrichReward(current, 0);
    }
    assertCurrentUser();
    if (!isAdmin(store.currentUser)) throw new Error('רק מנהל הבית יכול למחוק פרסים');
    await delay();
    const index = store.rewards.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('פרס לא נמצא');
    const [removed] = store.rewards.splice(index, 1);
    return { ...removed };
  },
};

export const notifications = {
  async getNotifications() {
    await delay(150);
    const uid = store.currentUser?.id;
    const hid = getActiveHouseholdId();
    return store.notifications
      .filter(
        (n) =>
          n.householdId === hid &&
          (!uid || n.userId === uid || n.userId === getActiveHousehold()?.adminUserId)
      )
      .map((n) => ({ ...n }));
  },

  async setReminder({ taskId, remindAt, message }) {
    await delay(200);
    const actor = assertCurrentUser();
    const notif = {
      id: generateId('notif'),
      householdId: getActiveHouseholdId(),
      userId: actor.id,
      type: 'reminder',
      title: 'תזכורת למשימה',
      body: message || `תזכורת למשימה ${taskId}`,
      taskId,
      remindAt: remindAt || new Date().toISOString(),
      read: false,
      createdAt: new Date().toISOString(),
    };
    store.notifications.push(notif);
    return { ...notif };
  },
};

export const api = {
  login: (email, password) => auth.login(email, password),
  registerWithOnboarding: (data) => auth.register(data),
  logout: () => auth.logout(),
  getCurrentUser: () => auth.refresh(),
  refreshCurrentUser: () => auth.refresh(),
  getSessionToken: () => auth.getSessionToken(),
  getDemoUsers: async () => {
    if (USE_REAL_API.auth) return [];
    await delay(100);
    const prev = getActiveHouseholdId();
    try {
      setActiveHousehold(HOUSEHOLD.id);
      return store.users
        .filter((u) =>
          store.members.some((m) => m.userId === u.id && m.householdId === HOUSEHOLD.id)
        )
        .map((u) => enrichUser(u));
    } finally {
      if (prev) setActiveHousehold(prev);
    }
  },

  getHousehold: () => household.getHousehold(),
  getGroup: async () => {
    const h = await household.getHousehold();
    return { id: h.id, name: h.displayName };
  },
  getMembers: () => household.getMembers(),
  inviteUser: (payload) => household.inviteUser(payload),
  changeMemberRole: (userId, role) => household.changeMemberRole(userId, role),
  removeMember: (userId) => household.removeMember(userId),
  resetMonthlyScores: () => household.resetMonthlyScore(),

  async updateProfile(userId, updates) {
    if (USE_REAL_API.users) {
      const current = getRawUser(userId);
      const fullName = (updates.fullName || updates.name || current?.fullName || '').trim();
      const avatarState = updates.avatarState || updates.avatarConfig || current?.avatarState;
      const familyRole = updates.familyRole ?? updates.role ?? current?.familyRole;

      const saved = await updateUserProfile(userId, { fullName, avatarState, familyRole });

      const raw = upsertUser({
        ...(current ?? {}),
        id: userId,
        fullName: saved?.fullName ?? fullName,
        email: saved?.email ?? current?.email,
        avatarState: saved?.avatarState ?? avatarState,
        familyRole: saved?.familyRole ?? familyRole,
      });

      if (store.currentUser?.id === userId) {
        store.currentUser = {
          ...enrichUser(raw),
          token: store.currentUser.token,
          activeHouseholdId: store.currentUser.activeHouseholdId,
        };
        return store.currentUser;
      }
      return enrichUser(raw);
    }
    await delay();
    const user = getRawUser(userId);
    if (!user) throw new Error('משתמש לא נמצא');
    if (store.currentUser?.id !== userId && !isAdmin(store.currentUser)) {
      throw new Error('אין הרשאה לעדכן פרופיל זה');
    }
    if (updates.avatarConfig || updates.avatarState) {
      user.avatarState = {
        ...DEFAULT_AVATAR_CONFIG,
        ...(updates.avatarState || updates.avatarConfig),
      };
    }
    if (updates.fullName || updates.name) {
      user.fullName = updates.fullName || updates.name;
    }
    if (store.currentUser?.id === userId) store.currentUser = enrichUser(user);
    return enrichUser(user);
  },

  async uploadAvatarImage(userId, file) {
    await delay(300);
    const user = getRawUser(userId);
    if (!user) throw new Error('משתמש לא נמצא');
    const { dataUrl, mimeType } = await readFileAsDataUrl(file);
    user.avatarState = buildCustomAvatarConfig(
      dataUrl,
      mimeType,
      user.avatarState?.ringColorId,
      user.avatarState?.profileBadgeId
    );
    if (store.currentUser?.id === userId) store.currentUser = enrichUser(user);
    return enrichUser(user);
  },

  getTasks: () => tasks.getTasks(),
  createTask: (data) => tasks.createTask(data),
  updateTask: (id, data) => tasks.updateTask(id, data),
  updateTaskStatus: (id, status) => tasks.updateTaskStatus(id, status),
  submitTaskProof: (id, img) => tasks.submitTaskProof(id, img),
  approveTask: (id) => tasks.approveTask(id),
  rejectTask: (id, reason) => tasks.rejectTask(id, reason),
  claimTask: (id) => tasks.claimTask(id),
  deleteTask: (id) => tasks.deleteTask(id),
  toggleSubItem: (taskId, subItemId, isCompleted) =>
    tasks.toggleSubItem(taskId, subItemId, isCompleted),
  addSubItems: (taskId, texts) => tasks.addSubItems(taskId, texts),
  getMonthlyLeaderboardHistory: () => getMonthlyLeaderboardHistory(),
  ensureMonthlyRollover: () => ensureMonthlyRollover(),

  getUsers: () => fetchUsers(),
  updateUserPoints,
  deductPoints,
  getLeaderboard: () => gamification.getLeaderboard(),
  getRewards: () => gamification.getRewards(),
  createReward: (data) => gamification.createReward(data),
  updateReward: (id, data) => gamification.updateReward(id, data),
  deleteReward: (id) => gamification.deleteReward(id),
  redeemReward: (id) => gamification.redeemReward(id),

  getNotifications: () => notifications.getNotifications(),
  setReminder: (payload) => notifications.setReminder(payload),

  processAssistantMessage: (text, session) => processAssistantMessage(text, session),
  botCreateTask: (payload) => botCreateTask(payload),
  botCompleteTask: (taskId) => botCompleteTask(taskId),
  botDeleteTask: (taskId) => botDeleteTask(taskId),
  botMarkTaskDone: (taskId) => botCompleteTask(taskId),
  verifyAssistantPin: (pin) => verifyAssistantPin(pin),
  ASSISTANT_PIN,

  getPermissions(user, task) {
    if (!user) return {};
    const assignee = task?.assignedUserId ?? task?.assigneeId;
    return {
      canEdit: canEditTaskFully(user, task),
      canDelete: canDeleteTask(user),
      canChangePoints: canChangePoints(user),
      canSetDueDate: canSetDueDate(user),
      canReassign: canReassign(user),
      canMove: task ? canMoveTask(user, task) : true,
      canClaim: task
        ? canClaimTask(user, task) || (!assignee && task.status === TASK_STATUSES.TODO)
        : false,
      canApprove: task ? canApproveTask(user, task) : false,
      canSubmitProof: task ? canSubmitProof(user, task) : false,
      isAdmin: isAdmin(user),
      userRole: user.userRole,
    };
  },

  auth,
  household,
  tasks,
  gamification,
  notifications,
};

export const fetchRewards = () => gamification.getRewards();
export const createReward = (data) => gamification.createReward(data);
export const updateReward = (id, data) => gamification.updateReward(id, data);
export const deleteReward = (id) => gamification.deleteReward(id);
export const redeemReward = (id) => gamification.redeemReward(id);
