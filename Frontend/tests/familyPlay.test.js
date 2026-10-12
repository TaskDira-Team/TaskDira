import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyPlay,
  applyPlayCommand,
  reconcilePlay,
  roomUnlocks,
  weekKey,
} from "../src/utils/familyPlay.js";
const now = new Date("2026-10-12T12:00:00Z");
const task = (id, user = "kid", status = "ToDo") => ({
  id,
  assignedUserId: user,
  title: `Job ${id}`,
  categoryId: "room",
  status,
  subItems: [{ id: "step" }],
});
const context = (extra = {}) => ({
  userId: "kid",
  isAdmin: false,
  members: [{ userId: "parent" }, { userId: "kid" }, { userId: "sibling" }],
  tasks: [task("a"), task("b"), task("c"), task("d"), task("other", "sibling")],
  rewards: [],
  newId: () => "id",
  ...extra,
});
const run = (state, action, data = {}, ctx = context()) =>
  applyPlayCommand(state, { action, ...data }, ctx, now);

test("removed and reassigned jobs release weekly slots without erasing completed promises", () => {
  const state = emptyPlay();
  state.weeks["2026-10-12"] = {
    taskIds: ["a", "b", "c"],
    choices: { kid: ["a", "b", "c"] },
  };
  const next = reconcilePlay(
    state,
    context({ tasks: [task("b", "sibling"), task("c", "kid", "Done")] }),
    now,
  );
  assert.deepEqual(next.weeks["2026-10-12"].taskIds, ["b", "c"]);
  assert.deepEqual(next.weeks["2026-10-12"].choices.kid, ["c"]);
});

