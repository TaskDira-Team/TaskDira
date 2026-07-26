import { INITIAL_REWARDS } from '../data/mockData';

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

let rewards = structuredClone(INITIAL_REWARDS);
let redemptions = [];

const generateId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const rewardsApi = {
  async getRewards(householdId) {
    await delay(200);
    return rewards
      .filter((r) => r.householdId === householdId)
      .map((r) => ({ ...r }));
  },

  async createReward(rewardData, householdId) {
    await delay();
    const reward = {
      id: generateId('reward'),
      householdId,
      title: rewardData.title.trim(),
      emoji: rewardData.emoji || '🎁',
      cost: Number(rewardData.cost) || 10,
      description: rewardData.description?.trim() || '',
    };
    rewards.push(reward);
    return { ...reward };
  },

  async updateReward(rewardId, updates) {
    await delay();
    const index = rewards.findIndex((r) => r.id === rewardId);
    if (index === -1) throw new Error('פרס לא נמצא');

    rewards[index] = {
      ...rewards[index],
      ...updates,
      title: updates.title?.trim() ?? rewards[index].title,
      cost: updates.cost !== undefined ? Number(updates.cost) : rewards[index].cost,
      description: updates.description?.trim() ?? rewards[index].description,
    };
    return { ...rewards[index] };
  },

  async deleteReward(rewardId) {
    await delay();
    const index = rewards.findIndex((r) => r.id === rewardId);
    if (index === -1) throw new Error('פרס לא נמצא');
    const [removed] = rewards.splice(index, 1);
    return { ...removed };
  },

  async redeemReward(rewardId, userId, deductPoints) {
    await delay(500);
    const reward = rewards.find((r) => r.id === rewardId);
    if (!reward) throw new Error('פרס לא נמצא');

    const user = await deductPoints(userId, reward.cost);
    const redemption = {
      id: generateId('redemption'),
      rewardId,
      userId,
      rewardTitle: reward.title,
      cost: reward.cost,
      redeemedAt: new Date().toISOString(),
    };
    redemptions.push(redemption);

    return { reward: { ...reward }, user, redemption };
  },

  async getRedemptions(userId) {
    await delay(150);
    return redemptions.filter((r) => r.userId === userId);
  },
};
