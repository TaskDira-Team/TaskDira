import { http } from "./httpClient";
import { USE_REAL_API, IS_DEMO_MODE } from "./config";
import { store } from "./store";
import {
  emptyPlay,
  reconcilePlay,
  applyPlayCommand,
  weekKey,
  owner,
  isOpen,
} from "../utils/familyPlay";

function demo(household, command) {
  const user = store.currentUser;
  const members = store.members.filter(
    (m) => String(m.householdId) === String(household),
  );
  const member = members.find((m) => String(m.userId) === String(user?.id));
  if (!member) throw new Error("This home is not available.");
  const context = {
    userId: user.id,
    isAdmin: member.role === "Admin" && !user.isManagedProfile,
    members,
    tasks: store.tasks.filter(
      (t) => String(t.householdId) === String(household),
    ),
    rewards: store.rewards.filter(
      (r) => String(r.householdId) === String(household),
    ),
    newId: () => crypto.randomUUID(),
  };
  const key = `td.family-play.v1.${household}`;
  const raw = localStorage.getItem(key);
  // Corrupt saved data is never silently replaced by a fresh household.
  let state = raw ? JSON.parse(raw) : emptyPlay();
  if (!raw && IS_DEMO_MODE) {
    const open = context.tasks.filter(isOpen);
    const selected = members.flatMap((m) =>
      open.filter((t) => owner(t) === String(m.userId)).slice(0, 2),
    );
    const done = context.tasks.filter((t) => t.status === "Done").slice(0, 2);
    if (selected.length)
      state.adventures.push({
        id: "sample-moon",
        theme: "moon",
        createdAt: new Date().toISOString(),
        completedAt: null,
        archived: false,
        missions: [...done, ...selected]
          .slice(0, 8)
          .map((t) => ({
            taskId: String(t.id),
            title: t.title,
            userId: owner(t),
            done: t.status === "Done",
          })),
      });
    state.weeks[weekKey()] = {
      taskIds: members.flatMap((m) =>
        open
          .filter((t) => owner(t) === String(m.userId))
          .slice(0, 3)
          .map((t) => String(t.id)),
      ),
      choices: {},
    };
  }
  if (command && command.revision !== state.revision) {
    const error = new Error(
      "Your family made a change. The latest version is loaded; please try again.",
    );
    error.status = 409;
    throw error;
  }
  const next = command
    ? applyPlayCommand(state, command, context)
    : reconcilePlay(state, context);
  if (!raw || JSON.stringify(next) !== JSON.stringify(state)) {
    next.revision = state.revision + 1;
    localStorage.setItem(key, JSON.stringify(next));
  }
  return {
    ...next,
    currentWeek: weekKey(),
    canManage: context.isAdmin,
    help: next.help.filter(
      (h) => context.isAdmin || h.userId === String(user.id),
    ),
  };
}
async function demoLocked(household, command) {
  const perform = () => demo(household, command);
  // Shared-device tabs serialize their read/modify/write cycle.
  return navigator.locks
    ? navigator.locks.request(`td.play.${household}`, perform)
    : perform();
}
export const playApi = {
  read: (household) =>
    USE_REAL_API.households
      ? http.get(`/api/family/${household}/play`)
      : demoLocked(household),
  change: (household, command) =>
    USE_REAL_API.households
      ? http.post(`/api/family/${household}/play`, command)
      : demoLocked(household, command),
};
