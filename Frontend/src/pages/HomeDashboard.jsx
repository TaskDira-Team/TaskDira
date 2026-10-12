import { useState } from "react";
import {
  Bookmark,
  Check,
  Plus,
  Search,
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
import { AdventureInvitation } from "../components/world/PlayBits";
import FamilyWorld from "../components/world/FamilyWorld";
import QuestPath from "../components/board/QuestPath";
import RoomPicker from "../components/board/RoomPicker";
import QuestDetailDialog from "../components/board/QuestDetailDialog";
import { getQuickCompletionAction } from "../utils/questActions";
import TaskModal from "../components/board/TaskModal";
import { parseTaskDate, taskPoints, isDone, dayKey } from "../utils/insights";
import "../components/landing/houseJourney.css";

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
    moveTask,
    permissions,
    getTaskPermissions,
    createTask,
    updateTask,
  } = useApp();
  const { path } = useRoute();
  const he = lang === "he";
  const tasksPage = path === "/tasks";
  const [filter, setFilter] = useState(
    user?.isManagedProfile ? "mine" : "open",
  );
  const [search, setSearch] = useState("");
  const [room, setRoom] = useState("all");
  const [view, setView] = useState("path");
  const [editor, setEditor] = useState(undefined);
  const [detailId, setDetailId] = useState(null);
  const detailTask = tasks.find((task) => task.id === detailId);
  const openDetails = (task) => setDetailId(task.id);
  const requireProof = household?.requireProofApproval === true;
  const [busy, setBusy] = useState(null);
  const saved = useSavedChores(user?.id, household?.id);
  const filtered = tasks.filter((task) => {
    const taskRoom = ["kitchen", "cooking"].includes(task.categoryId)
      ? "kitchen"
      : ["room", "bedroom"].includes(task.categoryId)
        ? "room"
        : task.categoryId === "living"
          ? "living"
          : "other";
    if (room !== "all" && taskRoom !== room) return false;
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
            {task.subItems?.length > 0 && (
              <span className="quest-step-summary">
                {" "}
                · {task.subItems.filter((s) => s.isCompleted).length}/
                {task.subItems.length} {he ? "צעדים" : "steps"}
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
        <span className="quest-assignee-name">
          {assignee?.fullName || (he ? "ללא שיוך" : "Unassigned")}
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
      {!tasksPage ? (
        <FamilyWorld onOpen={openDetails} onNew={() => setEditor(null)} />
      ) : (
        <>
          <div className="world-page-heading">
            <div>
              <h1>{he ? "בוחרים משימה" : "Pick your next mission"}</h1>
              <p>
                {he
                  ? "כל מה שהבית צריך, במקום אחד."
                  : "Take any path. Every mission can be played in any order."}
              </p>
            </div>
            {permissions.canCreateTask && (
              <button className="world-button" onClick={() => setEditor(null)}>
                <Plus size={18} />
                {he ? "משימה חדשה" : "New quest"}
              </button>
            )}
          </div>
          <AdventureInvitation />
          <div className="quests-full">
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
                  <div className="quest-search-field">
                    <Search size={19} aria-hidden="true" />
                    <label className="sr-only" htmlFor="quest-search">
                      {he ? "חיפוש משימות" : "Search quests"}
                    </label>
                    <input
                      id="quest-search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={
                        he ? "חיפוש משימה…" : "Search your missions…"
                      }
                    />
                  </div>
                  <RoomPicker value={room} onChange={setRoom} he={he} />
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
                              {
                                weekday: "long",
                                month: "short",
                                day: "numeric",
                              },
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
            </section>
          </div>
        </>
      )}
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
