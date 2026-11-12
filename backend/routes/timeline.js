const router = require("express").Router();
const Tracker = require("../models/Tracker");
const Session = require("../models/Session");
const McqLog = require("../models/McqLog");
const Flashcard = require("../models/Flashcard");
const FlashcardReview = require("../models/FlashcardReview");
const Target = require("../models/Target");
const auth = require("../middleware/auth");

// GET /api/timeline?from=<ISO>&to=<ISO>
// Everything the user did in that range as a flat list of events (newest first).
// The client groups them by day in the user's own time zone.
router.get("/", auth, async (req, res) => {
  const to = req.query.to ? new Date(req.query.to) : new Date();
  const from = req.query.from ? new Date(req.query.from) : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (isNaN(from) || isNaN(to)) return res.status(400).json({ message: "Invalid date range" });

  const user = req.userId;
  const range = { $gte: from, $lte: to };
  const sub = (t) => (t ? { name: t.name, color: t.color } : null);

  const [trackers, sessions, mcqs, cardsAdded, reviews, targets] = await Promise.all([
    Tracker.find({ user }),
    Session.find({ user, date: range }).populate("tracker", "name color"),
    McqLog.find({ user, date: range }).populate("tracker", "name color"),
    Flashcard.find({ user, createdAt: range }).populate("tracker", "name color"),
    FlashcardReview.find({ user, createdAt: range }).populate("tracker", "name color"),
    Target.find({ user, createdAt: range }),
  ]);

  const events = [];

  sessions.forEach((s) => events.push({ type: "study", at: s.date, subject: sub(s.tracker), minutes: s.minutes }));

  trackers.forEach((t) =>
    t.topics.forEach((topic) => {
      if (topic.completedAt && topic.completedAt >= from && topic.completedAt <= to) {
        events.push({ type: "topic", at: topic.completedAt, subject: sub(t), title: topic.title });
      }
    })
  );

  mcqs.forEach((l) =>
    events.push({
      type: "mcq",
      at: l.date,
      subject: sub(l.tracker),
      total: l.total,
      correct: l.correct,
      wrong: l.wrong,
      skipped: l.skipped,
      score: l.score,
      maxScore: l.maxScore,
    })
  );

  // Cards added: one event per subject per hour keeps the timeline readable
  const added = {};
  cardsAdded.forEach((c) => {
    const key = `${c.createdAt.toISOString().slice(0, 13)}|${c.tracker?._id || ""}`;
    if (!added[key]) added[key] = { type: "cards", at: c.createdAt, subject: sub(c.tracker), count: 0 };
    added[key].count++;
    if (c.createdAt > added[key].at) added[key].at = c.createdAt;
  });
  events.push(...Object.values(added));

  reviews.forEach((r) =>
    events.push({ type: "review", at: r.createdAt, subject: sub(r.tracker), total: r.total, known: r.known, unknown: r.unknown })
  );

  targets.forEach((t) => events.push({ type: "target", at: t.createdAt, title: t.title }));

  events.sort((a, b) => new Date(b.at) - new Date(a.at));
  res.json(events);
});

module.exports = router;
