import { useState } from 'react';
import {
  User,
  Home,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
} from 'lucide-react';
import { FAMILY_ROLES } from '../../data/gamification';
import { DEFAULT_AVATAR_CONFIG } from '../../data/mockData';
import AvatarCreator from './AvatarCreator';
import { useI18n } from '../../context/I18nContext';

const STEP_META = [
  { id: 'profile', labelKey: 'onboard.stepProfile', icon: User },
  { id: 'household', labelKey: 'onboard.stepHousehold', icon: Home },
  { id: 'avatar', labelKey: 'onboard.stepAvatar', icon: Sparkles },
];

/**
 * Appearance only. The steps, the validation in canProceed, and the payload
 * handed to onComplete are shared by every variant on purpose — a fork of this
 * wizard would drift from the register contract the API depends on.
 */
const THEME = {
  light: {
    brandTitle: 'text-3xl font-bold text-slate-900',
    brandHint: 'text-slate-500 mt-2',
    stepActive: 'bg-indigo-600 text-white shadow-md',
    stepDone: 'bg-indigo-100 text-indigo-700',
    stepIdle: 'bg-slate-100 text-slate-500',
    connectorDone: 'bg-indigo-300',
    connectorIdle: 'bg-slate-200',
    heading: 'text-lg font-bold text-slate-900 mb-1',
    hint: 'text-sm text-slate-500 mb-4',
    label: 'block text-sm font-medium text-slate-700 mb-1.5',
    labelMuted: 'text-slate-400 font-normal',
    input:
      'w-full min-w-0 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500',
    select:
      'w-full min-w-0 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white',
    previewBox: 'rounded-xl bg-indigo-50 border border-indigo-100 p-4 mt-2',
    previewLabel: 'text-xs text-indigo-500 mb-1',
    previewText: 'font-semibold text-indigo-900 break-words',
    previewNote: 'text-xs text-indigo-600 mt-1',
    errorBox: 'mt-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3',
    footer: 'flex gap-3 mt-6 pt-4 border-t border-slate-100',
    backBtn:
      'flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors',
    primaryBtn:
      'flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded-xl transition-colors',
  },
  dark: {
    brandTitle: 'text-3xl font-black text-ink',
    brandHint: 'text-ink-dim mt-2',
    stepActive: 'bg-lime text-[#152007] shadow-md',
    stepDone: 'bg-lime/15 text-lime',
    stepIdle: 'bg-white/6 text-ink-faint',
    connectorDone: 'bg-lime/50',
    connectorIdle: 'bg-white/10',
    heading: 'text-lg font-black text-ink mb-1',
    hint: 'text-sm text-ink-dim mb-4',
    label: 'block text-sm font-bold text-ink-dim mb-1.5',
    labelMuted: 'text-ink-faint font-normal',
    input:
      'w-full min-w-0 rounded-xl border border-white/12 bg-black/30 px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-lime/60',
    select:
      'w-full min-w-0 rounded-xl border border-white/12 bg-black/30 px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-lime/60',
    previewBox: 'rounded-xl bg-lime/8 border border-lime/25 p-4 mt-2',
    previewLabel: 'text-xs text-lime/80 mb-1',
    previewText: 'font-extrabold text-ink break-words',
    previewNote: 'text-xs text-ink-dim mt-1',
    errorBox: 'mt-4 rounded-xl bg-coral/12 border border-coral/35 text-coral text-sm px-4 py-3',
    footer: 'flex gap-3 mt-6 pt-4 border-t border-white/8',
    backBtn:
      'flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/12 text-sm font-bold text-ink-dim hover:border-white/25 hover:text-ink transition-colors',
    primaryBtn:
      'flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-b from-lime to-lime-deep hover:brightness-110 disabled:opacity-40 text-[#152007] text-sm font-extrabold py-2.5 rounded-xl transition',
  },
};

