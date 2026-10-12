import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Shapes } from "lucide-react";
import "./playSelect.css";

// A select-only combobox: focus stays on the button while arrows explore options.
// Native popovers escape scrolling dialogs without leaving their accessible tree.
export default function PlaySelect({
  id: providedId,
  value,
  onChange,
  options,
  label,
  placeholder = "",
  disabled = false,
  required = false,
  dir = "ltr",
  className = "",
}) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const root = useRef(null);
  const trigger = useRef(null);
  const popup = useRef(null);
  const list = useRef(null);
  const typeahead = useRef({ text: "", time: 0 });
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState(-1);
  const [position, setPosition] = useState({
    left: 0,
    top: 0,
    width: 250,
    height: 360,
    above: false,
  });
  const selected = options.findIndex(
    (option) => String(option.value) === String(value),
  );
  const first = options.findIndex((option) => !option.disabled);
  const unavailable = disabled || first < 0;
  const open = expanded && !unavailable;
  const current = options[selected];
  const focused = options[active] && !options[active].disabled ? active : first;
  const hasPopover =
    typeof HTMLElement !== "undefined" &&
    "showPopover" in HTMLElement.prototype;

  useEffect(() => {
    if (unavailable) setExpanded(false);
  }, [unavailable]);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event) => {
      if (
        !root.current?.contains(event.target) &&
        !popup.current?.contains(event.target)
      )
        setExpanded(false);
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("focusin", dismiss);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("focusin", dismiss);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const panel = popup.current;
    if (hasPopover) panel.showPopover();
    const place = () => {
      const bounds = trigger.current.getBoundingClientRect();
      const viewport = window.visualViewport;
      const edge = 12;
      const viewportTop = viewport?.offsetTop || 0;
      const viewportLeft = viewport?.offsetLeft || 0;
      const viewportWidth =
        viewport?.width || document.documentElement.clientWidth;
      const viewportHeight = viewport?.height || window.innerHeight;
      const width = Math.min(
        Math.max(bounds.width, 250),
        viewportWidth - edge * 2,
      );
      panel.style.width = `${width}px`;
      const desired = Math.min(360, list.current.scrollHeight + 16);
      const below = viewportTop + viewportHeight - bounds.bottom - edge - 8;
      const above = bounds.top - viewportTop - edge - 8;
      const upward = below < desired && above > below;
      const height = Math.max(60, Math.min(desired, upward ? above : below));
      setPosition({
        width,
        height,
        above: upward,
        left: Math.max(
          viewportLeft + edge,
          Math.min(
            dir === "rtl" ? bounds.left : bounds.right - width,
            viewportLeft + viewportWidth - width - edge,
          ),
        ),
        top: upward
          ? Math.max(viewportTop + edge, bounds.top - height - 8)
          : bounds.bottom + 8,
      });
    };
    place();
    const resize = new ResizeObserver(place);
    resize.observe(trigger.current);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    window.visualViewport?.addEventListener("resize", place);
    window.visualViewport?.addEventListener("scroll", place);
    return () => {
      resize.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      window.visualViewport?.removeEventListener("resize", place);
      window.visualViewport?.removeEventListener("scroll", place);
      if (hasPopover && panel.matches(":popover-open")) panel.hidePopover();
    };
  }, [open, dir, hasPopover, options.length]);

  useLayoutEffect(() => {
    if (!open) return;
    const option = list.current?.children[focused];
    if (!option) return;
    const top = option.offsetTop,
      bottom = top + option.offsetHeight;
    if (top < list.current.scrollTop) list.current.scrollTop = top;
    else if (bottom > list.current.scrollTop + list.current.clientHeight)
      list.current.scrollTop = bottom - list.current.clientHeight;
  }, [open, focused, position.height]);

  const show = (
    index = selected >= 0 && !options[selected].disabled ? selected : first,
  ) => {
    if (unavailable) return;
    typeahead.current = { text: "", time: 0 };
    setActive(index);
    setExpanded(true);
  };
  const choose = (index) => {
    if (!options[index] || options[index].disabled) return;
    onChange(String(options[index].value));
    setExpanded(false);
  };
  const onKeyDown = (event) => {
    const { key } = event;
    if (key === "Tab") {
      setExpanded(false);
      return;
    }
    if (key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      setExpanded(false);
      return;
    }
    if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(key)) {
      event.preventDefault();
      if (key === "Enter" || key === " ") {
        open ? choose(focused) : show();
        return;
      }
      if (key === "Home" || key === "End") {
        const index =
          key === "Home"
            ? first
            : options.findLastIndex((option) => !option.disabled);
        open ? setActive(index) : show(index);
        return;
      }
      if (!open) {
        show();
        return;
      }
      const step = key === "ArrowDown" ? 1 : -1;
      for (let distance = 1; distance <= options.length; distance++) {
        const index =
          (focused + step * distance + options.length) % options.length;
        if (!options[index].disabled) {
          setActive(index);
          break;
        }
      }
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
      const index = options.findIndex(
        (option) =>
          !option.disabled && option.label.toLocaleLowerCase().startsWith(text),
      );
      if (index >= 0) {
        event.preventDefault();
        setExpanded(true);
        setActive(index);
      }
    }
  };
  const icon = (option, size = 22) => {
    const Icon = option?.icon || Shapes;
    return (
      <span
        className={`play-select-icon play-select-tone-${option?.tone || "mint"}`}
        aria-hidden="true"
      >
        {option?.initial ? (
          <span className="play-select-initial">{option.initial}</span>
        ) : (
          <Icon size={size} />
        )}
      </span>
    );
  };
  const menu = open && (
    <span
      ref={popup}
      className="play-select-menu"
      popover={hasPopover ? "manual" : undefined}
      dir={dir}
      data-above={position.above}
      style={{ left: position.left, top: position.top, width: position.width }}
      onPointerDown={(event) => event.preventDefault()}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <span
        ref={list}
        id={`${id}-options`}
        role="listbox"
        className="play-select-options"
        aria-label={label}
        style={{ maxHeight: position.height - 16 }}
      >
        {options.map((option, index) => (
          <span
            key={option.value}
            id={`${id}-option-${index}`}
            role="option"
            aria-selected={index === selected}
            aria-disabled={option.disabled || undefined}
            className={`play-select-option${focused === index ? " is-highlighted" : ""}`}
            onPointerMove={() => {
              if (!option.disabled) setActive(index);
            }}
            onClick={() => choose(index)}
          >
            {icon(option)}
            <span className="play-select-text">{option.label}</span>
            <Check size={18} className="play-select-check" aria-hidden="true" />
          </span>
        ))}
      </span>
    </span>
  );

  return (
    <span className={`play-select ${className}`} ref={root} dir={dir}>
      <span id={`${id}-label`} className="sr-only">
        {label}
      </span>
      <button
        id={id}
        ref={trigger}
        type="button"
        className="play-select-trigger"
        role="combobox"
        disabled={unavailable}
        aria-required={required || undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-options` : undefined}
        aria-labelledby={`${id}-label ${id}-value`}
        aria-activedescendant={open ? `${id}-option-${focused}` : undefined}
        onClick={() => (open ? setExpanded(false) : show())}
        onKeyDownCapture={onKeyDown}
      >
        {icon(current, 21)}
        <span id={`${id}-value`} className="play-select-text">
          {current?.label ?? placeholder}
        </span>
        <ChevronDown
          className="play-select-chevron"
          size={18}
          aria-hidden="true"
        />
      </button>
      {hasPopover ? menu : menu && createPortal(menu, document.body)}
    </span>
  );
}
