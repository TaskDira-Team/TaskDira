import { useState } from 'react';
import {
  Check,
  Camera,
  Clock,
  Star,
  Hand,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ListChecks,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES, TASK_STATUSES } from '../../data/mockData';
import SubItemsChecklist from './SubItemsChecklist';
import { useI18n } from '../../context/I18nContext';
import { getDueStatus, formatDueDateTime } from '../../utils/dateFormat';

const CATEGORY_EMOJI = {
  kitchen: '🧽',
  living: '🛋️',
  shopping: '🛒',
  cleaning: '🧹',
  cooking: '👨‍🍳',
  room: '🛏️',
  homework: '📚',
  pet: '🐶',
  maintenance: '🔧',
  trash: '🗑️',
  other: '📌',
};

function statusMeta(task, t) {
  if (task.status === TASK_STATUSES.DONE) {
    return {
      label: t('status.done'),
      className: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    };
  }
  if (task.status === TASK_STATUSES.PENDING_APPROVAL) {
    return { label: t('status.pending'), className: 'bg-amber-50 text-amber-800 border-amber-100' };
  }
  if (task.status === TASK_STATUSES.IN_PROGRESS) {
    return { label: t('status.inProgress'), className: 'bg-sky-50 text-sky-700 border-sky-100' };
  }
  return {
    label: t('status.todo'),
    className: 'bg-slate-100 text-slate-700 border-slate-200/80',
  };
}

export default function TaskListItem({
  task,
  taskPermissions,
  isAdminUser,
  onComplete,
  onCompleteDirect,
  requireProof = false,
  onClaim,
  onApprove,
  onReject,
  onEdit,
  onToggleSubItem,
}) {
  const { t, p, dir, lang, tx, category: categoryLabel } = useI18n();
  const category = CATEGORIES.find((c) => c.id === task.category || c.id === task.categoryId);
  const emoji = CATEGORY_EMOJI[category?.id] || '📌';
  const isPending = task.status === TASK_STATUSES.PENDING_APPROVAL;
  const isDone = task.status === TASK_STATUSES.DONE;
  const isOpen = task.status === TASK_STATUSES.TODO || task.status === TASK_STATUSES.IN_PROGRESS;
  const canClaim = taskPermissions?.canClaim && !task.assigneeId && isOpen;
  const canComplete =
    isOpen &&
    task.assigneeId &&
    (taskPermissions?.canSubmitProof || taskPermissions?.canMove || isAdminUser);
  // One click finishes the task. Assignment is not required: an unclaimed chore
  // can simply be done. Proof only becomes a gate once the real pipeline lands.
  const canCompleteNow = isOpen && (taskPermissions?.canMove || isAdminUser) && !requireProof;
  const status = statusMeta(task, t);
  const due = getDueStatus(task.dueAt || task.dueDate, task.status, lang);
  const dueLabel = formatDueDateTime(task.dueAt || task.dueDate, lang);
  const subItems = task.subItems || [];
  const [listOpen, setListOpen] = useState(category?.id === 'shopping' || subItems.length > 0);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      dir={dir}
      className={`task-card-rtl task-pop-in flex flex-col gap-3 w-full max-w-full p-4 rounded-2xl border border-slate-200 shadow-sm bg-white overflow-x-hidden ${
        isDone ? 'opacity-70' : ''
      } ${isPending ? 'border-amber-200 bg-amber-50/20' : ''}`}
    >
      <div className="flex flex-row items-start gap-3 w-full max-w-full">
        <div className="shrink-0">
          {isDone ? (
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Check className="h-5 w-5 text-emerald-600" />
            </div>
          ) : isPending && taskPermissions?.canApprove ? (
            <button
              type="button"
              onClick={() => onApprove(task.id)}
              className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center touch-manipulation"
              title={t('approve')}
            >
              <CheckCircle2 className="h-5 w-5" />
            </button>
          ) : canClaim ? (
            <button
              type="button"
              onClick={() => onClaim(task.id)}
              className="w-11 h-11 rounded-xl border border-dashed border-slate-300 text-slate-500 flex items-center justify-center touch-manipulation"
              title={t('claimTask')}
            >
              <Hand className="h-4 w-4" />
            </button>
          ) : canComplete && requireProof ? (
            <button
              type="button"
              onClick={() => onComplete(task)}
              className="w-11 h-11 rounded-xl border border-slate-300 bg-slate-50 text-slate-700 flex items-center justify-center touch-manipulation"
              title={t('completeTask')}
            >
              <Camera className="h-4 w-4" />
            </button>
          ) : isPending ? (
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          ) : (
            <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xl">
              <span aria-hidden>{emoji}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onEdit?.(task)}
          className="flex flex-col items-stretch gap-2 flex-1 w-full min-w-0 max-w-full text-right touch-manipulation"
        >
          <p
            className={`task-card-title text-base font-semibold text-slate-800 leading-normal break-words w-full max-w-full ${
              isDone ? 'line-through text-slate-400' : ''
            }`}
          >
            <span aria-hidden className="me-1">
              {emoji}
            </span>
            {tx(task.title)}
          </p>

          <div className="flex flex-row flex-wrap items-center gap-1.5 w-full max-w-full">
            <span
              className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${status.className}`}
            >
              {status.label}
            </span>
            {due?.label && !isDone && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${due.className}`}
              >
                {due.type === 'overdue' ? (
                  <AlertCircle className="h-3 w-3 shrink-0" />
                ) : (
                  <Clock className="h-3 w-3 shrink-0" />
                )}
                {due.label}
              </span>
            )}
            {task.dueLabel && !due?.label && !isDone && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200 whitespace-nowrap">
                <Clock className="h-3 w-3" />
                {dueLabel || tx(task.dueLabel)}
              </span>
            )}
            {category && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                <span aria-hidden>{emoji}</span>
                {categoryLabel(category.id, category.label || category.name)}
              </span>
            )}
            {subItems.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                <ListChecks className="h-3 w-3" />
                {task.subItemsProgress?.done ?? 0}/{subItems.length}
              </span>
            )}
          </div>
        </button>
      </div>

      {subItems.length > 0 && (
        <div className="w-full max-w-full pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setListOpen((v) => !v)}
            className="flex flex-row items-center gap-1 text-xs font-medium text-slate-600 mb-2 touch-manipulation"
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${listOpen ? 'rotate-180' : ''}`}
            />
            {t('subItems')}
          </button>
          <AnimatePresence initial={false}>
            {listOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <SubItemsChecklist
                  items={subItems}
                  dense
                  onToggle={(id, next) => onToggleSubItem?.(task.id, id, next)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="flex flex-row items-center gap-2 w-full max-w-full pt-2 border-t border-slate-100">
        {canCompleteNow && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => onCompleteDirect?.(task)}
            className="inline-flex flex-row items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-full shadow-sm touch-manipulation whitespace-nowrap transition-colors"
            title={t('markDone')}
            aria-label={`${t('markDone')}: ${task.title}`}
          >
            <Check className="h-3.5 w-3.5 shrink-0" />
            {t('markDone')}
          </motion.button>
        )}
        {isPending && taskPermissions?.canApprove && (
          <button
            type="button"
            onClick={() => onReject(task.id)}
            className="inline-flex flex-row items-center gap-1 text-xs font-medium text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg touch-manipulation whitespace-nowrap"
          >
            <XCircle className="h-3.5 w-3.5" />
            {t('reject')}
          </button>
        )}
        <span className="ms-auto inline-flex flex-row items-center gap-1 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap">
          <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          {p(task.points ?? task.pointsValue ?? 0)}
        </span>
      </div>
    </motion.article>
  );
}
