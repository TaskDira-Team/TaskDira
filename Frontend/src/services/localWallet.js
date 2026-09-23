import { enrichReward } from "../data/gamification.js";

// Older sample ledgers predate the separate wallet. Initialise them from their
// unspent XP once, but honour an explicitly empty wallet thereafter.
export function localBalance(ledger) {
  return ledger?.balance ?? ledger?.totalPoints ?? 0;
}

export function adjustLocalTaskPoints(ledger, delta) {
  if (!Number.isFinite(delta)) throw new Error("נדרש מספר נקודות תקין");
  return {
    ...ledger,
    totalPoints: Math.max(0, (ledger?.totalPoints ?? 0) + delta),
    balance: Math.max(0, localBalance(ledger) + delta),
  };
}

export function spendLocalCoins(ledger, amount) {
  if (!Number.isFinite(amount) || amount < 0)
    throw new Error("מחיר הפרס אינו תקין");
  const balance = localBalance(ledger);
  if (!ledger || balance < amount)
    throw new Error("אין מספיק נקודות למימוש פרס זה");
  return { ...ledger, balance: balance - amount };
}

// Validate the entire claim before returning either update. The caller commits
// both synchronously so a second claim observes the first claim's flag.
export function claimLocalReward(ledger, reward, userId) {
  if (reward.claimed || reward.claimedByUserId != null)
    throw new Error("הפרס כבר מומש");
  const view = enrichReward(
    reward,
    ledger?.totalPoints ?? 0,
    localBalance(ledger),
  );
  if (!view.unlocked)
    throw new Error(`הפרס נעול — נדרשות ${view.requiredPoints} נקודות ניסיון`);
  const nextLedger = spendLocalCoins(ledger, view.cost);
  const claimed = { ...reward, claimed: true, claimedByUserId: userId };
  return { ledger: nextLedger, reward: claimed };
}
