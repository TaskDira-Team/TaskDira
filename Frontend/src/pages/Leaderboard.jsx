import { useMemo } from "react";
import { Crown, Flame, HeartHandshake, Trophy, Users } from "lucide-react";
import { useI18n } from "../context/I18nContext";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { getRingAccent } from "../data/avatars";
import { ACCENTS, Avatar, ScreenShell } from "../components/ui/kit";
import "../components/ui/community.css";
import { deriveMilestoneProgress } from "../utils/milestoneProgress";

export default function Leaderboard() {
  const { t, dir, lang } = useI18n();
  const { user } = useAuth();
  const { leaderboard, users, tasks } = useApp();
  const en = lang === "en";
  const players = useMemo(() => {
    const source = leaderboard?.length ? leaderboard : users;
    const sorted = [...(source ?? [])].sort(
      (a, b) =>
        (b.points ?? 0) - (a.points ?? 0) ||
        String(a.id).localeCompare(String(b.id), "en", { numeric: true }),
    );
    return sorted.map((u, i) => ({
      id: u.id,
      name: u.fullName || u.name || "",
      emoji: u.avatar?.emoji ?? "🙂",
      ring: getRingAccent(
        u.avatarState?.ringColorId,
        ["lime", "grape", "coral", "gold"][i % 4],
      ),
      xp: u.points ?? 0,
      streak: deriveMilestoneProgress(tasks, u).streak,
      you: u.id === user?.id,
      rank: i + 1,
    }));
  }, [leaderboard, users, tasks, user?.id]);
  const max = players[0]?.xp || 1;
  const total = players.reduce((sum, p) => sum + p.xp, 0);
  const myRank = players.find((p) => p.you)?.rank;
  const podium = players.length >= 3 && players[0].xp > 0;
  return (
    <ScreenShell dir={dir} width="max-w-7xl" className="community-page">
      <header className="community-heading">
        <div>
          <h1>{en ? "Meet the home heroes!" : "קבלו את גיבורי הבית!"}</h1>
          <p>
            {en
              ? "A little friendly competition. A whole lot of care for the place you share."
              : "קצת תחרות ידידותית. המון אכפתיות למקום שכולכם קוראים לו בית."}
          </p>
        </div>
        <span className="community-chip">
          <Users size={16} />
          {players.length} {en ? "housemates" : "חברי בית"}
        </span>
      </header>
      <div className="community-split community-leaderboard-world">
        <section>
          <div className="mb-4 flex justify-between items-center gap-3">
            <h2 className="community-section-title mb-0">
              {t("leaderboard.title")}
            </h2>
            <span className="text-sm text-ink-dim">
              {en ? "Lifetime XP" : "כל נקודות הניסיון"}
            </span>
          </div>
          {players.length ? (
            <ol className="community-rank-list">
              {players.map((p) => (
                <li
                  key={p.id}
                  className={`community-rank-row ${p.you ? "is-you" : ""}`}
                >
                  <span className="community-rank-number">{p.rank}</span>
                  <Avatar emoji={p.emoji} ring={p.ring} size={46} />
                  <div className="community-rank-name">
                    <h3>
                      {p.name}{" "}
                      {p.you && (
                        <span className="community-chip ms-1">
                          {t("leaderboard.you")}
                        </span>
                      )}
                    </h3>
                    <div className="my-2 flex items-center gap-1 text-xs text-ink-dim">
                      <Flame size={13} />
                      {t("leaderboard.streakDays").replace("{n}", p.streak)}
                    </div>
                    <div className="community-progress" aria-hidden="true">
                      <span
                        style={{
                          width: `${(p.xp / max) * 100}%`,
                          background: ACCENTS[p.ring],
                        }}
                      />
                    </div>
                  </div>
                  <div className="community-rank-score">
                    {p.xp.toLocaleString()}
                    <small>XP</small>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="community-empty">
              <Users size={36} />
              <h2>{en ? "Your team starts here." : "הצוות שלכם מתחיל כאן."}</h2>
              <p>
                {en
                  ? "Household members will appear here when they join."
                  : "חברי הבית יופיעו כאן לאחר ההצטרפות."}
              </p>
            </div>
          )}
          <p className="community-note mt-4">
            {en
              ? "Rankings use earned XP, so spending coins on a reward never changes your place."
              : "הדירוג מבוסס על XP שנצברו, כך שמימוש פרסים לא משנה את המקום שלכם."}
          </p>
        </section>
        <aside>
          <section
            className="community-team-cheer"
            style={{ background: "var(--community-gold)" }}
          >
            <HeartHandshake
              size={34}
              className="mb-4 text-gold"
              aria-hidden="true"
            />
            <h2 className="text-2xl font-extrabold">
              {en ? "Teamwork makes the dream work!" : "ביחד אנחנו צוות מנצח!"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-dim">
              {en
                ? "Together, your household has earned"
                : "יחד, הבית שלכם צבר"}{" "}
              <strong className="text-ink">{total.toLocaleString()} XP.</strong>
            </p>
            {myRank && (
              <p className="mt-4 text-sm font-bold">
                {en ? "Your current place" : "המקום הנוכחי שלכם"} · #{myRank}
              </p>
            )}
          </section>
          {podium && (
            <section className="mt-7">
              <h2 className="community-section-title flex items-center gap-2">
                <Trophy size={21} />
                {en ? "The home team" : "נבחרת הבית"}
              </h2>
              <div className="community-podium">
                {[1, 0, 2].map((index) => {
                  const p = players[index];
                  return (
                    <div key={p.id} className="community-podium-person">
                      {index === 0 && (
                        <Crown
                          size={23}
                          className="mb-2 text-gold"
                          aria-hidden="true"
                        />
                      )}
                      <Avatar
                        emoji={p.emoji}
                        ring={p.ring}
                        size={index === 0 ? 94 : 76}
                      />
                      <h3>{p.name.split(" ")[0]}</h3>
                      <span className="mt-1 text-xs text-ink-dim">
                        {p.xp.toLocaleString()} XP
                      </span>
                      <div
                        className="community-podium-step"
                        style={{
                          height: [154, 112, 84][index],
                          background:
                            index === 0
                              ? "var(--community-gold)"
                              : index === 1
                                ? "var(--community-lilac)"
                                : "var(--community-coral)",
                        }}
                      >
                        {p.rank}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </aside>
      </div>
    </ScreenShell>
  );
}
