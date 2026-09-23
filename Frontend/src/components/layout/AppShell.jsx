import GrowCrew from "../household/GrowCrew";
import { useEffect, useState } from "react";
import {
  Home,
  LayoutDashboard,
  ListTodo,
  ChartNoAxesCombined,
  Trophy,
  Gift,
  Medal,
  Users,
  Globe2,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Volume2,
  VolumeX,
  Sprout,
  Coins,
  Star,
} from "lucide-react";
import { useI18n } from "../../context/I18nContext";
import { useAuth } from "../../context/AuthContext";
import { useRoute } from "../../context/RouteContext";
import { useApp } from "../../context/AppContext";
import FloatingPoints from "../ui/FloatingPoints";
import ToastContainer from "../ui/ToastContainer";
import { IS_DEMO_MODE } from "../../services/config";
import useDialogFocus from "../../hooks/useDialogFocus";
import "../../world.css";
import "../../game-world.css";

const items = [
  ["/", LayoutDashboard, "Play home", "מבט על הבית"],
  ["/tasks", ListTodo, "Quest road", "המשימות שלנו"],
  ["/insights", ChartNoAxesCombined, "Power stats", "ההתקדמות שלנו"],
  ["/rewards", Gift, "Reward shop", "חנות הפרסים"],
  ["/leaderboard", Trophy, "Team stars", "לוח המנצחים"],
  ["/achievements", Medal, "Badge trail", "ההישגים שלנו"],
  ["/household", Users, "My team", "האנשים שלנו"],
];

