export function savedChoresKey(userId, householdId) {
  if (userId == null || householdId == null) return null;
  return `taskdira:saved:v1:${encodeURIComponent(String(userId))}:${encodeURIComponent(String(householdId))}`;
}
export function parseSavedChores(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter(id => typeof id === 'string' || typeof id === 'number').map(String))].slice(0, 500);
  } catch { return []; }
}
export function toggleSavedChore(ids, id) {
  const key = String(id);
  return ids.includes(key) ? ids.filter(item => item !== key) : [...ids, key].slice(-500);
}
