import GrowCrew from "../components/household/GrowCrew";
import { useMemo, useState } from "react";
import { Plus, ShieldCheck, Users } from "lucide-react";
import "../components/ui/community.css";
import "../components/household/crewPolish.css";
import { useI18n } from "../context/I18nContext";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { getRingAccent } from "../data/avatars";
import { completedThisMonth } from "../utils/monthlyStats";
import {
  ACCENTS,
  Avatar,
  ConfirmDialog,
  LimeButton,
  ScreenShell,
} from "../components/ui/kit";

const FALLBACK_ACCENTS = ["grape", "mint", "sky", "lime", "coral", "gold"];

// The API returns 'Admin' / 'Member'; comparing against lowercase silently
// renders every admin as a plain member and hides all their controls.
function isAdminRole(role) {
  return typeof role === "string" && role.toLowerCase() === "admin";
}

function accentFor(user, index) {
  const ringId = user?.avatarState?.ringColorId;
  const fallback = FALLBACK_ACCENTS[index % FALLBACK_ACCENTS.length];
  return ringId ? getRingAccent(ringId, fallback) : fallback;
}

function joinedLabel(joinedAt, lang) {
  if (!joinedAt) return "";
  const d = new Date(joinedAt);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(lang === "he" ? "he-IL" : "en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function Household() {
  const { t, dir, lang, role: roleLabel, householdName } = useI18n();
  const { user } = useAuth();
  const {
    household,
    members,
    users,
    tasks,
    monthlyXp,
    permissions,
    changeMemberRole,
    removeMember,
  } = useApp();

  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removing, setRemoving] = useState(null);

  const isAdmin = permissions?.isAdmin === true;
  const en = lang === "en";

  const rows = useMemo(() => {
    const source = members?.length ? members : [];
    return source
      .map((m, index) => {
        const profile = users.find((u) => u.id === m.userId) ?? m.user ?? {};
        return {
          userId: m.userId,
          name: profile.fullName || profile.name || "",
          emoji: profile.avatar?.emoji ?? "🙂",
          accent: accentFor(profile, index),
          xp: profile.points ?? 0,
          level: profile.level?.level,
          familyRole: profile.familyRole,
          managed: profile.isManagedProfile,
          admin: isAdminRole(m.role),
          joinedAt: m.joinedAt,
          isSelf: m.userId === user?.id,
        };
      })
      .sort((a, b) => b.xp - a.xp);
  }, [members, users, user?.id]);

  // An empty roster makes Math.max() return -Infinity, which renders a broken
  // bar; the solo household is the normal case, not an edge case.
  const maxXp = rows.reduce((acc, r) => Math.max(acc, r.xp), 0) || 1;
  const familyXp = rows.reduce((acc, r) => acc + r.xp, 0);

  const monthlyDone = completedThisMonth(tasks ?? []);

  const goal = household?.monthlyGoalPoints ?? 400;
  const goalPct = Math.min(100, Math.round((monthlyXp / (goal || 1)) * 100));

  const admins = rows.filter((r) => r.admin);
  const managedBy =
    admins.length >= 2
      ? t("household.managedBy")
          .replace("{a}", admins[0].name.split(" ")[0])
          .replace("{b}", admins[1].name.split(" ")[0])
      : admins.length === 1
        ? `${t("role.admin")} · ${admins[0].name.split(" ")[0]}`
        : "";

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
      setEditing(null);
      return true;
    } catch {
      // The provider shows the API error; keep dialogs open for a retry.
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!removing) return;
    if (await run(() => removeMember(removing.userId))) setRemoving(null);
  };

  return (
    <ScreenShell
      dir={dir}
      width="max-w-7xl"
      className="community-page crew-page"
    >
      <header className="community-heading crew-heading">
        <div>
          <h1>{householdName(household?.displayName || household?.name)}</h1>
          <div className="crew-house-line">
            <span>
              {rows.length} {en ? "people" : "אנשים"}
            </span>
            <span>
              {familyXp.toLocaleString()} {en ? "XP together" : "XP ביחד"}
            </span>
            <span>
              {monthlyDone} {en ? "missions this month" : "משימות החודש"}
            </span>
          </div>
        </div>
        {isAdmin && (
          <LimeButton onClick={() => setInviteOpen(true)} disabled={busy}>
            <span className="inline-flex items-center gap-2">
              <Plus size={18} />
              {en ? "Grow your crew" : "מגדילים את הנבחרת"}
            </span>
          </LimeButton>
        )}
      </header>
      <section>
        <h2 className="community-section-title crew-list-title flex items-center gap-2">
          <Users size={22} />
          {t("household.membersTitle")}
        </h2>
        {rows.length ? (
          <ul className="community-member-grid">
            {rows.map((m) => (
              <li
                key={m.userId}
                className="community-member"
                style={{
                  "--member-tint": `${ACCENTS[m.accent]}18`,
                  "--member-accent": ACCENTS[m.accent],
                }}
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    emoji={m.emoji}
                    ring={m.accent}
                    size={62}
                    level={m.level}
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-extrabold break-words">
                      {m.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <span
                        className="community-chip"
                        style={
                          m.admin
                            ? {
                                background: "var(--community-gold)",
                                color: "#976500",
                              }
                            : undefined
                        }
                      >
                        {m.admin ? t("role.admin") : t("role.member")}
                      </span>
                      {m.isSelf && (
                        <span className="text-xs text-ink-dim">
                          {t("leaderboard.you")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="community-note mt-4">
                  {[
                    m.familyRole ? roleLabel(m.familyRole) : null,
                    joinedLabel(m.joinedAt, lang),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="community-progress flex-1" aria-hidden="true">
                    <span
                      style={{
                        width: `${(m.xp / maxXp) * 100}%`,
                        background: ACCENTS[m.accent],
                      }}
                    />
                  </div>
                  <strong className="text-sm whitespace-nowrap">
                    {m.xp.toLocaleString()} XP
                  </strong>
                </div>
                {(isAdmin || (m.isSelf && !user?.isManagedProfile)) && (
                  <details className="crew-member-menu">
                    <summary
                      aria-label={`${en ? "Manage" : "ניהול"} ${m.name}`}
                    >
                      {en ? "Manage" : "ניהול"}
                    </summary>
                    <div className="community-member-actions">
                      {isAdmin && !m.isSelf && !m.managed && (
                        <button
                          type="button"
                          onClick={() =>
                            setEditing(editing === m.userId ? null : m.userId)
                          }
                          disabled={busy}
                          aria-expanded={editing === m.userId}
                        >
                          {t("household.changeRole")}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setRemoving(m)}
                        disabled={busy}
                        className="text-coral"
                      >
                        {m.isSelf
                          ? en
                            ? "Leave household"
                            : "עזיבת הבית"
                          : t("remove")}
                      </button>
                    </div>
                  </details>
                )}
                {editing === m.userId && (
                  <div className="mt-3 flex gap-2">
                    {["Admin", "Member"].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() =>
                          run(() => changeMemberRole(m.userId, role))
                        }
                        disabled={busy}
                        aria-pressed={role === "Admin" ? m.admin : !m.admin}
                        className="min-h-11 flex-1 rounded-xl bg-lime/10 px-3 py-2 text-sm font-bold text-lime"
                      >
                        {role === "Admin"
                          ? t("household.roleAdmin")
                          : t("household.roleMember")}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="community-empty">
            <Users size={36} />
            <h2>{en ? "Make yourself at home." : "מרגישים בבית."}</h2>
            <p>
              {en
                ? "Invite your household to start sharing the everyday tasks."
                : "הזמינו את חברי הבית כדי להתחיל לחלוק את משימות היומיום."}
            </p>
          </div>
        )}
      </section>
      <div className="crew-bottom-grid">
      <section className="community-team-goal">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold">{t("monthlyGoal")}</h2>
          <span className="text-sm font-bold text-lime">
            {monthlyXp.toLocaleString()} / {goal.toLocaleString()} XP
          </span>
        </div>
        <div
          className="community-progress"
          role="progressbar"
          aria-label={t("monthlyGoal")}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={goalPct}
        >
          <span style={{ width: `${goalPct}%` }} />
        </div>
      </section>
      <section
        className="community-house-rules crew-settings flex items-center gap-4"
        style={{ background: "var(--community-lilac)" }}
      >
        <ShieldCheck
          className="shrink-0 text-grape"
          size={30}
          aria-hidden="true"
        />
        <div className="flex-1">
          <h2 className="text-lg font-extrabold">
            {en ? "Photo checks" : "בדיקת תמונות"}
          </h2>
        </div>
        <span className="community-chip">
          {household?.requireProofApproval ? t("on") : t("off")}
        </span>
      </section>
      </div>

      <GrowCrew open={inviteOpen} onClose={() => setInviteOpen(false)} />

      <ConfirmDialog
        open={!!removing}
        title={t("dialog.removeMemberTitle")}
        message={t("dialog.removeMemberBody").replace(
          "{name}",
          removing?.name ?? "",
        )}
        confirmLabel={t("remove")}
        cancelLabel={t("cancel")}
        busy={busy}
        onConfirm={handleConfirmRemove}
        onCancel={() => setRemoving(null)}
      />
    </ScreenShell>
  );
}
