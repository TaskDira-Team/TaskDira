import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bookmark,
  Check,
  CheckCheck,
  Coins,
  Flame,
  Gift,
  Plus,
  Search,
  Sparkles,
  Sun,
  Moon,
  Layers3,
  ListTodo,
  CalendarDays,
  Utensils,
  Armchair,
  BedDouble,
  Home,
  Loader2,
  Route,
} from "lucide-react";
import { useI18n } from "../context/I18nContext";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { useRoute } from "../context/RouteContext";
import useSavedChores from "../hooks/useSavedChores";
import QuestPath from "../components/board/QuestPath";
import QuestDetailDialog from "../components/board/QuestDetailDialog";
import { getQuickCompletionAction } from "../utils/questActions";
import TaskModal from "../components/board/TaskModal";
import HouseStage from "../components/landing/HouseStage";
import { ActivityChart } from "../components/insights/HouseholdCharts";
import {
  buildInsights,
  parseTaskDate,
  taskPoints,
  isDone,
  dayKey,
} from "../utils/insights";
import "../components/landing/houseJourney.css";
import { deriveMilestoneProgress } from "../utils/milestoneProgress";

const rooms = [
  ["home", Home, "Whole home", "כל הבית"],
  ["kitchen", Utensils, "Kitchen", "מטבח"],
  ["living", Armchair, "Living room", "סלון"],
  ["bedroom", BedDouble, "Bedroom", "חדר שינה"],
];
const roomCategory = {
  kitchen: ["kitchen", "cooking"],
  living: ["living", "cleaning"],
  bedroom: ["room", "bedroom"],
};
const roomIcon = (category) =>
  category === "kitchen" || category === "cooking"
    ? Utensils
    : category === "room" || category === "bedroom"
      ? BedDouble
      : category === "living"
        ? Armchair
        : ListTodo;

