function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function getDueStatus(dueAt, taskStatus, lang = 'he') {
  if (!dueAt || taskStatus === 'Done' || taskStatus === 'done') {
    return { type: 'none', label: null, className: '' };
  }

  const due = new Date(dueAt);
  const now = new Date();
  const dueDay = startOfDay(due);
  const today = startOfDay(now);
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const diffMs = due.getTime() - now.getTime();
  const en = lang === 'en';

  if (diffMs < 0 || diffDays < 0) {
    return {
      type: 'overdue',
      label: en ? '⏰ Overdue' : '⏰ באיחור',
      className: 'bg-red-100 text-red-700 border-red-200',
    };
  }

  if (diffDays === 0) {
    return {
      type: 'today',
      label: en ? '📅 Today' : '📅 היום',
      className: 'bg-amber-100 text-amber-800 border-amber-200',
    };
  }

  if (diffDays === 1) {
    return {
      type: 'tomorrow',
      label: en ? '⏳ Tomorrow' : '⏳ מחר',
      className: 'bg-sky-100 text-sky-800 border-sky-200',
    };
  }

  if (diffDays === 2) {
    return {
      type: 'in2days',
      label: en ? '⏳ In 2 days' : '⏳ בעוד 2 ימים',
      className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
  }

  if (diffDays > 2 && diffDays <= 7) {
    return {
      type: 'upcoming',
      label: en ? `⏳ In ${diffDays} days` : `⏳ בעוד ${diffDays} ימים`,
      className: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  }

  return {
    type: 'scheduled',
    label: null,
    className: 'bg-slate-50 text-slate-600 border-slate-200/80',
  };
}

export function formatDueDateTime(dueAt, lang = 'he') {
  if (!dueAt) return null;

  const due = new Date(dueAt);
  const now = new Date();
  const dueDay = startOfDay(due);
  const today = startOfDay(now);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const locale = lang === 'en' ? 'en-US' : 'he-IL';

  const timeStr = due.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  if (dueDay.getTime() === today.getTime()) {
    return lang === 'en' ? `Today at ${timeStr}` : `היום ב-${timeStr}`;
  }
  if (dueDay.getTime() === tomorrow.getTime()) {
    return lang === 'en' ? `Tomorrow at ${timeStr}` : `מחר ב-${timeStr}`;
  }

  const dateStr = due.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  return lang === 'en' ? `${dateStr} at ${timeStr}` : `${dateStr} ב-${timeStr}`;
}

export function toDatetimeLocalValue(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocalValue(value) {
  if (!value) return null;
  return new Date(value).toISOString();
}

export function parseHebrewDuePhrase(text, fromDate = new Date()) {
  if (!text) return null;
  const t = text.trim();
  const base = new Date(fromDate);
  const setDay = (daysAhead, hour = 18) => {
    const d = new Date(base);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + daysAhead);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };

  if (/היום/i.test(t) || /\btoday\b/i.test(t)) return setDay(0, 20);
  if (/מחר/i.test(t) || /\btomorrow\b/i.test(t)) return setDay(1, 18);

  const weekdays = [
    { re: /יום\s*ראשון|ראשון/i, day: 0 },
    { re: /יום\s*שני|שני/i, day: 1 },
    { re: /יום\s*שלישי|שלישי/i, day: 2 },
    { re: /יום\s*רביעי|רביעי/i, day: 3 },
    { re: /יום\s*חמישי|חמישי/i, day: 4 },
    { re: /יום\s*שישי|שישי/i, day: 5 },
    { re: /שבת/i, day: 6 },
  ];

  for (const { re, day } of weekdays) {
    if (re.test(t)) {
      const current = base.getDay();
      let delta = day - current;
      if (delta <= 0) delta += 7;
      return setDay(delta, 18);
    }
  }

  const iso = t.match(/(\d{4}-\d{2}-\d{2})/);
  if (iso) return new Date(`${iso[1]}T18:00:00`).toISOString();

  return null;
}

export function enrichTask(task, lang = 'he') {
  const dueAt = task.dueAt || task.dueDate;
  const dueStatus = getDueStatus(dueAt, task.status, lang);
  return {
    ...task,
    dueAt,
    dueLabel: dueAt ? formatDueDateTime(dueAt, lang) : null,
    dueStatus,
    dueBadgeLabel: dueStatus.label,
  };
}
