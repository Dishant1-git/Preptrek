"use client";
import { useEffect, useState } from "react";
import { api, formatTime } from "@/lib/api";

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const thisMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const dayLabel = (d) =>
  new Date(d).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const mins = (m) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 ? `${m % 60}m` : ""}` : `${m}m`);

// How each kind of activity is shown
function describe(e) {
  switch (e.type) {
    case "study":
      return ["⏱️", `Studied for ${mins(e.minutes)}`];
    case "topic":
      return ["✅", `Completed topic “${e.title}”`];
    case "mcq":
      return ["📝", `Solved ${e.total} MCQs — ${e.correct} correct, ${e.wrong} incorrect, ${e.skipped} skipped (${pct(e.correct, e.correct + e.wrong)}% accuracy)`];
    case "cards":
      return ["🗂️", `Added ${e.count} flashcard${e.count > 1 ? "s" : ""}`];
    case "review":
      return ["🧠", `Reviewed ${e.total} flashcards — ${e.known} got it, ${e.unknown} didn't know (${pct(e.known, e.total)}%)`];
    case "target":
      return ["🎯", `Set a new target “${e.title}”`];
    default:
      return ["•", e.type];
  }
}

export default function TimelinePage() {
  const [month, setMonth] = useState(thisMonth());
  const [events, setEvents] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const [y, m] = month.split("-").map(Number);
    const from = new Date(y, m - 1, 1); // local midnight, so days match the user's time zone
    const to = new Date(y, m, 1);
    setEvents(null);
    setError("");
    api(`/timeline?from=${from.toISOString()}&to=${to.toISOString()}`).then(setEvents).catch((e) => setError(e.message));
  }, [month]);

  // Group by local day (events already come newest first)
  const days = [];
  (events || []).forEach((e) => {
    const key = new Date(e.at).toDateString();
    let day = days[days.length - 1];
    if (!day || day.key !== key) days.push((day = { key, date: e.at, events: [] }));
    day.events.push(e);
  });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Timeline</h1>
          <p>Everything you did, day by day.</p>
        </div>
        <div className="actions">
          <input type="month" value={month} max={thisMonth()} onChange={(e) => e.target.value && setMonth(e.target.value)} />
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {!events && !error && <p className="empty">Loading…</p>}
      {events && !days.length && <div className="card"><p className="empty">Nothing recorded this month.</p></div>}

      {days.map((day) => {
        const sum = (type, key) => day.events.filter((e) => e.type === type).reduce((t, e) => t + (key ? e[key] : 1), 0);
        const studied = sum("study", "minutes");
        const mcqs = sum("mcq", "total");
        const topics = sum("topic");
        const cards = sum("review", "total");
        return (
          <div className="card" key={day.key}>
            <div className="tracker-head">
              <h2>{dayLabel(day.date)}</h2>
            </div>
            <div className="day-summary">
              {studied > 0 && <span className="pill on-track">⏱️ {mins(studied)} studied</span>}
              {topics > 0 && <span className="pill completed">✅ {topics} topic{topics > 1 ? "s" : ""}</span>}
              {mcqs > 0 && <span className="pill in-progress">📝 {mcqs} MCQs</span>}
              {cards > 0 && <span className="pill due-soon">🧠 {cards} cards reviewed</span>}
            </div>
            <ul className="timeline">
              {day.events.map((e, i) => {
                const [icon, text] = describe(e);
                return (
                  <li key={i}>
                    <time>{formatTime(e.at)}</time>
                    <span className="timeline-icon">{icon}</span>
                    <div>
                      {text}
                      {e.subject && (
                        <small>
                          <span className="dot" style={{ background: e.subject.color }} /> {e.subject.name}
                        </small>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </>
  );
}
