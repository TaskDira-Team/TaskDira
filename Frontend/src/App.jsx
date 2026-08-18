import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HouseholdProvider } from './context/HouseholdContext';
import { I18nProvider } from './context/I18nContext';
import { RouteProvider, useRoute } from './context/RouteContext';
import { USE_NEW_UI } from './services/config';
import { findRoute } from './routes';
import AppShell from './components/layout/AppShell';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import Leaderboard from './pages/Leaderboard';
import Rewards from './pages/Rewards';
import Achievements from './pages/Achievements';
import Profile from './pages/Profile';
import Household from './pages/Household';
import HomeDashboard from './pages/HomeDashboard';
import AccessibilityWidget from './components/ui/AccessibilityWidget';

// Legacy preview map, used only while USE_NEW_UI is off.
const PREVIEW_SCREENS = {
  '#landing': Landing,
  '#leaderboard': Leaderboard,
  '#rewards': Rewards,
  '#achievements': Achievements,
  '#profile': Profile,
  '#household': Household,
  '#dashboard': HomeDashboard,
};

function LoadingScreen({ dark }) {
  return (
    <div
      className={`min-h-screen min-h-dvh w-full max-w-full overflow-x-hidden flex items-center justify-center ${
        dark ? 'bg-void' : 'bg-slate-50'
      }`}
    >
      <Loader2 className={`h-8 w-8 animate-spin ${dark ? 'text-lime' : 'text-indigo-600'}`} />
    </div>
  );
}

function NewUiRouter() {
  const { user, loading } = useAuth();
  const { path, navigate } = useRoute();

  if (loading) return <LoadingScreen dark />;

  const route = findRoute(path);

  if (!user) {
    const publicRoute = route?.access === 'public' ? route : findRoute('/landing');
    const PublicScreen = publicRoute.component;
    return <PublicScreen />;
  }

  // A signed-in caller landing on a public route belongs in the app.
  if (!route || route.access === 'public') {
    if (path !== '/') navigate('/');
    const Home = findRoute('/').component;
    return (
      <HouseholdProvider>
        <AppShell>
          <Home />
        </AppShell>
      </HouseholdProvider>
    );
  }

  const Screen = route.component;
  return (
    <HouseholdProvider>
      <AppShell>
        <Screen />
      </AppShell>
    </HouseholdProvider>
  );
}

function LegacyRouter() {
  const { user, loading } = useAuth();

  const Preview = PREVIEW_SCREENS[window.location.hash];
  if (Preview) {
    return <Preview />;
  }

  if (loading) return <LoadingScreen />;

  if (!user) {
    return <Login />;
  }

  return (
    <HouseholdProvider>
      <Dashboard />
    </HouseholdProvider>
  );
}

export default function App() {
  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen min-h-dvh">
      <I18nProvider>
        <AuthProvider>
          {USE_NEW_UI ? (
            <RouteProvider>
              <NewUiRouter />
            </RouteProvider>
          ) : (
            <LegacyRouter />
          )}
          <AccessibilityWidget />
        </AuthProvider>
      </I18nProvider>
    </div>
  );
}
