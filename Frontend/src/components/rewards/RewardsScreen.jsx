import { useState } from 'react';
import { Star, Loader2, Plus, Pencil, Trash2, Lock, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { REWARD_MILESTONES } from '../../data/gamification';
import { useI18n } from '../../context/I18nContext';

export default function RewardsScreen() {
  const { user } = useAuth();
  const {
    rewards,
    users,
    permissions,
    redeemReward,
    createReward,
    updateReward,
    deleteReward,
  } = useApp();
  const [redeemingId, setRedeemingId] = useState(null);
  const { t, p, tx } = useI18n();
  const me = users.find((u) => u.id === user?.id) || user;
  // points is lifetime XP and drives milestone unlocks; balance is the wallet
  // that actually pays for a reward.
  const points = me?.points ?? 0;
  const balance = me?.balance ?? points;

  const handleRedeem = async (reward) => {
    if (!reward.unlocked || balance < reward.cost) return;
    setRedeemingId(reward.id);
    try {
      await redeemReward(reward);
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 w-full max-w-full bg-transparent">
      <div className="px-3 sm:px-4 pt-4 pb-2 space-y-3">
        <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-l from-slate-900 to-slate-800 text-white p-4 shadow-sm">
          <p className="text-xs text-slate-300 font-medium">{t('balanceThisMonth')}</p>
          <p className="text-2xl sm:text-3xl font-semibold flex items-center gap-2 mt-1 tracking-tight break-words">
            <Star className="h-5 w-5 text-amber-400 shrink-0" />
            {p(balance)}
          </p>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed break-words">
            {t('milestoneHint')} {t('pointsShort')}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {REWARD_MILESTONES.map((m) => {
            const reached = points >= m.points;
            return (
              <span
                key={m.tier}
                className={`inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                  reached
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}
              >
                {reached ? '✓' : '🔒'} {p(m.points)}
              </span>
            );
          })}
        </div>
      </div>

      {permissions.isAdmin && (
        <div className="px-4 pb-2 flex justify-end">
          <button
            type="button"
            onClick={async () => {
              const title = window.prompt(t('promptRewardName'));
              if (!title) return;
              const requiredPoints = Number(window.prompt(t('promptRewardThreshold'), '50')) || 50;
              await createReward({
                title,
                requiredPoints,
                cost: requiredPoints,
                emoji: '🎁',
                description: '',
              });
            }}
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-xl touch-manipulation"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('addReward')}
          </button>
        </div>
      )}

      <div className="px-3 sm:px-4 pb-24 grid grid-cols-2 gap-3 w-full max-w-full">
        {rewards.map((reward) => {
          const milestoneLocked = !reward.unlocked;
          const balanceShort = balance < reward.cost;
          const canClaim = !milestoneLocked && !balanceShort && !reward.claimed;
          return (
            <motion.article
              key={reward.id}
              whileTap={{ scale: 0.98 }}
              className={`bg-white rounded-2xl border p-3 flex flex-col gap-2 shadow-sm min-w-0 relative overflow-hidden ${
                milestoneLocked ? 'border-slate-200 opacity-80' : 'border-emerald-100'
              }`}
            >
              {milestoneLocked && (
                <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] z-[1] flex items-center justify-center">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-white/95 border border-slate-200 px-2.5 py-1.5 rounded-full shadow-sm">
                    <Lock className="h-3.5 w-3.5" />
                    {p(reward.requiredPoints)}
                  </span>
                </div>
              )}
              <div className="flex items-start justify-between gap-1">
                <span className="text-3xl">{reward.emoji}</span>
                {permissions.isAdmin && (
                  <div className="flex gap-0.5 relative z-[2]">
                    <button
                      type="button"
                      onClick={async () => {
                        const title = window.prompt(t('promptName'), reward.title);
                        if (!title) return;
                        await updateReward(reward.id, { ...reward, title });
                      }}
                      className="p-1 text-slate-400 hover:text-indigo-600"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteReward(reward.id)}
                      className="p-1 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-[10px] font-medium text-slate-400 tracking-wide">
                {reward.category === 'tier3' ? t('premium') : reward.category === 'tier2' ? '100+' : '50+'}
              </p>
              <h3 className="text-sm font-bold text-slate-900 leading-snug break-words">
                {tx(reward.title)}
              </h3>
              {reward.description && (
                <p className="text-[11px] text-slate-500 line-clamp-2">{tx(reward.description)}</p>
              )}
              <div className="mt-auto pt-2 flex flex-col gap-1.5">
                <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {p(reward.requiredPoints)}
                </span>
                <button
                  type="button"
                  onClick={() => handleRedeem(reward)}
                  disabled={!canClaim || redeemingId === reward.id}
                  className="w-full py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 touch-manipulation flex items-center justify-center gap-1"
                >
                  {redeemingId === reward.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : milestoneLocked ? (
                    <>
                      <Lock className="h-3 w-3" /> {t('locked')}
                    </>
                  ) : balanceShort ? (
                    `${t('missingPoints')} ${reward.cost - balance}`
                  ) : (
                    <>
                      <Gift className="h-3.5 w-3.5" />
                      {t('claimReward')}
                    </>
                  )}
                </button>
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}
