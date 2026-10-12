import test from "node:test";
import assert from "node:assert/strict";
import { seedPreview } from "../src/data/previewSample.js";
import { store } from "../src/services/store.js";
import { enrichReward } from "../src/data/gamification.js";
import { translateContent } from "../src/data/contentI18n.js";
import { claimLocalReward } from "../src/services/localWallet.js";

function sample() {
  const target = structuredClone(store);
  seedPreview(target, new Date("2026-10-12T12:00:00Z"));
  return target;
}

test("sample wallet and member statistics agree with mission history and claimed prizes", () => {
  const data = sample();
  assert.ok(data.tasks.filter((t) => t.status === "Done").length >= 120);
  assert.equal(new Set(data.tasks.map((t) => t.id)).size, data.tasks.length);
  for (const ledger of data.pointsLedger) {
    const completed = data.tasks.filter(
      (t) => t.status === "Done" && t.assignedUserId === ledger.userId,
    );
    assert.equal(
      ledger.totalPoints,
      completed.reduce((sum, t) => sum + t.pointsValue, 0),
    );
    const spent = data.rewards
      .filter((r) => r.claimedByUserId === ledger.userId)
      .reduce((sum, r) => sum + r.cost, 0);
    assert.equal(ledger.balance, ledger.totalPoints - spent);
    assert.ok(
      data.tasks.some(
        (t) => t.assignedUserId === ledger.userId && t.status !== "Done",
      ),
    );
  }
});

test("sample shop exercises available, unaffordable, locked and claimed rewards without fake voucher codes", () => {
  const data = sample(),
    ledger = data.pointsLedger[0];
  const rewards = data.rewards.map((r) =>
    enrichReward(r, ledger.totalPoints, ledger.balance),
  );
  assert.ok(rewards.some((r) => !r.claimed && r.unlocked && r.affordable));
  assert.ok(rewards.some((r) => !r.claimed && r.unlocked && !r.affordable));
  assert.ok(rewards.some((r) => !r.unlocked));
  assert.ok(rewards.some((r) => r.claimed));
  assert.ok(rewards.every((r) => !r.code));
  const prize = data.rewards.find((r) => !r.claimed && r.cost === 30);
  const claim = claimLocalReward(ledger, prize, ledger.userId);
  assert.equal(claim.ledger.balance, ledger.balance - 30);
  assert.equal(claim.ledger.totalPoints, ledger.totalPoints);
  assert.equal(claim.reward.claimedByUserId, ledger.userId);
});

test("every sample mission, step and reward reads in both languages", () => {
  const data = sample();
  for (const record of [...data.tasks, ...data.rewards]) {
    assert.notEqual(translateContent(record.title, "en"), record.title);
    assert.equal(
      translateContent(translateContent(record.title, "en"), "he"),
      record.title,
    );
    for (const step of record.subItems || [])
      assert.notEqual(translateContent(step.text, "en"), step.text);
  }
});
