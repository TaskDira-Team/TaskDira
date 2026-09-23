import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { modalVariants, overlayVariants } from "../../utils/motion";
import useDialogFocus from "../../hooks/useDialogFocus";

/* ---------------- accent system ---------------- */

export const ACCENTS = {
  lime: "#17675c",
  grape: "#7560a6",
  sky: "#276c9a",
  coral: "#c65035",
  gold: "#976500",
  mint: "#297462",
};

/* ---------------- surfaces ---------------- */

export function Panel({ children, className = "", accent, glow = false }) {
  const c = accent ? ACCENTS[accent] : "#7560a6";
  return (
    <div
      className={`world-kit-panel relative rounded-2xl border border-hairline bg-white ${className}`}
      style={undefined}
    >
      {children}
    </div>
  );
}

/** Soft moving radial blooms — the shared ground for every screen. */
export function Aurora() {
  return null;
}

/* ---------------- screen scaffold ---------------- */

/** Full-page dark scaffold for the rebuilt screens: ground color, aurora, centered column. */
export function ScreenShell({
  dir,
  width = "max-w-xl",
  className = "",
  children,
}) {
  return (
    <div
      dir={dir}
      className="world-screen font-landing relative bg-void text-ink"
    >
      <Aurora />
      <div
        className={`relative mx-auto w-full ${width} px-5 pb-16 pt-8 ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------------- dialog + form fields ---------------- */

/** Dark input treatment shared by every dialog form. The explicit `text-ink`
 * and `placeholder:text-ink-faint` matter: without them an input inherits the
 * near-white shell colour and renders invisible on a pale background. */
export const fieldClass =
  "world-kit-input w-full min-w-0 rounded-xl border border-hairline bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none transition focus:border-lime/60 disabled:cursor-not-allowed disabled:opacity-50";

/** Native pickers (date, select popups) follow color-scheme, not our CSS —
 * without this the calendar and dropdown render as white system widgets. */
export const darkControlStyle = { colorScheme: "light" };

/** Windows renders <option> with the OS background regardless of the parent,
 * so each option needs its colours set directly. */
export const darkOptionStyle = { background: "#fffefa", color: "#173e3b" };

export function Field({ label, hint, htmlFor, className = "", children }) {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="mb-1.5 block text-sm font-bold text-ink-dim"
        >
          {label}
        </label>
      )}
      {children}
      {hint && (
        <p className="mt-1 text-[11px] leading-snug text-ink-faint">{hint}</p>
      )}
    </div>
  );
}

/**
 * Dark modal shell for the rebuilt screens — the single dialog vocabulary, so
 * screens stop hand-rolling overlays. Closes on Escape and on overlay click,
 * moves focus to the first control on open, and restores it to whatever was
 * focused before on close.
 *
 * Inherits `dir` from the surrounding shell rather than setting its own.
 */
export function Dialog({
  open,
  onClose,
  title,
  subtitle,
  footer,
  accent = "lime",
  size = "md",
  children,
}) {
  const panelRef = useDialogFocus(open, onClose);
  const titleId = useId();
  const c = ACCENTS[accent] ?? ACCENTS.lime;

  const width =
    size === "sm"
      ? "sm:max-w-sm"
      : size === "lg"
        ? "sm:max-w-2xl"
        : "sm:max-w-lg";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            tabIndex={-1}
            className={`relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-gradient-to-b from-panel-2/95 to-abyss/95 backdrop-blur-md sm:rounded-3xl ${width}`}
            style={{ boxShadow: `0 0 0 1px ${c}22, 0 30px 80px -30px ${c}55` }}
          >
            {(title || onClose) && (
              <div className="flex items-start justify-between gap-3 border-b border-white/8 px-5 py-4">
                <div className="min-w-0">
                  {title && (
                    <h2 id={titleId} className="text-base font-black text-ink">
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="mt-0.5 text-xs text-ink-dim">{subtitle}</p>
                  )}
                </div>
                {onClose && (
                  <button
                    type="button"
                    data-dialog-close
                    aria-label="Close"
                    onClick={onClose}
                    className="shrink-0 rounded-lg p-1.5 text-ink-faint transition hover:bg-white/8 hover:text-ink"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            <div className="dialog-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {children}
            </div>

            {footer && (
              <div className="border-t border-white/8 px-5 py-4">{footer}</div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Styled stand-in for window.confirm. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone = "coral",
  busy = false,
  onConfirm,
  onCancel,
}) {
  const c = ACCENTS[tone] ?? ACCENTS.coral;
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      accent={tone}
      size="sm"
      footer={
        <div className="flex gap-3">
          <GhostButton onClick={onCancel} className="flex-1">
            {cancelLabel}
          </GhostButton>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-full px-5 py-2 text-[13px] font-extrabold text-[#20060c] transition disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: c, boxShadow: `0 0 20px -6px ${c}` }}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <p className="text-sm leading-relaxed break-words text-ink-dim">
        {message}
      </p>
    </Dialog>
  );
}

/* ---------------- controls ---------------- */

export function SegmentedTabs({ items, value, onChange, accent = "lime" }) {
  const c = ACCENTS[accent];
  const darkText =
    accent === "grape" || accent === "coral" ? "text-white" : "text-[#152007]";
  return (
    <div className="world-kit-tabs flex items-center gap-2 rounded-xl border border-hairline bg-abyss p-1">
      {items.map((it) => {
        const on = it.key === value;
        return (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            aria-pressed={on}
            className={`flex-1 rounded-full py-2 text-[13px] font-extrabold transition ${
              on ? darkText : "text-ink-dim hover:text-ink"
            }`}
            style={
              on
                ? { background: c, boxShadow: `0 0 20px -6px ${c}` }
                : undefined
            }
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

export function StatTile({
  emoji,
  value,
  label,
  accent = "lime",
  className = "",
}) {
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
        checked ? "border-lime/60 bg-lime/25" : "border-white/15 bg-black/40"
      }`}
      style={{ width: 52 }}
    >
      <span
        className="absolute top-0.5 rounded-full transition-all duration-300"
        style={{
          width: 22,
          height: 22,
          insetInlineStart: checked ? 26 : 3,
          background: checked ? ACCENTS.lime : "#6b5da3",
          boxShadow: checked ? `0 0 14px -2px ${ACCENTS.lime}` : "none",
        }}
      />
    </button>
  );
}

