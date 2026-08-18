import { useMemo, useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { getRingAccent } from '../data/avatars';
import { TASK_STATUSES } from '../data/mockData';
import {
  ACCENTS,
  Avatar,
  Panel,
  ScreenShell,
  StatTile,
  XPBar,
} from '../components/ui/kit';

const FALLBACK_ACCENTS = ['grape', 'mint', 'sky', 'lime', 'coral', 'gold'];

// The API returns 'Admin' / 'Member'; comparing against lowercase silently
// renders every admin as a plain member and hides all their controls.
function isAdminRole(role) {
  return typeof role === 'string' && role.toLowerCase() === 'admin';
}

function accentFor(user, index) {
  const ringId = user?.avatarState?.ringColorId;
  const fallback = FALLBACK_ACCENTS[index % FALLBACK_ACCENTS.length];
  return ringId ? getRingAccent(ringId, fallback) : fallback;
}

function joinedLabel(joinedAt, lang) {
  if (!joinedAt) return '';
  const d = new Date(joinedAt);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export default function Household() {
  const { t, dir, lang, role: roleLabel } = useI18n();
  const { user } = useAuth();
  const {
    household,
    members,
    users,
    tasks,
    permissions,
    inviteMember,
    changeMemberRole,
    removeMember,
  } = useApp();

  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const isAdmin = permissions?.isAdmin === true;

  const rows = useMemo(() => {
    const source = members?.length ? members : [];
    return source
      .map((m, index) => {
        const profile = users.find((u) => u.id === m.userId) ?? m.user ?? {};
        return {
          userId: m.userId,
          name: profile.fullName || profile.name || '',
          emoji: profile.avatar?.emoji ?? '🙂',
          accent: accentFor(profile, index),
          xp: profile.points ?? 0,
          level: profile.level?.level,
          familyRole: profile.familyRole,
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

  const monthlyDone = useMemo(() => {
    const now = new Date();
    return (tasks ?? []).filter((task) => {
      if (task.status !== TASK_STATUSES.DONE) return false;
      const at = task.completedAt ? new Date(task.completedAt) : null;
      if (!at || Number.isNaN(at.getTime())) return true;
      return at.getMonth() === now.getMonth() && at.getFullYear() === now.getFullYear();
    }).length;
  }, [tasks]);

  const goal = household?.monthlyGoalPoints ?? 400;
  const goalPct = Math.min(100, Math.round((monthlyDone / (goal || 1)) * 100));

  const admins = rows.filter((r) => r.admin);
  const managedBy =
    admins.length >= 2
      ? t('household.managedBy')
          .replace('{a}', admins[0].name.split(' ')[0])
          .replace('{b}', admins[1].name.split(' ')[0])
      : admins.length === 1
        ? `${t('role.admin')} · ${admins[0].name.split(' ')[0]}`
        : '';

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
      setEditing(null);
    } catch {
      // AppContext already surfaced the Hebrew message as a toast.
    } finally {
      setBusy(false);
    }
  };

  const handleInvite = () => {
    const email = window.prompt(t('emailLabel'));
    if (!email) return;
    run(() => inviteMember(email.trim()));
  };

  const handleRemove = (row) => {
    if (!window.confirm(`${t('remove')} "${row.name}"?`)) return;
    run(() => removeMember(row.userId));
  };

  return (
    <ScreenShell dir={dir}>
      <div className="space-y-6">
        <h1 className="text-2xl font-black">{t('household.title')}</h1>

        {/* household card */}
        <Panel className="overflow-hidden p-6" glow accent="grape">
          <div className="flex items-center gap-4">
            <span
              className="anim-bob-soft grid h-16 w-16 place-items-center rounded-2xl text-3xl"
              style={{
                background: 'linear-gradient(150deg,#a06cff55,#1a1046)',
                border: '2px solid #a06cff',
                boxShadow: '0 0 30px -8px #a06cff',
              }}
            >
              🏡
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xl font-black">{household?.displayName || household?.name || ''}</div>
              {household?.address && (
                <div className="num mt-0.5 text-[12px] text-ink-dim">{household.address}</div>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <StatTile value={rows.length} label={t('household.membersStat')} accent="grape" />
            <StatTile
              value={familyXp.toLocaleString('en-US')}
              label={t('household.familyXp')}
              accent="lime"
            />
            <StatTile value={monthlyDone} label={t('household.monthTasks')} accent="sky" />
          </div>

          <div className="mt-5">
            <div className="num mb-1.5 flex justify-between text-[11px] text-ink-dim">
              <span>{t('monthlyGoal')}</span>
              <span className="font-extrabold text-lime">
                {monthlyDone} / {goal}
              </span>
            </div>
            <XPBar value={goalPct} />
          </div>
        </Panel>

        {/* members */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-extrabold">{t('household.membersTitle')}</h2>
            {managedBy && <span className="num text-[11px] text-ink-faint">{managedBy}</span>}
          </div>

          <ul className="space-y-2.5">
            {rows.map((m) => {
              const c = ACCENTS[m.accent];
              return (
                <li key={m.userId}>
                  <div className="rounded-2xl border border-white/8 bg-panel/50 p-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar emoji={m.emoji} ring={m.accent} size={46} level={m.level} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[14px] font-extrabold">{m.name}</span>
                          <span
                            className="num rounded-md px-1.5 py-px text-[10px] font-extrabold"
                            style={
                              m.admin
                                ? { background: `${ACCENTS.gold}22`, color: ACCENTS.gold }
                                : { background: '#ffffff12', color: '#b9addf' }
                            }
                          >
                            {m.admin ? `⚙︎ ${t('role.admin')}` : t('role.member')}
                          </span>
                        </div>
                        <div className="num mt-0.5 text-[11px] text-ink-faint">
                          {[m.familyRole ? roleLabel(m.familyRole) : null, joinedLabel(m.joinedAt, lang)]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/40">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(m.xp / maxXp) * 100}%`,
                              background: `linear-gradient(90deg,${c}77,${c})`,
                              boxShadow: `0 0 12px -2px ${c}`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="shrink-0 text-end">
                        <div className="num text-[14px] font-extrabold" style={{ color: c }}>
                          {m.xp.toLocaleString('en-US')}
                        </div>
                        {/* Self-demotion is a 409, so the toggle never appears on your own row. */}
                        {isAdmin && !m.isSelf && (
                          <button
                            onClick={() => setEditing(editing === m.userId ? null : m.userId)}
                            className="num mt-1 block text-[11px] font-bold text-ink-faint transition hover:text-lime"
                          >
                            {t('household.changeRole')}
                          </button>
                        )}
                        {(m.isSelf || isAdmin) && (
                          <button
                            onClick={() => handleRemove(m)}
                            disabled={busy}
                            className="num mt-1 block text-[11px] font-bold text-ink-faint transition hover:text-coral disabled:opacity-40"
                          >
                            {t('remove')}
                          </button>
                        )}
                      </div>
                    </div>

                    {editing === m.userId && (
                      <div className="mt-3 flex gap-2 border-t border-white/8 pt-3">
                        <button
                          onClick={() => run(() => changeMemberRole(m.userId, 'Admin'))}
                          disabled={busy}
                          className={`num flex-1 rounded-xl py-2 text-[12px] font-extrabold transition disabled:opacity-40 ${
                            m.admin ? 'bg-gold/20 text-gold' : 'bg-white/6 text-ink-dim hover:bg-white/12'
                          }`}
                        >
                          {t('household.roleAdmin')}
                        </button>
                        <button
                          onClick={() => run(() => changeMemberRole(m.userId, 'Member'))}
                          disabled={busy}
                          className={`num flex-1 rounded-xl py-2 text-[12px] font-extrabold transition disabled:opacity-40 ${
                            !m.admin ? 'bg-lime/20 text-lime' : 'bg-white/6 text-ink-dim hover:bg-white/12'
                          }`}
                        >
                          {t('household.roleMember')}
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {isAdmin && (
          <button
            onClick={handleInvite}
            disabled={busy}
            className="w-full rounded-2xl border-2 border-dashed border-lime/35 bg-lime/6 py-4 text-[14px] font-extrabold text-lime transition hover:bg-lime/12 disabled:opacity-40"
          >
            ＋ {t('household.invite')}
          </button>
        )}

        <Panel className="p-5">
          <h3 className="text-[14px] font-extrabold">{t('household.adminControls')}</h3>
          <ul className="mt-3 divide-y divide-white/8 text-[13px]">
            <li className="flex items-center justify-between py-3">
              <span className="font-bold text-ink-dim">{t('household.ctrl1')}</span>
              <span className="num font-extrabold text-lime">
                {household?.requireProofApproval ? t('on') : t('off')}
              </span>
            </li>
          </ul>
        </Panel>
      </div>
    </ScreenShell>
  );
}
