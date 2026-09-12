import { useCallback, useSyncExternalStore } from 'react';
import { parseSavedChores, savedChoresKey, toggleSavedChore } from './savedChores';

const memory = new Map();
const sessionOnly = new Set();
const eventName = 'taskdira:saved-change';
function read(key) {
  if (!key) return '[]';
  if (sessionOnly.has(key)) return memory.get(key) || '[]';
  try { return localStorage.getItem(key) || '[]'; }
  catch { return memory.get(key) || '[]'; }
}
function subscribe(listener) {
  window.addEventListener('storage', listener);
  window.addEventListener(eventName, listener);
  return () => { window.removeEventListener('storage', listener); window.removeEventListener(eventName, listener); };
}
export default function useSavedChores(userId, householdId) {
  const key = savedChoresKey(userId, householdId);
  const snapshot = useCallback(() => read(key), [key]);
  const raw = useSyncExternalStore(subscribe, snapshot, () => '[]');
  const ids = parseSavedChores(raw);
  const write = next => {
    if (!key) return;
    const value = JSON.stringify(next);
    memory.set(key, value);
    try { localStorage.setItem(key, value); sessionOnly.delete(key); } catch { sessionOnly.add(key); }
    window.dispatchEvent(new Event(eventName));
  };
  return { ids, ready: !!key, isSaved: id => ids.includes(String(id)), toggle: id => write(toggleSavedChore(parseSavedChores(read(key)), id)), clear: () => write([]) };
}
