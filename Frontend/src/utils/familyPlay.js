import { taskSkill } from "./familyWorld.js";

export const ADVENTURES = [
  {
    id: "moon",
    en: "The moonlight picnic",
    he: "פיקניק לאור ירח",
    intro: "A little help at home. A giant leap for our crew.",
    introHe: "קצת עזרה בבית. צעד ענק לצוות שלנו.",
    prize: "A moon for every room",
    prizeHe: "ירח לכל חדר",
  },
  {
    id: "garden",
    en: "The secret garden party",
    he: "המסיבה בגינה הסודית",
    intro: "Make room for something wonderful to grow.",
    introHe: "מפנים מקום למשהו נפלא לצמוח.",
    prize: "A moon for every room",
    prizeHe: "ירח לכל חדר",
  },
  {
    id: "camp",
    en: "Camp under the stars",
    he: "מחנה מתחת לכוכבים",
    intro: "Everyone brings a little something to camp.",
    introHe: "כל אחד מביא קצת מעצמו למחנה.",
    prize: "A moon for every room",
    prizeHe: "ירח לכל חדר",
  },
];
export const ROOM_COLORS = [
  { id: "mint", color: "#72c7ae", en: "Mint meadow", he: "אחו מנטה" },
  { id: "peach", color: "#efa98c", en: "Peach sunset", he: "שקיעת אפרסק" },
  { id: "lilac", color: "#b397dc", en: "Lilac dream", he: "חלום לילך" },
  { id: "sky", color: "#89bddf", en: "Blue sky", he: "שמיים כחולים" },
];
export const ROOM_ITEMS = [
  {
    id: "cushion",
    skill: null,
    need: 0,
    en: "Cloud cushion",
    he: "כרית ענן",
    hint: "Yours from the start",
    hintHe: "שלכם מההתחלה",
  },
  {
    id: "lamp",
    skill: "tidying",
    need: 3,
    en: "Little glow lamp",
    he: "מנורת אור קטן",
    hint: "3 tidying missions",
    hintHe: "3 משימות סידור",
  },
  {
    id: "plant",
    skill: "caring",
    need: 3,
    en: "Pocket garden",
    he: "גינת כיס",
    hint: "3 caring missions",
    hintHe: "3 משימות טיפול",
  },
  {
    id: "cup",
    skill: "kitchen",
    need: 3,
    en: "Kitchen captain cup",
    he: "גביע אלוף המטבח",
    hint: "3 kitchen missions",
    hintHe: "3 משימות מטבח",
  },
  {
    id: "moon",
    skill: "adventure",
    need: 1,
    en: "Adventure moon",
    he: "ירח הרפתקאות",
    hint: "Finish a family adventure",
    hintHe: "משלימים הרפתקה משפחתית",
  },
];
export const HELP_KINDS = [
  { id: "show", en: "Show me how", he: "תראו לי איך" },
  { id: "start", en: "Help me start", he: "עזרו לי להתחיל" },
  { id: "together", en: "Do it with me", he: "עשו את זה איתי" },
];
export const HELP_REPLIES = [
  { id: "coming", en: "I’m coming to help", he: "אני בא לעזור" },
  {
    id: "after-meal",
    en: "Let’s do it after our meal",
    he: "נעשה את זה אחרי הארוחה",
  },
  { id: "ready", en: "Ready! Come find me", he: "מוכנים! בואו אליי" },
];
export function weekKey(now = new Date()) {
  const date = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}
export function emptyPlay() {
  return {
    revision: 0,
    adventures: [],
    credits: [],
    rooms: {},
    tickets: [],
    help: [],
    weeks: {},
  };
}
export const owner = (task) =>
  String(task.assignedUserId ?? task.assigneeId ?? "");
