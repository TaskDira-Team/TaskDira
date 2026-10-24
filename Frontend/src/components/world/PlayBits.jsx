import { Check, HandHeart, RotateCcw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useI18n } from "../../context/I18nContext";
import { usePlay } from "../../context/PlayContext";
import {
  HELP_KINDS,
  HELP_REPLIES,
  owner,
  isOpen,
} from "../../utils/familyPlay";
import "./familyPlay.css";

export function PlayNotice() {
  const { error, state, refresh } = usePlay();
  const { lang } = useI18n();
  return error ? (
    <div className="play-notice" role="alert">
      <span>{error}</span>
      <button onClick={refresh}>
        <RotateCcw size={16} />
        {lang === "he" ? "לנסות שוב" : "Try again"}
      </button>
    </div>
  ) : !state ? (
    <p className="play-loading" role="status">
      {lang === "he" ? "פותחים את ההרפתקה…" : "Opening your adventure…"}
    </p>
  ) : null;
}
export function MissionHelp({ task, step = 0 }) {
  const { state, busy, change, error } = usePlay();
  const { user } = useAuth();
  const { lang } = useI18n();
  const he = lang === "he";
  if (owner(task) !== String(user?.id) || !isOpen(task))
    return (
      <p>
        {he
          ? "מבקשים מהאחראי למשימה לבחור איזו עזרה דרושה."
          : "The person doing this mission can choose the help they need."}
      </p>
    );
  const request = state?.help.find(
    (h) =>
      h.userId === String(user.id) &&
      h.taskId === String(task.id) &&
      h.status !== "resolved",
  );
  const reply = HELP_REPLIES.find((r) => r.id === request?.reply);
  return (
    <div className="mission-help-request">
      <p>
        {he
          ? "איזו עזרה תרצו? הבקשה תופיע להורה בבית שלכם."
          : "What would help? Your parent will see this request in your home."}
      </p>
      <div className="help-options">
        {HELP_KINDS.map((kind) => (
          <button
            key={kind.id}
            disabled={busy || !state}
            aria-pressed={request?.kind === kind.id}
            onClick={() =>
              change("help.ask", {
                taskId: String(task.id),
                kind: kind.id,
                step,
              })
            }
          >
            <HandHeart size={18} />
            {he ? kind.he : kind.en}
          </button>
        ))}
      </div>
      {request && (
        <p role="status" className="help-receipt">
          {reply
            ? he
              ? reply.he
              : reply.en
            : he
              ? "הבקשה מחכה להורה. אפשר גם לגשת אליו עכשיו."
              : "Your request is waiting for a parent. You can also go find them now."}
        </p>
      )}
      {request && (
        <button
          className="play-link"
          disabled={busy}
          onClick={() => change("help.resolve", { id: request.id })}
        >
          <Check size={16} />
          {he ? "כבר הסתדרתי" : "I’m okay now"}
        </button>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
