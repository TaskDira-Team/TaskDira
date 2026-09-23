import { store } from "./store";
import { IS_DEMO_MODE } from "./config";

const key = "taskdira-family-demo-v1";
export function reloadDemoFamily() {
  if (!IS_DEMO_MODE) return;
  try {
    const value = JSON.parse(localStorage.getItem(key));
    if (value)
      for (const field of ["users", "members", "households", "family"])
        if (value[field]) store[field] = value[field];
  } catch {
    /* A damaged demo snapshot must not prevent opening the preview. */
  }
  store.family ??= { invitations: [], pairings: [] };
}
export function persistDemoFamily() {
  if (!IS_DEMO_MODE) return;
  const { users, members, households, family } = store;
  localStorage.setItem(
    key,
    JSON.stringify({ users, members, households, family }),
  );
}
export async function passwordDigest(value) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return (
    "demo-sha256:" +
    [...new Uint8Array(bytes)]
      .map((n) => n.toString(16).padStart(2, "0"))
      .join("")
  );
}
