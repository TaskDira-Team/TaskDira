import { useEffect, useState } from "react";
import {
  Check,
  CheckCheck,
  Coins,
  Flame,
  Palette,
  Settings2,
  Trophy,
} from "lucide-react";
import "../components/ui/community.css";
import { deriveMilestoneProgress } from "../utils/milestoneProgress";
import { useI18n } from "../context/I18nContext";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import {
  AVATAR_ICONS,
  DEFAULT_AVATAR_CONFIG,
  PROFILE_BADGES,
  RING_COLORS,
  getAvatarIcon,
  getProfileBadge,
  getRingAccent,
} from "../data/avatars";
import { AVATAR_TYPES } from "../data/stickers";
import { FAMILY_ROLES } from "../data/gamification";
import {
  ACCENTS,
  LimeButton,
  ScreenShell,
  SegmentedTabs,
  XPRing,
  fieldClass,
} from "../components/ui/kit";

const DEFAULT_FAMILY_ROLE = "roommate";

/** One scale for the whole screen, so section rhythm stops being ad hoc. */
const MICRO_LABEL = "text-[15px] font-extrabold text-ink";
const SETTING_LABEL = "text-[14px] font-bold text-ink-dim";

function draftFrom(user) {
  const state = user?.avatarState ?? {};
  return {
    fullName: user?.fullName || user?.name || "",
    familyRole: user?.familyRole || DEFAULT_FAMILY_ROLE,
    baseIconId: state.baseIconId || DEFAULT_AVATAR_CONFIG.baseIconId,
    ringColorId: state.ringColorId || DEFAULT_AVATAR_CONFIG.ringColorId,
    profileBadgeId: getProfileBadge(
      state.profileBadgeId || state.profileBadgeKey || state.profileBadgeLabel,
    ).id,
  };
}

