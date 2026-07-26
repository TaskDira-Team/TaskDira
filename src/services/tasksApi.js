import { TASK_STATUSES } from '../data/mockData';
import { isAdmin, canMoveTask, canDeleteTask, canEditTaskFully } from '../utils/permissions';
import { store, delay, generateId, assertCurrentUser, getActiveHouseholdId } from './store';
import { enrichTaskView } from './mappers';
import { updateUserPoints } from './usersApi';

function normalizeSubItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (typeof item === 'string') {
        const text = item.trim();
        if (!text) return null;
        return { id: generateId('si'), text, isCompleted: false };
      }
      const text = (item.text || '').trim();
      if (!text) return null;
      return {
        id: item.id || generateId('si'),
        text,
        isCompleted: !!item.isCompleted,
      };
    })
    .filter(Boolean);
}

export async function fetchTasks() {
  await delay();
  const hid = getActiveHouseholdId();
  return store.tasks
    .filter((t) => t.householdId === hid && !t.archivedAt)
    .map((t) => enrichTaskView({ ...t }));
}

export async function createTask(taskData, actor) {
  await delay();
  const user = actor || assertCurrentUser();
  const hid = getActiveHouseholdId();

  const pointsValue = Number(taskData.pointsValue ?? taskData.points) || 10;
  const assignedUserId =
    taskData.assignedUserId ?? taskData.assigneeId ?? user.id;

  const task = {
    id: generateId('task'),
    householdId: hid,
    title: taskData.title,
    description: taskData.description || '',
    categoryId: taskData.categoryId || taskData.category || 'other',
    pointsValue,
    assignedUserId: assignedUserId || null,
    createdById: user.id,
    status: taskData.status || TASK_STATUSES.TODO,
    dueDate: taskData.dueDate || taskData.dueAt || null,
    createdAt: new Date().toISOString(),
    completedAt: null,
    proofImageData: null,
    proofImageUrl: null,
    proofSubmittedAt: null,
    approvedById: null,
    rejectedReason: null,
    subItems: normalizeSubItems(taskData.subItems),
  };

  store.tasks.push(task);
  return enrichTaskView({ ...task });
}

export async function updateTask(taskId, updates, actor) {
  await delay();
  const user = actor || assertCurrentUser();
  const index = store.tasks.findIndex((t) => t.id === taskId);
  if (index === -1) throw new Error('משימה לא נמצאה');

  const task = store.tasks[index];
  if (!canEditTaskFully(user, task)) throw new Error('אין הרשאה לערוך משימה זו');

  const sanitized = { ...updates };

  if (sanitized.category !== undefined) {
    sanitized.categoryId = sanitized.category;
    delete sanitized.category;
  }
  if (sanitized.points !== undefined) {
    sanitized.pointsValue = Number(sanitized.points);
    delete sanitized.points;
  }
  if (sanitized.assigneeId !== undefined) {
    sanitized.assignedUserId = sanitized.assigneeId;
    delete sanitized.assigneeId;
  }
  if (sanitized.dueAt !== undefined) {
    sanitized.dueDate = sanitized.dueAt;
    delete sanitized.dueAt;
  }
  if (sanitized.subItems !== undefined) {
    sanitized.subItems = normalizeSubItems(sanitized.subItems);
  }

  const { status, ...rest } = sanitized;
  if (status !== undefined && status !== task.status) {
    await updateTaskStatus(taskId, status, user);
    const idx = store.tasks.findIndex((t) => t.id === taskId);
    store.tasks[idx] = { ...store.tasks[idx], ...rest };
    return enrichTaskView({ ...store.tasks[idx] });
  }

  store.tasks[index] = { ...store.tasks[index], ...sanitized };
  return enrichTaskView({ ...store.tasks[index] });
}

export async function updateTaskStatus(taskId, newStatus, actor) {
  await delay();
  const user = actor || assertCurrentUser();
  const index = store.tasks.findIndex((t) => t.id === taskId);
  if (index === -1) throw new Error('משימה לא נמצאה');

  const task = store.tasks[index];
  if (!canMoveTask(user, task)) throw new Error('אין הרשאה להזיז משימה זו');

  const previousStatus = task.status;

  if (
    newStatus === TASK_STATUSES.DONE &&
    !isAdmin(user) &&
    previousStatus !== TASK_STATUSES.PENDING_APPROVAL
  ) {
    throw new Error('יש להעלות הוכחת ביצוע לאישור מנהל');
  }

  task.status = newStatus;

  if (
    newStatus === TASK_STATUSES.DONE &&
    isAdmin(user) &&
    previousStatus !== TASK_STATUSES.DONE &&
    previousStatus !== TASK_STATUSES.PENDING_APPROVAL
  ) {
    task.approvedById = user.id;
    task.completedAt = new Date().toISOString();
    if (task.assignedUserId) await updateUserPoints(task.assignedUserId, task.pointsValue);
  }

  if (previousStatus === TASK_STATUSES.DONE && newStatus !== TASK_STATUSES.DONE) {
    if (task.assignedUserId && task.approvedById) {
      await updateUserPoints(task.assignedUserId, -task.pointsValue);
    }
    task.approvedById = null;
    task.completedAt = null;
  }

  return enrichTaskView({ ...task, previousStatus });
}

