import { CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

const icons = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
};

const styles = {
  success: 'bg-emerald-50/95 border-emerald-200 text-emerald-800',
  info: 'bg-sky-50/95 border-sky-200 text-sky-800',
  warning: 'bg-amber-50/95 border-amber-200 text-amber-800',
};

const iconStyles = {
  success: 'text-emerald-500',
  info: 'text-sky-500',
  warning: 'text-amber-500',
};

export default function ToastContainer({ toasts, onDismiss }) {
  const { t } = useI18n();
  if (toasts.length === 0) return null;

  return (
    <div className="absolute bottom-20 start-3 end-3 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const Icon = icons[toast.type] || Info;
        return (
          <div
            key={toast.id}
            className={`toast-enter pointer-events-auto flex items-start gap-3 rounded-xl border px-3 py-2.5 shadow-lg backdrop-blur-sm ${styles[toast.type] || styles.info}`}
          >
            <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${iconStyles[toast.type] || iconStyles.info}`} />
            <p className="text-sm font-medium flex-1 min-w-0 truncate" title={toast.message}>
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => onDismiss?.(toast.id)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity touch-manipulation p-0.5"
              aria-label={t('close')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
