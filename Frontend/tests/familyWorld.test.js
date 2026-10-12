import { test } from "node:test";
import assert from "node:assert/strict";
import {
  missionChoices,
  reconcileWorld,
  supportFor,
  taskSkill,
} from "../src/utils/familyWorld.js";

test("mission choices include only assigned actionable tasks, with in-progress first", () => {
  const tasks = [
    { id: 1, assignedUserId: 7, status: "ToDo" },
    { id: 2, assignedUserId: 8, status: "ToDo" },
    { id: 3, assignedUserId: 7, status: "Done" },
    { id: 4, assignedUserId: 7, status: "PendingApproval" },
    { id: 5, assignedUserId: "7", status: "InProgress" },
    { id: 6, status: "ToDo" },
  ];
  assert.deepEqual(
    missionChoices(tasks, 7).map((t) => t.id),
    [5, 1],
  );
  assert.equal(tasks[0].id, 1);
});
test("world counts distinct completed tasks, never pending approvals or repeated reads", () => {
  const tasks = [
    { id: 1, status: "Done" },
    { id: 2, status: "PendingApproval" },
    { id: 1, status: "Done" },
  ];
  let world = reconcileWorld({}, tasks);
  world = reconcileWorld(world, tasks);
  assert.equal(world.completed, 1);
});
test("earned building progress survives reopened and removed tasks", () => {
  const world = reconcileWorld({}, [
    { id: 1, status: "Done" },
    { id: 2, status: "Done" },
  ]);
  assert.equal(reconcileWorld(world, [{ id: 1, status: "ToDo" }]).completed, 2);
});
test("support is scoped to each member and skill; an unset skill uses hints", () => {
  const world = {
    support: [
      { userId: 7, skill: "kitchen", level: "together" },
      { userId: 7, skill: "tidying", level: "independent" },
    ],
  };
  assert.equal(supportFor(world, "7", { categoryId: "kitchen" }), "together");
  assert.equal(supportFor(world, 7, { categoryId: "room" }), "independent");
  assert.equal(supportFor(world, 8, { categoryId: "kitchen" }), "hints");
  assert.equal(taskSkill({ categoryId: "unknown" }), "other");
});
