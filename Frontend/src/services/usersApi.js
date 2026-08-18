import { enrichUser, getLedgerEntry } from './mappers';
import { store, delay, getRawUser, recalculateRanks, getActiveHouseholdId, hydrateHouseholdMembers } from './store';
import { TASK_STATUSES } from '../data/mockData';
import { USE_REAL_API } from './config';
import { fetchHouseholdRoster } from './usersRemote';

export { enrichUser };

function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${d.getMonth() + 1}`;
}

export async function fetchUsers() {
  if (USE_REAL_API.users) {
    const roster = await fetchHouseholdRoster();
    const hydrated = hydrateHouseholdMembers(roster);
    if (store.currentUser) {
      const refreshed = getRawUser(store.currentUser.id);
      if (refreshed) {
        store.currentUser = {
          ...enrichUser(refreshed),
          token: store.currentUser.token,
          activeHouseholdId: store.currentUser.activeHouseholdId,
        };
      }
    }
    return hydrated.map((u) => enrichUser(u));
  }
  await delay();
  const hid = getActiveHouseholdId();
  const memberIds = new Set(
    store.members.filter((m) => m.householdId === hid).map((m) => m.userId)
  );
  return store.users.filter((u) => memberIds.has(u.id)).map((u) => enrichUser(u));
}

// Stays local even when USE_REAL_API.users is on: the backend ledger requires a
// non-null taskid on every award, and task ids are still mock. Points are read
// from the real ledger in fetchUsers; writes go live with the tasks domain.
export async function updateUserPoints(userId, pointsDelta) {
  await delay(100);
  const hid = getActiveHouseholdId();
  const now = new Date();
  let ledger = getLedgerEntry(userId, hid);
  if (!ledger) {
    ledger = {
      id: `ledger-${userId}-${hid}`,
      householdId: hid,
      userId,
      totalPoints: 0,
      rank: 99,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    };
    store.pointsLedger.push(ledger);
  }
  ledger.totalPoints = Math.max(0, ledger.totalPoints + pointsDelta);

  const user = getRawUser(userId);
  if (user) {
    if (pointsDelta > 0) {
      user.tasksCompletedThisMonth = (user.tasksCompletedThisMonth || 0) + 1;
      bumpDailyStreak(user);
    } else if (pointsDelta < 0 && user.tasksCompletedThisMonth > 0) {
      user.tasksCompletedThisMonth -= 1;
    }
  }

  recalculateRanks(hid);

  if (store.currentUser?.id === userId) {
    store.currentUser = enrichUser(getRawUser(userId));
  }
  return enrichUser(getRawUser(userId));
}

export function bumpDailyStreak(user) {
  if (!user) return;
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const last = user.lastCompletedDate;
  if (last === todayKey) return;

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = yesterday.toISOString().slice(0, 10);

  if (last === yKey) {
    user.streakDays = (user.streakDays || 0) + 1;
  } else {
    user.streakDays = 1;
  }
  user.lastCompletedDate = todayKey;
}

export async function deductPoints(userId, amount) {
  await delay(200);
  const user = getRawUser(userId);
  if (!user) throw new Error('משתמש לא נמצא');
  const ledger = getLedgerEntry(userId);
  if (!ledger || ledger.totalPoints < amount) throw new Error('אין מספיק נקודות למימוש פרס זה');
  return updateUserPoints(userId, -amount);
}

export async function getLeaderboard() {
  if (USE_REAL_API.users) {
    const users = await fetchUsers();
    return [...users].sort((a, b) => b.points - a.points);
  }
  await delay();
  const hid = getActiveHouseholdId();
  const memberIds = new Set(
    store.members.filter((m) => m.householdId === hid).map((m) => m.userId)
  );
  return store.users
    .filter((u) => memberIds.has(u.id))
    .map(enrichUser)
    .sort((a, b) => b.points - a.points);
}

export async function resetMonthlyScores() {
  await delay(400);
  const hid = getActiveHouseholdId();
  const now = new Date();
  const key = monthKey(now);
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const board = await getLeaderboard();
  store.monthlyLeaderboardHistory.push({
    id: `hist-${hid}-${key}-${Date.now()}`,
    householdId: hid,
    month,
    year,
    lockedAt: now.toISOString(),
    entries: board.map((u, i) => ({
      userId: u.id,
      fullName: u.fullName || u.name,
      totalPoints: u.points,
      rank: i + 1,
    })),
  });

  const stillActive = [];
  for (const task of store.tasks) {
    if (task.householdId !== hid) {
      stillActive.push(task);
      continue;
    }
    if (task.status === TASK_STATUSES.DONE) {
      store.taskArchive.push({
        ...structuredClone(task),
        archivedAt: now.toISOString(),
        archiveMonth: month,
        archiveYear: year,
      });
      continue;
    }
    if (task.status === TASK_STATUSES.PENDING_APPROVAL) {
      task.status = TASK_STATUSES.TODO;
      task.proofImageData = null;
      task.proofImageUrl = null;
      task.proofSubmittedAt = null;
      task.rejectedReason = null;
      task.approvedById = null;
    }
    if (Array.isArray(task.subItems)) {
      task.subItems = task.subItems.map((s) => ({ ...s, isCompleted: false }));
    }
    stillActive.push(task);
  }
  store.tasks = stillActive;

  store.pointsLedger.forEach((l) => {
    if (l.householdId === hid && l.month === month && l.year === year) {
      l.totalPoints = 0;
      l.rank = 0;
    }
  });

  const memberIds = new Set(
    store.members.filter((m) => m.householdId === hid).map((m) => m.userId)
  );
  store.users.forEach((u) => {
    if (memberIds.has(u.id)) u.tasksCompletedThisMonth = 0;
  });

  store.lastMonthlyResetKey = key;
  recalculateRanks(hid);
  if (store.currentUser) {
    store.currentUser = enrichUser(getRawUser(store.currentUser.id));
  }
  return fetchUsers();
}

export async function ensureMonthlyRollover() {
  const key = monthKey();
  if (store.lastMonthlyResetKey === key) {
    return { ran: false, key };
  }
  if (store.lastMonthlyResetKey == null) {
    store.lastMonthlyResetKey = key;
    return { ran: false, key, initialized: true };
  }
  await resetMonthlyScores();
  return { ran: true, key };
}

export async function getMonthlyLeaderboardHistory() {
  await delay(100);
  const hid = getActiveHouseholdId();
  return store.monthlyLeaderboardHistory.filter((h) => h.householdId === hid);
}
