import { getAllPages } from './httpClient';
import { getRealHouseholdId } from './householdContext';
import { monthlyEarnedXp } from '../utils/monthlyStats';

export async function fetchMonthlyEarnedXp() {
  const householdId = await getRealHouseholdId();
  if (!householdId) return 0;
  const entries = await getAllPages(`/api/households/${householdId}/points-ledger`, { maxPages: Infinity });
  return monthlyEarnedXp(entries, householdId);
}
