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

export default function OnboardingFlow({ onComplete, onBackToLogin }) {
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
          <h1 className="text-3xl font-bold text-slate-900">{t('brandName')}</h1>
          <p className="text-slate-500 mt-2">{t('onboard.tagline')}</p>
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
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md'
                      : isDone
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{t(s.labelKey)}</span>
                </div>
                {i < STEP_META.length - 1 && (
                  <div className={`w-6 h-0.5 rounded ${i < step ? 'bg-indigo-300' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="w-full max-w-full">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 mb-1">{t('onboard.profileTitle')}</h2>
              <p className="text-sm text-slate-500 mb-4">{t('onboard.profileHint')}</p>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t('onboard.fullName')}
                </label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                  placeholder={t('onboard.fullNamePh')}
                  autoComplete="name"
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t('onboard.role')}
                </label>
                <select
                  value={form.familyRole}
                  onChange={(e) => update('familyRole', e.target.value)}
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {FAMILY_ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {role(r.id, r.label)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t('emailLabel')}
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="name@example.com"
                  dir="ltr"
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t('passwordLabel')}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder={t('minPassword')}
                  dir="ltr"
                  minLength={4}
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 mb-1">{t('onboard.householdTitle')}</h2>
              <p className="text-sm text-slate-500 mb-4">{t('onboard.householdHint')}</p>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t('onboard.householdName')}
                </label>
                <input
                  type="text"
                  value={form.householdName}
                  onChange={(e) => update('householdName', e.target.value)}
                  placeholder={t('onboard.householdPh')}
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t('onboard.address')}{' '}
                  <span className="text-slate-400 font-normal">{t('onboard.optional')}</span>
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => update('address', e.target.value)}
                  placeholder={t('onboard.addressPh')}
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {form.householdName.trim() && (
                <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 mt-2">
                  <p className="text-xs text-indigo-500 mb-1">{t('onboard.preview')}</p>
                  <p className="font-semibold text-indigo-900 break-words">
                    {form.householdName.trim()}
                    {form.address.trim() ? ` — ${form.address.trim()}` : ''}
                  </p>
                  <p className="text-xs text-indigo-600 mt-1">{t('onboard.adminNote')}</p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900 mb-1">{t('onboard.avatarTitle')}</h2>
              <p className="text-sm text-slate-500 mb-4">{t('onboard.avatarHint')}</p>
              <AvatarCreator
                config={form.avatarConfig}
                onChange={(cfg) => update('avatarConfig', cfg)}
              />
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <BackIcon className="h-4 w-4" />
              {step === 0 ? t('onboard.backLogin') : t('onboard.prev')}
            </button>

            {step < STEP_META.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
              >
                {t('onboard.next')}
                <NextIcon className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canProceed() || submitting}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
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
