import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { useRoute } from '../../context/RouteContext';
import { NAV_ROUTES } from '../../routes';
import { Aurora, Avatar } from '../ui/kit';

function NavButton({ route, active, onClick, compact }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={
        compact
          ? `flex w-full flex-col items-center gap-1 rounded-2xl py-2 transition ${
              active ? 'bg-lime/12' : 'hover:bg-white/5'
            }`
          : `flex w-full flex-row items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition ${
              active ? 'bg-lime/12 text-lime' : 'text-ink-dim hover:bg-white/5 hover:text-ink'
            }`
      }
    >
      <span
        className={compact ? 'text-lg' : 'text-lg'}
        style={active ? { filter: 'drop-shadow(0 0 8px #b8f06a)' } : undefined}
      >
        {route.icon}
      </span>
      <span
        className={
          compact
            ? `text-[11px] font-bold ${active ? 'text-lime' : 'text-ink-faint'}`
            : 'flex-1 text-start'
        }
      >
        {t(route.labelKey)}
      </span>
      {!compact && !route.wired && (
        <span className="num rounded-md bg-white/10 px-1.5 py-px text-[9px] font-extrabold text-ink-faint">
          demo
        </span>
      )}
    </button>
  );
}

/**
 * Persistent chrome around every private screen. The screens keep their own
 * internal layout; the shell owns the page frame — a real sidebar and a wide
 * centred column from lg up, a tab bar below — so the app stops reading as a
 * phone screen stretched across a desktop browser.
 */
export default function AppShell({ children }) {
  const { t, dir } = useI18n();
  const { user, logout } = useAuth();
  const { path, navigate } = useRoute();

  return (
    <div dir={dir} className="font-landing relative min-h-screen overflow-hidden bg-void text-ink">
      <Aurora />

      <div className="relative flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-e border-white/8 bg-abyss/60 px-4 py-6 backdrop-blur-sm lg:flex">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mb-8 flex items-center gap-2.5 px-1 text-start"
          >
            <span
              className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-lime to-lime-deep text-xl"
              style={{ boxShadow: '0 0 24px -6px #b8f06a' }}
            >
              🏡
            </span>
            <span className="text-lg font-black tracking-tight">{t('brandName')}</span>
          </button>

          <nav className="flex flex-col gap-1">
            {NAV_ROUTES.map((route) => (
              <NavButton
                key={route.key}
                route={route}
                active={path === route.path}
                onClick={() => navigate(route.path)}
              />
            ))}
          </nav>

          <div className="mt-auto space-y-2 border-t border-white/8 pt-4">
            {user && (
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-start transition hover:bg-white/5"
              >
                <Avatar emoji="🦊" ring="lime" size={38} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-extrabold">{user.fullName || user.name}</span>
                  <span className="num block text-[11px] text-ink-faint">
                    {user.balance ?? user.points ?? 0} {t('pointsShort')}
                  </span>
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={logout}
              className="w-full rounded-2xl border border-white/10 px-3 py-2 text-[13px] font-bold text-ink-dim transition hover:border-coral/50 hover:text-coral"
            >
              {t('logout')}
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 pb-24 lg:pb-8">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-abyss/90 px-2 py-1.5 backdrop-blur-xl lg:hidden">
        <ul className="flex items-center justify-between">
          {NAV_ROUTES.map((route) => (
            <li key={route.key} className="flex-1">
              <NavButton
                route={route}
                active={path === route.path}
                onClick={() => navigate(route.path)}
                compact
              />
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
