import { useState } from 'react';
import { Check, Globe, Loader2, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import OnboardingFlow from '../onboarding/OnboardingFlow';
import { Aurora, GhostButton, LimeButton, Panel, SegmentedTabs } from '../ui/kit';

/** Minimal abstract brand mark: a bordered tile with a smaller solid square
 * inset — a geometric accent standing in for a logo, not an icon or emoji. */
function BrandMark({ size = 40 }) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/[0.04]"
      style={{ width: size, height: size }}
    >
      <span
        className="rounded-md bg-gradient-to-br from-lime to-lime-deep"
        style={{ width: size * 0.4, height: size * 0.4 }}
      />
    </span>
  );
}

const inputClass =
  'w-full min-w-0 rounded-xl border border-white/12 bg-black/30 ps-10 pe-4 py-3 text-sm text-ink placeholder:text-ink-faint outline-none transition focus:border-lime/60';

export default function DarkAuthScreen() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, register, error, setError } = useAuth();
  const { t, dir, lang, toggleLang } = useI18n();

  const switchMode = (next) => {
    setMode(next);
    setError(null);
  };

  // Mirrors the legacy screen exactly: errors surface through AuthContext, and
  // a successful login lets the router redirect on its own.
  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    await login(email, password).catch(() => null);
    setSubmitting(false);
  };

  return (
    <div
      dir={dir}
      className="font-landing relative min-h-screen min-h-dvh w-full overflow-hidden bg-void text-ink"
    >
      <Aurora />

      <div className="absolute top-4 end-4 z-30">
        <GhostButton onClick={toggleLang} className="inline-flex items-center gap-1.5 backdrop-blur">
          <Globe className="h-3.5 w-3.5" />
          {lang === 'he' ? 'EN' : 'HE'}
        </GhostButton>
      </div>

      <div className="relative z-10 mx-auto grid min-h-dvh w-full max-w-7xl grid-cols-1 items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        {/* brand */}
        <div className="hidden flex-col justify-center lg:flex">
          <BrandMark size={44} />
          <p className="mt-5 text-xs font-bold uppercase tracking-wide text-ink-dim">
            {t('brandTagline')}
          </p>
          <h1 className="mt-2 text-5xl font-black tracking-tight text-ink xl:text-6xl">
            {t('brandName')}
          </h1>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-ink-dim">
            {t('brandTaglineLong')}
          </p>
          <ul className="mt-8 space-y-2.5 text-sm text-ink-dim">
            {['feature1', 'feature2', 'feature3'].map((k) => (
              <li key={k} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-lime" />
                {t(k)}
              </li>
            ))}
          </ul>
        </div>

        {/* form */}
        <div className="flex w-full items-center justify-center">
          <Panel className="w-full max-w-lg p-5 sm:p-7" glow accent="lime">
            <div className="mb-6 flex flex-col items-center text-center lg:hidden">
              <BrandMark size={40} />
              <h1 className="mt-3 text-xl font-black text-ink">{t('brandName')}</h1>
              <p className="mt-0.5 text-xs text-ink-dim">{t('brandTagline')}</p>
            </div>

            <SegmentedTabs
              items={[
                { key: 'login', label: t('login') },
                { key: 'signup', label: t('register') },
              ]}
              value={mode}
              onChange={switchMode}
            />

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-ink-dim">
                    {t('emailLabel')}
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="name@example.com"
                      dir="ltr"
                      autoComplete="email"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-ink-dim">
                    {t('passwordLabel')}
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••"
                      dir="ltr"
                      autoComplete="current-password"
                      className={inputClass}
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-coral/35 bg-coral/12 px-4 py-3 text-sm break-words text-coral">
                    {error}
                  </div>
                )}

                <LimeButton type="submit" disabled={submitting} className="w-full">
                  {submitting ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </span>
                  ) : (
                    t('loginCta')
                  )}
                </LimeButton>
              </form>
            ) : (
              <div className="mt-6">
                <OnboardingFlow
                  variant="dark"
                  onComplete={register}
                  onBackToLogin={() => switchMode('login')}
                />
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
