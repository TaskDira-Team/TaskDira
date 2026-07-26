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

const STEPS = [
  { id: 'profile', label: 'פרטים אישיים', icon: User },
  { id: 'household', label: 'הדירה / המשפחה', icon: Home },
  { id: 'avatar', label: 'עיצוב Avatar', icon: Sparkles },
];

export default function OnboardingFlow({ onComplete, onBackToLogin }) {
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
    if (step < STEPS.length - 1) setStep((s) => s + 1);
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

  return (
    <div className="min-h-screen min-h-dvh w-full overflow-x-hidden flex items-center justify-center p-4">
      <div className="w-full max-w-lg min-w-0">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white">TaskDira</h1>
          <p className="text-indigo-200 mt-2">עושים סדר בבית בכיף 🏠✨</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-white text-indigo-700 shadow-md'
                      : isDone
                        ? 'bg-white/30 text-white'
                        : 'bg-white/10 text-indigo-200'
                  }`}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-6 h-0.5 rounded ${i < step ? 'bg-white/60' : 'bg-white/20'}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="backdrop-blur-md bg-white/95 shadow-2xl rounded-3xl border border-white/20 p-6 sm:p-8 max-h-[85vh] overflow-y-auto overflow-x-hidden">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 mb-1">פרטים אישיים</h2>
              <p className="text-sm text-slate-500 mb-4">ספרו לנו מי אתם בבית</p>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">שם מלא</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                  placeholder="לדוגמה: יוסי כהן"
                  autoComplete="name"
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">תפקיד בדירה / משפחה</label>
                <select
                  value={form.familyRole}
                  onChange={(e) => update('familyRole', e.target.value)}
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {FAMILY_ROLES.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">אימייל</label>
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
                <label className="block text-sm font-medium text-slate-700 mb-1.5">סיסמה</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="לפחות 4 תווים"
                  dir="ltr"
                  minLength={4}
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 mb-1">שם הדירה / המשפחה</h2>
              <p className="text-sm text-slate-500 mb-4">
                כל המשימות, החברים והנקודות יישמרו רק בקבוצה הזו
              </p>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  שם הדירה / המשפחה
                </label>
                <input
                  type="text"
                  value={form.householdName}
                  onChange={(e) => update('householdName', e.target.value)}
                  placeholder='לדוגמה: "משפחת ספרינט", "דירת שותפים אלנבי 4"'
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  כתובת <span className="text-slate-400 font-normal">(אופציונלי)</span>
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => update('address', e.target.value)}
                  placeholder="דירת זוגות רוטשילד / כתובת"
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {form.householdName.trim() && (
                <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 mt-2">
                  <p className="text-xs text-indigo-500 mb-1">תצוגה מקדימה:</p>
                  <p className="font-semibold text-indigo-900 break-words">
                    {form.householdName.trim()}
                    {form.address.trim() ? ` — ${form.address.trim()}` : ''}
                  </p>
                  <p className="text-xs text-indigo-600 mt-1">מי שיוצר את הדירה יהיה מנהל הקבוצה 🛡️</p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900 mb-1">עיצוב Avatar אישי</h2>
              <p className="text-sm text-slate-500 mb-4">בחרו אייקון, צבע ותג שמייצגים אתכם</p>
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
              <ChevronRight className="h-4 w-4" />
              {step === 0 ? 'חזרה להתחברות' : 'הקודם'}
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
              >
                הבא
                <ChevronLeft className="h-4 w-4" />
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
                    סיום והתחלה!
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
