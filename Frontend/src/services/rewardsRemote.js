import { http, getAllPages } from './httpClient';
import { getRealHouseholdId } from './householdContext';

/**
 * requiredPoints is the XP threshold that unlocks a reward; cost is the balance
 * price paid for it. They are seeded equal and only diverge once edited.
 */
function toReward(dto) {
  return {
    id: dto.id,
    householdId: dto.householdId,
    title: dto.title,
    requiredPoints: dto.requiredPoints,
    cost: dto.cost ?? dto.requiredPoints,
    emoji: dto.emoji ?? null,
    description: dto.description ?? '',
    category: dto.category ?? null,
    claimedByUserId: dto.claimedByUserId ?? null,
    claimed: dto.claimedByUserId !== null && dto.claimedByUserId !== undefined,
  };
}

export async function fetchRewardsRemote() {
  const householdId = await getRealHouseholdId();
  if (!householdId) return [];

  const dtos = await getAllPages(`/api/households/${householdId}/rewards`);
  return dtos.map(toReward);
}

export async function fetchRewardRemote(rewardId) {
  const dto = await http.get(`/api/rewards/${rewardId}`);
  return dto ? toReward(dto) : null;
}

export async function createRewardRemote({ title, requiredPoints, emoji, description, cost, category }) {
  const householdId = await getRealHouseholdId();
  if (!householdId) throw new Error('לא נמצאה דירה פעילה');

  const dto = await http.post(`/api/households/${householdId}/rewards`, {
    title,
    requiredPoints,
    emoji: emoji || null,
    description: description || null,
    cost: cost ?? null,
    category: category || null,
  });
  return toReward(dto);
}

export async function updateRewardRemote(rewardId, { title, requiredPoints, emoji, description, cost, category }) {
  await http.put(`/api/rewards/${rewardId}`, {
    title,
    requiredPoints,
    emoji: emoji || null,
    description: description || null,
    cost: cost ?? null,
    category: category || null,
  });
  return fetchRewardRemote(rewardId);
}

export async function deleteRewardRemote(rewardId) {
  await http.del(`/api/rewards/${rewardId}`);
}

export async function claimRewardRemote(rewardId) {
  await http.post(`/api/rewards/${rewardId}/claim`);
  return fetchRewardRemote(rewardId);
}
