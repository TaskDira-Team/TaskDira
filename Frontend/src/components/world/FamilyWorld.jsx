import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Flower2,
  HandHeart,
  Leaf,
  LockKeyhole,
  Moon,
  Plus,
  Flag,
  Settings2,
  Sparkles,
  Sun,
  Telescope,
  TentTree,
  Utensils,
  WandSparkles,
  Home,
  BedDouble,
  Armchair,
  Package,
  MapPin,
  Coins,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { useI18n } from "../../context/I18nContext";
import { useRoute } from "../../context/RouteContext";
import { worldApi } from "../../services/worldApi";
import {
  WORLD_PIECES,
  SUPPORT_LEVELS,
  SKILLS,
  missionChoices,
  supportFor,
  taskSkill,
} from "../../utils/familyWorld";
import { usePlay } from "../../context/PlayContext";
import HouseStage from "../landing/HouseStage";
import "./familyWorld.css";

const pieceIcons = {
  garden: Flower2,
  picnic: Utensils,
  observatory: Telescope,
};
const skillIcons = {
  tidying: Sparkles,
  kitchen: Utensils,
  caring: Leaf,
  other: HandHeart,
};
const positions = [
  ["left", "Left garden", "גינה שמאלית"],
  ["right", "Right garden", "גינה ימנית"],
  ["back", "Behind the house", "מאחורי הבית"],
  ["stored", "Put away", "להחזיר לאוסף"],
];

