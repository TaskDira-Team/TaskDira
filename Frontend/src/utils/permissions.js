import { ROLES, TASK_STATUSES } from '../data/mockData';

export const PERMISSION_ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member',
};

export const PERMISSION_LABELS = {
  admin: 'מנהל הבית',
  member: 'מורשה בדירה',
};

export function isAdmin(user) {
  if (!user) return false;
  return (
    user.userRole === ROLES.ADMIN ||
    user.role === ROLES.ADMIN ||
    user.permissionRole === 'admin' ||
    user.isAdmin === true
  );
}

export function isHouseholdMember(user) {
  return !!user?.id;
}

export function canCreateTask(user) {
  return isHouseholdMember(user);
}

export function canDeleteTask(user) {
  return isAdmin(user);
}

export function canEditTaskFully(user) {
  return isHouseholdMember(user);
}

export function canChangePoints(user) {
  return isHouseholdMember(user);
}

export function canSetDueDate(user) {
  return isHouseholdMember(user);
}

export function canReassign(user) {
  return isHouseholdMember(user);
}

export function canMoveTask(user, task) {
  if (!user || !task) return false;
  if (task.status === TASK_STATUSES.PENDING_APPROVAL || task.status === 'pending_approval') return false;
  if (isHouseholdMember(user)) {
    if (task.status === TASK_STATUSES.DONE || task.status === 'done') return isAdmin(user);
    return true;
  }
  return false;
}

export function canApproveTask(user, task) {
  return (
    isAdmin(user) &&
    (task?.status === TASK_STATUSES.PENDING_APPROVAL || task?.status === 'pending_approval')
  );
}

export function canSubmitProof(user, task) {
  if (!user || !task) return false;
  const okStatus = [
    TASK_STATUSES.IN_PROGRESS,
    TASK_STATUSES.TODO,
    'in_progress',
    'todo',
  ].includes(task.status);
  if (!okStatus) return false;
  const assignee = task.assignedUserId ?? task.assigneeId;
  return assignee === user.id || isAdmin(user) || isHouseholdMember(user);
}

export function canClaimTask(user, task) {
  if (!user || !task) return false;
  const assignee = task.assignedUserId ?? task.assigneeId;
  if (assignee) return false;
  return (
    task.status === TASK_STATUSES.TODO ||
    task.status === TASK_STATUSES.IN_PROGRESS ||
    task.status === 'todo' ||
    task.status === 'in_progress'
  );
}

export function canResetScores(user) {
  return isAdmin(user);
}

export function getMemberTaskDefaults(user) {
  return {
    assignedUserId: user.id,
    assigneeId: user.id,
    pointsValue: 10,
    points: 10,
  };
}
