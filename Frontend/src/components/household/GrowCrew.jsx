import { useEffect, useState } from "react";
import {
  Copy,
  Share2,
  UserRoundPlus,
  Sparkles,
  Smartphone,
  Play,
  Check,
  Link,
  ShieldCheck,
} from "lucide-react";
import QRCode from "qrcode";
import { Dialog, LimeButton, GhostButton, Field, fieldClass } from "../ui/kit";
import {
  AVATAR_ICONS,
  DEFAULT_AVATAR_CONFIG,
  resolveAvatarConfig,
} from "../../data/avatars";
import { useI18n } from "../../context/I18nContext";
import { useApp } from "../../context/AppContext";
import { familyApi, installFamilySession } from "../../services/familyApi";
import { IS_DEMO_MODE } from "../../services/config";
import "./family.css";

export default function GrowCrew({ open, onClose, initialMode = "child" }) {
  const { lang, t } = useI18n();
  const { household, refreshData } = useApp();
  const he = lang === "he",
    say = (en, hw) => (he ? hw : en);
  const [mode, setMode] = useState(initialMode);
  const [data, setData] = useState({ children: [], invitations: [] });
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR_CONFIG);
  const [link, setLink] = useState("");
  const [qr, setQr] = useState("");
  const [child, setChild] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const load = async () => {
    const value = await familyApi.list(household.id);
    setData(value);
    return value;
  };
  useEffect(() => {
    if (!open || !household?.id) return;
    let active = true;
    setMode(initialMode);
    setLink("");
    setError("");
    setMessage("");
    setLoading(true);
    familyApi
      .list(household.id)
      .then((value) => {
        if (active) setData(value);
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
  }, [open, household?.id, initialMode]);
  useEffect(() => {
    let active = true;
    setQr("");
    if (link)
      QRCode.toDataURL(link, {
        width: 180,
        margin: 2,
        color: { dark: "#173f3c", light: "#ffffff" },
      })
        .then((value) => {
          if (active) setQr(value);
        })
        .catch(() => {});
    return () => {
      active = false;
    };
  }, [link]);
  const run = async (action) => {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const tabs = [
    ["child", Sparkles, say("Little hero", "גיבור קטן")],
    ["adult", UserRoundPlus, say("Grown-up", "מבוגר")],
    ["play", Play, say("Who’s playing?", "מי משחק?")],
    ["pair", Smartphone, say("Pair a device", "חיבור מכשיר")],
  ];
  return (
    <Dialog
      open={open}
      onClose={busy ? () => {} : onClose}
      title={say("Grow your crew", "הנבחרת שלנו גדלה")}
      size="lg"
    >
      <div className="family-flow" dir={he ? "rtl" : "ltr"}>
        <div
          className="family-tabs"
          aria-label={say("Ways to join", "דרכים להצטרף")}
        >
          {tabs.map(([id, Icon, label]) => (
            <button
              key={id}
              aria-pressed={mode === id}
              disabled={busy}
              onClick={() => {
                setMode(id);
                setError("");
                setMessage("");
              }}
            >
              <Icon size={19} />
              {label}
            </button>
          ))}
        </div>
        {loading ? (
          <p role="status">{say("Opening your home…", "פותחים את הבית…")}</p>
        ) : (
          <>
            {mode === "child" && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  run(async () => {
                    await familyApi.child(household.id, nickname, avatar);
                    await load();
                    await refreshData();
                    setMessage(
                      say(
                        `${nickname} is on the team! Choose their quests, or start playing below.`,
                        `${nickname} בנבחרת! אפשר לבחור משימות או להתחיל לשחק.`,
                      ),
                    );
                    setNickname("");
                    setMode("play");
                  });
                }}
              >
                <div className="family-intro">
                  <img src="/images/dira-mascot.png" alt="" />
                  <div>
                    <h2>
                      {say(
                        "Big adventures. Little heroes.",
                        "הרפתקאות גדולות. גיבורים קטנים.",
                      )}
                    </h2>
                    <p>
                      {say(
                        "Their own quests, coins and rewards. You manage the account. No email needed.",
                        "משימות, מטבעות ופרסים משלהם. אתם מנהלים את החשבון. בלי אימייל.",
                      )}
                    </p>
                  </div>
                </div>
                <Field
                  label={say(
                    "What should we call your hero?",
                    "איך נקרא לגיבור שלכם?",
                  )}
                  htmlFor="hero-name"
                >
                  <input
                    id="hero-name"
                    className={fieldClass}
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    maxLength={40}
                    required
                    autoComplete="off"
                    placeholder={say("A nickname is perfect", "כינוי זה נהדר")}
                  />
                </Field>
                <fieldset className="family-avatars">
                  <legend>{say("Pick their character", "בחרו דמות")}</legend>
                  {AVATAR_ICONS.slice(0, 10).map((icon) => (
                    <button
                      type="button"
                      key={icon.id}
                      aria-label={t(icon.labelKey)}
                      aria-pressed={avatar.baseIconId === icon.id}
                      onClick={() =>
                        setAvatar({ ...avatar, baseIconId: icon.id })
                      }
                    >
                      <span aria-hidden="true">{icon.emoji}</span>
                    </button>
                  ))}
                </fieldset>
                <LimeButton type="submit" disabled={busy || !nickname.trim()}>
                  {busy
                    ? say("Joining the team…", "מצטרפים לנבחרת…")
                    : say("Add my little hero", "הוספת הגיבור שלי")}
                  <Sparkles size={18} />
                </LimeButton>
              </form>
            )}
            {mode === "adult" && (
              <section>
                <div className="family-intro">
                  <div className="family-symbol">
                    <Link size={34} />
                  </div>
                  <div>
                    <h2>
                      {say(
                        "A little link. A bigger team.",
                        "קישור קטן. נבחרת גדולה.",
                      )}
                    </h2>
                    <p>
                      {say(
                        "Send a one-person invitation however you like. They sign in or create an account, then join this home.",
                        "שתפו הזמנה לאדם אחד בדרך שנוחה לכם. מתחברים או יוצרים חשבון ומצטרפים לבית הזה.",
                      )}
                    </p>
                  </div>
                </div>
                {!link ? (
                  <LimeButton
                    disabled={busy}
                    onClick={() =>
                      run(async () => {
                        const result = await familyApi.invite(household.id);
                        setLink(
                          `${location.origin}${location.pathname}#/join?token=${result.token}`,
                        );
                        await load();
                      })
                    }
                  >
                    {say("Create invitation link", "יצירת קישור להזמנה")}
                    <Link size={18} />
                  </LimeButton>
                ) : (
                  <div className="family-ticket">
                    {qr && (
                      <img
                        src={qr}
                        alt={say(
                          "Scan to open this invitation",
                          "סרקו כדי לפתוח את ההזמנה",
                        )}
                        width="180"
                        height="180"
                      />
                    )}
                    <div>
                      <strong>
                        {say("Your invitation is ready!", "ההזמנה שלכם מוכנה!")}
                      </strong>
                      <p>
                        {say(
                          "One person · expires in 7 days",
                          "אדם אחד · בתוקף לשבעה ימים",
                        )}
                      </p>
                      <input
                        aria-label={say("Invitation link", "קישור להזמנה")}
                        value={link}
                        readOnly
                        onFocus={(e) => e.target.select()}
                        className={fieldClass}
                        dir="ltr"
                      />
                      <div className="family-actions">
                        <LimeButton
                          disabled={busy}
                          onClick={() =>
                            run(async () => {
                              await navigator.clipboard.writeText(link);
                              setMessage(
                                say(
                                  "Link copied. Send it to your grown-up!",
                                  "הקישור הועתק. אפשר לשלוח אותו למבוגר!",
                                ),
                              );
                            })
                          }
                        >
                          <Copy size={17} />
                          {say("Copy link", "העתקת קישור")}
                        </LimeButton>
                        {typeof navigator.share === "function" && (
                          <GhostButton
                            onClick={() =>
                              run(async () => {
                                try {
                                  await navigator.share({
                                    title: "Join my TaskDira home",
                                    url: link,
                                  });
                                } catch (e) {
                                  if (e.name !== "AbortError") throw e;
                                }
                              })
                            }
                          >
                            <Share2 size={17} />
                            {say("Share", "שיתוף")}
                          </GhostButton>
                        )}
                      </div>
                      <button
                        className="family-text-button"
                        onClick={() => setLink("")}
                      >
                        {say("Create another invitation", "יצירת הזמנה נוספת")}
                      </button>
                    </div>
                  </div>
                )}
                <p className="family-hint">
                  {say(
                    "No email is sent automatically. Share the link with the person you want to invite.",
                    "לא נשלח אימייל אוטומטי. שתפו את הקישור עם מי שתרצו להזמין.",
                  )}
                </p>
                {!!data.invitations.length && (
                  <details className="family-invitations">
                    <summary>
                      {say("Invitation history", "היסטוריית הזמנות")} (
                      {data.invitations.length})
                    </summary>
                    <ul>
                      {data.invitations.map((i, index) => (
                        <li key={i.id}>
                          <span>
                            {say("Invitation", "הזמנה")}{" "}
                            {data.invitations.length - index}
                            <small>
                              {say(
                                i.status,
                                {
                                  pending: "ממתינה",
                                  accepted: "התקבלה",
                                  revoked: "בוטלה",
                                  expired: "פגה",
                                }[i.status],
                              )}{" "}
                              ·{" "}
                              {new Date(i.expiresAt).toLocaleDateString(
                                he ? "he-IL" : "en-GB",
                              )}
                            </small>
                          </span>
                          {i.status === "pending" && (
                            <button
                              disabled={busy}
                              onClick={() =>
                                run(async () => {
                                  await familyApi.revoke(household.id, i.id);
                                  setLink("");
                                  await load();
                                  setMessage(
                                    say(
                                      "Invitation cancelled.",
                                      "ההזמנה בוטלה.",
                                    ),
                                  );
                                })
                              }
                            >
                              {say("Cancel invite", "ביטול הזמנה")}
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </section>
            )}
            {mode === "play" && (
              <section>
                <h2>{say("Who’s playing today?", "מי משחק היום?")}</h2>
                <p>
                  {say(
                    "Choose a hero for this device. Your parent session will end; sign in again to return to parent controls.",
                    "בחרו גיבור למכשיר הזה. חיבור ההורה יסתיים; חזרה לבקרת הורים דורשת התחברות מחדש.",
                  )}
                </p>
                <div className="family-players">
                  {data.children.map((kid) => (
                    <button
                      key={kid.userId}
                      disabled={busy}
                      onClick={() =>
                        run(async () =>
                          installFamilySession(
                            await familyApi.play(household.id, kid.userId),
                          ),
                        )
                      }
                    >
                      <span>{resolveAvatarConfig(kid.avatarState).emoji}</span>
                      <strong>{kid.fullName}</strong>
                      <small>
                        <Play size={14} />
                        {say("Let’s play", "בואו נשחק")}
                      </small>
                    </button>
                  ))}
                </div>
                {!data.children.length && (
                  <GhostButton onClick={() => setMode("child")}>
                    {say("Add your first little hero", "הוספת הגיבור הראשון")}
                  </GhostButton>
                )}
              </section>
            )}
            {mode === "pair" && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  run(async () => {
                    const selected = data.children.find(
                      (k) => String(k.userId) === child,
                    );
                    await familyApi.approve(
                      household.id,
                      selected.userId,
                      code,
                    );
                    setCode("");
                    setMessage(
                      say(
                        "Device approved! Their adventure will open there in a moment.",
                        "המכשיר אושר! ההרפתקה תיפתח שם בעוד רגע.",
                      ),
                    );
                  });
                }}
              >
                <h2>
                  {say("Their device. Your okay.", "המכשיר שלהם. האישור שלכם.")}
                </h2>
                <p>
                  {say(
                    "On the child’s device, open TaskDira → Sign in → “I’m a little hero”. Enter the code shown there, then choose who will play.",
                    "במכשיר של הילד פתחו את TaskDira ← התחברות ← ״אני גיבור קטן״. הזינו את הקוד שמופיע שם ובחרו מי ישחק.",
                  )}
                </p>
                <Field
                  label={say("Who is this device for?", "למי המכשיר?")}
                  htmlFor="pair-child"
                >
                  <select
                    id="pair-child"
                    value={child}
                    onChange={(e) => setChild(e.target.value)}
                    required
                    className={fieldClass}
                  >
                    <option value="">
                      {say("Choose a hero", "בחירת גיבור")}
                    </option>
                    {data.children.map((kid) => (
                      <option key={kid.userId} value={kid.userId}>
                        {kid.fullName}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label={say("Code on their screen", "הקוד על המסך שלהם")}
                  htmlFor="pair-code"
                >
                  <input
                    id="pair-code"
                    className={fieldClass}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={12}
                    required
                    autoComplete="off"
                    spellCheck={false}
                    dir="ltr"
                    placeholder="A1B2C-D3E4F"
                  />
                </Field>
                <LimeButton
                  type="submit"
                  disabled={
                    busy || !child || code.replace(/[-\s]/g, "").length !== 10
                  }
                >
                  <ShieldCheck size={18} />
                  {say("Approve this device", "אישור המכשיר")}
                </LimeButton>
                {!data.children.length && (
                  <button
                    type="button"
                    className="family-text-button"
                    onClick={() => setMode("child")}
                  >
                    {say("Add a hero first", "קודם מוסיפים גיבור")}
                  </button>
                )}
              </form>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="family-error">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="family-success">
            <Check size={20} />
            {message}
          </p>
        )}
        {IS_DEMO_MODE && (
          <p className="family-hint family-demo">
            {say(
              "Preview only: family profiles and invitations are saved in this browser. Links and pairing work between its tabs. Sharing with other devices starts after deployment.",
              "תצוגה מקדימה: פרופילים והזמנות נשמרים בדפדפן הזה ופועלים בין הלשוניות שלו. שיתוף למכשירים אחרים יתאפשר אחרי הפרסום.",
            )}
          </p>
        )}
      </div>
    </Dialog>
  );
}
