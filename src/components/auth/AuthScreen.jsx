import { useEffect, useState } from 'react';
import { LogIn, UserPlus, Home, Loader2, Mail, Lock, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import OnboardingFlow from '../onboarding/OnboardingFlow';
import AvatarFrame from '../gamification/AvatarFrame';
import AuthBackground from './AuthBackground';
import { useI18n } from '../../context/I18nContext';

const inputClass =
  'w-full max-w-full rounded-xl border border-slate-200/80 bg-white/90 ps-10 pe-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400';

export default function AuthScreen() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [quickLoadingId, setQuickLoadingId] = useState(null);
  const [demoUsers, setDemoUsers] = useState([]);
  const { login, register, error, setError } = useAuth();
  const { t, p, dir, role, toggleLang, lang } = useI18n();

  useEffect(() => {
    api.getDemoUsers().then(setDemoUsers).catch(() => {});
  }, []);

  if (mode === 'signup') {
    return (
      <div dir={dir} className="relative min-h-screen min-h-dvh w-full max-w-full overflow-hidden">
        <AuthBackground />
        <LangToggle onClick={toggleLang} label={t('langSwitchTo')} short={lang === 'he' ? 'EN' : 'HE'} />
        <div className="relative z-10 w-full max-w-full min-h-dvh grid grid-cols-1 lg:grid-cols-2">
          <BrandPanel />
          <div className="w-full max-w-full flex items-center justify-center p-4 sm:p-8">
            <div className="w-full max-w-lg backdrop-blur-md bg-white/80 border border-white/30 shadow-2xl rounded-3xl p-5 sm:p-8">
              <OnboardingFlow
                onComplete={register}
                onBackToLogin={() => {
                  setMode('login');
                  setError(null);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    await login(email, password).catch(() => null);
    setSubmitting(false);
  };

  const quickLogin = async (demo) => {
    setQuickLoadingId(demo.id);
    setError(null);
    setEmail(demo.email);
    setPassword('123456');
    await login(demo.email, '123456').catch(() => null);
    setQuickLoadingId(null);
  };

  return (
    <div dir={dir} className="relative min-h-screen min-h-dvh w-full max-w-full overflow-hidden">
      <AuthBackground />
      <LangToggle onClick={toggleLang} label={t('langSwitchTo')} short={lang === 'he' ? 'EN' : 'HE'} />

      <div className="relative z-10 w-full max-w-full min-h-dvh grid grid-cols-1 lg:grid-cols-2">
        <BrandPanel />

        <div className="w-full max-w-full flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md backdrop-blur-md bg-white/80 border border-white/30 shadow-2xl rounded-3xl p-5 sm:p-8">
            <div className="lg:hidden text-center mb-5">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-indigo-600 text-white mb-2 shadow-lg shadow-indigo-500/30">
                <Home className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-semibold text-slate-900">{t('brandName')}</h1>
              <p className="text-xs text-slate-500 mt-0.5">{t('brandTagline')}</p>
            </div>

            <div className="flex rounded-xl bg-slate-100/80 p-1 mb-6 w-full">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-white text-indigo-700 shadow-sm touch-manipulation"
              >
                <LogIn className="h-4 w-4 shrink-0" />
                {t('login')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-indigo-700 touch-manipulation transition-colors"
              >
                <UserPlus className="h-4 w-4 shrink-0" />
                {t('register')}
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 w-full max-w-full">
              <div className="w-full">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('emailLabel')}</label>
                <div className="relative w-full">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    dir="ltr"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="w-full">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('passwordLabel')}</label>
                <div className="relative w-full">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••"
                    dir="ltr"
                    className={inputClass}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50/90 border border-red-200 text-red-700 text-sm px-4 py-3 break-words">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95 touch-manipulation"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    {t('loginCta')}
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-200/70 w-full max-w-full">
              <p className="text-xs font-medium text-slate-500 text-center mb-3">{t('quickLogin')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full">
                {demoUsers.map((demo) => (
                  <button
                    key={demo.id}
                    type="button"
                    onClick={() => quickLogin(demo)}
                    disabled={!!quickLoadingId}
                    className="flex sm:flex-col items-center gap-3 sm:gap-2 p-3 rounded-2xl border border-slate-200/80 bg-white/70 hover:border-indigo-300 hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer text-start sm:text-center touch-manipulation disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none w-full max-w-full min-w-0"
                  >
                    {quickLoadingId === demo.id ? (
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
                    ) : (
                      <>
                        <div className="shrink-0 rounded-2xl ring-1 ring-slate-200">
                          <AvatarFrame avatar={demo.avatar} size="md" showGlow={false} />
                        </div>
                        <div className="min-w-0 flex-1 sm:flex-none w-full">
                          <p className="text-sm font-semibold text-slate-900 break-words">{demo.name}</p>
                          <p className="text-[11px] text-slate-500 break-words">
                            {role(demo.familyRole, demo.familyRoleLabel)}
                          </p>
                          <p className="text-[11px] text-indigo-600 font-semibold">{p(demo.points)}</p>
                        </div>
                      </>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-3">{t('demoPassword')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LangToggle({ onClick, label, short }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="absolute top-4 end-4 z-30 inline-flex flex-row items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
    >
      <Globe className="h-4 w-4 shrink-0" />
      {short}
    </button>
  );
}

function BrandPanel() {
  const { t } = useI18n();
  return (
    <div className="relative hidden lg:flex flex-col justify-between overflow-hidden p-10 xl:p-14 text-white">
      <div className="relative z-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md mb-6 shadow-lg shadow-indigo-500/20">
          <Home className="h-6 w-6" />
        </div>
        <h1 className="text-4xl xl:text-5xl font-semibold tracking-tight break-words">
          {t('brandName')}
        </h1>
        <p className="mt-3 text-indigo-100/90 text-base xl:text-lg max-w-md leading-relaxed break-words">
          {t('brandTaglineLong')}
        </p>
      </div>
      <div className="relative z-10 space-y-3 text-sm text-indigo-100/80">
        <p className="break-words">✓ {t('feature1')}</p>
        <p className="break-words">✓ {t('feature2')}</p>
        <p className="break-words">✓ {t('feature3')}</p>
      </div>
    </div>
  );
}