export default function FamilyWorld({ onOpen, onNew }) {
  const { tasks, users, household, loading, loadError, permissions } = useApp();
  const { user } = useAuth();
  const { state: playState } = usePlay();
  const { lang, tx } = useI18n();
  const { navigate } = useRoute();
  const he = lang === "he";
  const text = (en, hebrew) => (he ? hebrew : en);
  const [world, setWorld] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [night, setNight] = useState(false);
  const [roofOpen, setRoofOpen] = useState(true);
  const [selectedPiece, setSelectedPiece] = useState("garden");
  const [room, setRoom] = useState("home");
  const [offset, setOffset] = useState(0);
  const [decorating, setDecorating] = useState(false);
  const [settings, setSettings] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const generation = useRef(0);
  const mutation = useRef(false);
  const householdId = household?.id;
  const refresh = useCallback(async () => {
    if (!householdId || mutation.current) return;
    const request = ++generation.current;
    try {
      const result = await worldApi.read(householdId);
      if (request === generation.current) {
        setWorld((prev) =>
          JSON.stringify(prev) === JSON.stringify(result) ? prev : result,
        );
        setError("");
      }
    } catch {
      if (request === generation.current)
        setError(
          he
            ? "לא הצלחנו לטעון את העולם. נסו שוב."
            : "We couldn’t load your world. Please try again.",
        );
    }
  }, [householdId, he]);
  useEffect(() => {
    setWorld(null);
    setSelectedUser("");
    setOffset(0);
    return () => {
      generation.current++;
    };
  }, [householdId]);
  useEffect(() => {
    if (!loading) refresh();
  }, [refresh, tasks, users, loading]);
  useEffect(() => {
    const focus = () => refresh();
    const storage = (event) => {
      if (event.key === `td.family-world.v1.${householdId}`) refresh();
    };
    window.addEventListener("focus", focus);
    window.addEventListener("storage", storage);
    window.addEventListener("taskdira:live", focus);
    const poll = window.setInterval(() => {
      if (!document.hidden) refresh();
    }, 5000);
    return () => {
      clearInterval(poll);
      window.removeEventListener("focus", focus);
      window.removeEventListener("taskdira:live", focus);
      window.removeEventListener("storage", storage);
    };
  }, [refresh, householdId]);
  const change = async (action, data) => {
    if (busy || !householdId) return;
    mutation.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    const request = ++generation.current;
    try {
      const result = await worldApi[action](householdId, data);
      if (request === generation.current) {
        setWorld(result);
        setMessage(
          action === "place"
            ? text("Decoration moved. Saved!", "הקישוט הועבר ונשמר!")
            : text("Support level saved.", "רמת התמיכה נשמרה."),
        );
      }
    } catch {
      setError(
        text(
          "That change didn’t save. Please try again.",
          "השינוי לא נשמר. נסו שוב.",
        ),
      );
    } finally {
      mutation.current = false;
      setBusy(false);
    }
  };
  const choices = missionChoices(tasks, user?.id);
  const start = offset < choices.length ? offset : 0;
  const visible = choices.slice(start, start + 3);
  const pending = tasks.filter(
    (t) =>
      String(t.assignedUserId ?? t.assigneeId) === String(user?.id) &&
      t.status === "PendingApproval",
  );
  const count = world?.completed ?? 0;
  const targetUser =
    selectedUser ||
    String(users.find((u) => u.isManagedProfile)?.id ?? user?.id ?? "");
  const members = users.filter((u) => u.id != null);
  const firstName = (
    user?.fullName ||
    user?.name ||
    text("friend", "חבר")
  ).split(" ")[0];
  return (
    <div className="family-world" dir={he ? "rtl" : "ltr"}>
      <header className="fw-heading">
        <div>
          <h1>{text(`${firstName}’s home base`, `הבית של ${firstName}`)}</h1>
        </div>
      <nav
        className="fw-destinations"
        aria-label={text("Your adventure", "ההרפתקה שלכם")}
      >
        <button
          onClick={() =>
            document
              .getElementById("family-world-scene")
              ?.scrollIntoView({ block: "start" })
          }
        >
          <TentTree size={19} />
          {text("My world", "העולם שלי")}
        </button>
        <button onClick={() => navigate("/tasks")}>
          <WandSparkles size={19} />
          {text("My missions", "המשימות שלי")} <b>{choices.length}</b>
        </button>
        <button onClick={() => navigate("/rewards")}>
          <Sparkles size={19} />
          {text("My treasures", "האוצרות שלי")}
        </button>
      </nav>
      </header>
      {(error || loadError) && (
        <div className="fw-error" role="alert">
          {error || text("Your household didn’t load.", "הבית לא נטען.")}
          <button
            onClick={() => (loadError ? window.location.reload() : refresh())}
          >
            {text("Try again", "לנסות שוב")}
          </button>
        </div>
      )}
      <section
        className={`fw-scene ${night ? "fw-night" : ""}`}
        id="family-world-scene"
        aria-label={text("Our family world", "העולם המשפחתי שלנו")}
      >
        <div className="fw-scene-title">
          <span className="fw-house-name">
            {household?.name || text("Our home", "הבית שלנו")}
          </span>
          <button
            className="fw-scene-toggle"
            onClick={() => setNight((v) => !v)}
            aria-pressed={night}
            aria-label={text("Evening lighting", "תאורת ערב")}
          >
            {night ? <Moon size={19} /> : <Sun size={19} />}
          </button>
        </div>
        <div className="fw-scene-layout">
          <div className="fw-house">
            <HouseStage
              he={he}
              view={room}
              onRoomChange={setRoom}
              completed={[]}
              night={night}
              open={roofOpen}
              worldMode
              world={world}
              personalRoom={playState?.rooms[String(user?.id)]}
            />
          </div>
          <div className="fw-companion">
            <img src="/images/dira-mascot.png" alt="" />
          </div>
        </div>
        <div className="fw-scene-actions">
          <button
            className="fw-primary"
            disabled={!world}
            aria-expanded={decorating}
            onClick={() => setDecorating((v) => !v)}
          >
            <Flower2 size={19} />
            {text("Decorate", "מקשטים")}
            <ChevronDown size={17} />
          </button>
          <button
            className="fw-quiet"
            aria-pressed={roofOpen}
            onClick={() => setRoofOpen((v) => !v)}
          >
            <Home size={18} />
            {roofOpen
              ? text("Put the roof on", "מחזירים את הגג")
              : text("Peek inside", "מציצים פנימה")}
          </button>
          <div
            className="fw-room-picker"
            role="group"
            aria-label={text("Visit a room", "בוחרים חדר")}
          >
            {[
              ["home", Home, "Whole world", "כל העולם"],
              ["kitchen", Utensils, "Kitchen", "מטבח"],
              ["living", Armchair, "Living room", "סלון"],
              ["bedroom", BedDouble, "Bedroom", "חדר שינה"],
              ["clubhouse", TentTree, "Clubhouse", "מועדון"],
            ].map(([id, Icon, en, heb]) => (
              <button
                key={id}
                className="fw-room-button"
                aria-pressed={room === id}
                onClick={() => {
                  setRoom(id);
                  if (id !== "home") setRoofOpen(true);
                }}
              >
                <Icon size={19} />
                <span>{text(en, heb)}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
      {decorating && (
        <section
          className="fw-decorations"
          aria-label={text("Decorate our world", "מעצבים את העולם שלנו")}
        >
          <div className="fw-section-heading">
            <div>
              <h2>{text("Where should this go?", "איפה נשים את זה?")}</h2>
              <p>
                {text(
                  "Pick a decoration, then choose its spot.",
                  "בוחרים קישוט, ואז בוחרים לו מקום.",
                )}
              </p>
            </div>
            <Package size={32} />
          </div>
          <div
            className="fw-toy-shelf"
            role="group"
            aria-label={text("Choose a decoration", "בוחרים קישוט")}
          >
            {WORLD_PIECES.map((piece) => {
              const Icon = pieceIcons[piece.id];
              const unlocked = count >= piece.required;
              return (
                <button
                  key={piece.id}
                  className={`fw-toy fw-${piece.id}`}
                  aria-pressed={selectedPiece === piece.id}
                  disabled={!unlocked}
                  onClick={() => setSelectedPiece(piece.id)}
                >
                  <span className="fw-toy-art">
                    <Icon size={42} strokeWidth={2.5} />
                  </span>
                  <strong>{he ? piece.he : piece.en}</strong>
                  <small>
                    {unlocked
                      ? world?.placements[piece.id] &&
                        world.placements[piece.id] !== "stored"
                        ? text("In your garden", "בגינה שלכם")
                        : text("Ready to place", "מוכן להצבה")
                      : text(
                          `${piece.required - count} more family missions`,
                          `עוד ${piece.required - count} משימות משפחתיות`,
                        )}
                  </small>
                  {selectedPiece === piece.id && (
                    <Check className="fw-toy-check" size={18} />
                  )}
                </button>
              );
            })}
          </div>
          <div
            className="fw-placement"
            role="group"
            aria-label={text("Decoration position", "מיקום הקישוט")}
          >
            {positions.map(([id, en, heb]) => (
              <button
                key={id}
                className="fw-place-button"
                aria-pressed={
                  (world?.placements[selectedPiece] || "stored") === id
                }
                disabled={
                  busy ||
                  count <
                    WORLD_PIECES.find((p) => p.id === selectedPiece).required
                }
                onClick={() => {
                  setRoom("home");
                  change("place", { piece: selectedPiece, position: id });
                }}
              >
                {id === "stored" ? <Package size={19} /> : <MapPin size={19} />}
                <span>{text(en, heb)}</span>
                {(world?.placements[selectedPiece] || "stored") === id && (
                  <Check size={16} />
                )}
              </button>
            ))}
          </div>
        </section>
      )}
      <p className="fw-save-status" role="status">
        {busy ? text("Saving…", "שומרים…") : message}
      </p>
      <section className="fw-missions" id="family-missions">
        <div className="fw-section-heading">
          <div>
            <h2>{text("What will you try today?", "מה ננסה היום?")}</h2>
          </div>
          {permissions.canCreateTask && (
            <button className="fw-quiet" onClick={onNew}>
              <Plus size={18} />
              {text("Make a mission", "יוצרים משימה")}
            </button>
          )}
        </div>
        {loading ? (
          <p role="status">
            {text("Finding your missions…", "מחפשים את המשימות שלכם…")}
          </p>
        ) : visible.length ? (
          <div
            className={`fw-mission-choices ${visible.length === 1 ? "fw-one-mission" : ""}`}
          >
            {visible.map((task, index) => {
              const Icon = skillIcons[taskSkill(task)];
              const level = supportFor(world, user?.id, task);
              return (
                <button
                  className={`fw-mission fw-mission-${index}`}
                  key={task.id}
                  onClick={() => onOpen(task, level)}
                >
                  <span className="fw-mission-art">
                    <Icon size={46} />
                    <span>{index + 1}</span>
                  </span>
                  <span className="fw-mission-copy">
                    <strong>{tx(task.title)}</strong>
                    <span className="fw-mission-reward">
                      <Coins size={16} /> +
                      {task.pointsValue ?? task.points ?? 0} XP
                      {task.status === "InProgress" &&
                        ` · ${text("In progress", "בביצוע")}`}
                    </span>
                    <span className="fw-mission-go">
                      {task.status === "InProgress"
                        ? text("Keep going", "ממשיכים")
                        : text("Let’s go", "יוצאים לדרך")}
                      <ArrowRight size={18} />
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="fw-finished">
            <HandHeart size={42} />
            <h3>
              {pending.length
                ? text(
                    "Your grown-up gets the next turn.",
                    "עכשיו תור המבוגר שלכם.",
                  )
                : text(
                    "Room to breathe. Time to play.",
                    "אפשר לנשום. זמן לשחק.",
                  )}
            </h3>
            <p>
              {pending.length
                ? text(
                    "Your missions are waiting for a check. You can take a break.",
                    "המשימות שלכם ממתינות לבדיקה. אפשר לנוח.",
                  )
                : text(
                    "You have no open assigned missions. Your grown-up can add one when it’s needed.",
                    "אין לכם משימות פתוחות משויכות. המבוגר שלכם יכול להוסיף כשצריך.",
                  )}
            </p>
          </div>
        )}
        {choices.length > 3 && (
          <button
            className="fw-quiet fw-more"
            onClick={() =>
              setOffset(start + 3 >= choices.length ? 0 : start + 3)
            }
          >
            {text("Another three", "עוד שלוש משימות")}
            <ArrowRight size={17} />
          </button>
        )}
        {!!pending.length && (
          <div className="fw-pending">
            {pending.map((task) => (
              <button
                className="fw-quiet"
                key={task.id}
                onClick={() => onOpen(task, supportFor(world, user?.id, task))}
              >
                {tx(task.title)} · {text("Waiting for a check", "ממתין לבדיקה")}
              </button>
            ))}
          </div>
        )}
      </section>
      {permissions.isAdmin && !user?.isManagedProfile && (
        <section className="fw-parent">
          <button
            className="fw-quiet"
            aria-expanded={settings}
            onClick={() => setSettings((v) => !v)}
          >
            <Settings2 size={19} />
            {text("Grown-up corner", "פינת המבוגרים")}
            <ChevronDown size={17} />
          </button>
          {settings && (
            <div className="fw-support">
              <h2>
                {text(
                  "Every hero learns their own way.",
                  "כל גיבור לומד בדרך שלו.",
                )}
              </h2>
              <p>
                {text(
                  "Pick a person, then choose how much help they see for each kind of mission.",
                  "בוחרים אדם ומתאימים את העזרה לכל סוג משימה.",
                )}
              </p>
              <div
                className="fw-member-picker"
                role="group"
                aria-label={text("Family member", "בן משפחה")}
              >
                {members.map((u) => (
                  <button
                    key={u.id}
                    className="fw-place-button"
                    aria-pressed={String(u.id) === targetUser}
                    onClick={() => setSelectedUser(String(u.id))}
                  >
                    {u.fullName || u.name}
                  </button>
                ))}
              </div>
              <div className="fw-support-key">
                <span>
                  <HandHeart size={19} />
                  {text("Together: a grown-up joins in", "ביחד: מבוגר מצטרף")}
                </span>
                <span>
                  <Flag size={19} />
                  {text("Hints: one step at a time", "רמזים: צעד אחרי צעד")}
                </span>
                <span>
                  <Check size={19} />
                  {text(
                    "Independent: the whole checklist",
                    "עצמאי: כל הצעדים יחד",
                  )}
                </span>
              </div>
              <div className="fw-support-skills">
                {SKILLS.map((skill) => (
                  <fieldset key={skill.id}>
                    <legend>{he ? skill.he : skill.en}</legend>
                    <div className="fw-support-options">
                      {SUPPORT_LEVELS.map((level) => (
                        <button
                          key={level.id}
                          className="fw-place-button"
                          aria-pressed={
                            (world?.support.find(
                              (s) =>
                                String(s.userId) === targetUser &&
                                s.skill === skill.id,
                            )?.level || "hints") === level.id
                          }
                          disabled={busy || !world}
                          onClick={() =>
                            change("support", {
                              userId: targetUser,
                              skill: skill.id,
                              level: level.id,
                            })
                          }
                        >
                          {he ? level.he : level.en}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
