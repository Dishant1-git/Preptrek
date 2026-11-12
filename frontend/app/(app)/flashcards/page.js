"use client";
import { useEffect, useState } from "react";
import { api, formatDateTime } from "@/lib/api";
import Chart from "@/components/Chart";

const shuffle = (list) => [...list].sort(() => Math.random() - 0.5);
const emptyCard = { front: "", back: "", tracker: "" };
const STATUS = { known: ["completed", "Got it"], unknown: ["missed", "Learning"] };

export default function FlashcardsPage() {
  const [tab, setTab] = useState("study");
  const [cards, setCards] = useState([]);
  const [trackers, setTrackers] = useState([]);
  const [results, setResults] = useState(null);
  const [form, setForm] = useState(emptyCard);
  const [error, setError] = useState("");
  const [setup, setSetup] = useState({ tracker: "", only: "all" });
  const [deck, setDeck] = useState(null); // cards in the running review
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answers, setAnswers] = useState([]); // [{ card, known }]
  const [finished, setFinished] = useState(null);

  const loadResults = () => api("/flashcards/reviews").then(setResults);

  useEffect(() => {
    api("/flashcards").then(setCards);
    api("/trackers").then(setTrackers);
    loadResults();
  }, []);

  // ---- add / delete ----
  const addCard = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const card = await api("/flashcards", "POST", form);
      setCards([card, ...cards]);
      setForm({ ...emptyCard, tracker: form.tracker }); // keep the subject for the next card
    } catch (err) {
      setError(err.message);
    }
  };

  const removeCard = async (id) => {
    await api(`/flashcards/${id}`, "DELETE");
    setCards(cards.filter((c) => c._id !== id));
  };

  // ---- review ----
  const pool = cards.filter(
    (c) =>
      (!setup.tracker || c.tracker?._id === setup.tracker) &&
      (setup.only === "all" || (setup.only === "learning" ? c.lastResult !== "known" : !c.lastResult))
  );

  const start = () => {
    setDeck(shuffle(pool));
    setIndex(0);
    setFlipped(false);
    setAnswers([]);
    setFinished(null);
  };

  const answer = async (known) => {
    const next = [...answers, { card: deck[index]._id, known }];
    setAnswers(next);
    setFlipped(false);
    if (index + 1 < deck.length) return setIndex(index + 1);
    await finish(next);
  };

  const finish = async (list = answers) => {
    if (!list.length) return setDeck(null);
    const review = await api("/flashcards/reviews", "POST", { tracker: setup.tracker, results: list });
    setFinished(review);
    setDeck(null);
    // refresh card status + results
    api("/flashcards").then(setCards);
    loadResults();
  };

  if (deck) {
    const card = deck[index];
    return (
      <>
        <div className="card tracker-head">
          <span>Card {index + 1} of {deck.length} · {answers.filter((a) => a.known).length} known so far</span>
          <button className="btn-ghost" onClick={() => finish()}>{answers.length ? "Stop & save" : "Quit"}</button>
        </div>
        <div className="bar"><div style={{ width: `${(index / deck.length) * 100}%` }} /></div>
        <button className={`flashcard ${flipped ? "flipped" : ""}`} onClick={() => setFlipped(!flipped)}>
          {card.tracker && <small>{card.tracker.name}</small>}
          <div className="flashcard-text">{flipped ? card.back : card.front}</div>
          <small>{flipped ? "Answer" : "Tap to show the answer"}</small>
        </button>
        {flipped && (
          <div className="actions" style={{ justifyContent: "center" }}>
            <button className="btn btn-red" onClick={() => answer(false)}>✗ Didn&apos;t know</button>
            <button className="btn btn-green" onClick={() => answer(true)}>✓ Got it</button>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Flashcards</h1>
          <p>Make your own cards, review them, and see which ones you know.</p>
        </div>
        <div className="tabs">
          {[["study", "🧠 Review"], ["cards", `🗂️ My cards (${cards.length})`], ["results", "📈 Results"]].map(([key, label]) => (
            <button key={key} className={tab === key ? "on" : ""} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>
      </div>

      {tab === "study" && (
        <>
          {finished && (
            <div className="card stack">
              <h2>Review done 🎉</h2>
              <div className="kpis">
                <div className="kpi"><small>Cards</small><strong>{finished.total}</strong></div>
                <div className="kpi"><small>Got it</small><strong>{finished.known}</strong></div>
                <div className="kpi"><small>Score</small><strong>{Math.round((finished.known / finished.total) * 100)}%</strong></div>
                <div className="kpi"><small>Didn&apos;t know</small><strong>{finished.unknown}</strong></div>
              </div>
            </div>
          )}
          <div className="card stack">
            <h2>Start a review</h2>
            <div className="inline-form">
              <div style={{ flex: 1 }}>
                <label>Subject</label>
                <select value={setup.tracker} onChange={(e) => setSetup({ ...setup, tracker: e.target.value })}>
                  <option value="">All subjects</option>
                  {trackers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label>Cards</label>
                <select value={setup.only} onChange={(e) => setSetup({ ...setup, only: e.target.value })}>
                  <option value="all">All cards</option>
                  <option value="learning">Only ones I don&apos;t know yet</option>
                  <option value="new">Only new cards</option>
                </select>
              </div>
            </div>
            <small>{pool.length} card(s) to review.</small>
            <div className="actions">
              <button className="btn" onClick={start} disabled={!pool.length}>Start review</button>
              {!cards.length && <button className="btn-ghost" onClick={() => setTab("cards")}>Add cards first</button>}
            </div>
          </div>
        </>
      )}

      {tab === "cards" && (
        <>
          <form className="card stack" onSubmit={addCard}>
            <h2>Add a flashcard</h2>
            <textarea className="textarea" rows={2} required placeholder="Front: question or term"
              value={form.front} onChange={(e) => setForm({ ...form, front: e.target.value })} />
            <textarea className="textarea" rows={3} required placeholder="Back: answer"
              value={form.back} onChange={(e) => setForm({ ...form, back: e.target.value })} />
            <select value={form.tracker} onChange={(e) => setForm({ ...form, tracker: e.target.value })}>
              <option value="">No subject</option>
              {trackers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
            {error && <div className="error">{error}</div>}
            <button className="btn">Save card</button>
          </form>

          <div className="card">
            <h2>All cards</h2>
            {cards.length ? (
              <table>
                <thead><tr><th>Front</th><th>Back</th><th>Subject</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {cards.map((c) => (
                    <tr key={c._id}>
                      <td>{c.front}</td>
                      <td>{c.back}</td>
                      <td>{c.tracker?.name || "—"}</td>
                      <td>
                        <span className={`pill ${STATUS[c.lastResult]?.[0] || "todo"}`}>{STATUS[c.lastResult]?.[1] || "New"}</span>
                        {(c.known > 0 || c.unknown > 0) && <small> {c.known}✓ {c.unknown}✗</small>}
                      </td>
                      <td><button className="btn-small btn-danger" onClick={() => removeCard(c._id)}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="empty">No cards yet.</p>}
          </div>
        </>
      )}

      {tab === "results" && results && (
        <>
          <div className="kpis">
            <div className="kpi"><small>Cards</small><strong>{results.overall.cards}</strong></div>
            <div className="kpi"><small>Mastered</small><strong>{results.overall.mastered}</strong></div>
            <div className="kpi"><small>Reviews</small><strong>{results.overall.reviews}</strong></div>
            <div className="kpi"><small>Didn&apos;t know</small><strong>{results.overall.unknown}</strong></div>
            <div className="kpi"><small>Cards reviewed</small><strong>{results.overall.reviewed}</strong></div>
            <div className="kpi"><small>Recall</small><strong>{results.overall.accuracy}%</strong></div>
          </div>

          <div className="grid">
            <div className="card">
              <h2>By subject</h2>
              {results.bySubject.length ? (
                <table>
                  <thead><tr><th>Subject</th><th>Cards</th><th>Got it</th><th>Learning</th><th>New</th></tr></thead>
                  <tbody>
                    {results.bySubject.map((s) => (
                      <tr key={s.tracker?._id || "none"}>
                        <td>{s.tracker && <span className="dot" style={{ background: s.tracker.color }} />} {s.tracker?.name || "No subject"}</td>
                        <td>{s.cards}</td>
                        <td>{s.mastered}</td>
                        <td>{s.learning}</td>
                        <td>{s.notReviewed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="empty">No cards yet.</p>}
            </div>
            <div className="card">
              <h2>Recall trend</h2>
              <Chart type="line" unit="%"
                data={[...results.reviews].reverse().map((r, i) => ({
                  name: `R${i + 1}`,
                  value: r.total ? Math.round((r.known / r.total) * 100) : 0,
                }))} />
            </div>
          </div>

          <div className="card">
            <h2>Review history</h2>
            {results.reviews.length ? (
              <table>
                <thead><tr><th>Date & time</th><th>Subject</th><th>Cards</th><th>✓ Got it</th><th>✗ Didn&apos;t know</th><th>Score</th></tr></thead>
                <tbody>
                  {results.reviews.map((r) => (
                    <tr key={r._id}>
                      <td>{formatDateTime(r.createdAt)}</td>
                      <td>{r.tracker?.name || "All subjects"}</td>
                      <td>{r.total}</td>
                      <td>{r.known}</td>
                      <td>{r.unknown}</td>
                      <td><strong>{r.total ? Math.round((r.known / r.total) * 100) : 0}%</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="empty">No reviews yet. Start one from the Review tab.</p>}
          </div>
        </>
      )}
    </>
  );
}