export async function submitTaskProof(taskId, proofImageData) {
  await delay(500);
  const user = assertCurrentUser();
  const index = store.tasks.findIndex((t) => t.id === taskId);
  if (index === -1) throw new Error('משימה לא נמצאה');

  const task = store.tasks[index];
  if (task.assignedUserId !== user.id && !isAdmin(user)) {
    throw new Error('רק האחראי יכול להגיש הוכחה');
  }
  if (![TASK_STATUSES.IN_PROGRESS, TASK_STATUSES.TODO].includes(task.status)) {
    throw new Error('לא ניתן להגיש הוכחה במצב הנוכחי');
  }
  if (!proofImageData) throw new Error('נדרשת תמונת הוכחה');

  task.proofImageData = proofImageData;
  task.proofImageUrl = proofImageData;
  task.proofSubmittedAt = new Date().toISOString();
  task.status = TASK_STATUSES.PENDING_APPROVAL;
  task.rejectedReason = null;

  return enrichTaskView({ ...task });
}

export async function approveTask(taskId) {
  await delay();
  const admin = assertCurrentUser();
  if (!isAdmin(admin)) throw new Error('רק מנהל הבית יכול לאשר משימות');

  const index = store.tasks.findIndex((t) => t.id === taskId);
  if (index === -1) throw new Error('משימה לא נמצאה');

  const task = store.tasks[index];
  if (task.status !== TASK_STATUSES.PENDING_APPROVAL) {
    throw new Error('משימה זו לא ממתינה לאישור');
  }

  task.status = TASK_STATUSES.DONE;
  task.approvedById = admin.id;
  task.completedAt = new Date().toISOString();

  if (task.assignedUserId) await updateUserPoints(task.assignedUserId, task.pointsValue);

  return enrichTaskView({ ...task });
}

export async function rejectTask(taskId, reason = '') {
  await delay();
  const admin = assertCurrentUser();
  if (!isAdmin(admin)) throw new Error('רק מנהל הבית יכול לדחות משימות');

  const index = store.tasks.findIndex((t) => t.id === taskId);
  if (index === -1) throw new Error('משימה לא נמצאה');

  const task = store.tasks[index];
  if (task.status !== TASK_STATUSES.PENDING_APPROVAL) {
    throw new Error('משימה זו לא ממתינה לאישור');
  }

  task.status = TASK_STATUSES.TODO;
  task.proofImageData = null;
  task.proofImageUrl = null;
  task.proofSubmittedAt = null;
  task.rejectedReason = reason || 'נדחה על ידי מנהל הבית';

  return enrichTaskView({ ...task });
}

export async function claimTask(taskId) {
  await delay();
  const user = assertCurrentUser();
  const index = store.tasks.findIndex((t) => t.id === taskId);
  if (index === -1) throw new Error('משימה לא נמצאה');

  const task = store.tasks[index];
  if (task.status !== TASK_STATUSES.TODO && task.status !== TASK_STATUSES.IN_PROGRESS) {
    throw new Error('לא ניתן לתפוס משימה זו');
  }
  if (task.assignedUserId) throw new Error('המשימה כבר תפוסה');

  task.assignedUserId = user.id;
  return enrichTaskView({ ...task });
}

export async function deleteTask(taskId) {
  await delay();
  const user = assertCurrentUser();
  if (!canDeleteTask(user)) throw new Error('רק מנהל הבית יכול למחוק משימות');

  const index = store.tasks.findIndex((t) => t.id === taskId);
  if (index === -1) throw new Error('משימה לא נמצאה');

  const [removed] = store.tasks.splice(index, 1);

  if (removed.status === TASK_STATUSES.DONE && removed.assignedUserId && removed.approvedById) {
    await updateUserPoints(removed.assignedUserId, -removed.pointsValue);
  }

  return enrichTaskView({ ...removed });
}

export async function toggleSubItem(taskId, subItemId, isCompleted) {
  await delay(120);
  assertCurrentUser();
  const task = store.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error('משימה לא נמצאה');
  if (!Array.isArray(task.subItems)) task.subItems = [];
  const item = task.subItems.find((s) => s.id === subItemId);
  if (!item) throw new Error('פריט לא נמצא');
  item.isCompleted = typeof isCompleted === 'boolean' ? isCompleted : !item.isCompleted;
  return enrichTaskView({ ...task });
}

export async function addSubItems(taskId, texts = []) {
  await delay(200);
  assertCurrentUser();
  const task = store.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error('משימה לא נמצאה');
  if (!Array.isArray(task.subItems)) task.subItems = [];
  const added = normalizeSubItems(texts);
  task.subItems.push(...added);
  return enrichTaskView({ ...task });
}
