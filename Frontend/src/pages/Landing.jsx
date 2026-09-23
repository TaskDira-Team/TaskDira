import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BedDouble,
  Check,
  ChevronDown,
  Gift,
  Globe2,
  Heart,
  Home,
  Leaf,
  Menu,
  PartyPopper,
  Pizza,
  Play,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Utensils,
  X,
} from "lucide-react";
import { useI18n } from "../context/I18nContext";
import { useRoute } from "../context/RouteContext";
import Playhouse from "../components/landing/Playhouse";
import HouseExplorer from "../components/landing/HouseExplorer";
import NarratedTour from "../components/landing/NarratedTour";
import "../components/landing/landing.css";
import "../components/landing/houseJourney.css";
import "../components/landing/landingWorld.css";

export function Brand({ onClick }) {
  return (
    <button className="td-brand" onClick={onClick} aria-label="TaskDira">
      <span className="td-brand-mark">
        <Home size={23} strokeWidth={2} aria-hidden="true" />
        <span />
      </span>
      <span dir="ltr">
        TaskDira<span className="td-brand-dot">.</span>
      </span>
    </button>
  );
}

function GameCoin({ className = "", star = false }) {
  return (
    <span className={`tw-game-coin ${className}`} aria-hidden="true">
      <span>
        {star ? (
          <Star fill="currentColor" strokeWidth={1.7} />
        ) : (
          <span>XP</span>
        )}
      </span>
      <i />
    </span>
  );
}

function ProgressPreview({ he }) {
  const [view, setView] = useState("together");
  const [selectedDay, setSelectedDay] = useState(5);
  const together = [3, 5, 4, 7, 5, 8, 4];
  const personal = [1, 2, 1, 3, 2, 4, 1];
  const values = view === "together" ? together : personal;
  const days = he
    ? ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return (
    <div className="tw-chart">
      <div className="tw-chart-heading">
        <div>
          <BarChart3 size={21} aria-hidden="true" />
          <strong>
            {he ? "לוח הניצחונות שלכם" : "Your little victory board"}
          </strong>
        </div>
        <span>{he ? "נתונים לדוגמה" : "Sample data"}</span>
      </div>
      <div
        className="tw-chart-controls"
        aria-label={he ? "תצוגת גרף לדוגמה" : "Sample chart view"}
      >
        <button
          aria-pressed={view === "together"}
          onClick={() => setView("together")}
        >
          {he ? "כל הבית" : "Everyone"}
        </button>
        <button
          aria-pressed={view === "personal"}
          onClick={() => setView("personal")}
        >
          {he ? "התרומה שלי" : "My contribution"}
        </button>
      </div>
      <p className="tw-chart-reading" aria-live="polite">
        <strong>{values[selectedDay]}</strong>{" "}
        {he ? "משימות שהושלמו" : "quests completed"}{" "}
        <span>· {days[selectedDay]}</span>
      </p>
      <div
        className="tw-chart-bars"
        role="group"
        aria-label={
          he
            ? "משימות שהושלמו לפי יום, נתונים לדוגמה"
            : "Example completed quests by day"
        }
      >
        {values.map((value, index) => (
          <button
            key={index}
            onClick={() => setSelectedDay(index)}
            aria-pressed={selectedDay === index}
            aria-label={`${days[index]}: ${value} ${he ? "משימות" : "quests"}`}
          >
            <span className="tw-bar-column">
              <i style={{ "--bar-height": `${(value / 8) * 100}%` }}>
                <b>{value}</b>
                <Star
                  className="tw-bar-star"
                  size={20}
                  fill="currentColor"
                  aria-hidden="true"
                />
              </i>
            </span>
            <span>{days[index]}</span>
          </button>
        ))}
      </div>
      <div className="tw-chart-footer">
        <span>
          <span className="tw-chart-dot" />
          {he ? "משימות שהושלמו" : "Completed quests"}
        </span>
        <span>{he ? "כל תרומה נחשבת" : "Every contribution counts"}</span>
      </div>
    </div>
  );
}

