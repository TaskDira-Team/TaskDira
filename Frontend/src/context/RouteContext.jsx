import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const RouteContext = createContext(null);

export const DEFAULT_PATH = '/';

function readPath() {
  const raw = window.location.hash.replace(/^#/, '');
  if (!raw || raw === '/') return DEFAULT_PATH;
  return raw.startsWith('/') ? raw : `/${raw}`;
}

export function RouteProvider({ children }) {
  const [path, setPath] = useState(readPath);

  useEffect(() => {
    const onHashChange = () => setPath(readPath());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((next) => {
    const target = next.startsWith('/') ? next : `/${next}`;
    if (readPath() === target) {
      setPath(target);
      return;
    }
    window.location.hash = target;
  }, []);

  const value = useMemo(() => ({ path, navigate }), [path, navigate]);

  return <RouteContext.Provider value={value}>{children}</RouteContext.Provider>;
}

export function useRoute() {
  const ctx = useContext(RouteContext);
  if (!ctx) throw new Error('useRoute must be used within RouteProvider');
  return ctx;
}
