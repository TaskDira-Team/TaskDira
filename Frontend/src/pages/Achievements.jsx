import { useState } from "react";
import {
  Award,
  Check,
  CheckCheck,
  Flame,
  Gem,
  Leaf,
  Sparkles,
  Star,
  Target,
  Trophy,
} from "lucide-react";
import { useI18n } from "../context/I18nContext";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { ScreenShell } from "../components/ui/kit";
import "../components/ui/community.css";
import { deriveMilestoneProgress } from "../utils/milestoneProgress";

export default function Achievements() {
  const { dir, lang } = useI18n();
  const { user } = useAuth();
  const { users, tasks } = useApp();
  const en = lang === "en";
  const [filter, setFilter] = useState("all");
  const me = users.find((u) => u.id === user?.id) || user;
  const { completed: done, xp, streak } = deriveMilestoneProgress(tasks, me);
  const badges = [
    {
      id: "first",
      title: en ? "A helping hand" : "יד עוזרת",
      description: en
        ? "Complete your first household task."
        : "השלימו את המשימה הראשונה בבית.",
      value: done,
      target: 1,
      unit: en ? "tasks" : "משימות",
      Icon: Leaf,
      fill: "mint",
    },
    {
      id: "ten",
      title: en ? "Finding your rhythm" : "נכנסים לקצב",
      description: en
        ? "Bring ten household tasks over the finish line."
        : "השלימו עשר משימות בבית.",
      value: done,
      target: 10,
      unit: en ? "tasks" : "משימות",
      Icon: CheckCheck,
      fill: "coral",
    },
    {
      id: "fifty",
      title: en ? "Home, sweet teamwork" : "בית של עבודת צוות",
      description: en
        ? "Make a difference with fifty completed tasks."
        : "עשו שינוי עם חמישים משימות שהושלמו.",
      value: done,
      target: 50,
      unit: en ? "tasks" : "משימות",
      Icon: Trophy,
      fill: "gold",
    },
    {
      id: "xp100",
      title: en ? "Little spark" : "ניצוץ קטן",
      description: en
        ? "Earn your first 100 lifetime XP."
        : "צברו את 100 נקודות הניסיון הראשונות.",
      value: xp,
      target: 100,
      unit: "XP",
      Icon: Sparkles,
      fill: "lilac",
    },
    {
      id: "xp500",
      title: en ? "A shining example" : "דוגמה לכולם",
      description: en
        ? "Build your experience to 500 lifetime XP."
        : "צברו 500 נקודות ניסיון.",
      value: xp,
      target: 500,
      unit: "XP",
      Icon: Star,
      fill: "gold",
    },
    {
      id: "xp2000",
      title: en ? "Household legend" : "אגדה ביתית",
      description: en
        ? "Keep contributing and earn 2,000 lifetime XP."
        : "המשיכו לתרום וצברו 2,000 נקודות ניסיון.",
      value: xp,
      target: 2000,
      unit: "XP",
      Icon: Gem,
      fill: "lilac",
    },
    {
      id: "streak3",
      title: en ? "On a roll" : "על הגל",
      description: en
        ? "Keep an active streak of three days."
        : "שמרו על רצף פעילות של שלושה ימים.",
      value: streak,
      target: 3,
      unit: en ? "days" : "ימים",
      Icon: Flame,
      fill: "coral",
    },
    {
      id: "streak7",
      title: en ? "A week of good habits" : "שבוע של הרגלים טובים",
      description: en
        ? "Keep an active streak of seven days."
        : "שמרו על רצף פעילות של שבעה ימים.",
      value: streak,
      target: 7,
      unit: en ? "days" : "ימים",
      Icon: Target,
      fill: "mint",
    },
  ].map((b) => ({ ...b, unlocked: b.value >= b.target }));
  const unlocked = badges.filter((b) => b.unlocked).length;
  const list = badges.filter(
    (b) =>
      filter === "all" || (filter === "unlocked" ? b.unlocked : !b.unlocked),
  );
  return (
    <ScreenShell dir={dir} width="max-w-7xl" className="community-page">
      <header className="community-heading">
        <div>
          <h1>
            {en ? "Your adventure starts here!" : "ההרפתקה שלכם מתחילה כאן!"}
          </h1>
          <p>
            {en
              ? "Help at home. Earn XP. Collect your wins!"
              : "עוזרים בבית. צוברים XP. אוספים הצלחות!"}
          </p>
        </div>
        <span className="community-chip">
          <Award size={17} />
          {unlocked}/{badges.length}{" "}
          {en ? "milestones reached" : "אבני דרך שהושגו"}
        </span>
      </header>
      <section
        className="community-feature"
        style={{ background: "var(--community-lilac)" }}
      >
        <div>
          <h2>{en ? "Ready, set… collect!" : "למקומות, היכון… אוספים!"}</h2>
          <p style={{ color: "#55436c" }}>
            {en
              ? "Hop along your trail! Any win can be next."
              : "קופצים במסלול! כל הצלחה יכולה להיות הבאה."}
          </p>
        </div>
        <Award
          className="community-feature-icon"
          style={{ color: "#7560a6" }}
          aria-hidden="true"
        />
      </section>
      <div
        className="community-filters"
        aria-label={en ? "Filter milestones" : "סינון אבני דרך"}
      >
        {[
          ["all", en ? "All milestones" : "כל אבני הדרך"],
          ["unlocked", en ? "Reached" : "הושגו"],
          ["locked", en ? "Up next" : "בהמשך"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="community-milestones">
        {list.length > 1 && (
          <svg
            className="community-road"
            viewBox={`0 0 900 ${list.length * 230}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d={list
                .map((_, i) => {
                  const x = [60, 258, 402, 258][i % 4];
                  return i === 0
                    ? `M ${x} 62`
                    : `C ${[60, 258, 402, 258][(i - 1) % 4]} ${i * 230 - 40}, ${x} ${i * 230 - 40}, ${x} ${i * 230 + 62}`;
                })
                .join(" ")}
            />
          </svg>
        )}
        {list.map(
          (
            {
              id,
              title,
              description,
              value,
              target,
              unit,
              Icon,
              fill,
              unlocked: reached,
            },
            index,
          ) => (
            <article
              key={id}
              className={`community-milestone ${reached ? "is-reached" : "is-ahead"}`}
              style={{
                "--reward-fill": `var(--community-${fill})`,
                "--path-offset": `${[0, 22, 38, 22][index % 4]}%`,
              }}
            >
              <div className="community-badge">
                <Icon size={44} strokeWidth={2.6} aria-hidden="true" />
                {reached && (
                  <span className="community-sticker-check">
                    <Check size={19} />
                  </span>
                )}
              </div>
              <div className="community-milestone-copy">
                <div className="flex items-center justify-between gap-2">
                  <h2>{title}</h2>
                  {reached && (
                    <Check
                      size={20}
                      className="shrink-0 text-lime"
                      aria-label={en ? "Reached" : "הושג"}
                    />
                  )}
                </div>
                <p>{description}</p>
                <div className="mb-2 flex justify-between gap-2 text-sm">
                  <span className="community-muted">
                    {reached
                      ? en
                        ? "Reached"
                        : "הושג"
                      : en
                        ? "In progress"
                        : "בתהליך"}
                  </span>
                  <strong>
                    {Math.min(value, target).toLocaleString()} /{" "}
                    {target.toLocaleString()} {unit}
                  </strong>
                </div>
                <div
                  className="community-progress"
                  role="progressbar"
                  aria-label={title}
                  aria-valuemin={0}
                  aria-valuemax={target}
                  aria-valuenow={Math.min(value, target)}
                >
                  <span
                    style={{
                      width: `${Math.min(100, (value / target) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </article>
          ),
        )}
      </div>
      {!list.length && (
        <div className="community-empty">
          <Award size={36} />
          <h2>
            {en
              ? "Your next chapter starts with one task."
              : "הפרק הבא מתחיל במשימה אחת."}
          </h2>
          <p>
            {en
              ? "Complete a task to start collecting milestones."
              : "השלימו משימה כדי להתחיל לצבור אבני דרך."}
          </p>
        </div>
      )}
      <p className="community-note mt-6">
        {en
          ? "Milestones reflect available household records. Streaks use completion dates in your local calendar and stay active through yesterday. Missing dates cannot count toward a streak. Milestones do not grant extra coins."
          : "אבני הדרך משקפות את הרשומות הזמינות בבית. רצפים מבוססים על תאריכי השלמה בלוח המקומי ונשארים פעילים עד אתמול. רשומות ללא תאריך לא נספרות ברצף. אבני דרך אינן מעניקות מטבעות נוספים."}
      </p>
    </ScreenShell>
  );
}
