import { useMemo, useState } from "react";
import { Activity, CheckCheck, Sparkles, Users, Download } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useI18n } from "../context/I18nContext";
import { buildInsights } from "../utils/insights";
import {
  ActivityChart,
  ContributionChart,
  WorkloadChart,
  MomentumChart,
  ActivityHeatmap,
} from "../components/insights/HouseholdCharts";

export default function Insights() {
  const { tasks, users } = useApp();
  const { lang, category } = useI18n();
  const he = lang === "he";
  const [days, setDays] = useState(7);
  const [member, setMember] = useState("");
  const insight = useMemo(
    () => buildInsights(tasks, users, days, new Date(), member || undefined),
    [tasks, users, days, member],
  );
  const history = useMemo(
    () => buildInsights(tasks, users, 84, new Date(), member || undefined),
    [tasks, users, member],
  );
  const exportCsv = () => {
    const csv = [
      "Date,Completed quests,Quest points",
      ...insight.daily.map((d) => `${d.key},${d.count},${d.xp}`),
    ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "taskdira-activity.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <div className="world-page insights-page">
      <div className="world-page-heading">
        <div>
          <h1>{he ? "תראו כמה עשינו ביחד." : "Look what we did together."}</h1>
          <p>
            {he
              ? "הסיפור של הבית שלכם, במספרים קטנים ומשמעותיים."
              : "The little things add up. Here’s your household’s story."}
          </p>
        </div>
        <button className="world-button secondary" onClick={exportCsv}>
          <Download size={17} />
          {he ? "ייצוא נתונים" : "Export data"}
        </button>
      </div>
      <div className="insights-filters">
        <div
          className="world-switch"
          aria-label={he ? "תקופת הדוח" : "Report period"}
        >
          {[7, 30, 90].map((n) => (
            <button
              key={n}
              aria-pressed={days === n}
              onClick={() => setDays(n)}
            >
              {n} {he ? "ימים" : "days"}
            </button>
          ))}
        </div>
        <label>
          <Users size={17} />
          <span className="sr-only">
            {he ? "סינון לפי חבר" : "Filter by member"}
          </span>
          <select value={member} onChange={(e) => setMember(e.target.value)}>
            <option value="">{he ? "כל הבית" : "Whole household"}</option>
            {users.map((u) => (
              <option value={u.id} key={u.id}>
                {u.fullName || u.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="world-stats">
        <div className="world-stat mint">
          <CheckCheck />
          <span>{he ? "הושלמו בתקופה" : "Quests completed"}</span>
          <strong>{insight.periodDone}</strong>
          <small>
            {days} {he ? "הימים האחרונים" : "days of little wins"}
          </small>
        </div>
        <div className="world-stat peach">
          <Sparkles />
          <span>{he ? "ניקוד המשימות" : "Completed quest points"}</span>
          <strong>
            {insight.periodXp}
            <em>XP</em>
          </strong>
          <small>
            {he ? "לפי ניקוד המשימות הנוכחי" : "Based on current quest values"}
          </small>
        </div>
        <div className="world-stat lavender">
          <Activity />
          <span>{he ? "מתוך כל המשימות" : "All-time task completion"}</span>
          <strong>
            {insight.completionRate}
            <em>%</em>
          </strong>
          <small>
            {insight.completed} / {insight.total}{" "}
            {he ? "משימות קיימות" : "current quests"}
          </small>
        </div>
      </div>
      <div className="insights-grid">
        <section className="world-panel">
          <h2>{he ? "הקצב של הבית" : "Your daily rhythm"}</h2>
          <p>
            {he
              ? "כל עמודה היא עוד יום של עשייה."
              : "Every bar is another day of showing up."}
          </p>
          <ActivityChart data={insight.daily} he={he} />
        </section>
        <section className="world-panel">
          <h2>{he ? "כולם חלק מהסיפור" : "Everyone plays a part"}</h2>
          <p>
            {he
              ? "משימות שהושלמו בתקופה שנבחרה."
              : "Contributions in the selected period."}
          </p>
          <ContributionChart data={insight.contributions} he={he} />
        </section>
        <section className="world-panel">
          <h2>
            {he ? "ממשיכים לצבור מומנטום" : "Small wins, growing momentum"}
          </h2>
          <p>
            {he
              ? "ניקוד מצטבר של משימות שהושלמו בתקופה."
              : "Cumulative quest points in this period."}
          </p>
          <MomentumChart data={insight.daily} he={he} />
        </section>
        <section className="world-panel">
          <h2>{he ? "מה קורה בכל פינה?" : "A little good in every corner"}</h2>
          <p>
            {he
              ? "מצב כל המשימות לפי קטגוריה."
              : "Current workload across every category."}
          </p>
          <WorkloadChart
            data={insight.categories}
            categoryLabel={category}
            he={he}
          />
        </section>
      </div>
      <section className="world-panel">
        <h2>
          {he ? "יום ועוד יום. ופתאום, הרגל." : "Day by day. Then, a habit."}
        </h2>
        <p>
          {he
            ? "כל ריבוע מספר על יום קטן של התקדמות."
            : "A calendar of your household’s little wins."}
        </p>
        <ActivityHeatmap data={history.daily} he={he} />
      </section>
      <p className="world-data-note">
        {he
          ? "הגרפים מבוססים על משימות זמינות ותאריכי השלמה. משימות שנמחקו אינן כלולות. ניקוד משימות אינו יתרת המטבעות או דוח תנועות היסטורי."
          : "Charts use available quests and completion dates. Deleted quests are not included. Quest points are not your spendable balance or a historical transaction ledger."}
        {insight.missingHistory > 0 &&
          ` ${insight.missingHistory} ${he ? "משימות ללא תאריך השלמה לא נכללו בגרפי הזמן." : "quests without completion dates are excluded from time charts."}`}
      </p>
    </div>
  );
}
