import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  CalendarDays,
  Check,
  CheckCheck,
  Cloud,
  HandHeart,
  Lamp,
  Leaf,
  LockKeyhole,
  Moon,
  Plus,
  Rocket,
  Sprout,
  TentTree,
  Trophy,
  X,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import { usePlay } from "../context/PlayContext";
import { useRoute } from "../context/RouteContext";
import {
  ADVENTURES,
  HELP_KINDS,
  HELP_REPLIES,
  ROOM_COLORS,
  ROOM_ITEMS,
  owner,
  isOpen,
  roomUnlocks,
} from "../utils/familyPlay";
import { taskSkill } from "../utils/familyWorld";
import HouseStage from "../components/landing/HouseStage";
import QuestDetailDialog from "../components/board/QuestDetailDialog";
import TaskModal from "../components/board/TaskModal";
import useSavedChores from "../hooks/useSavedChores";
import { PlayNotice } from "../components/world/PlayBits";
import "../components/world/familyPlay.css";

const ROOM_ICONS = {
  cushion: Cloud,
  lamp: Lamp,
  plant: Sprout,
  cup: Trophy,
  moon: Moon,
};
const THEMES = { moon: Moon, garden: Sprout, camp: TentTree };
const memberName = (users, id) =>
  users.find((u) => String(u.id) === String(id))?.fullName || "Crew";
const chooseId = (ids, id) =>
  ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];

function MissionPicker({ selected, setSelected, limit, locked = [] }) {
  const { tasks, users } = useApp();
  const { lang, tx } = useI18n();
  const he = lang === "he";
  return (
    <div className="play-mission-picker">
      {users.map((member) => {
        const available = tasks.filter(
          (t) =>
            owner(t) === String(member.id) &&
            (isOpen(t) || selected.includes(String(t.id))),
        );
        if (!available.length) return null;
        return (
          <fieldset key={member.id}>
            <legend>
              <span className="play-avatar">
                {member.fullName?.slice(0, 1)}
              </span>
              {member.fullName}
            </legend>
            {available.map((task) => (
              <label
                className={`play-choice ${selected.includes(String(task.id)) ? "chosen" : ""}`}
                key={task.id}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(String(task.id))}
                  disabled={
                    locked.includes(String(task.id)) ||
                    (!selected.includes(String(task.id)) &&
                      selected.length >= limit)
                  }
                  onChange={() =>
                    setSelected(chooseId(selected, String(task.id)))
                  }
                />
                <span>
                  <strong>{tx(task.title)}</strong>
                  <small>
                    {task.subItems?.length || 0} {he ? "צעדים" : "little steps"}{" "}
                    · {task.pointsValue ?? task.points ?? 0} XP
                  </small>
                </span>
              </label>
            ))}
          </fieldset>
        );
      })}
    </div>
  );
}

