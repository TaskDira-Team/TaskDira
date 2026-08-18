import { useEffect, useRef, useState } from 'react';

/* ---------------- accent system ---------------- */

export const ACCENTS = {
  lime: '#b8f06a',
  grape: '#a06cff',
  sky: '#59c8ff',
  coral: '#ff7a8a',
  gold: '#ffcb47',
  mint: '#4fe0c0',
};

/* ---------------- surfaces ---------------- */

export function Panel({ children, className = '', accent, glow = false }) {
  const c = accent ? ACCENTS[accent] : '#a06cff';
  return (
    <div
      className={`relative rounded-3xl border border-white/8 bg-gradient-to-b from-panel-2/90 to-abyss/80 backdrop-blur-sm ${className}`}
      style={glow ? { boxShadow: `0 0 0 1px ${c}22, 0 24px 60px -30px ${c}66` } : undefined}
    >
      {children}
    </div>
  );
}

/** Soft moving radial blooms — the shared ground for every screen. */
export function Aurora({ seed = 0 }) {
  const spots = [
    { c: '#5b21b6', x: '12%', y: '8%', s: 620, d: '0s' },
    { c: '#8fd53a', x: '82%', y: '18%', s: 460, d: '-4s' },
    { c: '#2563eb', x: '70%', y: '78%', s: 560, d: '-8s' },
    { c: '#c026d3', x: '20%', y: '86%', s: 420, d: '-12s' },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {spots.map((s, i) => (
        <div
          key={i}
          className="anim-drift absolute rounded-full"
          style={{
            left: s.x,
            top: s.y,
            width: s.s,
            height: s.s,
            transform: 'translate(-50%,-50%)',
            background: `radial-gradient(circle, ${s.c}55 0%, ${s.c}18 45%, transparent 70%)`,
            filter: 'blur(30px)',
            animationDelay: `${parseFloat(s.d) - seed}s`,
          }}
        />
      ))}
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'radial-gradient(circle at center, rgba(255,255,255,0.10) 1px, transparent 1.2px)',
          backgroundSize: '34px 34px',
          maskImage: 'radial-gradient(120% 80% at 50% 0%, #000 20%, transparent 75%)',
        }}
      />
    </div>
  );
}

/* ---------------- screen scaffold ---------------- */

/** Full-page dark scaffold for the rebuilt screens: ground color, aurora, centered column. */
export function ScreenShell({ dir, width = 'max-w-xl', className = '', children }) {
  return (
    <div dir={dir} className="font-landing relative min-h-screen overflow-hidden bg-void text-ink">
      <Aurora />
      <div className={`relative mx-auto w-full ${width} px-5 pb-16 pt-8 ${className}`}>{children}</div>
    </div>
  );
}

/* ---------------- controls ---------------- */

