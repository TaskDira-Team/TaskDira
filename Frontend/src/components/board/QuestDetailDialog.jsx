import { useState } from "react";
import {
  Bookmark,
  Camera,
  Check,
  Clock3,
  Pencil,
  Play,
  RotateCcw,
  ShieldCheck,
  Star,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { useI18n } from "../../context/I18nContext";
import { useApp } from "../../context/AppContext";
import { validateProofUpload } from "../../services/proofService";
import { parseTaskDate, taskPoints } from "../../utils/insights";
import { Dialog, Field, GhostButton, LimeButton, fieldClass } from "../ui/kit";

export default function QuestDetailDialog({
  task,
  users,
  requireProof,
  permissions,
  onEdit,
  onClose,
  isSaved,
  savedReady,
  onToggleSaved,
}) {
  const { lang, tx, category, dir } = useI18n();
  const he = lang === "he";
  const {
    moveTask,
    submitTaskProof,
    approveTask,
    rejectTask,
    claimTask,
    deleteTask,
    toggleSubItem,
  } = useApp();
  const [action, setAction] = useState(null);
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState(null);
  const [readingPhoto, setReadingPhoto] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const pending = task.status === "PendingApproval";
  const done = task.status === "Done";
  const busy = !!action || readingPhoto;
  const proofNeeded =
    !done && !pending && requireProof && permissions.canSubmitProof;
  const assignee = users.find(
    (u) => String(u.id) === String(task.assignedUserId ?? task.assigneeId),
  );
  const due = parseTaskDate(task.dueDate ?? task.dueAt);
  const close = () => {
    if (!busy) onClose();
  };
  const run = async (name, operation, closeAfter = true) => {
    if (busy) return;
    setAction(name);
    setError("");
    try {
      await operation();
      if (closeAfter) onClose();
    } catch (err) {
      setError(
        err?.message ||
          (he
            ? "משהו השתבש. נסו שוב."
            : "Something went wrong. Please try again."),
      );
    } finally {
      setAction(null);
    }
  };
  const selectPhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setReadingPhoto(true);
    setError("");
    setPhoto(null);
    try {
      if (
        !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(
          file.type,
        )
      )
        throw new Error(
          he
            ? "בחרו תמונת PNG, JPG, WebP או GIF."
            : "Choose a PNG, JPG, WebP or GIF image.",
        );
      if (file.size > 3 * 1024 * 1024)
        throw new Error(
          he ? "בחרו תמונה קטנה מ־3MB." : "Choose an image smaller than 3 MB.",
        );
      const { dataUrl } = await validateProofUpload(file);
      setPhoto(dataUrl);
    } catch (err) {
      setError(
        err?.message ||
          (he ? "לא הצלחנו לקרוא את התמונה." : "We could not read that image."),
      );
    } finally {
      setReadingPhoto(false);
    }
  };
  return (
    <div dir={dir}>
      <Dialog
        open
        title={tx(task.title)}
        onClose={close}
        size="md"
        footer={
          confirmDelete ? (
            <div className="flex flex-wrap gap-3">
              <GhostButton
                disabled={busy}
                onClick={() => setConfirmDelete(false)}
              >
                {he ? "חזרה" : "Go back"}
              </GhostButton>
              <button
                className="world-button"
                style={{ background: "#ad3e2d", color: "#ffffff" }}
                disabled={busy}
                onClick={() => run("delete", () => deleteTask(task.id))}
              >
                {action === "delete"
                  ? he
                    ? "מוחקים…"
                    : "Deleting…"
                  : he
                    ? "מחיקת המשימה"
                    : "Delete quest"}
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <GhostButton disabled={busy} onClick={close}>
                {he ? "סגירה" : "Close"}
              </GhostButton>
              {proofNeeded && (
                <LimeButton
                  disabled={busy || !photo}
                  onClick={() =>
                    run("proof", () => submitTaskProof(task.id, photo))
                  }
                >
                  {action === "proof"
                    ? he
                      ? "שולחים…"
                      : "Sending…"
                    : he
                      ? "שליחה לאישור"
                      : "Send for approval"}
                </LimeButton>
              )}
              {!done && !pending && !requireProof && permissions.canMove && (
                <LimeButton
                  disabled={busy}
                  onClick={() =>
                    run("complete", () => moveTask(task.id, "Done"))
                  }
                >
                  <span className="inline-flex items-center gap-2">
                    <Check size={18} />
                    {he ? "סיימתי!" : "I did it!"}
                  </span>
                </LimeButton>
              )}
              {pending && permissions.canApprove && !rejecting && (
                <LimeButton
                  disabled={busy}
                  onClick={() => run("approve", () => approveTask(task.id))}
                >
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck size={18} />
                    {he ? "אישור המשימה" : "Approve quest"}
                  </span>
                </LimeButton>
              )}
              {pending && permissions.canApprove && rejecting && (
                <LimeButton
                  disabled={busy}
                  onClick={() =>
                    run("reject", () =>
                      rejectTask(task.id, reason.trim() || undefined),
                    )
                  }
                >
                  {he ? "שליחה לניסיון נוסף" : "Send back to try again"}
                </LimeButton>
              )}
            </div>
          )
        }
      >
        {confirmDelete ? (
          <p className="text-sm leading-relaxed text-ink-dim">
            {he
              ? "המשימה תימחק מהבית. לא ניתן לבטל את המחיקה."
              : "This quest will be removed from your household. This cannot be undone."}
          </p>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2 text-sm font-bold">
              <span className="rounded-full bg-gold/15 px-3 py-2 text-gold">
                <Star className="inline me-1" size={16} />
                {taskPoints(task)} XP
              </span>
              <span className="rounded-full bg-grape/10 px-3 py-2 text-grape">
                {category(task.categoryId)}
              </span>
              <span className="rounded-full bg-lime/10 px-3 py-2 text-lime">
                {done
                  ? he
                    ? "הושלם!"
                    : "Nailed it!"
                  : pending
                    ? he
                      ? "ממתין לאישור"
                      : "Awaiting approval"
                    : task.status === "InProgress"
                      ? he
                        ? "בעבודה"
                        : "In progress"
                      : he
                        ? "מוכנים להתחיל"
                        : "Ready to start"}
              </span>
            </div>
            {task.description && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-dim">
                {tx(task.description)}
              </p>
            )}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-dim">
              <span>
                {he ? "אחראי: " : "Assigned to: "}
                <strong>
                  {assignee?.fullName ||
                    assignee?.name ||
                    (he ? "עדיין לא שויך" : "Unassigned")}
                </strong>
              </span>
              {due && (
                <span className="inline-flex items-center gap-2">
                  <Clock3 size={16} />
                  {due.toLocaleString(he ? "he-IL" : "en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              )}
            </div>
            {!!task.subItems?.length && (
              <ul className="space-y-2">
                {task.subItems.map((item) => (
                  <li
                    key={item.id}
                    aria-busy={action === `checklist-${item.id}`}
                  >
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={!!item.isCompleted}
                        disabled={busy || !permissions.canEdit}
                        onChange={(event) =>
                          run(
                            `checklist-${item.id}`,
                            () =>
                              toggleSubItem(
                                task.id,
                                item.id,
                                event.target.checked,
                              ),
                            false,
                          )
                        }
                        className="h-5 w-5 shrink-0 accent-lime disabled:cursor-not-allowed"
                      />
                      <span
                        className={
                          item.isCompleted ? "text-ink-dim line-through" : ""
                        }
                      >
                        {tx(item.title || item.text || "")}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            {task.rejectedReason && (
              <p className="rounded-xl bg-coral/10 p-3 text-sm text-coral">
                {he ? "עוד ניסיון קטן: " : "One more try: "}
                {tx(task.rejectedReason)}
              </p>
            )}
            {(pending || done) &&
              (task.proofImageUrl || task.proofImageData) && (
                <figure>
                  <img
                    src={task.proofImageUrl || task.proofImageData}
                    alt={he ? "תמונת ביצוע המשימה" : "Quest completion photo"}
                    className="max-h-72 w-full rounded-2xl object-contain bg-white"
                  />
                  <figcaption className="mt-2 text-xs text-ink-dim">
                    {he ? "תמונת הביצוע שנשלחה" : "Submitted completion photo"}
                  </figcaption>
                </figure>
              )}
            {pending && !permissions.canApprove && (
              <p className="rounded-xl bg-gold/10 p-4 text-sm text-ink-dim">
                {he
                  ? "כל הכבוד! מנהל הבית יבדוק את התמונה שלכם."
                  : "Nice work! A household admin will check your photo."}
              </p>
            )}
            {proofNeeded && (
              <section className="space-y-3">
                <h3 className="flex items-center gap-2 font-extrabold">
                  <Camera size={20} />
                  {he ? "תראו לנו את הקסם!" : "Show us your magic!"}
                </h3>
                <p className="text-sm text-ink-dim">
                  {he
                    ? "הבית שלכם מבקש תמונה לפני אישור המשימה."
                    : "Your household needs a photo before this quest can be approved."}
                </p>
                <Field
                  label={he ? "תמונת ביצוע" : "Completion photo"}
                  htmlFor="quest-proof-file"
                  hint="PNG, JPG, WebP, GIF · 3 MB"
                >
                  <input
                    id="quest-proof-file"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    disabled={busy}
                    onChange={selectPhoto}
                    className={`${fieldClass} file:me-3 file:rounded-lg file:border-0 file:bg-lime/10 file:px-3 file:py-2 file:text-lime`}
                  />
                </Field>
                {readingPhoto && (
                  <p role="status" className="text-sm">
                    {he ? "קוראים את התמונה…" : "Reading your photo…"}
                  </p>
                )}
                {photo && (
                  <img
                    src={photo}
                    alt={
                      he
                        ? "תצוגה מקדימה של תמונת הביצוע"
                        : "Completion photo preview"
                    }
                    className="max-h-56 w-full rounded-xl object-contain"
                  />
                )}
              </section>
            )}
            {rejecting && (
              <Field
                label={
                  he
                    ? "מה צריך לנסות שוב? (לא חובה)"
                    : "What needs another try? (optional)"
                }
                htmlFor="quest-reject-reason"
              >
                <textarea
                  id="quest-reject-reason"
                  rows={3}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  disabled={busy}
                  className={fieldClass}
                />
              </Field>
            )}
            <div className="flex flex-wrap gap-2 border-t border-ink/10 pt-4">
              {permissions.canClaim && (
                <GhostButton
                  disabled={busy}
                  onClick={() => run("claim", () => claimTask(task.id), false)}
                >
                  <span className="inline-flex items-center gap-2">
                    <UserPlus size={16} />
                    {he ? "אני לוקח/ת את המשימה" : "Make it my quest"}
                  </span>
                </GhostButton>
              )}
              {permissions.canEdit && (
                <GhostButton disabled={busy} onClick={() => onEdit(task)}>
                  <span className="inline-flex items-center gap-2">
                    <Pencil size={16} />
                    {he ? "עריכה" : "Edit quest"}
                  </span>
                </GhostButton>
              )}
              {permissions.canMove && task.status === "Todo" && (
                <GhostButton
                  disabled={busy}
                  onClick={() =>
                    run("start", () => moveTask(task.id, "InProgress"))
                  }
                >
                  <span className="inline-flex items-center gap-2">
                    <Play size={16} />
                    {he ? "מתחילים" : "Start quest"}
                  </span>
                </GhostButton>
              )}
              {done && permissions.canMove && (
                <GhostButton
                  disabled={busy}
                  onClick={() => run("reopen", () => moveTask(task.id, "Todo"))}
                >
                  <span className="inline-flex items-center gap-2">
                    <RotateCcw size={16} />
                    {he ? "פתיחה מחדש" : "Reopen quest"}
                  </span>
                </GhostButton>
              )}
              {pending && permissions.canApprove && (
                <GhostButton
                  disabled={busy}
                  onClick={() => setRejecting(!rejecting)}
                >
                  <span className="inline-flex items-center gap-2">
                    <X size={16} />
                    {rejecting
                      ? he
                        ? "ביטול"
                        : "Cancel"
                      : he
                        ? "צריך עוד ניסיון"
                        : "Needs another try"}
                  </span>
                </GhostButton>
              )}
              <GhostButton
                disabled={busy || !savedReady}
                onClick={onToggleSaved}
              >
                <span className="inline-flex items-center gap-2">
                  <Bookmark
                    size={16}
                    fill={isSaved ? "currentColor" : "none"}
                  />
                  {isSaved
                    ? he
                      ? "ביטול שמירה"
                      : "Unsave quest"
                    : he
                      ? "שמירת המשימה"
                      : "Save quest"}
                </span>
              </GhostButton>
              {permissions.canDelete && (
                <GhostButton
                  disabled={busy}
                  onClick={() => setConfirmDelete(true)}
                >
                  <span className="inline-flex items-center gap-2 text-coral">
                    <Trash2 size={16} />
                    {he ? "מחיקה" : "Delete quest"}
                  </span>
                </GhostButton>
              )}
            </div>
            {proofNeeded && permissions.isAdmin && permissions.canMove && (
              <GhostButton
                disabled={busy}
                onClick={() =>
                  run("admin-complete", () => moveTask(task.id, "Done"))
                }
              >
                {he
                  ? "מנהל: השלמה ללא תמונה"
                  : "Admin: complete without a photo"}
              </GhostButton>
            )}
          </div>
        )}
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-coral/10 p-3 text-sm text-coral"
          >
            {error}
          </p>
        )}
        {action && (
          <p role="status" className="mt-3 text-sm text-ink-dim">
            {he ? "רק רגע, שומרים…" : "One moment, saving…"}
          </p>
        )}
      </Dialog>
    </div>
  );
}
