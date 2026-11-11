"use client";
import { useEffect, useState } from "react";
import { api, formatDate } from "@/lib/api";
import { useUser } from "@/components/AppShell";
import { MARKING, defaultMarking } from "@/lib/exams";
import McqTest from "@/components/McqTest";
import Chart from "@/components/Chart";

const LETTERS = ["A", "B", "C", "D"];
const emptyQuestion = { question: "", options: ["", "", "", ""], answer: "", explanation: "", tracker: "" };
const shuffle = (list) => [...list].sort(() => Math.random() - 0.5);

export default function McqPage() {
  const { user } = useUser();
  const [tab, setTab] = useState("practice");
  const [mcqs, setMcqs] = useState([]);
  const [trackers, setTrackers] = useState([]);
  const [results, setResults] = useState(null);
  const [form, setForm] = useState(emptyQuestion);
  const [setup, setSetup] = useState({ tracker: "", count: 10, marking: defaultMarking(user.domain) });
  const [test, setTest] = useState(null); // questions of the running test
  const [error, setError] = useState("");

  const loadResults = () => api("/mcqs/attempts").then(setResults);

  useEffect(() => {
    api("/mcqs").then(setMcqs);
    api("/trackers").then(setTrackers);
    loadResults();
  }, []);

  // ---- add / delete questions ----
  const setOption = (i, value) => setForm({ ...form, options: form.options.map((o, idx) => (idx === i ? value : o)) });

  const addQuestion = async (e) => {
    e.preventDefault();
    setError("");
    if (form.answer === "") return setError("Pick which option is correct");
    try {
      const mcq = await api("/mcqs", "POST", { ...form, answer: Number(form.answer) });
      setMcqs([mcq, ...mcqs]);
      setForm({ ...emptyQuestion, tracker: form.tracker }); // keep the subject for the next question
    } catch (err) {
      setError(err.message);
    }
  };

  const removeQuestion = async (id) => {
    await api(`/mcqs/${id}`, "DELETE");
    setMcqs(mcqs.filter((m) => m._id !== id));
  };

  // ---- start a test ----
  const pool = mcqs.filter((m) => !setup.tracker || m.tracker?._id === setup.tracker);

  const startTest = () => {
    const count = setup.count === "all" ? pool.length : Number(setup.count);
    setTest(shuffle(pool).slice(0, count));
  };

  const endTest = () => {
    setTest(null);
    loadResults();
  };

  if (test) return <McqTest questions={test} marking={MARKING[setup.marking]} onExit={endTest} />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>MCQ practice</h1>
          <p>Add your own questions, take tests with real exam marking, and track your accuracy.</p>
        </div>
        <div className="tabs">
          {[["practice", "📝 Practice"], ["questions", `📚 My questions (${mcqs.length})`], ["results", "📈 Results"]].map(([key, label]) => (
            <button key={key} className={tab === key ? "on" : ""} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>
      </div>

      {tab === "practice" && (
        <div className="card stack">
          <h2>Start a test</h2>
          <div className="inline-form">
            <div style={{ flex: 1 }}>
              <label>Subject</label>
              <select value={setup.tracker} onChange={(e) => setSetup({ ...setup, tracker: e.target.value })}>
                <option value="">All subjects</option>
                {trackers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label>Questions</label>
              <select value={setup.count} onChange={(e) => setSetup({ ...setup, count: e.target.value })}>
                {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                <option value="all">All</option>
              </select>
            </div>
            <div style={{ flex: 2 }}>
              <label>Marking scheme</label>
              <select value={setup.marking} onChange={(e) => setSetup({ ...setup, marking: Number(e.target.value) })}>
                {MARKING.map((m, i) => <option key={m.name} value={i}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <small>{pool.length} question(s) available for this subject.</small>
          <div className="actions">
            <button className="btn" onClick={startTest} disabled={!pool.length}>Start test</button>
            {!pool.length && <button className="btn-ghost" onClick={() => setTab("questions")}>Add questions first</button>}
          </div>
        </div>
      )}

      {tab === "questions" && (
        <>
          <form className="card stack" onSubmit={addQuestion}>
            <h2>Add a question</h2>
            <textarea className="textarea" placeholder="Type the question…" required rows={3}
              value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
            {form.options.map((opt, i) => (
              <label key={i} className="option-input">
                <input type="radio" name="answer" checked={form.answer === i} onChange={() => setForm({ ...form, answer: i })} title="Mark as correct" />
                <b>{LETTERS[i]}</b>
                <input placeholder={`Option ${LETTERS[i]}`} required value={opt} onChange={(e) => setOption(i, e.target.value)} />
              </label>
            ))}
            <small>Tick the circle next to the correct option.</small>
            <div className="inline-form">
              <select value={form.tracker} onChange={(e) => setForm({ ...form, tracker: e.target.value })}>
                <option value="">No subject</option>
                {trackers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
              <input placeholder="Explanation (optional, shown after the test)" value={form.explanation}
                onChange={(e) => setForm({ ...form, explanation: e.target.value })} />
            </div>
            {error && <div className="error">{error}</div>}
            <button className="btn">Save question</button>
          </form>

          <div className="card">
            <h2>Question bank</h2>
            {mcqs.length ? (
              <table>
                <thead><tr><th>Question</th><th>Answer</th><th>Subject</th><th /></tr></thead>
                <tbody>
                  {mcqs.map((m) => (
                    <tr key={m._id}>
                      <td>{m.question}</td>
                      <td>{LETTERS[m.answer]}. {m.options[m.answer]}</td>
                      <td>{m.tracker?.name || "—"}</td>
                      <td><button className="btn-small btn-danger" onClick={() => removeQuestion(m._id)}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="empty">No questions yet.</p>}
          </div>
        </>
      )}

      {tab === "results" && results && (
        <>
          <div className="kpis">
            <div className="kpi"><small>Tests taken</small><strong>{results.overall.tests}</strong></div>
            <div className="kpi"><small>Correct</small><strong>{results.overall.correct}</strong></div>
            <div className="kpi"><small>Questions</small><strong>{results.overall.questions}</strong></div>
            <div className="kpi"><small>Wrong</small><strong>{results.overall.wrong}</strong></div>
            <div className="kpi"><small>Accuracy</small><strong>{results.overall.accuracy}%</strong></div>
            <div className="kpi"><small>Avg score</small><strong>{results.overall.avgPercent}%</strong></div>
          </div>

          <div className="grid">
            <div className="card">
              <h2>Score trend</h2>
              <Chart type="line" unit="%"
                data={[...results.attempts].reverse().map((a, i) => ({
                  name: `T${i + 1}`,
                  value: a.maxScore ? Math.round((a.score / a.maxScore) * 100) : 0,
                }))} />
            </div>
            <div className="card">
              <h2>All answers</h2>
              <Chart type="pie" data={[
                { name: "Correct", value: results.overall.correct },
                { name: "Wrong", value: results.overall.wrong },
                { name: "Not attempted", value: results.overall.skipped },
              ]} />
            </div>
          </div>

          <div className="card">
            <h2>Test history</h2>
            {results.attempts.length ? (
              <table>
                <thead><tr><th>Date</th><th>Marking</th><th>✓</th><th>✗</th><th>–</th><th>Score</th></tr></thead>
                <tbody>
                  {results.attempts.map((a) => (
                    <tr key={a._id}>
                      <td>{formatDate(a.createdAt)}</td>
                      <td>{a.marking?.name}</td>
                      <td>{a.correct}</td>
                      <td>{a.wrong}</td>
                      <td>{a.skipped}</td>
                      <td><strong>{+a.score.toFixed(2)}</strong> / {a.maxScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="empty">No tests yet. Take one from the Practice tab.</p>}
          </div>
        </>
      )}
    </>
  );
}
