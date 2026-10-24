import { useState } from "react";
import {
  Star,
  Check,
  Sparkles,
  ArrowUpRight,
  Loader2,
  Clock3,
  Utensils,
  BedDouble,
  Armchair,
  PawPrint,
  BookOpen,
  Leaf,
} from "lucide-react";
import { taskPoints, isDone } from "../../utils/insights";

/** Tasks stay independently playable; the path orders them without inventing dependencies. */
export default function QuestPath({
  tasks,
  he,
  tx,
  onOpen,
  onComplete,
  getPermissions,
  busy,
  preview = false,
  nameOf = () => "",
}) {
  const [limit, setLimit] = useState(8);
  const visible = tasks.slice(0, preview ? 5 : limit);
  const step = 140;
  const height = Math.max(150, visible.length * step);
  // Stops alternate between the two edges; cards point inward. The road is
  // drawn left-to-right and mirrored by CSS in right-to-left layouts.
  const edge = (i) => (i % 2 === 0 ? 22 : 378);
  const points = visible.map((_, i) => [edge(i), 46 + i * step]);
  const line = points
    .map(([x, y], i) =>
      i
        ? `C ${points[i - 1][0]} ${y - 70}, ${x} ${y - 70}, ${x} ${y}`
        : `M ${x} ${y}`,
    )
    .join(" ");
  return (
    <div className="quest-adventure">
      <div className="quest-path" style={{ height }}>
        <svg
          className="quest-path-road"
          viewBox={`0 0 400 ${height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d={line}
            fill="none"
            stroke="#d9e6ee"
            strokeWidth="26"
            strokeLinecap="round"
          />
          <path
            d={line}
            fill="none"
            stroke="#ffffff"
            strokeWidth="5"
            strokeDasharray="10 14"
            strokeLinecap="round"
          />
        </svg>
        {visible.map((task, i) => {
          const done = isDone(task);
          const Icon =
            {
              kitchen: Utensils,
              cooking: Utensils,
              room: BedDouble,
              living: Armchair,
              pet: PawPrint,
              homework: BookOpen,
              other: Leaf,
            }[task.categoryId] || Star;
          const permissions = getPermissions(task);
          const pending = task.status === "PendingApproval";
          const canFinish =
            !done && (pending ? permissions.canApprove : permissions.canMove);
          return (
            <div
              className={`quest-stop stop-${i % 4} ${i % 2 ? "is-far" : ""} ${done ? "is-complete" : ""}`}
              key={task.id}
              style={{ top: `${i * step}px` }}
            >
              <button
                className="quest-checkpoint"
                onClick={() => onOpen(task)}
                aria-label={`${he ? "פתיחת משימה" : "Open quest"}: ${tx(task.title)}`}
              >
                <span className="checkpoint-shine" />
                {done ? (
                  <Check size={35} strokeWidth={4} />
                ) : pending ? (
                  <Clock3 size={32} strokeWidth={3} />
                ) : (
                  <Icon size={35} strokeWidth={2.5} />
                )}
                <span className="checkpoint-number">{i + 1}</span>
              </button>
              <div className="quest-stop-card">
              <button className="checkpoint-title" onClick={() => onOpen(task)}>
                {tx(task.title)}
              </button>
              <span className="quest-stop-meta">
                <b>+{taskPoints(task)} XP</b>
                {nameOf(task) && ` · ${nameOf(task)}`}
                {task.status === "InProgress" && ` · ${he ? "בביצוע" : "In progress"}`}
              </span>
              {done ? (
                <span className="checkpoint-earned">
                  <Check size={12} />
                  {he ? "הושלם!" : "Nailed it!"}
                </span>
              ) : (
                <button
                  className="checkpoint-prize"
                  disabled={!canFinish || !!busy}
                  onClick={() => onComplete(task)}
                  aria-label={`${pending ? (he ? "אישור" : "Approve") : he ? "השלמה" : "Complete"}: ${tx(task.title)}`}
                >
                  {busy === task.id ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <span className="mini-coin" aria-hidden="true">
                      ★
                    </span>
                  )}
                  {pending
                    ? he
                      ? "לאישור"
                      : "Approve"
                    : he
                      ? "סיימתי!"
                      : "I did it!"}
                </button>
              )}
              </div>
            </div>
          );
        })}
      </div>
      {!preview && tasks.length > limit && (
        <button
          className="world-button secondary quest-load"
          onClick={() => setLimit((n) => n + 8)}
        >
          <Sparkles size={17} />
          {he ? "ממשיכים בדרך" : "Keep exploring"}
          <ArrowUpRight size={17} />
        </button>
      )}
    </div>
  );
}
