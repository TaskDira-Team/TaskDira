import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { TASK_STATUSES } from '../data/mockData';
import DashboardHeader from '../components/layout/DashboardHeader';
import TasksScreen from '../components/tasks/TasksScreen';
import RewardsScreen from '../components/rewards/RewardsScreen';
import LeaderboardScreen from '../components/gamification/LeaderboardScreen';
import Leaderboard from '../components/gamification/Leaderboard';
import UserAvatar from '../components/gamification/UserAvatar';
import ProfileSettingsModal from '../components/profile/ProfileSettingsModal';
import CelebrationModal from '../components/rewards/CelebrationModal';
import ToastContainer from '../components/ui/ToastContainer';
import FloatingPoints from '../components/ui/FloatingPoints';
import FilterCarousel from '../components/ui/FilterCarousel';
import HouseholdAssistant from '../components/ai/HouseholdAssistant';
import { useI18n } from '../context/I18nContext';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const {
    users,
    household,
    leaderboard,
    tasks,
    toasts,
    celebration,
    dismissCelebration,
    pendingApprovalCount,
    updateProfile,
    profileModalOpen,
    setProfileModalOpen,
    setCreateTaskModalOpen,
    setRewardsModalOpen,
    xpBursts,
    dismissXpBurst,
    soundOn,
    toggleSound,
  } = useHousehold();

  const { t, dir } = useI18n();
  const [activeTab, setActiveTab] = useState('tasks');
  const [filterUserId, setFilterUserId] = useState(null);

  const currentUserData = users.find((u) => u.id === user?.id) || user;

  const activeTaskCount = useMemo(
    () =>
      tasks.filter(
        (t) => t.status === TASK_STATUSES.TODO || t.status === TASK_STATUSES.IN_PROGRESS
      ).length,
    [tasks]
  );

  const handleNavigate = (tabId) => {
    if (tabId === 'settings') {
      setProfileModalOpen(true);
      return;
    }
    setActiveTab(tabId);
    if (tabId === 'rewards') setRewardsModalOpen(false);
  };

  const handleCreateTask = () => {
    setActiveTab('tasks');
    setCreateTaskModalOpen(true);
  };

  const handleOpenRewards = () => {
    setActiveTab('rewards');
  };

  const handleLogout = async () => {
    setProfileModalOpen(false);
    await logout();
  };

  return (
    <div dir={dir} className="w-full max-w-full overflow-x-clip min-h-screen min-h-dvh bg-slate-100">
      <div className="relative flex flex-col w-full max-w-full min-h-screen min-h-dvh overflow-x-clip bg-slate-50">
        <DashboardHeader
          user={currentUserData}
          household={household}
          activeTab={profileModalOpen ? 'settings' : activeTab}
          onNavigate={handleNavigate}
          onOpenProfile={() => setProfileModalOpen(true)}
          onLogout={handleLogout}
          onOpenRewards={handleOpenRewards}
          onCreateTask={handleCreateTask}
          pendingCount={pendingApprovalCount}
          activeTaskCount={activeTaskCount}
        />

        <main className="flex-1 flex flex-col min-h-0 w-full max-w-full min-w-0 overflow-y-auto">
          <div className="w-full max-w-full min-w-0 px-3 sm:px-6 lg:px-12 py-4 sm:py-6 flex-1 flex flex-col min-h-0">
            {activeTab === 'tasks' && (
              <div className="mb-4 w-full max-w-full min-w-0 shrink-0">
                <FilterCarousel ariaLabel={t('nav.family')}>
                  <button
                    type="button"
                    onClick={() => setFilterUserId(null)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors ${
                      !filterUserId
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {t('filter.everyone')}
                  </button>
                  {users.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setFilterUserId(u.id)}
                      className={`flex-shrink-0 inline-flex flex-row items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-colors ${
                        filterUserId === u.id
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <UserAvatar user={u} size="sm" showGlow={false} />
                      <span className="whitespace-nowrap">{u.name}</span>
                    </button>
                  ))}
                </FilterCarousel>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 flex-1 min-h-0 min-w-0 w-full max-w-full">
                <section className="md:col-span-8 xl:col-span-9 flex flex-col min-h-0 min-w-0 w-full max-w-full rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <TasksScreen filterUserId={filterUserId} />
                </section>
                <aside className="hidden md:block md:col-span-4 xl:col-span-3 min-h-0 min-w-0 overflow-y-auto">
                  <Leaderboard leaderboard={leaderboard} />
                </aside>
              </div>
            )}

            {activeTab === 'rewards' && (
              <div className="flex-1 min-h-0 min-w-0 w-full max-w-full overflow-x-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <RewardsScreen />
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div className="flex-1 min-h-0 min-w-0 w-full max-w-full overflow-x-hidden md:max-w-3xl md:mx-auto">
                <LeaderboardScreen />
              </div>
            )}
          </div>
        </main>

        <ToastContainer toasts={toasts} />
        <FloatingPoints bursts={xpBursts || []} onDone={dismissXpBurst} />
        <HouseholdAssistant />

        {profileModalOpen && currentUserData && (
          <ProfileSettingsModal
            user={currentUserData}
            soundOn={soundOn}
            onToggleSound={toggleSound}
            onSave={async (updates) => {
              await updateProfile(updates);
              setProfileModalOpen(false);
            }}
            onClose={() => setProfileModalOpen(false)}
          />
        )}

        <CelebrationModal
          reward={celebration?.reward ?? null}
          remainingPoints={celebration?.remainingPoints ?? 0}
          onClose={dismissCelebration}
        />
      </div>
    </div>
  );
}
