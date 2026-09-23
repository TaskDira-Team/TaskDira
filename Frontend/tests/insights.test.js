import test from "node:test";
import assert from "node:assert/strict";
import { buildInsights, parseTaskDate } from "../src/utils/insights.js";

const now = new Date("2026-09-23T12:00:00Z");
const users = [
  { id: 1, fullName: "One" },
  { id: 2, fullName: "Two" },
];
const tasks = [
  {
    id: 1,
    status: "Done",
    assignedUserId: 1,
    completedAt: "2026-09-22T12:00:00",
    pointsValue: 10,
    categoryId: "kitchen",
  },
  {
    id: 2,
    status: "Done",
    assignedUserId: 2,
    completedAt: "2026-09-21T12:00:00Z",
    pointsValue: 20,
    categoryId: "living",
  },
  {
    id: 3,
    status: "Done",
    assignedUserId: 1,
    completedAt: null,
    pointsValue: 999,
    categoryId: "kitchen",
  },
  {
    id: 4,
    status: "ToDo",
    assignedUserId: 1,
    dueDate: "2026-09-20T12:00:00Z",
    pointsValue: 80,
    categoryId: "kitchen",
  },
  {
    id: 5,
    status: "Done",
    assignedUserId: 1,
    completedAt: "2026-08-01T12:00:00Z",
    pointsValue: 5,
    categoryId: "living",
  },
  {
    id: 6,
    status: "Done",
    assignedUserId: 1,
    completedAt: "2026-09-24T12:00:00Z",
    pointsValue: 100,
    categoryId: "living",
  },
];
test("time charts exclude missing, future and out-of-period dates while current workload remains complete", () => {
  const result = buildInsights(tasks, users, 7, now);
  assert.equal(result.daily.length, 7);
  assert.equal(result.periodDone, 2);
  assert.equal(result.periodXp, 30);
  assert.equal(result.missingHistory, 1);
  assert.equal(result.overdue, 1);
  assert.equal(result.total, 6);
  assert.equal(result.completed, 5);
  assert.equal(
    result.categories.reduce((n, c) => n + c.done + c.open, 0),
    6,
  );
});
test("member filtering scopes the chart, totals and contributions together", () => {
  const result = buildInsights(tasks, users, 7, now, 1);
  assert.equal(result.periodDone, 1);
  assert.equal(result.periodXp, 10);
  assert.equal(result.total, 5);
  assert.equal(result.contributions.find((c) => c.id === 2).count, 0);
});
test("empty household returns finite zero values without fabricated history", () => {
  const result = buildInsights([], [], 30, now);
  assert.equal(result.completionRate, 0);
  assert.equal(result.periodXp, 0);
  assert.equal(result.daily.length, 30);
  assert.ok(result.daily.every((d) => d.count === 0 && d.xp === 0));
});
test("SQL timestamps are UTC and invalid dates never enter charts", () => {
  assert.equal(
    parseTaskDate("2026-09-23T10:00:00").toISOString(),
    "2026-09-23T10:00:00.000Z",
  );
  assert.equal(
    parseTaskDate("2026-09-23T13:00:00+03:00").toISOString(),
    "2026-09-23T10:00:00.000Z",
  );
  assert.equal(parseTaskDate("invalid"), null);
  assert.equal(parseTaskDate(null), null);
});
