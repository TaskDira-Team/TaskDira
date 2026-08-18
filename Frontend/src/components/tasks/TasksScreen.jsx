import { useEffect, useMemo, useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { TASK_STATUSES } from '../../data/mockData';
import TaskListItem from './TaskListItem';
import TaskModal from '../board/TaskModal';
import CompletionProofModal from '../board/CompletionProofModal';
import FilterCarousel from '../ui/FilterCarousel';
import { useI18n } from '../../context/I18nContext';

const FILTERS = [
  { id: 'active', labelKey: 'filter.active' },
  { id: 'pending', labelKey: 'filter.pending' },
  { id: 'done', labelKey: 'filter.done' },
  { id: 'all', labelKey: 'filter.all' },
];

export default function TasksScreen({ filterUserId }) {
  const { user } = useAuth();
  const {
    household,
    tasks,
    users,
    loading,
    permissions,
    getTaskPermissions,
    createTask,
    updateTask,
    moveTask,
    claimTask,
    submitTaskProof,
    approveTask,
    rejectTask,
    createTaskModalOpen,
    setCreateTaskModalOpen,
    toggleSubItem,
  } = useApp();

  const { t } = useI18n();
  const requireProof = household?.requireProofApproval === true;
  const [filter, setFilter] = useState('active');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [proofTask, setProofTask] = useState(null);

  useEffect(() => {
    if (createTaskModalOpen) {
      setEditingTask(null);
      setModalOpen(true);
      setCreateTaskModalOpen(false);
    }
  }, [createTaskModalOpen, setCreateTaskModalOpen]);

  const filtered = useMemo(() => {
    let list = [...tasks];
    if (filterUserId) {
      list = list.filter((t) => t.assigneeId === filterUserId || !t.assigneeId);
    }
    if (filter === 'active') {
      list = list.filter(
        (t) => t.status === TASK_STATUSES.TODO || t.status === TASK_STATUSES.IN_PROGRESS
      );
    } else if (filter === 'pending') {
      list = list.filter((t) => t.status === TASK_STATUSES.PENDING_APPROVAL);
    } else if (filter === 'done') {
      list = list.filter((t) => t.status === TASK_STATUSES.DONE);
    }
    return list.sort((a, b) => {
      if (a.status === TASK_STATUSES.DONE && b.status !== TASK_STATUSES.DONE) return 1;
      if (b.status === TASK_STATUSES.DONE && a.status !== TASK_STATUSES.DONE) return -1;
      if (a.dueStatus?.type === 'overdue' && b.dueStatus?.type !== 'overdue') return -1;
      if (b.dueStatus?.type === 'overdue' && a.dueStatus?.type !== 'overdue') return 1;
      return (a.dueAt || '').localeCompare(b.dueAt || '');
    });
  }, [tasks, filter, filterUserId]);

  const handleSave = async (formData) => {
    if (editingTask) await updateTask(editingTask.id, formData);
    else await createTask(formData);
    setModalOpen(false);
    setEditingTask(null);
  };

  const handleReject = async (taskId) => {
    await rejectTask(taskId);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center w-full max-w-full overflow-x-hidden">
        <Loader2 className="h-7 w-7 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full max-w-full min-w-0 bg-transparent relative">
      <div className="w-full max-w-full min-w-0 shrink-0 px-2 sm:px-3 pt-3 pb-1">
        <FilterCarousel ariaLabel={t('nav.tasks')}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filter === f.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {t(f.labelKey)}
            </button>
          ))}
        </FilterCarousel>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 w-full max-w-full min-w-0">
        <div className="px-3 sm:px-4 pb-4 space-y-3 w-full max-w-full">
          {filtered.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-16">{t('emptyTasks')}</p>
          ) : (
            filtered.map((task) => (
              <TaskListItem
                key={task.id}
                task={task}
                taskPermissions={getTaskPermissions(task)}
                isAdminUser={permissions.isAdmin}
                onComplete={setProofTask}
                onCompleteDirect={(t) => moveTask(t.id, TASK_STATUSES.DONE)}
                requireProof={requireProof}
                onClaim={claimTask}
                onApprove={approveTask}
                onReject={handleReject}
                onEdit={(t) => {
                  setEditingTask(t);
                  setModalOpen(true);
                }}
                onToggleSubItem={async (taskId, subItemId, next) => {
                  await toggleSubItem(taskId, subItemId, next);
                }}
              />
            ))
          )}
        </div>
        <div className="h-24 md:h-8" />
      </div>

      {permissions.canCreateTask && (
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            setEditingTask(null);
            setModalOpen(true);
          }}
          className="absolute bottom-4 end-4 z-20 w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20 flex items-center justify-center touch-manipulation hover:bg-slate-800 transition-colors"
          title={t('addTask')}
          aria-label={t('addTask')}
        >
          <Plus className="h-5 w-5 md:h-6 md:w-6" />
        </motion.button>
      )}

      {modalOpen && (
        <TaskModal
          task={editingTask}
          users={users}
          permissions={permissions}
          currentUserId={user?.id}
          onSave={handleSave}
          onClose={() => {
            setModalOpen(false);
            setEditingTask(null);
          }}
        />
      )}

      {proofTask && (
        <CompletionProofModal
          task={proofTask}
          onSubmit={async (id, img) => {
            await submitTaskProof(id, img);
          }}
          onAdminComplete={
            permissions.isAdmin
              ? async () => {
                  await moveTask(proofTask.id, TASK_STATUSES.DONE);
                  setProofTask(null);
                }
              : undefined
          }
          onClose={() => setProofTask(null)}
        />
      )}
    </div>
  );
}