export default function Profile() {
  const { t, dir, lang, setLang } = useI18n();
  const { user } = useAuth();
  const { users, tasks, updateProfile } = useApp();

  const en = lang === "en";
  const me = users.find((u) => u.id === user?.id) || user;

  const [draft, setDraft] = useState(() => draftFrom(me));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("customize");

  // Re-seed when the stored profile changes underneath an untouched form, so a
  // refresh or a save elsewhere is reflected rather than overwritten.
  useEffect(() => {
    if (!dirty) setDraft(draftFrom(me));
  }, [me?.id, me?.fullName, me?.familyRole, me?.avatarState, dirty]);

  const set = (patch) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  };

  const accent = getRingAccent(draft.ringColorId);
  const faceEmoji = getAvatarIcon(draft.baseIconId).emoji;
  const badge = getProfileBadge(draft.profileBadgeId);

  const level = me?.level;
  const xp = me?.points ?? 0;
  const nextAt = level?.next?.minPoints ?? null;
  const progress = level?.progressToNext ?? 0;

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await updateProfile({
        fullName: draft.fullName.trim() || me?.fullName,
        familyRole: draft.familyRole,
        avatarState: {
          ...(me?.avatarState ?? DEFAULT_AVATAR_CONFIG),
          avatarType: AVATAR_TYPES.EMOJI,
          baseIconId: draft.baseIconId,
          ringColorId: draft.ringColorId,
          profileBadgeId: draft.profileBadgeId,
        },
      });
      setDirty(false);
    } catch {
      // AppContext surfaces the error; retain the draft for retry.
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenShell dir={dir} width="max-w-7xl" className="community-page">
      <header className="community-heading">
        <div>
          <h1>{en ? "Make your hero YOU!" : "הגיבור שלכם, הסגנון שלכם!"}</h1>
          <p>
            {en
              ? "Your personality belongs here. Make your corner of the household feel like home."
              : "יש כאן מקום לאישיות שלכם. הפכו את הפינה שלכם בבית למקום משלכם."}
          </p>
        </div>
      </header>
      <div className="community-profile-grid">
        <aside>
          <section className="community-profile-identity">
            <div className="flex justify-center">
              <XPRing value={progress} accent={accent} size={196}>
                <div
                  className="grid h-36 w-36 place-items-center rounded-full text-7xl"
                  style={{
                    background: "#ffffffb0",
                    border: `2px solid ${ACCENTS[accent]}`,
                  }}
                >
                  {faceEmoji}
                </div>
              </XPRing>
            </div>
            <h2>{draft.fullName || me?.fullName || me?.name}</h2>
            {level && (
              <div className="community-chip mt-3">
                {t("profile.level").replace("{n}", level.level)}
              </div>
            )}
            <div className="mt-4 text-sm font-bold">
              {xp.toLocaleString()} XP
              {nextAt ? ` / ${nextAt.toLocaleString()} XP` : ""}
            </div>
            {nextAt && (
              <p className="mt-1 text-xs text-ink-dim">
                {progress}% {t("profile.toNext")}
              </p>
            )}
            <div className="mt-5 text-sm font-bold text-grape">
              {t(badge.labelKey)}
            </div>
          </section>
          <dl className="mt-6 space-y-4 px-2">
            {[
              {
                Icon: CheckCheck,
                label: t("profile.stat1"),
                value: me?.tasksCompletedThisMonth ?? 0,
              },
              {
                Icon: Coins,
                label: t("profile.stat2"),
                value: (me?.balance ?? 0).toLocaleString(),
              },
              {
                Icon: Flame,
                label: t("profile.stat3"),
                value: deriveMilestoneProgress(tasks, me).streak,
              },
              ...(me?.rank != null
                ? [
                    {
                      Icon: Trophy,
                      label: t("profile.stat4"),
                      value: `#${me.rank}`,
                    },
                  ]
                : []),
            ].map(({ Icon, label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3 border-b border-ink/10 pb-4"
              >
                <dt className="flex items-center gap-2 text-sm text-ink-dim">
                  <Icon size={17} aria-hidden="true" />
                  {label}
                </dt>
                <dd className="text-lg font-extrabold">{value}</dd>
              </div>
            ))}
          </dl>
        </aside>
        <div className="community-profile-editor">
          <div
            className="community-filters mt-0"
            aria-label={en ? "Profile sections" : "חלקי הפרופיל"}
          >
            <button
              type="button"
              aria-pressed={tab === "customize"}
              onClick={() => setTab("customize")}
            >
              <span className="flex items-center gap-2">
                <Palette size={17} />
                {t("profile.customize")}
              </span>
            </button>
            <button
              type="button"
              aria-pressed={tab === "settings"}
              onClick={() => setTab("settings")}
            >
              <span className="flex items-center gap-2">
                <Settings2 size={17} />
                {t("settings")}
              </span>
            </button>
          </div>
          {tab === "customize" ? (
            <section>
              <div className="community-setting pt-0">
                <h2 className={MICRO_LABEL}>{t("profile.face")}</h2>
                <p className="community-note mt-1">
                  {en
                    ? "Pick a familiar face for your household adventures."
                    : "בחרו פנים מוכרות להרפתקאות שלכם בבית."}
                </p>
                <div className="community-avatar-options">
                  {AVATAR_ICONS.map((icon) => (
                    <button
                      type="button"
                      key={icon.id}
                      onClick={() => set({ baseIconId: icon.id })}
                      aria-pressed={icon.id === draft.baseIconId}
                      aria-label={t(icon.labelKey)}
                    >
                      {icon.emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className="community-setting">
                <h2 className={MICRO_LABEL}>{t("profile.ringLabel")}</h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  {RING_COLORS.map((r) => {
                    const a = getRingAccent(r.id);
                    const active = r.id === draft.ringColorId;
                    return (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => set({ ringColorId: r.id })}
                        aria-label={t("profile.ringAria").replace(
                          "{n}",
                          t(r.labelKey),
                        )}
                        aria-pressed={active}
                        className="grid h-12 w-12 place-items-center rounded-full"
                        style={{
                          border: `3px solid ${ACCENTS[a]}`,
                          background: active ? ACCENTS[a] : `${ACCENTS[a]}18`,
                          outline: active ? "2px solid #173e3b" : "none",
                          outlineOffset: 3,
                        }}
                      >
                        {active && <Check size={20} color="white" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="community-setting">
                <h2 className={MICRO_LABEL}>{t("profile.badges")}</h2>
                <p className="community-note mt-1">
                  {en
                    ? "Choose a profile title that feels like you."
                    : "בחרו כותרת פרופיל שמתאימה לכם."}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {PROFILE_BADGES.map((b) => {
                    const active = b.id === draft.profileBadgeId;
                    return (
                      <button
                        type="button"
                        key={b.id}
                        onClick={() => set({ profileBadgeId: b.id })}
                        aria-pressed={active}
                        className={`min-h-12 rounded-xl border p-3 text-sm font-bold transition ${active ? "border-grape bg-grape/10 text-grape" : "border-ink/15 bg-white text-ink-dim hover:border-grape/50"}`}
                      >
                        {t(b.labelKey)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          ) : (
            <section>
              <div className="community-setting pt-0">
                <label htmlFor="profile-name" className={SETTING_LABEL}>
                  {t("profile.displayName")}
                </label>
                <input
                  id="profile-name"
                  autoComplete="name"
                  value={draft.fullName}
                  onChange={(e) => set({ fullName: e.target.value })}
                  className={`${fieldClass} mt-3`}
                />
              </div>
              <div className="community-setting">
                <h2 className={SETTING_LABEL}>{t("onboard.role")}</h2>
                <div className="community-filters mb-0 mt-3">
                  {FAMILY_ROLES.map((role) => (
                    <button
                      type="button"
                      key={role.id}
                      onClick={() => set({ familyRole: role.id })}
                      aria-pressed={draft.familyRole === role.id}
                    >
                      {t(`role.${role.id}`)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="community-setting">
                <h2 className={SETTING_LABEL}>{t("profile.language")}</h2>
                <div className="mt-3 max-w-sm">
                  <SegmentedTabs
                    items={[
                      { key: "he", label: "עברית" },
                      { key: "en", label: "English" },
                    ]}
                    value={lang}
                    onChange={setLang}
                  />
                </div>
              </div>
            </section>
          )}
          {dirty && (
            <div className="community-save">
              <p className="text-sm font-bold">
                {en
                  ? "Looking good. Save your new look?"
                  : "נראה טוב. שומרים את המראה החדש?"}
              </p>
              <LimeButton onClick={handleSave} disabled={saving}>
                {saving ? t("saving") : t("saveChanges")}
              </LimeButton>
            </div>
          )}
        </div>
      </div>
    </ScreenShell>
  );
}
