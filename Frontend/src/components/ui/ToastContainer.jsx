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
        const emoji = toast.message.match(/^(\p{Extended_Pictographic}️?)\s*/u);
        const text = emoji ? toast.message.slice(emoji[0].length) : toast.message;
        return (
          <div
            key={toast.id}
            onClick={() => onDismiss?.(toast.id)}
            className={`td-toast td-toast-${toast.type || 'info'} toast-enter pointer-events-auto flex items-start gap-3 rounded-xl border px-3 py-2.5 shadow-lg backdrop-blur-sm ${styles[toast.type] || styles.info}`}
          >
            {emoji && <span className="td-toast-emoji" aria-hidden="true">{emoji[1]}</span>}
            <Icon className={`td-toast-icon h-5 w-5 shrink-0 mt-0.5 ${iconStyles[toast.type] || iconStyles.info}`} />
            <p className="td-toast-text text-sm font-medium flex-1 min-w-0 truncate" title={toast.message}>
              {text}
            </p>
            <button
              type="button"
              onClick={(event) => { event.stopPropagation(); onDismiss?.(toast.id); }}
              className="td-toast-x shrink-0 opacity-60 hover:opacity-100 transition-opacity touch-manipulation p-0.5"
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
