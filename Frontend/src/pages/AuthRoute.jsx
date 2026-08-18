import { useI18n } from '../context/I18nContext';
import { useRoute } from '../context/RouteContext';
import AuthScreen from '../components/auth/AuthScreen';

/**
 * Route wrapper around the existing auth screen. AuthScreen is shared with the
 * legacy app, which renders outside RouteProvider, so navigation is added here
 * rather than inside it.
 */
export default function AuthRoute() {
  const { t } = useI18n();
  const { navigate } = useRoute();

  return (
    <div className="relative min-h-screen">
      <button
        type="button"
        onClick={() => navigate('/landing')}
        className="absolute top-4 start-4 z-50 rounded-full border border-slate-300 bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-slate-400 hover:text-slate-900"
      >
        ← {t('brandName')}
      </button>
      <AuthScreen />
    </div>
  );
}
