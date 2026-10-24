import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useApp } from "./AppContext";
import { useAuth } from "./AuthContext";
import { useI18n } from "./I18nContext";
import { playApi } from "../services/playApi";

const PlayContext = createContext(null);
export function PlayProvider({ children }) {
  const { household, tasks, rewards, loading } = useApp();
  const { user } = useAuth();
  const { lang } = useI18n();
  const [state, setState] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const generation = useRef(0),
    mutation = useRef(false),
    current = useRef(null);
  const householdId = household?.id;
  const refresh = useCallback(async () => {
    if (!householdId || mutation.current) return;
    const id = ++generation.current;
    try {
      const next = await playApi.read(householdId);
      if (id === generation.current) {
        const same = JSON.stringify(current.current) === JSON.stringify(next);
        if (!same) {
          current.current = next;
          setState(next);
        }
        setError("");
      }
    } catch {
      if (id === generation.current)
        setError(
          lang === "he"
            ? "לא הצלחנו לפתוח את ההרפתקאות. נסו שוב."
            : "We couldn’t open your adventures. Please try again.",
        );
    }
  }, [householdId, user?.id, lang]);
  useEffect(() => {
    current.current = null;
    setState(null);
    setError("");
    return () => {
      generation.current++;
    };
  }, [householdId, user?.id]);
  useEffect(() => {
    if (!loading) refresh();
  }, [refresh, loading, tasks, rewards]);
  useEffect(() => {
    const focus = () => refresh();
    const storage = (e) => {
      if (e.key === `td.family-play.v1.${householdId}`) refresh();
    };
    const visibility = () => {
      if (!document.hidden) refresh();
    };
    window.addEventListener("focus", focus);
    window.addEventListener("storage", storage);
    window.addEventListener("taskdira:live", focus);
    document.addEventListener("visibilitychange", visibility);
    const poll = window.setInterval(() => {
      if (!document.hidden) refresh();
    }, 5000);
    return () => {
      clearInterval(poll);
      window.removeEventListener("focus", focus);
      window.removeEventListener("taskdira:live", focus);
      window.removeEventListener("storage", storage);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [refresh, householdId]);
  const change = async (action, data = {}) => {
    if (mutation.current || !current.current) return false;
    mutation.current = true;
    setBusy(true);
    setError("");
    const id = ++generation.current;
    try {
      const next = await playApi.change(householdId, {
        action,
        ...data,
        revision: current.current.revision,
      });
      if (id === generation.current) {
        current.current = next;
        setState(next);
      }
      return true;
    } catch (cause) {
      if (cause.status === 409) {
        try {
          const next = await playApi.read(householdId);
          if (id === generation.current) {
            current.current = next;
            setState(next);
          }
        } catch {
          /* Keep the last good version. */
        }
      }
      if (id === generation.current)
        setError(
          lang === "he"
            ? "השינוי לא נשמר. בדקו את הבחירה ונסו שוב; ייתכן שהמשפחה עדכנה בינתיים."
            : cause.message || "That change didn’t save. Please try again.",
        );
      return false;
    } finally {
      mutation.current = false;
      setBusy(false);
    }
  };
  return (
    <PlayContext.Provider value={{ state, busy, error, refresh, change }}>
      {children}
    </PlayContext.Provider>
  );
}
export function usePlay() {
  const value = useContext(PlayContext);
  if (!value) throw new Error("PlayProvider is required");
  return value;
}
