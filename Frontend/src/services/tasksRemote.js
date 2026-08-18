import { http, getAllPages } from './httpClient';
import { getRealHouseholdId } from './householdContext';
import { TASK_STATUSES } from '../data/mockData';

let categoryCache = null;

/**
 * Backend categories carry the frontend's stable key in `description`
 * ('kitchen', 'other', ...) and the Hebrew label in `name`. Until the seed
 * migration is applied the table is empty and every task stores a null
 * category, which the UI renders as 'other'.
 */
async function categories() {
  // An empty result is not cached: the table starts empty and is filled by the
  // seed migration, and caching [] would pin every task to a null category for
  // the rest of the page's life.
  if (categoryCache && categoryCache.length > 0) return categoryCache;
  try {
    categoryCache = await getAllPages('/api/categories');
  } catch {
    categoryCache = null;
    return [];
  }
  return categoryCache ?? [];
}

export function resetCategoryCache() {
  categoryCache = null;
}

async function toBackendCategoryId(key) {
  if (!key) return null;
  const list = await categories();
  const match = list.find((c) => c.description === key) ?? list.find((c) => c.name === key);
  return match ? match.id : null;
}

async function toFrontendCategoryKey(id) {
  if (id === null || id === undefined) return 'other';
  const list = await categories();
  const match = list.find((c) => c.id === id);
  return match?.description || match?.name || 'other';
}

function pad(n) {
  return String(n).padStart(2, '0');
}

/**
 * The `duedate` column is `timestamp without time zone`, so a value carrying a
 * zone suffix is rejected by Postgres. Send the wall-clock time the user picked.
 */
export function toBackendDateTime(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

const { TODO, IN_PROGRESS, PENDING_APPROVAL, DONE } = TASK_STATUSES;

/**
 * The backend state machine only allows ToDo <-> InProgress <-> Done, so a
 * direct ToDo->Done move is walked through InProgress. PendingApproval has no
 * backend representation and never reaches the API.
 */
export function transitionPath(from, to) {
  if (from === to) return [];
  if (to === PENDING_APPROVAL || from === PENDING_APPROVAL) return [];
  if (from === TODO && to === DONE) return [IN_PROGRESS, DONE];
  if (from === DONE && to === TODO) return [IN_PROGRESS, TODO];
  return [to];
}

async function toFrontendTask(dto, subItems) {
  return {
    id: dto.id,
    householdId: dto.householdId,
    title: dto.title,
    description: dto.description || '',
    categoryId: await toFrontendCategoryKey(dto.categoryId),
    pointsValue: dto.pointsValue,
    assignedUserId: dto.assignedUserId ?? null,
    status: dto.status,
    dueDate: dto.dueDate ?? null,
    proofImageUrl: dto.proofImageUrl ?? null,
    proofImageData: null,
    proofSubmittedAt: null,
    approvedById: dto.approvedById ?? null,
    rejectedReason: dto.rejectedReason ?? null,
    createdById: dto.createdById ?? null,
    completedAt: dto.completedAt ?? null,
    subItems: (subItems ?? []).map((s) => ({
      id: s.id,
      text: s.itemText,
      isCompleted: s.isCompleted,
    })),
  };
}

async function fetchSubItems(taskId) {
  try {
    return await getAllPages(`/api/tasks/${taskId}/subitems`);
  } catch {
    return [];
  }
}

export async function fetchTasksRemote() {
  const householdId = await getRealHouseholdId();
  if (!householdId) return [];

  const dtos = await getAllPages(`/api/households/${householdId}/tasks`);
  if (dtos.length === 0) return [];

  const subItemLists = await Promise.all(dtos.map((dto) => fetchSubItems(dto.id)));
  return Promise.all(dtos.map((dto, i) => toFrontendTask(dto, subItemLists[i])));
}

export async function fetchTaskRemote(taskId) {
  const dto = await http.get(`/api/tasks/${taskId}`);
  if (!dto) return null;
  return toFrontendTask(dto, await fetchSubItems(taskId));
}

export async function createTaskRemote(data) {
  const householdId = await getRealHouseholdId();
  if (!householdId) throw new Error('לא נמצאה דירה פעילה');

  const dto = await http.post(`/api/households/${householdId}/tasks`, {
    title: data.title,
    description: data.description || '',
    categoryId: await toBackendCategoryId(data.categoryId),
    pointsValue: data.pointsValue,
    assignedUserId: data.assignedUserId ?? null,
    dueDate: toBackendDateTime(data.dueDate),
  });

  const texts = (data.subItems ?? []).map((s) => (typeof s === 'string' ? s : s.text)).filter(Boolean);
  for (const text of texts) {
    await http.post(`/api/tasks/${dto.id}/subitems`, { itemText: text });
  }

  return fetchTaskRemote(dto.id);
}

export async function updateTaskRemote(taskId, current, updates) {
  const merged = { ...current, ...updates };
  await http.put(`/api/tasks/${taskId}`, {
    title: merged.title,
    description: merged.description || '',
    categoryId: await toBackendCategoryId(merged.categoryId),
    pointsValue: Number(merged.pointsValue) || 0,
    assignedUserId: merged.assignedUserId ?? null,
    dueDate: toBackendDateTime(merged.dueDate),
  });
  return fetchTaskRemote(taskId);
}

export async function updateTaskStatusRemote(taskId, from, to) {
  for (const status of transitionPath(from, to)) {
    await http.put(`/api/tasks/${taskId}/status`, { status });
  }
  return fetchTaskRemote(taskId);
}

export async function deleteTaskRemote(taskId) {
  await http.del(`/api/tasks/${taskId}`);
}

export async function addSubItemsRemote(taskId, texts) {
  for (const text of texts) {
    await http.post(`/api/tasks/${taskId}/subitems`, { itemText: text });
  }
  return fetchTaskRemote(taskId);
}

export async function toggleSubItemRemote(taskId, subItemId, itemText, isCompleted) {
  await http.put(`/api/tasks/${taskId}/subitems/${subItemId}`, { itemText, isCompleted });
  return fetchTaskRemote(taskId);
}

/**
 * The ledger enforces one earn per task through a partial unique index, so a
 * repeat completion is rejected server-side with a 409. That replaces the old
 * client-side guard, which reset on every reload.
 */
export async function awardPointsRemote(userId, taskId, pointsEarned) {
  const householdId = await getRealHouseholdId();
  if (!householdId || !userId || !taskId || !pointsEarned) return { awarded: false, duplicate: false };

  try {
    await http.post(`/api/households/${householdId}/points-ledger`, {
      userId,
      taskId,
      pointsEarned,
    });
    return { awarded: true, duplicate: false };
  } catch (err) {
    if (err?.status === 409) return { awarded: false, duplicate: true };
    if (err?.status === 403) return { awarded: false, duplicate: false, forbidden: true };
    throw err;
  }
}
