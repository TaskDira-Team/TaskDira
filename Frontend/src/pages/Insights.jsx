import { useMemo, useState } from "react";
import { Activity, CheckCheck, Sparkles, Users, Download } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useI18n } from "../context/I18nContext";
import { buildInsights } from "../utils/insights";
import PlaySelect from "../components/ui/PlaySelect";
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
        <PlaySelect
          value={member}
          onChange={setMember}
          dir={he ? "rtl" : "ltr"}
          label={he ? "סינון לפי חבר" : "Filter by member"}
          options={[
            {
              value: "",
              label: he ? "כל הבית" : "Whole household",
              icon: Users,
              tone: "mint",
            },
            ...users.map((u, index) => ({
              value: u.id,
              label: u.fullName || u.name,
              initial: (u.fullName || u.name).slice(0, 1),
              tone: ["peach", "lilac", "sky", "gold"][index % 4],
            })),
          ]}
        />
      </div>
      <div className="world-stats">
        <div className="world-stat mint">
          <CheckCheck />
          <span>{he ? "הושלמו בתקופה" : "Quests completed"}</span>
          <strong>{insight.periodDone}</strong>
        </div>
        <div className="world-stat peach">
          <Sparkles />
          <span>{he ? "ניקוד המשימות" : "Completed quest points"}</span>
          <strong>
            {insight.periodXp}
            <em>XP</em>
          </strong>
        </div>
        <div className="world-stat lavender">
          <Activity />
          <span>{he ? "מתוך כל המשימות" : "All-time task completion"}</span>
          <strong>
            {insight.completionRate}
            <em>%</em>
          </strong>
        </div>
      </div>
      <div className="insights-grid">
        <section className="world-panel">
          <h2>{he ? "הקצב של הבית" : "Your daily rhythm"}</h2>
          <ActivityChart data={insight.daily} he={he} />
        </section>
        <section className="world-panel">
          <h2>{he ? "כולם חלק מהסיפור" : "Everyone plays a part"}</h2>
          <ContributionChart data={insight.contributions} he={he} />
        </section>
        <section className="world-panel">
          <h2>
            {he ? "ממשיכים לצבור מומנטום" : "Small wins, growing momentum"}
          </h2>
          <MomentumChart data={insight.daily} he={he} />
        </section>
        <section className="world-panel">
          <h2>{he ? "מה קורה בכל פינה?" : "A little good in every corner"}</h2>
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
        <ActivityHeatmap data={history.daily} he={he} />
      </section>
    </div>
  );
}
