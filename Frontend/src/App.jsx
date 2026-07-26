import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HouseholdProvider } from './context/HouseholdContext';
import { I18nProvider } from './context/I18nContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AccessibilityWidget from './components/ui/AccessibilityWidget';

function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen min-h-dvh w-full max-w-full overflow-x-hidden flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

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
          <AppRouter />
          <AccessibilityWidget />
        </AuthProvider>
      </I18nProvider>
    </div>
  );
}
