import { TASK_STATUSES } from '../data/mockData';
import {
  store,
  delay,
  generateId,
  getActiveHouseholdId,
  getActiveHousehold,
  assertCurrentUser,
  getRawUser,
} from './store';
import { enrichTaskView, enrichUser } from './mappers';
import { updateUserPoints, getLeaderboard, fetchUsers } from './usersApi';
import { addSubItems } from './tasksApi';
import { isAdmin } from '../utils/permissions';
import { parseHebrewDuePhrase } from '../utils/dateFormat';

export const ASSISTANT_PIN = '1234';

function normalize(text) {
  return (text || '').trim().replace(/\s+/g, ' ');
}

function householdMembers() {
  const hid = getActiveHouseholdId();
  return store.members
    .filter((m) => m.householdId === hid)
    .map((m) => getRawUser(m.userId))
    .filter(Boolean);
}

function resolveUserByName(name) {
  if (!name) return null;
  const n = name.trim().toLowerCase();
  if (/^(פתוח|פתוחה|כולם|everyone|open|unassigned)$/i.test(n)) {
    return { id: null, fullName: 'פתוחה לכולם', open: true };
  }
  const aliases = {
    ofek: 'user-ofek',
    אופק: 'user-ofek',
    refael: 'user-refael',
    רפאל: 'user-refael',
    rafael: 'user-refael',
    amit: 'user-amit',
    עמית: 'user-amit',
  };
  if (aliases[n]) {
    const u = getRawUser(aliases[n]);
    return u ? { id: u.id, fullName: u.fullName, open: false } : null;
  }
  const members = householdMembers();
  const found = members.find(
    (u) =>
      u.fullName.toLowerCase() === n ||
      u.fullName.toLowerCase().includes(n) ||
      (u.email || '').toLowerCase().startsWith(n)
  );
  return found ? { id: found.id, fullName: found.fullName, open: false } : null;
}

function memberChoiceLabel() {
  const names = householdMembers().map((u) => u.fullName);
  return `${names.join(' / ')} / פתוחה לכולם`;
}

