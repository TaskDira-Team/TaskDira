import { useI18n } from '../context/I18nContext';
import { useRoute } from '../context/RouteContext';
import DarkAuthScreen from '../components/auth/DarkAuthScreen';
import { GhostButton } from '../components/ui/kit';

/**
 * Route wrapper for the new-UI auth screen. Navigation lives here rather than
 * inside the screen because the legacy auth path renders outside RouteProvider.
 */
export default function AuthRoute() {
  const { t } = useI18n();
  const { navigate } = useRoute();

  return (
    <div className="relative">
      <div className="absolute top-4 start-4 z-30">
        <GhostButton onClick={() => navigate('/landing')} className="backdrop-blur">
          ← {t('brandName')}
        </GhostButton>
      </div>
      <DarkAuthScreen />
    </div>
  );
}
