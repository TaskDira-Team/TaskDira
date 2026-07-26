import { useState } from 'react';
import { X, Calendar, Clock, Shield, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { CATEGORIES, TASK_STATUSES } from '../../data/mockData';
import { toDatetimeLocalValue, fromDatetimeLocalValue } from '../../utils/dateFormat';
import { modalVariants, overlayVariants } from '../../utils/motion';
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

export default function TaskModal({ task, users, permissions, currentUserId, onSave, onClose }) {
  const isAdmin = permissions?.isAdmin;
  const { t, dir, lang, category: categoryLabel, role } = useI18n();

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
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-full sm:max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden"
        dir={dir}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-3xl">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900">
              {task ? t('editTask') : t('addTask')}
            </h3>
            {!isAdmin && (
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Shield className="h-3 w-3" /> {t('memberBadge')}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 w-full max-w-full">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('titleLabel')}</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
              placeholder={t('titlePlaceholder')}
              className="w-full min-w-0 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('descriptionLabel')}
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={2}
              className="w-full min-w-0 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('categoryLabel')}
            </label>
            <button
              type="button"
              onClick={() => setCategoryOpen(true)}
              className="w-full flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-3 hover:bg-slate-50 touch-manipulation"
            >
              <span
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                  selectedCat?.circle || 'bg-slate-100'
                }`}
              >
                {selectedCat?.icon || '📌'}
              </span>
              <span className="flex-1 text-start text-sm font-semibold text-slate-800">
                {selectedCat ? categoryLabel(selectedCat.id, selectedCat.label) : t('pickCategory')}
              </span>
              <ChevronLeft className="h-4 w-4 text-slate-400" />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('pointsLabel')}
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={form.points}
              onChange={(e) => handleChange('points', e.target.value)}
              required
              disabled={!permissions?.canChangePoints && !isAdmin}
              className="w-full min-w-0 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-indigo-500" />
              {t('dueDateTime')}
            </label>
            <input
              type="datetime-local"
              value={form.dueAt}
              onChange={(e) => handleChange('dueAt', e.target.value)}
              dir="ltr"
              className="w-full min-w-0 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {form.dueAt && (
              <p className="text-xs text-sky-600 mt-1 flex items-center gap-1">
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
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
              <p className="text-sm font-semibold text-slate-800 mb-2">{t('groceryList')}</p>
              <SubItemsChecklist
                items={form.subItems}
                editable
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
              className="text-xs font-medium text-indigo-600"
            >
              {t('addChecklist')}
            </button>
          )}

          {(permissions?.canReassign || isAdmin) && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('assignee')}
              </label>
              <select
                value={form.assigneeId || ''}
                onChange={(e) => handleChange('assigneeId', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">{t('unassigned')}</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({role(u.familyRole, u.familyRoleLabel)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {task && (isAdmin || permissions?.canReassign) && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('statusLabel')}
              </label>
              <select
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={TASK_STATUSES.TODO}>{t('status.todo')}</option>
                <option value={TASK_STATUSES.PENDING_APPROVAL}>{t('status.pending')}</option>
                <option value={TASK_STATUSES.DONE}>{t('status.done')}</option>
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium disabled:opacity-60"
            >
              {submitting ? t('saving') : task ? t('update') : t('createTask')}
            </button>
          </div>
        </form>
      </motion.div>

      {categoryOpen && (
        <CategoryPickerModal
          selectedId={form.category}
          onSelect={(id) => handleChange('category', id)}
          onClose={() => setCategoryOpen(false)}
        />
      )}
    </div>
  );
}
