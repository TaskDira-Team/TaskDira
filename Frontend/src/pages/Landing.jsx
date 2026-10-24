import { useEffect } from "react";
import { Check, ChevronDown, Heart, Home, Leaf, Users, Wrench } from "lucide-react";
import { useI18n } from "../context/I18nContext";
import { useRoute } from "../context/RouteContext";
import "../components/landing/landing.css";
import "../components/landing/landingPage.css";

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

export default function Landing() {
  const { lang, dir, toggleLang } = useI18n();
  const { navigate } = useRoute();
  const he = lang === "he";
  const say = (h, e) => (he ? h : e);
  const reduceMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const go = (id) => {
    const target = document.getElementById(id);
    target?.scrollIntoView({
      behavior: reduceMotion() ? "instant" : "smooth",
      block: "start",
    });
    target?.focus({ preventScroll: true });
  };
  const scrollTop = () =>
    window.scrollTo({ top: 0, behavior: reduceMotion() ? "instant" : "smooth" });
  const signup = () => navigate("/register");
  const login = () => navigate("/login");
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const links = [
    ["inside", say("מה יש בפנים", "What’s inside")],
    ["who", say("למי זה מתאים", "Who it’s for")],
    ["faq", say("שאלות", "Questions")],
  ];
  const faq = [
    [
      say("זה מתאים גם לילדים קטנים?", "Can younger kids take part?"),
      say(
        "כן. יוצרים משימות שמתאימות לגיל, בוחרים יחד דמות ומגדירים פרסים שהילדים אוהבים. המבוגרים מנהלים את המשימות ואת הבית.",
        "Yes. Create age-appropriate tasks, choose a character together and set rewards your kids love. Adults manage the household and its quests.",
      ),
    ],
    [
      say("מי בוחר את המשימות והפרסים?", "Who chooses the quests and rewards?"),
      say(
        "מנהלי הבית יוצרים משימות, קובעים ניקוד ומוסיפים פרסים. כל בית בונה משחק שמתאים לשגרה שלו.",
        "Household admins create quests, set points and add rewards. Every home builds a game that fits its routine.",
      ),
    ],
    [
      say("צריך להוריד אפליקציה?", "Do I need to download an app?"),
      say(
        "לא. TaskDira עובדת בטלפון, בטאבלט ובמחשב, ישירות מהדפדפן.",
        "No. TaskDira works on your phone, tablet or computer, right in the browser.",
      ),
    ],
    [
      say(
        "מה ההבדל בין מטבעות לנקודות ניסיון?",
        "What’s the difference between coins and XP?",
      ),
      say(
        "מטבעות מוציאים בחנות הפרסים. נקודות ניסיון נשארות תמיד, ומהן נקבעים הרמה והמקום בלוח המנצחים.",
        "Coins are spent in the reward shop. XP always stays yours and decides your level and your place on the leaderboard.",
      ),
    ],
  ];
  return (
    <div className="lp" dir={dir}>
      <button className="lp-skip" onClick={() => go("main")}>
        {say("דילוג לתוכן", "Skip to content")}
      </button>
      <header className="lp-wrap lp-header">
        <button className="lp-brand" onClick={scrollTop} aria-label="TaskDira">
          <span className="lp-brand-mark">
            <Home size={28} strokeWidth={2.4} aria-hidden="true" />
          </span>
          <span dir="ltr">
            TaskDira<span className="lp-brand-dot">.</span>
          </span>
        </button>
        <nav className="lp-nav" aria-label={say("ניווט", "Navigation")}>
          {links.map(([id, label]) => (
            <button key={id} onClick={() => go(id)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="lp-actions">
          <button
            className="lp-lang"
            onClick={toggleLang}
            aria-label={he ? "Switch to English" : "מעבר לעברית"}
          >
            {he ? "EN" : "עב"}
          </button>
          <button className="lp-btn lp-btn-light" onClick={login}>
            {say("כניסה", "Sign in")}
          </button>
          <button className="lp-btn lp-btn-coral" onClick={signup}>
            {say("פותחים בית", "Start a home")}
          </button>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <section className="lp-wrap lp-hero" aria-labelledby="lp-title">
          <div className="lp-hero-copy">
            <h1 id="lp-title">
              {say("משימות קטנות.", "Little quests.")}
              <br />
              <span>{say("גיבורים גדולים!", "BIG heroes!")}</span>
            </h1>
            <p>
              {say(
                "הבית שלכם הופך למשחק. כל מטלה שווה נקודות, כל נקודה מקרבת פרס שכל המשפחה בחרה.",
                "Your home becomes a game. Every chore earns points, and every point brings a reward your whole family picked a little closer.",
              )}
            </p>
            <div className="lp-hero-buttons">
              <button className="lp-btn lp-btn-coral lp-btn-big" onClick={signup}>
                {say("קדימה, להרפתקה!", "Start the adventure!")}
              </button>
              <button className="lp-btn lp-btn-light lp-btn-big" onClick={login}>
                {say("כבר יש לנו בית", "We already have a home")}
              </button>
            </div>
          </div>
          <div className="lp-hero-art" aria-hidden="true">
            <div className="lp-hero-blob">
              <img src="/images/taskdira-house.webp" alt="" />
            </div>
            <span className="lp-float lp-float-xp">
              <span className="lp-coin">★</span>+40 XP
            </span>
            <span className="lp-float lp-float-done">
              <Check size={22} strokeWidth={3.2} />
              {say("סיימתי!", "I did it!")}
            </span>
            <img className="lp-float lp-float-pal" src="/images/dira-mascot.png" alt="" />
          </div>
        </section>

        <section className="lp-band" id="inside" tabIndex={-1}>
          <div className="lp-wrap lp-features">
            <h2 className="lp-section-title">
              {say(
                "שלושה דברים שהופכים מטלות למשחק",
                "Three things that turn chores into a game",
              )}
            </h2>

            <div className="lp-feature">
              <div className="lp-feature-art" aria-hidden="true">
                <svg className="lp-road" viewBox="0 0 500 330" preserveAspectRatio="none">
                  <path
                    d="M80 70C260 70 420 80 400 160S120 210 120 270"
                    fill="none"
                    stroke="#d9e6ee"
                    strokeWidth="28"
                    strokeLinecap="round"
                  />
                  <path
                    d="M80 70C260 70 420 80 400 160S120 210 120 270"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="5"
                    strokeDasharray="10 14"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="lp-stop lp-stop-1">
                  <Check size={40} strokeWidth={3.6} />
                </span>
                <span className="lp-stop lp-stop-2">
                  <Wrench size={42} strokeWidth={2.2} />
                </span>
                <span className="lp-stop lp-stop-3">
                  <Leaf size={40} strokeWidth={2.2} />
                </span>
                <span className="lp-stop-label">
                  {say("לתקן את הברז · +40 XP", "Fix the tap · +40 XP")}
                </span>
              </div>
              <div className="lp-feature-copy">
                <span className="lp-tag lp-tag-mint">
                  {say("דרך המשימות", "The quest road")}
                </span>
                <h3>{say("כל מטלה היא תחנה בדרך", "Every chore is a stop on the road")}</h3>
                <p>
                  {say(
                    "ההורים יוצרים משימות וקובעים כמה הן שוות. כל אחד בוחר תחנה, מסמן \"סיימתי\" ואוסף נקודות. אם צריך, מצרפים תמונה לאישור.",
                    "Grown-ups create quests and decide what each is worth. Everyone picks a stop, taps \"I did it\" and collects points. Add a photo when a check is needed.",
                  )}
                </p>
              </div>
            </div>

            <div className="lp-feature is-flipped">
              <div className="lp-feature-copy">
                <span className="lp-tag lp-tag-gold">
                  {say("חנות הפרסים", "The reward shop")}
                </span>
                <h3>{say("פרסים שהבית שלכם בחר", "Rewards your home picked")}</h3>
                <p>
                  {say(
                    "ערב פיצה, בחירת הסרט, חצי שעה מסך. אתם מחליטים מה יש בחנות וכמה מטבעות כל פרס עולה. נקודות הניסיון לא נעלמות כשקונים.",
                    "Pizza night, picking the movie, half an hour of screen time. You decide what’s in the shop and what each reward costs. XP never disappears when you spend coins.",
                  )}
                </p>
              </div>
              <div className="lp-feature-art lp-shelf" aria-hidden="true">
                <span className="lp-toy-item">
                  <span className="lp-toy lp-toy-pizza" />
                  <b>50</b>
                </span>
                <span className="lp-toy-item">
                  <span className="lp-toy lp-toy-big lp-toy-controller" />
                  <b>40</b>
                </span>
                <span className="lp-toy-item">
                  <span className="lp-toy lp-toy-popcorn" />
                  <b>30</b>
                </span>
              </div>
            </div>

            <div className="lp-feature">
              <div className="lp-feature-art lp-podium" aria-hidden="true">
                <span className="lp-podium-person">
                  <span className="lp-podium-face" style={{ background: "#bdeace", color: "#155b4c" }}>
                    {say("נ", "N")}
                  </span>
                  <span className="lp-podium-step" style={{ height: 110, background: "#dfcafa", color: "#624584" }}>
                    2
                  </span>
                </span>
                <span className="lp-podium-person">
                  <svg width="40" height="30" viewBox="0 0 40 30">
                    <path
                      d="M3 26 6 6l9 9 5-12 5 12 9-9 3 20z"
                      fill="#ffd34a"
                      stroke="#c48a00"
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span
                    className="lp-podium-face"
                    style={{ width: 80, height: 80, fontSize: 34, background: "#ffc5b3", color: "#a1352d" }}
                  >
                    {say("ק", "K")}
                  </span>
                  <span
                    className="lp-podium-step"
                    style={{ height: 160, fontSize: 56, background: "#ffe796", color: "#956001" }}
                  >
                    1
                  </span>
                </span>
                <span className="lp-podium-person">
                  <span className="lp-podium-face" style={{ background: "#ffe4b8", color: "#8a5a10" }}>
                    {say("ד", "D")}
                  </span>
                  <span
                    className="lp-podium-step"
                    style={{ height: 84, fontSize: 40, background: "#ffc5b3", color: "#a1352d" }}
                  >
                    3
                  </span>
                </span>
              </div>
              <div className="lp-feature-copy">
                <span className="lp-tag lp-tag-coral">
                  {say("לוח המנצחים", "The leaderboard")}
                </span>
                <h3>{say("רואים מי עזר, וחוגגים ביחד", "See who helped, and celebrate together")}</h3>
                <p>
                  {say(
                    "כל אחד צובר נקודות ניסיון, עולה ברמות ופותח הישגים. יעד חודשי משותף לכל הבית שומר על כולם באותו צוות.",
                    "Everyone earns XP, levels up and unlocks milestones. A shared monthly goal keeps the whole home on the same team.",
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="lp-wrap lp-section" id="who" tabIndex={-1}>
          <h2 className="lp-section-title">{say("לכל סוג של בית", "For every kind of home")}</h2>
          <div className="lp-audiences">
            <article className="lp-audience" style={{ background: "#d7f2df" }}>
              <span className="lp-audience-icon" style={{ color: "#087963" }}>
                <Users size={34} />
              </span>
              <h3>{say("הורים וילדים", "Parents and kids")}</h3>
              <p>
                {say(
                  "פרופיל לילד בלי אימייל ובלי סיסמה. ילד מתחבר מהטאבלט עם קוד שההורה מאשר.",
                  "A kid profile with no email or password. Kids join from a tablet with a code a parent approves.",
                )}
              </p>
            </article>
            <article className="lp-audience" style={{ background: "#fff3c4" }}>
              <span className="lp-audience-icon" style={{ color: "#956001" }}>
                <Home size={34} />
              </span>
              <h3>{say("שותפים לדירה", "Roommates")}</h3>
              <p>
                {say(
                  "מחלקים את הכלים, הזבל והניקיונות בצורה שכולם רואים. בלי ויכוחים על מי עשה מה.",
                  "Split the dishes, trash and cleaning where everyone can see it. No more arguing over who did what.",
                )}
              </p>
            </article>
            <article className="lp-audience" style={{ background: "#ffe4dc" }}>
              <span className="lp-audience-icon" style={{ color: "#a1352d" }}>
                <Heart size={34} />
              </span>
              <h3>{say("זוגות", "Couples")}</h3>
              <p>
                {say(
                  "רשימה משותפת אחת, פרסים קטנים שמחכים בסוף השבוע ותזכורת למי תורו.",
                  "One shared list, small rewards waiting at the weekend, and a reminder of whose turn it is.",
                )}
              </p>
            </article>
          </div>
        </section>

        <section className="lp-band" id="faq" tabIndex={-1}>
          <div className="lp-wrap lp-faq">
            <h2 className="lp-section-title">{say("טוב ששאלתם", "Glad you asked")}</h2>
            {faq.map(([question, answer], index) => (
              <details key={question} open={index === 0}>
                <summary>
                  {question}
                  <ChevronDown size={22} aria-hidden="true" />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="lp-wrap lp-section">
          <div className="lp-final">
            <img src="/images/dira-mascot.png" alt="" />
            <div className="lp-final-copy">
              <h2>
                {say("גיבורים,", "Hey, little hero.")}
                <br />
                <span>{say("ההרפתקה מחכה!", "Your adventure awaits!")}</span>
              </h2>
              <p>
                {say(
                  "פותחים בית, מזמינים את המשפחה ויוצאים למשימה הראשונה.",
                  "Start a home, invite your people and head out on the first quest.",
                )}
              </p>
              <button className="lp-btn lp-btn-yellow lp-btn-big" onClick={signup}>
                {say("קדימה, להרפתקה!", "Start the adventure!")}
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-wrap lp-footer">
        <button className="lp-brand" onClick={scrollTop} aria-label="TaskDira">
          <span dir="ltr">
            TaskDira<span className="lp-brand-dot">.</span>
          </span>
        </button>
        <nav className="lp-footer-links" aria-label={say("קישורים", "Links")}>
          {links.map(([id, label]) => (
            <button key={id} onClick={() => go(id)}>
              {label}
            </button>
          ))}
          <button onClick={login}>{say("כניסה", "Sign in")}</button>
        </nav>
      </footer>
    </div>
  );
}
