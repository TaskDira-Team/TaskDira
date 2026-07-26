import { useEffect, useState } from 'react';
import { Accessibility, X, Type, Contrast, Link2, Ban, ALargeSmall } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useI18n } from '../../context/I18nContext';

const STORAGE_KEY = 'taskdira_a11y_v1';

const DEFAULTS = {
  fontScale: 100,
  highContrast: false,
  readableFont: false,
  highlightLinks: false,
  stopAnimations: false,
};

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    return true;
  } catch {
    return false;
  }
}

function applyPrefs(prefs) {
  const root = document.documentElement;
  root.style.setProperty('--a11y-font-scale', `${prefs.fontScale / 100}`);
  root.classList.toggle('a11y-high-contrast', prefs.highContrast);
  root.classList.toggle('a11y-readable-font', prefs.readableFont);
  root.classList.toggle('a11y-highlight-links', prefs.highlightLinks);
  root.classList.toggle('a11y-stop-animations', prefs.stopAnimations);
}

export default function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState(DEFAULTS);
  const { t, dir } = useI18n();

  useEffect(() => {
    const initial = loadPrefs();
    setPrefs(initial);
    applyPrefs(initial);
  }, []);

  const update = (patch) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      savePrefs(next);
      applyPrefs(next);
      return next;
    });
  };

  const reset = () => update({ ...DEFAULTS });

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden max-w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto absolute bottom-4 right-4 z-50 flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 touch-manipulation transition-colors"
        aria-label={t('accessibility')}
        aria-expanded={open}
      >
        <Accessibility className="h-6 w-6" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label={t('close')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-auto absolute inset-0 bg-slate-950/30"
              onClick={() => setOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-label={t('accessibility')}
              dir={dir}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              className="pointer-events-auto absolute bottom-20 right-4 z-50 w-[min(100vw-2rem,20rem)] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2 min-w-0">
                  <Accessibility className="h-4 w-4 text-indigo-600 shrink-0" />
                  <h2 className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                    {t('a11y.title')}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/80 touch-manipulation"
                  aria-label={t('close')}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-3 space-y-2 max-h-[min(60vh,22rem)] overflow-y-auto">
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Type className="h-4 w-4 text-slate-500" />
                    <p className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                      {t('a11y.fontSize')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => update({ fontScale: Math.max(90, prefs.fontScale - 10) })}
                      className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-800 text-sm font-bold touch-manipulation hover:bg-slate-200"
                      aria-label={t('a11y.decrease')}
                    >
                      A−
                    </button>
                    <span className="text-xs font-semibold text-slate-600 w-12 text-center whitespace-nowrap">
                      {prefs.fontScale}%
                    </span>
                    <button
                      type="button"
                      onClick={() => update({ fontScale: Math.min(140, prefs.fontScale + 10) })}
                      className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-800 text-sm font-bold touch-manipulation hover:bg-slate-200"
                      aria-label={t('a11y.increase')}
                    >
                      A+
                    </button>
                  </div>
                </div>

                <ToggleRow
                  icon={Contrast}
                  label={t('a11y.contrast')}
                  active={prefs.highContrast}
                  onClick={() => update({ highContrast: !prefs.highContrast })}
                />
                <ToggleRow
                  icon={ALargeSmall}
                  label={t('a11y.readableFont')}
                  active={prefs.readableFont}
                  onClick={() => update({ readableFont: !prefs.readableFont })}
                />
                <ToggleRow
                  icon={Link2}
                  label={t('a11y.highlightLinks')}
                  active={prefs.highlightLinks}
                  onClick={() => update({ highlightLinks: !prefs.highlightLinks })}
                />
                <ToggleRow
                  icon={Ban}
                  label={t('a11y.stopAnimations')}
                  active={prefs.stopAnimations}
                  onClick={() => update({ stopAnimations: !prefs.stopAnimations })}
                />

                <button
                  type="button"
                  onClick={reset}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 touch-manipulation"
                >
                  {t('a11y.reset')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToggleRow({ icon: Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex flex-row items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-start touch-manipulation transition-colors ${
        active
          ? 'border-indigo-300 bg-indigo-50 text-indigo-900'
          : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
      }`}
    >
      <span className="flex flex-row items-center gap-2 min-w-0">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="text-xs font-medium whitespace-normal break-words">{label}</span>
      </span>
      <span
        className={`shrink-0 inline-flex w-10 h-6 rounded-full p-0.5 transition-colors ${
          active ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'
        }`}
      >
        <span className="block w-5 h-5 rounded-full bg-white shadow" />
      </span>
    </button>
  );
}
