import test from 'node:test';
import assert from 'node:assert/strict';
import { completedThisMonth, monthlyEarnedXp, isInMonth } from '../src/utils/monthlyStats.js';

const now = new Date('2026-09-13T12:00:00Z');

test('completed counts come from persisted tasks and are scoped to the assignee and month', () => {
  const completed = { status: 'Done', assignedUserId: 1, completedAt: '2026-09-13T10:00:00' };
  const tasks = [completed, { ...completed, assignedUserId: 2 },
    { ...completed, status: 'InProgress' }, { ...completed, completedAt: null },
    { ...completed, completedAt: '2026-08-31T23:59:59Z' }];
  assert.equal(completedThisMonth(tasks, 1, now), 1);
  assert.equal(completedThisMonth(JSON.parse(JSON.stringify(tasks)), 1, now), 1);
  assert.equal(completedThisMonth(tasks, undefined, now), 2);
  assert.equal(completedThisMonth([], 1, now), 0);
});

test('monthly goal counts positive earned XP, not task count, lifetime XP or spendable balance', () => {
  const earned = { householdId: 7, pointsEarned: 25, earnedAt: '2026-09-13T10:00:00' };
  const entries = [earned, { ...earned, pointsEarned: -20 },
    { ...earned, householdId: 8, pointsEarned: 100 },
    { ...earned, earnedAt: '2026-08-31T23:59:59Z', pointsEarned: 100 },
    { ...earned, earnedAt: null }, { ...earned, earnedAt: 'invalid' }];
  assert.equal(monthlyEarnedXp(entries, 7, now), 25);
  assert.equal(monthlyEarnedXp(entries, 8, now), 100);
  assert.equal(monthlyEarnedXp([], 7, now), 0);
});

test('month boundaries use UTC for SQL timestamps and explicit offsets', () => {
  assert.equal(isInMonth('2026-09-01T00:00:00', now), true);
  assert.equal(isInMonth('2026-09-01T00:30:00+03:00', now), false);
  assert.equal(isInMonth('2026-10-01T00:00:00Z', now), false);
  assert.equal(isInMonth('2025-09-13T00:00:00Z', now), false);
});
