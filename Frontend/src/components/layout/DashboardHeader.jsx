import { useState, useEffect } from 'react';
import {
  Home,
  Menu,
  Gift,
  Plus,
  LogOut,
  Settings,
  Shield,
  Star,
  ListTodo,
} from 'lucide-react';
import UserAvatar from '../gamification/UserAvatar';
import MobileNavDrawer from './MobileNavDrawer';
import { NAV_ITEMS } from './navConfig';
import { useI18n } from '../../context/I18nContext';

export default function DashboardHeader({
  user,
  household,
  activeTab,
  onNavigate,
  onOpenProfile,
  onLogout,
  onOpenRewards,
  onCreateTask,
  pendingCount = 0,
  activeTaskCount = 0,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t, p, dir, householdName, toggleLang, lang } = useI18n();

  useEffect(() => {
    const onResize = () => {
      if (window.matchMedia('(min-width: 768px)').matches) setDrawerOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = async () => {
    setDrawerOpen(false);
    await onLogout?.();
  };

  return (
    <>
      <header
        dir={dir}
        className="shrink-0 sticky top-0 z-40 w-full max-w-full overflow-x-hidden bg-white/95 backdrop-blur-md border-b border-slate-200 safe-area-pt"
      >
        <div className="w-full max-w-full px-4 sm:px-6 lg:px-12 py-2.5 sm:py-3">
          <div className="hidden md:flex flex-row items-center justify-between gap-3 w-full max-w-full">
            <div className="flex flex-row items-center gap-3 min-w-0 shrink text-right">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 text-white shrink-0">
                <Home className="h-5 w-5" />
              </div>
              <div className="flex flex-col items-start min-w-0 text-start">
                <p className="header-text-horizontal text-[11px] font-medium text-slate-500 whitespace-nowrap truncate w-full max-w-[240px] lg:max-w-[320px]">
                  {t('brandName')} — {t('brandTagline')}
                </p>
                <h1 className="header-text-horizontal text-base lg:text-lg font-semibold text-slate-900 whitespace-nowrap truncate w-full max-w-[240px] lg:max-w-[320px]">
                  {householdName(household?.name)}
                </h1>
              </div>
            </div>

            <nav className="hidden md:flex flex-row items-center gap-1 shrink-0">
              {NAV_ITEMS.filter((i) => i.id !== 'settings').map((item) => {
                const active = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    className={`relative inline-flex flex-row items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors touch-manipulation ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-80" />
                    <span className="whitespace-nowrap">{t(item.labelKey)}</span>
                    {item.id === 'tasks' && pendingCount > 0 && (
                      <span className="ms-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-semibold flex items-center justify-center">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="hidden md:flex flex-row items-center gap-2 shrink-0">
              <span className="hidden lg:inline-flex flex-row items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                <ListTodo className="h-3.5 w-3.5 text-slate-500" />
                {activeTaskCount}
              </span>

              <button
                type="button"
                onClick={toggleLang}
                className="inline-flex flex-row items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-2 rounded-xl whitespace-nowrap touch-manipulation"
                title={t('langSwitchTo')}
                aria-label={t('langSwitchTo')}
              >
                {lang === 'he' ? '🌐 EN' : '🌐 HE'}
              </button>

              <button
                type="button"
                onClick={onOpenRewards}
                className="inline-flex flex-row items-center gap-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-xl whitespace-nowrap touch-manipulation"
              >
                <Gift className="h-4 w-4 shrink-0" />
                <span>{t('rewardsStore')}</span>
              </button>

              <button
                type="button"
                onClick={onCreateTask}
                className="inline-flex items-center text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-2 rounded-xl touch-manipulation"
                title={t('newTask')}
              >
                <Plus className="h-4 w-4" />
              </button>

              {user && (
                <div className="flex flex-row items-center gap-1.5 ps-2 border-s border-slate-200">
                  {user.isAdmin && (
                    <span className="hidden lg:inline-flex flex-row items-center gap-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                      <Shield className="h-3 w-3" />
                      {t('admin')}
                    </span>
                  )}
                  <span className="inline-flex flex-row items-center gap-1 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap">
                    <Star className="h-3 w-3 text-amber-500" />
                    {p(user.points ?? 0)}
                  </span>
                  <button
                    type="button"
                    onClick={onOpenProfile}
                    className="rounded-lg hover:bg-slate-50 p-1 touch-manipulation"
                    title={t('profile')}
                  >
                    <UserAvatar user={user} size="sm" showGlow={false} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('settings')}
                    className="inline-flex items-center p-2 rounded-xl text-slate-700 hover:bg-slate-100 touch-manipulation"
                    title={t('settings')}
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex flex-row items-center gap-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 px-2.5 py-2 rounded-xl whitespace-nowrap touch-manipulation"
                    title={t('logout')}
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    <span className="hidden xl:inline">{t('logout')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex md:hidden flex-row items-center justify-between gap-2 w-full max-w-full">
            <div className="flex flex-row items-center gap-2 min-w-0 shrink text-start">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 text-white shrink-0">
                <Home className="h-4 w-4" />
              </div>
              <h1 className="header-text-horizontal text-sm font-semibold text-slate-900 whitespace-nowrap truncate max-w-[38vw]">
                {householdName(household?.name)}
              </h1>
            </div>

            <div className="flex flex-row items-center gap-1.5 shrink-0">
              <span className="inline-flex flex-row items-center gap-1 text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded-full whitespace-nowrap">
                <Star className="h-3 w-3 text-amber-500" />
                {user?.points ?? 0}
              </span>
              <button
                type="button"
                onClick={toggleLang}
                className="inline-flex items-center justify-center h-8 px-2 rounded-lg text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 touch-manipulation"
                title={t('langSwitchTo')}
                aria-label={t('langSwitchTo')}
              >
                {lang === 'he' ? '🌐 EN' : '🌐 HE'}
              </button>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="relative p-2.5 rounded-xl text-white bg-slate-900 hover:bg-slate-800 touch-manipulation"
                aria-label={t('menu')}
                aria-expanded={drawerOpen}
                aria-controls="mobile-nav-drawer"
              >
                <Menu className="h-5 w-5" strokeWidth={2.25} />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -start-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileNavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        household={household}
        activeTab={activeTab}
        onNavigate={onNavigate}
        onLogout={handleLogout}
        onOpenProfile={onOpenProfile}
        pendingCount={pendingCount}
      />
    </>
  );
}
