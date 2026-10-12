import { useEffect, useState } from "react";
import { Check, HandHeart, Flag, Volume2, X, ArrowLeft } from "lucide-react";
import { useI18n } from "../../context/I18nContext";
import { useApp } from "../../context/AppContext";
import { worldApi } from "../../services/worldApi";
import { supportFor, SUPPORT_LEVELS } from "../../utils/familyWorld";
import "./familyWorld.css";
import { chooseVoice } from "../landing/tourContent";

export default function MissionGuide({ task, permissions, busy, run }) {
  const { lang, tx } = useI18n();
  const { household, toggleSubItem } = useApp();
  const he = lang === "he";
  const [level, setLevel] = useState("hints");
  const [help, setHelp] = useState(false);
  const [review, setReview] = useState(null);
  const [voiceError, setVoiceError] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const steps = task.subItems ?? [];
  const active = steps.findIndex((s) => !s.isCompleted);
  const index = review ?? (active < 0 ? Math.max(0, steps.length - 1) : active);
  const item = steps[index];
  const finished = steps.length > 0 && active < 0;
  const mutable =
    !["Done", "PendingApproval"].includes(task.status) &&
    (permissions.canMove || permissions.canEdit);
  const speechAvailable =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window;
  useEffect(() => {
    let cancelled = false;
    if (household?.id)
      worldApi
        .read(household.id)
        .then((world) => {
          if (!cancelled)
            setLevel(
              supportFor(world, task.assignedUserId ?? task.assigneeId, task),
            );
        })
        .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [
    household?.id,
    task.id,
    task.assignedUserId,
    task.assigneeId,
    task.categoryId,
  ]);
  useEffect(
    () => () => {
      if (speechAvailable) window.speechSynthesis.cancel();
    },
    [speechAvailable],
  );
  const read = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    setVoiceError(false);
    const voice = chooseVoice(
      window.speechSynthesis.getVoices(),
      he ? "he" : "en",
    );
    if (!voice) {
      setVoiceError(true);
      return;
    }
    const line =
      level === "independent"
        ? [tx(task.title), ...steps.map((s) => tx(s.text || s.title))].join(
            ". ",
          )
        : tx(item?.text || item?.title || task.description || task.title);
    const speech = new SpeechSynthesisUtterance(line);
    speech.voice = voice;
    speech.lang = he ? "he-IL" : "en-US";
    speech.rate = 0.85;
    speech.onend = () => setSpeaking(false);
    speech.onerror = (e) => {
      setSpeaking(false);
      if (e.error !== "canceled" && e.error !== "interrupted")
        setVoiceError(true);
    };
    window.speechSynthesis.cancel();
    setSpeaking(true);
    window.speechSynthesis.speak(speech);
  };
  const levelName = SUPPORT_LEVELS.find((s) => s.id === level);
  return (
    <section
      className="mission-guide"
      aria-label={he ? "הדרכת המשימה" : "Mission guide"}
    >
      <p className="mg-level">
        <HandHeart size={18} />
        {he ? levelName.he : levelName.en}
      </p>
      {level === "together" && (
        <p>
          {he
            ? "מזמינים מבוגר לעשות את הצעד הראשון ביחד. אפשר לבקש עזרה בכל שלב."
            : "Invite a grown-up to do the first step with you. You can ask for help at any point."}
        </p>
      )}
      {level === "independent" && (
        <p>
          {he
            ? "הקצב שלכם, הדרך שלכם. עזרה תמיד זמינה."
            : "Your pace, your way. Help is always welcome."}
        </p>
      )}
      {steps.length > 0 && level !== "independent" ? (
        <>
          <ol
            className="mg-step-trail"
            aria-label={he ? "צעדי המשימה" : "Mission steps"}
          >
            {steps.map((step, stepIndex) => (
              <li key={step.id} className={step.isCompleted ? "is-done" : ""}>
                <button
                  type="button"
                  aria-current={stepIndex === index ? "step" : undefined}
                  aria-label={`${he ? "צעד" : "Step"} ${stepIndex + 1}: ${tx(step.text || step.title)}`}
                  onClick={() => setReview(stepIndex)}
                >
                  {step.isCompleted ? <Check size={18} /> : stepIndex + 1}
                </button>
              </li>
            ))}
          </ol>
          <div className="mg-step" aria-live="polite">
            <span className="mg-step-icon">
              {finished ? <Check size={32} /> : <Flag size={32} />}
            </span>
            <div>
              <small>
                {he
                  ? `צעד ${index + 1} מתוך ${steps.length}`
                  : `Step ${index + 1} of ${steps.length}`}
              </small>
              <h3>{tx(item?.text || item?.title)}</h3>
            </div>
          </div>
          <div className="mg-actions">
            {index > 0 && (
              <button disabled={busy} onClick={() => setReview(index - 1)}>
                <ArrowLeft size={16} />
                {he ? "הצעד הקודם" : "Previous step"}
              </button>
            )}
            <button
              className="mg-check"
              disabled={busy || !mutable}
              onClick={() =>
                run(
                  `checklist-${item.id}`,
                  async () => {
                    await toggleSubItem(task.id, item.id, !item.isCompleted);
                    setReview(null);
                  },
                  false,
                )
              }
            >
              <Check size={18} />
              {item.isCompleted
                ? he
                  ? "לנסות את הצעד שוב"
                  : "Try this step again"
                : he
                  ? "הצעד הזה הושלם!"
                  : "This step is done!"}
            </button>
            {review !== null && (
              <button onClick={() => setReview(null)}>
                {he ? "לצעד הבא שלי" : "Back to my next step"}
              </button>
            )}
          </div>
          {finished && (
            <p role="status">
              {he
                ? "כל הצעדים הושלמו! בדקו את העבודה ואז סיימו את המשימה למטה."
                : "Every step is checked! Look over your work, then finish the mission below."}
            </p>
          )}
        </>
      ) : steps.length > 0 ? (
        <ul className="mg-checklist">
          {steps.map((step) => (
            <li key={step.id}>
              <label>
                <input
                  type="checkbox"
                  checked={!!step.isCompleted}
                  disabled={busy || !mutable}
                  onChange={(e) =>
                    run(
                      `checklist-${step.id}`,
                      () => toggleSubItem(task.id, step.id, e.target.checked),
                      false,
                    )
                  }
                />
                <span>{tx(step.text || step.title)}</span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p>
          {he
            ? "אין עדיין צעדים למשימה הזאת. קראו את ההוראות יחד והחליטו מה עושים קודם."
            : "This mission has no little steps yet. Read the instructions together and choose what to do first."}
        </p>
      )}
      <div className="mg-actions" style={{ marginTop: 18 }}>
        <button onClick={() => setHelp((v) => !v)} aria-expanded={help}>
          <HandHeart size={18} />
          {he ? "אפשר קצת עזרה?" : "A little help?"}
        </button>
        {speechAvailable && (
          <button onClick={read} aria-pressed={speaking}>
            {speaking ? <X size={18} /> : <Volume2 size={18} />}{" "}
            {speaking
              ? he
                ? "עצירת הקראה"
                : "Stop reading"
              : he
                ? "קראו לי"
                : "Read to me"}
          </button>
        )}
      </div>
      {help && (
        <div className="mg-help" role="status">
          {he
            ? "אפשר לעצור. גשו למבוגר ואמרו: ״אפשר להראות לי את הצעד הראשון?״ שום דבר לא אובד כשמבקשים עזרה."
            : "It’s okay to pause. Find your grown-up and say, “Can you show me the first step?” Asking for help never takes anything away."}
        </div>
      )}
      {voiceError && (
        <p role="status">
          {he
            ? "ההקראה לא זמינה כרגע בדפדפן. אפשר לקרוא את ההוראות יחד."
            : "Read-aloud isn’t available in this browser right now. You can read the instructions together."}
        </p>
      )}
    </section>
  );
}
