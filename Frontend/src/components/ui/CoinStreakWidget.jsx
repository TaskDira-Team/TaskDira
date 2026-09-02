import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';

/** Coins land before the counter starts moving, so the number ticks up as the
 * pile settles rather than racing it. */
const COIN_FLY_MS = 900;
const COIN_STAGGER_MS = 90;
const BURST_COINS = 3;
const COUNT_DELAY_MS = 650;
const BURST_CLEAR_MS = 1300;

/** Art size for both icons. The burst offsets and the flying coins' vertical
 * centring are derived from this, so the pile keeps landing on the resting
 * coin if it changes again. Numbers are sized by .csw-num in index.css. */
const ICON_SIZE = 30;

const reduceMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Gradients are declared once per document and referenced by every coin/flame
 * instance, including the ones that fly in during a burst. AppShell renders
 * this a single time; the widget itself renders in two places (sidebar footer
 * on desktop, top corner on mobile) and both share these definitions.
 */
export function CoinStreakDefs() {
  return (
    <svg width="0" height="0" aria-hidden className="absolute">
      <defs>
        <radialGradient id="csw-coin-face" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffe9a8" />
          <stop offset="45%" stopColor="#ffcb47" />
          <stop offset="100%" stopColor="#d99a1f" />
        </radialGradient>
        <linearGradient id="csw-coin-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff0bf" />
          <stop offset="100%" stopColor="#c8890f" />
        </linearGradient>
        <linearGradient id="csw-flame-body" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ff5f6d" />
          <stop offset="55%" stopColor="#ff9248" />
          <stop offset="100%" stopColor="#ffcb47" />
        </linearGradient>
        <linearGradient id="csw-flame-core" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ffcb47" />
          <stop offset="100%" stopColor="#fff6d8" />
        </linearGradient>
        <linearGradient id="csw-sheen-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="50%" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id="csw-coin-clip">
          <circle cx="12" cy="12" r="9" />
        </clipPath>
      </defs>
    </svg>
  );
}

function Coin({ size = ICON_SIZE, sheen = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="csw-drop">
      <circle cx="12" cy="12" r="9.6" fill="url(#csw-coin-rim)" />
      <circle cx="12" cy="12" r="8" fill="url(#csw-coin-face)" />
      <circle
        cx="12"
        cy="12"
        r="5.6"
        fill="none"
        stroke="#c8890f"
        strokeOpacity="0.55"
        strokeWidth="1"
      />
      <path
        d="M12 8.4v7.2M10.2 10.1h3.2a1.5 1.5 0 0 1 0 3h-2.6a1.5 1.5 0 0 0 0 3h3.2"
        fill="none"
        stroke="#a9740a"
        strokeOpacity="0.75"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
      {sheen && (
        <g clipPath="url(#csw-coin-clip)">
          <rect className="csw-sheen" x="-6" y="0" width="7" height="24" fill="url(#csw-sheen-grad)" />
        </g>
      )}
    </svg>
  );
}

function FlameIcon({ size = ICON_SIZE }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="csw-drop">
      <path
        d="M12 2.5c3.2 3.1 5.6 5.9 5.6 9.4a5.6 5.6 0 1 1-11.2 0c0-1.7.7-3.2 1.9-4.7.5 1 1.2 1.7 2 2 .3-2.4.8-4.6 1.7-6.7Z"
        fill="url(#csw-flame-body)"
      />
      <path
        className="csw-flicker"
        d="M12 12.2c1.5 1.5 2.5 2.8 2.5 4.2a2.5 2.5 0 1 1-5 0c0-1.4 1-2.7 2.5-4.2Z"
        fill="url(#csw-flame-core)"
      />
    </svg>
  );
}

/**
 * Eases `shown` toward `value` on change. Increases can wait out `delayOnIncrease`
 * so a coin burst lands first; decreases (spending) tick immediately. Under
 * reduced motion the value swaps instantly. `bump` increments per change so the
 * caller can restart a pop animation by keying on it.
 */
function useTickingValue(value, { delayOnIncrease = 0, duration = 550 } = {}) {
  const [shown, setShown] = useState(value);
  const [bump, setBump] = useState(0);
  const prevRef = useRef(value);
  const rafRef = useRef(0);
  const timerRef = useRef(0);

  useEffect(() => {
    const from = prevRef.current;
    if (from === value) return;
    prevRef.current = value;

    if (reduceMotion()) {
      setShown(value);
      return;
    }

    const run = () => {
      setBump((b) => b + 1);
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setShown(Math.round(from + (value - from) * eased));
        if (p < 1) rafRef.current = requestAnimationFrame(tick);
        else setShown(value);
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    const delay = value > from ? delayOnIncrease : 0;
    if (delay > 0) timerRef.current = setTimeout(run, delay);
    else run();

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(timerRef.current);
    };
  }, [value, delayOnIncrease, duration]);

  return [shown, bump];
}

