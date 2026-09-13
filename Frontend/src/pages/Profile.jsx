import { useEffect, useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  AVATAR_ICONS,
  DEFAULT_AVATAR_CONFIG,
  PROFILE_BADGES,
  RING_COLORS,
  getAvatarIcon,
  getProfileBadge,
  getRingAccent,
} from '../data/avatars';
import { AVATAR_TYPES } from '../data/stickers';
import { FAMILY_ROLES } from '../data/gamification';
import {
  ACCENTS,
  LimeButton,
  Panel,
  ScreenShell,
  SegmentedTabs,
  StatTile,
  XPRing,
  fieldClass,
} from '../components/ui/kit';

const DEFAULT_FAMILY_ROLE = 'roommate';

/** One scale for the whole screen, so section rhythm stops being ad hoc. */
const MICRO_LABEL = 'num text-[11px] font-bold tracking-wider text-ink-faint uppercase';
const SETTING_LABEL = 'text-[14px] font-bold text-ink-dim';
/** Separates picker groups the way the settings panel's divide-y separates rows. */
const GROUP_DIVIDER = 'mt-6 border-t border-white/8 pt-6';

function draftFrom(user) {
  const state = user?.avatarState ?? {};
  return {
    fullName: user?.fullName || user?.name || '',
    familyRole: user?.familyRole || DEFAULT_FAMILY_ROLE,
    baseIconId: state.baseIconId || DEFAULT_AVATAR_CONFIG.baseIconId,
    ringColorId: state.ringColorId || DEFAULT_AVATAR_CONFIG.ringColorId,
    profileBadgeId: getProfileBadge(state.profileBadgeId || state.profileBadgeKey || state.profileBadgeLabel).id,
  };
}

