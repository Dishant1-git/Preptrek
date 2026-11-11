const Tracker = require("../models/Tracker");
const Session = require("../models/Session");

const DAY = 24 * 60 * 60 * 1000;

// Works out how far the user is on a target and how much time is left.
// - "topics" targets count all completed topics (in one tracker or all of them)
// - "hours" targets count hours studied since the target was created
async function targetProgress(target) {
  let done = 0;

  if (target.type === "topics") {
    const filter = { user: target.user };
    if (target.tracker) filter._id = target.tracker;
    const trackers = await Tracker.find(filter);
    done = trackers.reduce((sum, t) => sum + t.topics.filter((x) => x.status === "done").length, 0);
  } else {
    const filter = { user: target.user, date: { $gte: target.createdAt } };
    if (target.tracker) filter.tracker = target.tracker;
    const sessions = await Session.find(filter);
    done = +(sessions.reduce((sum, s) => sum + s.minutes, 0) / 60).toFixed(1);
  }

  const percent = Math.min(100, Math.round((done / target.goal) * 100));
  const daysLeft = Math.ceil((new Date(target.deadline) - Date.now()) / DAY);

  let state = "on-track";
  if (percent >= 100) state = "completed";
  else if (daysLeft < 0) state = "missed";
  else if (daysLeft <= 3) state = "due-soon";

  return { ...target.toObject(), done, percent, daysLeft, state };
}

module.exports = { targetProgress, DAY };
