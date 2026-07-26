import { motion } from 'framer-motion';
import { Target, Star } from 'lucide-react';
import UserAvatar from './UserAvatar';
import { getHouseholdGoalProgress } from '../../data/gamification';
import { useI18n } from '../../context/I18nContext';

export default function RpgStatusBar({ users, currentUser }) {
  const goal = getHouseholdGoalProgress(users);
  const me = currentUser;
  const { t, p, role } = useI18n();

  return (
    <div className="w-full max-w-full space-y-3">
      {me && (
        <div className="w-full max-w-full rounded-2xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 shadow-sm">
          <UserAvatar user={me} size="lg" showGlow={false} />
          <div className="flex-1 min-w-0 w-full">
            <p className="font-semibold text-slate-900 text-sm sm:text-base break-words">{me.name}</p>
            <p className="text-sm font-bold text-indigo-600 mt-0.5">{p(me.points ?? 0)}</p>
            {me.familyRole && (
              <p className="text-xs text-slate-500 mt-0.5 break-words">
                {role(me.familyRole, me.familyRoleLabel)}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="w-full max-w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Target className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 break-words">{t('monthlyGoal')}</p>
            <p className="text-[11px] text-slate-500 break-words">
              {goal.totalPoints} / {goal.goal} {t('pointsWord')}
            </p>
          </div>
          <span className="text-sm font-bold text-indigo-600 shrink-0">{goal.percent}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden w-full">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${goal.percent}%` }}
            className="h-full rounded-full bg-indigo-500"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3 w-full max-w-full">
          {users
            .slice()
            .sort((a, b) => b.points - a.points)
            .map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 max-w-full"
              >
                <UserAvatar user={u} size="sm" showGlow={false} />
                <span className="text-[10px] font-medium text-slate-700 max-w-[72px] break-words">
                  {u.name}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-slate-600">
                  <Star className="h-3 w-3 text-amber-500" />
                  {u.points}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
