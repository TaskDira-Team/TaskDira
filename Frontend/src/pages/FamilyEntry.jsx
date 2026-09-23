import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Globe2,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { useI18n } from "../context/I18nContext";
import { useAuth } from "../context/AuthContext";
import { useRoute } from "../context/RouteContext";
import { familyApi, installFamilySession } from "../services/familyApi";
import { readStoredSession } from "../services/httpClient";
import { IS_DEMO_MODE } from "../services/config";
import {
  Field,
  LimeButton,
  GhostButton,
  fieldClass,
} from "../components/ui/kit";
import "../components/household/family.css";

export default function FamilyEntry() {
  const { lang, dir, toggleLang } = useI18n();
  const { path, navigate } = useRoute();
  const { user, login, logout } = useAuth();
  const he = lang === "he",
    say = (en, hw) => (he ? hw : en);
  const isPair = path.split("?")[0] === "/pair";
  const token =
    new URLSearchParams(path.split("?")[1] || "").get("token") || "";
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(!isPair);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [existing, setExisting] = useState(false);
  const [fields, setFields] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [pairing, setPairing] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("taskdira-pairing") || "null");
    } catch {
      return null;
    }
  });
  useEffect(() => {
    try {
      if (pairing)
        sessionStorage.setItem("taskdira-pairing", JSON.stringify(pairing));
      else sessionStorage.removeItem("taskdira-pairing");
    } catch {
      /* Pairing still works until this tab is reloaded. */
    }
  }, [pairing]);
  useEffect(() => {
    if (isPair) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    familyApi
      .preview(token)
      .then((value) => {
        if (active) setInvite(value);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, isPair]);
  useEffect(() => {
    if (!pairing || !isPair) return;
    let active = true,
      timeout;
    const poll = async () => {
      try {
        const result = await familyApi.poll(pairing.secret);
        if (!active) return;
        if (!result.pending) {
          sessionStorage.removeItem("taskdira-pairing");
          installFamilySession(result);
          return;
        }
        timeout = setTimeout(poll, 4000);
      } catch (e) {
        if (active) {
          setError(e.message);
          setPairing(null);
        }
      }
    };
    timeout = setTimeout(poll, 4000);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [pairing, isPair]);
  const run = async (action) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const field = (key, label, type = "text") => (
    <Field label={label} htmlFor={`join-${key}`}>
      <input
        id={`join-${key}`}
        type={type}
        className={fieldClass}
        value={fields[key]}
        onChange={(e) => setFields({ ...fields, [key]: e.target.value })}
        required
        autoComplete={
          key === "fullName"
            ? "name"
            : key === "password"
              ? existing
                ? "current-password"
                : "new-password"
              : "email"
        }
        minLength={key === "password" && !existing ? 8 : undefined}
        maxLength={key === "fullName" ? 100 : key === "email" ? 150 : 128}
        dir={type === "email" ? "ltr" : undefined}
      />
    </Field>
  );
  return (
    <main className="family-entry family-flow" dir={dir}>
      <div className="family-entry-inner">
        <header className="family-entry-header">
          <button onClick={() => navigate(user ? "/" : "/login")}>
            <ArrowLeft size={18} />
            <span>{say("Back", "חזרה")}</span>
          </button>
          <button onClick={toggleLang}>
            <Globe2 size={18} />
            {he ? "EN" : "עב"}
          </button>
        </header>
        <img
          className="family-entry-mascot"
          src="/images/dira-mascot.png"
          alt=""
        />
        {isPair ? (
          <>
            <h1>
              {say("Your adventure starts here!", "ההרפתקה שלך מתחילה כאן!")}
            </h1>
            <p className="family-lead">
              {say(
                "Ask a parent to connect this device to your hero. No email. No password to remember.",
                "בקשו מהורה לחבר את המכשיר לגיבור שלכם. בלי אימייל ובלי סיסמה לזכור.",
              )}
            </p>
            {pairing ? (
              <section aria-live="polite">
                <p className="family-lead">
                  {say(
                    "Show this code to your parent",
                    "הראו להורה את הקוד הזה",
                  )}
                </p>
                <output className="family-code" dir="ltr">
                  {pairing.code.slice(0, 5)}-{pairing.code.slice(5)}
                </output>
                <p className="family-lead">
                  {say(
                    "On their device: My team → Grow your crew → Pair a device. This code lasts 10 minutes. Waiting for their okay…",
                    "במכשיר שלהם: האנשים שלנו ← הנבחרת שלנו גדלה ← חיבור מכשיר. הקוד בתוקף לעשר דקות. מחכים לאישור…",
                  )}
                </p>
              </section>
            ) : (
              <div className="family-join-actions">
                <LimeButton
                  disabled={busy}
                  onClick={() =>
                    run(async () => setPairing(await familyApi.startPairing()))
                  }
                >
                  <Smartphone size={20} />
                  {say("Show my pairing code", "הצגת הקוד שלי")}
                </LimeButton>
              </div>
            )}
          </>
        ) : loading ? (
          <p role="status" className="family-lead">
            {say("Opening your invitation…", "פותחים את ההזמנה…")}
          </p>
        ) : invite ? (
          <>
            <h1>
              {say(
                `You’re invited to ${invite.householdName}!`,
                `הוזמנתם אל ${invite.householdName}!`,
              )}
            </h1>
            <p className="family-lead">
              {say(
                "Share the quests. Celebrate the wins. Join this home as an adult member.",
                "חולקים משימות וחוגגים הצלחות. מצטרפים לבית הזה כחבר מבוגר.",
              )}
            </p>
            {user ? (
              <div className="family-join-actions">
                <p>
                  {say("Signed in as", "מחוברים בתור")}{" "}
                  <strong>{user.fullName}</strong>
                </p>
                {user.isManagedProfile ? (
                  <p>
                    {say(
                      "Ask a grown-up to sign in to accept this invitation.",
                      "בקשו ממבוגר להתחבר כדי לקבל את ההזמנה.",
                    )}
                  </p>
                ) : (
                  <LimeButton
                    disabled={busy}
                    onClick={() =>
                      run(async () => {
                        const result = await familyApi.accept(token);
                        installFamilySession({
                          ...readStoredSession(),
                          householdId: result.householdId,
                        });
                      })
                    }
                  >
                    <ShieldCheck size={19} />
                    {say(
                      "Accept & join this home",
                      "קבלת ההזמנה והצטרפות לבית",
                    )}
                  </LimeButton>
                )}
                <GhostButton disabled={busy} onClick={() => run(logout)}>
                  {say("Use another account", "שימוש בחשבון אחר")}
                </GhostButton>
              </div>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  run(async () => {
                    if (existing)
                      await login(fields.email.trim(), fields.password);
                    else
                      installFamilySession(await familyApi.join(token, fields));
                  });
                }}
              >
                {!existing && field("fullName", say("Your name", "השם שלכם"))}
                {field("email", say("Email", "אימייל"), "email")}
                {field(
                  "password",
                  say(
                    existing ? "Password" : "Password · at least 8 characters",
                    existing ? "סיסמה" : "סיסמה · לפחות 8 תווים",
                  ),
                  "password",
                )}
                <LimeButton type="submit" disabled={busy}>
                  <Sparkles size={18} />
                  {busy
                    ? say("One little moment…", "עוד רגע קטן…")
                    : existing
                      ? say("Sign in to accept", "התחברות לקבלת ההזמנה")
                      : say(
                          "Create account & join this home",
                          "יצירת חשבון והצטרפות לבית",
                        )}
                </LimeButton>
                <button
                  type="button"
                  className="family-text-button"
                  onClick={() => {
                    setExisting(!existing);
                    setError("");
                  }}
                >
                  {existing
                    ? say(
                        "New here? Join with a new account",
                        "חדשים כאן? צרו חשבון והצטרפו",
                      )
                    : say(
                        "Already have an account? Sign in",
                        "כבר יש לכם חשבון? התחברו",
                      )}
                </button>
              </form>
            )}
          </>
        ) : (
          <h1>
            {say(
              "This invitation needs a fresh start.",
              "ההזמנה צריכה התחלה חדשה.",
            )}
          </h1>
        )}
        {error && (
          <p role="alert" className="family-error">
            {error}
          </p>
        )}
        {IS_DEMO_MODE && (
          <p className="family-hint family-demo">
            {say(
              "Browser preview: use demo details only. Invitations and pairing work between tabs in this browser until the real site is deployed.",
              "תצוגה מקדימה: השתמשו בפרטי דוגמה בלבד. הזמנות וחיבור מכשירים פועלים בין לשוניות בדפדפן הזה עד לפרסום האתר האמיתי.",
            )}
          </p>
        )}
      </div>
    </main>
  );
}
