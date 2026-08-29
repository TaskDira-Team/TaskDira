import { useState } from 'react';
import { X, Calendar, Clock, Shield, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { CATEGORIES, TASK_STATUSES } from '../../data/mockData';
import { toDatetimeLocalValue, fromDatetimeLocalValue } from '../../utils/dateFormat';
import { modalVariants, overlayVariants } from '../../utils/motion';
import { darkControlStyle, darkOptionStyle, fieldClass } from '../ui/kit';
import CategoryPickerModal from '../tasks/CategoryPickerModal';
import SubItemsChecklist from '../tasks/SubItemsChecklist';
import { useI18n } from '../../context/I18nContext';

const emptyForm = {
  title: '',
  description: '',
  category: 'kitchen',
  points: 10,
  assigneeId: '',
  status: TASK_STATUSES.TODO,
  dueAt: '',
  subItems: [],
};

const LIGHT_INPUT =
  'w-full min-w-0 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

/**
 * Both themes live here rather than in a forked component so the form logic
 * stays single-sourced. The light branch reproduces the original classes
 * exactly — the legacy Dashboard renders identically to before.
 */
const THEMES = {
  light: {
    overlay: 'absolute inset-0 bg-black/50 backdrop-blur-sm',
    panel:
      'relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-full sm:max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden',
    panelStyle: undefined,
    header:
      'flex items-center justify-between px-4 py-4 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-3xl',
    title: 'text-lg font-bold text-slate-900',
    badge: 'text-xs text-slate-500 flex items-center gap-1 mt-0.5',
    close: 'p-2 rounded-lg hover:bg-slate-100',
    label: 'block text-sm font-medium text-slate-700 mb-1.5',
    input: LIGHT_INPUT,
    textarea: `${LIGHT_INPUT} resize-none`,
    number: `${LIGHT_INPUT} disabled:bg-slate-50`,
    select: `w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500`,
    catButton:
      'w-full flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-3 hover:bg-slate-50 touch-manipulation',
    catFallback: 'bg-slate-100',
    catText: 'flex-1 text-start text-sm font-semibold text-slate-800',
    chevron: 'h-4 w-4 text-slate-400',
    calendarIcon: 'h-4 w-4 text-indigo-500',
    dueHint: 'text-xs text-sky-600 mt-1 flex items-center gap-1',
    groceryBox: 'rounded-xl border border-emerald-100 bg-emerald-50/40 p-3',
    groceryTitle: 'text-sm font-semibold text-slate-800 mb-2',
    checklistLink: 'text-xs font-medium text-indigo-600',
    cancel: 'flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600',
    submit:
      'flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium disabled:opacity-60',
    submitStyle: undefined,
    controlStyle: undefined,
    optionStyle: undefined,
  },
  dark: {
    overlay: 'absolute inset-0 bg-black/60 backdrop-blur-sm',
    panel:
      'relative w-full max-w-full sm:max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-t-3xl sm:rounded-3xl border border-white/10 bg-gradient-to-b from-panel-2/95 to-abyss/95 backdrop-blur-md',
    panelStyle: { boxShadow: '0 0 0 1px #b8f06a22, 0 30px 80px -30px #b8f06a55' },
    header:
      'flex items-center justify-between px-5 py-4 border-b border-white/8 sticky top-0 bg-abyss/90 backdrop-blur-md z-10 rounded-t-3xl',
    title: 'text-base font-black text-ink',
    badge: 'text-xs text-ink-faint flex items-center gap-1 mt-0.5',
    close: 'p-2 rounded-lg text-ink-faint transition hover:bg-white/8 hover:text-ink',
    label: 'block text-sm font-bold text-ink-dim mb-1.5',
    input: fieldClass,
    textarea: `${fieldClass} resize-none`,
    number: fieldClass,
    select: fieldClass,
    catButton:
      'w-full flex items-center gap-3 rounded-xl border border-white/12 bg-black/30 px-3 py-3 transition hover:border-white/25 touch-manipulation',
    catFallback: 'bg-white/10',
    catText: 'flex-1 text-start text-sm font-bold text-ink',
    chevron: 'h-4 w-4 text-ink-faint',
    calendarIcon: 'h-4 w-4 text-lime',
    dueHint: 'text-xs text-sky mt-1 flex items-center gap-1',
    groceryBox: 'rounded-xl border border-lime/25 bg-lime/8 p-3',
    groceryTitle: 'text-sm font-bold text-ink mb-2',
    checklistLink: 'text-xs font-bold text-lime',
    cancel:
      'flex-1 py-2.5 rounded-xl border border-white/12 text-sm font-bold text-ink-dim transition hover:border-white/25 hover:text-ink',
    submit:
      'flex-1 py-2.5 rounded-xl bg-gradient-to-b from-lime to-lime-deep text-[#152007] text-sm font-extrabold disabled:opacity-60',
    submitStyle: { boxShadow: '0 0 0 1px #d6ff9a, 0 14px 38px -12px #8fd53acc' },
    controlStyle: darkControlStyle,
    optionStyle: darkOptionStyle,
  },
};

export default function TaskModal({
  task,
  users,
  permissions,
  currentUserId,
  onSave,
  onClose,
  variant = 'light',
}) {
  const isAdmin = permissions?.isAdmin;
  const { t, dir, lang, category: categoryLabel, role } = useI18n();
  const th = THEMES[variant] ?? THEMES.light;

  const [form, setForm] = useState(
    task
      ? {
          title: task.title,
          description: task.description || '',
          category: task.category || task.categoryId,
          points: task.points ?? task.pointsValue,
          assigneeId: task.assigneeId || task.assignedUserId || currentUserId || '',
          status: task.status,
          dueAt: toDatetimeLocalValue(task.dueAt || task.dueDate),
          subItems: Array.isArray(task.subItems) ? task.subItems.map((s) => ({ ...s })) : [],
        }
      : { ...emptyForm, assigneeId: currentUserId || users[0]?.id || '' }
  );
  const [submitting, setSubmitting] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const selectedCat = CATEGORIES.find((c) => c.id === form.category);
  const showGrocery = form.category === 'shopping' || (form.subItems && form.subItems.length > 0);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave({
        ...form,
        points: Number(form.points),
        pointsValue: Number(form.points),
        dueAt: form.dueAt ? fromDatetimeLocalValue(form.dueAt) : null,
        dueDate: form.dueAt ? fromDatetimeLocalValue(form.dueAt) : null,
        assigneeId: form.assigneeId || null,
        assignedUserId: form.assigneeId || null,
        categoryId: form.category,
        subItems: (form.subItems || []).filter((s) => (s.text || '').trim()),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-x-hidden">
      <motion.div
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        className={th.overlay}
        onClick={onClose}
      />

      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        className={th.panel}
        style={th.panelStyle}
        dir={dir}
      >
        <div className={th.header}>
          <div className="min-w-0">
            <h3 className={th.title}>{task ? t('editTask') : t('addTask')}</h3>
            {!isAdmin && (
              <p className={th.badge}>
                <Shield className="h-3 w-3" /> {t('memberBadge')}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className={th.close}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 w-full max-w-full">
          <div>
            <label className={th.label}>{t('titleLabel')}</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
              placeholder={t('titlePlaceholder')}
              className={th.input}
            />
          </div>

          <div>
            <label className={th.label}>{t('descriptionLabel')}</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={2}
              className={th.textarea}
            />
          </div>

          <div>
            <label className={th.label}>{t('categoryLabel')}</label>
            <button type="button" onClick={() => setCategoryOpen(true)} className={th.catButton}>
              <span
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                  selectedCat?.circle || th.catFallback
                }`}
              >
                {selectedCat?.icon || '📌'}
              </span>
              <span className={th.catText}>
                {selectedCat ? categoryLabel(selectedCat.id, selectedCat.label) : t('pickCategory')}
              </span>
              <ChevronLeft className={th.chevron} />
            </button>
          </div>

          <div>
            <label className={th.label}>{t('pointsLabel')}</label>
            <input
              type="number"
              min={1}
              max={100}
              value={form.points}
              onChange={(e) => handleChange('points', e.target.value)}
              required
              disabled={!permissions?.canChangePoints && !isAdmin}
              className={th.number}
              style={th.controlStyle}
            />
          </div>

          <div>
            <label className={`${th.label} flex items-center gap-1.5`}>
              <Calendar className={th.calendarIcon} />
              {t('dueDateTime')}
            </label>
            <input
              type="datetime-local"
              value={form.dueAt}
              onChange={(e) => handleChange('dueAt', e.target.value)}
              dir="ltr"
              className={th.input}
              style={th.controlStyle}
            />
            {form.dueAt && (
              <p className={th.dueHint}>
                <Clock className="h-3 w-3" />
                {new Date(form.dueAt).toLocaleString(lang === 'he' ? 'he-IL' : 'en-US', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>

          {showGrocery && (
            <div className={th.groceryBox}>
              <p className={th.groceryTitle}>{t('groceryList')}</p>
              <SubItemsChecklist
                items={form.subItems}
                editable
                variant={variant}
                onChange={(next) => handleChange('subItems', next)}
              />
            </div>
          )}

          {!showGrocery && (
            <button
              type="button"
              onClick={() =>
                handleChange('subItems', [{ id: `si-${Date.now()}`, text: '', isCompleted: false }])
              }
              className={th.checklistLink}
            >
              {t('addChecklist')}
            </button>
          )}

          {(permissions?.canReassign || isAdmin) && (
            <div>
              <label className={th.label}>{t('assignee')}</label>
              <select
                value={form.assigneeId || ''}
                onChange={(e) => handleChange('assigneeId', e.target.value)}
                className={th.select}
                style={th.controlStyle}
              >
                <option value="" style={th.optionStyle}>
                  {t('unassigned')}
                </option>
                {users.map((u) => (
                  <option key={u.id} value={u.id} style={th.optionStyle}>
                    {u.name} ({role(u.familyRole, u.familyRoleLabel)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {task && (isAdmin || permissions?.canReassign) && (
            <div>
              <label className={th.label}>{t('statusLabel')}</label>
              <select
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className={th.select}
                style={th.controlStyle}
              >
                <option value={TASK_STATUSES.TODO} style={th.optionStyle}>
                  {t('status.todo')}
                </option>
                <option value={TASK_STATUSES.PENDING_APPROVAL} style={th.optionStyle}>
                  {t('status.pending')}
                </option>
                <option value={TASK_STATUSES.DONE} style={th.optionStyle}>
                  {t('status.done')}
                </option>
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className={th.cancel}>
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={th.submit}
              style={submitting ? undefined : th.submitStyle}
            >
              {submitting ? t('saving') : task ? t('update') : t('createTask')}
            </button>
          </div>
        </form>
      </motion.div>

      {categoryOpen && (
        <CategoryPickerModal
          selectedId={form.category}
          variant={variant}
          onSelect={(id) => handleChange('category', id)}
          onClose={() => setCategoryOpen(false)}
        />
      )}
    </div>
  );
}
