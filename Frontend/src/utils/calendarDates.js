// Calendar values are date-only strings. UTC arithmetic avoids DST shifting a day.
export function parseCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
    ? date
    : null;
}

export const calendarKey = (date) => date.toISOString().slice(0, 10);

export function localToday(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function addCalendarDays(value, count) {
  const date = parseCalendarDate(value);
  date.setUTCDate(date.getUTCDate() + count);
  return calendarKey(date);
}

export function shiftCalendarMonth(value, count) {
  const date = parseCalendarDate(value);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + count);
  const last = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  return calendarKey(date);
}

export function calendarMonth(value, firstDay = 0) {
  const date = parseCalendarDate(value);
  date.setUTCDate(1);
  const start = calendarKey(date);
  const offset = (date.getUTCDay() - firstDay + 7) % 7;
  const length = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return Array.from(
    { length: Math.ceil((offset + length) / 7) * 7 },
    (_, index) => addCalendarDays(start, index - offset),
  );
}

export function formatCalendarDate(value, locale, options) {
  const date = parseCalendarDate(value);
  return date
    ? new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(
        date,
      )
    : "";
}
