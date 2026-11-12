"use client";
import { useEffect, useState } from "react";
import { api, formatDateTime, nowLocalInput } from "@/lib/api";
import { useUser } from "@/components/AppShell";
import { MARKING, defaultMarking } from "@/lib/exams";
import Chart from "@/components/Chart";

const fmt = (n) => +Number(n || 0).toFixed(2);
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

export default function McqPage() {
  const { user } = useUser();
  const [tab, setTab] = useState("log");
  const [trackers, setTrackers] = useState([]);
  const [data, setData] = useState(null);
  const [subject, setSubject] = useState(""); // results filter
  const emptyForm = () => ({ tracker: "", date: nowLocalInput(), total: "", correct: "", wrong: "", note: "", marking: defaultMarking(user.domain) });
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const load = () => api("/mcqs").then(setData);

  useEffect(() => {
    api("/trackers").then(setTrackers);
    load();
  }, []);

  // Skipped is whatever is left over
  const total = Number(form.total) || 0;
  const correct = Number(form.correct) || 0;
  const wrong = Number(form.wrong) || 0;
  const skipped = total - correct - wrong;
  const mark = MARKING[form.marking];
  const score = correct * mark.correct + wrong * mark.wrong;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSaved("");
    if (skipped < 0) return setError("Correct + incorrect can't be more than the total");
    try {
      await api("/mcqs", "POST", {
        tracker: form.tracker,
        date: new Date(form.date).toISOString(),
        total, correct, wrong, skipped,
        marking: mark,
        note: form.note,
      });
      setSaved(`Saved: ${correct}/${total} correct, ${wrong} incorrect, ${skipped} skipped.`);
      setForm({ ...emptyForm(), tracker: form.tracker, marking: form.marking }); // keep subject & marking
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this entry?")) return;
    await api(`/mcqs/${id}`, "DELETE");
    load();
  };

  if (!data) return <div className="empty">Loading…</div>;

  const logs = data.logs.filter((l) => !subject || (subject === "none" ? !l.tracker : l.tracker?._id === subject));
  const shown = subject ? data.bySubject.find((s) => (s.tracker?._id || "none") === subject) : data.overall;
  const o = shown || { logs: 0, total: 0, correct: 0, wrong: 0, skipped: 0, accuracy: 0, scorePercent: 0 };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>MCQ practice</h1>
          <p>Log the MCQs you solved: how many, when, and how many were correct, incorrect or skipped.</p>
        </div>
        <div className="tabs">
          {[["log", "📝 Log MCQs"], ["results", `📈 Results (${data.logs.length})`]].map(([key, label]) => (
            <button key={key} className={tab === key ? "on" : ""} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>
      </div>

      {tab === "log" && (
        <form className="card stack" onSubmit={save}>
          <h2>Add MCQ practice</h2>
          <div className="inline-form">
            <div style={{ flex: 2 }}>
              <label>Subject</label>
              <select value={form.tracker} onChange={set("tracker")}>
                <option value="">No subject</option>
                {trackers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 2 }}>
              <label>Date & time</label>
              <input type="datetime-local" required value={form.date} max={nowLocalInput()} onChange={set("date")} />
            </div>
          </div>
          <div className="inline-form">
            <div style={{ flex: 1 }}>
              <label>Total MCQs</label>
              <input type="number" min="1" required placeholder="e.g. 50" value={form.total} onChange={set("total")} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Correct</label>
              <input type="number" min="0" required placeholder="0" value={form.correct} onChange={set("correct")} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Incorrect</label>
              <input type="number" min="0" required placeholder="0" value={form.wrong} onChange={set("wrong")} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Skipped</label>
              <input value={total ? skipped : ""} readOnly placeholder="auto" className={skipped < 0 ? "late" : ""} />
            </div>
          </div>
          <div className="inline-form">
            <div style={{ flex: 2 }}>
              <label>Marking scheme</label>
              <select value={form.marking} onChange={(e) => setForm({ ...form, marking: Number(e.target.value) })}>
                {MARKING.map((m, i) => <option key={m.name} value={i}>{m.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 2 }}>
              <label>Note (optional)</label>
              <input placeholder="e.g. Chapter 4 mock, Marrow QBank" value={form.note} onChange={set("note")} />
            </div>
          </div>

          {total > 0 && skipped >= 0 && (
            <div className="kpis">
              <div className="kpi"><small>Score</small><strong>{fmt(score)} / {total * mark.correct}</strong></div>
              <div className="kpi"><small>Correct</small><strong>{correct}</strong></div>
              <div className="kpi"><small>Attempted</small><strong>{correct + wrong}</strong></div>
              <div className="kpi"><small>Incorrect</small><strong>{wrong}</strong></div>
              <div className="kpi"><small>Skipped</small><strong>{skipped}</strong></div>
              <div className="kpi"><small>Accuracy</small><strong>{pct(correct, correct + wrong)}%</strong></div>
            </div>
          )}

          {error && <div className="error">{error}</div>}
          {saved && <div className="alert completed">✅ {saved}</div>}
          <div className="actions">
            <button className="btn">Save</button>
            {saved && <button type="button" className="btn-ghost" onClick={() => setTab("results")}>See results</button>}
          </div>
        </form>
      )}

      {tab === "results" && (
        <>
          <div className="card actions">
            <label style={{ margin: 0 }}>Subject</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="">All subjects</option>
              {data.bySubject.map((s) => (
                <option key={s.tracker?._id || "none"} value={s.tracker?._id || "none"}>{s.tracker?.name || "No subject"}</option>
              ))}
            </select>
          </div>

          <div className="kpis">
            <div className="kpi"><small>Total MCQs</small><strong>{o.total}</strong></div>
            <div className="kpi"><small>Correct</small><strong>{o.correct}</strong></div>
            <div className="kpi"><small>Entries</small><strong>{o.logs}</strong></div>
            <div className="kpi"><small>Incorrect</small><strong>{o.wrong}</strong></div>
            <div className="kpi"><small>Skipped</small><strong>{o.skipped}</strong></div>
            <div className="kpi"><small>Accuracy</small><strong>{o.accuracy}%</strong></div>
          </div>

          <div className="card">
            <h2>By subject</h2>
            {data.bySubject.length ? (
              <table>
                <thead>
                  <tr><th>Subject</th><th>Total</th><th>✓ Correct</th><th>✗ Incorrect</th><th>– Skipped</th><th>Accuracy</th><th>Score</th></tr>
                </thead>
                <tbody>
                  {data.bySubject.map((s) => (
                    <tr key={s.tracker?._id || "none"}>
                      <td>{s.tracker && <span className="dot" style={{ background: s.tracker.color }} />} {s.tracker?.name || "No subject"}</td>
                      <td>{s.total}</td>
                      <td>{s.correct}</td>
                      <td>{s.wrong}</td>
                      <td>{s.skipped}</td>
                      <td><strong>{s.accuracy}%</strong></td>
                      <td>{s.scorePercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="empty">Nothing logged yet. Add your first entry from the Log MCQs tab.</p>}
          </div>

          <div className="grid">
            <div className="card">
              <h2>Accuracy trend</h2>
              <Chart type="line" unit="%"
                data={[...logs].reverse().map((l) => ({
                  name: new Date(l.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
                  value: pct(l.correct, l.correct + l.wrong),
                }))} />
            </div>
            <div className="card">
              <h2>All answers</h2>
              <Chart type="pie" data={[
                { name: "Correct", value: o.correct },
                { name: "Incorrect", value: o.wrong },
                { name: "Skipped", value: o.skipped },
              ]} />
            </div>
          </div>

          <div className="card">
            <h2>History</h2>
            {logs.length ? (
              <table>
                <thead>
                  <tr><th>Date & time</th><th>Subject</th><th>Total</th><th>✓</th><th>✗</th><th>–</th><th>Accuracy</th><th>Score</th><th /></tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l._id}>
                      <td>{formatDateTime(l.date)}{l.note && <><br /><small>{l.note}</small></>}</td>
                      <td>{l.tracker?.name || "—"}</td>
                      <td>{l.total}</td>
                      <td>{l.correct}</td>
                      <td>{l.wrong}</td>
                      <td>{l.skipped}</td>
                      <td>{pct(l.correct, l.correct + l.wrong)}%</td>
                      <td><strong>{fmt(l.score)}</strong> / {l.maxScore}</td>
                      <td><button className="btn-small btn-danger" onClick={() => remove(l._id)}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="empty">No entries yet.</p>}
          </div>
        </>
      )}
    </>
  );
}
