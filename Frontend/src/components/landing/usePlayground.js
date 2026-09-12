import { useSyncExternalStore } from 'react';
import { createPlaygroundStore } from './playgroundStore';
import { validDemo } from './demoState';

const store = createPlaygroundStore({
  getItem: key => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  events: typeof window !== 'undefined' ? window : new EventTarget(),
});
export default function usePlayground() {
  const raw = useSyncExternalStore(store.subscribe, store.read, () => 'null');
  let state;
  try { state = validDemo(JSON.parse(raw)); } catch { state = validDemo(null); }
  return [state, store.update];
}
