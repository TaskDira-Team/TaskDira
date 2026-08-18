import { useState } from 'react';
import { Loader2, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import OnboardingFlow from '../onboarding/OnboardingFlow';
import { Aurora, Eyebrow, GhostButton, LimeButton, Panel, SegmentedTabs } from '../ui/kit';

/**
 * Slow, low-contrast motion behind the form. Decorative only, so it is hidden
 * from assistive tech, and every animation used here is neutralised by the
 * global prefers-reduced-motion rule in index.css.
 */
const DECOR = [
  { emoji: '🦊', x: '8%', y: '18%', size: 46, anim: 'anim-drift', delay: '0s' },
  { emoji: '🪙', x: '86%', y: '12%', size: 34, anim: 'anim-bob-soft', delay: '-1.4s' },
  { emoji: '🏆', x: '78%', y: '72%', size: 52, anim: 'anim-drift', delay: '-6s' },
  { emoji: '🐼', x: '14%', y: '78%', size: 40, anim: 'anim-bob-soft', delay: '-2.6s' },
  { emoji: '⭐', x: '46%', y: '8%', size: 28, anim: 'anim-bob-soft', delay: '-3.8s' },
  { emoji: '🎁', x: '92%', y: '44%', size: 30, anim: 'anim-drift', delay: '-9s' },
  { emoji: '🔥', x: '4%', y: '48%', size: 32, anim: 'anim-bob-soft', delay: '-5.2s' },
];

function AuthDecor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {DECOR.map((d) => (
        <span
          key={d.emoji}
          className={`${d.anim} absolute select-none`}
          style={{
            left: d.x,
            top: d.y,
            fontSize: d.size,
            opacity: 0.14,
            filter: 'blur(0.4px)',
            animationDelay: d.delay,
          }}
        >
          {d.emoji}
        </span>
      ))}
    </div>
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
      <AuthDecor />

      <div className="absolute top-4 end-4 z-30">
        <GhostButton onClick={toggleLang} className="backdrop-blur">
          {lang === 'he' ? '🌐 EN' : '🌐 HE'}
        </GhostButton>
      </div>

      <div className="relative z-10 mx-auto grid min-h-dvh w-full max-w-7xl grid-cols-1 items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        {/* brand */}
        <div className="hidden flex-col justify-center lg:flex">
          <span
            className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-lime to-lime-deep text-2xl"
            style={{ boxShadow: '0 0 30px -6px #b8f06a' }}
          >
            🏡
          </span>
          <Eyebrow>{t('brandTagline')}</Eyebrow>
          <h1 className="mt-5 text-5xl font-black tracking-tight xl:text-6xl">{t('brandName')}</h1>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-ink-dim">
            {t('brandTaglineLong')}
          </p>
          <ul className="mt-8 space-y-2.5 text-sm text-ink-dim">
            {['feature1', 'feature2', 'feature3'].map((k) => (
              <li key={k} className="flex items-center gap-2">
                <span className="text-lime">✓</span>
                {t(k)}
              </li>
            ))}
          </ul>
        </div>

        {/* form */}
        <div className="flex w-full items-center justify-center">
          <Panel className="w-full max-w-lg p-5 sm:p-7" glow accent="lime">
            <div className="mb-6 text-center lg:hidden">
              <span
                className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-lime to-lime-deep text-xl"
                style={{ boxShadow: '0 0 24px -6px #b8f06a' }}
              >
                🏡
              </span>
              <h1 className="text-xl font-black">{t('brandName')}</h1>
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
