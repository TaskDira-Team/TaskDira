const KEY = "td.preview-progress.v1";
// Explicit preview only; the production app always uses its API. Persist the
// game records together so a refresh cannot turn a promised reward back into
// an unclaimed prize or reset the wallet independently from its missions.
export function restorePreviewProgress(target, storage = localStorage) {
  try {
    const value = JSON.parse(storage.getItem(KEY) || "null");
    if (
      !value ||
      !["tasks", "rewards", "pointsLedger"].every((key) =>
        Array.isArray(value[key]),
      )
    )
      return false;
    for (const key of ["tasks", "rewards", "pointsLedger"])
      target[key] = value[key];
    return true;
  } catch {
    return false;
  }
}
export function savePreviewProgress(target, storage = localStorage) {
  storage.setItem(
    KEY,
    JSON.stringify({
      tasks: target.tasks,
      rewards: target.rewards,
      pointsLedger: target.pointsLedger,
    }),
  );
}
