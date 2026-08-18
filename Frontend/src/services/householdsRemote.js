import { http, getAllPages } from './httpClient';
import { getRealHouseholdId } from './householdContext';
import { store } from './store';

function formatDisplayName(name, address) {
  return address ? `${name} — ${address}` : name;
}

export async function fetchHousehold() {
  const householdId = await getRealHouseholdId();
  if (!householdId) return null;

  const [dto, members] = await Promise.all([
    http.get(`/api/households/${householdId}`),
    getAllPages(`/api/households/${householdId}/members`),
  ]);
  if (!dto) return null;

  store.proofApprovalRequired = dto.requireProofApproval === true;

  return {
    id: dto.id,
    name: dto.name,
    adminUserId: dto.adminUserId,
    createdAt: dto.createdAt,
    address: dto.address ?? '',
    monthlyGoalPoints: dto.monthlyGoalPoints ?? 400,
    requireProofApproval: dto.requireProofApproval === true,
    displayName: formatDisplayName(dto.name, dto.address),
    memberCount: members.length,
    activeHouseholdId: dto.id,
  };
}

export async function updateHouseholdRemote(householdId, { name, address, monthlyGoalPoints, requireProofApproval }) {
  await http.put(`/api/households/${householdId}`, {
    name,
    address: address || null,
    monthlyGoalPoints: monthlyGoalPoints ?? null,
    requireProofApproval: requireProofApproval ?? null,
  });
  return fetchHousehold();
}

export async function fetchHouseholds() {
  return getAllPages('/api/households');
}

export async function findUserByEmail(email) {
  const target = email.trim().toLowerCase();
  const users = await getAllPages('/api/users', { pageSize: 100 });
  return users.find((u) => (u.email || '').toLowerCase() === target) ?? null;
}

export async function addMember(userId, role) {
  const householdId = await getRealHouseholdId();
  if (!householdId) throw new Error('לא נמצאה דירה פעילה');
  return http.post(`/api/households/${householdId}/members`, { userId, role });
}

export async function updateMemberRole(userId, role) {
  const householdId = await getRealHouseholdId();
  if (!householdId) throw new Error('לא נמצאה דירה פעילה');
  return http.put(`/api/households/${householdId}/members/${userId}/role`, { role });
}

export async function removeMember(userId) {
  const householdId = await getRealHouseholdId();
  if (!householdId) throw new Error('לא נמצאה דירה פעילה');
  return http.del(`/api/households/${householdId}/members/${userId}`);
}
