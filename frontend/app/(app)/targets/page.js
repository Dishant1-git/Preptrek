"use client";
import { useEffect, useState } from "react";
import { api, formatDate } from "@/lib/api";

const STATE_LABEL = { "on-track": "On track", "due-soon": "Due soon", missed: "Missed", completed: "Completed 🎉" };
const emptyForm = { title: "", type: "topics", goal: "", deadline: "", tracker: "" };

export default function Targets() {
  const [targets, setTargets] = useState([]);
  const [trackers, setTrackers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const load = () => api("/targets").then(setTargets);

  useEffect(() => {
    load();
    api("/trackers").then(setTrackers);
  }, []);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const addTarget = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api("/targets", "POST", form);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    await api(`/targets/${id}`, "DELETE");
    setTargets(targets.filter((t) => t._id !== id));
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Targets</h1>
          <p>Set a goal and a deadline. We'll remind you how you're doing every time you log in.</p>
        </div>
      </div>

      <form className="card stack" onSubmit={addTarget}>
        <h2>New target</h2>
        <div className="inline-form">
          <input placeholder="e.g. Finish Mechanics" required value={form.title} onChange={set("title")} />
          <select value={form.type} onChange={set("type")}>
            <option value="topics">Complete topics</option>
            <option value="hours">Study hours</option>
          </select>
          <input type="number" min="1" placeholder={form.type === "topics" ? "How many topics" : "How many hours"} required value={form.goal} onChange={set("goal")} />
        </div>
        <div className="inline-form">
          <select value={form.tracker} onChange={set("tracker")}>
            <option value="">All trackers</option>
            {trackers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
          <input type="date" required value={form.deadline} onChange={set("deadline")} />
          <button className="btn">Set target</button>
        </div>
        {error && <div className="error">{error}</div>}
      </form>

      {!targets.length && <p className="empty">No targets yet — set one to stay on track 🎯</p>}

      <div className="grid">
        {targets.map((t) => (
          <div className="card stack" key={t._id}>
            <div className="tracker-head">
              <h2>{t.title}</h2>
              <span className={`pill ${t.state}`}>{STATE_LABEL[t.state]}</span>
            </div>
            <small>
              {t.done} / {t.goal} {t.type} · {t.tracker?.name || "All trackers"} · due {formatDate(t.deadline)}
            </small>
            <div className="bar"><div style={{ width: `${t.percent}%` }} /></div>
            <div className="tracker-head">
              <small>
                {t.state === "completed" ? "Done! +50 points" : t.daysLeft >= 0 ? `${t.daysLeft} days left` : `${-t.daysLeft} days overdue`}
              </small>
              <button className="btn-small btn-danger" onClick={() => remove(t._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
