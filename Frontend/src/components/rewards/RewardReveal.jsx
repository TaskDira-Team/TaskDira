import { useEffect } from "react";
import PrizeArt from "./PrizeArt";
import { createPortal } from "react-dom";
import { Star, Coins } from "lucide-react";
import { useI18n } from "../../context/I18nContext";
import useDialogFocus from "../../hooks/useDialogFocus";
import Confetti from "../ui/Confetti";

export default function RewardReveal({ celebration, onClose }) {
  const { lang, dir, tx, t } = useI18n();
  const he = lang === "he";
  const ref = useDialogFocus(true, onClose);
  const reward = celebration.reward;
  // A short celebration: it closes on its own, or on a tap outside it.
  useEffect(() => {
    const timer = window.setTimeout(onClose, 2000);
    return () => window.clearTimeout(timer);
  }, [onClose]);
  return createPortal(
    <div
      className="reward-reveal"
      dir={dir}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Confetti active />
      <section
        className="reward-reveal-stage"
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reward-reveal-title"
        aria-describedby="reward-reveal-description"
      >
        <div className="reveal-prize" aria-hidden="true">
          <div className="reveal-halo" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Star
              className={`reveal-star star-${i}`}
              key={i}
              size={i % 2 ? 20 : 30}
              fill="currentColor"
            />
          ))}
          <PrizeArt reward={reward || {}} />
        </div>
        <h2 id="reward-reveal-title">
          {he ? "יש! זה שלכם!" : "YAY! It’s yours!"}
        </h2>
        <p id="reward-reveal-description">
          {he ? "הרווחתם את זה, אלופים." : "You earned this, home hero."}
        </p>
        <h3>{tx(reward?.title || "")}</h3>
        {reward?.code && (
          <p className="reveal-voucher">
            <span>{t("voucherCode")}</span>
            <strong>{reward.code}</strong>
          </p>
        )}
        <p className="reveal-balance">
          <Coins size={19} />
          <strong>{celebration.remainingPoints ?? 0}</strong>
          {he ? "מטבעות נשארו להרפתקה הבאה" : "coins for your next adventure"}
        </p>
      </section>
    </div>,
    document.body,
  );
}
