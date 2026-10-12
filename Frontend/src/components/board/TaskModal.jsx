import { useState } from "react";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Star,
  Blocks,
  Utensils,
  Shirt,
  CalendarDays,
  Armchair,
  BedDouble,
  ShoppingBasket,
  Sparkles,
  ChefHat,
  BookOpen,
  PawPrint,
  Wrench,
  ListTodo,
  Play,
  Clock,
  CircleCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { MISSION_TEMPLATES } from "../../utils/familyWorld";
import { CATEGORIES, TASK_STATUSES } from "../../data/mockData";
import {
  toDatetimeLocalValue,
  fromDatetimeLocalValue,
} from "../../utils/dateFormat";
import { modalVariants, overlayVariants } from "../../utils/motion";
import { fieldClass } from "../ui/kit";
import PlaySelect from "../ui/PlaySelect";
import SubItemsChecklist from "../tasks/SubItemsChecklist";
import { useI18n } from "../../context/I18nContext";
import useDialogFocus from "../../hooks/useDialogFocus";
import "./missionWorkshop.css";

const starterIcons = [Blocks, Utensils, Shirt];
const categoryLooks = {
  kitchen: [Utensils, "peach"],
  living: [Armchair, "gold"],
  shopping: [ShoppingBasket, "mint"],
  cleaning: [Sparkles, "sky"],
  cooking: [ChefHat, "peach"],
  room: [BedDouble, "lilac"],
  homework: [BookOpen, "sky"],
  pet: [PawPrint, "mint"],
  maintenance: [Wrench, "lilac"],
  other: [ListTodo, "sky"],
};
export default function TaskModal({
  task,
  users,
  permissions,
  currentUserId,
  onSave,
  onClose,
}) {
  const { t, dir, lang, category: categoryLabel } = useI18n();
  const he = lang === "he";
  const say = (en, heb) => (he ? heb : en);
  const isAdmin = permissions?.isAdmin;
  const [page, setPage] = useState(0);
  const [starter, setStarter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [form, setForm] = useState(
    task
      ? {
          title: task.title,
          description: task.description || "",
          category: task.category || task.categoryId,
          points: task.points ?? task.pointsValue,
          assigneeId:
            task.assigneeId || task.assignedUserId || currentUserId || "",
          status: task.status,
          dueAt: toDatetimeLocalValue(task.dueAt || task.dueDate),
          subItems: (task.subItems || []).map((s) => ({ ...s })),
        }
      : {
          title: "",
          description: "",
          category: "kitchen",
          points: 10,
          assigneeId: currentUserId || users[0]?.id || "",
          status: TASK_STATUSES.TODO,
          dueAt: "",
          subItems: [],
        },
  );
  const close = () => {
    if (!submitting) onClose();
  };
  const dialogRef = useDialogFocus(true, close);
  const change = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));
  const chooseStarter = (template) => {
    setStarter(template.id);
    setForm((prev) => ({
      ...prev,
      title: he ? template.he : template.en,
      category: template.category,
      subItems: template.steps.map((step, index) => ({
        id: `si-${Date.now()}-${index}`,
        text: step[he ? 1 : 0],
        isCompleted: false,
      })),
    }));
  };
  const submit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setPage(0);
      return;
    }
    if (page === 0) {
      setPage(1);
      return;
    }
    setSaveError("");
    setSubmitting(true);
    try {
      await onSave({
        ...form,
        title: form.title.trim(),
        points: Number(form.points),
        pointsValue: Number(form.points),
        dueAt: form.dueAt ? fromDatetimeLocalValue(form.dueAt) : null,
        dueDate: form.dueAt ? fromDatetimeLocalValue(form.dueAt) : null,
        assigneeId: form.assigneeId || null,
        assignedUserId: form.assigneeId || null,
        categoryId: form.category,
        subItems: form.subItems.filter((s) => (s.text || "").trim()),
      });
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="quest-workshop-wrap" dir={dir}>
      <motion.div
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        className="quest-workshop-scrim"
        onClick={close}
      />
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="workshop-title"
        tabIndex={-1}
        className="quest-workshop"
      >
        <header className="workshop-header">
          <div>
            <h2 id="workshop-title">
              {task
                ? say("Remix this mission", "משדרגים את המשימה")
                : say("Let’s make a mission!", "יוצרים משימה חדשה!")}
            </h2>
            <p>
              {say(
                "A small job. A chance to feel big.",
                "משימה קטנה. תחושה גדולה.",
              )}
            </p>
          </div>
          <button
            type="button"
            className="workshop-close"
            onClick={close}
            disabled={submitting}
            aria-label={t("close")}
          >
            <X size={21} />
          </button>
        </header>
        <ol
          className="workshop-progress"
          aria-label={say("Mission setup", "יצירת משימה")}
        >
          {[
            say("The adventure", "ההרפתקה"),
            say("The hero & the reward", "הגיבור והפרס"),
          ].map((label, index) => (
            <li
              key={label}
              aria-current={page === index ? "step" : undefined}
              className={page >= index ? "is-current" : ""}
            >
              <span>{page > index ? <Check size={16} /> : index + 1}</span>
              {label}
            </li>
          ))}
        </ol>
        <form onSubmit={submit}>
          <div className="workshop-body">
            {saveError && (
              <p role="alert" className="workshop-error">
                {saveError}
              </p>
            )}
            {page === 0 ? (
              <>
                {!task && (
                  <div
                    className="workshop-starters"
                    role="group"
                    aria-label={say("Mission starters", "רעיונות למשימה")}
                  >
                    {MISSION_TEMPLATES.map((template, index) => {
                      const Icon = starterIcons[index];
                      return (
                        <button
                          type="button"
                          key={template.id}
                          aria-pressed={starter === template.id}
                          onClick={() => chooseStarter(template)}
                        >
                          <Icon size={25} />
                          <span>{he ? template.he : template.en}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                <label className="workshop-field" htmlFor="quest-title">
                  {say("What’s the adventure?", "מה ההרפתקה?")}
                  <input
                    id="quest-title"
                    name="title"
                    value={form.title}
                    onChange={(e) => change("title", e.target.value)}
                    required
                    maxLength={200}
                    placeholder={say(
                      "Give the toys a home…",
                      "מחזירים צעצועים הביתה…",
                    )}
                    className={fieldClass}
                  />
                </label>
                <div className="workshop-fields">
                  <label className="workshop-field" htmlFor="quest-category">
                    {t("categoryLabel")}
                    <PlaySelect
                      id="quest-category"
                      value={form.category}
                      onChange={(value) => change("category", value)}
                      label={t("categoryLabel")}
                      dir={dir}
                      disabled={submitting}
                      options={CATEGORIES.map((c) => ({
                        value: c.id,
                        label: categoryLabel(c.id, c.label),
                        icon: categoryLooks[c.id]?.[0],
                        tone: categoryLooks[c.id]?.[1],
                      }))}
                    />
                  </label>
                  <details
                    className="workshop-note"
                    open={form.description ? true : undefined}
                  >
                    <summary>
                      {say("Add a helpful note", "מוסיפים הסבר קצר")}
                    </summary>
                    <textarea
                      aria-label={t("descriptionLabel")}
                      value={form.description}
                      onChange={(e) => change("description", e.target.value)}
                      rows={2}
                      className={fieldClass}
                    />
                  </details>
                </div>
                <div className="workshop-steps">
                  <h3>
                    {say("Little steps, big win", "צעדים קטנים, הצלחה גדולה")}
                  </h3>
                  <p>
                    {say(
                      "Keep each step short. Read it together before you begin.",
                      "כל צעד קצר וברור. קוראים ביחד לפני שמתחילים.",
                    )}
                  </p>
                  <SubItemsChecklist
                    editable
                    variant="dark"
                    items={form.subItems}
                    onChange={(next) => change("subItems", next)}
                    placeholder={say(
                      "One small thing to do…",
                      "דבר קטן אחד לעשות…",
                    )}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="workshop-mission-preview">
                  <Check size={24} />
                  <strong>{form.title}</strong>
                  <span>
                    {form.subItems.filter((s) => s.text?.trim()).length}{" "}
                    {say("steps", "צעדים")}
                  </span>
                </div>
                {(permissions?.canReassign || isAdmin) && (
                  <fieldset className="workshop-heroes">
                    <legend>{say("Who’s the hero?", "מי הגיבור?")}</legend>
                    <div>
                      {[
                        {
                          id: "",
                          name: say("Anyone", "כל אחד"),
                          avatar: { emoji: "" },
                        },
                        ...users,
                      ].map((u) => (
                        <button
                          type="button"
                          key={u.id}
                          aria-pressed={
                            String(form.assigneeId) === String(u.id)
                          }
                          onClick={() => change("assigneeId", u.id)}
                        >
                          <span aria-hidden="true">
                            {u.avatar?.emoji || <Blocks size={23} />}
                          </span>
                          {u.fullName || u.name}
                          {String(form.assigneeId) === String(u.id) && (
                            <Check size={16} />
                          )}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}
                <fieldset
                  className="workshop-points"
                  disabled={!permissions?.canChangePoints && !isAdmin}
                >
                  <legend>
                    <Star size={18} />
                    {say("Coins + XP for finishing", "מטבעות וניסיון בסיום")}
                  </legend>
                  <div>
                    {[5, 10, 15, 20].map((points) => (
                      <button
                        type="button"
                        aria-pressed={Number(form.points) === points}
                        key={points}
                        onClick={() => change("points", points)}
                      >
                        {points}
                      </button>
                    ))}
                    <label htmlFor="quest-points">
                      {say("Custom", "אחר")}
                      <input
                        id="quest-points"
                        type="number"
                        min={1}
                        max={100}
                        required
                        value={form.points}
                        onChange={(e) => change("points", e.target.value)}
                      />
                    </label>
                  </div>
                </fieldset>
                <label className="workshop-field" htmlFor="quest-due">
                  <span>
                    <CalendarDays size={17} />
                    {say(
                      "When? Leave empty for any time.",
                      "מתי? משאירים ריק לכל זמן.",
                    )}
                  </span>
                  <input
                    type="datetime-local"
                    id="quest-due"
                    value={form.dueAt}
                    onChange={(e) => change("dueAt", e.target.value)}
                    dir="ltr"
                    className={fieldClass}
                  />
                </label>
                {task && (isAdmin || permissions?.canReassign) && (
                  <label className="workshop-field" htmlFor="quest-status">
                    {t("statusLabel")}
                    <PlaySelect
                      id="quest-status"
                      value={form.status}
                      onChange={(value) => change("status", value)}
                      label={t("statusLabel")}
                      dir={dir}
                      disabled={submitting}
                      options={[
                        {
                          value: TASK_STATUSES.TODO,
                          label: t("status.todo"),
                          icon: ListTodo,
                          tone: "sky",
                        },
                        {
                          value: "InProgress",
                          label: say("In progress", "בעבודה"),
                          icon: Play,
                          tone: "lilac",
                        },
                        {
                          value: TASK_STATUSES.PENDING_APPROVAL,
                          label: t("status.pending"),
                          icon: Clock,
                          tone: "gold",
                        },
                        {
                          value: TASK_STATUSES.DONE,
                          label: t("status.done"),
                          icon: CircleCheck,
                          tone: "mint",
                        },
                      ]}
                    />
                  </label>
                )}
              </>
            )}
          </div>
          <footer className="workshop-footer">
            <button
              type="button"
              className="workshop-back"
              disabled={submitting}
              onClick={page ? () => setPage(0) : close}
            >
              {page ? <ArrowLeft size={18} /> : null}
              {page ? say("Back", "חזרה") : t("cancel")}
            </button>
            <button
              type="submit"
              className="workshop-primary"
              disabled={submitting}
            >
              {submitting
                ? t("saving")
                : page === 0
                  ? say("Choose your hero", "בוחרים גיבור")
                  : task
                    ? t("update")
                    : say("Let’s put it on the road!", "מוסיפים למסלול!")}
              {page === 0 ? <ArrowRight size={18} /> : <Check size={18} />}
            </button>
          </footer>
        </form>
      </motion.div>
    </div>
  );
}
