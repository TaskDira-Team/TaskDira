import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Globe2,
  Loader2,
  LockKeyhole,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import { useRoute } from "../context/RouteContext";
import AuthCompanion from "../components/onboarding/AuthCompanion";
import OnboardingFlow from "../components/onboarding/OnboardingFlow";
import { Brand } from "./Landing";
import "../components/landing/landing.css";
import "../components/onboarding/gameOnboarding.css";
import "../components/onboarding/authFit.css";
import { IS_DEMO_MODE } from "../services/config";

/** Uses the existing authentication contract and onboarding wizard. */
export default function AuthRoute() {
  const { lang, dir, toggleLang } = useI18n();
  const { path, navigate } = useRoute();
  const { login, register, error, setError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [journey, setJourney] = useState({
    step: 0,
    name: "",
    householdName: "",
  });
  const signup = path === "/register";
  const he = lang === "he";
  const say = (h, e) => (he ? h : e);
  const Arrow = he ? ArrowLeft : ArrowRight;
  useEffect(() => {
    window.scrollTo(0, 0);
    setError(null);
  }, [path, setError]);
  const handleLogin = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch {
      /* AuthContext supplies the visible error. */
    } finally {
      setSubmitting(false);
    }
  };
  const companionProps = {
    signup,
    journey,
    focusedField,
    emailReady: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    passwordReady: password.length > 0,
    submitting,
    error,
    he,
  };
  return (
    <main
      className={`td-auth td-game-auth td-fit-auth ${signup ? "is-signup" : "is-signin"}`}
      dir={dir}
      data-step={signup ? journey.step : undefined}
    >
      <header className="td-auth-header">
        <Brand onClick={() => navigate("/landing")} />
        <div className="td-auth-header-actions">
          {IS_DEMO_MODE && (
            <div className="td-auth-demo">
              <button
                type="button"
                className="td-auth-demo-button"
                disabled={submitting}
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    await login("ofek@taskdira.local", "123456");
                  } catch {
                    /* AuthContext displays error. */
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                {say("כניסה לבית לדוגמה", "Explore the sample home")}
                <Arrow size={18} />
              </button>
            </div>
          )}
          <button
            className="td-lang"
            onClick={toggleLang}
            aria-label={say("Switch to English", "מעבר לעברית")}
          >
            <Globe2 size={16} />
            {he ? "EN" : "עב"}
          </button>
        </div>
      </header>
      <div className="td-auth-layout">
        <section
          className="td-auth-form-side"
          onFocusCapture={(e) =>
            setFocusedField(
              e.target.id?.includes("password")
                ? "password"
                : e.target.type === "email"
                  ? "email"
                  : null,
            )
          }
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget))
              setFocusedField(null);
          }}
        >
          <div className="td-auth-form-inner">
            <h1>
              {signup
                ? say("היי, גיבורים!", "Hey, little hero!")
                : say("ברוכים השבים,", "Welcome back,")}
              <br />
              <span>
                {signup
                  ? say("הצוות שלכם מחכה.", "Your crew awaits.")
                  : say("אלופי הבית!", "home heroes!")}
              </span>
            </h1>
            <p className="td-auth-intro">
              {signup
                ? say(
                    "שלוש תחנות קטנות בדרך להרפתקה הראשונה שלכם.",
                    "Three little checkpoints. One big adventure ahead.",
                  )
                : say(
                    "עוד משימה קטנה, עוד ניצחון גדול. נכנסים וממשיכים לשחק!",
                    "Another little quest. Another BIG win. Hop in and keep the adventure going!",
                  )}
            </p>
            <div
              className="td-auth-tabs"
              aria-label={say("כניסה או הרשמה", "Login or sign up")}
            >
              <button
                className={!signup ? "is-active" : ""}
                aria-pressed={!signup}
                onClick={() => navigate("/login")}
              >
                {say("כניסה לבית", "Log in")}
              </button>
              <button
                className={signup ? "is-active" : ""}
                aria-pressed={signup}
                onClick={() => navigate("/register")}
              >
                {say("הקמת בית חדש", "Create a home")}
              </button>
            </div>
            <AuthCompanion {...companionProps} compact />
            {signup ? (
              <div className="td-onboarding">
                <OnboardingFlow
                  variant="light"
                  compact
                  showBrand={false}
                  onComplete={register}
                  onProgress={setJourney}
                  onBackToLogin={() => navigate("/login")}
                />
              </div>
            ) : (
              <form onSubmit={handleLogin} className="td-login-form">
                <div>
                  <label htmlFor="td-email">
                    {say("כתובת אימייל", "Email address")}
                  </label>
                  <input
                    id="td-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    dir="ltr"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="td-password">
                    {say("סיסמה", "Password")}
                  </label>
                  <div className="td-password-field">
                    <input
                      id="td-password"
                      name="password"
                      type={visible ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      dir="ltr"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      aria-label={
                        visible
                          ? say("הסתרת הסיסמה", "Hide password")
                          : say("הצגת הסיסמה", "Show password")
                      }
                      aria-pressed={visible}
                      onClick={() => setVisible(!visible)}
                    >
                      {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                {error && (
                  <p className="td-auth-error" role="alert">
                    {error}
                  </p>
                )}
                <button
                  className="td-btn td-btn-orange"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={19} />
                      {say("נכנסים הביתה…", "Coming home…")}
                    </>
                  ) : (
                    <>
                      {say("נכנסים הביתה", "Come on in")}
                      <Arrow size={19} />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="td-auth-demo-button"
                  onClick={() => navigate("/pair")}
                >
                  {he
                    ? "\u05d0\u05e0\u05d9 \u05d2\u05d9\u05d1\u05d5\u05e8 \u05e7\u05d8\u05df"
                    : "I’m a little hero"}
                </button>
              </form>
            )}
          </div>
        </section>
        <aside className="td-auth-art">
          <AuthCompanion {...companionProps} />
        </aside>
      </div>
    </main>
  );
}