function Adventure({ onOpen, onNew }) {
  const { state, change, busy } = usePlay();
  const { tasks, users } = useApp();
  const { user } = useAuth();
  const { lang, tx } = useI18n();
  const { navigate } = useRoute();
  const he = lang === "he";
  const [setup, setSetup] = useState(false),
    [themeId, setTheme] = useState("moon"),
    [selected, setSelected] = useState([]);
  const adventure = state.adventures.findLast((a) => !a.archived);
  const theme =
    ADVENTURES.find((a) => a.id === (setup ? themeId : adventure?.theme)) ||
    ADVENTURES[0];
  const done = adventure?.missions.filter((m) => m.done).length || 0;
  const complete = !!adventure?.completedAt;
  const startSetup = () => {
    setSelected(
      users
        .flatMap((u) =>
          tasks
            .filter((t) => owner(t) === String(u.id) && isOpen(t))
            .slice(0, 1)
            .map((t) => String(t.id)),
        )
        .slice(0, 8),
    );
    setSetup(true);
  };
  return (
    <>
      <section
        className={`family-adventure-hero theme-${theme.id} ${complete && !setup ? "adventure-complete" : ""}`}
      >
        <div className="adventure-story">
          <h1>{he ? theme.he : theme.en}</h1>
          <p>{he ? theme.introHe : theme.intro}</p>
          {adventure && !setup ? (
            <>
              <div
                className="crew-avatars"
                aria-label={he ? "הצוות שלנו" : "Our crew"}
              >
                {[...new Set(adventure.missions.map((m) => m.userId))].map(
                  (id, i) => (
                    <span
                      style={{
                        "--crew-color": [
                          "#c5e7d8",
                          "#e5d5f5",
                          "#ffe3aa",
                          "#ffd5c3",
                        ][i % 4],
                      }}
                      title={memberName(users, id)}
                      key={id}
                    >
                      {memberName(users, id).slice(0, 1)}
                    </span>
                  ),
                )}
                <strong>
                  {he
                    ? "צוות אחד. מקום לכולם."
                    : "One crew. Room for everyone."}
                </strong>
              </div>
              <p className="adventure-progress-copy">
                {complete
                  ? he
                    ? "עשינו את זה, ביחד!"
                    : "We did it, together!"
                  : `${done} ${he ? "מתוך" : "of"} ${adventure.missions.length} ${he ? "משימות הושלמו" : "missions complete"}`}
              </p>
              <div
                className="adventure-progress"
                role="progressbar"
                aria-label={he ? "התקדמות ההרפתקה" : "Adventure progress"}
                aria-valuenow={done}
                aria-valuemin={0}
                aria-valuemax={adventure.missions.length}
              >
                <span
                  style={{
                    width: `${(100 * done) / adventure.missions.length}%`,
                  }}
                />
              </div>
            </>
          ) : (
            <p className="adventure-new-copy">
              {he
                ? "בוחרים משימות אמיתיות מהבית. כל אחד עוזר בדרך שמתאימה לו."
                : "Real jobs from your home. Each person helps in a way that fits them."}
            </p>
          )}
          {!adventure &&
            !setup &&
            (state.canManage ? (
              <button className="play-button" onClick={startSetup}>
                <Rocket size={20} />
                {he ? "בונים הרפתקה" : "Build our adventure"}
              </button>
            ) : (
              <p>
                {he
                  ? "ההורה יבחר משימות להרפתקה הראשונה שלכם."
                  : "A parent can choose the missions for your first adventure."}
              </p>
            ))}
          {complete && !setup && (
            <button
              className="play-button"
              onClick={() => navigate("/adventures?tab=room")}
            >
              <Moon size={19} />
              {he ? "הירח שלי מחכה בחדר" : "My moon is waiting in my room"}
            </button>
          )}
        </div>
        <div className="adventure-art">
          {theme.id === "moon" ? (
            <img
              src="/images/moon-picnic.png"
              alt=""
              width="1536"
              height="1024"
              fetchPriority="high"
            />
          ) : (
            <div
              className={`adventure-theme-art art-${theme.id}`}
              aria-hidden="true"
            />
          )}
          <span className="adventure-art-stamp">
            <Moon size={17} />
            {he
              ? "נבנה ביחד, משימה אחרי משימה"
              : "Built together, one little mission at a time"}
          </span>
        </div>
      </section>
      {setup ? (
        <form
          className="adventure-workshop"
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              await change("adventure.start", {
                theme: themeId,
                taskIds: selected,
              })
            )
              setSetup(false);
          }}
        >
          <div className="play-section-heading">
            <div>
              <h2>{he ? "מה ההרפתקה שלנו?" : "What’s our adventure?"}</h2>
              <p>
                {he
                  ? "בוחרים עד שמונה משימות. בדקו שהן מתאימות לכל משתתף."
                  : "Pick up to eight missions. Check that each job fits its person."}
              </p>
            </div>
            <button
              type="button"
              className="play-link"
              onClick={() => setSetup(false)}
            >
              <X size={18} />
              {he ? "ביטול" : "Cancel"}
            </button>
          </div>
          <div className="adventure-theme-picker">
            {ADVENTURES.map((a) => {
              const Icon = THEMES[a.id];
              return (
                <button
                  type="button"
                  key={a.id}
                  aria-pressed={themeId === a.id}
                  onClick={() => setTheme(a.id)}
                >
                  <Icon size={23} />
                  {he ? a.he : a.en}
                </button>
              );
            })}
          </div>
          <MissionPicker
            selected={selected}
            setSelected={setSelected}
            limit={8}
          />
          {!tasks.some(isOpen) && (
            <p>
              {he
                ? "יוצרים כמה משימות לפני שמתחילים."
                : "Make a few missions before you begin."}
            </p>
          )}
          <div className="play-form-footer">
            <button type="button" className="play-link" onClick={onNew}>
              <Plus size={18} />
              {he ? "יוצרים משימה" : "Make a mission"}
            </button>
            <button className="play-button" disabled={busy || !selected.length}>
              <Rocket size={18} />
              {he ? "יוצאים לדרך" : "Let’s go"} · {selected.length}/8
            </button>
          </div>
        </form>
      ) : (
        adventure && (
          <section className="adventure-trail-section">
            <div className="play-section-heading">
              <div>
                <h2>
                  {complete
                    ? he
                      ? "הסיפור שבנינו ביחד"
                      : "The story we made together"
                    : he
                      ? "כל עזרה קטנה לוקחת אותנו רחוק"
                      : "Every little help takes us somewhere"}
                </h2>
                <p>
                  {he
                    ? "אפשר לעשות את המשימות בכל סדר. בלי מרוץ, בלי לחץ."
                    : "Any order. At your own pace. Nobody gets left behind."}
                </p>
              </div>
              {complete && state.canManage && (
                <button className="play-button secondary" onClick={startSetup}>
                  <Plus size={17} />
                  {he ? "הרפתקה חדשה" : "Next adventure"}
                </button>
              )}
            </div>
            <ol className="family-adventure-trail">
              {adventure.missions.map((mission, i) => {
                const task = tasks.find((t) => String(t.id) === mission.taskId);
                const mine = mission.userId === String(user.id);
                return (
                  <li
                    key={mission.taskId}
                    className={`${mission.done ? "is-done" : ""} ${mine ? "is-mine" : ""}`}
                  >
                    <span className="adventure-stop">
                      {mission.done ? <Check size={27} /> : i + 1}
                    </span>
                    <div>
                      <small>
                        {memberName(users, mission.userId)}
                        {mine
                          ? he
                            ? " · זה התפקיד שלי"
                            : " · that’s me!"
                          : ""}
                      </small>
                      <h3>{tx(task?.title || mission.title)}</h3>
                      <span>
                        {mission.done
                          ? he
                            ? "החלק שלי בסיפור הושלם"
                            : "A little piece of our story, done"
                          : task?.status === "PendingApproval"
                            ? he
                              ? "ממתין לאישור"
                              : "Waiting for a parent’s check"
                            : !task
                              ? he
                                ? "המשימה הוסרה. הורה יכול לשים את ההרפתקה בצד."
                                : "Mission removed. A parent can put this adventure away."
                              : mine
                                ? he
                                  ? "מוכנים כשאתם מוכנים"
                                  : "Ready when you are"
                                : he
                                  ? "מעודדים את הצוות"
                                  : "Cheering our teammate on"}
                      </span>
                    </div>
                    {task && (
                      <button
                        className="play-link"
                        onClick={() => onOpen(task)}
                        aria-label={`${he ? "פתיחת" : "Open"} ${tx(task.title)}`}
                      >
                        <ArrowRight size={21} />
                      </button>
                    )}
                  </li>
                );
              })}
            </ol>
            <div className="adventure-keepsake">
              <span>
                <Moon size={37} />
              </span>
              <div>
                <h3>
                  {he ? "ירח קטן, סיפור גדול" : "A little moon. A big story."}
                </h3>
                <p>
                  {complete
                    ? he
                      ? "הירח נפתח למשתתפים. בחרו אותו באוסף של החדר."
                      : "Your crew earned the moon. Find it in your room’s keepsake collection."
                    : he
                      ? "כשכל החלקים יושלמו, כל משתתף יקבל ירח לחדר שלו."
                      : "When every part is done, each participant earns a moon for their room."}
                </p>
              </div>
            </div>
            {state.canManage && !complete && (
              <details className="play-parent-tools">
                <summary>{he ? "אפשרויות להורה" : "Parent options"}</summary>
                <p>
                  {he
                    ? "אפשר לשים הרפתקה בצד ולהתחיל מחדש. המשימות והנקודות נשמרות."
                    : "Put this adventure away to start another. Its missions and earned points stay."}
                </p>
                <button
                  className="play-link"
                  disabled={busy}
                  onClick={() =>
                    change("adventure.archive", { id: adventure.id })
                  }
                >
                  {he ? "שמים בצד" : "Put this adventure away"}
                </button>
              </details>
            )}
          </section>
        )
      )}
    </>
  );
}

