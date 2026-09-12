import { useMemo, useState } from 'react';
import { Bookmark, X } from 'lucide-react';
import useSavedChores from '../hooks/useSavedChores';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useRoute } from '../context/RouteContext';
import { TASK_STATUSES } from '../data/mockData';
import TaskModal from '../components/board/TaskModal';
import {
  ACCENTS,
  Avatar,
  LimeButton,
  Panel,
  SegmentedTabs,
  StatTile,
  XPBar,
} from '../components/ui/kit';

const CATEGORY_STYLE = {
  kitchen: { emoji: '🍽️', accent: 'gold' },
  living: { emoji: '🛋️', accent: 'sky' },
  shopping: { emoji: '🛒', accent: 'mint' },
  cleaning: { emoji: '🧹', accent: 'sky' },
  cooking: { emoji: '👨‍🍳', accent: 'gold' },
  room: { emoji: '🛏️', accent: 'grape' },
  homework: { emoji: '📚', accent: 'sky' },
  pet: { emoji: '🐕', accent: 'coral' },
  maintenance: { emoji: '🔧', accent: 'grape' },
  trash: { emoji: '🗑️', accent: 'mint' },
  other: { emoji: '📌', accent: 'lime' },
};

function styleFor(categoryId) {
  return CATEGORY_STYLE[categoryId] ?? CATEGORY_STYLE.other;
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function TaskCard({ task, done, onToggle, saved, onSave, canSave }) {
  const { t, category, lang } = useI18n();
  const { emoji, accent } = styleFor(task.categoryId);
  const c = ACCENTS[accent];
  const points = task.pointsValue ?? task.points ?? 0;

  return (
    <div
      className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border p-4 transition-all duration-300 ${done ? 'border-lime/40 bg-lime/8' : 'border-white/8 bg-panel/55 hover:border-white/20'
        }`}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 start-0 w-1"
        style={{ background: c, boxShadow: `0 0 14px ${c}` }}
      />
      <span
        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-xl"
        style={{ background: `${c}1f`, border: `1px solid ${c}44` }}
      >
        {emoji}
      </span>

      <div className="min-w-0 flex-1">
        <div className={`truncate font-extrabold ${done ? 'text-ink-faint line-through' : 'text-ink'}`}>
          {task.title}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span
            className="num rounded-md px-1.5 py-px text-[10px] font-bold"
            style={{ background: `${c}20`, color: c }}
          >
            {category(task.categoryId)}
          </span>
          <span className="num text-[11px] font-bold text-lime">+{points} XP</span>
          {task.subItemsProgress && (
            <span className="num text-[11px] font-bold text-ink-faint">
              {task.subItemsProgress.done}/{task.subItemsProgress.total}
            </span>
          )}
        </div>
      </div>

      <button disabled={!canSave} onClick={onSave} aria-pressed={saved} aria-label={`${saved ? (lang === 'he' ? 'ביטול שמירה' : 'Unsave chore') : (lang === 'he' ? 'שמירה לאחר כך' : 'Save chore')}: ${task.title}`} className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition hover:bg-white/10 ${saved ? 'text-lime' : 'text-ink-faint'}`}>
        <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
      </button>
      <button
        onClick={onToggle}
        disabled={done}
        aria-pressed={done}
        aria-label={t(done ? 'dashboard.uncheckAria' : 'dashboard.checkAria').replace('{t}', task.title)}
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 text-lg transition-transform duration-200 hover:scale-110 disabled:cursor-default disabled:hover:scale-100 ${done ? 'border-lime text-[#152007]' : 'border-white/20 text-transparent hover:border-lime/60'
          }`}
        style={done ? { background: ACCENTS.lime, boxShadow: `0 0 22px -4px ${ACCENTS.lime}` } : undefined}
      >
        ✓
      </button>
    </div>
  );
}

export default function HomeDashboard() {
  const { t, dir, lang } = useI18n();
  const he = lang === 'he';
  const { user } = useAuth();
  const { navigate } = useRoute();
  const { tasks, users, household, moveTask, permissions, createTask } = useApp();
  const saved = useSavedChores(user?.id, household?.id);
  const savedTasks = tasks.filter(task => saved.isSaved(task.id));
  const [tab, setTab] = useState('today');
  const [createOpen, setCreateOpen] = useState(false);

  const me = users.find((u) => u.id === user?.id) || user;
  const xp = me?.points ?? 0;
  const balance = me?.balance ?? xp;
  const level = me?.level;
  const rank = me?.rank;

  const { today, week, done } = useMemo(() => {
    const limit = endOfToday();
    const buckets = { today: [], week: [], done: [] };
    for (const task of tasks) {
      if (task.status === TASK_STATUSES.DONE) {
        buckets.done.push(task);
        continue;
      }
      const due = task.dueDate || task.dueAt;
      if (!due || new Date(due) <= limit) buckets.today.push(task);
      else buckets.week.push(task);
    }
    return buckets;
  }, [tasks]);

  const list = tab === 'saved' ? savedTasks : tab === 'done' ? done : tab === 'week' ? week : today;

  const tabs = [
    { key: 'today', label: t('dashboard.tab.today') },
    { key: 'week', label: t('dashboard.tab.week') },
    { key: 'done', label: t('filter.done') },
    { key: 'saved', label: he ? 'שמורות' : 'Saved' },
  ];

  const completedThisMonth = me?.tasksCompletedThisMonth ?? 0;

  return (
    <div dir={dir} className="space-y-6 py-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="num text-[12px] font-bold text-ink-faint">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <h1 className="mt-1 text-2xl font-black">
            {t('dashboard.greeting').replace('{name}', (me?.fullName || me?.name || '').split(' ')[0])}
          </h1>
        </div>
      </div>

      <Panel className="overflow-hidden p-6" glow accent="lime">
        <div className="flex items-center gap-5">
          <Avatar emoji={level?.emoji || '🦊'} ring="lime" size={82} float />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-xl font-black">{me?.fullName || me?.name}</span>
              {level && (
                <span
                  className="num rounded-lg px-2 py-0.5 text-[11px] font-extrabold text-[#152007]"
                  style={{ background: ACCENTS.lime }}
                >
                  LV {level.level}
                </span>
              )}
            </div>
            <div className="num mt-1 text-[12px] text-ink-dim">
              {rank ? (
                <>
                  {t('dashboard.rank1')}
                  <span className="font-extrabold text-gold">{rank}</span>
                  {t('dashboard.rank2')}
                  <span className="font-extrabold">{users.length}</span>
                  {t('dashboard.rank3')}
                  {household?.displayName || household?.name || ''}
                </>
              ) : (
                household?.displayName || household?.name || ''
              )}
            </div>
            <div className="mt-3">
              <XPBar
                value={level?.progressToNext ?? 0}
                label={`${xp} XP${level?.next ? ` · ${level.next.minPoints - xp} → LV ${level.next.level}` : ''}`}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <StatTile emoji="🪙" value={balance} label={t('dashboard.coins')} accent="gold" />
          <StatTile emoji="🔥" value={me?.streakDays ?? 0} label={t('dashboard.streak')} accent="coral" />
          <StatTile emoji="✅" value={completedThisMonth} label={t('filter.done')} accent="grape" />
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/rewards')}
          className="rounded-2xl border p-4 text-start transition hover:-translate-y-0.5"
          style={{ borderColor: `${ACCENTS.sky}38`, background: `${ACCENTS.sky}12` }}
        >
          <div className="text-xl">🎁</div>
          <div className="mt-2 text-[14px] font-extrabold">{t('rewardsStore')}</div>
          <div className="num text-[11px] text-ink-faint">{balance} {t('pointsShort')}</div>
        </button>
        <button
          onClick={() => navigate('/leaderboard')}
          className="rounded-2xl border p-4 text-start transition hover:-translate-y-0.5"
          style={{ borderColor: `${ACCENTS.grape}38`, background: `${ACCENTS.grape}12` }}
        >
          <div className="text-xl">🏆</div>
          <div className="mt-2 text-[14px] font-extrabold">{t('nav.leaderboard')}</div>
          <div className="num text-[11px] text-ink-faint">{xp} XP</div>
        </button>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_250px]">
        <div className="min-w-0">
          <SegmentedTabs items={tabs} value={tab} onChange={setTab} />

          <div className="mt-4 space-y-2.5">
            {list.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                saved={saved.isSaved(task.id)}
                onSave={() => saved.toggle(task.id)}
                canSave={saved.ready}
                done={task.status === TASK_STATUSES.DONE}
                onToggle={() => moveTask(task.id, TASK_STATUSES.DONE)}
              />
            ))}
            {list.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/15 py-10 text-center text-sm text-ink-faint">
                {tab === 'saved' ? (he ? 'לחצו על סימניית המשימה כדי לשמור אותה כאן.' : 'Bookmark a chore to keep it here.') : tab === 'done' ? t('emptyTasks') : t('dashboard.empty')}
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-2xl border border-white/10 bg-panel/60 p-5" aria-label={he ? 'משימות שמורות' : 'Saved chores'}>
          <div className="flex items-center gap-2 text-lime">
            <Bookmark size={18} />
            <h2 className="flex-1 text-sm font-extrabold">{he ? 'שמרתי לאחר כך' : 'Saved for later'}</h2>
            <span className="num text-xs">{savedTasks.length}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ink-faint">{he ? 'הרשימה האישית שלכם, בדפדפן הזה.' : 'Your personal shortlist, in this browser.'}</p>
          <div className="mt-4 space-y-2">{savedTasks.map(task => <div key={task.id} className="flex items-center gap-2 rounded-xl bg-white/5 p-2">
            <span>{styleFor(task.categoryId).emoji}</span>
            <button className="min-w-0 flex-1 text-start text-xs font-bold" onClick={() => setTab('saved')}>
              <span className={`block truncate ${task.status === TASK_STATUSES.DONE ? 'line-through opacity-50' : ''}`}>{task.title}</span>
              <small className="text-ink-faint">+{task.pointsValue ?? task.points ?? 0} XP</small>
            </button>
            <button className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-faint hover:bg-white/10" onClick={() => saved.toggle(task.id)} aria-label={`${he ? 'ביטול שמירה' : 'Unsave chore'}: ${task.title}`}>
              <X size={14} />
            </button>
          </div>)}</div>
          {!savedTasks.length && <div className="mt-4 rounded-xl border border-dashed border-white/15 px-3 py-6 text-center text-xs leading-relaxed text-ink-faint">{he ? 'משהו שתרצו לעשות אחר כך? שמרו אותו בלחיצה על הסימנייה.' : 'Something for later? Tap its bookmark and find it right here.'}</div>}
        </aside>
      </div>

      {permissions?.canCreateTask !== false && (
        <div className="flex justify-center pb-2">
          <LimeButton onClick={() => setCreateOpen(true)}>{t('dashboard.addQuest')}</LimeButton>
        </div>
      )}

      {createOpen && (
        <TaskModal
          task={null}
          variant="dark"
          users={users}
          permissions={permissions}
          currentUserId={user?.id}
          onSave={async (data) => {
            await createTask(data);
            setCreateOpen(false);
          }}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </div>
  );
}
