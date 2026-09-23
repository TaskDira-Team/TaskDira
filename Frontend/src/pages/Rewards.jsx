import { useState } from "react";
import {
  Check,
  Coins,
  Gift,
  LockKeyhole,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { useI18n } from "../context/I18nContext";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import {
  ConfirmDialog,
  CountUp,
  LimeButton,
  ScreenShell,
} from "../components/ui/kit";
import RewardFormDialog from "../components/rewards/RewardFormDialog";
import RewardReveal from "../components/rewards/RewardReveal";
import useVisibleMotion from "../hooks/useVisibleMotion";
import "../components/rewards/floatingShop.css";
import "../components/ui/community.css";

const FILLS = [
  "var(--community-coral)",
  "var(--community-lilac)",
  "var(--community-gold)",
  "var(--community-mint)",
];

function RewardCard({
  reward,
  index,
  xp,
  balance,
  claiming,
  onClaim,
  isAdmin,
  onEdit,
  onDelete,
}) {
  const { t, lang, tx } = useI18n();
  const en = lang === "en";
  const { ref, running } = useVisibleMotion();
  const xpGap = Math.max(0, reward.requiredPoints - xp);
  const shortBy = Math.max(0, reward.cost - balance);
  const affordable = reward.unlocked && reward.affordable && shortBy === 0;
  return (
    <article
      ref={ref}
      data-motion-running={running}
      className={`community-reward ${reward.claimed ? "is-claimed" : !reward.unlocked ? "is-locked" : ""}`}
      style={{
        "--reward-fill": FILLS[index % FILLS.length],
        "--float-delay": `${index * -0.85}s`,
      }}
    >
      <div className="community-reward-art">
        <span aria-hidden="true">{reward.emoji || "🎁"}</span>
        <div className="community-price">
          <Coins size={16} aria-hidden="true" />
          {reward.cost.toLocaleString()}
        </div>
      </div>
      <div className="community-reward-body">
        <h2>{tx(reward.title)}</h2>
        <p>
          {tx(reward.description) ||
            (en
              ? "A little something to make your hard work feel extra good."
              : "משהו קטן שיהפוך את המאמץ שלכם לשווה עוד יותר.")}
        </p>
        {!reward.claimed && !reward.unlocked && (
          <div className="mb-3 flex items-center gap-2 text-sm text-ink-dim">
            <LockKeyhole size={15} aria-hidden="true" />
            {xpGap.toLocaleString()} XP {en ? "to unlock" : "לפתיחה"}
          </div>
        )}
        {reward.claimed ? (
          <div className="community-chip justify-center py-3">
            <Check size={18} aria-hidden="true" />
            {t("rewards.claimedNote")}
          </div>
        ) : (
          <button
            type="button"
            disabled={!affordable || claiming}
            onClick={onClaim}
            className="community-reward-action"
          >
            {claiming
              ? en
                ? "Redeeming…"
                : "מממשים…"
              : !reward.unlocked
                ? en
                  ? "Keep earning XP"
                  : "ממשיכים לצבור XP"
                : affordable
                  ? t("rewards.redeem")
                  : `${shortBy.toLocaleString()} ${en ? "more coins needed" : "מטבעות נוספים נדרשים"}`}
          </button>
        )}
        {isAdmin && (
          <div className="reward-admin-tools">
            <button
              type="button"
              onClick={onEdit}
              className="community-icon-button"
              aria-label={`${en ? "Edit" : "עריכה"} ${tx(reward.title)}`}
            >
              <Pencil size={17} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="community-icon-button"
              aria-label={`${en ? "Delete" : "מחיקה"} ${tx(reward.title)}`}
            >
              <Trash2 size={17} />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export default function Rewards() {
  const { t, dir, tx, lang } = useI18n();
  const en = lang === "en";
  const { user } = useAuth();
  const {
    rewards,
    users,
    permissions,
    redeemReward,
    createReward,
    updateReward,
    deleteReward,
    celebration,
    dismissCelebration,
  } = useApp();
  const [claimingId, setClaimingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const me = users.find((u) => u.id === user?.id) || user;
  const xp = me?.points ?? 0;
  const balance = me?.balance ?? 0;
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

  const handleCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (reward) => {
    setEditing(reward);
    setFormOpen(true);
  };

  // The form keeps cost separate from requiredPoints: the first is what the
  // wallet pays, the second is the XP standing that unlocks it. Welding them
  // together makes the unaffordable-but-unlocked state unreachable.
  const handleFormSubmit = async (values) => {
    setBusy(true);
    try {
      if (editing) {
        await updateReward(editing.id, { ...editing, ...values });
      } else {
        await createReward({ ...values, emoji: "🎁", description: "" });
      }
      setFormOpen(false);
      setEditing(null);
    } catch {
      // AppContext already surfaced the Hebrew message as a toast.
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteReward(deleting.id);
      setDeleting(null);
    } catch {
      // AppContext already surfaced the Hebrew message as a toast.
    } finally {
      setBusy(false);
    }
  };

  const nextLocked = rewards
    .filter((r) => !r.unlocked && !r.claimed)
    .sort((a, b) => a.requiredPoints - b.requiredPoints)[0];

  return (
    <ScreenShell
      dir={dir}
      width="max-w-7xl"
      className="community-page floating-shop"
    >
      <div className="community-heading">
        <div>
          <h1>
            {en ? "Welcome to the happy shop!" : "ברוכים הבאים לחנות הכיף!"}
          </h1>
          <p>
            {en
              ? "Turn the little things you do at home into something to look forward to."
              : "הופכים את הדברים הקטנים שעושים בבית למשהו שכיף לצפות לו."}
          </p>
        </div>
        {isAdmin && (
          <LimeButton onClick={handleCreate}>
            <span className="inline-flex items-center gap-2">
              <Plus size={18} />
              {t("addReward")}
            </span>
          </LimeButton>
        )}
      </div>
      <section className="community-feature shop-intro">
        <div>
          <Gift className="mb-4" size={32} aria-hidden="true" />
          <h2>
            {en ? "Little chores. BIG treats!" : "משימות קטנות. כיף גדול!"}
          </h2>
          <p>
            {en
              ? "XP unlocks new rewards. Spendable coins make them yours. Your lifetime XP stays with you."
              : "XP פותח פרסים חדשים. מטבעות מאפשרים לממש אותם. הניסיון שצברתם נשאר שלכם."}
          </p>
        </div>
        <div className="community-wallet">
          <span className="community-big-coin" aria-hidden="true">
            <Star size={38} fill="currentColor" strokeWidth={2.5} />
          </span>
          <div>
            <strong>
              <CountUp to={balance} />
            </strong>
            <small>{en ? "Spendable coins" : "מטבעות למימוש"}</small>
            <small>
              {xp.toLocaleString()} {en ? "lifetime XP" : "XP שנצברו"}
            </small>
          </div>
        </div>
      </section>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold">{t("rewardsStore")}</h2>
        <span className="community-chip">
          {
            rewards.filter((r) => !r.claimed && r.unlocked && r.affordable)
              .length
          }{" "}
          {en ? "ready to redeem" : "זמינים למימוש"}
        </span>
      </div>
      {rewards.length === 0 ? (
        <div className="community-empty">
          <Gift size={42} />
          <h2>
            {en ? "Make room for good things." : "מפנים מקום לדברים טובים."}
          </h2>
          <p>
            {en
              ? isAdmin
                ? "Add your first household reward to give everyone something to work toward."
                : "Your household admin can add rewards for everyone to work toward."
              : isAdmin
                ? "הוסיפו את הפרס הראשון כדי שיהיה לכולם למה לשאוף."
                : "מנהל הבית יכול להוסיף פרסים שיהיה לכולם למה לשאוף."}
          </p>
        </div>
      ) : (
        <div className="community-rewards">
          {rewards.map((reward, index) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              index={index}
              xp={xp}
              balance={balance}
              claiming={claimingId === reward.id}
              onClaim={() => handleClaim(reward)}
              isAdmin={isAdmin}
              onEdit={() => handleEdit(reward)}
              onDelete={() => setDeleting(reward)}
            />
          ))}
        </div>
      )}
      {nextLocked && (
        <div className="shop-next-unlock">
          <Sparkles
            size={22}
            className="shrink-0 text-gold"
            aria-hidden="true"
          />
          <p className="text-sm text-ink-dim">
            {en ? "Your next unlock: " : "הפרס הבא שייפתח: "}
            <strong className="text-ink">{tx(nextLocked.title)}</strong> ·{" "}
            {Math.max(0, nextLocked.requiredPoints - xp).toLocaleString()} XP{" "}
            {en ? "to go" : "נותרו"}
          </p>
        </div>
      )}

      <RewardFormDialog
        open={formOpen}
        reward={editing}
        busy={busy}
        onSubmit={handleFormSubmit}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        title={t("dialog.deleteRewardTitle")}
        message={t("dialog.deleteRewardBody").replace(
          "{name}",
          tx(deleting?.title ?? ""),
        )}
        confirmLabel={t("dialog.delete")}
        cancelLabel={t("cancel")}
        busy={busy}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleting(null)}
      />

      {celebration && (
        <RewardReveal celebration={celebration} onClose={dismissCelebration} />
      )}
    </ScreenShell>
  );
}
