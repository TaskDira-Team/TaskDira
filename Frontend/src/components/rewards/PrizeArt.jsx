import { Gift } from "lucide-react";
export const TOY_EMOJI = [
  "🎬",
  "🍦",
  "🎨",
  "📚",
  "🎮",
  "🍕",
  "🏕️",
  "🧺",
  "🎵",
  "🪁",
  "🧩",
  "🧁",
  "🔭",
  "🎟️",
  "🚲",
  "🎠",
  "🎧",
  "🚀",
];
export default function PrizeArt({ reward, className = "" }) {
  const index = TOY_EMOJI.indexOf(reward.emoji);
  return index >= 0 ? (
    <span
      aria-hidden="true"
      className={`prize-miniature ${className}`}
      style={{
        backgroundPosition: `${(index % 6) * 20}% ${Math.floor(index / 6) * 50}%`,
      }}
    />
  ) : (
    <span aria-hidden="true" className={`prize-custom ${className}`}>
      <Gift size={64} strokeWidth={1.8} />
    </span>
  );
}
