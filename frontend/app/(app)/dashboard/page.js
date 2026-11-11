"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, formatDate } from "@/lib/api";
import { useUser } from "@/components/AppShell";
import Chart from "@/components/Chart";

const CHART_TYPES = ["bar", "line", "area", "pie"];
const UNITS = { daily: " h", hoursByTracker: " h", trackers: "%" };

// Turns a target's progress into a friendly reminder line
function reminder(t) {
  if (t.state === "completed") return `🎉 "${t.title}" is complete! Great work.`;
  if (t.state === "missed") return `⚠️ "${t.title}" passed its deadline at ${t.percent}%. Set a new date and keep going.`;
  const left = t.type === "hours" ? `${+(t.goal - t.done).toFixed(1)} hours` : `${t.goal - t.done} topics`;
  return `⏳ "${t.title}": ${t.percent}% done, ${left} to go, ${t.daysLeft} day${t.daysLeft === 1 ? "" : "s"} left.`;
}

export default function Dashboard() {
  const { user, setUser } = useUser();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [editing, setEditing] = useState(null); // copy of the layout while the customise panel is open

  useEffect(() => {
    api(`/stats?month=${month}`).then(setStats);
  }, [month]);

  // Right after login: show target reminders (and a browser notification if allowed)
  useEffect(() => {
    if (!sessionStorage.getItem("showAlerts")) return;
    sessionStorage.removeItem("showAlerts");

    api("/targets").then((targets) => {
      if (!targets.length) return;
      setAlerts(targets);
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("PrepTrek reminder", { body: reminder(targets[0]), icon: "/logo-icon.jpg" });
      }
    });
  }, []);

  const enableNotifications = () => Notification.requestPermission();

  const saveLayout = async () => {
    setUser(await api("/auth/dashboard", "PUT", { dashboard: editing }));
    setEditing(null);
  };

  const updateWidget = (i, changes) =>
    setEditing(editing.map((w, idx) => (idx === i ? { ...w, ...changes } : w)));

  const moveUp = (i) => {
    if (i === 0) return;
    const copy = [...editing];
    [copy[i - 1], copy[i]] = [copy[i], copy[i - 1]];
    setEditing(copy);
  };

  if (!stats) return <p className="empty">Loading dashboard…</p>;
  const { totals, charts, perks } = stats;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Hi {user.name.split(" ")[0]} 👋</h1>
          <p>Here's how your {user.domain} preparation is going.</p>
        </div>
        <div className="actions">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          <button className="btn-ghost" onClick={() => setEditing(user.dashboard)}>⚙️ Customize</button>
        </div>
      </div>

      <div className="kpis">
        <div className="kpi"><small>Total topics</small><strong>{totals.topics}</strong></div>
        <div className="kpi"><small>Completed</small><strong>{totals.done}</strong></div>
        <div className="kpi"><small>In progress</small><strong>{totals.inProgress}</strong></div>
        <div className="kpi"><small>Overdue</small><strong>{totals.overdue}</strong></div>
        <div className="kpi"><small>Hours studied</small><strong>{totals.totalHours}</strong></div>
        <div className="kpi"><small>Streak 🔥</small><strong>{totals.streak}d</strong></div>
      </div>

      <Link href="/rewards" className="card level">
        <div className="num">Lv {perks.level}</div>
        <div style={{ flex: 1 }}>
          <h2>{perks.points} points</h2>
          <div className="bar"><div style={{ width: `${perks.points % 100}%` }} /></div>
          <small>{perks.nextLevelAt - perks.points} points to level {perks.level + 1} · {perks.badges.filter((b) => b.earned).length} badges earned</small>
        </div>
      </Link>

      <div className="grid">
        {user.dashboard.filter((w) => w.visible).map((w) => (
          <div className="card" key={w.key}>
            <h2>{w.title}</h2>
            <Chart type={w.chart} data={charts[w.key]} unit={UNITS[w.key]} />
          </div>
        ))}
      </div>

      <div className="grid">
        <div className="card">
          <h2>📅 Coming up</h2>
          {stats.upcoming.length ? (
            <table>
              <thead><tr><th>Topic</th><th>Tracker</th><th>Due</th></tr></thead>
              <tbody>
                {stats.upcoming.map((t) => (
                  <tr key={t._id}><td>{t.title}</td><td>{t.tracker}</td><td>{formatDate(t.dueDate)}</td></tr>
                ))}
              </tbody>
            </table>
          ) : <p className="empty">Nothing due. Add due dates to your topics to see them here.</p>}
        </div>

        <div className="card">
          <h2>⏰ Overdue</h2>
          {stats.overdue.length ? (
            <table>
              <thead><tr><th>Topic</th><th>Tracker</th><th>Late by</th></tr></thead>
              <tbody>
                {stats.overdue.map((t) => (
                  <tr key={t._id}>
                    <td>{t.title}</td><td>{t.tracker}</td>
                    <td className="late">{Math.ceil((Date.now() - new Date(t.dueDate)) / 86400000)} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="empty">You're all caught up ✨</p>}
        </div>
      </div>

      {/* Reminders popup shown once after login */}
      {alerts.length > 0 && (
        <div className="overlay" onClick={() => setAlerts([])}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Your target updates</h2>
            {alerts.map((t) => <div key={t._id} className={`alert ${t.state}`}>{reminder(t)}</div>)}
            <div className="actions">
              <button className="btn" onClick={() => setAlerts([])}>Let's study</button>
              {"Notification" in window && Notification.permission === "default" && (
                <button className="btn-ghost" onClick={enableNotifications}>🔔 Enable notifications</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customise dashboard panel */}
      {editing && (
        <div className="overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Customize your dashboard</h2>
            <p className="page-head"><small>Pick which charts to show, their type and order.</small></p>
            {editing.map((w, i) => (
              <div className="widget-row" key={w.key}>
                <input type="checkbox" checked={w.visible} onChange={(e) => updateWidget(i, { visible: e.target.checked })} />
                <span>{w.title}</span>
                <select value={w.chart} onChange={(e) => updateWidget(i, { chart: e.target.value })}>
                  {CHART_TYPES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <button className="btn-small" onClick={() => moveUp(i)} title="Move up">↑</button>
              </div>
            ))}
            <div className="actions">
              <button className="btn" onClick={saveLayout}>Save</button>
              <button className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