/** Coins arc in from scattered offsets and settle into a small pile over the
 * resting coin, then fade as the counter lands. */
function CoinBurst({ burstKey }) {
  if (!burstKey) return null;
  const paths = [
    { fx: '-40px', fy: '-30px', tx: '-4px', ty: '3px' },
    { fx: '30px', fy: '-38px', tx: '4px', ty: '-1px' },
    { fx: '-8px', fy: '-46px', tx: '0px', ty: '-5px' },
  ].slice(0, BURST_COINS);

  return (
    <span className="pointer-events-none absolute inset-0" aria-hidden>
      {paths.map((p, i) => (
        <span
          key={`${burstKey}-${i}`}
          className="csw-coin-fly absolute left-0 top-1/2"
          style={{
            // top-1/2 puts the coin's top edge on the centre line; pull it back
            // by half its height so it lands centred on the resting coin. A
            // -translate-y-1/2 utility can't be used here — the animation owns
            // the transform property.
            marginTop: `-${ICON_SIZE / 2}px`,
            '--csw-fx': p.fx,
            '--csw-fy': p.fy,
            '--csw-tx': p.tx,
            '--csw-ty': p.ty,
            animationDelay: `${i * COIN_STAGGER_MS}ms`,
          }}
        >
          <Coin sheen={false} />
        </span>
      ))}
    </span>
  );
}

/**
 * Persistent, unboxed coin + streak readout. Layout-agnostic — it lays itself
 * out as a single row and leaves placement to the caller (AppShell puts it in
 * the sidebar footer above the profile block on desktop, and in the top corner
 * on mobile where the sidebar is display:none).
 *
 * Requires <CoinStreakDefs /> somewhere in the document for its gradients.
 *
 * Resolves the current user the same way Rewards and HomeDashboard do — from
 * the enriched member record in `users`, falling back to the auth user. That
 * matters: the auth user is hydrated by a path that never receives a balance
 * (hydrateAuthenticatedUser only seeds an empty ledger entry), so reading it
 * directly reported 0 until the first earn or redemption re-synced it. The
 * member record is enriched after the roster populates the ledger, so it
 * carries the real spendable `balance` (not lifetime `points`) and `streakDays`.
 */
export default function CoinStreakWidget({ className = '' }) {
  const { user } = useAuth();
  const { users } = useApp();
  const { t, p } = useI18n();

  const me = users.find((u) => u.id === user?.id) || user;
  const balance = me?.balance ?? 0;
  const streak = me?.streakDays ?? 0;

  const [shownBalance, balanceBump] = useTickingValue(balance, {
    delayOnIncrease: COUNT_DELAY_MS,
  });
  const [shownStreak, streakBump] = useTickingValue(streak);

  const [burst, setBurst] = useState(0);
  const burstIdRef = useRef(0);
  const prevBalanceRef = useRef(balance);

  useEffect(() => {
    const prev = prevBalanceRef.current;
    if (balance === prev) return;
    prevBalanceRef.current = balance;
    if (balance <= prev || reduceMotion()) return;

    burstIdRef.current += 1;
    setBurst(burstIdRef.current);
    const timer = setTimeout(() => setBurst(0), BURST_CLEAR_MS);
    return () => clearTimeout(timer);
  }, [balance]);

  if (!user) return null;

  return (
    <div className={`pointer-events-none flex items-center gap-5 ${className}`}>
      <span className="relative flex items-center gap-2" role="img" aria-label={p(balance)}>
        <Coin />
        <span key={balanceBump} className={`csw-num ${balanceBump ? 'csw-tick-pop' : ''}`}>
          {shownBalance}
        </span>
        <CoinBurst burstKey={burst} />
      </span>

      <span
        className="flex items-center gap-2"
        role="img"
        aria-label={t('leaderboard.streakDays').replace('{n}', streak)}
      >
        <FlameIcon />
        <span key={streakBump} className={`csw-num ${streakBump ? 'csw-tick-pop' : ''}`}>
          {shownStreak}
        </span>
      </span>
    </div>
  );
}
