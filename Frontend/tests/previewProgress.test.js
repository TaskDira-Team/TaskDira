import { test } from "node:test";
import assert from "node:assert/strict";
import {
  restorePreviewProgress,
  savePreviewProgress,
} from "../src/services/previewProgress.js";

test("preview refresh restores reward claims, wallet and completed missions together", () => {
  const map = new Map();
  const storage = {
    getItem: (key) => map.get(key),
    setItem: (key, value) => map.set(key, value),
  };
  const game = {
    tasks: [{ id: "t", status: "Done" }],
    rewards: [{ id: "r", claimedByUserId: "child" }],
    pointsLedger: [{ userId: "child", totalPoints: 50, balance: 20 }],
  };
  savePreviewProgress(game, storage);
  const fresh = { tasks: [], rewards: [], pointsLedger: [] };
  assert.equal(restorePreviewProgress(fresh, storage), true);
  assert.deepEqual(fresh, game);
});
test("broken preview storage leaves the seed intact and blocked writes report failure", () => {
  const game = { tasks: [{ id: "seed" }], rewards: [], pointsLedger: [] };
  assert.equal(restorePreviewProgress(game, { getItem: () => "{bad" }), false);
  assert.equal(game.tasks[0].id, "seed");
  assert.throws(() =>
    savePreviewProgress(game, {
      setItem: () => {
        throw new Error("Quota");
      },
    }),
  );
});
