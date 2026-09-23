import test from "node:test";
import assert from "node:assert/strict";
import { deriveMilestoneProgress } from "../src/utils/milestoneProgress.js";

const now = new Date(2026, 8, 23, 12);
const user = { id: 1, points: 150, balance: 20, streakDays: 99 };
const task = (completedAt, fields = {}) => ({
  status: "Done",
  assignedUserId: 1,
  completedAt,
  ...fields,
});
const localDate = (day) => new Date(2026, 8, day, 8).toISOString();

test("milestones count only completed tasks for the user and accept both assignee fields", () => {
  const tasks = [
    task(null),
    task(null, { assignedUserId: null, assigneeId: "1" }),
    task(null, { assignedUserId: 2 }),
    task(null, { status: "PendingApproval" }),
    task(null, { assignedUserId: null }),
  ];
  assert.deepEqual(deriveMilestoneProgress(tasks, user, now), {
    completed: 2,
    xp: 150,
    streak: 0,
  });
  assert.deepEqual(deriveMilestoneProgress(tasks, null, now), {
    completed: 0,
    xp: 0,
    streak: 0,
  });
});

test("streak uses distinct local calendar dates and parses offsetless UTC server timestamps", () => {
  const tasks = [
    task(localDate(23)),
    task(localDate(23).replace("Z", "")),
    task(localDate(22)),
    task(localDate(21)),
    task("invalid"),
    task(localDate(25)),
  ];
  assert.deepEqual(deriveMilestoneProgress(tasks, user, now), {
    completed: 6,
    xp: 150,
    streak: 3,
  });
});

test("yesterday keeps a streak active, a missing day breaks it, and future records do not start one", () => {
  assert.equal(
    deriveMilestoneProgress(
      [task(localDate(22)), task(localDate(21))],
      user,
      now,
    ).streak,
    2,
  );
  assert.equal(
    deriveMilestoneProgress([task(localDate(21))], user, now).streak,
    0,
  );
  assert.equal(
    deriveMilestoneProgress([task(localDate(24))], user, now).streak,
    0,
  );
});

test("XP comes from earned points, never spendable balance, and rejects invalid values", () => {
  assert.equal(deriveMilestoneProgress([], { id: 1, balance: 100 }, now).xp, 0);
  assert.equal(deriveMilestoneProgress([], { id: 1, points: -5 }, now).xp, 0);
  assert.equal(
    deriveMilestoneProgress([], { id: 1, points: Infinity }, now).xp,
    0,
  );
});
