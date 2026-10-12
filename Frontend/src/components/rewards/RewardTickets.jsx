import { useState } from "react";
import { CalendarDays, Check, Ticket, ArrowDown, ArrowUp } from "lucide-react";
import { usePlay } from "../../context/PlayContext";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { useI18n } from "../../context/I18nContext";
import { PlayNotice } from "../world/PlayBits";
import PrizeArt from "./PrizeArt";
const TIMES = [
  ["morning", "In the morning", "בבוקר"],
  ["afternoon", "In the afternoon", "אחר הצהריים"],
  ["after-dinner", "After dinner", "אחרי ארוחת הערב"],
  ["anytime", "We’ll choose together", "נבחר יחד"],
];

function TicketItem({ ticket }) {
  const { state, change, busy } = usePlay();
  const { users } = useApp();
  const { lang, tx } = useI18n();
  const he = lang === "he";
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(ticket.date || "");
  const [when, setWhen] = useState(ticket.when || "after-dinner");
  const name =
    users.find((u) => String(u.id) === ticket.userId)?.fullName ||
    (he ? "חבר צוות" : "Crew member");
  const plannedDate = ticket.date
    ? new Date(`${ticket.date}T12:00:00`).toLocaleDateString(
        he ? "he-IL" : "en-GB",
        { weekday: "long", month: "short", day: "numeric" },
      )
    : "";
  const time = TIMES.find((t) => t[0] === ticket.when) || TIMES[3];
  return (
    <article className={`real-reward-ticket ticket-${ticket.status}`}>
      <div className="real-ticket-art">
        <PrizeArt reward={ticket} />
      </div>
      <div className="real-ticket-content">
        <span className="ticket-owner">{name}</span>
        <h3>{tx(ticket.title)}</h3>
        <p className="ticket-status">
          {ticket.status === "enjoyed" ? (
            <>
              <Check size={17} />
              {he ? "נהנינו ביחד!" : "Enjoyed together!"}
            </>
          ) : ticket.status === "planned" ? (
            <>
              <CalendarDays size={17} />
              {plannedDate} · {he ? time[2] : time[1]}
            </>
          ) : (
            <>
              <Ticket size={17} />
              {he ? "שלכם! עכשיו בוחרים מתי." : "It’s yours! Let’s pick a day."}
            </>
          )}
        </p>
        {state.canManage && ticket.status !== "enjoyed" && !editing && (
          <div className="ticket-actions">
            <button
              className="play-button small"
              onClick={() => {
                setDate(ticket.date || "");
                setWhen(ticket.when);
                setEditing(true);
              }}
            >
              {ticket.status === "planned"
                ? he
                  ? "שינוי התאריך"
                  : "Change the day"
                : he
                  ? "בוחרים יום"
                  : "Pick a day"}
            </button>
            {ticket.status === "planned" && (
              <button
                className="play-link"
                disabled={busy}
                onClick={() =>
                  change("ticket.enjoy", { rewardId: ticket.rewardId })
                }
              >
                <Check size={16} />
                {he ? "סימון כפרס שנהנינו ממנו" : "Mark as enjoyed"}
              </button>
            )}
          </div>
        )}
        {!state.canManage && ticket.status === "waiting" && (
          <small>
            {he
              ? "ההורה יבחר תאריך יחד איתכם. אין צורך לשלם שוב."
              : "Your parent will agree on a day with you. No extra coins needed."}
          </small>
        )}
        {editing && (
          <form
            className="ticket-plan"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await change("ticket.schedule", {
                  rewardId: ticket.rewardId,
                  date,
                  when,
                })
              )
                setEditing(false);
            }}
          >
            <label>
              {he ? "באיזה יום?" : "Which day?"}
              <input
                type="date"
                required
                value={date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label>
              {he ? "מתי ביום?" : "When that day?"}
              <select value={when} onChange={(e) => setWhen(e.target.value)}>
                {TIMES.map((t) => (
                  <option key={t[0]} value={t[0]}>
                    {he ? t[2] : t[1]}
                  </option>
                ))}
              </select>
            </label>
            <div className="ticket-actions">
              <button className="play-button small" disabled={busy}>
                {he ? "קבענו!" : "It’s a date!"}
              </button>
              <button
                type="button"
                className="play-link"
                disabled={busy}
                onClick={() => setEditing(false)}
              >
                {he ? "ביטול" : "Cancel"}
              </button>
            </div>
          </form>
        )}
      </div>
    </article>
  );
}
export default function RewardTickets() {
  const { state } = usePlay();
  const { user } = useAuth();
  const { lang } = useI18n();
  const he = lang === "he";
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory] = useState(false);
  const tickets = (state?.tickets || [])
    .filter((t) => state.canManage || t.userId === String(user?.id))
    .filter((t) => (history ? t.status === "enjoyed" : t.status !== "enjoyed"))
    .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
  return (
    <section
      className="reward-ticket-book"
      aria-label={he ? "הכרטיסים שלנו" : "Our reward tickets"}
    >
      <div className="play-section-heading">
        <div>
          <h2>{he ? "הכרטיסים לרגעים טובים" : "Tickets to good times"}</h2>
          <p>
            {he
              ? "מממשים בחנות. בוחרים יום. נהנים באמת."
              : "Earn it. Pick a day. Make it happen."}
          </p>
        </div>
        <button
          className="play-link"
          onClick={() => {
            setHistory((v) => !v);
            setExpanded(false);
          }}
        >
          {history
            ? he
              ? "הבאים בתור"
              : "Coming up"
            : he
              ? "זיכרונות טובים"
              : "Happy memories"}
        </button>
      </div>
      <PlayNotice />
      {state && !tickets.length && (
        <p className="play-empty-inline">
          {history
            ? he
              ? "כאן נשמור את הרגעים שכבר חגגנו."
              : "The moments you’ve enjoyed will live here."
            : he
              ? "ממשו פרס בחנות והוא יהפוך לכרטיס משלכם."
              : "Redeem a treasure below and it becomes your very own ticket."}
        </p>
      )}
      <div className="real-ticket-list">
        {(expanded ? tickets : tickets.slice(0, 2)).map((t) => (
          <TicketItem key={t.rewardId} ticket={t} />
        ))}
      </div>
      {tickets.length > 2 && (
        <button className="play-link" onClick={() => setExpanded((v) => !v)}>
          {expanded ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
          {expanded
            ? he
              ? "פחות כרטיסים"
              : "Show fewer"
            : `${he ? "כל הכרטיסים" : "All tickets"} (${tickets.length})`}
        </button>
      )}
    </section>
  );
}
