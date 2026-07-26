import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Sparkles, X, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { processAssistantMessage } from '../../services/assistantBot';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';

const QUICK = [
  { label: 'תוסיף לקניות', text: 'תוסיף לקניות: חלב, לחם, גבינה עד יום חמישי' },
  { label: 'סיימתי לשטוף כלים', text: 'סיימתי לשטוף כלים' },
  { label: 'מה הניקוד של הבית?', text: 'מה הניקוד של הבית?' },
  { label: 'מתי ניקוי סלון?', text: 'מתי המשימה של ניקוי סלון?' },
];

const MUTATING = new Set([
  'created',
  'completed',
  'deleted',
  'grocery_updated',
  'household_score',
  'score',
  'tasks_for_user',
]);

export default function HouseholdAssistant() {
  const { syncUser } = useAuth();
  const { refreshData, addToast } = useApp();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingCreate, setPendingCreate] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'bot',
      text: 'שלום! אני מחובר למשימות ולנקודות של הבית בזמן אמת 🤖\nנסו: תוסיף משימה / סיימתי… / מה הניקוד של הבית?',
    },
  ]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, busy]);

  const applyResult = useCallback(
    async (result) => {
      setMessages((prev) => [
        ...prev,
        { id: `b-${Date.now()}`, role: 'bot', text: result.reply },
      ]);

      if (result.clearPending) {
        setPendingCreate(null);
        setPendingDelete(null);
      }
      if (result.type === 'need_assignee' && result.data?.pendingCreate) {
        setPendingCreate(result.data.pendingCreate);
        setPendingDelete(null);
      }
      if (result.type === 'need_pin' && result.data?.pendingDelete) {
        setPendingDelete(result.data.pendingDelete);
        setPendingCreate(null);
      }

      if (MUTATING.has(result.type)) {
        await refreshData?.();
        await syncUser?.();
      }
      if (
        result.type === 'created' ||
        result.type === 'completed' ||
        result.type === 'deleted' ||
        result.type === 'grocery_updated'
      ) {
        addToast?.(result.reply.split('\n')[0], result.type === 'deleted' ? 'warning' : 'success');
      }
    },
    [refreshData, syncUser, addToast]
  );

  const send = async (raw) => {
    const text = (raw ?? input).trim();
    if (!text || busy) return;
    setInput('');
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text }]);
    setBusy(true);
    try {
      const session = {
        pendingCreate,
        pendingDelete,
      };
      const result = await processAssistantMessage(text, session);
      await applyResult(result);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: 'bot', text: err.message || 'משהו השתבש, נסו שוב.' },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const placeholder = pendingDelete
    ? 'הזינו PIN (דמו: 1234)…'
    : pendingCreate
      ? 'למי לשייך? Ofek / Refael / Amit / פתוחה…'
      : 'כתבו פקודה…';

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-x-hidden max-w-full">
      <motion.button
        type="button"
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen(true)}
        className={`pointer-events-auto absolute bottom-4 left-4 z-40 flex items-center gap-2 max-w-[calc(100vw-2rem)] rounded-2xl bg-slate-900 text-white px-4 py-3 shadow-lg shadow-slate-900/25 touch-manipulation ${
          open ? 'invisible' : ''
        }`}
        aria-label={t('assistantTitle')}
      >
        <Sparkles className="h-5 w-5 text-amber-300 shrink-0" />
        <Bot className="h-5 w-5 shrink-0" />
        <span className="text-sm font-medium whitespace-nowrap hidden sm:inline truncate">
          {t('assistantTitle')}
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label={t('close')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-auto absolute inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px] md:bg-slate-950/20"
              onClick={() => setOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-label={t('assistantTitle')}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ type: 'spring', damping: 24, stiffness: 320 }}
              className="pointer-events-auto absolute bottom-4 left-4 z-50 flex flex-col w-[min(100vw-2rem,22rem)] max-w-[calc(100vw-2rem)] h-[min(70vh,28rem)] max-h-[calc(100dvh-2rem)] rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 overflow-x-hidden overflow-y-hidden"
              dir="rtl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-2 px-4 py-3 bg-slate-900 text-white shrink-0 min-w-0">
                <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                  <Sparkles className="h-4 w-4 text-amber-300 shrink-0" />
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-sm font-semibold truncate">{t('assistantTitle')} 🤖</p>
                    <p className="text-[10px] text-slate-300 truncate">
                      {pendingDelete
                        ? 'ממתין ל־PIN'
                        : pendingCreate
                          ? 'ממתין לשיוך'
                          : 'משימות חיות · API'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 touch-manipulation shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-2 bg-slate-50 min-w-0 w-full max-w-full">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex min-w-0 ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[90%] min-w-0 rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                        m.role === 'user'
                          ? 'bg-slate-900 text-white rounded-se-md'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-ss-md'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {busy && (
                  <div className="flex justify-end">
                    <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3 py-2 text-xs text-slate-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      מעדכן…
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="shrink-0 border-t border-slate-100 bg-white px-3 pt-2 pb-2 w-full max-w-full overflow-x-hidden">
                {!pendingCreate && !pendingDelete && (
                  <div className="flex flex-nowrap overflow-x-auto w-full max-w-full no-scrollbar whitespace-nowrap gap-1.5 py-1 mb-2">
                    {QUICK.map((q) => (
                      <button
                        key={q.label}
                        type="button"
                        disabled={busy}
                        onClick={() => send(q.text)}
                        className="shrink-0 text-[11px] font-medium px-2.5 py-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 touch-manipulation disabled:opacity-50"
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                )}
                {pendingCreate && (
                  <div className="flex flex-nowrap overflow-x-auto w-full no-scrollbar gap-1.5 py-1 mb-2">
                    {['Ofek', 'Refael', 'Amit', 'פתוחה לכולם'].map((name) => (
                      <button
                        key={name}
                        type="button"
                        disabled={busy}
                        onClick={() => send(name)}
                        className="shrink-0 text-[11px] font-medium px-2.5 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 touch-manipulation"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
                <form
                  className="flex items-center gap-2 min-w-0 w-full max-w-full"
                  onSubmit={(e) => {
                    e.preventDefault();
                    send();
                  }}
                >
                  <input
                    type={pendingDelete ? 'password' : 'text'}
                    inputMode={pendingDelete ? 'numeric' : 'text'}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={placeholder}
                    disabled={busy}
                    className="flex-1 min-w-0 max-w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-60"
                    dir="rtl"
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={busy || !input.trim()}
                    className="shrink-0 p-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 touch-manipulation"
                    aria-label="שלח"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
