import { resolveAvatarConfig } from '../data/avatars';
import { DEFAULT_AVATAR_CONFIG, CATEGORIES, ROLES } from '../data/mockData';
import {
  getUserLevel,
  getActivityBadge,
  getGlowRing,
  getStreakDays,
  getFamilyRoleLabel,
  getPermissionLabel,
} from '../data/gamification';
import { enrichTask as enrichDueFields } from '../utils/dateFormat';
import { store, getActiveHouseholdId } from './store';

export function getMembership(userId, householdId = getActiveHouseholdId()) {
  return store.members.find((m) => m.userId === userId && m.householdId === householdId);
}

export function getLedgerEntry(userId, householdId = getActiveHouseholdId()) {
  const now = new Date();
  return store.pointsLedger.find(
    (l) =>
      l.userId === userId &&
      l.householdId === householdId &&
      l.month === now.getMonth() + 1 &&
      l.year === now.getFullYear()
  );
}

export function enrichUser(user) {
  if (!user) return null;
  const householdId = getActiveHouseholdId();
  const membership = getMembership(user.id, householdId);
  const ledger = getLedgerEntry(user.id, householdId);
  const userRole = membership?.role ?? ROLES.MEMBER;
  const isAdmin = userRole === ROLES.ADMIN;
  const avatarState = user.avatarState || user.avatarConfig || DEFAULT_AVATAR_CONFIG;
  const avatar = resolveAvatarConfig(avatarState);
  const points = ledger?.totalPoints ?? 0;
  const level = getUserLevel(points);
  const tasksCompletedThisMonth = user.tasksCompletedThisMonth ?? 0;
  const badge = getActivityBadge(tasksCompletedThisMonth);
  const glow = getGlowRing({ points, tasksCompletedThisMonth, streakDays: user.streakDays });
  const streakDays = getStreakDays({ ...user, tasksCompletedThisMonth });

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    avatarState,
    createdAt: user.createdAt,
    userRole,
    role: userRole,
    householdId: membership?.householdId ?? householdId,
    joinedAt: membership?.joinedAt,
    name: user.fullName,
    avatarConfig: avatarState,
    avatar,
    permissionRole: isAdmin ? 'admin' : 'member',
    isAdmin,
    points,
    rank: ledger?.rank,
    level,
    badge,
    glow,
    streakDays,
    tasksCompletedThisMonth,
    familyRole: user.familyRole || 'roommate',
    familyRoleLabel: getFamilyRoleLabel(user.familyRole || 'roommate'),
    roleLabel: getFamilyRoleLabel(user.familyRole || 'roommate'),
    permissionLabel: getPermissionLabel(isAdmin ? 'admin' : 'member'),
    lastCompletedDate: user.lastCompletedDate || null,
    profileTitle: avatar.profileBadgeLabel,
    onboarded: user.onboarded !== false,
  };
}

export function enrichTaskView(task) {
  if (!task) return null;
  const subItems = Array.isArray(task.subItems) ? task.subItems : [];
  const doneCount = subItems.filter((s) => s.isCompleted).length;
  return enrichDueFields({
    ...task,
    categoryId: task.categoryId,
    pointsValue: task.pointsValue,
    assignedUserId: task.assignedUserId,
    dueDate: task.dueDate,
    proofImageUrl: task.proofImageUrl || task.proofImageData || null,
    subItems,
    subItemsProgress:
      subItems.length > 0 ? { done: doneCount, total: subItems.length } : null,
    category: task.categoryId,
    points: task.pointsValue,
    assigneeId: task.assignedUserId,
    dueAt: task.dueDate,
  });
}

export function findCategory(categoryId) {
  const hid = getActiveHouseholdId();
  return (
    store.categories.find((c) => c.id === categoryId && c.householdId === hid) ||
    CATEGORIES.find((c) => c.id === categoryId)
  );
}
