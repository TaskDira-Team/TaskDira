import { useState } from 'react';
import { X, Save, Loader2, Volume2, VolumeX, Star } from 'lucide-react';
import AvatarCreator from '../onboarding/AvatarCreator';
import { useI18n } from '../../context/I18nContext';

export default function ProfileSettingsModal({
  user,
  onSave,
  onClose,
  soundOn = true,
  onToggleSound,
}) {
  const [avatarConfig, setAvatarConfig] = useState(user.avatarConfig);
  const [submitting, setSubmitting] = useState(false);
  const { t, p, dir } = useI18n();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave({ avatarConfig });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden"
        dir={dir}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold text-slate-900">{t('profileSettings')}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-5 w-full max-w-full">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500 mb-0.5">{t('pointsBalance')}</p>
            <p className="text-lg font-bold text-slate-900 inline-flex items-center gap-1.5">
              <Star className="h-4 w-4 text-amber-500" />
              {p(user.balance ?? user.points ?? 0)}
            </p>
          </div>

          {onToggleSound && (
            <button
              type="button"
              onClick={onToggleSound}
              className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50 touch-manipulation"
            >
              <span className="flex items-center gap-2">
                {soundOn ? (
                  <Volume2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <VolumeX className="h-4 w-4 text-slate-400" />
                )}
                {t('soundEffects')}
              </span>
              <span className={`text-xs font-bold ${soundOn ? 'text-emerald-600' : 'text-slate-400'}`}>
                {soundOn ? t('on') : t('off')}
              </span>
            </button>
          )}

          <AvatarCreator config={avatarConfig} onChange={setAvatarConfig} />
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-colors"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {t('saveChanges')}
          </button>
        </form>
      </div>
    </div>
  );
}
