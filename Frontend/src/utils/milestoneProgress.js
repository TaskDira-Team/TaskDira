import { dayKey, parseTaskDate } from "./insights.js";

/** Milestones are a view of available household records, not stored awards. */
export function deriveMilestoneProgress(tasks, user, now = new Date()) {
  const completed =
    user?.id == null
      ? []
      : (tasks ?? []).filter((task) => {
          const assignee = task.assignedUserId ?? task.assigneeId;
          return (
            task.status === "Done" &&
            assignee != null &&
            String(assignee) === String(user.id)
          );
        });
  const days = new Set(
    completed
      .map((task) => parseTaskDate(task.completedAt))
      .filter((date) => date && date <= now)
      .map(dayKey),
  );
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return {
    completed: completed.length,
    xp: Number.isFinite(user?.points) ? Math.max(0, user.points) : 0,
    streak,
  };
}
