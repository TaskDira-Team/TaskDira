import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { api } from "../services/api";
import { getLocalMonthlyEarnedXp } from "../services/usersApi";
import { fetchMonthlyEarnedXp } from "../services/pointsRemote";
import { USE_REAL_API } from "../services/config";
import { completedThisMonth } from "../utils/monthlyStats";
import { STATUS_LABELS, TASK_STATUSES } from "../data/mockData";
import { useAuth } from "./AuthContext";
import { useI18n } from "./I18nContext";
import {
  fireTaskCompleteConfetti,
  fireProofSubmittedConfetti,
} from "../utils/confetti";
import {
  playTaskCompleteSound,
  playRewardClaimSound,
  isSoundEnabled,
  setSoundEnabled,
} from "../utils/sound";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { lang, tx } = useI18n();
  const he = lang === "he";
  const { user, updateProfile: authUpdateProfile, syncUser } = useAuth();
  const [household, setHousehold] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [members, setMembers] = useState([]);
  const [monthlyXp, setMonthlyXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
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
      isAdmin: user?.userRole === "Admin" || user?.isAdmin === true,
      userRole: user?.userRole ?? (user?.isAdmin ? "Admin" : "Member"),
      canCreateTask: !!user,
      canDeleteTask: user?.userRole === "Admin" || user?.isAdmin === true,
      canChangePoints: !!user,
      canSetDueDate: !!user,
      canReassign: !!user,
    }),
    [user],
  );

  const getTaskPermissions = useCallback(
    (task) => api.getPermissions(user, task),
    [user],
  );

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3500,
    );
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
      addToast(
        he
          ? `🎉 "${task.title}" הושלמה! +${pts} נקודות`
          : `🎉 "${tx(task.title)}" complete! +${pts} XP`,
        "success",
      );
    },
    [addToast, spawnXpBurst, he, tx],
  );

  const refreshData = useCallback(async () => {
    try {
      const [
        householdData,
        usersData,
        tasksData,
        leaderboardData,
        rewardsData,
        membersData,
        earnedXp,
      ] = await Promise.all([
        api.getHousehold(),
        api.getUsers(),
        api.getTasks(),
        api.getLeaderboard(),
        api.getRewards(),
        api.getMembers().catch(() => []),
        USE_REAL_API.tasks
          ? fetchMonthlyEarnedXp()
          : Promise.resolve(getLocalMonthlyEarnedXp()),
      ]);
      setHousehold(householdData);
      setUsers(
        usersData.map((member) => ({
          ...member,
          tasksCompletedThisMonth: completedThisMonth(tasksData, member.id),
        })),
      );
      setMonthlyXp(earnedXp);
      setTasks(tasksData);
      setLeaderboard(leaderboardData);
      setRewards(rewardsData);
      setMembers(membersData);
      setLoadError(null);
    } catch (error) {
      setLoadError(error.message || "Could not load household data.");
      throw error;
    }
  }, []);

  // syncUser after the first load: the auth user is hydrated before the roster
  // populates the points ledger, so its balance starts at 0 and only corrected
  // itself after the first earn or redemption. Re-enriching here keeps every
  // useAuth() consumer honest from the start.
  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    refreshData()
      .then(() => syncUser())
      .catch(() => {
        /* The app shell displays a retryable loading error. */
      })
      .finally(() => setLoading(false));
  }, [user?.id, user?.activeHouseholdId, refreshData, syncUser]);

  const createTask = useCallback(
    async (taskData) => {
      try {
        const task = await api.createTask(taskData);
        await refreshData();
        addToast(
          he
            ? `משימה "${task.title}" נוצרה בהצלחה`
            : `Quest "${tx(task.title)}" created!`,
        );
        return task;
      } catch (err) {
        addToast(err.message, "warning");
        throw err;
      }
    },
    [refreshData, addToast, he, tx],
  );

  const updateTask = useCallback(
    async (taskId, updates) => {
      try {
        const task = await api.updateTask(taskId, updates);
        await refreshData();
        addToast(
          he
            ? `משימה "${task.title}" עודכנה`
            : `Quest "${tx(task.title)}" updated!`,
        );
        return task;
      } catch (err) {
        addToast(err.message, "warning");
        throw err;
      }
    },
    [refreshData, addToast, he, tx],
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
          addToast(
            he
              ? `"${task.title}" הועברה ל${STATUS_LABELS[newStatus]}`
              : `"${tx(task.title)}" moved to ${tx(STATUS_LABELS[newStatus])}`,
            "info",
          );
        }
        return task;
      } catch (err) {
        addToast(err.message, "warning");
        throw err;
      } finally {
        setTimeout(() => setAnimatingTaskId(null), 500);
      }
    },
    [refreshData, addToast, celebrateTaskDone, syncUser, he, tx],
  );

  const submitTaskProof = useCallback(
    async (taskId, proofImageData) => {
      try {
        const task = await api.submitTaskProof(taskId, proofImageData);
        await refreshData();
        fireProofSubmittedConfetti();
        addToast(
          he
            ? `📸 "${task.title}" נשלח לאישור מנהל`
            : `📸 "${tx(task.title)}" sent for approval`,
          "info",
        );
        return task;
      } catch (err) {
        addToast(err.message, "warning");
        throw err;
      }
    },
    [refreshData, addToast, he, tx],
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
        addToast(err.message, "warning");
        throw err;
      } finally {
        setTimeout(() => setAnimatingTaskId(null), 500);
      }
    },
    [refreshData, addToast, celebrateTaskDone, syncUser, he, tx],
  );

  const rejectTask = useCallback(
    async (taskId, reason) => {
      try {
        const task = await api.rejectTask(taskId, reason);
        await refreshData();
        addToast(
          he
            ? `"${task.title}" נדחה – נסו שוב`
            : `"${tx(task.title)}" needs another try`,
          "warning",
        );
        return task;
      } catch (err) {
        addToast(err.message, "warning");
        throw err;
      }
    },
    [refreshData, addToast, he, tx],
  );

  const claimTask = useCallback(
    async (taskId) => {
      try {
        const task = await api.claimTask(taskId);
        await refreshData();
        addToast(
          he
            ? `תפסת את המשימה "${task.title}"! 💪`
            : `You claimed "${tx(task.title)}"! 💪`,
          "success",
        );
        return task;
      } catch (err) {
        addToast(err.message, "warning");
        throw err;
      }
    },
    [refreshData, addToast, he, tx],
  );

  const deleteTask = useCallback(
    async (taskId) => {
      try {
        const task = await api.deleteTask(taskId);
        await refreshData();
        addToast(
          he
            ? `משימה "${task.title}" נמחקה`
            : `Quest "${tx(task.title)}" deleted`,
          "warning",
        );
        return task;
      } catch (err) {
        addToast(err.message, "warning");
        throw err;
      }
    },
    [refreshData, addToast, he, tx],
  );

  const toggleSubItem = useCallback(
    async (taskId, subItemId, isCompleted) => {
      try {
        const task = await api.toggleSubItem(taskId, subItemId, isCompleted);
        await refreshData();
        return task;
      } catch (err) {
        addToast(err.message, "warning");
        throw err;
      }
    },
    [refreshData, addToast, he, tx],
  );

  const resetMonthlyScores = useCallback(async () => {
    try {
      await api.resetMonthlyScores();
      await refreshData();
      addToast(
        he
          ? "איפוס חודשי: משימות שבוצעו הועברו לארכיון, נקודות ננעלו ללוח היסטוריה"
          : "Monthly reset complete",
        "info",
      );
    } catch (err) {
      addToast(err.message, "warning");
      throw err;
    }
  }, [refreshData, addToast, he, tx]);

  const updateProfile = useCallback(
    async (updates) => {
      await authUpdateProfile(updates);
      await refreshData();
      addToast(he ? "הפרופיל עודכן בהצלחה" : "Your character is ready!");
    },
    [authUpdateProfile, refreshData, addToast, he],
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
          remainingPoints: result.user?.balance ?? 0,
        });
        return result;
      } catch (err) {
        addToast(err.message, "warning");
        throw err;
      }
    },
    [syncUser, refreshData, addToast],
  );

  const createReward = useCallback(
    async (data) => {
      try {
        await api.createReward(data);
        await refreshData();
        addToast(he ? "פרס חדש נוסף לחנות!" : "A new treat is in the shop!");
      } catch (err) {
        addToast(err.message, "warning");
        throw err;
      }
    },
    [refreshData, addToast, he, tx],
  );

  const updateReward = useCallback(
    async (id, data) => {
      try {
        await api.updateReward(id, data);
        await refreshData();
        addToast(he ? "הפרס עודכן" : "Reward updated");
      } catch (err) {
        addToast(err.message, "warning");
        throw err;
      }
    },
    [refreshData, addToast, he, tx],
  );

  const deleteReward = useCallback(
    async (id) => {
      try {
        await api.deleteReward(id);
        await refreshData();
        addToast(he ? "הפרס נמחק" : "Reward deleted", "warning");
      } catch (err) {
        addToast(err.message, "warning");
        throw err;
      }
    },
    [refreshData, addToast, he, tx],
  );

  const inviteMember = useCallback(
    async (email) => {
      try {
        const invited = await api.inviteUser({ email });
        await refreshData();
        addToast(he ? "ההזמנה נשלחה בהצלחה" : "Invitation sent");
        return invited;
      } catch (err) {
        addToast(err.message, "warning");
        throw err;
      }
    },
    [refreshData, addToast, he, tx],
  );

  const changeMemberRole = useCallback(
    async (userId, role) => {
      try {
        await api.changeMemberRole(userId, role);
        await refreshData();
        addToast(he ? "התפקיד עודכן" : "Role updated");
      } catch (err) {
        addToast(err.message, "warning");
        throw err;
      }
    },
    [refreshData, addToast, he, tx],
  );

  const removeMember = useCallback(
    async (userId) => {
      try {
        await api.removeMember(userId);
        await refreshData();
        addToast(
          he ? "החבר הוסר מהבית" : "Member removed from household",
          "warning",
        );
      } catch (err) {
        addToast(err.message, "warning");
        throw err;
      }
    },
    [refreshData, addToast, he, tx],
  );

  const dismissCelebration = useCallback(() => setCelebration(null), []);

  const pendingApprovalCount = tasks.filter(
    (t) => t.status === TASK_STATUSES.PENDING_APPROVAL,
  ).length;

  return (
    <AppContext.Provider
      value={{
        monthlyXp,
        household,
        group: household
          ? { id: household.id, name: household.displayName }
          : null,
        users,
        tasks,
        leaderboard,
        rewards,
        members,
        inviteMember,
        changeMemberRole,
        removeMember,
        loading,
        loadError,
        dismissToast: (id) =>
          setToasts((previous) => previous.filter((toast) => toast.id !== id)),
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
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