export default function HomeDashboard() {
  const { lang, tx, category } = useI18n();
  const { user } = useAuth();
  const {
    tasks,
    users,
    household,
    rewards,
    moveTask,
    permissions,
    getTaskPermissions,
    createTask,
    updateTask,
  } = useApp();
  const { path, navigate } = useRoute();
  const he = lang === "he";
  const tasksPage = path === "/tasks";
  const [filter, setFilter] = useState("open");
  const [room, setRoom] = useState("home");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("path");
  const [night, setNight] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [model, setModel] = useState(true);
  const [editor, setEditor] = useState(undefined);
  const [detailId, setDetailId] = useState(null);
  const detailTask = tasks.find((task) => task.id === detailId);
  const openDetails = (task) => setDetailId(task.id);
  const requireProof = household?.requireProofApproval === true;
  const [busy, setBusy] = useState(null);
  const saved = useSavedChores(user?.id, household?.id);
  const insight = useMemo(() => buildInsights(tasks, users), [tasks, users]);
  const me = users.find((u) => u.id === user?.id) || user;
  const balance = me?.balance ?? 0;
  const progress = deriveMilestoneProgress(tasks, me);
  const reward = [...rewards]
    .filter((r) => !r.claimed && (r.pointsCost ?? r.cost ?? 0) > 0)
    .sort((a, b) => (a.pointsCost ?? a.cost) - (b.pointsCost ?? b.cost))[0];
  const rewardCost = reward?.pointsCost ?? reward?.cost ?? 0;
  const completedRooms = [
    ["kitchen", "dishes"],
    ["living", "plants"],
    ["bedroom", "laundry"],
  ]
    .filter(([id]) => {
      const group = tasks.filter((t) =>
        roomCategory[id].includes(t.categoryId),
      );
      return group.length && group.every(isDone);
    })
    .map(([, quest]) => quest);
  const filtered = tasks.filter((task) => {
    if (room !== "home" && !roomCategory[room]?.includes(task.categoryId))
      return false;
    if (
      search &&
      !`${tx(task.title)} ${task.title} ${category(task.categoryId)}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
      return false;
    if (filter === "done") return isDone(task);
    if (filter === "saved") return saved.isSaved(task.id);
    if (filter === "mine")
      return (
        !isDone(task) &&
        String(task.assignedUserId ?? task.assigneeId) === String(user?.id)
      );
    return !isDone(task);
  });
  const grouped = new Map();
  for (const task of filtered) {
    const date = parseTaskDate(task.dueDate ?? task.dueAt);
    const key = date ? dayKey(date) : "undated";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(task);
  }
  const groups = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
  const complete = async (task) => {
    if (busy) return;
    const intent = getQuickCompletionAction(
      task,
      getTaskPermissions(task),
      requireProof,
    );
    if (intent === "none") return;
    if (intent === "proof" || intent === "review") {
      openDetails(task);
      return;
    }
    setBusy(task.id);
    try {
      await moveTask(task.id, "Done");
    } catch {
      /* Shared toast exposes the error. */
    } finally {
      setBusy(null);
    }
  };
  const taskRow = (task) => {
    const done = isDone(task),
      Icon = roomIcon(task.categoryId);
    const assignee = users.find(
      (u) => u.id === (task.assignedUserId ?? task.assigneeId),
    );
    const due = parseTaskDate(task.dueDate ?? task.dueAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdue = !done && due && due < today;
    return (
      <article
        className={`quest-row ${done ? "is-complete" : ""}`}
        key={task.id}
      >
        <button
          className="quest-complete"
          disabled={
            !!busy ||
            getQuickCompletionAction(
              task,
              getTaskPermissions(task),
              requireProof,
            ) === "none"
          }
          onClick={() => complete(task)}
          aria-label={`${task.status === "PendingApproval" ? (he ? "בדיקת משימה" : "Review quest") : he ? "השלמת משימה" : "Complete quest"}: ${tx(task.title)}`}
        >
          {busy === task.id ? (
            <Loader2 size={17} className="animate-spin" />
          ) : done ? (
            <Check size={18} />
          ) : (
            <span />
          )}
        </button>
        <span className={`quest-category category-${task.categoryId}`}>
          <Icon size={20} />
        </span>
        <button className="quest-content" onClick={() => openDetails(task)}>
          <strong>{tx(task.title)}</strong>
          <span>
            {category(task.categoryId)}
            {due && (
              <span className={overdue ? "is-overdue" : ""}>
                {" "}
                ·{" "}
                {overdue
                  ? he
                    ? "באיחור"
                    : "Overdue"
                  : due.toLocaleDateString(he ? "he-IL" : "en-GB", {
                      month: "short",
                      day: "numeric",
                    })}
              </span>
            )}
            {task.status === "PendingApproval" && (
              <span> · {he ? "ממתין לאישור" : "Awaiting approval"}</span>
            )}
          </span>
        </button>
        <span
          className="quest-assignee"
          title={assignee?.fullName || (he ? "ללא שיוך" : "Unassigned")}
        >
          {(assignee?.fullName || assignee?.name || "–").slice(0, 1)}
        </span>
        <strong className="quest-points">
          +{taskPoints(task)}
          <small>XP</small>
        </strong>
        <button
          className={`quest-bookmark ${saved.isSaved(task.id) ? "is-saved" : ""}`}
          disabled={!saved.ready}
          aria-pressed={saved.isSaved(task.id)}
          onClick={() => saved.toggle(task.id)}
          aria-label={`${saved.isSaved(task.id) ? (he ? "ביטול שמירה" : "Unsave") : he ? "שמירה" : "Save"}: ${tx(task.title)}`}
        >
          <Bookmark
            size={18}
            fill={saved.isSaved(task.id) ? "currentColor" : "none"}
          />
        </button>
      </article>
    );
  };
  return (
    <div className="world-page">
      <div className="world-page-heading">
        <div>
          <h1>
            {tasksPage
              ? he
                ? "דברים קטנים. ניצחונות גדולים."
                : "Let’s go on a quest!"
              : he
                ? `איזה כיף שחזרת, ${(me?.fullName || "").split(" ")[0]}.`
                : `Hey ${(me?.fullName || me?.name || "friend").split(" ")[0]}! Ready to play?`}
            {!tasksPage && <Sun className="greeting-sun" />}
          </h1>
          <p>
            {tasksPage
              ? he
                ? "כל מה שהבית צריך, במקום אחד."
                : "Follow the stars! Every little chore is a new adventure."
              : he
                ? "יום חדש לעשות טוב, להרוויח נקודות ולגדול ביחד."
                : "Pick a quest. Grab some coins. Make your home happy!"}
          </p>
        </div>
        {permissions.canCreateTask && (
          <button className="world-button" onClick={() => setEditor(null)}>
            <Plus size={18} />
            {he ? "משימה חדשה" : "New quest"}
          </button>
        )}
      </div>
      {!tasksPage && (
        <>
          <div className="home-overview">
            <section className={`home-world ${night ? "is-night" : ""}`}>
              <div className="home-world-copy">
                <h2>{he ? "העולם הקטן שלנו." : "Home sweet playground!"}</h2>
                <p>
                  {insight.open
                    ? he
                      ? `${insight.open} הזדמנויות לעשות היום טוב.`
                      : `${insight.open} quests are waiting. Let’s make some magic!`
                    : he
                      ? "הבית מוכן לרגעים הטובים."
                      : "Your home is ready for the good stuff."}
                </p>
                <button
                  className="home-world-link"
                  onClick={() => {
                    setModel(true);
                    setExploded(!exploded);
                  }}
                >
                  <Layers3 size={16} />
                  {he ? "גלו כל פינה" : "Discover every corner"}
                  <ArrowUpRight size={16} />
                </button>
              </div>
              <div className="home-model">
                {model ? (
                  <HouseStage
                    he={he}
                    view={room}
                    night={night}
                    exploded={exploded}
                    completed={completedRooms}
                    onRoomChange={setRoom}
                  />
                ) : (
                  <button
                    className="home-model-poster"
                    onClick={() => setModel(true)}
                    aria-label={
                      he ? "פתיחת הבית בתלת ממד" : "Explore your home in 3D"
                    }
                  >
                    <img src="/images/taskdira-house.webp" alt="" />
                    <span>
                      <Layers3 size={16} />
                      {he ? "נכנסים לתלת ממד" : "Step inside · 3D"}
                    </span>
                  </button>
                )}
              </div>
              <div className="home-world-controls">
                <button
                  className="world-icon-button"
                  aria-label={he ? "תאורת לילה" : "Evening lighting"}
                  aria-pressed={night}
                  onClick={() => {
                    setModel(true);
                    setNight(!night);
                  }}
                >
                  {night ? <Moon size={18} /> : <Sun size={18} />}
                </button>
              </div>
              <div
                className="home-room-nav"
                aria-label={he ? "בחירת חדר" : "Choose a room"}
              >
                {rooms.map(([id, Icon, en, heb]) => (
                  <button
                    key={id}
                    aria-pressed={room === id}
                    onClick={() => {
                      setRoom(id);
                      if (id !== "home") setModel(true);
                    }}
                  >
                    <Icon size={16} />
                    {he ? heb : en}
                  </button>
                ))}
              </div>
            </section>
            <section className="home-next-reward">
              <Gift size={32} strokeWidth={1.6} />
              <h2>{he ? "משהו טוב באופק." : "Ooh, treasure!"}</h2>
              <p>
                {reward
                  ? tx(reward.title || reward.name)
                  : he
                    ? "בחרו משהו ששווה לעשות בשבילו."
                    : "Make room for something worth working toward."}
              </p>
              <div
                className="reward-progress"
                role="progressbar"
                aria-label={he ? "התקדמות לפרס" : "Progress toward reward"}
                aria-valuemin={0}
                aria-valuemax={Math.max(1, rewardCost)}
                aria-valuenow={Math.min(balance, Math.max(1, rewardCost))}
              >
                <span
                  style={{
                    width: `${rewardCost ? Math.min(100, (balance / rewardCost) * 100) : 0}%`,
                  }}
                />
              </div>
              <span className="home-reward-caption">
                {reward
                  ? balance >= rewardCost
                    ? he
                      ? "הפרס הזה כבר בהישג יד!"
                      : "This one is within reach!"
                    : `${rewardCost - balance} ${he ? "מטבעות לרגע הבא" : "more coins to your next little joy"}`
                  : he
                    ? "הוסיפו פרס ראשון בחנות"
                    : "Add your first reward in the shop"}
              </span>
              <button onClick={() => navigate("/rewards")}>
                {he ? "לחנות הפרסים" : "Visit the reward shop"}
                <ArrowUpRight size={18} />
              </button>
            </section>
          </div>
          <div className="world-stats four">
            <div className="world-stat mint">
              <CheckCheck />
              <span>{he ? "ניצחונות השבוע" : "Weekly wins"}</span>
              <strong>{insight.periodDone}</strong>
              <small>
                {he ? "משימות שהושלמו ב־7 ימים" : "Quests completed in 7 days"}
              </small>
            </div>
            <div className="world-stat peach">
              <Coins />
              <span>{he ? "המטבעות שלי" : "Your coin stash"}</span>
              <strong>{balance}</strong>
              <small>
                {he ? "מטבעות לפרסים שאתם אוהבים" : "Coins for things you love"}
              </small>
            </div>
            <div className="world-stat lavender">
              <Sparkles />
              <span>{he ? "הניקוד שלי" : "Star power"}</span>
              <strong>
                {me?.points ?? 0}
                <em>XP</em>
              </strong>
              <small>
                {he ? "כל מאמץ קטן נחשב" : "Every little effort counts"}
              </small>
            </div>
            <div className="world-stat butter">
              <Flame />
              <span>{he ? "שומרים על הרצף" : "On fire!"}</span>
              <strong>
                {progress.streak}
                <em>{he ? "ימים" : "days"}</em>
              </strong>
              <small>
                {he ? "הרצף האישי שלכם" : "Your personal activity streak"}
              </small>
            </div>
          </div>
        </>
      )}
      <div className={tasksPage ? "quests-full" : "home-bottom-grid"}>
        <section className="world-panel quest-panel">
          <div className="world-section-heading">
            <h2>
              {tasksPage
                ? he
                  ? "המשימות שלנו"
                  : "Your quest road"
                : he
                  ? "הניצחון הקטן הבא"
                  : "Follow the fun!"}
            </h2>
            <span className="world-count">{filtered.length}</span>
          </div>
          <div className="quest-tools">
            <div
              className="world-tabs"
              aria-label={he ? "סינון משימות" : "Filter quests"}
            >
              {[
                ["open", "To do", "לביצוע"],
                ["mine", "Mine", "שלי"],
                ["done", "Done", "הושלמו"],
                ["saved", "Saved", "שמורות"],
              ].map(([id, en, heb]) => (
                <button
                  key={id}
                  aria-pressed={filter === id}
                  onClick={() => setFilter(id)}
                >
                  {he ? heb : en}
                </button>
              ))}
            </div>
            <div className="quest-view">
              <button
                aria-label={he ? "מסלול הרפתקאות" : "Adventure path"}
                aria-pressed={view === "path"}
                onClick={() => setView("path")}
              >
                <Route size={18} />
              </button>
              <button
                aria-label={he ? "תצוגת רשימה" : "List view"}
                aria-pressed={view === "list"}
                onClick={() => setView("list")}
              >
                <ListTodo size={17} />
              </button>
              <button
                aria-label={he ? "קיבוץ לפי תאריך" : "Group by date"}
                aria-pressed={view === "calendar"}
                onClick={() => setView("calendar")}
              >
                <CalendarDays size={17} />
              </button>
            </div>
          </div>
          {tasksPage && (
            <div className="quest-search">
              <Search size={17} />
              <label className="sr-only" htmlFor="quest-search">
                {he ? "חיפוש משימות" : "Search quests"}
              </label>
              <input
                id="quest-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  he ? "מחפשים משהו לעשות?" : "Find your next little win…"
                }
              />
              <select
                aria-label={he ? "סינון לפי חדר" : "Filter by room"}
                value={room}
                onChange={(e) => setRoom(e.target.value)}
              >
                {rooms.map(([id, , en, heb]) => (
                  <option key={id} value={id}>
                    {he ? heb : en}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="quest-list">
            {view === "path" && filtered.length > 0 ? (
              <QuestPath
                tasks={filtered}
                he={he}
                tx={tx}
                onOpen={openDetails}
                onComplete={complete}
                getPermissions={getTaskPermissions}
                busy={busy}
                preview={!tasksPage}
              />
            ) : view === "list" ? (
              filtered.map(taskRow)
            ) : (
              groups.map(([key, group]) => (
                <div className="quest-date-group" key={key}>
                  <h3>
                    <CalendarDays size={16} />
                    {key === "undated"
                      ? he
                        ? "ללא תאריך"
                        : "Whenever you’re ready"
                      : new Date(`${key}T12:00:00`).toLocaleDateString(
                          he ? "he-IL" : "en-GB",
                          { weekday: "long", month: "short", day: "numeric" },
                        )}
                  </h3>
                  {group.map(taskRow)}
                </div>
              ))
            )}
            {!filtered.length && (
              <div className="quest-empty">
                <Home size={32} strokeWidth={1.5} />
                <h3>
                  {he ? "יש מקום לדברים טובים." : "Room for good things."}
                </h3>
                <p>
                  {filter === "saved"
                    ? he
                      ? "שמרו משימה בלחיצה על הסימנייה."
                      : "Bookmark a quest to keep it close."
                    : he
                      ? "אין כרגע משימות בסינון הזה."
                      : "No quests in this view just yet."}
                </p>
                <button
                  className="world-text-button"
                  disabled={!permissions.canCreateTask}
                  onClick={() => setEditor(null)}
                >
                  {he ? "מוסיפים משימה?" : "Add a little quest"}
                  <Plus size={15} />
                </button>
              </div>
            )}
          </div>
          {!tasksPage && (
            <button
              className="quest-see-all"
              onClick={() => navigate("/tasks")}
            >
              {he ? "כל המשימות של הבית" : "See all household quests"}
              <ArrowUpRight size={16} />
            </button>
          )}
        </section>
        {!tasksPage && (
          <section className="world-panel home-activity">
            <div className="game-companion">
              <img src="/images/dira-mascot.png" alt="" />
              <div className="companion-speech">
                {he ? "משימה קטנה. כיף ענקי!" : "Small chore. HUGE high five!"}
                <span>✦ ✦ ✦</span>
              </div>
            </div>
            <div className="world-section-heading">
              <h2>{he ? "הקצב שלנו" : "Watch your wins grow!"}</h2>
              <button
                className="world-icon-button"
                onClick={() => navigate("/insights")}
                aria-label={he ? "כל נתוני ההתקדמות" : "View all insights"}
              >
                <ArrowUpRight size={20} />
              </button>
            </div>
            <p>
              {he
                ? "שבעה ימים של עשייה ביחד."
                : "Your team’s power-ups from the last 7 days."}
            </p>
            <ActivityChart data={insight.daily} he={he} compact />
            <button
              className="world-text-button"
              onClick={() => navigate("/insights")}
            >
              {he ? "גלו את הסיפור המלא" : "Explore the full story"}
              <ArrowUpRight size={17} />
            </button>
          </section>
        )}
      </div>
      {detailTask && (
        <QuestDetailDialog
          key={detailTask.id}
          task={detailTask}
          users={users}
          requireProof={requireProof}
          permissions={getTaskPermissions(detailTask)}
          onClose={() => setDetailId(null)}
          onEdit={(task) => {
            setDetailId(null);
            setEditor(task);
          }}
          isSaved={saved.isSaved(detailTask.id)}
          savedReady={saved.ready}
          onToggleSaved={() => saved.toggle(detailTask.id)}
        />
      )}
      {editor !== undefined && (
        <TaskModal
          key={editor?.id || "new"}
          task={editor}
          variant="dark"
          users={users}
          permissions={editor ? getTaskPermissions(editor) : permissions}
          currentUserId={user?.id}
          onSave={async (data) => {
            if (editor) await updateTask(editor.id, data);
            else await createTask(data);
            setEditor(undefined);
          }}
          onClose={() => setEditor(undefined)}
        />
      )}
    </div>
  );
}