export default function Profile() {
  const { t, dir, lang, setLang } = useI18n();
  const { user } = useAuth();
  const { users, updateProfile } = useApp();

  const me = users.find((u) => u.id === user?.id) || user;

  const [draft, setDraft] = useState(() => draftFrom(me));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('customize');

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
    } finally {
      setSaving(false);
    }
  };

  // NOTE (shared, not fixed here): ScreenShell renders its own bg-void + Aurora
  // and horizontal padding on top of AppShell's, so every screen paints the
  // aurora twice and pads twice. Fixing that means changing ScreenShell for all
  // five screens — deliberately out of scope for this Profile-only pass.
  return (
    <ScreenShell dir={dir} width="max-w-5xl">
      <h1 className="mb-8 text-2xl font-black">{t('profile.title')}</h1>

      {/* Identity and the scoreboard stay visible at all times — they are what
          the screen is for. Only the two editing surfaces take turns below. */}
      <div className="space-y-6 lg:space-y-8">
        {/* hero — also the live preview for the customizer below */}
        <Panel className="overflow-hidden p-8 text-center" glow accent={accent}>
          <div className="flex justify-center">
            <XPRing value={progress} accent={accent} size={188}>
              <div className="anim-bob">
                <div
                  className="grid h-32 w-32 place-items-center rounded-full text-6xl"
                  style={{
                    background: `radial-gradient(circle at 30% 25%, ${ACCENTS[accent]}44, #1a1046 70%)`,
                    border: `2px solid ${ACCENTS[accent]}`,
                    boxShadow: `0 0 40px -8px ${ACCENTS[accent]}`,
                  }}
                >
                  {faceEmoji}
                </div>
              </div>
              {level && (
                <span
                  className="num absolute -bottom-1 rounded-full px-3 py-1 text-[12px] font-black text-[#152007]"
                  style={{ background: ACCENTS.lime, boxShadow: '0 0 22px -4px #b8f06a' }}
                >
                  {t('profile.level').replace('{n}', level.level)}
                </span>
              )}
            </XPRing>
          </div>

          <h2 className="mt-6 text-xl font-black">{me?.fullName || me?.name}</h2>
          <div className="num mt-1 text-[12px] text-ink-dim">
            {nextAt ? (
              <>
                {xp.toLocaleString('en-US')} / {nextAt.toLocaleString('en-US')} XP ·{' '}
                <span className="text-gold">{progress}%</span> {t('profile.toNext')}
              </>
            ) : (
              <>{xp.toLocaleString('en-US')} XP</>
            )}
          </div>

          <div className="mt-5 flex justify-center gap-2">
            <span className="anim-pop flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/12 px-3 py-1 text-[11px] font-bold text-gold">
              {t(badge.labelKey)}
            </span>
          </div>
        </Panel>

        {/* stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            emoji="✅"
            value={me?.tasksCompletedThisMonth ?? 0}
            label={t('profile.stat1')}
            accent="lime"
            className="p-4"
          />
          <StatTile
            emoji="🪙"
            value={(me?.balance ?? 0).toLocaleString('en-US')}
            label={t('profile.stat2')}
            accent="gold"
            className="p-4"
          />
          <StatTile
            emoji="🔥"
            value={me?.streakDays ?? 0}
            label={t('profile.stat3')}
            accent="coral"
            className="p-4"
          />
          {me?.rank !== undefined && me?.rank !== null && (
            <StatTile
              emoji="🏆"
              value={`#${me.rank}`}
              label={t('profile.stat4')}
              accent="grape"
              className="p-4"
            />
          )}
        </div>

        {/* The tab names the section, so the panels below carry no redundant heading. */}
        <div className="mx-auto w-full max-w-xs">
          <SegmentedTabs
            items={[
              { key: 'customize', label: t('profile.customize') },
              { key: 'settings', label: t('settings') },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>

        {tab === 'customize' ? (
          <Panel className="p-6">
            <div>
              <div className={MICRO_LABEL}>{t('profile.face')}</div>
              {/* 16 icons divide evenly by 4, 8 and 16, so no breakpoint leaves a
                  ragged final row. */}
              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8 lg:grid-cols-16">
                {AVATAR_ICONS.map((icon) => (
                  <button
                    key={icon.id}
                    onClick={() => set({ baseIconId: icon.id })}
                    aria-pressed={icon.id === draft.baseIconId}
                    aria-label={icon.label}
                    className={`grid aspect-square w-full place-items-center rounded-xl border text-xl transition ${
                      icon.id === draft.baseIconId
                        ? 'border-lime bg-lime/15'
                        : 'border-white/10 bg-panel/50 hover:border-white/25'
                    }`}
                  >
                    {icon.emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className={GROUP_DIVIDER}>
              <div className={MICRO_LABEL}>{t('profile.ringLabel')}</div>
              <div className="mt-3 flex flex-wrap gap-3">
                {RING_COLORS.map((r) => {
                  const a = getRingAccent(r.id);
                  const active = r.id === draft.ringColorId;
                  return (
                    <button
                      key={r.id}
                      onClick={() => set({ ringColorId: r.id })}
                      aria-label={t('profile.ringAria').replace('{n}', r.labelHe || r.label)}
                      aria-pressed={active}
                      className="relative h-10 w-10 rounded-full transition hover:scale-110"
                      style={{
                        border: `3px solid ${ACCENTS[a]}`,
                        background: `${ACCENTS[a]}22`,
                        boxShadow: active ? `0 0 0 2px #fff4, 0 0 20px -2px ${ACCENTS[a]}` : 'none',
                      }}
                    >
                      {active && (
                        <span className="absolute inset-0 grid place-items-center text-[12px] font-black text-white">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={GROUP_DIVIDER}>
              <div className={MICRO_LABEL}>{t('profile.badges')}</div>
              {/* Fixed min-height keeps rows even when the longer labels wrap. */}
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
                {PROFILE_BADGES.map((b) => {
                  const active = b.id === draft.profileBadgeId;
                  return (
                    <button
                      key={b.id}
                      onClick={() => set({ profileBadgeId: b.id })}
                      aria-pressed={active}
                      className={`grid min-h-[56px] place-items-center rounded-xl border p-2 text-center transition ${
                        active
                          ? 'border-gold/45 bg-gold/10'
                          : 'border-dashed border-white/15 opacity-55 hover:opacity-90'
                      }`}
                    >
                      <div className="text-[11px] leading-snug font-bold text-ink-dim">
                        {t(b.labelKey)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </Panel>
        ) : (
          /* Every field stacked (label above, control below), with control width
             capped so a single input doesn't stretch the full panel. */
          <Panel className="divide-y divide-white/8 p-6">
            <div className="pb-4">
              <span className={SETTING_LABEL}>{t('profile.displayName')}</span>
              <input
                value={draft.fullName}
                onChange={(e) => set({ fullName: e.target.value })}
                className={`${fieldClass} mt-3 max-w-md`}
              />
            </div>

            <div className="py-4">
              <span className={SETTING_LABEL}>{t('onboard.role')}</span>
              <div className="mt-3 flex flex-wrap gap-2">
                {FAMILY_ROLES.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => set({ familyRole: role.id })}
                    className={`num rounded-full border px-3 py-1.5 text-[12px] font-extrabold transition ${
                      draft.familyRole === role.id
                        ? 'border-lime bg-lime text-[#152007]'
                        : 'border-white/12 text-ink-dim hover:border-white/25 hover:text-ink'
                    }`}
                  >
                    {t(`role.${role.id}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <span className={SETTING_LABEL}>{t('profile.language')}</span>
              <div className="mt-3 max-w-xs">
                <SegmentedTabs
                  items={[
                    { key: 'he', label: 'עברית' },
                    { key: 'en', label: 'English' },
                  ]}
                  value={lang}
                  onChange={setLang}
                />
              </div>
            </div>
          </Panel>
        )}

        {/* One save for the whole draft, shown only when there is something to
            save. Previously this sat inside the settings panel while also
            committing avatar edits made on the other section. */}
        {dirty && (
          <div className="rounded-2xl border border-lime/25 bg-lime/8 p-4">
            <LimeButton className="w-full" onClick={handleSave}>
              {saving ? t('saving') : t('saveChanges')}
            </LimeButton>
          </div>
        )}
      </div>
    </ScreenShell>
  );
}