export default function OnboardingFlow({ onComplete, onBackToLogin, variant = 'light' }) {
  const th = THEME[variant] ?? THEME.light;
  const { t, dir, role } = useI18n();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    fullName: '',
    familyRole: 'roommate',
    email: '',
    password: '',
    householdName: '',
    address: '',
    avatarConfig: { ...DEFAULT_AVATAR_CONFIG },
  });

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const canProceed = () => {
    if (step === 0) {
      return form.fullName.trim() && form.email.trim() && form.password.length >= 4 && form.familyRole;
    }
    if (step === 1) {
      return form.householdName.trim().length > 0;
    }
    return form.avatarConfig?.baseIconId;
  };

  const handleNext = () => {
    if (!canProceed()) return;
    setError(null);
    if (step < STEP_META.length - 1) setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError(null);
    if (step > 0) setStep((s) => s - 1);
    else onBackToLogin?.();
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onComplete({
        ...form,
        fullName: form.fullName.trim(),
        name: form.fullName.trim(),
        householdName: form.householdName.trim(),
        familyRole: form.familyRole,
        avatarState: form.avatarConfig,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const BackIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <div dir={dir} className="w-full max-w-full overflow-x-hidden">
      <div className="w-full max-w-lg min-w-0 mx-auto">
        <div className="text-center mb-6 lg:hidden">
          <h1 className={th.brandTitle}>{t('brandName')}</h1>
          <p className={th.brandHint}>{t('onboard.tagline')}</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          {STEP_META.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive ? th.stepActive : isDone ? th.stepDone : th.stepIdle
                  }`}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{t(s.labelKey)}</span>
                </div>
                {i < STEP_META.length - 1 && (
                  <div className={`w-6 h-0.5 rounded ${i < step ? th.connectorDone : th.connectorIdle}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="w-full max-w-full">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className={th.heading}>{t('onboard.profileTitle')}</h2>
              <p className={th.hint}>{t('onboard.profileHint')}</p>

              <div>
                <label className={th.label}>
                  {t('onboard.fullName')}
                </label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                  placeholder={t('onboard.fullNamePh')}
                  autoComplete="name"
                  className={th.input}
                />
              </div>

              <div>
                <label className={th.label}>
                  {t('onboard.role')}
                </label>
                <select
                  value={form.familyRole}
                  onChange={(e) => update('familyRole', e.target.value)}
                  className={th.select}
                >
                  {FAMILY_ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {role(r.id, r.label)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={th.label}>
                  {t('emailLabel')}
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="name@example.com"
                  dir="ltr"
                  className={th.input}
                />
              </div>

              <div>
                <label className={th.label}>
                  {t('passwordLabel')}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder={t('minPassword')}
                  dir="ltr"
                  minLength={4}
                  className={th.input}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className={th.heading}>{t('onboard.householdTitle')}</h2>
              <p className={th.hint}>{t('onboard.householdHint')}</p>

              <div>
                <label className={th.label}>
                  {t('onboard.householdName')}
                </label>
                <input
                  type="text"
                  value={form.householdName}
                  onChange={(e) => update('householdName', e.target.value)}
                  placeholder={t('onboard.householdPh')}
                  className={th.input}
                />
              </div>

              <div>
                <label className={th.label}>
                  {t('onboard.address')}{' '}
                  <span className={th.labelMuted}>{t('onboard.optional')}</span>
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => update('address', e.target.value)}
                  placeholder={t('onboard.addressPh')}
                  className={th.input}
                />
              </div>

              {form.householdName.trim() && (
                <div className={th.previewBox}>
                  <p className={th.previewLabel}>{t('onboard.preview')}</p>
                  <p className={th.previewText}>
                    {form.householdName.trim()}
                    {form.address.trim() ? ` — ${form.address.trim()}` : ''}
                  </p>
                  <p className={th.previewNote}>{t('onboard.adminNote')}</p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <h2 className={th.heading}>{t('onboard.avatarTitle')}</h2>
              <p className={th.hint}>{t('onboard.avatarHint')}</p>
              <AvatarCreator
                config={form.avatarConfig}
                onChange={(cfg) => update('avatarConfig', cfg)}
                variant={variant}
              />
            </div>
          )}

          {error && (
            <div className={th.errorBox}>
              {error}
            </div>
          )}

          <div className={th.footer}>
            <button
              type="button"
              onClick={handleBack}
              className={th.backBtn}
            >
              <BackIcon className="h-4 w-4" />
              {step === 0 ? t('onboard.backLogin') : t('onboard.prev')}
            </button>

            {step < STEP_META.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className={th.primaryBtn}
              >
                {t('onboard.next')}
                <NextIcon className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canProceed() || submitting}
                className={th.primaryBtn}
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {t('onboard.finish')}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
