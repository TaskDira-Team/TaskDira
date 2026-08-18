import { useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { ACCENTS, GhostButton, Panel, ScreenShell, XPBar } from '../components/ui/kit';

const BADGES = [
  { key: 'achievements.b1', e: '🔥', accent: 'coral', unlocked: true, rarity: 'rare' },
  { key: 'achievements.b2', e: '🌅', accent: 'gold', unlocked: true, rarity: 'common' },
  { key: 'achievements.b3', e: '🧹', accent: 'sky', unlocked: true, rarity: 'common' },
  { key: 'achievements.b4', e: '🍳', accent: 'lime', unlocked: true, rarity: 'common' },
  { key: 'achievements.b5', e: '🐕', accent: 'mint', unlocked: true, rarity: 'rare' },
  { key: 'achievements.b6', e: '⚡', accent: 'grape', unlocked: true, rarity: 'rare' },
  { key: 'achievements.b7', e: '👑', accent: 'gold', unlocked: false, rarity: 'legendary' },
  { key: 'achievements.b8', e: '💯', accent: 'lime', unlocked: false, rarity: 'legendary' },
  { key: 'achievements.b9', e: '🌙', accent: 'sky', unlocked: false, rarity: 'rare' },
  { key: 'achievements.b10', e: '🤝', accent: 'coral', unlocked: false, rarity: 'common' },
  { key: 'achievements.b11', e: '🏰', accent: 'grape', unlocked: false, rarity: 'legendary' },
  { key: 'achievements.b12', e: '🎯', accent: 'mint', unlocked: false, rarity: 'legendary' },
];

const FILTERS = [
  { id: 'all', labelKey: 'filter.all' },
  { id: 'unlocked', labelKey: 'achievements.unlockedFilter' },
  { id: 'locked', labelKey: 'achievements.lockedFilter' },
];

export default function Achievements() {
  const { t, dir } = useI18n();
  const [filter, setFilter] = useState('all');
  const list = BADGES.filter((b) =>
    filter === 'all' ? true : filter === 'unlocked' ? b.unlocked : !b.unlocked
  );
  const unlocked = BADGES.filter((b) => b.unlocked).length;

  return (
    <ScreenShell dir={dir}>
      <div className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-black">{t('achievements.title')}</h1>
            <p className="mt-1 text-[13px] text-ink-dim">
              {t('achievements.subtitle').replace('{name}', t('demo.noam').split(' ')[0])}
            </p>
          </div>
          <div className="text-end">
            <div className="num text-2xl font-black text-lime">
              {unlocked}
              <span className="text-ink-faint">/{BADGES.length}</span>
            </div>
            <div className="num text-[11px] text-ink-faint">{t('achievements.unlockedLabel')}</div>
          </div>
        </div>

        {/* weekly challenge */}
        <Panel className="overflow-hidden p-6" glow accent="lime">
          <div className="flex items-start gap-4">
            <span
              className="anim-bob-soft grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl"
              style={{
                background: 'linear-gradient(150deg,#b8f06a44,#1a1046)',
                border: '2px solid #b8f06a',
                boxShadow: '0 0 30px -8px #b8f06a',
              }}
            >
              🎯
            </span>
            <div className="min-w-0 flex-1">
              <div className="num text-[10px] font-extrabold tracking-widest text-lime uppercase">
                {t('achievements.challengeTag')}
              </div>
              <h2 className="mt-1 text-lg font-black">{t('achievements.challengeTitle')}</h2>
              <p className="mt-1 text-[13px] text-ink-dim">{t('achievements.challengeText')}</p>
            </div>
          </div>

          <div className="mt-5">
            <div className="num mb-1.5 flex justify-between text-[12px]">
              <span className="text-ink-dim">{t('achievements.progress')}</span>
              <span className="font-extrabold text-lime">13 / 18</span>
            </div>
            <XPBar value={72} height={12} />
          </div>

          <div className="mt-5 flex items-center justify-between rounded-2xl border border-gold/30 bg-gold/10 p-3.5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏅</span>
              <div>
                <div className="text-[13px] font-extrabold">
                  {t('achievements.rewardBadge').replace('{name}', t('achievements.b12.title'))}
                </div>
                <div className="num text-[11px] text-ink-faint">{t('achievements.rewardSub')}</div>
              </div>
            </div>
            <span className="num text-[13px] font-extrabold text-gold">🪙 250</span>
          </div>
        </Panel>

        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <GhostButton key={f.id} active={f.id === filter} onClick={() => setFilter(f.id)}>
              {t(f.labelKey)}
            </GhostButton>
          ))}
        </div>

        {/* badge grid */}
        <div className="grid grid-cols-3 gap-3">
          {list.map((b, i) =>
            b.unlocked ? (
              <div
                key={b.key}
                className="anim-pop group flex flex-col items-center rounded-2xl border p-3 text-center transition-transform duration-300 hover:-translate-y-1"
                style={{
                  animationDelay: `${i * 70}ms`,
                  borderColor: `${ACCENTS[b.accent]}44`,
                  background: `${ACCENTS[b.accent]}12`,
                }}
              >
                <span
                  className="grid h-14 w-14 place-items-center rounded-full text-2xl transition group-hover:scale-110"
                  style={{
                    background: `radial-gradient(circle at 30% 25%, ${ACCENTS[b.accent]}55, #1a1046 75%)`,
                    border: `2px solid ${ACCENTS[b.accent]}`,
                    boxShadow: `0 0 24px -6px ${ACCENTS[b.accent]}`,
                  }}
                >
                  {b.e}
                </span>
                <div className="mt-2.5 text-[12px] leading-tight font-extrabold">{t(`${b.key}.title`)}</div>
                <div className="mt-1 text-[10px] leading-tight text-ink-faint">{t(`${b.key}.sub`)}</div>
                <span
                  className="num mt-2 rounded-md px-1.5 py-px text-[9px] font-extrabold"
                  style={{ background: `${ACCENTS[b.accent]}22`, color: ACCENTS[b.accent] }}
                >
                  {t(`achievements.rarity.${b.rarity}`)}
                </span>
              </div>
            ) : (
              <div
                key={b.key}
                className="flex flex-col items-center rounded-2xl border-2 border-dashed border-white/14 bg-black/20 p-3 text-center"
              >
                <span className="grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/4 text-2xl opacity-30 grayscale">
                  {b.e}
                </span>
                <div className="mt-2.5 text-[12px] leading-tight font-extrabold text-ink-dim">
                  {t(`${b.key}.title`)}
                </div>
                <div className="mt-1 text-[10px] leading-tight text-ink-faint">{t(`${b.key}.sub`)}</div>
                <span className="num mt-2 text-[10px] text-ink-faint">🔒 {t('locked')}</span>
              </div>
            )
          )}
        </div>
      </div>
    </ScreenShell>
  );
}
