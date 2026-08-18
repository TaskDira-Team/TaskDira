export const FAMILY_ROLES = [
  { id: 'dad', label: 'אבא' },
  { id: 'mom', label: 'אמא' },
  { id: 'kid', label: 'ילד/ה' },
  { id: 'roommate', label: 'שותף/ה 🏠' },
  { id: 'partner', label: 'בן/בת זוג 💑' },
  { id: 'helper', label: 'עוזר/ת בדירה' },
];

export const ROLES = FAMILY_ROLES;

export const LEVELS = [
  { level: 1, minPoints: 0, title: 'טירון בית', titleEn: 'Home Novice', emoji: '🌱' },
  { level: 2, minPoints: 50, title: 'עוזר דירה', titleEn: 'Apartment Aide', emoji: '⚡' },
  { level: 3, minPoints: 100, title: 'אלוף המטבח', titleEn: 'Kitchen Champ', emoji: '🏆' },
  { level: 4, minPoints: 200, title: 'גיבור המשפחה', titleEn: 'Family Hero', emoji: '🦸' },
  { level: 5, minPoints: 350, title: 'אגדת הבית', titleEn: 'Household Legend', emoji: '👑' },
];

export const MONTHLY_HOUSEHOLD_GOAL = 400;

export const REWARD_MILESTONES = [
  { tier: 'tier1', points: 50, label: '50 נק׳' },
  { tier: 'tier2', points: 100, label: '100 נק׳' },
  { tier: 'tier3', points: 200, label: '200 נק׳' },
];

export function getUserLevel(points) {
  let current = LEVELS[0];
  let next = LEVELS[1] || null;
  for (let i = 0; i < LEVELS.length; i++) {
    if (points >= LEVELS[i].minPoints) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
    }
  }
  const progressToNext = next
    ? Math.min(100, Math.round(((points - current.minPoints) / (next.minPoints - current.minPoints)) * 100))
    : 100;
  return { ...current, next, progressToNext };
}

export function getActivityBadge(tasksCompletedThisMonth) {
  if (tasksCompletedThisMonth >= 7) {
    return { emoji: '⭐', label: 'פעיל מאוד', className: 'ring-2 ring-indigo-300 bg-indigo-50' };
  }
  if (tasksCompletedThisMonth >= 4) {
    return { emoji: '⚡', label: 'פעיל', className: 'ring-2 ring-slate-300 bg-slate-50' };
  }
  return { emoji: '🌱', label: 'מתחיל', className: 'ring-2 ring-slate-200 bg-white' };
}

export function getStreakDays(user) {
  if (typeof user?.streakDays === 'number' && user.streakDays >= 0) {
    return user.streakDays;
  }
  const completed = user?.tasksCompletedThisMonth ?? 0;
  return Math.min(14, Math.max(0, Math.floor(completed * 0.85) || 0));
}

export function getGlowRing(user) {
  const points = user.points ?? 0;
  if (points >= 200) {
    return { ring: 'ring-2 ring-indigo-300 shadow-sm', label: 'top' };
  }
  if (points >= 100) {
    return { ring: 'ring-2 ring-slate-300 shadow-sm', label: 'mid' };
  }
  return { ring: 'ring-1 ring-slate-200', label: 'base' };
}

export function getRoleLabel(roleId) {
  return ROLES.find((r) => r.id === roleId)?.label ?? roleId;
}

export function getFamilyRoleLabel(familyRole) {
  return getRoleLabel(familyRole);
}

export function getPermissionLabel(permissionRole) {
  const labels = { admin: 'מנהל הבית', member: 'מורשה בדירה' };
  return labels[permissionRole] ?? permissionRole;
}

export function getHouseholdGoalProgress(users) {
  const totalPoints = users.reduce((sum, u) => sum + (u.points ?? 0), 0);
  const percent = Math.min(100, Math.round((totalPoints / MONTHLY_HOUSEHOLD_GOAL) * 100));
  return { totalPoints, goal: MONTHLY_HOUSEHOLD_GOAL, percent };
}

// `unlocked` is earned standing: lifetime XP against requiredPoints, and it
// never regresses. `affordable` is the wallet: balance against cost, and it
// drops every time something is redeemed. A reward can be unlocked but
// unaffordable, which the store renders as two different states.
export function enrichReward(reward, xpPoints = 0, balance = null) {
  const requiredPoints = reward.requiredPoints ?? reward.cost ?? 0;
  const cost = reward.cost ?? requiredPoints;
  const wallet = balance ?? xpPoints;
  return {
    id: reward.id,
    title: reward.title,
    emoji: reward.emoji || '🎁',
    requiredPoints,
    cost,
    unlocked: xpPoints >= requiredPoints,
    affordable: wallet >= cost,
    claimed: reward.claimed ?? false,
    claimedByUserId: reward.claimedByUserId ?? null,
    category: reward.category || (requiredPoints >= 200 ? 'tier3' : requiredPoints >= 100 ? 'tier2' : 'tier1'),
    code: reward.code || null,
    description: reward.description || '',
    householdId: reward.householdId,
  };
}
