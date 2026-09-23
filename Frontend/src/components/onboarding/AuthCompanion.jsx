import { Star, Check, Heart, Sparkles } from "lucide-react";
import useVisibleMotion from "../../hooks/useVisibleMotion";

export default function AuthCompanion({
  signup,
  journey,
  focusedField,
  emailReady,
  passwordReady,
  submitting,
  error,
  he,
  compact = false,
}) {
  const { ref, running } = useVisibleMotion();
  const say = (h, e) => (he ? h : e);
  const busy = submitting || (signup && journey.submitting);
  const mood = busy
    ? "opening"
    : error || (signup && journey.error)
      ? "oops"
      : focusedField === "password"
        ? "shy"
        : signup
          ? `step-${journey.step}`
          : emailReady && passwordReady
            ? "ready"
            : emailReady
              ? "email"
              : "hello";
  const name = journey.name?.trim().split(/\s+/)[0];
  const speech = {
    opening: say("פותחים את העולם הקטן שלכם…", "Opening your little world…"),
    oops: say("אופס! ננסה שוב ביחד.", "Oops! Let’s try that again, together."),
    shy: say("אני לא מציץ!", "No peeking. Promise!"),
    ready: say("מוכנים? בואו נקפוץ פנימה!", "Ready, hero? Let’s hop back in!"),
    email: say(
      "האימייל מוכן. עוד צעד קטן!",
      "Email ready. One more little step!",
    ),
    hello: say(
      "פססט… ההרפתקה הבאה שלכם מחכה!",
      "Psst… your next adventure is waiting!",
    ),
    "step-0": name
      ? say(
          `היי ${name}! איזו הרפתקה נעשה היום?`,
          `Hi ${name}! Let’s make a little magic.`,
        )
      : say(
          "היי! איך קוראים לגיבור החדש שלנו?",
          "Hi there! What should I call our new hero?",
        ),
    "step-1": journey.householdName?.trim()
      ? say(
          `${journey.householdName}… נשמע כמו בית להרפתקאות!`,
          `${journey.householdName}… sounds like a home for adventures!`,
        )
      : say(
          "לכל גיבור מגיע בית. איך נקרא לשלכם?",
          "Every hero needs a home. What’s yours called?",
        ),
    "step-2": say(
      "עכשיו בוחרים את הלוק ההרואי שלכם!",
      "Now for your super look. Make it YOU!",
    ),
  }[mood];
  return (
    <div
      ref={ref}
      className={`auth-pal ${compact ? "auth-pal-compact" : ""}`}
      data-mood={mood}
      data-motion-running={running}
    >
      <div className="auth-pal-speech" key={mood}>
        <span>{speech}</span>
        <Heart size={18} fill="currentColor" aria-hidden="true" />
      </div>
      <div className="auth-pal-scene" aria-hidden="true">
        <div className="auth-pal-orbit">
          <Star fill="currentColor" />
          <span>XP</span>
          <Sparkles />
        </div>
        <div className="auth-pal-bob">
          <div className="auth-pal-pose">
            <img
              src="/images/dira-mascot.png"
              width="600"
              height="640"
              alt=""
            />
            <span className="auth-pal-mask">
              <i />
              <i />
            </span>
          </div>
        </div>
        <div className="auth-pal-ground" />
      </div>
      <div className="auth-pal-caption">
        <h2>
          {signup
            ? say("ההרפתקה מתחילה", "A little setup.")
            : say("משימות קטנות.", "Little quests.")}
          <br />
          <span>
            {signup
              ? say("ממש כאן!", "A BIG adventure.")
              : say("ניצחונות ענקיים!", "GIANT high fives!")}
          </span>
        </h2>
        <div
          className="auth-pal-progress"
          aria-label={say("התקדמות", "Your progress")}
        >
          {(signup
            ? [
                say("הגיבור", "Your hero"),
                say("הבית", "Your home"),
                say("הלוק", "Your look"),
              ]
            : [
                say("אימייל מוכן", "Email ready"),
                say("סיסמה הוזנה", "Password entered"),
              ]
          ).map((label, index) => {
            const done = signup
              ? index < journey.step
              : index === 0
                ? emailReady
                : passwordReady;
            return (
              <span
                key={label}
                className={
                  done
                    ? "is-done"
                    : signup && index === journey.step
                      ? "is-current"
                      : ""
                }
              >
                {done ? <Check size={15} /> : <Star size={15} />} {label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
