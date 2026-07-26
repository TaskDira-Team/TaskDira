import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

export default function FilterCarousel({ children, ariaLabel, className = '' }) {
  const scrollerRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const { t, dir } = useI18n();

  const sync = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const min = dir === 'rtl' ? -maxScroll : 0;
    const max = dir === 'rtl' ? 0 : maxScroll;
    setCanLeft(el.scrollLeft > min + 2);
    setCanRight(el.scrollLeft < max - 2);
  }, [dir]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    window.addEventListener('resize', sync);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, [sync, children]);

  const nudge = (visualDelta) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: visualDelta, behavior: 'smooth' });
  };

  const amount = 140;

  return (
    <div className={`relative flex items-center w-full max-w-full min-w-0 ${className}`}>
      {canLeft && (
        <button
          type="button"
          onClick={() => nudge(-amount)}
          aria-label={t('scrollLeft')}
          className="absolute left-0 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-sm backdrop-blur transition-colors hover:bg-white"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      <div
        ref={scrollerRef}
        onScroll={sync}
        role="tablist"
        aria-label={ariaLabel}
        className="filter-scroll py-1 px-2"
      >
        {children}
      </div>

      {canRight && (
        <button
          type="button"
          onClick={() => nudge(amount)}
          aria-label={t('scrollRight')}
          className="absolute right-0 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-sm backdrop-blur transition-colors hover:bg-white"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