function findTasksByTitleQuery(query, { includeDone = false } = {}) {
  const hid = getActiveHouseholdId();
  const q = (query || '').toLowerCase().trim();
  let list = store.tasks.filter((t) => t.householdId === hid);
  if (!includeDone) {
    list = list.filter((t) => t.status !== TASK_STATUSES.DONE);
  }
  if (!q) return list;

  const scored = list
    .map((t) => {
      const title = t.title.toLowerCase();
      let score = 0;
      if (title === q) score = 100;
      else if (title.includes(q)) score = 80;
      else {
        const parts = q.split(/\s+/).filter((w) => w.length >= 2);
        score = parts.reduce((s, w) => (title.includes(w) ? s + 20 : s), 0);
      }
      return { t, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map((x) => x.t);
}

function stripCompleteNoise(text) {
  return text
    .replace(/סיימתי|סיימנו|גמרתי|בוצע|לשטוף|לנקות|את|של/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripDeleteNoise(text) {
  return text
    .replace(/תמחק|למחוק|מחק|את|משימת|משימה|של/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseTaskBody(rawBody) {
  let body = (rawBody || '').trim();
  let points = null;
  const pointsMatch = body.match(/\(?\s*(\d+)\s*נק['׳']?\s*\)?/i);
  if (pointsMatch) {
    points = Number(pointsMatch[1]) || 10;
    body = body.replace(pointsMatch[0], '').trim().replace(/[–—-]\s*$/, '').trim();
  }

  let dueDate = null;
  const dueTail =
    body.match(/\s+עד\s+(.+)$/i) ||
    body.match(/\s+ליום\s+(.+)$/i) ||
    body.match(/\s+(היום|מחר)$/i);
  if (dueTail) {
    const phrase = (dueTail[1] || dueTail[0] || '').trim();
    dueDate = parseHebrewDuePhrase(phrase) || parseHebrewDuePhrase(`יום ${phrase}`);
    if (dueDate) {
      body = body.slice(0, dueTail.index).trim();
    }
  }
  if (!dueDate) {
    dueDate = parseHebrewDuePhrase(body);
  }

  return { title: body, pointsValue: points, dueDate };
}

function splitGroceryItems(listText) {
  return (listText || '')
    .split(/[,،]+|\s+ו(?:־|-)?\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !/^(עד|ליום)$/i.test(s));
}

function findOpenShoppingTask() {
  const hid = getActiveHouseholdId();
  return store.tasks.find(
    (t) =>
      t.householdId === hid &&
      !t.archivedAt &&
      t.categoryId === 'shopping' &&
      t.status !== TASK_STATUSES.DONE
  );
}

function formatDueHebrew(iso) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    const datePart = new Intl.DateTimeFormat('he-IL', {
      day: 'numeric',
      month: 'long',
    }).format(d);
    const timePart = new Intl.DateTimeFormat('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
    return `${datePart} ב-${timePart}`;
  } catch {
    return null;
  }
}

export async function botCreateTask({
  title,
  pointsValue = 10,
  assignedUserId = null,
  dueDate = null,
  subItems = [],
  categoryId = 'other',
}) {
  await delay(300);
  assertCurrentUser();
  const actor = store.currentUser;
  const hid = getActiveHouseholdId();
  const normalizedItems = (Array.isArray(subItems) ? subItems : [])
    .map((item) => {
      if (typeof item === 'string') {
        const text = item.trim();
        return text ? { id: generateId('si'), text, isCompleted: false } : null;
      }
      const text = (item?.text || '').trim();
      return text
        ? { id: item.id || generateId('si'), text, isCompleted: !!item.isCompleted }
        : null;
    })
    .filter(Boolean);

  const task = {
    id: generateId('task'),
    householdId: hid,
    title: title.trim(),
    description: '',
    categoryId: categoryId || (normalizedItems.length ? 'shopping' : 'other'),
    pointsValue: Number(pointsValue) || 10,
    assignedUserId: assignedUserId || null,
    createdById: actor.id,
    status: TASK_STATUSES.TODO,
    dueDate: dueDate || null,
    createdAt: new Date().toISOString(),
    completedAt: null,
    proofImageData: null,
    proofImageUrl: null,
    proofSubmittedAt: null,
    approvedById: null,
    rejectedReason: null,
    subItems: normalizedItems,
  };
  store.tasks.push(task);
  return enrichTaskView({ ...task });
}

export async function botCompleteTask(taskId) {
  await delay(350);
  const actor = assertCurrentUser();
  const index = store.tasks.findIndex((t) => t.id === taskId);
  if (index === -1) throw new Error('משימה לא נמצאה');
  const task = store.tasks[index];
  if (task.householdId !== getActiveHouseholdId()) throw new Error('משימה לא שייכת לבית הפעיל');

  if (task.status === TASK_STATUSES.DONE) {
    return { task: enrichTaskView({ ...task }), mode: 'already_done' };
  }

  if (!task.assignedUserId) {
    task.assignedUserId = actor.id;
  }

  if (task.assignedUserId !== actor.id && !isAdmin(actor)) {
    throw new Error('המשימה משויכת למישהו אחר — רק המשויך או מנהל יכולים לסיים אותה');
  }

  const household = getActiveHousehold();
  const needsProof = household?.requireProofApproval && !isAdmin(actor);

  if (needsProof && task.status !== TASK_STATUSES.PENDING_APPROVAL) {
    task.status = TASK_STATUSES.PENDING_APPROVAL;
    task.proofSubmittedAt = new Date().toISOString();
    return { task: enrichTaskView({ ...task }), mode: 'pending_approval' };
  }

  const prev = task.status;
  task.status = TASK_STATUSES.DONE;
  task.completedAt = new Date().toISOString();
  task.approvedById = actor.id;
  if (task.assignedUserId && prev !== TASK_STATUSES.DONE) {
    await updateUserPoints(task.assignedUserId, task.pointsValue);
  }
  return { task: enrichTaskView({ ...task }), mode: 'done' };
}

export async function botDeleteTask(taskId) {
  await delay(300);
  assertCurrentUser();
  const index = store.tasks.findIndex((t) => t.id === taskId);
  if (index === -1) throw new Error('משימה לא נמצאה');
  const [removed] = store.tasks.splice(index, 1);
  if (removed.status === TASK_STATUSES.DONE && removed.assignedUserId && removed.approvedById) {
    await updateUserPoints(removed.assignedUserId, -removed.pointsValue);
  }
  return enrichTaskView({ ...removed });
}

export function verifyAssistantPin(pin) {
  return String(pin || '').trim() === ASSISTANT_PIN;
}

export async function processAssistantMessage(rawText, session = null) {
  const text = normalize(rawText);
  if (!text) {
    return { type: 'error', reply: 'כתבו פקודה, למשל: מה הניקוד של הבית?' };
  }

  if (session?.pendingCreate) {
    const choice = resolveUserByName(text);
    if (!choice && !/פתוח|כולם|ofek|refael|amit|אופק|רפאל|עמית/i.test(text)) {
      return {
        type: 'need_assignee',
        reply: `לא זיהיתי את השם. למי לשייך? (${memberChoiceLabel()})`,
        data: { pendingCreate: session.pendingCreate },
      };
    }
    const assignee = choice || resolveUserByName(text);
    const assignedUserId = assignee?.open ? null : assignee?.id ?? null;
    const pending = session.pendingCreate;
    const task = await botCreateTask({
      title: pending.title,
      pointsValue: pending.pointsValue,
      assignedUserId,
      dueDate: pending.dueDate || null,
      subItems: pending.subItems || [],
      categoryId: pending.categoryId || 'other',
    });
    const who = assignee?.open || !assignedUserId ? 'פתוחה לכולם' : assignee.fullName;
    const dueBit = task.dueDate ? ` · יעד: ${formatDueHebrew(task.dueDate)}` : '';
    const itemsBit =
      task.subItems?.length > 0 ? ` · ${task.subItems.length} פריטים ברשימה` : '';
    return {
      type: 'created',
      reply: `נוספה משימה: "${task.title}" · ${task.pointsValue ?? task.points} נק׳ · משויכת ל־${who}${dueBit}${itemsBit} ✅`,
      data: { task },
      clearPending: true,
    };
  }

  if (session?.pendingDelete) {
    if (!verifyAssistantPin(text)) {
      return {
        type: 'need_pin',
        reply: 'סיסמה / PIN שגוי. נסו שוב (דמו: 1234), או כתבו "ביטול".',
        data: { pendingDelete: session.pendingDelete },
      };
    }
    const removed = await botDeleteTask(session.pendingDelete.taskId);
    return {
      type: 'deleted',
      reply: `נמחקה המשימה "${removed.title}" מהרשימה 🗑️`,
      data: { task: removed },
      clearPending: true,
    };
  }

  if (/^ביטול$|^cancel$/i.test(text)) {
    return { type: 'cancelled', reply: 'בוטל.', clearPending: true };
  }

  if (/ניקוד של (ה)?בית|סה.?כ נקודות|מה הניקוד של הבית|נקודות הבית/i.test(text)) {
    await delay(250);
    const board = await getLeaderboard();
    const total = board.reduce((s, u) => s + (u.points || 0), 0);
    const leader = board[0];
    return {
      type: 'household_score',
      reply: leader
        ? `ניקוד הבית החודשי: ${total} נק׳ · מוביל/ה: ${leader.name || leader.fullName} עם ${leader.points} נק׳ 🏆`
        : `ניקוד הבית החודשי: ${total} נק׳`,
      data: { total, leader },
    };
  }

  if (/ניקוד שלי|מה הניקוד|כמה יש לי|הנקודות שלי/i.test(text)) {
    await delay(250);
    const board = await getLeaderboard();
    const me = board.find((u) => u.id === store.currentUser?.id);
    if (!me) return { type: 'error', reply: 'לא מצאתי את הניקוד שלך.' };
    return {
      type: 'score',
      reply: `הניקוד שלך: ${me.points} נק׳ · מקום ${me.rank ?? '—'} בלוח המנצחים 🏆`,
      data: { points: me.points, rank: me.rank },
    };
  }

  const tasksForMatch =
    text.match(/איזה משימות יש ל([^?؟]+)/i) ||
    text.match(/משימות של ([^?؟]+)/i) ||
    text.match(/מה יש ל([^?؟]+)/i);

  if (tasksForMatch) {
    const person = resolveUserByName(tasksForMatch[1].trim());
    if (!person || person.open) {
      return { type: 'error', reply: `לא מצאתי משתמש בשם "${tasksForMatch[1].trim()}".` };
    }
    await delay(250);
    const hid = getActiveHouseholdId();
    const list = store.tasks.filter(
      (t) =>
        t.householdId === hid &&
        t.assignedUserId === person.id &&
        (t.status === TASK_STATUSES.TODO || t.status === TASK_STATUSES.IN_PROGRESS)
    );
    if (!list.length) {
      return {
        type: 'tasks_for_user',
        reply: `אין ל${person.fullName} משימות פתוחות (ToDo) כרגע.`,
      };
    }
    const lines = list
      .map((t) => `• ${t.title} (${t.pointsValue} נק׳)${t.dueDate ? ` · ${formatDueHebrew(t.dueDate)}` : ''}`)
      .join('\n');
    return {
      type: 'tasks_for_user',
      reply: `משימות ToDo של ${person.fullName}:\n${lines}`,
      data: { tasks: list.map((t) => enrichTaskView({ ...t })) },
    };
  }

  const whenMatch =
    text.match(/מתי (?:ה)?משימ(?:ה|ת)(?: של)?\s*(.+)\??$/i) ||
    text.match(/מתי (.+)\??$/i);

  if (whenMatch && /מתי|תאריך|מתוכנ/i.test(text)) {
    const q = whenMatch[1].replace(/[?؟]/g, '').trim();
    const matches = findTasksByTitleQuery(q);
    const task = matches[0];
    if (!task) {
      return { type: 'error', reply: `לא מצאתי משימה שמתאימה ל"${q}".` };
    }
    const due = formatDueHebrew(task.dueDate);
    return {
      type: 'task_due',
      reply: due
        ? `"${task.title}" מתוכננת לתאריך ${due} ⏰`
        : `"${task.title}" ללא תאריך יעד מוגדר.`,
      data: { task: enrichTaskView({ ...task }) },
    };
  }

  const groceryMatch =
    text.match(/תוסיף\s+ל(?:רשימת\s+)?קניות\s*[:：]\s*(.+)/i) ||
    text.match(/הוסף\s+ל(?:רשימת\s+)?קניות\s*[:：]\s*(.+)/i) ||
    text.match(/תוסיף\s+לקניות\s*[:：]\s*(.+)/i) ||
    text.match(/הוסף\s+לקניות\s*[:：]\s*(.+)/i);

  if (groceryMatch) {
    const parsed = parseTaskBody(groceryMatch[1]);
    const items = splitGroceryItems(parsed.title);
    if (!items.length) {
      return {
        type: 'error',
        reply: 'לא מצאתי פריטים. דוגמה: תוסיף לקניות: חלב, לחם, גבינה עד יום חמישי',
      };
    }

    const existing = findOpenShoppingTask();
    if (existing) {
      if (parsed.dueDate) existing.dueDate = parsed.dueDate;
      const updated = await addSubItems(existing.id, items);
      const dueBit = updated.dueDate ? ` · יעד: ${formatDueHebrew(updated.dueDate)}` : '';
      return {
        type: 'grocery_updated',
        reply: `נוספו ${items.length} פריטים לרשימת הקניות${dueBit}: ${items.join(', ')} 🛒`,
        data: { task: updated },
      };
    }

    const task = await botCreateTask({
      title: 'קניות / סופר',
      pointsValue: parsed.pointsValue || 15,
      assignedUserId: null,
      dueDate: parsed.dueDate,
      subItems: items,
      categoryId: 'shopping',
    });
    const dueBit = task.dueDate ? ` · יעד: ${formatDueHebrew(task.dueDate)}` : '';
    return {
      type: 'created',
      reply: `נוצרה רשימת קניות עם ${items.length} פריטים${dueBit}: ${items.join(', ')} 🛒`,
      data: { task },
    };
  }

  const createWithUser =
    text.match(/תוסיף\s+ל([^\s:：]+)\s+משימה\s*[:：]\s*(.+)/i) ||
    text.match(/הוסף\s+ל([^\s:：]+)\s+משימה\s*[:：]\s*(.+)/i);

  const createPlain =
    text.match(/תוסיף\s*משימה\s*[:：]\s*(.+)/i) ||
    text.match(/הוסף\s*משימה\s*[:：]\s*(.+)/i) ||
    text.match(/משימה חדשה\s*[:：]\s*(.+)/i);

  if (createWithUser || createPlain) {
    let assigneeName = createWithUser ? createWithUser[1] : null;
    const rawBody = (createWithUser ? createWithUser[2] : createPlain[1]).trim();
    const parsed = parseTaskBody(rawBody);
    const points = parsed.pointsValue ?? 10;
    const body = parsed.title;
    const dueDate = parsed.dueDate;

    if (!body) {
      return { type: 'error', reply: 'חסר שם למשימה. דוגמה: תוסיף משימה: לקנות חלב עד מחר (10 נק\')' };
    }

    const pendingPayload = {
      title: body,
      pointsValue: points,
      dueDate,
      subItems: [],
      categoryId: /קניות|סופר|מכולת/i.test(body) ? 'shopping' : 'other',
    };

    if (!assigneeName) {
      return {
        type: 'need_assignee',
        reply: `למי לשייך את המשימה "${body}"? (${memberChoiceLabel()})`,
        data: { pendingCreate: pendingPayload },
      };
    }

    const assignee = resolveUserByName(assigneeName);
    if (!assignee) {
      return {
        type: 'need_assignee',
        reply: `לא זיהיתי את "${assigneeName}". למי לשייך? (${memberChoiceLabel()})`,
        data: { pendingCreate: pendingPayload },
      };
    }

    const task = await botCreateTask({
      title: body,
      pointsValue: points,
      assignedUserId: assignee.open ? null : assignee.id,
      dueDate,
      categoryId: pendingPayload.categoryId,
    });
    const who = assignee.open ? 'פתוחה לכולם' : assignee.fullName;
    const dueBit = task.dueDate ? ` · יעד: ${formatDueHebrew(task.dueDate)}` : '';
    return {
      type: 'created',
      reply: `נוספה משימה: "${task.title}" · ${task.pointsValue ?? points} נק׳ · משויכת ל־${who}${dueBit} ✅`,
      data: { task },
    };
  }

  if (/תמחק|למחוק|מחק משימ/i.test(text)) {
    const q = stripDeleteNoise(text);
    const matches = findTasksByTitleQuery(q, { includeDone: true });
    const task = matches[0];
    if (!task) {
      return { type: 'error', reply: `לא מצאתי משימה למחיקה שמתאימה ל"${q || text}".` };
    }
    return {
      type: 'need_pin',
      reply: `למחיקת המשימה "${task.title}", אנא הזן סיסמה / PIN אישור (דמו: 1234)`,
      data: { pendingDelete: { taskId: task.id, title: task.title } },
    };
  }

  if (/סיימתי|סיימנו|גמרתי|סיים/i.test(text)) {
    const q = stripCompleteNoise(text);
    const matches = findTasksByTitleQuery(q || text);
    let task = matches[0];
    const meId = store.currentUser?.id;
    const preferred = matches.find(
      (t) => t.assignedUserId === meId || !t.assignedUserId
    );
    if (preferred) task = preferred;

    if (!task) {
      return {
        type: 'error',
        reply: 'לא מצאתי משימה פתוחה מתאימה. נסו: "סיימתי לשטוף כלים".',
      };
    }

    const { task: updated, mode } = await botCompleteTask(task.id);
    const me = enrichUser(getRawUser(store.currentUser.id));

    if (mode === 'pending_approval') {
      return {
        type: 'completed',
        reply: `"${updated.title}" נשלחה לאישור מנהל (Pending Approval) ⏳`,
        data: { task: updated },
      };
    }
    if (mode === 'already_done') {
      return { type: 'completed', reply: `"${updated.title}" כבר מסומנת כבוצעה.` };
    }
    return {
      type: 'completed',
      reply: `מעולה! "${updated.title}" סומנה כ־Done · +${updated.points ?? updated.pointsValue} נק׳ 🎉 (יתרה: ${me?.points ?? 0})`,
      data: { task: updated },
    };
  }

  const users = await fetchUsers();
  const names = users.map((u) => u.name || u.fullName).join(', ');

  return {
    type: 'help',
    reply:
      `אני מחובר לרשימת המשימות החיה של הבית 🤖\n` +
      `• תוסיף לקניות: חלב, לחם, גבינה עד יום חמישי\n` +
      `• תוסיף לרפאל משימה: לקנות חלב עד מחר (10 נק')\n` +
      `• תוסיף משימה: שטיפת כלים\n` +
      `• סיימתי לשטוף כלים\n` +
      `• מתי המשימה של ניקוי סלון?\n` +
      `• איזה משימות יש לאופק?\n` +
      `• מה הניקוד של הבית?\n` +
      `• תמחק את משימת ניקוי מקרר\n` +
      `חברים בבית: ${names}`,
  };
}
