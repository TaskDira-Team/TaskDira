export function getQuickCompletionAction(
  task,
  permissions = {},
  requireProof = false,
) {
  if (!task || task.status === "Done") return "none";
  if (task.status === "PendingApproval")
    return permissions.canApprove ? "review" : "none";
  if (requireProof) return permissions.canSubmitProof ? "proof" : "none";
  return permissions.canMove ? "complete" : "none";
}
