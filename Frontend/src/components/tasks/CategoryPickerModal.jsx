import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { CATEGORIES } from '../../data/mockData';
import { modalVariants, overlayVariants } from '../../utils/motion';
import { useI18n } from '../../context/I18nContext';

/** Light values reproduce the original markup exactly, so the legacy path is
 * unchanged; the dark set matches the rebuilt screens' panel vocabulary. */
const THEMES = {
  light: {
    overlay: 'absolute inset-0 bg-black/45 backdrop-blur-sm',
    panel:
      'relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[80vh] overflow-y-auto',
    panelStyle: undefined,
    header:
      'sticky top-0 bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between z-10 rounded-t-3xl',
    title: 'font-bold text-slate-900',
    close: 'p-2 rounded-lg hover:bg-slate-100',
    activeRing: 'ring-4 ring-indigo-500 scale-105 shadow-md',
    idleRing: 'ring-2 ring-transparent group-hover:ring-indigo-200 group-active:scale-95',
    activeText: 'text-indigo-700',
    idleText: 'text-slate-600',
  },
  dark: {
    overlay: 'absolute inset-0 bg-black/60 backdrop-blur-sm',
    panel:
      'relative w-full sm:max-w-md max-h-[80vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-white/10 bg-gradient-to-b from-panel-2/95 to-abyss/95 backdrop-blur-md',
    panelStyle: { boxShadow: '0 0 0 1px #b8f06a22, 0 30px 80px -30px #b8f06a55' },
    header:
      'sticky top-0 bg-abyss/90 backdrop-blur-md px-5 py-4 border-b border-white/8 flex items-center justify-between z-10 rounded-t-3xl',
    title: 'font-black text-ink',
    close: 'p-2 rounded-lg text-ink-faint transition hover:bg-white/8 hover:text-ink',
    activeRing: 'ring-4 ring-lime scale-105',
    idleRing: 'ring-2 ring-white/10 group-hover:ring-white/30 group-active:scale-95',
    activeText: 'text-lime',
    idleText: 'text-ink-dim',
  },
};

export default function CategoryPickerModal({ selectedId, onSelect, onClose, variant = 'light' }) {
  const { t, dir, category } = useI18n();
  const th = THEMES[variant] ?? THEMES.light;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        className={th.overlay}
        onClick={onClose}
      />
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        dir={dir}
        className={th.panel}
        style={th.panelStyle}
      >
        <div className={th.header}>
          <h3 className={th.title}>{t('pickCategory')}</h3>
          <button type="button" onClick={onClose} aria-label={t('close')} className={th.close}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-3 sm:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => {
            const active = selectedId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onSelect(cat.id);
                  onClose();
                }}
                className="flex flex-col items-center gap-2 touch-manipulation group"
              >
                <span
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all ${
                    cat.circle
                  } ${active ? th.activeRing : th.idleRing}`}
                >
                  {cat.icon}
                </span>
                <span
                  className={`text-xs font-semibold text-center ${
                    active ? th.activeText : th.idleText
                  }`}
                >
                  {category(cat.id, cat.label)}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
