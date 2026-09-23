import { useEffect, useRef, useState } from "react";

/** Decorative loops only run while visible, with the tab active and motion allowed. */
export default function useVisibleMotion() {
  const ref = useRef(null);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const update = () =>
      setRunning(visible && !document.hidden && !media.matches);
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        update();
      },
      { threshold: 0.1 },
    );
    if (ref.current) observer.observe(ref.current);
    document.addEventListener("visibilitychange", update);
    media.addEventListener("change", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      media.removeEventListener("change", update);
    };
  }, []);
  return { ref, running };
}
