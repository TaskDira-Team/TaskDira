import { useMemo } from 'react';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { getRingAccent } from '../data/avatars';
import { ACCENTS, Avatar, Panel, ScreenShell } from '../components/ui/kit';

const PODIUM_ORDER = [1, 0, 2]; // silver, gold, bronze — gold raised in the middle
const MEDALS = ['🥇', '🥈', '🥉'];
const PODIUM_HEIGHTS = [96, 72, 56];

const FALLBACK_ACCENTS = ['lime', 'sky', 'coral', 'grape', 'gold', 'mint'];

// Uses the shared ring/accent bijection so a member is coloured identically
// here and on their profile. Anyone who has not chosen a ring falls back to a
// stable colour derived from their position.
function accentFor(user, index) {
  const ringId = user?.avatarState?.ringColorId;
  return ringId
    ? getRingAccent(ringId, FALLBACK_ACCENTS[index % FALLBACK_ACCENTS.length])
    : FALLBACK_ACCENTS[index % FALLBACK_ACCENTS.length];
}

function firstName(name) {
  return (name || '').split(' ')[0];
}

export default function Leaderboard() {
  const { t, dir } = useI18n();
  const { user } = useAuth();
  const { leaderboard, users } = useApp();

  const players = useMemo(() => {
    const source = leaderboard?.length ? leaderboard : users;
    return [...(source ?? [])]
      .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
      .map((u, index) => ({
        id: u.id,
        name: u.fullName || u.name || '',
        emoji: u.avatar?.emoji ?? '🙂',
        ring: accentFor(u, index),
        xp: u.points ?? 0,
        streak: u.streakDays ?? 0,
        you: u.id === user?.id,
      }));
  }, [leaderboard, users, user?.id]);

  // Zero across the board is the normal state for a new household, so the bar
  // needs a denominator that cannot be zero.
  const max = players[0]?.xp || 1;
  const showPodium = players.length >= 3;

  const myIndex = players.findIndex((p) => p.you);
  const nextUp = myIndex > 0 ? players[myIndex - 1] : null;
  const gap = nextUp ? nextUp.xp - players[myIndex].xp : 0;
  const showChase = !!nextUp && gap > 0;

  return (
    <ScreenShell dir={dir}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black">{t('leaderboard.title')}</h1>
          <p className="mt-1 text-[13px] text-ink-dim">{t('leaderboard.subtitle')}</p>
        </div>

        {showPodium && (
          <Panel className="px-4 pt-8 pb-5" glow accent="gold">
            <div className="flex items-end justify-center gap-3">
              {PODIUM_ORDER.map((idx) => {
                const p = players[idx];
                const first = idx === 0;
                const c = ACCENTS[p.ring];
                return (
                  <div key={p.id} className="flex flex-1 flex-col items-center">
                    {first && <div className="anim-glow mb-1 text-2xl">👑</div>}
                    <Avatar emoji={p.emoji} ring={p.ring} size={first ? 68 : 52} float={first} />
                    <div className="mt-2 max-w-full truncate text-[12px] font-extrabold">
                      {firstName(p.name)}
                    </div>
                    <div className="num text-[12px] font-extrabold" style={{ color: c }}>
                      {p.xp.toLocaleString('en-US')}
                    </div>
                    <div
                      className="mt-2 flex w-full flex-col items-center justify-start rounded-t-2xl border border-b-0 pt-2"
                      style={{
                        height: PODIUM_HEIGHTS[idx],
                        borderColor: `${c}44`,
                        background: `linear-gradient(180deg, ${c}2e, transparent)`,
                      }}
                    >
                      <span className="text-xl">{MEDALS[idx]}</span>
                      <span className="num mt-1 text-lg font-black" style={{ color: c }}>
                        {idx + 1}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        )}

        <ol className="space-y-2.5">
          {players.map((p, i) => {
            const c = ACCENTS[p.ring];
            return (
              <li key={p.id}>
                <div
                  className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
                    p.you ? 'border-lime/55 bg-lime/10' : 'border-white/8 bg-panel/50'
                  }`}
                  style={p.you ? { boxShadow: '0 0 30px -14px #b8f06a' } : undefined}
                >
                  <span
                    className="num w-7 shrink-0 text-center text-lg font-black"
                    style={{ color: i < 3 ? ACCENTS.gold : '#8577b8' }}
                  >
                    {i + 1}
                  </span>
                  <Avatar emoji={p.emoji} ring={p.ring} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[14px] font-extrabold">{p.name}</span>
                      {p.you && (
                        <span className="num rounded-md bg-lime px-1.5 py-px text-[10px] font-extrabold text-[#152007]">
                          {t('leaderboard.you')}
                        </span>
                      )}
                    </div>
                    <div className="num mt-0.5 text-[11px] text-ink-faint">
                      🔥 {t('leaderboard.streakDays').replace('{n}', p.streak)}
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/40">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(p.xp / max) * 100}%`,
                          background: `linear-gradient(90deg, ${c}77, ${c})`,
                          boxShadow: `0 0 12px -2px ${c}`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="num shrink-0 text-end">
                    <div className="text-[15px] font-extrabold" style={{ color: c }}>
                      {p.xp.toLocaleString('en-US')}
                    </div>
                    <div className="text-[10px] text-ink-faint">XP</div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {showChase ? (
          <div className="num rounded-2xl border border-dashed border-white/15 p-4 text-center text-[12px] text-ink-faint">
            {t('leaderboard.chaseA')}
            <span className="font-extrabold text-lime">{gap.toLocaleString('en-US')} XP</span>
            {t('leaderboard.chaseB')}
            {firstName(nextUp.name)}
            {t('leaderboard.chaseC')}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 p-4 text-center">
            <div className="text-2xl">🏡</div>
            <div className="mt-2 text-[13px] font-extrabold text-ink-dim">
              {t('household.membersTitle')} · {players.length}
            </div>
            <div className="num mt-1 text-[12px] text-ink-faint">{t('household.invite')}</div>
          </div>
        )}
      </div>
    </ScreenShell>
  );
}