export function SegmentedTabs({ items, value, onChange, accent = 'lime' }) {
  const c = ACCENTS[accent];
  const darkText = accent === 'grape' || accent === 'coral' ? 'text-white' : 'text-[#152007]';
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-abyss/70 p-1">
      {items.map((it) => {
        const on = it.key === value;
        return (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            className={`flex-1 rounded-full py-2 text-[13px] font-extrabold transition ${
              on ? darkText : 'text-ink-dim hover:text-ink'
            }`}
            style={on ? { background: c, boxShadow: `0 0 20px -6px ${c}` } : undefined}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

export function StatTile({ emoji, value, label, accent = 'lime', className = '' }) {
  const c = ACCENTS[accent];
  return (
    <div
      className={`rounded-2xl border p-3 text-center ${className}`}
      style={{ borderColor: `${c}33`, background: `${c}10` }}
    >
      {emoji && <div className="text-lg">{emoji}</div>}
      <div className="num text-xl font-extrabold" style={{ color: c }}>
        {value}
      </div>
      <div className="text-[11px] font-bold text-ink-faint">{label}</div>
    </div>
  );
}

export function Switch({ checked, onChange, label }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`relative h-7 rounded-full border transition ${
        checked ? 'border-lime/60 bg-lime/25' : 'border-white/15 bg-black/40'
      }`}
      style={{ width: 52 }}
    >
      <span
        className="absolute top-0.5 rounded-full transition-all duration-300"
        style={{
          width: 22,
          height: 22,
          insetInlineStart: checked ? 26 : 3,
          background: checked ? ACCENTS.lime : '#6b5da3',
          boxShadow: checked ? `0 0 14px -2px ${ACCENTS.lime}` : 'none',
        }}
      />
    </button>
  );
}

/* ---------------- type helpers ---------------- */

export function Num({ children, className = '' }) {
  return <span className={`num ${className}`}>{children}</span>;
}

export function Eyebrow({ children, accent = 'lime' }) {
  return (
    <span
      className="num inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase"
      style={{
        color: ACCENTS[accent],
        borderColor: `${ACCENTS[accent]}44`,
        background: `${ACCENTS[accent]}12`,
      }}
    >
      {children}
    </span>
  );
}

/* ---------------- buttons ---------------- */

export function LimeButton({ children, size = 'md', className = '', onClick }) {
  const pad =
    size === 'lg'
      ? 'px-9 py-4 text-lg'
      : size === 'sm'
        ? 'px-4 py-1.5 text-[13px]'
        : 'px-6 py-2.5 text-[15px]';
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-full bg-gradient-to-b from-lime to-lime-deep font-extrabold text-[#152007] transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 ${pad} ${className}`}
      style={{ boxShadow: '0 0 0 1px #d6ff9a, 0 14px 38px -12px #8fd53acc' }}
    >
      <span className="relative z-10">{children}</span>
      <span className="anim-sheen absolute inset-y-0 -left-1/3 z-0 w-1/3 bg-white/45 blur-md" />
    </button>
  );
}

export function GhostButton({ children, active = false, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-[13px] font-bold transition ${
        active
          ? 'border-lime/60 bg-lime/15 text-lime'
          : 'border-white/10 text-ink-dim hover:border-white/25 hover:text-ink'
      } ${className}`}
    >
      {children}
    </button>
  );
}

/* ---------------- avatar ---------------- */

export function Avatar({
  emoji,
  ring = 'grape',
  size = 48,
  level,
  float = false,
  badge,
  className = '',
}) {
  const c = ACCENTS[ring];
  return (
    <div
      className={`relative shrink-0 ${float ? 'anim-bob-soft' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        className="grid h-full w-full place-items-center rounded-full"
        style={{
          background: `linear-gradient(160deg, ${c}44, #1a1046)`,
          border: `2px solid ${c}`,
          boxShadow: `0 0 22px -4px ${c}aa, inset 0 0 18px -6px ${c}88`,
          fontSize: size * 0.46,
          lineHeight: 1,
        }}
      >
        <span>{emoji}</span>
      </div>
      {level !== undefined && (
        <span
          className="num absolute -bottom-1 -left-1 rounded-full px-1.5 py-px text-[10px] font-extrabold text-[#152007]"
          style={{ background: ACCENTS.lime, boxShadow: '0 0 12px -2px #b8f06a' }}
        >
          {level}
        </span>
      )}
      {badge && (
        <span
          className="absolute -top-1 -right-1 grid place-items-center rounded-full bg-abyss"
          style={{
            width: size * 0.36,
            height: size * 0.36,
            fontSize: size * 0.2,
            border: `1.5px solid ${ACCENTS.gold}`,
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

/* ---------------- meters ---------------- */

export function XPBar({ value, accent = 'lime', height = 10, label }) {
  const c = ACCENTS[accent];
  const ref = useRef(null);
  const shown = useReveal(ref);
  return (
    <div ref={ref} className="w-full">
      <div
        className="relative w-full overflow-hidden rounded-full bg-black/45 ring-1 ring-white/10"
        style={{ height }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-[1400ms] ease-out"
          style={{
            width: `${shown ? value : 0}%`,
            background: `linear-gradient(90deg, ${c}88, ${c})`,
            boxShadow: `0 0 16px -2px ${c}`,
          }}
        />
      </div>
      {label && <div className="num mt-1.5 text-[11px] text-ink-faint">{label}</div>}
    </div>
  );
}

export function XPRing({ value, size = 176, accent = 'lime', children }) {
  const c = ACCENTS[accent];
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const ref = useRef(null);
  const shown = useReveal(ref);
  return (
    <div ref={ref} className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ffffff14" strokeWidth={8} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={c}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - (shown ? value : 0) / 100)}
          style={{
            transition: 'stroke-dashoffset 1.6s cubic-bezier(.2,.8,.2,1)',
            filter: `drop-shadow(0 0 10px ${c})`,
          }}
        />
      </svg>
      {children}
    </div>
  );
}

/* ---------------- reveal + count-up ---------------- */

export function useReveal(ref) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setShown(true), {
      threshold: 0.25,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return shown;
}

export function CountUp({ to, duration = 1600, decimals = 0, suffix = '', prefix = '', className = '' }) {
  const ref = useRef(null);
  const shown = useReveal(ref);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!shown) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      setN(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shown, to, duration]);

  return (
    <span ref={ref} className={`num ${className}`}>
      {prefix}
      {n.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
