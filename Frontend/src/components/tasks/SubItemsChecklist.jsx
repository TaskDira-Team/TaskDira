import { Plus, Trash2, Check } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

export default function SubItemsChecklist({
  items = [],
  onToggle,
  onChange,
  editable = false,
  dense = false,
}) {
  const { t, dir, tx } = useI18n();
  const list = Array.isArray(items) ? items : [];

  const updateText = (id, text) => {
    if (!onChange) return;
    onChange(list.map((i) => (i.id === id ? { ...i, text } : i)));
  };

  const removeItem = (id) => {
    if (!onChange) return;
    onChange(list.filter((i) => i.id !== id));
  };

  const addItem = () => {
    if (!onChange) return;
    onChange([
      ...list,
      { id: `si-new-${Date.now()}`, text: '', isCompleted: false },
    ]);
  };

  if (!editable && list.length === 0) return null;

  return (
    <div className={`w-full max-w-full overflow-x-hidden ${dense ? 'space-y-1.5' : 'space-y-2'}`}>
      {!editable && list.length > 0 && (
        <p className="text-[11px] font-medium text-slate-500">
          {t('listLabel')} · {list.filter((i) => i.isCompleted).length}/{list.length}
        </p>
      )}
      <ul className="space-y-1.5 w-full max-w-full">
        {list.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-2 w-full max-w-full min-w-0 rounded-xl border border-slate-200/80 bg-white px-2.5 py-2"
          >
            <button
              type="button"
              onClick={() => onToggle?.(item.id, !item.isCompleted)}
              disabled={editable && !onToggle}
              className={`shrink-0 w-6 h-6 rounded-md border flex items-center justify-center touch-manipulation transition-colors ${
                item.isCompleted
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'border-slate-300 bg-white text-transparent hover:border-indigo-400'
              }`}
              aria-label={item.isCompleted ? t('status.done') : t('markDone')}
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            {editable ? (
              <input
                type="text"
                value={item.text}
                onChange={(e) => updateText(item.id, e.target.value)}
                placeholder={t('itemPlaceholder')}
                className="flex-1 min-w-0 text-sm bg-transparent focus:outline-none text-slate-800"
                dir={dir}
              />
            ) : (
              <span
                className={`flex-1 min-w-0 text-sm break-words ${
                  item.isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
                }`}
              >
                {tx(item.text)}
              </span>
            )}
            {editable && (
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 touch-manipulation"
                aria-label={t('remove')}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>
      {editable && (
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 touch-manipulation py-1"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('addItem')}
        </button>
      )}
    </div>
  );
}
