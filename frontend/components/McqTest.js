"use client";
import { useState } from "react";
import { api } from "@/lib/api";

const LETTERS = ["A", "B", "C", "D"];
const fmt = (n) => +Number(n).toFixed(2); // 2.6666 -> 2.67

// Takes a test, sends answers to the server for marking, then shows the review
export default function McqTest({ questions, marking, onExit }) {
  const [chosen, setChosen] = useState({}); // { [mcqId]: optionIndex }
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const answered = Object.keys(chosen).length;

  const pick = (id, i) => {
    if (result) return; // locked after submit
    // clicking the same option again clears it (un-attempt)
    setChosen((c) => {
      const next = { ...c };
      if (next[id] === i) delete next[id];
      else next[id] = i;
      return next;
    });
  };

  const submit = async () => {
    const left = questions.length - answered;
    if (left && !confirm(`${left} question(s) not attempted. Submit anyway?`)) return;
    setSaving(true);
    const answers = questions.map((q) => ({ mcq: q._id, chosen: chosen[q._id] ?? null }));
    setResult(await api("/mcqs/attempts", "POST", { answers, marking }));
    setSaving(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Colour for an option: during the test only "picked"; after submit, right / wrong
  const optionClass = (q, i) => {
    if (!result) return chosen[q._id] === i ? "picked" : "";
    if (i === q.answer) return "right";
    if (chosen[q._id] === i) return "wrong";
    return "";
  };

  return (
    <>
      {result ? (
        <div className="card stack">
          <h2>Your result</h2>
          <div className="kpis">
            <div className="kpi"><small>Score</small><strong>{fmt(result.score)} / {result.maxScore}</strong></div>
            <div className="kpi"><small>Correct</small><strong>{result.correct}</strong></div>
            <div className="kpi"><small>Percentage</small><strong>{result.maxScore ? Math.round((result.score / result.maxScore) * 100) : 0}%</strong></div>
            <div className="kpi"><small>Wrong</small><strong>{result.wrong}</strong></div>
            <div className="kpi"><small>Not attempted</small><strong>{result.skipped}</strong></div>
            <div className="kpi">
              <small>Accuracy</small>
              <strong>{result.correct + result.wrong ? Math.round((result.correct / (result.correct + result.wrong)) * 100) : 0}%</strong>
            </div>
          </div>
          <small>
            Marking {marking.name}: {result.correct} × {fmt(marking.correct)} = +{fmt(result.correct * marking.correct)},{" "}
            {result.wrong} × {fmt(marking.wrong)} = {fmt(result.wrong * marking.wrong)}, not attempted = 0
          </small>
          <div className="actions">
            <button className="btn" onClick={onExit}>New test</button>
          </div>
        </div>
      ) : (
        <div className="card tracker-head">
          <span>{answered} of {questions.length} answered · Marking {marking.name}</span>
          <button className="btn-ghost" onClick={onExit}>Quit</button>
        </div>
      )}

      {questions.map((q, n) => {
        const mine = chosen[q._id];
        const status = !result ? null : mine === undefined ? "skipped" : mine === q.answer ? "correct" : "wrong";
        return (
          <div className="card stack" key={q._id}>
            <div className="tracker-head">
              <strong>Q{n + 1}. {q.question}</strong>
              {status && (
                <span className={`pill ${status === "correct" ? "completed" : status === "wrong" ? "missed" : "todo"}`}>
                  {status === "correct" ? `✓ +${fmt(marking.correct)}` : status === "wrong" ? `✗ ${fmt(marking.wrong)}` : "Not attempted · 0"}
                </span>
              )}
            </div>
            {q.options.map((opt, i) => (
              <button key={i} className={`option ${optionClass(q, i)}`} onClick={() => pick(q._id, i)}>
                <b>{LETTERS[i]}</b> {opt}
              </button>
            ))}
            {result && q.explanation && <div className="alert">💡 {q.explanation}</div>}
          </div>
        );
      })}

      {!result && (
        <button className="btn" onClick={submit} disabled={saving}>
          {saving ? "Checking…" : "Submit test"}
        </button>
      )}
    </>
  );
}
