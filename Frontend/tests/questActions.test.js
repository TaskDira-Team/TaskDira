import test from "node:test";
import assert from "node:assert/strict";
import { getQuickCompletionAction } from "../src/utils/questActions.js";

test("proof-required quests never directly complete, including for admins", () => {
  assert.equal(
    getQuickCompletionAction(
      { status: "Todo" },
      { canMove: true, canSubmitProof: true },
      true,
    ),
    "proof",
  );
  assert.equal(
    getQuickCompletionAction(
      { status: "InProgress" },
      { canMove: true, canSubmitProof: true, isAdmin: true },
      true,
    ),
    "proof",
  );
  assert.equal(
    getQuickCompletionAction(
      { status: "Todo" },
      { canMove: true, canSubmitProof: false },
      true,
    ),
    "none",
  );
});

test("pending approval opens admin review and cannot be completed by members", () => {
  assert.equal(
    getQuickCompletionAction(
      { status: "PendingApproval" },
      { canApprove: true },
    ),
    "review",
  );
  assert.equal(
    getQuickCompletionAction(
      { status: "PendingApproval" },
      { canMove: true, canApprove: false },
    ),
    "none",
  );
});

test("ordinary completion needs move permission and done tasks cannot be awarded twice", () => {
  assert.equal(
    getQuickCompletionAction({ status: "Todo" }, { canMove: true }),
    "complete",
  );
  assert.equal(getQuickCompletionAction({ status: "Todo" }, {}), "none");
  assert.equal(
    getQuickCompletionAction(
      { status: "Done" },
      { canMove: true, canApprove: true },
    ),
    "none",
  );
});
