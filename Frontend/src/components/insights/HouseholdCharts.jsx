import { useId, useState } from "react";
import { BarChart3, TrendingUp } from "lucide-react";

const colours = [
  "#17675c",
  "#c65035",
  "#7560a6",
  "#976500",
  "#276c9a",
  "#526963",
];

export function ActivityChart({ data, he, compact = false }) {
  const [metric, setMetric] = useState("count");
  const [active, setActive] = useState(null);
  const max = Math.max(1, ...data.map((d) => d[metric]));
  const locale = he ? "he-IL" : "en-GB";
  const caption =
    metric === "count"
      ? he
        ? "משימות שהושלמו"
        : "Completed quests"
      : he
        ? "ניקוד משימות שהושלמו"
        : "Completed quest points";
  return (
    <div className={`activity-chart ${compact ? "is-compact" : ""}`}>
      <div className="chart-toolbar">
        <span>
          <span className="chart-key" />
          {caption}
        </span>
        <div
          className="world-switch"
          aria-label={he ? "מדד הגרף" : "Chart metric"}
        >
          <button
            aria-pressed={metric === "count"}
            onClick={() => setMetric("count")}
          >
            {he ? "משימות" : "Quests"}
          </button>
          <button
            aria-pressed={metric === "xp"}
            onClick={() => setMetric("xp")}
          >
            XP
          </button>
        </div>
      </div>
      <div className="chart-scroll" dir="ltr">
        <div
          className="activity-plot"
          style={{
            minWidth: data.length > 7 ? data.length * 30 + 35 : undefined,
          }}
        >
          <div className="chart-scale" aria-hidden="true">
            <span>{max}</span>
            <span>{Math.round(max / 2)}</span>
            <span>0</span>
          </div>
          <div className="chart-columns" style={{ "--columns": data.length }}>
            {data.map((day, i) => (
              <div className="chart-column" key={day.key}>
                <button
                  className={`chart-bar ${active === i ? "is-active" : ""}`}
                  style={{
                    "--bar-height": `${(day[metric] / max) * 100}%`,
                    "--bar-colour":
                      i === data.length - 1 ? "#c65035" : "#17675c",
                  }}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={(event) => {
                    if (document.activeElement !== event.currentTarget)
                      setActive(null);
                  }}
                  onClick={() => setActive(i)}
                  aria-label={`${day.date.toLocaleDateString(locale)}: ${day[metric]} ${caption}`}
                >
                  <span className="chart-bar-fill" />
                  {(active === i || data.length <= 7) && (
                    <span className="chart-value">{day[metric]}</span>
                  )}
                </button>
                <span className="chart-day">
                  {data.length <= 7
                    ? day.date.toLocaleDateString(locale, { weekday: "short" })
                    : i % 5 === 0 || i === data.length - 1
                      ? day.date.getDate()
                      : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {data.length > 7 && (
        <p className="chart-note">
          {he
            ? "גללו את הגרף כדי לראות כל יום."
            : "Scroll the chart to explore each day."}
        </p>
      )}
      {!data.some((d) => d[metric] > 0) && (
        <p className="chart-note">
          {he
            ? "השלימו משימה כדי להתחיל לראות את ההתקדמות כאן."
            : "Complete a quest to start your story here."}
        </p>
      )}
      <p className="chart-note">
        {active === null || !data[active]
          ? he
            ? "בחרו עמודה כדי לראות את הערך היומי."
            : "Choose a bar to explore that day."
          : `${data[active].date.toLocaleDateString(locale, { day: "numeric", month: "short" })} · ${data[active][metric]} ${caption}`}
      </p>
    </div>
  );
}

export function ContributionChart({ data, he }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="contribution-chart">
      {data.length ? (
        data.map((member, i) => (
          <div className="contribution-row" key={member.id}>
            <div>
              <span
                className="member-dot"
                style={{ background: colours[i % colours.length] }}
              >
                {(member.name || "?").slice(0, 1)}
              </span>
              <strong>{member.name || (he ? "ללא שיוך" : "Unassigned")}</strong>
              <span>
                {member.count} {he ? "משימות" : "quests"}{" "}
                <small>· {member.xp} XP</small>
              </span>
            </div>
            <div className="contribution-track">
              <span
                style={{
                  width: `${(member.count / max) * 100}%`,
                  background: colours[i % colours.length],
                }}
              />
            </div>
          </div>
        ))
      ) : (
        <p className="world-empty">
          {he
            ? "התרומות יופיעו אחרי השלמת משימות."
            : "Contributions appear as your household completes quests."}
        </p>
      )}
    </div>
  );
}

export function WorkloadChart({ data, categoryLabel, he }) {
  const max = Math.max(1, ...data.map((d) => d.open + d.done));
  return (
    <div>
      <div className="workload-legend">
        <span>
          <i />
          {he ? "הושלמו" : "Completed"}
        </span>
        <span>
          <i />
          {he ? "פתוחות" : "Open"}
        </span>
      </div>
      <div className="workload-chart">
        {data.map((d) => (
          <div key={d.id}>
            <div className="workload-label">
              <strong>{categoryLabel(d.id)}</strong>
              <span>
                {d.done} / {d.done + d.open}
              </span>
            </div>
            <div
              className="workload-track"
              aria-label={`${categoryLabel(d.id)}: ${d.done} ${he ? "הושלמו" : "completed"}, ${d.open} ${he ? "פתוחות" : "open"}`}
            >
              <span style={{ width: `${(d.done / max) * 100}%` }} />
              <span style={{ width: `${(d.open / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      {!data.length && (
        <p className="world-empty">
          {he
            ? "הוסיפו משימה כדי להתחיל."
            : "Add your first quest to get started."}
        </p>
      )}
    </div>
  );
}

export function MomentumChart({ data, he }) {
  const id = useId();
  let total = 0;
  const points = data.map((d) => {
    total += d.xp;
    return total;
  });
  const max = Math.max(1, total);
  const path = points
    .map(
      (v, i) =>
        `${i ? "L" : "M"} ${24 + (i / Math.max(1, points.length - 1)) * 552} ${158 - (v / max) * 132}`,
    )
    .join(" ");
  return (
    <div className="momentum-chart">
      <svg viewBox="0 0 600 188" role="img" aria-labelledby={id}>
        <title id={id}>
          {he
            ? "ניקוד מצטבר ממשימות בתקופה שנבחרה"
            : "Cumulative points from completed quests in the selected period"}
          : {total} XP
        </title>
        <path
          d="M24 158H576 M24 92H576 M24 26H576"
          stroke="#dce5df"
          strokeDasharray="4 6"
          fill="none"
        />
        <path d={`${path} L576 158 L24 158Z`} fill="#e8e1f3" />
        <path
          d={path}
          fill="none"
          stroke="#7560a6"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((v, i) => (
          <circle
            key={i}
            cx={24 + (i / Math.max(1, points.length - 1)) * 552}
            cy={158 - (v / max) * 132}
            r="3"
            fill="#7560a6"
          >
            <title>
              {data[i].key}: {v} XP
            </title>
          </circle>
        ))}
      </svg>
      <div className="momentum-labels">
        <span>
          {data[0]?.date.toLocaleDateString(he ? "he-IL" : "en-GB", {
            day: "numeric",
            month: "short",
          })}
        </span>
        <strong>
          <TrendingUp size={16} />
          {total} XP
        </strong>
        <span>
          {data
            .at(-1)
            ?.date.toLocaleDateString(he ? "he-IL" : "en-GB", {
              day: "numeric",
              month: "short",
            })}
        </span>
      </div>
    </div>
  );
}

export function ActivityHeatmap({ data, he }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div>
      <div
        className="activity-heatmap"
        dir="ltr"
        aria-label={he ? "לוח פעילות יומי" : "Daily activity calendar"}
      >
        {data.map((d) => (
          <div
            key={d.key}
            tabIndex={0}
            aria-label={`${d.key}: ${d.count} ${he ? "משימות" : "quests"}`}
            className={d.count ? "has-activity" : ""}
            style={{ "--heat": d.count ? 0.3 + (d.count / max) * 0.7 : 0 }}
          >
            <span>{d.date.getDate()}</span>
            <div role="tooltip">
              {d.date.toLocaleDateString(he ? "he-IL" : "en-GB")} · {d.count}
            </div>
          </div>
        ))}
      </div>
      <p className="chart-note">
        <BarChart3 size={14} />
        {he
          ? "84 הימים האחרונים · צבע כהה מסמן יותר משימות"
          : "Last 84 days · Deeper colour means more completed quests"}
      </p>
    </div>
  );
}
