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
import { ACCENTS, LimeButton, Panel, ScreenShell, StatTile, XPRing } from '../components/ui/kit';

const DEFAULT_FAMILY_ROLE = 'roommate';

function draftFrom(user) {
  const state = user?.avatarState ?? {};
  return {
    fullName: user?.fullName || user?.name || '',
    familyRole: user?.familyRole || DEFAULT_FAMILY_ROLE,
    baseIconId: state.baseIconId || DEFAULT_AVATAR_CONFIG.baseIconId,
    ringColorId: state.ringColorId || DEFAULT_AVATAR_CONFIG.ringColorId,
    profileBadgeId: state.profileBadgeId || DEFAULT_AVATAR_CONFIG.profileBadgeId,
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

  return (
    <ScreenShell dir={dir}>
      <div className="space-y-6">
        <h1 className="text-2xl font-black">{t('profile.title')}</h1>

        {/* showcase */}
        <Panel className="overflow-hidden p-7 text-center" glow accent={accent}>
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
              {badge.label}
            </span>
          </div>
        </Panel>

        {/* customizer */}
        <Panel className="p-5">
          <h3 className="text-[15px] font-extrabold">{t('profile.customize')}</h3>

          <div className="mt-4">
            <div className="num text-[11px] font-bold tracking-wider text-ink-faint uppercase">
              {t('profile.face')}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {AVATAR_ICONS.map((icon) => (
                <button
                  key={icon.id}
                  onClick={() => set({ baseIconId: icon.id })}
                  aria-pressed={icon.id === draft.baseIconId}
                  aria-label={icon.label}
                  className={`grid h-11 w-11 place-items-center rounded-xl border text-xl transition ${
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

          <div className="mt-5">
            <div className="num text-[11px] font-bold tracking-wider text-ink-faint uppercase">
              {t('profile.ringLabel')}
            </div>
            <div className="mt-2 flex gap-3">
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

          <div className="mt-5">
            <div className="num text-[11px] font-bold tracking-wider text-ink-faint uppercase">
              {t('profile.badges')}
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {PROFILE_BADGES.map((b) => {
                const active = b.id === draft.profileBadgeId;
                return (
                  <button
                    key={b.id}
                    onClick={() => set({ profileBadgeId: b.id })}
                    aria-pressed={active}
                    className={`rounded-xl border p-2 text-center transition ${
                      active
                        ? 'border-gold/45 bg-gold/10'
                        : 'border-dashed border-white/15 opacity-55 hover:opacity-90'
                    }`}
                  >
                    <div className="text-[10px] font-bold text-ink-dim">{b.label}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </Panel>

        {/* stats */}
        <div className="grid grid-cols-2 gap-3">
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

        {/* settings */}
        <Panel className="divide-y divide-white/8 p-5">
          <h3 className="pb-4 text-[15px] font-extrabold">{t('settings')}</h3>

          <div className="flex items-center justify-between py-4">
            <span className="text-[14px] font-bold text-ink-dim">{t('profile.displayName')}</span>
            <input
              value={draft.fullName}
              onChange={(e) => set({ fullName: e.target.value })}
              className="w-40 rounded-xl border border-white/12 bg-black/30 px-3 py-1.5 text-start text-[13px] font-bold text-ink outline-none focus:border-lime/60"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 py-4">
            <span className="text-[14px] font-bold text-ink-dim">{t('onboard.role')}</span>
            <div className="flex flex-wrap gap-1.5">
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

          <div className="flex items-center justify-between py-4">
            <span className="text-[14px] font-bold text-ink-dim">{t('profile.language')}</span>
            <div className="flex overflow-hidden rounded-full border border-white/12">
              {[
                ['he', 'עברית'],
                ['en', 'English'],
              ].map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setLang(k)}
                  className={`num px-3 py-1.5 text-[12px] font-extrabold transition ${
                    lang === k ? 'bg-lime text-[#152007]' : 'text-ink-dim'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-5">
            <LimeButton className="w-full" onClick={handleSave}>
              {saving ? t('saving') : t('saveChanges')}
            </LimeButton>
          </div>
        </Panel>
      </div>
    </ScreenShell>
  );
}
