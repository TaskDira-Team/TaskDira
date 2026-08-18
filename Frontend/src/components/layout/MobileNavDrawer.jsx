import { useEffect } from 'react';
import { Home, X, LogOut, Shield, Star, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AvatarFrame from '../gamification/AvatarFrame';
import { NAV_ITEMS } from './navConfig';
import { useI18n } from '../../context/I18nContext';

export default function MobileNavDrawer({
  open,
  onClose,
  user,
  household,
  activeTab,
  onNavigate,
  onLogout,
  onOpenProfile,
  pendingCount = 0,
}) {
  const { t, p, householdName, dir } = useI18n();
  const offscreen = dir === 'rtl' ? '100%' : '-100%';

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const drawerLinks = NAV_ITEMS.filter((i) => i.id !== 'settings');

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label={t('nav.settings')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />

          <motion.aside
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={t('menu')}
            initial={{ x: offscreen }}
            animate={{ x: 0 }}
            exit={{ x: offscreen }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            dir={dir}
            className="fixed inset-y-0 start-0 z-50 flex flex-col w-full max-w-[20rem] overflow-x-hidden overflow-y-auto bg-white shadow-2xl md:hidden safe-area-pt safe-area-pb"
          >
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 text-white shrink-0">
                  <Home className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 break-words">{t('brandName')}</p>
                  <p className="text-[10px] text-slate-500 break-words">{t('brandTagline')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 touch-manipulation"
                aria-label={t('close')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {user && (
              <button
                type="button"
                onClick={() => {
                  onOpenProfile?.();
                  onClose();
                }}
                className="w-full max-w-full flex items-center gap-3 px-4 py-4 border-b border-slate-100 text-start hover:bg-slate-50 touch-manipulation"
              >
                <div className="shrink-0 ring-1 ring-slate-200 rounded-2xl">
                  <AvatarFrame avatar={user.avatar} size="md" showGlow={false} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 break-words">{user.name}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-full">
                      <Star className="h-3 w-3 text-amber-500" />
                      {p(user.balance ?? user.points ?? 0)}
                    </span>
                    {user.isAdmin && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full">
                        <Shield className="h-3 w-3" />
                        {t('admin')}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )}

            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                {t('householdLabel')}
              </p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5 break-words">
                {householdName(household?.name)}
              </p>
              {household?.address ? (
                <p className="text-xs text-slate-500 mt-0.5 break-words">{household.address}</p>
              ) : null}
            </div>

            <nav className="px-2 py-3 space-y-1 flex-1">
              {drawerLinks.map((item) => {
                const active = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onNavigate(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-sm font-medium touch-manipulation transition-colors ${
                      active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-white' : 'text-slate-500'}`} />
                    <span className="flex-1 text-start break-words">{t(item.labelKey)}</span>
                    {item.id === 'tasks' && pendingCount > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-semibold flex items-center justify-center">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  onNavigate('settings');
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 touch-manipulation"
              >
                <Settings className="h-5 w-5 shrink-0 text-slate-500" />
                <span className="flex-1 text-start">{t('settings')}</span>
              </button>
            </nav>

            <div className="px-4 pt-3 pb-6 border-t border-slate-100 shrink-0 mt-auto">
              <button
                type="button"
                onClick={async () => {
                  onClose();
                  await onLogout?.();
                }}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 touch-manipulation"
              >
                <LogOut className="h-4 w-4" />
                {t('logout')}
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