export default function Landing() {
  const { lang, dir, toggleLang } = useI18n();
  const { navigate } = useRoute();
  const he = lang === "he";
  const say = (h, e) => (he ? h : e);
  const [menu, setMenu] = useState(false);
  const [activeRoom, setActiveRoom] = useState("kitchen");
  const root = useRef(null);
  const Arrow = he ? ArrowLeft : ArrowRight;
  const scrollTop = () =>
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  const go = (id) => {
    setMenu(false);
    const target = document.getElementById(id);
    target?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
    target?.focus({ preventScroll: true });
  };
  const signup = () => navigate("/register");
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    if (!menu) return;
    const onKey = (event) => {
      if (event.key === "Escape") {
        setMenu(false);
        document.getElementById("td-menu-toggle")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);
  const rooms = {
    kitchen: {
      title: say("לפנות את המדיח", "Empty the dishwasher"),
      points: 30,
      icon: Utensils,
      name: say("מטבח", "Kitchen"),
    },
    living: {
      title: say("להשקות את העציצים", "Water the plants"),
      points: 25,
      icon: Leaf,
      name: say("סלון", "Living room"),
    },
    bedroom: {
      title: say("לסדר את המיטה", "Make the bed"),
      points: 20,
      icon: BedDouble,
      name: say("חדר שינה", "Bedroom"),
    },
  };
  const room = rooms[activeRoom];
  const RoomIcon = room.icon;
  const nav = [
    ["how", say("איך זה עובד", "How it works")],
    ["play", say("מגרש המשחקים", "The playground")],
    ["features", say("הדברים הטובים", "The good stuff")],
  ];
  return (
    <div className="td-site tw-world tw-game-world" dir={dir} ref={root}>
      <button className="td-skip" onClick={() => go("main")}>
        {say("דילוג לתוכן", "Skip to content")}
      </button>
      <header className="td-header">
        <div className="td-container td-nav">
          <Brand onClick={scrollTop} />
          <nav
            className="td-nav-links"
            aria-label={say("ניווט ראשי", "Main navigation")}
          >
            {nav.map(([id, label]) => (
              <button key={id} onClick={() => go(id)}>
                {label}
              </button>
            ))}
          </nav>
          <div className="td-nav-actions">
            <button
              className="td-lang"
              onClick={toggleLang}
              aria-label={say("Switch to English", "מעבר לעברית")}
            >
              <Globe2 size={17} aria-hidden="true" />
              <span>{he ? "EN" : "עב"}</span>
            </button>
            <button className="td-login" onClick={() => navigate("/login")}>
              {say("כניסה", "Log in")}
            </button>
            <button className="td-btn td-btn-dark td-nav-cta" onClick={signup}>
              {say("בואו נשחק!", "Let’s play!")}
              <Arrow size={17} aria-hidden="true" />
            </button>
            <button
              id="td-menu-toggle"
              className="td-menu-button"
              aria-label={say("תפריט ניווט", "Navigation menu")}
              aria-expanded={menu}
              aria-controls="td-mobile-menu"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {menu && (
          <nav
            className="td-mobile-menu"
            id="td-mobile-menu"
            aria-label={say("ניווט לנייד", "Mobile navigation")}
          >
            {nav.map(([id, label]) => (
              <button key={id} onClick={() => go(id)}>
                {label}
                <Arrow size={18} aria-hidden="true" />
              </button>
            ))}
          </nav>
        )}
      </header>
      <main id="main" tabIndex={-1}>
        <section className="tw-hero td-container" aria-labelledby="hero-title">
          <div className="tw-hero-copy">
            <h1 id="hero-title">
              {say("משימות קטנות.", "Little quests.")}
              <br />
              <span>{say("גיבורים גדולים!", "BIG heroes!")}</span>
              <Sparkles
                className="tw-title-spark"
                size={38}
                aria-hidden="true"
              />
            </h1>
            <p>
              {say(
                "הבית שלכם הפך להרפתקה!",
                "Your home just became an adventure!",
              )}
              <br />
              {say(
                "אספו נקודות, עלו ברמות ופתחו פרסים כיפיים. כל משימה קטנה היא ניצחון גדול לכל הצוות.",
                "Collect points, level up, and unlock the good stuff. Every little chore is a BIG win for your whole crew.",
              )}
            </p>
            <div className="tw-hero-actions">
              <button className="td-btn td-btn-orange" onClick={signup}>
                {say("קדימה, להרפתקה!", "Start the adventure!")}
                <Arrow size={20} aria-hidden="true" />
              </button>
              <button className="tw-play-link" onClick={() => go("play")}>
                <Play size={17} aria-hidden="true" />
                {say("לשחק בהדגמה", "Play the demo")}
              </button>
            </div>
            <div className="tw-hero-note">
              <ShieldCheck size={17} aria-hidden="true" />
              {say(
                "אפשר לשחק בהדגמה בלי להירשם",
                "Explore the demo. No sign-up needed.",
              )}
            </div>
            <div className="tw-team-note">
              <img
                className="tw-hero-pal"
                src="/images/dira-mascot.png"
                alt=""
                width="80"
                height="85"
                decoding="async"
              />
              <p>
                <strong>
                  {say(
                    "הצוות שלכם. כוחות־העל שלכם.",
                    "Your crew. Your superpowers.",
                  )}
                </strong>
                <span>
                  {say(
                    "לכל אחד יש מקום לקחת חלק.",
                    "Everyone has a part to play.",
                  )}
                </span>
              </p>
              <Heart size={26} aria-hidden="true" />
            </div>
          </div>
          <div className="tw-hero-stage">
            <div className="tw-house-label">
              <Home size={16} aria-hidden="true" />
              {say("הבית הקטן שלנו", "Our little world")}
              <span>{say("הדגמה אינטראקטיבית", "Interactive demo")}</span>
            </div>
            <div className="td-house-scene tw-house-scene">
              <HouseExplorer
                he={he}
                activeRoom={activeRoom}
                onRoomChange={setActiveRoom}
              />
              <div className="tw-hero-loot" aria-hidden="true">
                <GameCoin className="tw-coin-one" star />
                <GameCoin className="tw-coin-two" />
                <GameCoin className="tw-coin-three" star />
                <span className="tw-xp-pop">LEVEL UP!</span>
                <Sparkles className="tw-loot-spark" size={32} />
              </div>
            </div>
            <div
              className="tw-room-tabs"
              aria-label={say("גלו את חדרי הבית", "Explore the rooms")}
            >
              {Object.entries(rooms).map(([id, item]) => {
                const Icon = item.icon;
                return (
                  <button
                    key={id}
                    aria-pressed={activeRoom === id}
                    onClick={() => setActiveRoom(id)}
                  >
                    <Icon size={16} aria-hidden="true" />
                    {item.name}
                  </button>
                );
              })}
            </div>
            <button className="tw-next-quest" onClick={() => go("play")}>
              <span className={`tw-room-icon tw-room-${activeRoom}`}>
                <RoomIcon size={23} aria-hidden="true" />
              </span>
              <span>
                <small>{say("משימה לדוגמה", "A little quest to try")}</small>
                <strong>{room.title}</strong>
              </span>
              <span className="tw-xp" dir="ltr">
                <GameCoin star />+{room.points} XP
              </span>
              <Arrow size={18} aria-hidden="true" />
            </button>
          </div>
        </section>
        <div className="tw-team-strip">
          <div className="td-container">
            <span>
              {say("מוכנים?", "Ready?")}{" "}
              <strong>{say("קדימה למשחק!", "Let’s do this!")}</strong>
            </span>
            <span>
              <Check size={20} aria-hidden="true" />
              {say("משימות קטנות", "Little quests")}
            </span>
            <span>
              <Star size={20} aria-hidden="true" />
              {say("ניצחונות משותפים", "Shared wins")}
            </span>
            <span>
              <Gift size={20} aria-hidden="true" />
              {say("פרסים שאתם בוחרים", "Your kind of rewards")}
            </span>
          </div>
        </div>
        <section className="tw-how td-container" id="how" tabIndex={-1}>
          <div className="tw-section-intro">
            <h2>
              {say("כל גיבור צריך", "Every hero needs")}
              <br />
              <span>{say("הרפתקה קטנה.", "a little adventure.")}</span>
            </h2>
            <p>
              {say(
                "שלושה צעדים, צוות אחד, והמון סיבות לתת כיף.",
                "Three little steps. One awesome crew. So many reasons to high-five.",
              )}
            </p>
          </div>
          <div
            className="tw-steps"
            role="list"
            aria-label={say(
              "המסלול להרפתקה הראשונה",
              "Your first adventure path",
            )}
          >
            <article role="listitem">
              <div className="tw-step-art tw-step-home">
                <div className="tw-people" aria-hidden="true">
                  <span>👩🏻</span>
                  <span>🧑🏽</span>
                  <span>👧🏻</span>
                  <span>
                    <Plus size={24} />
                  </span>
                </div>
                <span>{say("יש מקום לכולם", "Make room for everyone")}</span>
              </div>
              <button
                className="tw-step-number"
                onClick={signup}
                aria-label={say(
                  "שלב 1: יוצרים את הצוות שלנו",
                  "Step 1: create your crew",
                )}
              >
                1<Star size={17} fill="currentColor" aria-hidden="true" />
              </button>
              <h3>{say("בוחרים את הצוות!", "Assemble your crew!")}</h3>
              <p>
                {say(
                  "מקימים בית, בוחרים אווטאר ומזמינים את המשפחה או השותפים.",
                  "Create a home, pick an avatar, and invite your family or roommates.",
                )}
              </p>
            </article>
            <article role="listitem">
              <div className="tw-step-art tw-step-quest">
                <span className="tw-demo-task">
                  <span>
                    <Check size={18} aria-hidden="true" />
                  </span>
                  {say("להשקות את העציצים", "Water the plants")}
                  <b dir="ltr">+25 XP</b>
                </span>
                <span>
                  {say(
                    "הנה, עוד משהו טוב קרה",
                    "That’s a little win right there",
                  )}
                </span>
              </div>
              <button
                className="tw-step-number"
                onClick={() => go("play")}
                aria-label={say("שלב 2: מנסים משימה", "Step 2: try a quest")}
              >
                2<Star size={17} fill="currentColor" aria-hidden="true" />
              </button>
              <h3>{say("קדימה, למשימה!", "Crush a little quest!")}</h3>
              <p>
                {say(
                  "יוצרים משימות, מחלקים את העבודה וקובעים כמה נקודות שווה כל מאמץ.",
                  "Create quests, share the work, and decide how many points each effort earns.",
                )}
              </p>
            </article>
            <article role="listitem">
              <div className="tw-step-art tw-step-reward">
                <div className="tw-pizza-token">
                  <GameCoin star />
                  <Gift size={64} strokeWidth={2.5} aria-hidden="true" />
                  <GameCoin />
                </div>
                <span>
                  {say("סיבה קטנה לחכות לערב", "Something to look forward to")}
                </span>
              </div>
              <button
                className="tw-step-number"
                onClick={() => go("play")}
                aria-label={say(
                  "שלב 3: מגלים את הפרסים בהדגמה",
                  "Step 3: discover the demo rewards",
                )}
              >
                3<Star size={17} fill="currentColor" aria-hidden="true" />
              </button>
              <h3>{say("פותחים את הפרסים!", "Unlock the good stuff!")}</h3>
              <p>
                {say(
                  "משתמשים במטבעות לפרסים שאתם בוחרים. ערב פיצה? בהחלט נחשב.",
                  "Use your coins for rewards you choose. Pizza night? Absolutely counts.",
                )}
              </p>
            </article>
          </div>
        </section>
        <section className="tw-playground" id="play" tabIndex={-1}>
          <div className="td-container">
            <div className="tw-section-intro">
              <h2>
                {say("על המקומות.", "Ready. Set.")}
                <br />
                <span>{say("היכונו. משחקים!", "Let’s play!")}</span>
              </h2>
              <div>
                <p>
                  {say(
                    "קחו את TaskDira לסיבוב. השלימו משימה, הרוויחו נקודות והציצו בחנות הפרסים.",
                    "Take TaskDira for a spin. Finish a quest, earn points, and peek inside the reward shop.",
                  )}
                </p>
                <span className="tw-demo-badge">
                  <Play size={14} aria-hidden="true" />
                  {say(
                    "הדגמה חיה שאפשר לשחק בה",
                    "A live demo you can actually play",
                  )}
                </span>
              </div>
            </div>
            <Playhouse he={he} />
            <p className="tw-demo-disclaimer">
              <ShieldCheck size={16} aria-hidden="true" />
              {say(
                "משפחה ומשימות לדוגמה. ההתקדמות נשמרת בדפדפן הזה, בנפרד מהחשבון שלכם.",
                "An example household. Demo progress stays in this browser, separate from your account.",
              )}
            </p>
          </div>
        </section>
        <section
          className="tw-features td-container"
          id="features"
          tabIndex={-1}
        >
          <div className="tw-progress-story">
            <div className="tw-story-copy">
              <BarChart3
                className="tw-story-symbol"
                size={34}
                aria-hidden="true"
              />
              <h2>
                {say("וואו, תראו אתכם!", "Look at you go!")}
                <br />
                <span>{say("עוד ניצחון קטן.", "Win after little win.")}</span>
              </h2>
              <p>
                {say(
                  "כשהתרומה של כולם נראית, קל יותר להעריך אותה. עקבו אחרי משימות שהושלמו, נקודות וההתקדמות של הבית שלכם.",
                  "When everyone’s effort is visible, it’s easier to appreciate. Follow completed quests, earned points, and your household’s progress.",
                )}
              </p>
              <span className="tw-story-tip">
                <Arrow size={18} aria-hidden="true" />
                {say(
                  "נסו להחליף תצוגה ולבחור יום בגרף",
                  "Switch the view. Pick a day. See the difference.",
                )}
              </span>
            </div>
            <ProgressPreview he={he} />
          </div>
          <div className="tw-reward-story">
            <div className="tw-reward-content">
              <Gift size={34} className="tw-story-symbol" aria-hidden="true" />
              <h2>
                {say("מטבעות מבריקים.", "Shiny coins.")}
                <br />
                <span>{say("פרסים אדירים!", "Awesome rewards!")}</span>
              </h2>
              <p>
                {say(
                  "לא עוד נקודות בלי מטרה. בנו חנות משפחתית של דברים שאוהבים: לבחור סרט, לצאת לטיול או לקחת ערב חופשי מהכלים.",
                  "Give those coins somewhere good to go. Build your own reward shop: picking the movie, a day out, or a well-earned night off dishes.",
                )}
              </p>
              <button className="tw-text-button" onClick={() => go("play")}>
                {say("לגלות את חנות ההדגמה", "Explore the demo shop")}
                <Arrow size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="tw-reward-scene">
              <GameCoin className="tw-prize-coin tw-prize-coin-one" star />
              <GameCoin className="tw-prize-coin tw-prize-coin-two" />
              <GameCoin className="tw-prize-coin tw-prize-coin-three" star />
              <div className="tw-reward-prize">
                <span className="tw-prize-glow">
                  <Pizza size={116} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <strong>{say("ערב פיצה!", "Pizza night!")}</strong>
                <span>
                  {say(
                    "פרס לדוגמה · אתם בוחרים את הפרס ואת המחיר",
                    "Example reward · You pick the prize and its price",
                  )}
                </span>
              </div>
              <span className="tw-reward-seal">
                <PartyPopper size={27} aria-hidden="true" />
                {say("יש! הרווחתם את זה!", "YAY! You earned it!")}
              </span>
            </div>
          </div>
          <div className="tw-together-story">
            <div className="tw-together-art" aria-hidden="true">
              <span>👩🏻</span>
              <span>🧒🏽</span>
              <span>🧑🏽</span>
              <Heart size={44} />
            </div>
            <div>
              <h2>
                {say("הרכיבו את", "Meet your")}{" "}
                <span>{say("צוות החלומות!", "dream team!")}</span>
              </h2>
              <p>
                {say(
                  "אווטארים אישיים, רמות ולוח משותף שנותן מקום למאמץ של כולם. קצת תחרות ידידותית, והרבה סיבות לפרגן.",
                  "Personal avatars, levels, and a shared leaderboard that gives everyone’s effort a moment. A little friendly competition. A lot to cheer for.",
                )}
              </p>
              <div className="tw-feature-notes">
                <span>
                  <Users size={18} aria-hidden="true" />
                  {say("בית אחד, כולם בפנים", "One home, everyone included")}
                </span>
                <span>
                  <Heart size={18} aria-hidden="true" />
                  {say(
                    "לכל מאמץ מגיע פרגון",
                    "Every effort deserves a high five",
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>
        <section className="tw-faq td-container" id="questions" tabIndex={-1}>
          <div>
            <h2>{say("טוב ששאלתם.", "Glad you asked.")}</h2>
            <p>
              {say(
                "עוד כמה דברים לפני שמרגישים בבית.",
                "A few things before you feel right at home.",
              )}
            </p>
          </div>
          <div className="td-faq-list">
            {[
              [
                say("זה מתאים גם לילדים קטנים?", "Can younger kids take part?"),
                say(
                  "כן. אפשר ליצור משימות קטנות שמתאימות לגיל, לבחור יחד אווטאר ולהגדיר פרסים שהילדים אוהבים. המבוגרים מנהלים את המשימות ואת הבית.",
                  "Yes. Create age-appropriate tasks, choose an avatar together, and set rewards your kids love. Adults manage the household and its quests.",
                ),
              ],
              [
                say("ומה אם אנחנו שותפים?", "What if we’re roommates?"),
                say(
                  "גם שותפים, זוגות וכל מי שחולק בית יכולים לשחק. מקימים בית ומחלקים את המשימות בדרך שמתאימה לכם.",
                  "Roommates, couples, and anyone sharing a home can play. Create a household and share the tasks your way.",
                ),
              ],
              [
                say(
                  "מי בוחר את המשימות והפרסים?",
                  "Who chooses the quests and rewards?",
                ),
                say(
                  "אתם. מנהלי הבית יוצרים משימות, קובעים ניקוד ומוסיפים פרסים. כל בית בונה משחק שמתאים לשגרה שלו.",
                  "You do. Household admins create quests, set points, and add rewards. Every home builds a game that fits its routine.",
                ),
              ],
              [
                say("צריך להוריד אפליקציה?", "Do I need to download an app?"),
                say(
                  "לא. אפשר להשתמש בטלפון, בטאבלט או במחשב, ישירות מהדפדפן.",
                  "No download needed. Use TaskDira in your phone, tablet, or desktop browser.",
                ),
              ],
              [
                say(
                  "ההדגמה משנה את החשבון שלי?",
                  "Does the playground affect my account?",
                ),
                say(
                  "לא. המשפחה, המשימות והפרסים בהדגמה הם לדוגמה. ההתקדמות נשמרת רק בדפדפן הזה, בנפרד מהחשבון.",
                  "No. The demo family, quests, and rewards are examples. Progress stays in this browser and is separate from your account.",
                ),
              ],
            ].map(([question, answer]) => (
              <details key={question}>
                <summary>
                  {question}
                  <ChevronDown size={20} aria-hidden="true" />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="tw-final">
          <div className="td-container tw-final-layout">
            <img
              className="tw-final-pal"
              src="/images/dira-mascot.png"
              alt={say(
                "החבר הקטן של TaskDira מנופף עם מטבע כוכב",
                "TaskDira’s happy little house mascot waving with a star coin",
              )}
              width="600"
              height="640"
              loading="lazy"
              decoding="async"
            />
            <div className="tw-final-copy">
              <div className="tw-final-loot" aria-hidden="true">
                <GameCoin star />
                <Star size={72} fill="currentColor" />
                <GameCoin />
              </div>
              <h2>
                {say("גיבורים,", "Hey, little hero.")}
                <br />
                <span>{say("ההרפתקה מחכה!", "Your adventure awaits!")}</span>
              </h2>
              <p>
                {say(
                  "המשימה הראשונה? פשוט להתחיל ביחד.",
                  "Your first quest? Just get started together.",
                )}
              </p>
              <button className="td-btn td-btn-cream" onClick={signup}>
                {say("קדימה, להרפתקה!", "Start the adventure!")}
                <Arrow size={21} aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      </main>
      <footer className="td-footer td-container">
        <div>
          <Brand onClick={scrollTop} />
          <p>
            {say("עושים מקום לדברים הטובים.", "Make room for the good stuff.")}
          </p>
        </div>
        <div className="td-footer-links">
          <button onClick={() => go("how")}>
            {say("איך זה עובד", "How it works")}
          </button>
          <button onClick={() => go("play")}>
            {say("נסו בעצמכם", "Try it out")}
          </button>
          <button onClick={() => go("questions")}>
            {say("שאלות ותשובות", "Good questions")}
          </button>
        </div>
        <span className="td-copyright" dir="ltr">
          © {new Date().getFullYear()} TaskDira.
          <br />
          <span>
            Made for real life. With <Heart size={12} aria-hidden="true" />.
          </span>
        </span>
      </footer>
      <NarratedTour he={he} />
    </div>
  );
}
