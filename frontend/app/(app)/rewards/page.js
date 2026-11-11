"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function Rewards() {
  const [perks, setPerks] = useState(null);

  useEffect(() => {
    api("/stats").then((s) => setPerks(s.perks));
  }, []);

  if (!perks) return <p className="empty">Loading rewards…</p>;
  const earned = perks.badges.filter((b) => b.earned).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Rewards</h1>
          <p>Earn points for every topic, every study session and every target you hit.</p>
        </div>
      </div>

      <div className="card level">
        <div className="num">Lv {perks.level}</div>
        <div style={{ flex: 1 }}>
          <h2>{perks.points} points</h2>
          <div className="bar"><div style={{ width: `${perks.points % 100}%` }} /></div>
          <small>{perks.nextLevelAt - perks.points} points to level {perks.level + 1}</small>
        </div>
      </div>

      <div className="card">
        <h2>How to earn points</h2>
        <table>
          <tbody>
            <tr><td>✅ Complete a topic</td><td>+10</td></tr>
            <tr><td>⏱️ Every 15 minutes studied</td><td>+1</td></tr>
            <tr><td>🎯 Complete a target</td><td>+50</td></tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Badges ({earned}/{perks.badges.length})</h2>
        <div className="badges">
          {perks.badges.map((b) => (
            <div key={b.name} className={`badge ${b.earned ? "" : "locked"}`}>
              <div className="icon">{b.icon}</div>
              <strong>{b.name}</strong>
              <p>{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
