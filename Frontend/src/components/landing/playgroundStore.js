import { DEMO_STORAGE_KEY, validDemo } from './demoState.js';

function parse(raw) { try { return validDemo(JSON.parse(raw)); } catch { return validDemo(null); } }
export function createPlaygroundStore({ getItem, setItem, events }) {
  let fallback = null;
  const changed = 'taskdira:playground-change';
  const read = () => {
    if (fallback !== null) return fallback;
    try { return getItem(DEMO_STORAGE_KEY) || 'null'; } catch { return 'null'; }
  };
  return {
    read,
    current: () => parse(read()),
    subscribe(listener) {
      events.addEventListener(changed, listener);
      events.addEventListener('storage', listener);
      return () => { events.removeEventListener(changed, listener); events.removeEventListener('storage', listener); };
    },
    update(value) {
      const next = typeof value === 'function' ? value(parse(read())) : value;
      const serialized = JSON.stringify(validDemo(next));
      try { setItem(DEMO_STORAGE_KEY, serialized); fallback = null; } catch { fallback = serialized; }
      events.dispatchEvent(new Event(changed));
    },
  };
}