function PersonalRoom() {
  const { state, busy, change } = usePlay();
  const { user } = useAuth();
  const { lang } = useI18n();
  const he = lang === "he";
  const saved = state.rooms[String(user.id)] || {
    color: "lilac",
    items: ["cushion"],
  };
  const [room, setRoom] = useState(saved),
    [view, setView] = useState("bedroom"),
    [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty) setRoom(saved);
  }, [JSON.stringify(saved), dirty]);
  const unlocked = roomUnlocks(state, user.id);
  const update = (value) => {
    setRoom(value);
    setDirty(true);
    setMessage("");
  };
  return (
    <section className="personal-room">
      <div className="play-section-heading">
        <div>
          <h1>{he ? "המקום הקטן שלי" : "My little place"}</h1>
          <p>
            {he
              ? "הצבעים שלי. הדברים שהרווחתי. סיפור שהוא רק שלי."
              : "My colours. My keepsakes. A story that feels like me."}
          </p>
        </div>
        <span className="room-name-tag">
          {(user.fullName || user.name || "").split(" ")[0]}
        </span>
      </div>
      <div className="personal-room-studio">
        <div className="personal-room-scene">
          <HouseStage
            he={he}
            view={view}
            onRoomChange={setView}
            completed={[]}
            open
            personalRoom={room}
          />
          <button className="room-return" onClick={() => setView("bedroom")}>
            <BedDouble size={19} />
            {he ? "בחזרה לחדר שלי" : "Back to my room"}
          </button>
        </div>
        <div className="room-paintbox">
          <h2>{he ? "באיזה צבע החלום שלי?" : "What colour is my daydream?"}</h2>
          <div className="room-swatches">
            {ROOM_COLORS.map((c) => (
              <button
                key={c.id}
                aria-pressed={room.color === c.id}
                onClick={() => update({ ...room, color: c.id })}
              >
                <span style={{ backgroundColor: c.color }}>
                  {room.color === c.id && <Check size={23} />}
                </span>
                {he ? c.he : c.en}
              </button>
            ))}
          </div>
          <p>
            {he
              ? "הבחירה משנה את המצעים בבית התלת־ממדי שלכם."
              : "Your choice changes the bedding inside your 3D home."}
          </p>
          <button
            className="play-button"
            disabled={busy || !dirty}
            onClick={async () => {
              if (await change("room.save", room)) {
                setDirty(false);
                setMessage(
                  he ? "החדר נשמר. לגמרי שלכם!" : "Room saved. Entirely you!",
                );
              }
            }}
          >
            <Check size={18} />
            {busy
              ? he
                ? "שומרים…"
                : "Saving…"
              : he
                ? "שומרים את החדר שלי"
                : "Save my room"}
          </button>
          <p className="room-save-message" role="status">
            {message ||
              (dirty
                ? he
                  ? "תצוגה מקדימה · שומרים כשמרוצים"
                  : "Previewing · save when it feels right"
                : he
                  ? "השינויים השמורים מחכים לכם גם בפעם הבאה"
                  : "Saved choices are here next time, too")}
          </p>
        </div>
      </div>
      <div className="play-section-heading">
        <div>
          <h2>{he ? "דברים קטנים עם סיפור" : "Little things with a story"}</h2>
          <p>
            {he
              ? "משימות פותחות מזכרות. אתם בוחרים מה להציג בחדר."
              : "Helping unlocks keepsakes. You choose which ones live in your room."}
          </p>
        </div>
      </div>
      <div className="room-keepsakes">
        {ROOM_ITEMS.map((item) => {
          const Icon = ROOM_ICONS[item.id];
          const earned = unlocked.includes(item.id);
          const selected = room.items.includes(item.id);
          return (
            <button
              className={`room-keepsake ${selected ? "is-placed" : ""}`}
              key={item.id}
              disabled={!earned}
              aria-pressed={selected}
              onClick={() =>
                update({ ...room, items: chooseId(room.items, item.id) })
              }
            >
              <span className={`keepsake-object keepsake-${item.id}`}>
                <Icon size={44} strokeWidth={1.8} />
                {!earned && <LockKeyhole size={15} />}
              </span>
              <strong>{he ? item.he : item.en}</strong>
              <small>
                {earned
                  ? selected
                    ? he
                      ? "בחדר שלי · לחצו להחזיר לאוסף"
                      : "In my room · tap to put away"
                    : he
                      ? "מוכן למקום משלו"
                      : "Ready for its own little spot"
                  : he
                    ? item.hintHe
                    : item.hint}
              </small>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function WeeklyPicks({ onOpen, onNew }) {
  const { state, busy, change } = usePlay();
  const { user } = useAuth();
  const { tasks, users, updateTask } = useApp();
  const { lang, tx } = useI18n();
  const he = lang === "he";
  const week = state.weeks[state.currentWeek];
  const selected = week?.choices[String(user.id)] || [];
  const [editing, setEditing] = useState(false),
    [offered, setOffered] = useState([]),
    [rotating, setRotating] = useState(false);
  const mine = (week?.taskIds || [])
    .map((id) => tasks.find((t) => String(t.id) === id))
    .filter((t) => t && owner(t) === String(user.id));
  const locked = Object.values(week?.choices || {}).flat();
  const suggestions = tasks
    .filter(
      (t) =>
        t.status === "ToDo" &&
        !locked.includes(String(t.id)) &&
        !state.adventures.some(
          (a) =>
            !a.archived &&
            !a.completedAt &&
            a.missions.some((m) => m.taskId === String(t.id)),
        ),
    )
    .map((task) => {
      const skill = taskSkill(task);
      const counts = (id) =>
        state.credits.filter(
          (c) => c.userId === String(id) && c.skill === skill,
        ).length;
      const candidate = [...users]
        .sort((a, b) => counts(a.id) - counts(b.id))
        .find((u) => counts(u.id) < counts(owner(task)));
      return candidate ? { task, candidate } : null;
    })
    .filter(Boolean)
    .slice(0, 3);
  return (
    <section className="weekly-picks">
      <div className="weekly-heading-art">
        <CalendarDays size={56} />
        <span>
          <Check size={22} />
        </span>
      </div>
      <div className="play-section-heading">
        <div>
          <h1>{he ? "השבוע, אני בוחר" : "This week, I choose"}</h1>
          <p>
            {he
              ? "בוחרים עד שלוש משימות מהתפריט שההורה הכין. אפשר לשנות בחירה לפני הסיום."
              : "Pick up to three jobs from your parent’s menu. Change an unfinished choice whenever you need."}
          </p>
        </div>
        {state.canManage && !editing && (
          <button
            className="play-button secondary"
            onClick={() => {
              setOffered(
                week?.taskIds ||
                  users
                    .flatMap((u) =>
                      tasks
                        .filter((t) => owner(t) === String(u.id) && isOpen(t))
                        .slice(0, 3)
                        .map((t) => String(t.id)),
                    )
                    .slice(0, 30),
              );
              setEditing(true);
            }}
          >
            {he ? "מכינים את תפריט השבוע" : "Prepare this week’s menu"}
          </button>
        )}
      </div>
      {editing ? (
        <form
          className="weekly-workshop"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await change("week.offer", { taskIds: offered }))
              setEditing(false);
          }}
        >
          <p>
            {he
              ? "בחרו אפשרויות לכל אחד. שומרים בחירות שכבר הובטחו."
              : "Offer a few choices for each person. Already chosen missions stay on the menu."}
          </p>
          <MissionPicker
            selected={offered}
            setSelected={setOffered}
            limit={30}
            locked={locked}
          />
          <div className="play-form-footer">
            <button type="button" className="play-link" onClick={onNew}>
              <Plus size={17} />
              {he ? "משימה חדשה" : "Make a mission"}
            </button>
            <button
              type="button"
              className="play-link"
              onClick={() => setEditing(false)}
            >
              {he ? "ביטול" : "Cancel"}
            </button>
            <button className="play-button" disabled={busy}>
              {he ? "התפריט מוכן" : "Menu’s ready!"}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="weekly-choice-count">
            <span>{selected.length}</span>
            <strong>
              {he
                ? "מתוך 3 בחירות שלי השבוע"
                : "of 3 little promises this week"}
            </strong>
            <small>
              {he
                ? "הבחירות מתחדשות בכל יום שני. המשימות נשארות."
                : "A fresh menu each Monday. Existing missions stay."}
            </small>
          </div>
          {!mine.length && (
            <div className="play-empty">
              <Sprout size={40} />
              <h2>
                {he ? "קצת מקום לבחירה שלי" : "A little room for my choice"}
              </h2>
              <p>
                {he
                  ? "ההורה יכול להוסיף לתפריט משימות שמשויכות אליכם."
                  : "A parent can add your assigned missions to the menu."}
              </p>
            </div>
          )}
          <div className="weekly-mission-menu">
            {mine.map((task) => {
              const chosen = selected.includes(String(task.id));
              return (
                <article key={task.id} className={chosen ? "is-chosen" : ""}>
                  <span className="weekly-pick-token">
                    {task.status === "Done" ? (
                      <CheckCheck size={25} />
                    ) : chosen ? (
                      <Check size={25} />
                    ) : (
                      <Plus size={25} />
                    )}
                  </span>
                  <div>
                    <h3>{tx(task.title)}</h3>
                    <small>
                      {task.subItems?.length || 0}{" "}
                      {he ? "צעדים קטנים" : "little steps"} ·{" "}
                      {task.pointsValue ?? task.points} XP
                    </small>
                  </div>
                  <div className="weekly-pick-actions">
                    <button
                      className={`play-button small ${chosen ? "secondary" : ""}`}
                      disabled={
                        busy ||
                        !isOpen(task) ||
                        (!chosen && selected.length >= 3)
                      }
                      onClick={() =>
                        change("week.choose", {
                          taskId: String(task.id),
                          selected: !chosen,
                        })
                      }
                    >
                      {task.status === "Done"
                        ? he
                          ? "עשיתי את זה"
                          : "I did it"
                        : chosen
                          ? he
                            ? "שלי · שינוי בחירה"
                            : "Mine · change choice"
                          : he
                            ? "אני בוחר את זאת"
                            : "I’ll take this one"}
                    </button>
                    <button className="play-link" onClick={() => onOpen(task)}>
                      {he ? "לראות את הצעדים" : "See the steps"}
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
      <div className="weekly-family-promises">
        <h2>{he ? "מה בחרנו ביחד" : "Our little promises"}</h2>
        {users.map((member) => (
          <div key={member.id}>
            <span className="play-avatar">{member.fullName?.slice(0, 1)}</span>
            <strong>{member.fullName}</strong>
            <p>
              {(week?.choices[String(member.id)] || [])
                .map((id) =>
                  tx(
                    tasks.find((t) => String(t.id) === id)?.title ||
                      (he ? "משימה קודמת" : "Earlier mission"),
                  ),
                )
                .join(" · ") ||
                (he
                  ? "יש מקום לבחור, בקצב שלכם"
                  : "There’s room to choose, in your own time")}
            </p>
          </div>
        ))}
      </div>
      {state.canManage && suggestions.length > 0 && (
        <details className="play-parent-tools">
          <summary>
            {he
              ? "נותנים לכולם לנסות משהו אחר"
              : "Give everyone a different turn"}
          </summary>
          <p>
            {he
              ? "הצעות לפי מספר משימות שהושלמו באותו תחום. בדקו התאמה לפני שינוי השיוך."
              : "Suggestions favour someone with fewer completed jobs in that skill. Check that the job fits before reassigning it."}
          </p>
          {suggestions.map(({ task, candidate }) => (
            <div className="rotation-suggestion" key={task.id}>
              <span>
                {tx(task.title)}
                <small>
                  {memberName(users, owner(task))} → {candidate.fullName}
                </small>
              </span>
              <button
                className="play-button small secondary"
                disabled={rotating || busy}
                onClick={async () => {
                  setRotating(true);
                  try {
                    await updateTask(task.id, { assignedUserId: candidate.id });
                  } catch {
                    /* AppContext shows the failure. */
                  } finally {
                    setRotating(false);
                  }
                }}
              >
                {he ? "נותנים לו תור" : "Give them a turn"}
              </button>
            </div>
          ))}
        </details>
      )}
    </section>
  );
}

function HelpingHands({ onOpen }) {
  const { state, busy, change } = usePlay();
  const { users, tasks } = useApp();
  const { lang, tx } = useI18n();
  const he = lang === "he";
  const requests = state.help.filter((h) => h.status !== "resolved");
  return (
    <section className="helping-hands">
      <div className="helping-intro">
        <HandHeart size={52} />
        <h1>{he ? "לא צריך לעשות הכל לבד" : "Nobody has to do it alone"}</h1>
        <p>
          {he
            ? "בקשה קטנה לעזרה היא צעד קדימה. בוחרים תשובה שמתאימה באמת."
            : "A little ask for help is a step forward. Choose a reply you can follow through on."}
        </p>
      </div>
      {!requests.length && (
        <div className="play-empty">
          <Check size={38} />
          <h2>{he ? "כרגע הכל רגוע כאן" : "All quiet here for now"}</h2>
          <p>
            {he
              ? "בתוך כל משימה אפשר לבחור ״אפשר קצת עזרה?״ ולספר מה צריך."
              : "Inside a mission, choose “A little help?” to tell your parent what you need."}
          </p>
        </div>
      )}
      <div className="help-request-list">
        {requests.map((request) => {
          const kind = HELP_KINDS.find((k) => k.id === request.kind);
          const reply = HELP_REPLIES.find((r) => r.id === request.reply);
          const task = tasks.find((t) => String(t.id) === request.taskId);
          return (
            <article key={request.id}>
              <div className="help-person">
                <span className="play-avatar">
                  {memberName(users, request.userId).slice(0, 1)}
                </span>
                <div>
                  <strong>{memberName(users, request.userId)}</strong>
                  <h2>{he ? kind?.he : kind?.en}</h2>
                </div>
                <HandHeart size={30} />
              </div>
              <p>
                {tx(request.title)}
                {request.step
                  ? ` · ${he ? "צעד" : "step"} ${request.step}`
                  : ""}
              </p>
              {reply && (
                <p className="help-receipt" role="status">
                  {he ? reply.he : reply.en}
                </p>
              )}
              {state.canManage && (
                <div className="help-options">
                  {HELP_REPLIES.map((r) => (
                    <button
                      key={r.id}
                      aria-pressed={request.reply === r.id}
                      disabled={busy}
                      onClick={() =>
                        change("help.reply", { id: request.id, reply: r.id })
                      }
                    >
                      {he ? r.he : r.en}
                    </button>
                  ))}
                </div>
              )}
              <div className="ticket-actions">
                {task && (
                  <button className="play-link" onClick={() => onOpen(task)}>
                    {he ? "פותחים את המשימה" : "Open the mission"}
                    <ArrowRight size={17} />
                  </button>
                )}
                <button
                  className="play-link"
                  disabled={busy}
                  onClick={() => change("help.resolve", { id: request.id })}
                >
                  <Check size={17} />
                  {he ? "הסתדרנו" : "We’re okay now"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <p className="help-refresh-note">
        {he
          ? "הבקשות מתעדכנות כל חצי דקה כשהעמוד פתוח. אין שליחת הודעות מחוץ לבית."
          : "Requests update every 30 seconds while the app is open. They stay inside your household."}
      </p>
    </section>
  );
}

export default function FamilyAdventure() {
  const { state } = usePlay();
  const { user } = useAuth();
  const { lang } = useI18n();
  const he = lang === "he";
  const { path, navigate } = useRoute();
  const {
    tasks,
    users,
    household,
    getTaskPermissions,
    createTask,
    updateTask,
    permissions,
  } = useApp();
  const requested = new URLSearchParams(path.split("?")[1]).get("tab");
  const active = ["room", "week", "help"].includes(requested)
    ? requested
    : "adventure";
  const [detailId, setDetailId] = useState(null),
    [editor, setEditor] = useState(undefined);
  const detail = tasks.find((t) => String(t.id) === detailId);
  const saved = useSavedChores(user?.id, household?.id);
  return (
    <div className="family-play" dir={he ? "rtl" : "ltr"}>
      <div className="play-wayfinding">
        <button className="play-link" onClick={() => navigate("/")}>
          <ArrowLeft size={17} />
          {he ? "בחזרה לבית" : "Back to our world"}
        </button>
        <span>{household?.name}</span>
      </div>
      <nav
        className="family-play-nav"
        aria-label={he ? "הרפתקאות בבית" : "Adventures at home"}
      >
        {[
          ["adventure", Rocket, "Our adventure", "ההרפתקה שלנו"],
          ["room", BedDouble, "My room", "החדר שלי"],
          ["week", CalendarDays, "Our week", "השבוע שלנו"],
          ["help", HandHeart, "Helping hands", "ידיים עוזרות"],
        ].map(([id, Icon, en, heb]) => (
          <button
            key={id}
            aria-current={active === id ? "page" : undefined}
            onClick={() => {
              navigate(`/adventures${id === "adventure" ? "" : `?tab=${id}`}`);
              window.scrollTo({ top: 0, behavior: "instant" });
            }}
          >
            <Icon size={20} />
            <span>{he ? heb : en}</span>
            {id === "help" &&
              state?.help.some((h) => h.status !== "resolved") && (
                <b>
                  {state.help.filter((h) => h.status !== "resolved").length}
                </b>
              )}
          </button>
        ))}
      </nav>
      <PlayNotice />
      {state && (
        <div key={active} className="play-chapter">
          {active === "adventure" ? (
            <Adventure
              onOpen={(t) => setDetailId(String(t.id))}
              onNew={() => setEditor(null)}
            />
          ) : active === "room" ? (
            <PersonalRoom />
          ) : active === "week" ? (
            <WeeklyPicks
              onOpen={(t) => setDetailId(String(t.id))}
              onNew={() => setEditor(null)}
            />
          ) : (
            <HelpingHands onOpen={(t) => setDetailId(String(t.id))} />
          )}
        </div>
      )}
      {detail && (
        <QuestDetailDialog
          key={detail.id}
          task={detail}
          users={users}
          requireProof={household?.requireProofApproval === true}
          permissions={getTaskPermissions(detail)}
          onClose={() => setDetailId(null)}
          onEdit={() => {
            setEditor(detail);
            setDetailId(null);
          }}
          isSaved={saved.isSaved(detail.id)}
          savedReady={saved.ready}
          onToggleSaved={() => saved.toggle(detail.id)}
        />
      )}
      {editor !== undefined && (
        <TaskModal
          task={editor}
          users={users}
          permissions={editor ? getTaskPermissions(editor) : permissions}
          currentUserId={user?.id}
          onClose={() => setEditor(undefined)}
          onSave={async (data) => {
            if (editor) await updateTask(editor.id, data);
            else await createTask(data);
            setEditor(undefined);
          }}
        />
      )}
    </div>
  );
}
