import { useState } from "react";
import {
  Star,
  Check,
  Flag,
  Sparkles,
  ArrowUpRight,
  Loader2,
  Clock3,
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
}) {
  const [limit, setLimit] = useState(8);
  const visible = tasks.slice(0, preview ? 5 : limit);
  const xs = [200, 270, 225, 130, 175, 270, 225, 135];
  const height = Math.max(170, visible.length * 178);
  const points = visible.map((_, i) => [xs[i % xs.length], 48 + i * 178]);
  const line = points
    .map(([x, y], i) =>
      i
        ? `C ${points[i - 1][0]} ${y - 98}, ${x} ${y - 80}, ${x} ${y}`
        : `M ${x} ${y}`,
    )
    .join(" ");
  return (
    <div className="quest-adventure">
      <div className="quest-path-intro">
        <Flag size={20} />
        <span>
          {he ? "כל משימה היא צעד בהרפתקה!" : "Little quests. BIG adventures!"}
        </span>
        <Star size={20} fill="currentColor" />
      </div>
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
            stroke="#e5dfc6"
            strokeWidth="19"
            strokeLinecap="round"
          />
          <path
            d={line}
            fill="none"
            stroke="#fffdf3"
            strokeWidth="4"
            strokeDasharray="2 12"
            strokeLinecap="round"
          />
        </svg>
        {visible.map((task, i) => {
          const done = isDone(task);
          const permissions = getPermissions(task);
          const pending = task.status === "PendingApproval";
          const canFinish =
            !done && (pending ? permissions.canApprove : permissions.canMove);
          return (
            <div
              className={`quest-stop stop-${i % 4} ${done ? "is-complete" : ""}`}
              key={task.id}
              style={{
                top: `${i * 178}px`,
                insetInlineStart: `${xs[i % xs.length] / 4}%`,
              }}
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
                  <Star size={36} strokeWidth={2.5} fill="currentColor" />
                )}
                <span className="checkpoint-number">{i + 1}</span>
              </button>
              <button className="checkpoint-title" onClick={() => onOpen(task)}>
                {tx(task.title)}
              </button>
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
                  <b>+{taskPoints(task)} XP</b>
                </button>
              )}
            </div>
          );
        })}
        <span className="trail-spark trail-spark-one" aria-hidden="true">
          ✦
        </span>
        {visible.length > 3 && (
          <span className="trail-spark trail-spark-two" aria-hidden="true">
            ✿
          </span>
        )}
        <span className="trail-spark trail-spark-three" aria-hidden="true">
          ✦
        </span>
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
