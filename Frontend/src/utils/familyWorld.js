export const WORLD_PIECES = [
  { id: "garden", required: 3, en: "Rainbow garden", he: "גינת הקשת" },
  { id: "picnic", required: 8, en: "Picnic party", he: "מסיבת פיקניק" },
  { id: "observatory", required: 15, en: "Star explorer", he: "מצפה הכוכבים" },
];
export const SUPPORT_LEVELS = [
  { id: "together", en: "Together", he: "ביחד" },
  { id: "hints", en: "With hints", he: "עם רמזים" },
  { id: "independent", en: "Independent", he: "באופן עצמאי" },
];
export const SKILLS = [
  { id: "tidying", en: "Tidying", he: "סידור" },
  { id: "kitchen", en: "Kitchen", he: "מטבח" },
  { id: "caring", en: "Caring", he: "טיפול" },
  { id: "other", en: "Other missions", he: "משימות אחרות" },
];
export function taskSkill(task) {
  const key = task.categoryId ?? task.category;
  if (["kitchen", "cooking", "shopping"].includes(key)) return "kitchen";
  if (["living", "cleaning", "room", "bedroom", "laundry"].includes(key))
    return "tidying";
  if (["pets", "pet", "plants", "garden"].includes(key)) return "caring";
  return "other";
}
export function supportFor(world, userId, task) {
  return (
    world?.support?.find(
      (s) => String(s.userId) === String(userId) && s.skill === taskSkill(task),
    )?.level ?? "hints"
  );
}
export function missionChoices(tasks, userId) {
  return tasks
    .filter(
      (t) =>
        String(t.assignedUserId ?? t.assigneeId) === String(userId) &&
        ["ToDo", "InProgress"].includes(t.status),
    )
    .sort(
      (a, b) =>
        (a.status === "InProgress" ? 0 : 1) -
          (b.status === "InProgress" ? 0 : 1) ||
        String(a.dueDate ?? a.dueAt ?? "9999").localeCompare(
          String(b.dueDate ?? b.dueAt ?? "9999"),
        ),
    );
}
export function reconcileWorld(world, tasks) {
  const credits = [
    ...new Set([
      ...(world.credits ?? []),
      ...tasks.filter((t) => t.status === "Done").map((t) => String(t.id)),
    ]),
  ];
  return { ...world, credits, completed: credits.length };
}

// Templates are chosen and reviewed by an adult; never inferred for an existing task.
export const MISSION_TEMPLATES = [
  {
    id: "toys",
    category: "room",
    en: "Give your toys a home",
    he: "מחזירים צעצועים הביתה",
    steps: [
      ["Gather the toys from the floor", "אוספים את הצעצועים מהרצפה"],
      ["Put each toy in its basket or shelf", "מחזירים כל צעצוע לסל או למדף"],
      ["Check that the floor is clear", "בודקים שהרצפה פנויה"],
    ],
  },
  {
    id: "table",
    category: "kitchen",
    en: "Get the table ready",
    he: "מכינים את השולחן",
    steps: [
      ["Ask a grown-up what the table needs", "שואלים מבוגר מה צריך לשולחן"],
      ["Put out the items you were given", "מסדרים את הפריטים שקיבלתם"],
      ["Check each place together", "בודקים ביחד כל מקום"],
    ],
  },
  {
    id: "laundry",
    category: "cleaning",
    en: "Find the matching socks",
    he: "מוצאים זוגות לגרביים",
    steps: [
      ["Spread out the clean socks", "פורסים את הגרביים הנקיים"],
      ["Match socks by size and pattern", "מתאימים גרביים לפי גודל ודוגמה"],
      ["Put the pairs in their drawer", "מחזירים את הזוגות למגירה"],
    ],
  },
];
