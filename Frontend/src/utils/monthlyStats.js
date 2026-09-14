// Server completion/ledger timestamps without a suffix are stored in UTC.
export function isInMonth(value, now = new Date()) {
  if (!value) return false;
  const date = new Date(typeof value === 'string' && !/(Z|[+-]\d{2}:\d{2})$/i.test(value) ? `${value}Z` : value);
  return date.getUTCFullYear() === now.getUTCFullYear() && date.getUTCMonth() === now.getUTCMonth();
}

export function completedThisMonth(tasks, userId, now = new Date()) {
  return tasks.filter(task => task.status === 'Done'
    && (userId === undefined || task.assignedUserId === userId)
    && isInMonth(task.completedAt, now)).length;
}

export function monthlyEarnedXp(entries, householdId, now = new Date()) {
  return entries.reduce((total, entry) => total + (
    entry.householdId === householdId && entry.pointsEarned > 0 && isInMonth(entry.earnedAt, now)
      ? entry.pointsEarned : 0), 0);
}
