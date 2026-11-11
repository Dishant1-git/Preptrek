"use client";
import { useEffect, useState } from "react";
import { api, formatDate } from "@/lib/api";
import { COLORS } from "@/components/Chart";

const NEXT_STATUS = { todo: "in-progress", "in-progress": "done", done: "todo" };
const LABEL = { todo: "To do", "in-progress": "In progress", done: "Done" };

export default function Trackers() {
  const [trackers, setTrackers] = useState([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [newTopic, setNewTopic] = useState({}); // { [trackerId]: { title, dueDate } }
  const [error, setError] = useState("");

  useEffect(() => {
    api("/trackers").then(setTrackers);
  }, []);

  // Replace one tracker in the list with the updated copy from the server
  const replace = (updated) => setTrackers((list) => list.map((t) => (t._id === updated._id ? updated : t)));

  const addTracker = async (e) => {
    e.preventDefault();
    try {
      const tracker = await api("/trackers", "POST", { name, color });
      setTrackers([...trackers, tracker]);
      setName("");
    } catch (err) {
      setError(err.message);
    }
  };

  const removeTracker = async (id) => {
    if (!confirm("Delete this tracker and all its topics?")) return;
    await api(`/trackers/${id}`, "DELETE");
    setTrackers(trackers.filter((t) => t._id !== id));
  };

  const addTopic = async (e, trackerId) => {
    e.preventDefault();
    replace(await api(`/trackers/${trackerId}/topics`, "POST", newTopic[trackerId]));
    setNewTopic({ ...newTopic, [trackerId]: { title: "", dueDate: "" } });
  };

  const cycleStatus = async (trackerId, topic) =>
    replace(await api(`/trackers/${trackerId}/topics/${topic._id}`, "PUT", { status: NEXT_STATUS[topic.status] }));

  const removeTopic = async (trackerId, topicId) =>
    replace(await api(`/trackers/${trackerId}/topics/${topicId}`, "DELETE"));

  const topicInput = (id, field) => ({
    value: newTopic[id]?.[field] || "",
    onChange: (e) => setNewTopic({ ...newTopic, [id]: { ...newTopic[id], [field]: e.target.value } }),
  });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Your trackers</h1>
          <p>Add anything you want to track — subjects, books, courses — then list the topics inside.</p>
        </div>
      </div>

      <form className="card inline-form" onSubmit={addTracker}>
        <input placeholder="e.g. Physics, DSA, Polity…" value={name} onChange={(e) => setName(e.target.value)} required />
        <select value={color} onChange={(e) => setColor(e.target.value)} style={{ color, maxWidth: 140 }}>
          {COLORS.map((c) => <option key={c} value={c} style={{ color: c }}>● {c}</option>)}
        </select>
        <button className="btn">+ Add tracker</button>
      </form>
      {error && <div className="error">{error}</div>}

      {!trackers.length && <p className="empty">No trackers yet. Add your first one above 👆</p>}

      <div className="grid">
        {trackers.map((t) => {
          const done = t.topics.filter((x) => x.status === "done").length;
          const percent = t.topics.length ? Math.round((done / t.topics.length) * 100) : 0;

          return (
            <div className="card" key={t._id}>
              <div className="tracker-head">
                <h2><span className="dot" style={{ background: t.color }} /> {t.name}</h2>
                <button className="btn-small btn-danger" onClick={() => removeTracker(t._id)}>Delete</button>
              </div>
              <small>{done} of {t.topics.length} topics · {percent}%</small>
              <div className="bar" style={{ margin: "8px 0 12px" }}><div style={{ width: `${percent}%`, background: t.color }} /></div>

              {t.topics.map((topic) => (
                <div key={topic._id} className={`topic ${topic.status === "done" ? "is-done" : ""}`}>
                  <button className={`pill ${topic.status}`} onClick={() => cycleStatus(t._id, topic)} title="Click to change status">
                    {LABEL[topic.status]}
                  </button>
                  <span>{topic.title}</span>
                  {topic.dueDate && <small>{formatDate(topic.dueDate)}</small>}
                  <button className="btn-small" onClick={() => removeTopic(t._id, topic._id)}>✕</button>
                </div>
              ))}

              <form className="inline-form" style={{ marginTop: 12 }} onSubmit={(e) => addTopic(e, t._id)}>
                <input placeholder="New topic" required {...topicInput(t._id, "title")} />
                <input type="date" title="Due date (optional)" {...topicInput(t._id, "dueDate")} />
                <button className="btn-small">Add</button>
              </form>
            </div>
          );
        })}
      </div>
    </>
  );
}