test("children cannot publish adventures, schedule tickets, change another child’s help or pick their work", () => {
  for (const action of [
    "adventure.start",
    "ticket.schedule",
    "week.offer",
    "help.reply",
  ])
    assert.throws(() => run(emptyPlay(), action));
  assert.throws(() =>
    run(emptyPlay(), "help.ask", { taskId: "other", kind: "show", step: 1 }),
  );
  assert.throws(() =>
    run(emptyPlay(), "help.ask", { taskId: "a", kind: "show", step: 2 }),
  );
});
test("a cooperative adventure completes from real completed tasks, never pending approval or a client flag", () => {
  let state = run(
    emptyPlay(),
    "adventure.start",
    { theme: "moon", taskIds: ["a", "other"] },
    context({ isAdmin: true }),
  );
  assert.throws(() =>
    run(
      state,
      "adventure.start",
      { theme: "moon", taskIds: ["b"] },
      context({ isAdmin: true }),
    ),
  );
  state = reconcilePlay(
    state,
    context({
      tasks: [
        task("a", "kid", "Done"),
        task("other", "sibling", "PendingApproval"),
      ],
    }),
    now,
  );
  assert.equal(state.adventures[0].completedAt, null);
  state = reconcilePlay(
    state,
    context({
      tasks: [task("a", "kid", "Done"), task("other", "sibling", "Done")],
    }),
    now,
  );
  assert.ok(state.adventures[0].completedAt);
  assert.ok(roomUnlocks(state, "kid").includes("moon"));
  assert.ok(roomUnlocks(state, "sibling").includes("moon"));
  assert.ok(!roomUnlocks(state, "parent").includes("moon"));
  const removed = reconcilePlay(state, context({ tasks: [] }), now);
  assert.ok(roomUnlocks(removed, "kid").includes("moon"));
});
test("room unlocks credit distinct real completions once and cannot be forged or earned by a sibling", () => {
  const ctx = context({
    tasks: [
      task("a", "kid", "Done"),
      task("b", "kid", "Done"),
      task("c", "kid", "Done"),
      task("d", "sibling", "Done"),
    ],
  });
  const state = reconcilePlay(reconcilePlay(emptyPlay(), ctx, now), ctx, now);
  assert.equal(state.credits.length, 4);
  assert.ok(roomUnlocks(state, "kid").includes("lamp"));
  assert.ok(!roomUnlocks(state, "sibling").includes("lamp"));
  assert.throws(() =>
    run(state, "room.save", { color: "mint", items: ["moon"] }),
  );
  assert.deepEqual(
    run(state, "room.save", { color: "mint", items: ["lamp", "cushion"] }).rooms
      .kid,
    { color: "mint", items: ["lamp", "cushion"] },
  );
});
test("help requests update instead of duplicating, accept a parent reply and close on completion", () => {
  let state = run(emptyPlay(), "help.ask", {
    taskId: "a",
    kind: "show",
    step: 1,
  });
  state = run(state, "help.ask", { taskId: "a", kind: "together", step: 1 });
  assert.equal(state.help.length, 1);
  state = run(
    state,
    "help.reply",
    { id: "id", reply: "coming" },
    context({ isAdmin: true, userId: "parent" }),
  );
  assert.equal(state.help[0].status, "answered");
  assert.throws(() =>
    run(state, "help.resolve", { id: "id" }, context({ userId: "sibling" })),
  );
  assert.equal(
    reconcilePlay(state, context({ tasks: [task("a", "kid", "Done")] }), now)
      .help[0].status,
    "resolved",
  );
});
test("tickets only come from claims and scheduling neither spends coins nor erases the promise after reward deletion", () => {
  const ctx = context({
    isAdmin: true,
    userId: "parent",
    rewards: [
      { id: "r", claimedByUserId: "kid", title: "Movie night", cost: 40 },
      { id: "unclaimed", title: "Ice cream" },
    ],
  });
  let state = reconcilePlay(emptyPlay(), ctx, now);
  assert.equal(state.tickets.length, 1);
  assert.throws(() =>
    run(
      state,
      "ticket.schedule",
      { rewardId: "unclaimed", date: "2026-10-13", when: "morning" },
      ctx,
    ),
  );
  assert.throws(() =>
    run(
      state,
      "ticket.schedule",
      { rewardId: "r", date: "2026-02-31", when: "morning" },
      ctx,
    ),
  );
  state = run(
    state,
    "ticket.schedule",
    { rewardId: "r", date: "2026-10-13", when: "after-dinner" },
    ctx,
  );
  assert.equal(state.tickets[0].status, "planned");
  state = reconcilePlay(state, { ...ctx, rewards: [] }, now);
  assert.equal(state.tickets[0].title, "Movie night");
  state = run(state, "ticket.enjoy", { rewardId: "r" }, ctx);
  assert.equal(state.tickets[0].status, "enjoyed");
  assert.throws(() =>
    run(
      state,
      "ticket.schedule",
      { rewardId: "r", date: "2026-10-14", when: "morning" },
      ctx,
    ),
  );
});
test("weekly choices are capped, owned and reversible; parent edits preserve promises", () => {
  let state = run(
    emptyPlay(),
    "week.offer",
    { taskIds: ["a", "b", "c", "d", "other"] },
    context({ isAdmin: true }),
  );
  for (const taskId of ["a", "b", "c"])
    state = run(state, "week.choose", { taskId, selected: true });
  assert.throws(() =>
    run(state, "week.choose", { taskId: "d", selected: true }),
  );
  assert.throws(() =>
    run(state, "week.choose", { taskId: "other", selected: true }),
  );
  assert.throws(() =>
    run(
      state,
      "week.offer",
      { taskIds: ["b", "c", "d"] },
      context({ isAdmin: true }),
    ),
  );
  state = run(state, "week.choose", { taskId: "a", selected: false });
  state = run(state, "week.choose", { taskId: "d", selected: true });
  assert.deepEqual(state.weeks["2026-10-12"].choices.kid, ["b", "c", "d"]);
  assert.equal(weekKey(new Date("2026-10-18T23:59:00Z")), "2026-10-12");
  assert.equal(weekKey(new Date("2026-10-19T00:00:00Z")), "2026-10-19");
  assert.equal(state.weeks["2026-10-19"], undefined);
});
