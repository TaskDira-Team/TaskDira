import RewardTickets from "../components/rewards/RewardTickets";
import PrizeArt, { TOY_EMOJI } from "../components/rewards/PrizeArt";
import { useState } from "react";
import {
  Check,
  Coins,
  Gift,
  LockKeyhole,
  Pencil,
  Plus,
  Star,
  Trash2,
  Search,
  MoreHorizontal,
} from "lucide-react";
import { useI18n } from "../context/I18nContext";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { ConfirmDialog, ScreenShell } from "../components/ui/kit";
import RewardFormDialog from "../components/rewards/RewardFormDialog";
import RewardReveal from "../components/rewards/RewardReveal";
import useVisibleMotion from "../hooks/useVisibleMotion";

import "../components/rewards/floatingShop.css";
import "../components/ui/community.css";
import "../components/rewards/treasureShop.css";

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
  claimedBy,
}) {
  const { t, lang, tx } = useI18n();
  const en = lang === "en";
  const { ref, running } = useVisibleMotion();
  const xpGap = Math.max(0, reward.requiredPoints - xp);
  const shortBy = Math.max(0, reward.cost - balance);
  // Use the live balance; reward.affordable is computed when rewards load and
  // goes stale as soon as coins are earned or spent.
  const affordable = reward.unlocked && shortBy === 0;
  return (
    <article
      ref={ref}
      data-motion-running={running}
      className={`community-reward treasure-ticket ${reward.claimed ? "is-claimed" : !reward.unlocked ? "is-locked" : ""}`}
      style={{
        "--reward-fill":
          ["#ffe7bf", "#e8ddfa", "#d8eedc", "#dceef7"][
            TOY_EMOJI.indexOf(reward.emoji) % 4
          ] || "#e5edf4",
        "--float-delay": `${index * -0.85}s`,
      }}
    >
      <div className="community-reward-art">
        <PrizeArt reward={reward} />
        {!reward.claimed && !reward.unlocked && (
          <div
            className="treasure-status"
            title={`${xpGap.toLocaleString()} XP ${en ? "to go" : "לפתיחה"}`}
          >
            <LockKeyhole size={15} aria-hidden="true" />
            <span className="reward-lock-word">
              {en ? "Unlocks at " : "נפתח ב-"}
            </span>
            {reward.requiredPoints} XP
          </div>
        )}
      </div>
      <div className="community-reward-body">
        <h2>{tx(reward.title)}</h2>
        <p>{tx(reward.description)}</p>
        <div className="community-price">
          <Coins size={16} aria-hidden="true" />
          {reward.cost.toLocaleString()}
          <span className="reward-price-word"> {en ? "coins" : "מטבעות"}</span>
        </div>
        {reward.claimed ? (
          <div className="community-chip justify-center py-3">
            <Check size={18} aria-hidden="true" />
            {claimedBy
              ? `${en ? "Claimed by" : "מומש על ידי"} ${claimedBy}`
              : t("rewards.claimedNote")}
          </div>
        ) : (
          <button
            type="button"
            disabled={!affordable || claiming}
            onClick={onClaim}
            className="community-reward-action"
          >
            <span className="reward-label-full">
              {claiming
                ? en
                  ? "Redeeming…"
                  : "מממשים…"
                : !reward.unlocked
                  ? en
                    ? "Not unlocked yet"
                    : "ממשיכים לצבור XP"
                  : affordable
                    ? `${en ? "Get for" : "מימוש תמורת"} ${reward.cost} ${en ? "coins" : "מטבעות"}`
                    : en
                      ? `${shortBy.toLocaleString()} more coins`
                      : `עוד ${shortBy.toLocaleString()} מטבעות`}
            </span>
            <span className="reward-label-short" aria-hidden="true">
              {claiming
                ? "…"
                : !reward.unlocked
                  ? en
                    ? "Locked"
                    : "נעול"
                  : affordable
                    ? en
                      ? "Get it"
                      : "מימוש"
                    : en
                      ? `${shortBy.toLocaleString()} more`
                      : `עוד ${shortBy.toLocaleString()}`}
            </span>
          </button>
        )}
        {isAdmin && (
          <details className="reward-admin-tools">
            <summary
              aria-label={`${en ? "Manage" : "ניהול"} ${tx(reward.title)}`}
            >
              <MoreHorizontal size={20} />
            </summary>
            <div>
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
          </details>
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
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

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

  const canAfford = (reward) => balance >= reward.cost;
  const matches = (reward, value) =>
    value === "all" ||
    (value === "ready"
      ? !reward.claimed && reward.unlocked && canAfford(reward)
      : value === "saving"
        ? !reward.claimed && (!reward.unlocked || !canAfford(reward))
        : reward.claimed);
  const visible = rewards.filter(
    (r) =>
      matches(r, filter) &&
      `${tx(r.title)} ${tx(r.description)}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const filters = [
    ["all", "Everything", "הכל"],
    ["ready", "I can get these", "אפשר לממש"],
    ["saving", "Saving up", "חוסכים בשבילם"],
    ["claimed", "Claimed", "מומשו"],
  ];

  return (
    <ScreenShell
      dir={dir}
      width="max-w-7xl"
      className="community-page treasure-shop"
    >
      <header className="shop-front">
        <div className="shop-front-copy">
          <h1>
            {en ? "Little shop. Big smiles." : "חנות קטנה. חיוכים גדולים."}
          </h1>
          <div
            className="shop-purse"
            aria-label={en ? "Your wallet" : "הארנק שלכם"}
          >
            <span className="shop-wallet-coin" aria-hidden="true">
              <Star size={27} fill="currentColor" />
            </span>
            <div>
              <strong>{balance.toLocaleString()}</strong>
              <small>{en ? "coins to spend" : "מטבעות למימוש"}</small>
            </div>
          </div>
        </div>
        <div className="shop-window" aria-hidden="true">
          {rewards.slice(0, 3).map((reward, index) => (
            <div key={reward.id} className={`shop-window-toy toy-${index}`}>
              <PrizeArt reward={reward} />
            </div>
          ))}
          <span className="shop-window-shelf" />
        </div>
      </header>
      <div className="shop-shelf-heading">
        <div>
          <h2>
            {en ? "Pick your next happy moment" : "בוחרים את הרגע המשמח הבא"}
          </h2>
        </div>
        {isAdmin && (
          <button className="shop-add" onClick={handleCreate}>
            <Plus size={17} />
            {t("addReward")}
          </button>
        )}
      </div>
      <div className="shop-toolbar">
        <div
          className="shop-tabs"
          role="group"
          aria-label={en ? "Browse treasures" : "סינון אוצרות"}
        >
          {filters.map(([id, english, hebrew]) => (
            <button
              key={id}
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
            >
              {en ? english : hebrew}
              {" · "}
              {rewards.filter((r) => matches(r, id)).length}
            </button>
          ))}
        </div>
        <label className="shop-search">
          <Search size={18} />
          <input
            type="search"
            aria-label={en ? "Search treasures" : "חיפוש אוצרות"}
            placeholder={en ? "Find a treasure…" : "מחפשים אוצר…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
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
          {visible.map((reward, index) => (
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
              claimedBy={
                users.find((u) => u.id === reward.claimedByUserId)?.fullName
              }
            />
          ))}
        </div>
      )}
      {rewards.length > 0 && visible.length === 0 && (
        <div className="shop-empty">
          <Gift size={36} />
          <h2>{en ? "No treasures in this view" : "אין אוצרות בתצוגה הזאת"}</h2>
          <p>
            {en
              ? "Try another filter or a different search."
              : "נסו סינון אחר או חיפוש שונה."}
          </p>
          <button
            className="world-button secondary"
            onClick={() => {
              setSearch("");
              setFilter("all");
            }}
          >
            {en ? "Show everything" : "מציגים הכל"}
          </button>
        </div>
      )}

      <RewardTickets />

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
