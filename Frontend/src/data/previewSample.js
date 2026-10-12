import { store } from "../services/store.js";
import { DEMO_MISSIONS, DEMO_TREASURES } from "./previewCatalog.js";

// Explicit demo fixtures only; never writes to a server or a real household.
export function seedPreview(target = store, now = new Date()) {
  const atDay = (offset) => {
    const date = new Date(now);
    date.setDate(date.getDate() + offset);
    date.setHours(18, 0, 0, 0);
    return date.toISOString();
  };
  const home = target.households[0];
  Object.assign(home, {
    displayName: "The Sunshine household",
    name: "The Sunshine household",
    address: "",
    city: "",
    houseNumber: "",
    street: "",
  });
  const players = target.users.slice(0, 3);
  players.forEach((user, i) => {
    user.fullName = ["Noam", "Maya", "Alex"][i];
  });
  const makeTask = (index, id, day, done = false) => {
    const [categoryId, pointsValue, title, steps] =
      DEMO_MISSIONS[index % DEMO_MISSIONS.length];
    return {
      id,
      householdId: home.id,
      title: title.he,
      description: "",
      categoryId,
      pointsValue,
      assignedUserId:
        players[done ? index % 3 : index < 12 ? 0 : 1 + (index % 2)].id,
      status: done ? "Done" : index % 7 === 0 ? "InProgress" : "ToDo",
      createdById: players[0].id,
      createdAt: atDay(day - 2),
      dueDate: atDay(day),
      completedAt: done ? atDay(day) : null,
      proofImageData: null,
      proofSubmittedAt: null,
      approvedById: null,
      subItems: steps.map((step, j) => ({
        id: `${id}-step-${j}`,
        text: step.he,
        isCompleted: done || (index % 7 === 0 && j === 0),
        sortOrder: j,
      })),
    };
  };
  target.tasks = DEMO_MISSIONS.map((_, i) =>
    makeTask(i, `preview-mission-${i}`, Math.floor(i / 4)),
  );
  for (let day = 1; day <= 42; day++) {
    for (let i = 0; i < (day % 8 === 0 ? 0 : 2 + (day % 4)); i++) {
      target.tasks.push(
        makeTask(day + i, `preview-history-${day}-${i}`, -day, true),
      );
    }
  }
  target.rewards = DEMO_TREASURES.map(
    ([emoji, cost, requiredPoints, title, description], i) => ({
      id: `preview-treasure-${i}`,
      householdId: home.id,
      emoji,
      cost,
      requiredPoints,
      title: title.he,
      description: description.he,
      claimed: [3, 8].includes(i),
      claimedByUserId: [3, 8].includes(i) ? players[0].id : null,
      code: null,
    }),
  );
  target.pointsLedger = players.map((user) => {
    const history = target.tasks.filter(
      (t) => t.assignedUserId === user.id && t.status === "Done",
    );
    const totalPoints = history.reduce((sum, t) => sum + t.pointsValue, 0);
    const spent = target.rewards
      .filter((r) => r.claimedByUserId === user.id)
      .reduce((sum, r) => sum + r.cost, 0);
    user.tasksCompletedThisMonth = history.filter(
      (t) =>
        new Date(t.completedAt).getMonth() === now.getMonth() &&
        new Date(t.completedAt).getFullYear() === now.getFullYear(),
    ).length;
    return {
      id: `preview-ledger-${user.id}`,
      householdId: home.id,
      userId: user.id,
      totalPoints,
      balance: totalPoints - spent,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    };
  });
  [...target.pointsLedger]
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .forEach((entry, i) => {
      entry.rank = i + 1;
    });
  target.notifications = [];
}
