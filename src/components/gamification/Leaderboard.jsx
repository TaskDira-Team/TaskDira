import { Trophy, Medal, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import UserAvatar from './UserAvatar';
import { getHouseholdGoalProgress } from '../../data/gamification';
import { useI18n } from '../../context/I18nContext';

const rankIcons = [Crown, Medal, Medal];
const rankStyles = [
  { row: 'bg-amber-50/60 border-amber-200/80', icon: 'bg-amber-100 text-amber-700 border-amber-200', points: 'text-amber-700' },
  { row: 'bg-slate-50 border-slate-200', icon: 'bg-slate-100 text-slate-600 border-slate-200', points: 'text-slate-700' },
  { row: 'bg-orange-50/50 border-orange-200/70', icon: 'bg-orange-100 text-orange-700 border-orange-200', points: 'text-orange-700' },
];

export default function Leaderboard({ leaderboard }) {
  const { t, p, role, lang } = useI18n();
  const monthName = new Intl.DateTimeFormat(lang === 'he' ? 'he-IL' : 'en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());
  const goal = getHouseholdGoalProgress(leaderboard);

  return (
    <section className="w-full max-w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-4 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full max-w-full">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 text-white shrink-0">
              <Trophy className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-slate-900 break-words">{t('monthlyLeaderboard')}</h2>
              <p className="text-xs text-slate-500 break-words">{monthName}</p>
            </div>
          </div>
        </div>

        <div className="mt-3 w-full max-w-full">
          <div className="flex flex-wrap justify-between gap-1 text-[11px] text-slate-500 mb-1.5">
            <span>{t('monthlyGoal')}</span>
            <span className="font-medium text-slate-700">
              {goal.totalPoints} / {goal.goal} ({goal.percent}%)
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden w-full">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${goal.percent}%` }}
              className="h-full rounded-full bg-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-2 w-full max-w-full">
        {leaderboard.map((user, index) => {
          const RankIcon = rankIcons[index] || Medal;
          const style = rankStyles[index] || {
            row: 'bg-white border-slate-200 hover:bg-slate-50',
            icon: 'bg-slate-100 text-slate-500 border-slate-200',
            points: 'text-slate-900',
          };

          return (
            <div
              key={user.id}
              className={`flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 p-3 rounded-2xl border w-full max-w-full ${style.row}`}
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border shrink-0 ${style.icon}`}>
                  <RankIcon className="h-3.5 w-3.5" />
                </div>
                <UserAvatar user={user} size="md" showGlow={false} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 text-sm break-words">
                    {user.name}
                    {user.familyRole ? (
                      <span className="font-normal text-slate-500">
                        {' '}
                        · {role(user.familyRole, user.familyRoleLabel)}
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>
              <div className="shrink-0 self-end sm:self-center text-start">
                <p className={`text-base font-bold whitespace-nowrap ${style.points}`}>
                  {p(user.points)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