/* ---------------- type helpers ---------------- */

export function Num({ children, className = "" }) {
  return <span className={`num ${className}`}>{children}</span>;
}

export function Eyebrow({ children, accent = "lime" }) {
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

export function LimeButton({
  children,
  size = "md",
  className = "",
  onClick,
  type = "button",
  disabled = false,
  form,
}) {
  const pad =
    size === "lg"
      ? "px-9 py-4 text-lg"
      : size === "sm"
        ? "px-4 py-1.5 text-[13px]"
        : "px-6 py-2.5 text-[15px]";
  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled}
      className={`world-kit-primary group relative overflow-hidden rounded-xl bg-lime font-extrabold text-[#152007] transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${pad} ${className}`}
      style={
        disabled
          ? undefined
          : { boxShadow: "0 0 0 1px #d6ff9a, 0 14px 38px -12px #104f46cc" }
      }
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export function GhostButton({
  children,
  active = false,
  onClick,
  className = "",
  type = "button",
  disabled = false,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`world-kit-ghost rounded-xl border px-4 py-1.5 text-[13px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? "border-lime/60 bg-lime/15 text-lime"
          : "border-white/10 text-ink-dim hover:border-white/25 hover:text-ink"
      } ${className}`}
    >
      {children}
    </button>
  );
}

/* ---------------- avatar ---------------- */

export function Avatar({
  emoji,
  ring = "grape",
  size = 48,
  level,
  float = false,
  badge,
  className = "",
}) {
  const c = ACCENTS[ring];
  return (
    <div
      className={`world-kit-avatar relative shrink-0 ${float ? "anim-bob-soft" : ""} ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        className="grid h-full w-full place-items-center rounded-full"
        style={{
          background: `linear-gradient(160deg, ${c}44, #ffffff)`,
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
          style={{
            background: ACCENTS.lime,
            boxShadow: "0 0 12px -2px #17675c",
          }}
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

export function XPBar({ value, accent = "lime", height = 10, label }) {
  const c = ACCENTS[accent];
  const ref = useRef(null);
  const shown = useReveal(ref);
  return (
    <div ref={ref} className="w-full">
      <div
        className="world-kit-progress relative w-full overflow-hidden rounded-full bg-hairline"
        style={{ height }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-[1400ms] ease-out"
          style={{
            width: `${Math.max(0, Math.min(100, shown ? value : 0))}%`,
            background: `linear-gradient(90deg, ${c}88, ${c})`,
            boxShadow: `0 0 16px -2px ${c}`,
          }}
        />
      </div>
      {label && (
        <div className="num mt-1.5 text-[11px] text-ink-faint">{label}</div>
      )}
    </div>
  );
}

export function XPRing({ value, size = 176, accent = "lime", children }) {
  const c = ACCENTS[accent];
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const ref = useRef(null);
  const shown = useReveal(ref);
  return (
    <div
      ref={ref}
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="absolute -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#ffffff14"
          strokeWidth={8}
        />
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
            transition: "stroke-dashoffset 1.6s cubic-bezier(.2,.8,.2,1)",
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
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setShown(true),
      {
        threshold: 0.25,
      },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return shown;
}

export function CountUp({
  to,
  duration = 1600,
  decimals = 0,
  suffix = "",
  prefix = "",
  className = "",
}) {
  const ref = useRef(null);
  const shown = useReveal(ref);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!shown) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(to);
      return;
    }
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
      {n.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