export default function AppShell({ children }) {
  const { lang, dir, toggleLang } = useI18n();
  const { user, logout } = useAuth();
  const { path, navigate } = useRoute();
  const {
    household,
    users,
    loading,
    loadError,
    refreshData,
    soundOn,
    toggleSound,
    toasts,
    dismissToast,
    xpBursts,
    dismissXpBurst,
  } = useApp();
  const [playersOpen, setPlayersOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [compact, setCompact] = useState(
    () => window.matchMedia("(max-width: 1023px)").matches,
  );
  const menuRef = useDialogFocus(compact && menu, () => setMenu(false));
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const change = () => setCompact(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  const he = lang === "he";
  const me = users.find((u) => u.id === user?.id) || user;
  const active = items.find((item) => item[0] === path);
  const go = (destination) => {
    setMenu(false);
    navigate(destination);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  useEffect(() => {
    if (!menu) return;
    const onKey = (event) => {
      if (event.key === "Escape") setMenu(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menu]);
  return (
    <div className="world-app" dir={dir}>
      <a
        className="world-skip"
        href="#workspace"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("workspace")?.focus();
        }}
      >
        {he ? "דילוג לתוכן" : "Skip to content"}
      </a>
      {menu && (
        <button
          className="world-sidebar-backdrop"
          aria-label={he ? "סגירת תפריט" : "Close navigation"}
          onClick={() => setMenu(false)}
        />
      )}
      <aside
        ref={menuRef}
        inert={compact && !menu}
        role={compact ? "dialog" : undefined}
        aria-modal={compact && menu ? true : undefined}
        aria-label={he ? "ניווט" : "Navigation"}
        tabIndex={-1}
        className={`world-sidebar ${menu ? "is-open" : ""}`}
        id="world-navigation"
      >
        <div className="world-brand-row">
          <button
            className="world-brand"
            onClick={() => go("/")}
            aria-label="TaskDira"
          >
            <span>
              <Home size={24} />
            </span>
            TaskDira<span className="world-brand-dot">.</span>
          </button>
          <button
            className="world-mobile-close world-icon-button"
            onClick={() => setMenu(false)}
            aria-label={he ? "סגירת תפריט" : "Close navigation"}
          >
            <X size={20} />
          </button>
        </div>
        <button
          className="world-household-selector"
          onClick={() => go("/household")}
        >
          <span className="world-household-icon">
            <Sprout size={20} />
          </span>
          <span>
            <strong>
              {household?.displayName ||
                household?.name ||
                (he ? "הבית שלנו" : "Our little home")}
            </strong>
            <small>
              {users.length} {he ? "אנשים, קבוצה אחת" : "people, one team"}
            </small>
          </span>
          <ChevronRight size={16} className="direction-arrow" />
        </button>
        <nav
          aria-label={he ? "ניווט ראשי" : "Main navigation"}
          className="world-nav"
        >
          {items.map(([href, Icon, en, heb]) => (
            <button
              key={href}
              onClick={() => go(href)}
              aria-current={path === href ? "page" : undefined}
            >
              <Icon size={20} strokeWidth={1.8} />
              <span>{he ? heb : en}</span>
              {path === href && <span className="world-active-dot" />}
            </button>
          ))}
        </nav>
        <div className="world-sidebar-note">
          <img src="/images/dira-mascot.png" alt="" />
          <strong>{he ? "בית טוב, ביחד." : "You’ve got this!"}</strong>
          <p>
            {he ? "כל משימה קטנה עושה הבדל." : "Tiny chores. Giant adventures."}
          </p>
        </div>
        <div className="world-sidebar-bottom">
          <button
            className="world-profile-link"
            onClick={() => go("/profile")}
            aria-current={path === "/profile" ? "page" : undefined}
          >
            <span className="world-person-avatar">
              {(me?.fullName || me?.name || "?").slice(0, 1)}
            </span>
            <span>
              <strong>{me?.fullName || me?.name}</strong>
              <small>{he ? "הפינה שלי" : "My character"}</small>
            </span>
            <ChevronRight size={16} className="direction-arrow" />
          </button>
          <button className="world-logout" onClick={logout}>
            <LogOut size={17} />
            {he ? "יציאה מהבית" : "Log out"}
          </button>
        </div>
      </aside>
      <div className="world-workspace" inert={compact && menu}>
        <GrowCrew
          open={playersOpen}
          onClose={() => setPlayersOpen(false)}
          initialMode="play"
        />
        <header className="world-topbar">
          <div>
            <button
              className="world-menu-button world-icon-button"
              aria-label={he ? "פתיחת תפריט" : "Open navigation"}
              aria-expanded={menu}
              aria-controls="world-navigation"
              onClick={() => setMenu(!menu)}
            >
              <Menu size={21} />
            </button>
            <Home size={17} />
            <span className="world-breadcrumb-divider">/</span>
            <strong>
              {active ? active[he ? 3 : 2] : he ? "הפרופיל שלי" : "My profile"}
            </strong>
          </div>
          <div>
            {(me?.isAdmin || me?.isManagedProfile) && (
              <button
                className="family-shell-player"
                disabled={!me.isManagedProfile && (loading || !household?.id)}
                aria-label={
                  me.isManagedProfile
                    ? he
                      ? "\u05db\u05e0\u05d9\u05e1\u05ea \u05d4\u05d5\u05e8\u05d4"
                      : "Parent sign in"
                    : he
                      ? "\u05de\u05d9 \u05de\u05e9\u05d7\u05e7?"
                      : "Who is playing?"
                }
                onClick={async () => {
                  if (me.isManagedProfile) {
                    await logout();
                    window.location.hash = "/login";
                    window.location.reload();
                  } else setPlayersOpen(true);
                }}
              >
                <Users size={17} />
                <span>
                  {me.isManagedProfile
                    ? he
                      ? "\u05db\u05e0\u05d9\u05e1\u05ea \u05d4\u05d5\u05e8\u05d4"
                      : "Parent sign in"
                    : he
                      ? "\u05de\u05d9 \u05de\u05e9\u05d7\u05e7?"
                      : "Who’s playing?"}
                </span>
              </button>
            )}
            <div
              className="game-wallet"
              aria-label={he ? "הארנק שלי" : "My game wallet"}
            >
              <span title={he ? "מטבעות זמינים" : "Spendable coins"}>
                <i className="mini-coin" aria-hidden="true">
                  ★
                </i>
                <b key={`coins-${me?.balance ?? 0}`}>{me?.balance ?? 0}</b>
                <small>{he ? "מטבעות" : "coins"}</small>
              </span>
              <span title={he ? "ניסיון כולל" : "Lifetime experience"}>
                <Star size={19} fill="currentColor" />
                <b key={`xp-${me?.points ?? 0}`}>{me?.points ?? 0}</b>
                <small>XP</small>
              </span>
            </div>
            <button
              className="world-icon-button"
              onClick={toggleSound}
              aria-label={
                soundOn
                  ? he
                    ? "כיבוי צלילים"
                    : "Mute sounds"
                  : he
                    ? "הפעלת צלילים"
                    : "Enable sounds"
              }
              aria-pressed={soundOn}
            >
              {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button
              className="world-language"
              onClick={toggleLang}
              aria-label={he ? "Switch to English" : "מעבר לעברית"}
            >
              <Globe2 size={16} />
              {he ? "EN" : "עב"}
            </button>
          </div>
        </header>
        {IS_DEMO_MODE && (
          <div className="world-preview-banner">
            {he
              ? "בית לדוגמה · נתונים להמחשה בלבד · שינויים מתאפסים ברענון"
              : "Sample household · Family setup stays in this browser; other demo changes reset on refresh"}
          </div>
        )}
        <main id="workspace" className="world-main" tabIndex={-1}>
          {loadError ? (
            <div role="alert" className="world-empty">
              <h1>
                {he
                  ? "לא הצלחנו לפתוח את הבית"
                  : "We couldn’t load your household"}
              </h1>
              <p>{loadError}</p>
              <button
                className="world-button"
                onClick={() => refreshData().catch(() => {})}
              >
                {he ? "ניסיון נוסף" : "Try again"}
              </button>
            </div>
          ) : loading ? (
            <div className="world-loading" role="status">
              <Home size={40} />
              <h2>
                {he ? "מכינים את הבית שלכם…" : "Waking up your little world…"}
              </h2>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
      <nav
        inert={compact && menu}
        className="world-bottom-nav"
        aria-label={he ? "קיצורי דרך" : "Quick navigation"}
      >
        {items.slice(0, 4).map(([href, Icon, en, heb]) => (
          <button
            key={href}
            onClick={() => go(href)}
            aria-current={path === href ? "page" : undefined}
          >
            <Icon size={21} />
            <span>{he ? heb : en}</span>
          </button>
        ))}
        <button onClick={() => setMenu(!menu)} aria-expanded={menu}>
          <Menu size={21} />
          <span>{he ? "עוד" : "More"}</span>
        </button>
      </nav>
      <div className="world-toast-region" role="status">
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
      <FloatingPoints bursts={xpBursts} onDone={dismissXpBurst} />
    </div>
  );
}
