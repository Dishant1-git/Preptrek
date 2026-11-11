"use client";
import { useEffect, useState } from "react";
import { api, formatDate } from "@/lib/api";

const pad = (n) => String(Math.floor(n)).padStart(2, "0");
const clock = (secs) => `${pad(secs / 3600)}:${pad((secs % 3600) / 60)}:${pad(secs % 60)}`;

export default function Timer() {
  const [mode, setMode] = useState("pomodoro"); // "pomodoro" counts down, "stopwatch" counts up
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0); // seconds studied so far
  const [running, setRunning] = useState(false);
  const [trackers, setTrackers] = useState([]);
  const [tracker, setTracker] = useState("");
  const [sessions, setSessions] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api("/trackers").then(setTrackers);
    api("/sessions").then(setSessions);
  }, []);

  // Tick once a second while running
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Pomodoro finished -> save automatically
  useEffect(() => {
    if (mode === "pomodoro" && running && seconds >= focusMinutes * 60) {
      save("Focus session complete! Take a 5 minute break ☕");
    }
  }, [seconds]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (doneMessage = "Session saved 👏") => {
    setRunning(false);
    const minutes = Math.round(seconds / 60);
    setSeconds(0);
    if (minutes < 1) return setMessage("Sessions under a minute aren't saved.");

    const session = await api("/sessions", "POST", { minutes, tracker });
    const trackerInfo = trackers.find((t) => t._id === tracker);
    setSessions([{ ...session, tracker: trackerInfo }, ...sessions]);
    setMessage(`${doneMessage} (+${minutes} min)`);

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("PrepTrek", { body: doneMessage, icon: "/logo-icon.jpg" });
    }
  };

  const reset = () => {
    setRunning(false);
    setSeconds(0);
  };

  const shown = mode === "pomodoro" ? Math.max(0, focusMinutes * 60 - seconds) : seconds;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Study timer</h1>
          <p>Every saved session counts toward your hours, targets and rewards.</p>
        </div>
      </div>

      <div className="grid">
        <div className="card timer">
          <div className="tabs">
            {["pomodoro", "stopwatch"].map((m) => (
              <button key={m} className={mode === m ? "on" : ""} disabled={running} onClick={() => { setMode(m); reset(); }}>
                {m === "pomodoro" ? "🍅 Pomodoro" : "⏱️ Stopwatch"}
              </button>
            ))}
          </div>

          <div className="timer-face">{clock(shown)}</div>

          <div className="inline-form" style={{ justifyContent: "center", marginBottom: 16 }}>
            <select value={tracker} onChange={(e) => setTracker(e.target.value)} disabled={running} style={{ maxWidth: 220 }}>
              <option value="">General study</option>
              {trackers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
            {mode === "pomodoro" && (
              <select value={focusMinutes} onChange={(e) => setFocusMinutes(+e.target.value)} disabled={running} style={{ maxWidth: 120 }}>
                {[15, 25, 45, 60, 90].map((m) => <option key={m} value={m}>{m} min</option>)}
              </select>
            )}
          </div>

          <div className="actions" style={{ justifyContent: "center" }}>
            <button className="btn" onClick={() => { setRunning(!running); setMessage(""); }}>
              {running ? "Pause" : seconds ? "Resume" : "Start"}
            </button>
            <button className="btn-ghost" onClick={() => save()} disabled={!seconds}>Stop & save</button>
            <button className="btn-ghost" onClick={reset} disabled={!seconds}>Reset</button>
          </div>
          {message && <p className="alert" style={{ marginTop: 16 }}>{message}</p>}
        </div>

        <div className="card">
          <h2>Recent sessions</h2>
          {sessions.length ? (
            <table>
              <thead><tr><th>Date</th><th>Tracker</th><th>Time</th></tr></thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s._id}>
                    <td>{formatDate(s.date)}</td>
                    <td>{s.tracker?.name || "General"}</td>
                    <td>{s.minutes} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="empty">No sessions yet. Start the timer!</p>}
        </div>
      </div>
    </>
  );
}
