import { http } from "./httpClient";
import { USE_REAL_API } from "./config";
import { store } from "./store";
import {
  WORLD_PIECES,
  SKILLS,
  SUPPORT_LEVELS,
  reconcileWorld,
} from "../utils/familyWorld";

function demoWorld(household, action, data = {}) {
  const user = store.currentUser;
  const member = store.members.find(
    (m) =>
      String(m.householdId) === String(household) &&
      String(m.userId) === String(user?.id),
  );
  if (!member) throw new Error("This home is not available.");
  const key = `td.family-world.v1.${household}`;
  const raw = localStorage.getItem(key);
  let world;
  try {
    world = raw ? JSON.parse(raw) : {};
  } catch {
    world = {};
  }
  world = reconcileWorld(
    { placements: {}, support: [], ...world },
    store.tasks.filter((t) => String(t.householdId) === String(household)),
  );
  if (action === "placement") {
    const piece = WORLD_PIECES.find((p) => p.id === data.piece);
    if (
      !piece ||
      !["left", "right", "back", "stored"].includes(data.position) ||
      piece.required > world.completed
    )
      throw new Error("This decoration is not available yet.");
    world.placements[data.piece] = data.position;
  }
  if (action === "support") {
    if (
      user.isManagedProfile ||
      member.role !== "Admin" ||
      !store.members.some(
        (m) =>
          String(m.householdId) === String(household) &&
          String(m.userId) === String(data.userId),
      )
    )
      throw new Error("Ask your household admin to change support levels.");
    if (
      !SKILLS.some((s) => s.id === data.skill) ||
      !SUPPORT_LEVELS.some((s) => s.id === data.level)
    )
      throw new Error("Choose a support level.");
    world.support = world.support.filter(
      (s) =>
        !(String(s.userId) === String(data.userId) && s.skill === data.skill),
    );
    world.support.push(data);
  }
  localStorage.setItem(key, JSON.stringify(world));
  return {
    completed: world.completed,
    placements: world.placements,
    support: world.support.filter(
      (s) =>
        (!user.isManagedProfile && member.role === "Admin") ||
        String(s.userId) === String(user.id),
    ),
  };
}
export const worldApi = {
  read: (household) =>
    USE_REAL_API.households
      ? http.get(`/api/family/${household}/world`)
      : Promise.resolve().then(() => demoWorld(household, "read")),
  place: (household, data) =>
    USE_REAL_API.households
      ? http.put(`/api/family/${household}/world/placement`, data)
      : Promise.resolve().then(() => demoWorld(household, "placement", data)),
  support: (household, data) =>
    USE_REAL_API.households
      ? http.put(`/api/family/${household}/world/support`, {
          ...data,
          userId: Number(data.userId),
        })
      : Promise.resolve().then(() => demoWorld(household, "support", data)),
};
