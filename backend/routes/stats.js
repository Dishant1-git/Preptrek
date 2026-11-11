const router = require("express").Router();
const Tracker = require("../models/Tracker");
const Session = require("../models/Session");
const Target = require("../models/Target");
const auth = require("../middleware/auth");
const { targetProgress, DAY } = require("../utils/progress");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayKey = (d) => new Date(d).toDateString();
const hours = (min) => +(min / 60).toFixed(1);

// GET /api/stats?month=2026-11  -> everything the dashboard needs
router.get("/", auth, async (req, res) => {
  const [year, month] = (req.query.month || "").split("-").map(Number);
  const now = new Date();
  const y = year || now.getFullYear();
  const m = month ? month - 1 : now.getMonth();

  const trackers = await Tracker.find({ user: req.userId });
  const sessions = await Session.find({ user: req.userId });
  const targets = await Promise.all((await Target.find({ user: req.userId })).map(targetProgress));

  // ---- topics ----
  const topics = trackers.flatMap((t) => t.topics.map((topic) => ({ ...topic.toObject(), tracker: t.name })));
  const done = topics.filter((t) => t.status === "done");
  const inProgress = topics.filter((t) => t.status === "in-progress");
  const overdue = topics.filter((t) => t.status !== "done" && t.dueDate && new Date(t.dueDate) < now);
  const upcoming = topics
    .filter((t) => t.status !== "done" && t.dueDate && new Date(t.dueDate) >= now)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 6);

  // ---- study time ----
  const totalMinutes = sessions.reduce((sum, s) => sum + s.minutes, 0);
  const todayMinutes = sessions.filter((s) => dayKey(s.date) === dayKey(now)).reduce((sum, s) => sum + s.minutes, 0);

  // Hours per day for the selected month
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const daily = Array.from({ length: daysInMonth }, (_, i) => ({ name: String(i + 1), value: 0 }));
  sessions.forEach((s) => {
    const d = new Date(s.date);
    if (d.getFullYear() === y && d.getMonth() === m) daily[d.getDate() - 1].value += s.minutes;
  });
  daily.forEach((d) => (d.value = hours(d.value)));

  // Topics completed per month for the selected year
  const monthly = MONTHS.map((name) => ({ name, value: 0 }));
  done.forEach((t) => {
    const d = new Date(t.completedAt);
    if (t.completedAt && d.getFullYear() === y) monthly[d.getMonth()].value++;
  });

  // Streak: how many days in a row (ending today or yesterday) the user studied or finished something
  const activeDays = new Set([...sessions.map((s) => dayKey(s.date)), ...done.map((t) => dayKey(t.completedAt))]);
  let streak = 0;
  let cursor = activeDays.has(dayKey(now)) ? now.getTime() : now.getTime() - DAY;
  while (activeDays.has(dayKey(cursor))) {
    streak++;
    cursor -= DAY;
  }

  // ---- perks: points, level & badges ----
  const targetsDone = targets.filter((t) => t.state === "completed").length;
  const points = done.length * 10 + Math.floor(totalMinutes / 15) + targetsDone * 50;
  const longestSession = Math.max(0, ...sessions.map((s) => s.minutes));
  const finishedTracker = trackers.some((t) => t.topics.length && t.topics.every((x) => x.status === "done"));

  const badges = [
    { icon: "🌱", name: "First Step", desc: "Complete your first topic", earned: done.length >= 1 },
    { icon: "🔟", name: "Ten Down", desc: "Complete 10 topics", earned: done.length >= 10 },
    { icon: "🏅", name: "Half Century", desc: "Complete 50 topics", earned: done.length >= 50 },
    { icon: "🎯", name: "Deep Focus", desc: "Study 60+ minutes in one session", earned: longestSession >= 60 },
    { icon: "🏃", name: "Marathoner", desc: "Study 25 hours in total", earned: totalMinutes >= 25 * 60 },
    { icon: "🔥", name: "On Fire", desc: "Keep a 7 day streak", earned: streak >= 7 },
    { icon: "🏆", name: "Target Crusher", desc: "Complete a target", earned: targetsDone >= 1 },
    { icon: "📚", name: "Syllabus Master", desc: "Finish every topic in a tracker", earned: finishedTracker },
  ];

  res.json({
    totals: {
      topics: topics.length,
      done: done.length,
      inProgress: inProgress.length,
      overdue: overdue.length,
      totalHours: hours(totalMinutes),
      todayMinutes,
      streak,
    },
    charts: {
      status: [
        { name: "Done", value: done.length },
        { name: "In progress", value: inProgress.length },
        { name: "To do", value: topics.length - done.length - inProgress.length },
      ],
      daily,
      monthly,
      trackers: trackers.map((t) => {
        const finished = t.topics.filter((x) => x.status === "done").length;
        return { name: t.name, value: t.topics.length ? Math.round((finished / t.topics.length) * 100) : 0 };
      }),
      hoursByTracker: trackers.map((t) => ({
        name: t.name,
        value: hours(sessions.filter((s) => String(s.tracker) === String(t._id)).reduce((sum, s) => sum + s.minutes, 0)),
      })),
    },
    upcoming,
    overdue: overdue.slice(0, 6),
    perks: { points, level: Math.floor(points / 100) + 1, nextLevelAt: (Math.floor(points / 100) + 1) * 100, badges },
  });
});

module.exports = router;
