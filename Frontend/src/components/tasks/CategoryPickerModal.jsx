import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { CATEGORIES } from '../../data/mockData';
import { modalVariants, overlayVariants } from '../../utils/motion';
import { useI18n } from '../../context/I18nContext';

export default function CategoryPickerModal({ selectedId, onSelect, onClose }) {
  const { t, dir, category } = useI18n();
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        dir={dir}
        className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[80vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between z-10 rounded-t-3xl">
          <h3 className="font-bold text-slate-900">{t('pickCategory')}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
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
                  } ${
                    active
                      ? 'ring-4 ring-indigo-500 scale-105 shadow-md'
                      : 'ring-2 ring-transparent group-hover:ring-indigo-200 group-active:scale-95'
                  }`}
                >
                  {cat.icon}
                </span>
                <span
                  className={`text-xs font-semibold text-center ${
                    active ? 'text-indigo-700' : 'text-slate-600'
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
