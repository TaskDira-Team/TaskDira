import test from "node:test";
import assert from "node:assert/strict";
import { enrichReward } from "../src/data/gamification.js";
import {
  adjustLocalTaskPoints,
  claimLocalReward,
  localBalance,
  spendLocalCoins,
} from "../src/services/localWallet.js";

test("earning task points increases earned XP and spendable coins independently", () => {
  const ledger = { totalPoints: 200, balance: 40, rank: 2 };
  assert.deepEqual(adjustLocalTaskPoints(ledger, 25), {
    totalPoints: 225,
    balance: 65,
    rank: 2,
  });
  assert.deepEqual(ledger, { totalPoints: 200, balance: 40, rank: 2 });
  assert.deepEqual(adjustLocalTaskPoints({ totalPoints: 200 }, 25), {
    totalPoints: 225,
    balance: 225,
  });
  assert.equal(
    adjustLocalTaskPoints({ totalPoints: 200, balance: 0 }, 25).balance,
    25,
  );
});

test("spending coins preserves XP and rank, and insufficient wallet rejects despite high XP", () => {
  const ledger = { totalPoints: 500, balance: 60, rank: 1 };
  assert.deepEqual(spendLocalCoins(ledger, 60), {
    totalPoints: 500,
    balance: 0,
    rank: 1,
  });
  assert.throws(() => spendLocalCoins(ledger, 61), /אין מספיק/);
  assert.throws(() => spendLocalCoins(ledger, -1), /אינו תקין/);
  assert.throws(() => spendLocalCoins(ledger, Infinity), /אינו תקין/);
  assert.equal(ledger.balance, 60);
});

test("a reward claim spends only its cost, persists claimant and prevents repeated claims", () => {
  const ledger = { totalPoints: 500, balance: 120, rank: 1 };
  const reward = { id: 7, requiredPoints: 300, cost: 50, title: "Movie night" };
  const result = claimLocalReward(ledger, reward, 2);
  assert.deepEqual(result.ledger, { totalPoints: 500, balance: 70, rank: 1 });
  assert.equal(result.reward.claimed, true);
  assert.equal(result.reward.claimedByUserId, 2);
  assert.throws(
    () => claimLocalReward(result.ledger, result.reward, 3),
    /כבר מומש/,
  );
  assert.equal(ledger.balance, 120);
  assert.equal(reward.claimed, undefined);
});

test("unlock standing and affordability remain independent after a redemption", () => {
  const ledger = { totalPoints: 500, balance: 40 };
  const reward = { requiredPoints: 200, cost: 50 };
  const view = enrichReward(reward, ledger.totalPoints, localBalance(ledger));
  assert.equal(view.unlocked, true);
  assert.equal(view.affordable, false);
  assert.throws(() => claimLocalReward(ledger, reward, 2), /אין מספיק/);
  assert.throws(
    () => claimLocalReward({ totalPoints: 100, balance: 500 }, reward, 2),
    /נעול/,
  );
  assert.equal(ledger.balance, 40);
});

test("undoing task points reverses both counters without making a wallet negative", () => {
  assert.deepEqual(
    adjustLocalTaskPoints({ totalPoints: 80, balance: 5 }, -20),
    { totalPoints: 60, balance: 0 },
  );
});