export const isOpen = (task) => ["ToDo", "InProgress"].includes(task?.status);
export function roomUnlocks(state, userId) {
  const credits = state.credits.filter((c) => c.userId === String(userId));
  return ROOM_ITEMS.filter(
    (item) =>
      !item.skill ||
      (item.skill === "adventure"
        ? state.adventures.some(
            (a) =>
              a.completedAt &&
              a.missions.some((m) => m.userId === String(userId)),
          )
        : credits.filter((c) => c.skill === item.skill).length >= item.need),
  ).map((i) => i.id);
}
export function reconcilePlay(state, context, now = new Date()) {
  const next = structuredClone(state);
  const menu = next.weeks[weekKey(now)];
  if (menu) {
    // Parent edits to ordinary missions must not strand a child's three slots
    // or let two people promise a job that was subsequently reassigned.
    menu.taskIds = menu.taskIds.filter((id) =>
      context.tasks.some((t) => String(t.id) === id),
    );
    for (const [userId, choices] of Object.entries(menu.choices)) {
      menu.choices[userId] = choices.filter((id) => {
        const task = context.tasks.find((t) => String(t.id) === id);
        return task && (task.status === "Done" || owner(task) === userId);
      });
    }
  }
  for (const task of context.tasks) {
    if (
      task.status === "Done" &&
      owner(task) &&
      !next.credits.some((c) => c.taskId === String(task.id))
    )
      next.credits.push({
        taskId: String(task.id),
        userId: owner(task),
        skill: taskSkill(task),
      });
  }
  for (const adventure of next.adventures) {
    for (const mission of adventure.missions) {
      if (
        context.tasks.some(
          (t) => String(t.id) === mission.taskId && t.status === "Done",
        )
      )
        mission.done = true;
    }
    if (
      !adventure.archived &&
      !adventure.completedAt &&
      adventure.missions.every((m) => m.done)
    )
      adventure.completedAt = now.toISOString();
  }
  for (const reward of context.rewards) {
    const userId = reward.claimedByUserId ?? reward.claimedBy;
    if (
      userId != null &&
      !next.tickets.some((t) => t.rewardId === String(reward.id))
    )
      next.tickets.push({
        rewardId: String(reward.id),
        userId: String(userId),
        title: reward.title,
        emoji: reward.emoji,
        status: "waiting",
        date: "",
        when: "after-dinner",
        createdAt: now.toISOString(),
      });
  }
  for (const help of next.help) {
    if (
      context.tasks.some(
        (t) => String(t.id) === help.taskId && t.status === "Done",
      )
    )
      help.status = "resolved";
  }
  return next;
}
export function applyPlayCommand(state, command, context, now = new Date()) {
  const next = reconcilePlay(state, context, now);
  const { action, ...data } = command;
  const caller = String(context.userId);
  const member = context.members.find((m) => String(m.userId) === caller);
  if (!member) throw new Error("This home is not available.");
  const admin = () => {
    if (!context.isAdmin)
      throw new Error("Ask a parent to manage this part of your home.");
  };
  const task = (id) => context.tasks.find((t) => String(t.id) === String(id));
  const ownTask = (id) => {
    const t = task(id);
    if (!t || owner(t) !== caller || !isOpen(t))
      throw new Error("Choose one of your open missions.");
    return t;
  };
  const ids = (values) => {
    if (!Array.isArray(values) || values.some((v) => typeof v !== "string"))
      throw new Error("Choose missions from your home.");
    return [...new Set(values)];
  };
  switch (action) {
    case "adventure.start": {
      admin();
      if (!ADVENTURES.some((a) => a.id === data.theme))
        throw new Error("Choose an adventure.");
      if (next.adventures.some((a) => !a.archived && !a.completedAt))
        throw new Error("Finish or put away the current adventure first.");
      const selected = ids(data.taskIds);
      if (
        !selected.length ||
        selected.length > 8 ||
        selected.some(
          (id) =>
            !isOpen(task(id)) ||
            !context.members.some((m) => String(m.userId) === owner(task(id))),
        )
      )
        throw new Error("Choose 1–8 open, assigned missions.");
      next.adventures.push({
        id: context.newId(),
        theme: data.theme,
        createdAt: now.toISOString(),
        completedAt: null,
        archived: false,
        missions: selected.map((id) => ({
          taskId: id,
          title: task(id).title,
          userId: owner(task(id)),
          done: false,
        })),
      });
      break;
    }
    case "adventure.archive": {
      admin();
      const adventure = next.adventures.find((a) => a.id === data.id);
      if (!adventure) throw new Error("Adventure not found.");
      adventure.archived = true;
      break;
    }
    case "room.save": {
      const items = ids(data.items);
      if (
        !ROOM_COLORS.some((c) => c.id === data.color) ||
        items.length > 5 ||
        items.some((id) => !roomUnlocks(next, caller).includes(id))
      )
        throw new Error("Choose decorations you have earned.");
      next.rooms[caller] = { color: data.color, items };
      break;
    }
    case "help.ask": {
      const mission = ownTask(data.taskId);
      if (!HELP_KINDS.some((k) => k.id === data.kind))
        throw new Error("Choose the help you need.");
      if (
        !Number.isInteger(data.step) ||
        data.step < 0 ||
        data.step > (mission.subItems?.length ?? 0)
      )
        throw new Error("Choose a step in this mission.");
      const existing = next.help.find(
        (h) =>
          h.taskId === String(mission.id) &&
          h.userId === caller &&
          h.status !== "resolved",
      );
      const value = {
        id: existing?.id || context.newId(),
        taskId: String(mission.id),
        userId: caller,
        title: mission.title,
        kind: data.kind,
        step: data.step,
        status: "waiting",
        reply: "",
        createdAt: now.toISOString(),
      };
      if (existing) Object.assign(existing, value);
      else next.help.push(value);
      break;
    }
    case "help.reply": {
      admin();
      const help = next.help.find((h) => h.id === data.id);
      if (
        !help ||
        help.status === "resolved" ||
        !HELP_REPLIES.some((r) => r.id === data.reply)
      )
        throw new Error("Choose an open help request and a reply.");
      help.reply = data.reply;
      help.status = "answered";
      break;
    }
    case "help.resolve": {
      const help = next.help.find((h) => h.id === data.id);
      if (!help || (!context.isAdmin && help.userId !== caller))
        throw new Error("This request is not available.");
      help.status = "resolved";
      break;
    }
    case "ticket.schedule": {
      admin();
      const ticket = next.tickets.find((t) => t.rewardId === data.rewardId);
      const date = new Date(`${data.date}T12:00:00Z`);
      if (
        !ticket ||
        ticket.status === "enjoyed" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(data.date) ||
        !Number.isFinite(+date) ||
        date.toISOString().slice(0, 10) !== data.date ||
        data.date < now.toISOString().slice(0, 10) ||
        !["morning", "afternoon", "after-dinner", "anytime"].includes(data.when)
      )
        throw new Error("Choose today or a future date for this reward.");
      ticket.date = data.date;
      ticket.when = data.when;
      ticket.status = "planned";
      break;
    }
    case "ticket.enjoy": {
      admin();
      const ticket = next.tickets.find((t) => t.rewardId === data.rewardId);
      if (!ticket || ticket.status !== "planned")
        throw new Error("Plan this reward before marking it enjoyed.");
      ticket.status = "enjoyed";
      ticket.enjoyedAt = now.toISOString();
      break;
    }
    case "week.offer": {
      admin();
      const selected = ids(data.taskIds);
      const key = weekKey(now);
      const previous = next.weeks[key];
      if (
        selected.length > 30 ||
        selected.some(
          (id) =>
            !task(id) ||
            (!isOpen(task(id)) && !previous?.taskIds.includes(id)) ||
            !context.members.some((m) => String(m.userId) === owner(task(id))),
        )
      )
        throw new Error("Choose up to 30 assigned missions.");
      if (
        previous &&
        Object.values(previous.choices)
          .flat()
          .some((id) => !selected.includes(id))
      )
        throw new Error("Keep the missions your crew already chose.");
      next.weeks[key] = { taskIds: selected, choices: previous?.choices || {} };
      break;
    }
    case "week.choose": {
      const mission = ownTask(data.taskId);
      const week = next.weeks[weekKey(now)];
      if (!week?.taskIds.includes(String(mission.id)))
        throw new Error("This mission is not on this week’s menu.");
      const choices = week.choices[caller] || [];
      if (typeof data.selected !== "boolean")
        throw new Error("Choose or release this mission.");
      const selected = choices.filter((id) => id !== String(mission.id));
      if (data.selected) selected.push(String(mission.id));
      if (selected.length > 3)
        throw new Error(
          "Pick up to three missions. You can change an unfinished choice.",
        );
      week.choices[caller] = selected;
      break;
    }
    default:
      throw new Error("This action is not available.");
  }
  return next;
}
