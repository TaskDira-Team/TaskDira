// Server timestamps without offsets are UTC. Day buckets follow the viewer's calendar.
export function parseTaskDate(value) {
  if (!value) return null;
  const raw =
    typeof value === "string" &&
    /^\d{4}-\d\d-\d\dT/.test(value) &&
    !/(Z|[+-]\d\d:\d\d)$/i.test(value)
      ? `${value}Z`
      : value;
  const date = new Date(raw);
  return Number.isFinite(date.getTime()) ? date : null;
}
export function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export const taskPoints = (task) =>
  Math.max(0, Number(task.pointsValue ?? task.points) || 0);
export const isDone = (task) => task.status === "Done";
export function buildInsights(
  tasks = [],
  users = [],
  days = 7,
  now = new Date(),
  userId,
) {
  const scoped =
    userId != null
      ? tasks.filter(
          (t) => String(t.assignedUserId ?? t.assigneeId) === String(userId),
        )
      : tasks;
  const count = Math.max(1, Math.min(366, Number(days) || 7));
  const daily = Array.from({ length: count }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - count + 1 + index);
    return { key: dayKey(date), date, count: 0, xp: 0 };
  });
  const buckets = new Map(daily.map((d) => [d.key, d]));
  const byMember = new Map(
    users.map((u) => [
      String(u.id),
      { id: u.id, name: u.fullName || u.name || "", count: 0, xp: 0 },
    ]),
  );
  const categories = new Map();
  let completed = 0,
    missingHistory = 0,
    overdue = 0,
    open = 0;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  for (const task of scoped) {
    const key = task.categoryId ?? task.category ?? "other";
    const category = categories.get(key) || { id: key, done: 0, open: 0 };
    if (isDone(task)) {
      completed++;
      category.done++;
      const date = parseTaskDate(task.completedAt);
      if (!date) missingHistory++;
      const bucket = date && date <= now ? buckets.get(dayKey(date)) : null;
      if (bucket) {
        bucket.count++;
        bucket.xp += taskPoints(task);
        const id = String(
          task.assignedUserId ?? task.assigneeId ?? "unassigned",
        );
        const member = byMember.get(id) || { id, name: "", count: 0, xp: 0 };
        member.count++;
        member.xp += taskPoints(task);
        byMember.set(id, member);
      }
    } else {
      category.open++;
      open++;
      const due = parseTaskDate(task.dueDate ?? task.dueAt);
      if (due && due < today) overdue++;
    }
    categories.set(key, category);
  }
  const periodDone = daily.reduce((sum, d) => sum + d.count, 0);
  return {
    daily,
    contributions: [...byMember.values()].sort((a, b) => b.count - a.count),
    categories: [...categories.values()].sort(
      (a, b) => b.open + b.done - (a.open + a.done),
    ),
    completed,
    open,
    overdue,
    missingHistory,
    periodDone,
    periodXp: daily.reduce((sum, d) => sum + d.xp, 0),
    completionRate: scoped.length
      ? Math.round((completed / scoped.length) * 100)
      : 0,
    total: scoped.length,
  };
}
