import { http, getAllPages } from './httpClient';
import { getRealHouseholdId } from './householdContext';

function parseAvatarState(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function toUser(dto) {
  return {
    id: dto.id,
    fullName: dto.fullName,
    email: dto.email,
    avatarState: parseAvatarState(dto.avatarState),
    familyRole: dto.familyRole || null,
    createdAt: dto.createdAt,
  };
}

function toNumber(value) {
  return typeof value === 'number' ? value : 0;
}

/**
 * Members of the caller's household with their profile and both point readings.
 * `points` is lifetime XP (positive ledger rows only) and drives ranking;
 * `balance` is the spendable wallet (earns minus spends). Households are capped
 * at a handful of people, so the fan-out stays small and runs in parallel.
 */
export async function fetchHouseholdRoster() {
  const householdId = await getRealHouseholdId();
  if (!householdId) return [];

  const members = await getAllPages(`/api/households/${householdId}/members`);
  if (members.length === 0) return [];

  const [profiles, totals, balances] = await Promise.all([
    Promise.all(members.map((m) => http.get(`/api/users/${m.userId}`).catch(() => null))),
    Promise.all(
      members.map((m) =>
        http.get(`/api/households/${householdId}/points-ledger/totals/${m.userId}`).catch(() => 0)
      )
    ),
    Promise.all(
      members.map((m) =>
        http.get(`/api/households/${householdId}/points-ledger/balance/${m.userId}`).catch(() => 0)
      )
    ),
  ]);

  return members
    .map((member, index) => {
      const profile = profiles[index];
      if (!profile) return null;
      return {
        user: toUser(profile),
        role: member.role,
        joinedAt: member.joinedAt,
        points: toNumber(totals[index]),
        balance: toNumber(balances[index]),
      };
    })
    .filter(Boolean);
}

export async function fetchBalance(userId) {
  const householdId = await getRealHouseholdId();
  if (!householdId) return 0;
  return toNumber(await http.get(`/api/households/${householdId}/points-ledger/balance/${userId}`).catch(() => 0));
}

export async function fetchUserById(userId) {
  const dto = await http.get(`/api/users/${userId}`);
  return dto ? toUser(dto) : null;
}

export async function updateUserProfile(userId, { fullName, avatarState, familyRole }) {
  await http.put(`/api/users/${userId}`, {
    fullName,
    avatarState: avatarState ? JSON.stringify(avatarState) : null,
    familyRole: familyRole || null,
  });
  return fetchUserById(userId);
}
