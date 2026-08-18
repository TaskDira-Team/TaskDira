import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { STATUS_LABELS, TASK_STATUSES } from '../data/mockData';
import { useAuth } from './AuthContext';
import { fireTaskCompleteConfetti, fireProofSubmittedConfetti } from '../utils/confetti';
import { playTaskCompleteSound, playRewardClaimSound, isSoundEnabled, setSoundEnabled } from '../utils/sound';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { user, updateProfile: authUpdateProfile, syncUser } = useAuth();
  const [household, setHousehold] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [celebration, setCelebration] = useState(null);
  const [animatingTaskId, setAnimatingTaskId] = useState(null);
  const [xpBursts, setXpBursts] = useState([]);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());

  const [rewardsModalOpen, setRewardsModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);

  const permissions = useMemo(
    () => ({
      isAdmin: user?.userRole === 'Admin' || user?.isAdmin === true,
      userRole: user?.userRole ?? (user?.isAdmin ? 'Admin' : 'Member'),
      canCreateTask: !!user,
      canDeleteTask: user?.userRole === 'Admin' || user?.isAdmin === true,
      canChangePoints: !!user,
      canSetDueDate: !!user,
      canReassign: !!user,
    }),
    [user]
  );

  const getTaskPermissions = useCallback((task) => api.getPermissions(user, task), [user]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const spawnXpBurst = useCallback((points) => {
    const id = `xp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setXpBursts((prev) => [
      ...prev,
      {
        id,
        points,
        x: 42 + Math.random() * 16,
        y: 48 + Math.random() * 10,
      },
    ]);
  }, []);

  const dismissXpBurst = useCallback((id) => {
    setXpBursts((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const toggleSound = useCallback(() => {
    setSoundOn((prev) => {
      const next = !prev;
      setSoundEnabled(next);
      return next;
    });
  }, []);

  const celebrateTaskDone = useCallback(
    (task) => {
      const pts = task?.points ?? task?.pointsValue ?? 0;
      fireTaskCompleteConfetti();
      playTaskCompleteSound();
      if (pts > 0) spawnXpBurst(pts);
      addToast(`🎉 "${task.title}" הושלמה! +${pts} נקודות`, 'success');
    },
    [addToast, spawnXpBurst]
  );

  const refreshData = useCallback(async () => {
    const [householdData, usersData, tasksData, leaderboardData, rewardsData, membersData] =
      await Promise.all([
        api.getHousehold(),
        api.getUsers(),
        api.getTasks(),
        api.getLeaderboard(),
        api.getRewards(),
        api.getMembers().catch(() => []),
      ]);
    setHousehold(householdData);
    setUsers(usersData);
    setTasks(tasksData);
    setLeaderboard(leaderboardData);
    setRewards(rewardsData);
    setMembers(membersData);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    refreshData().finally(() => setLoading(false));
  }, [user?.id, user?.activeHouseholdId, refreshData]);

  const createTask = useCallback(
    async (taskData) => {
      try {
        const task = await api.createTask(taskData);
        await refreshData();
        addToast(`משימה "${task.title}" נוצרה בהצלחה`);
        return task;
      } catch (err) {
        addToast(err.message, 'warning');
        throw err;
      }
    },
    [refreshData, addToast]
  );

  const updateTask = useCallback(
    async (taskId, updates) => {
      try {
        const task = await api.updateTask(taskId, updates);
        await refreshData();
        addToast(`משימה "${task.title}" עודכנה`);
        return task;
      } catch (err) {
        addToast(err.message, 'warning');
        throw err;
      }
    },
    [refreshData, addToast]
  );

  const moveTask = useCallback(
    async (taskId, newStatus) => {
      setAnimatingTaskId(taskId);
      try {
        const task = await api.updateTaskStatus(taskId, newStatus);
        await refreshData();
        await syncUser();

        if (newStatus === TASK_STATUSES.DONE) {
          celebrateTaskDone(task);
        } else {
          addToast(`"${task.title}" הועברה ל${STATUS_LABELS[newStatus]}`, 'info');
        }
        return task;
      } catch (err) {
        addToast(err.message, 'warning');
        throw err;
      } finally {
        setTimeout(() => setAnimatingTaskId(null), 500);
      }
    },
    [refreshData, addToast, celebrateTaskDone, syncUser]
  );

  const submitTaskProof = useCallback(
    async (taskId, proofImageData) => {
      try {
        const task = await api.submitTaskProof(taskId, proofImageData);
        await refreshData();
        fireProofSubmittedConfetti();
        addToast(`📸 "${task.title}" נשלח לאישור מנהל`, 'info');
        return task;
      } catch (err) {
        addToast(err.message, 'warning');
        throw err;
      }
    },
    [refreshData, addToast]
  );

  const approveTask = useCallback(
    async (taskId) => {
      setAnimatingTaskId(taskId);
      try {
        const task = await api.approveTask(taskId);
        await refreshData();
        await syncUser();
        celebrateTaskDone(task);
        return task;
      } catch (err) {
        addToast(err.message, 'warning');
        throw err;
      } finally {
        setTimeout(() => setAnimatingTaskId(null), 500);
      }
    },
    [refreshData, addToast, celebrateTaskDone, syncUser]
  );

  const rejectTask = useCallback(
    async (taskId, reason) => {
      try {
        const task = await api.rejectTask(taskId, reason);
        await refreshData();
        addToast(`"${task.title}" נדחה – נסו שוב`, 'warning');
        return task;
      } catch (err) {
        addToast(err.message, 'warning');
        throw err;
      }
    },
    [refreshData, addToast]
  );

  const claimTask = useCallback(
    async (taskId) => {
      try {
        const task = await api.claimTask(taskId);
        await refreshData();
        addToast(`תפסת את המשימה "${task.title}"! 💪`, 'success');
        return task;
      } catch (err) {
        addToast(err.message, 'warning');
        throw err;
      }
    },
    [refreshData, addToast]
  );

  const deleteTask = useCallback(
    async (taskId) => {
      try {
        const task = await api.deleteTask(taskId);
        await refreshData();
        addToast(`משימה "${task.title}" נמחקה`, 'warning');
        return task;
      } catch (err) {
        addToast(err.message, 'warning');
        throw err;
      }
    },
    [refreshData, addToast]
  );

  const toggleSubItem = useCallback(
    async (taskId, subItemId, isCompleted) => {
      try {
        const task = await api.toggleSubItem(taskId, subItemId, isCompleted);
        await refreshData();
        return task;
      } catch (err) {
        addToast(err.message, 'warning');
        throw err;
      }
    },
    [refreshData, addToast]
  );

  const resetMonthlyScores = useCallback(async () => {
    try {
      await api.resetMonthlyScores();
      await refreshData();
      addToast('איפוס חודשי: משימות שבוצעו הועברו לארכיון, נקודות ננעלו ללוח היסטוריה', 'info');
    } catch (err) {
      addToast(err.message, 'warning');
      throw err;
    }
  }, [refreshData, addToast]);

  const updateProfile = useCallback(
    async (updates) => {
      await authUpdateProfile(updates);
      await refreshData();
      addToast('הפרופיל עודכן בהצלחה');
    },
    [authUpdateProfile, refreshData, addToast]
  );

  const redeemReward = useCallback(
    async (reward) => {
      try {
        const result = await api.redeemReward(reward.id);
        await syncUser();
        await refreshData();
        playRewardClaimSound();
        setCelebration({
          reward: result.reward,
          remainingPoints: result.user?.balance ?? result.user?.points ?? 0,
        });
        return result;
      } catch (err) {
        addToast(err.message, 'warning');
        throw err;
      }
    },
    [syncUser, refreshData, addToast]
  );

  const createReward = useCallback(
    async (data) => {
      try {
        await api.createReward(data);
        await refreshData();
        addToast('פרס חדש נוסף לחנות!');
      } catch (err) {
        addToast(err.message, 'warning');
        throw err;
      }
    },
    [refreshData, addToast]
  );

  const updateReward = useCallback(
    async (id, data) => {
      try {
        await api.updateReward(id, data);
        await refreshData();
        addToast('הפרס עודכן');
      } catch (err) {
        addToast(err.message, 'warning');
        throw err;
      }
    },
    [refreshData, addToast]
  );

  const deleteReward = useCallback(
    async (id) => {
      try {
        await api.deleteReward(id);
        await refreshData();
        addToast('הפרס נמחק', 'warning');
      } catch (err) {
        addToast(err.message, 'warning');
        throw err;
      }
    },
    [refreshData, addToast]
  );

  const inviteMember = useCallback(
    async (email) => {
      try {
        const invited = await api.inviteUser({ email });
        await refreshData();
        addToast('ההזמנה נשלחה בהצלחה');
        return invited;
      } catch (err) {
        addToast(err.message, 'warning');
        throw err;
      }
    },
    [refreshData, addToast]
  );

  const changeMemberRole = useCallback(
    async (userId, role) => {
      try {
        await api.changeMemberRole(userId, role);
        await refreshData();
        addToast('התפקיד עודכן');
      } catch (err) {
        addToast(err.message, 'warning');
        throw err;
      }
    },
    [refreshData, addToast]
  );

  const removeMember = useCallback(
    async (userId) => {
      try {
        await api.removeMember(userId);
        await refreshData();
        addToast('החבר הוסר מהבית', 'warning');
      } catch (err) {
        addToast(err.message, 'warning');
        throw err;
      }
    },
    [refreshData, addToast]
  );

  const dismissCelebration = useCallback(() => setCelebration(null), []);

  const pendingApprovalCount = tasks.filter((t) => t.status === TASK_STATUSES.PENDING_APPROVAL).length;

  return (
    <AppContext.Provider
      value={{
        household,
        group: household ? { id: household.id, name: household.displayName } : null,
        users,
        tasks,
        leaderboard,
        rewards,
        members,
        inviteMember,
        changeMemberRole,
        removeMember,
        loading,
        toasts,
        celebration,
        xpBursts,
        dismissXpBurst,
        soundOn,
        toggleSound,
        animatingTaskId,
        permissions,
        getTaskPermissions,
        pendingApprovalCount,
        rewardsModalOpen,
        setRewardsModalOpen,
        profileModalOpen,
        setProfileModalOpen,
        createTaskModalOpen,
        setCreateTaskModalOpen,
        createTask,
        updateTask,
        moveTask,
        submitTaskProof,
        approveTask,
        rejectTask,
        claimTask,
        deleteTask,
        toggleSubItem,
        resetMonthlyScores,
        updateProfile,
        redeemReward,
        createReward,
        updateReward,
        deleteReward,
        dismissCelebration,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
