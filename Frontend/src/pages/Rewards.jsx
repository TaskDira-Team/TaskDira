import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { ACCENTS, CountUp, LimeButton, Panel, ScreenShell } from '../components/ui/kit';

// `category` is free text with no fixed vocabulary; enrichReward falls back to a
// tier derived from requiredPoints, so colour keys off that with a stable
// per-position fallback for anything else.
const CATEGORY_ACCENT = { tier1: 'lime', tier2: 'sky', tier3: 'gold' };
const FALLBACK_ACCENTS = ['sky', 'coral', 'grape', 'gold', 'mint', 'lime'];

function accentFor(reward, index) {
  return CATEGORY_ACCENT[reward.category] ?? FALLBACK_ACCENTS[index % FALLBACK_ACCENTS.length];
}

function AdminRow({ onEdit, onDelete }) {
  return (
    <div className="mt-3 flex justify-end gap-1 border-t border-white/8 pt-2">
      <button
        type="button"
        onClick={onEdit}
        className="rounded-lg p-1 text-ink-faint transition hover:text-sky"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="rounded-lg p-1 text-ink-faint transition hover:text-coral"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function RewardCard({ reward, accent, xp, balance, claiming, onClaim, isAdmin, onEdit, onDelete }) {
  const { t } = useI18n();
  const c = ACCENTS[accent];
  const admin = isAdmin ? <AdminRow onEdit={onEdit} onDelete={onDelete} /> : null;

  if (reward.claimed) {
    return (
      <div className="flex flex-col rounded-2xl border border-lime/35 bg-lime/8 p-4">
        <div className="flex items-start justify-between">
          <div
            className="grid h-11 w-11 place-items-center rounded-xl text-xl"
            style={{ background: `${c}1f`, border: `1px solid ${c}44` }}
          >
            {reward.emoji}
          </div>
          <span
            className="grid h-7 w-7 place-items-center rounded-full text-sm font-black text-[#152007]"
            style={{ background: ACCENTS.lime, boxShadow: `0 0 16px -4px ${ACCENTS.lime}` }}
          >
            ✓
          </span>
        </div>
        <div className="mt-3 text-[14px] font-extrabold">{reward.title}</div>
        <div className="mt-0.5 flex-1 text-[11px] text-ink-faint">{reward.description}</div>
        <div className="num mt-4 text-center text-[12px] font-extrabold text-lime">
          {t('rewards.claimedNote')}
        </div>
        {admin}
      </div>
    );
  }

  // Locked by standing: lifetime XP has not reached requiredPoints yet. This is
  // not the same as being unable to afford it.
  if (!reward.unlocked) {
    const xpGap = Math.max(0, reward.requiredPoints - xp);
    return (
      <div className="flex flex-col rounded-2xl border-2 border-dashed border-white/15 bg-black/20 p-4">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/5 text-xl opacity-45 grayscale">
          {reward.emoji}
        </div>
        <div className="mt-3 text-[14px] font-extrabold text-ink-dim">{reward.title}</div>
        <div className="mt-0.5 flex-1 text-[11px] text-ink-faint">{reward.description}</div>
        <div className="num mt-4 rounded-full border border-white/12 py-2 text-center text-[12px] font-bold text-ink-faint">
          🔒 {t('missingPoints')} {xpGap.toLocaleString('en-US')} XP
        </div>
        {admin}
      </div>
    );
  }

  // Unlocked but the wallet is short: the reward is earned, just not paid for.
  const shortBy = Math.max(0, reward.cost - balance);
  const affordable = reward.affordable && shortBy === 0;

  return (
    <div
      className="group flex flex-col rounded-2xl border p-4 transition-transform duration-300 hover:-translate-y-1"
      style={{ borderColor: `${c}38`, background: `${c}0f` }}
    >
      <div className="flex items-start justify-between">
        <div
          className="grid h-11 w-11 place-items-center rounded-xl text-xl transition group-hover:scale-110"
          style={{ background: `${c}22`, border: `1px solid ${c}55`, boxShadow: `0 0 22px -10px ${c}` }}
        >
          {reward.emoji}
        </div>
        <span className="num text-[13px] font-extrabold text-gold">
          🪙 {reward.cost.toLocaleString('en-US')}
        </span>
      </div>
      <div className="mt-3 text-[14px] font-extrabold">{reward.title}</div>
      <div className="mt-0.5 flex-1 text-[11px] text-ink-faint">{reward.description}</div>
      <button
        type="button"
        disabled={!affordable || claiming}
        onClick={onClaim}
        className="mt-4 rounded-full bg-gradient-to-b from-lime to-lime-deep py-2 text-[13px] font-extrabold text-[#152007] transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-none disabled:bg-white/8 disabled:text-ink-faint"
        style={affordable ? { boxShadow: `0 8px 22px -10px ${ACCENTS.lime}` } : undefined}
      >
        {claiming
          ? '…'
          : affordable
            ? t('rewards.redeem')
            : `${t('missingPoints')} ${shortBy.toLocaleString('en-US')}`}
      </button>
      {admin}
    </div>
  );
}

export default function Rewards() {
  const { t, dir } = useI18n();
  const { user } = useAuth();
  const { rewards, users, permissions, redeemReward, createReward, updateReward, deleteReward } = useApp();
  const [claimingId, setClaimingId] = useState(null);

  const me = users.find((u) => u.id === user?.id) || user;
  const xp = me?.points ?? 0;
  const balance = me?.balance ?? xp;
  const isAdmin = permissions?.isAdmin === true;

  const handleClaim = async (reward) => {
    setClaimingId(reward.id);
    try {
      await redeemReward(reward);
    } catch {
      // AppContext already surfaced the Hebrew message as a toast.
    } finally {
      setClaimingId(null);
    }
  };

  // Cost is prompted separately from requiredPoints: the first is what the
  // wallet pays, the second is the XP standing that unlocks it. Welding them
  // together makes the unaffordable-but-unlocked state unreachable.
  const promptCost = (fallback) => {
    const raw = window.prompt(t('promptRewardCost'), String(fallback));
    if (raw === null) return null;
    const parsed = Number(raw);
    return raw.trim() === '' || Number.isNaN(parsed) || parsed < 0 ? fallback : parsed;
  };

  const handleCreate = async () => {
    const title = window.prompt(t('promptRewardName'));
    if (!title) return;
    const requiredPoints = Number(window.prompt(t('promptRewardThreshold'), '50')) || 50;
    const cost = promptCost(requiredPoints);
    if (cost === null) return;
    await createReward({
      title,
      requiredPoints,
      cost,
      emoji: '🎁',
      description: '',
    });
  };

  const handleEdit = async (reward) => {
    const title = window.prompt(t('promptName'), reward.title);
    if (!title) return;
    const requiredPoints =
      Number(window.prompt(t('promptRewardThreshold'), String(reward.requiredPoints))) ||
      reward.requiredPoints;
    const cost = promptCost(reward.cost ?? requiredPoints);
    if (cost === null) return;
    await updateReward(reward.id, {
      ...reward,
      title,
      requiredPoints,
      cost,
    });
  };

  const handleDelete = async (reward) => {
    if (!window.confirm(`${t('remove')} "${reward.title}"?`)) return;
    await deleteReward(reward.id);
  };

  const nextLocked = rewards
    .filter((r) => !r.unlocked && !r.claimed)
    .sort((a, b) => a.requiredPoints - b.requiredPoints)[0];

  return (
    <ScreenShell dir={dir}>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black">{t('rewardsStore')}</h1>
            <p className="mt-1 text-[13px] text-ink-dim">{t('rewards.subtitle')}</p>
          </div>
          {isAdmin && (
            <LimeButton size="sm" onClick={handleCreate}>
              ＋ {t('addReward')}
            </LimeButton>
          )}
        </div>

        <Panel className="overflow-hidden p-6 text-center" glow accent="gold">
          <div className="num text-[11px] font-bold tracking-widest text-ink-faint uppercase">
            {t('pointsBalance')}
          </div>
          <div
            className="mt-2 flex items-center justify-center gap-2 text-5xl font-black text-gold"
            style={{ textShadow: '0 0 34px #ffcb4777' }}
          >
            <span className="anim-bob-soft text-3xl">🪙</span>
            <CountUp to={balance} />
          </div>
        </Panel>

        {rewards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center">
            <div className="text-3xl">🎁</div>
            <div className="mt-3 text-[14px] font-extrabold text-ink-dim">{t('rewardsStore')}</div>
            <div className="num mt-1 text-[12px] text-ink-faint">{t('milestoneHint')}</div>
            {isAdmin && (
              <div className="mt-5 flex justify-center">
                <LimeButton onClick={handleCreate}>＋ {t('addReward')}</LimeButton>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {rewards.map((reward, index) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                accent={accentFor(reward, index)}
                xp={xp}
                balance={balance}
                claiming={claimingId === reward.id}
                onClaim={() => handleClaim(reward)}
                isAdmin={isAdmin}
                onEdit={() => handleEdit(reward)}
                onDelete={() => handleDelete(reward)}
              />
            ))}
          </div>
        )}

        {nextLocked && (
          <div className="num rounded-2xl border border-dashed border-white/15 p-4 text-center text-[12px] text-ink-faint">
            {t('rewards.nextA')}
            {nextLocked.emoji} {nextLocked.title}
            {t('rewards.nextB').replace(
              '{n}',
              Math.max(0, nextLocked.requiredPoints - xp).toLocaleString('en-US')
            )}
          </div>
        )}
      </div>
    </ScreenShell>
  );
}
