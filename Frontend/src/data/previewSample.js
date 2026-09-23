import { store } from "../services/store";

// Illustrative records for `npm run demo` only. No network or persisted household writes.
export function seedPreview() {
  const now = new Date();
  const atDay = (offset) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    d.setHours(9, 0, 0, 0);
    return d.toISOString();
  };
  store.households[0].displayName = "The Sunshine household";
  store.households[0].name = "The Sunshine household";
  store.households[0].address = "";
  store.households[0].city = "";
  store.households[0].houseNumber = "";
  store.households[0].street = "";
  store.users.forEach((u, i) => {
    u.fullName = ["Noam", "Maya", "Alex"][i] || u.fullName;
  });
  store.tasks.forEach((task, i) => {
    task.createdAt = atDay(-10);
    task.dueDate = atDay((i % 5) - 1);
    if (task.status === "Done") task.completedAt = atDay(-(i % 6));
  });
  const templates = store.tasks.slice(0, 7);
  for (let day = 1; day <= 35; day++) {
    const dailyCount = day % 8 === 0 ? 0 : 1 + (day % 4);
    for (let i = 0; i < dailyCount; i++) {
      const base = templates[(day + i) % templates.length];
      store.tasks.push({
        ...structuredClone(base),
        id: `preview-history-${day}-${i}`,
        status: "Done",
        assignedUserId: store.users[(day + i) % store.users.length].id,
        createdAt: atDay(-day - 1),
        dueDate: atDay(-day),
        completedAt: atDay(-day),
        subItems: [],
      });
    }
  }
  store.pointsLedger.forEach((entry, i) => {
    entry.month = now.getMonth() + 1;
    entry.year = now.getFullYear();
    entry.totalPoints = [180, 245, 135][i] || 100;
  });
}
