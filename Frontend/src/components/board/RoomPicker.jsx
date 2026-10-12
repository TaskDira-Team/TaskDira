import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import {
  Armchair,
  BedDouble,
  Check,
  ChevronDown,
  Home,
  ListTodo,
  Utensils,
} from "lucide-react";
import "./roomPicker.css";

const rooms = [
  ["all", Home, "Every room", "כל החדרים"],
  ["kitchen", Utensils, "Kitchen", "מטבח"],
  ["living", Armchair, "Living room", "סלון"],
  ["room", BedDouble, "Bedroom", "חדר שינה"],
  ["other", ListTodo, "Around the house", "ברחבי הבית"],
];

export default function RoomPicker({ value, onChange, he }) {
  const id = useId();
  const root = useRef(null);
  const menu = useRef(null);
  const typeahead = useRef({ text: "", time: 0 });
  const selected = Math.max(
    0,
    rooms.findIndex(([key]) => key === value),
  );
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(selected);
  const [position, setPosition] = useState({ above: false, height: 360 });
  const [, Icon, en, heb] = rooms[selected];
  const label = he ? "סינון לפי חדר" : "Filter by room";

  useEffect(() => {
    if (!open) return;
    const dismiss = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const bounds = root.current.getBoundingClientRect();
      const below = window.innerHeight - bounds.bottom - 16;
      const above = bounds.top - 16;
      const upward = below < 320 && above > below;
      setPosition({
        above: upward,
        height: Math.max(100, Math.min(360, upward ? above : below)),
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  const show = (index = selected) => {
    typeahead.current = { text: "", time: 0 };
    setActive(index);
    setOpen(true);
  };
  const choose = (index) => {
    onChange(rooms[index][0]);
    setOpen(false);
  };
  const highlight = (index) => {
    setActive(index);
    // Scroll only the options, never jump the mission page to a focused item.
    const option = menu.current?.children[index];
    if (option) {
      const top = option.offsetTop;
      const bottom = top + option.offsetHeight;
      if (top < menu.current.scrollTop) menu.current.scrollTop = top;
      else if (bottom > menu.current.scrollTop + menu.current.clientHeight)
        menu.current.scrollTop = bottom - menu.current.clientHeight;
    }
  };
  const onKeyDown = (event) => {
    const { key } = event;
    if (key === "Tab") {
      setOpen(false);
      return;
    }
    if (key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      return;
    }
    if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(key)) {
      event.preventDefault();
      if (key === "Enter" || key === " ") {
        open ? choose(active) : show();
        return;
      }
      if (key === "Home" || key === "End") {
        const index = key === "Home" ? 0 : rooms.length - 1;
        open ? highlight(index) : show(index);
        return;
      }
      if (!open) {
        show();
        return;
      }
      highlight(
        (active + (key === "ArrowDown" ? 1 : -1) + rooms.length) % rooms.length,
      );
    } else if (
      key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      const now = Date.now();
      const text =
        (now - typeahead.current.time < 700 ? typeahead.current.text : "") +
        key.toLocaleLowerCase();
      typeahead.current = { text, time: now };
      const index = rooms.findIndex((room) =>
        room[he ? 3 : 2].toLocaleLowerCase().startsWith(text),
      );
      if (index >= 0) {
        event.preventDefault();
        setOpen(true);
        highlight(index);
      }
    }
  };

  return (
    <div
      className="room-picker"
      ref={root}
      dir={he ? "rtl" : "ltr"}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <span id={`${id}-label`} className="sr-only">
        {label}
      </span>
      <button
        type="button"
        className="room-picker-trigger"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-options`}
        aria-labelledby={`${id}-label ${id}-value`}
        aria-activedescendant={open ? `${id}-option-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
      >
        <span className={`room-picker-icon room-picker-icon-${value}`}>
          <Icon size={21} aria-hidden="true" />
        </span>
        <span id={`${id}-value`}>{he ? heb : en}</span>
        <ChevronDown
          className="room-picker-chevron"
          size={18}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="room-picker-menu" data-above={position.above}>
          <div
            className="room-picker-options"
            ref={menu}
            id={`${id}-options`}
            role="listbox"
            aria-labelledby={`${id}-label`}
            style={{ maxHeight: position.height - 16 }}
          >
            {rooms.map(([key, RoomIcon, english, hebrew], index) => (
              <div
                key={key}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={key === value}
                className={`room-picker-option${active === index ? " is-highlighted" : ""}`}
                onPointerMove={() => setActive(index)}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => choose(index)}
              >
                <span className={`room-picker-icon room-picker-icon-${key}`}>
                  <RoomIcon size={22} aria-hidden="true" />
                </span>
                <span>{he ? hebrew : english}</span>
                <Check
                  size={18}
                  className="room-picker-check"
                  aria-hidden="true"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
