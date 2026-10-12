import { useId, useLayoutEffect, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  Sun,
  Sunrise,
  CalendarPlus,
} from "lucide-react";
import {
  addCalendarDays,
  calendarMonth,
  formatCalendarDate,
  localToday,
  parseCalendarDate,
  shiftCalendarMonth,
} from "../../utils/calendarDates";
import "./playDatePicker.css";

export default function PlayDatePicker({
  value,
  onChange,
  min,
  label,
  he = false,
  disabled = false,
  required = false,
}) {
  const id = useId();
  const root = useRef(null);
  const trigger = useRef(null);
  const popup = useRef(null);
  const focusDay = useRef(false);
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState(localToday);
  const [month, setMonth] = useState(localToday);
  const [position, setPosition] = useState({
    left: 0,
    top: 0,
    width: 360,
    maxHeight: 600,
    above: false,
  });
  const open = expanded && !disabled;
  const today = localToday();
  const locale = he ? "he-IL" : "en-GB";
  const dir = he ? "rtl" : "ltr";
  const firstDay = he ? 0 : 1;
  const dates = calendarMonth(month, firstDay);
  const monthKey = month.slice(0, 7);
  const previousMonth = shiftCalendarMonth(`${monthKey}-01`, -1);
  const canGoBack = !min || previousMonth.slice(0, 7) >= min.slice(0, 7);
  const hasPopover =
    typeof HTMLElement !== "undefined" &&
    "showPopover" in HTMLElement.prototype;
  const weekdayDates = Array.from({ length: 7 }, (_, index) =>
    addCalendarDays("2026-10-11", index + firstDay),
  );
  const Next = he ? ChevronLeft : ChevronRight;
  const Previous = he ? ChevronRight : ChevronLeft;
  const allowed = (date) => !!parseCalendarDate(date) && (!min || date >= min);
  const clamp = (date) => (min && date < min ? min : date);
  const close = (restore = false) => {
    setExpanded(false);
    if (restore) trigger.current?.focus({ preventScroll: true });
  };
  const show = () => {
    if (disabled) return;
    const initial = clamp(parseCalendarDate(value) ? value : today);
    setActive(initial);
    setMonth(initial);
    focusDay.current = true;
    setExpanded(true);
  };
  const choose = (date) => {
    if (!allowed(date)) return;
    onChange(date);
    close(true);
  };

  useEffect(() => {
    if (disabled) setExpanded(false);
  }, [disabled]);
  useEffect(() => {
    if (!open) return;
    const outside = (event) => {
      if (
        !root.current?.contains(event.target) &&
        !popup.current?.contains(event.target)
      )
        close();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const panel = popup.current;
    if (hasPopover) panel.showPopover();
    const place = () => {
      const bounds = trigger.current.getBoundingClientRect();
      const viewport = window.visualViewport;
      const left = viewport?.offsetLeft || 0,
        top = viewport?.offsetTop || 0;
      const width = viewport?.width || document.documentElement.clientWidth;
      const height = viewport?.height || window.innerHeight;
      const popupWidth = Math.min(360, width - 24);
      panel.style.width = `${popupWidth}px`;
      const popupHeight = Math.min(panel.scrollHeight, height - 24);
      const below = top + height - bounds.bottom - 20;
      const above = bounds.top - top - 20;
      const upward = below < popupHeight && above > below;
      setPosition({
        width: popupWidth,
        maxHeight: height - 24,
        above: upward,
        left: Math.max(
          left + 12,
          Math.min(
            he ? bounds.left : bounds.right - popupWidth,
            left + width - popupWidth - 12,
          ),
        ),
        top: Math.max(
          top + 12,
          Math.min(
            upward ? bounds.top - popupHeight - 8 : bounds.bottom + 8,
            top + height - popupHeight - 12,
          ),
        ),
      });
    };
    place();
    const resize = new ResizeObserver(place);
    resize.observe(trigger.current);
    resize.observe(panel);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    window.visualViewport?.addEventListener("resize", place);
    window.visualViewport?.addEventListener("scroll", place);
    return () => {
      resize.disconnect();
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      window.visualViewport?.removeEventListener("resize", place);
      window.visualViewport?.removeEventListener("scroll", place);
      if (hasPopover && panel.matches(":popover-open")) panel.hidePopover();
    };
  }, [open, he, hasPopover]);

  useLayoutEffect(() => {
    if (open && focusDay.current) {
      popup.current
        ?.querySelector(`[data-day="${active}"]`)
        ?.focus({ preventScroll: true });
      focusDay.current = false;
    }
  }, [open, active, month]);

  const navigateMonth = (step) => {
    const next = clamp(shiftCalendarMonth(active, step));
    setActive(next);
    setMonth(next);
  };
  const calendarKeys = (event, date) => {
    let next;
    const weekday = (parseCalendarDate(date).getUTCDay() - firstDay + 7) % 7;
    switch (event.key) {
      case "ArrowLeft":
        next = addCalendarDays(date, he ? 1 : -1);
        break;
      case "ArrowRight":
        next = addCalendarDays(date, he ? -1 : 1);
        break;
      case "ArrowUp":
        next = addCalendarDays(date, -7);
        break;
      case "ArrowDown":
        next = addCalendarDays(date, 7);
        break;
      case "Home":
        next = addCalendarDays(date, -weekday);
        break;
      case "End":
        next = addCalendarDays(date, 6 - weekday);
        break;
      case "PageUp":
        next = shiftCalendarMonth(date, event.shiftKey ? -12 : -1);
        break;
      case "PageDown":
        next = shiftCalendarMonth(date, event.shiftKey ? 12 : 1);
        break;
      default:
        return;
    }
    event.preventDefault();
    next = clamp(next);
    focusDay.current = true;
    setActive(next);
    setMonth(next);
  };
  const shortcuts = [
    [today, Sun, he ? "היום" : "Today"],
    [addCalendarDays(today, 1), Sunrise, he ? "מחר" : "Tomorrow"],
    [addCalendarDays(today, 7), CalendarPlus, he ? "בעוד שבוע" : "In a week"],
  ];
  const calendar = open && (
    <div
      ref={popup}
      id={`${id}-calendar`}
      className="play-calendar"
      role="dialog"
      aria-label={he ? "בוחרים יום לפרס" : "Choose a reward day"}
      dir={dir}
      popover={hasPopover ? "manual" : undefined}
      data-above={position.above}
      style={{
        left: position.left,
        top: position.top,
        width: position.width,
        maxHeight: position.maxHeight,
      }}
      onKeyDownCapture={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          close(true);
        }
      }}
    >
      <header className="play-calendar-header">
        <button
          type="button"
          disabled={!canGoBack}
          onClick={() => navigateMonth(-1)}
          aria-label={he ? "החודש הקודם" : "Previous month"}
        >
          <Previous size={20} />
        </button>
        <h3 id={`${id}-month`} aria-live="polite">
          {formatCalendarDate(month, locale, {
            month: "long",
            year: "numeric",
          })}
        </h3>
        <button
          type="button"
          onClick={() => navigateMonth(1)}
          aria-label={he ? "החודש הבא" : "Next month"}
        >
          <Next size={20} />
        </button>
      </header>
      <div
        role="grid"
        className="play-calendar-grid"
        aria-labelledby={`${id}-month`}
      >
        <div role="row" className="play-calendar-weekdays">
          {weekdayDates.map((date) => (
            <span
              role="columnheader"
              key={date}
              aria-label={formatCalendarDate(date, locale, { weekday: "long" })}
            >
              {he
                ? formatCalendarDate(date, locale, { weekday: "narrow" })
                : formatCalendarDate(date, locale, { weekday: "short" })}
            </span>
          ))}
        </div>
        {Array.from({ length: dates.length / 7 }, (_, week) => (
          <div role="row" className="play-calendar-week" key={week}>
            {dates.slice(week * 7, week * 7 + 7).map((date) => (
              <span role="gridcell" key={date} aria-selected={date === value}>
                <button
                  type="button"
                  data-day={date}
                  disabled={!allowed(date)}
                  tabIndex={date === active ? 0 : -1}
                  aria-label={formatCalendarDate(date, locale, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  aria-current={date === today ? "date" : undefined}
                  className={`play-calendar-day${date === value ? " is-selected" : ""}${date.slice(0, 7) !== monthKey ? " is-adjacent" : ""}`}
                  onKeyDown={(event) => calendarKeys(event, date)}
                  onClick={() => choose(date)}
                >
                  {Number(date.slice(8))}
                  {date === value && <Check size={10} aria-hidden="true" />}
                </button>
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="play-calendar-shortcuts">
        {shortcuts.map(([date, Icon, title]) => (
          <button
            key={date}
            type="button"
            disabled={!allowed(date)}
            onClick={() => choose(date)}
          >
            <Icon size={16} />
            {title}
          </button>
        ))}
      </div>
      <footer className="play-calendar-footer">
        <span>
          <i />
          {he ? "היום" : "Today"}
        </span>
        <button type="button" onClick={() => close(true)}>
          {he ? "סגירה" : "Close"}
        </button>
      </footer>
    </div>
  );

  return (
    <div className="play-date-picker" ref={root} dir={dir}>
      <span id={`${id}-label`} className="sr-only">
        {label}
      </span>
      {required && (
        <span id={`${id}-required`} className="sr-only">
          {he ? "יש לבחור תאריך" : "Choose a date before saving"}
        </span>
      )}
      <button
        type="button"
        ref={trigger}
        className="play-date-trigger"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? `${id}-calendar` : undefined}
        aria-labelledby={`${id}-label ${id}-value`}
        aria-describedby={required ? `${id}-required` : undefined}
        onClick={() => (open ? close() : show())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            show();
          }
        }}
      >
        <span className="play-date-icon">
          <CalendarDays size={22} aria-hidden="true" />
        </span>
        <span id={`${id}-value`}>
          {parseCalendarDate(value)
            ? formatCalendarDate(value, locale, {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : he
              ? "בוחרים יום משמח"
              : "Pick a happy day"}
        </span>
        {value && (
          <Check className="play-date-check" size={17} aria-hidden="true" />
        )}
      </button>
      {hasPopover
        ? calendar
        : calendar && createPortal(calendar, document.body)}
    </div>
  );
}
