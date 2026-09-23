import { lazy, Suspense, useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { Loader2 } from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { HouseholdProvider } from "./context/HouseholdContext";
import { I18nProvider } from "./context/I18nContext";
import { RouteProvider, useRoute } from "./context/RouteContext";
import { USE_NEW_UI } from "./services/config";
import { findRoute } from "./routes";
import Landing from "./pages/Landing";
import AccessibilityWidget from "./components/ui/AccessibilityWidget";

// A first-time visitor does not need to download the authenticated workspace.
const AppShell = lazy(() => import("./components/layout/AppShell"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Rewards = lazy(() => import("./pages/Rewards"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Profile = lazy(() => import("./pages/Profile"));
const Household = lazy(() => import("./pages/Household"));
const HomeDashboard = lazy(() => import("./pages/HomeDashboard"));

// Legacy preview map, used only while USE_NEW_UI is off.
const PREVIEW_SCREENS = {
  "#landing": Landing,
  "#leaderboard": Leaderboard,
  "#rewards": Rewards,
  "#achievements": Achievements,
  "#profile": Profile,
  "#household": Household,
  "#dashboard": HomeDashboard,
};

function LoadingScreen({ dark }) {
  return (
    <div
      className={`min-h-screen min-h-dvh w-full max-w-full overflow-x-hidden flex items-center justify-center ${
        dark ? "bg-void" : "bg-slate-50"
      }`}
    >
      <Loader2
        className={`h-8 w-8 animate-spin ${dark ? "text-lime" : "text-indigo-600"}`}
      />
    </div>
  );
}

function NewUiRouter() {
  const { user, loading } = useAuth();
  const { path, navigate } = useRoute();
  const route = findRoute(path);

  useEffect(() => {
    if (loading) return;
    const current = findRoute(path);
    if (!user && current?.access !== "public" && current?.access !== "shared")
      navigate("/landing");
    else if (user && (!current || current.access === "public")) navigate("/");
  }, [user, loading, path, navigate]);

  if (loading) return <LoadingScreen dark />;

  if (route?.access === "shared") {
    const SharedScreen = route.component;
    return <SharedScreen />;
  }

  if (!user) {
    const publicRoute =
      route?.access === "public" ? route : findRoute("/landing");
    const PublicScreen = publicRoute.component;
    return <PublicScreen />;
  }

  // A signed-in caller landing on a public route belongs in the app.
  if (!route || route.access === "public") {
    const Home = findRoute("/").component;
    return (
      <HouseholdProvider key={user.id}>
        <AppShell>
          <Home />
        </AppShell>
      </HouseholdProvider>
    );
  }

  const Screen = route.component;
  return (
    <HouseholdProvider key={user.id}>
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
    <HouseholdProvider key={user.id}>
      <Dashboard />
    </HouseholdProvider>
  );
}

export default function App() {
  return (
    <div className="w-full max-w-full overflow-x-clip min-h-screen min-h-dvh">
      <MotionConfig reducedMotion="user">
        <I18nProvider>
          <AuthProvider>
            <Suspense fallback={<LoadingScreen />}>
              {USE_NEW_UI ? (
                <RouteProvider>
                  <NewUiRouter />
                </RouteProvider>
              ) : (
                <LegacyRouter />
              )}
            </Suspense>
            <AccessibilityWidget />
          </AuthProvider>
        </I18nProvider>
      </MotionConfig>
    </div>
  );
}
