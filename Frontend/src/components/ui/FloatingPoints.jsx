import { AnimatePresence, motion } from 'framer-motion';
import { useI18n } from '../../context/I18nContext';

export default function FloatingPoints({ bursts = [], onDone }) {
  const { t } = useI18n();
  return (
    <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden" aria-hidden>
      <AnimatePresence>
        {bursts.map((b) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 20, scale: 0.6 }}
            animate={{ opacity: 1, y: -80, scale: 1.15 }}
            exit={{ opacity: 0, y: -140, scale: 0.9 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            onAnimationComplete={() => onDone?.(b.id)}
            className="absolute font-bold text-emerald-500 drop-shadow-md whitespace-nowrap"
            style={{
              left: `${b.x ?? 50}%`,
              top: `${b.y ?? 55}%`,
              fontSize: b.size || '1.5rem',
            }}
          >
            {b.label || `+${b.points} ${t('pointsShort')}`}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
