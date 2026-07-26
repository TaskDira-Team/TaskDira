import { PartyPopper } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Confetti from '../ui/Confetti';
import { modalVariants, overlayVariants } from '../../utils/motion';
import { useI18n } from '../../context/I18nContext';

export default function CelebrationModal({ reward, remainingPoints, onClose }) {
  const { t, dir, tx } = useI18n();
  return (
    <AnimatePresence>
      {reward && (
        <>
          <Confetti active />
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              dir={dir}
              className="relative bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 sm:p-8 max-w-sm w-full text-center mx-3"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-4xl mb-4 shadow-lg shadow-amber-200/50"
              >
                {reward.emoji}
              </motion.div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <PartyPopper className="h-6 w-6 text-indigo-600" />
                <h2 className="text-2xl font-bold text-slate-900">{t('congrats')}</h2>
                <PartyPopper className="h-6 w-6 text-indigo-600 scale-x-[-1]" />
              </div>
              <p className="text-slate-600 mb-1">{t('redeemedSuccess')}</p>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg font-bold text-indigo-700 mb-3 truncate px-2"
                title={reward.title}
              >
                {tx(reward.title)}
              </motion.p>
              {reward.code && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="inline-flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold tracking-wide"
                >
                  <span className="text-lg">{reward.emoji}</span>
                  {t('voucherCode')}: {reward.code}
                </motion.div>
              )}
              <p className="text-sm text-slate-500 mb-6">
                {t('remainingBalance')}{' '}
                <motion.span
                  initial={{ scale: 1.5 }}
                  animate={{ scale: 1 }}
                  className="font-bold text-indigo-600"
                >
                  {remainingPoints}
                </motion.span>{' '}
                {t('pointsWord')}
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
              >
                {t('nice')}
              </motion.button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
