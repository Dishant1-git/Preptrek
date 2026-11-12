const router = require("express").Router();
const McqLog = require("../models/McqLog");
const auth = require("../middleware/auth");

router.use(auth);

const round = (n) => Math.round(n * 100) / 100;
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

// Totals for a list of logs
function summarise(logs) {
  const sum = (key) => logs.reduce((t, l) => t + (l[key] || 0), 0);
  const correct = sum("correct");
  const wrong = sum("wrong");
  return {
    logs: logs.length,
    total: sum("total"),
    correct,
    wrong,
    skipped: sum("skipped"),
    accuracy: pct(correct, correct + wrong), // of the ones attempted
    scorePercent: pct(sum("score"), sum("maxScore")),
  };
}

// GET /api/mcqs?tracker=<id>  -> logs (newest first), overall summary and summary per subject
router.get("/", async (req, res) => {
  const filter = { user: req.userId };
  if (req.query.tracker) filter.tracker = req.query.tracker;
  const logs = await McqLog.find(filter).sort("-date").populate("tracker", "name color");

  const groups = {};
  logs.forEach((l) => {
    const key = l.tracker ? String(l.tracker._id) : "none";
    if (!groups[key]) groups[key] = { tracker: l.tracker || null, logs: [] };
    groups[key].logs.push(l);
  });
  const bySubject = Object.values(groups)
    .map((g) => ({ tracker: g.tracker, ...summarise(g.logs) }))
    .sort((a, b) => b.total - a.total);

  res.json({ logs, overall: summarise(logs), bySubject });
});

// POST /api/mcqs  { tracker, date, total, correct, wrong, skipped?, marking?, note }
// Skipped is worked out as total - correct - wrong when not sent.
router.post("/", async (req, res) => {
  const total = Number(req.body.total);
  const correct = Number(req.body.correct) || 0;
  const wrong = Number(req.body.wrong) || 0;
  const skipped =
    req.body.skipped === undefined || req.body.skipped === "" ? total - correct - wrong : Number(req.body.skipped);

  if (!Number.isInteger(total) || total < 1) return res.status(400).json({ message: "Enter how many MCQs you did" });
  if ([correct, wrong, skipped].some((n) => !Number.isInteger(n))) {
    return res.status(400).json({ message: "Use whole numbers for correct, incorrect and skipped" });
  }
  if (correct < 0 || wrong < 0 || skipped < 0) {
    return res.status(400).json({ message: "Correct + incorrect can't be more than the total" });
  }
  if (correct + wrong + skipped !== total) {
    return res.status(400).json({ message: "Correct + incorrect + skipped must add up to the total" });
  }
  const date = req.body.date ? new Date(req.body.date) : new Date();
  if (isNaN(date)) return res.status(400).json({ message: "Invalid date" });

  const m = req.body.marking || {};
  const marking = { name: m.name || "+1 / 0", correct: Number(m.correct) || 1, wrong: -Math.abs(Number(m.wrong) || 0) };

  const log = await McqLog.create({
    user: req.userId,
    tracker: req.body.tracker || undefined,
    date,
    total,
    correct,
    wrong,
    skipped,
    marking,
    score: round(correct * marking.correct + wrong * marking.wrong),
    maxScore: total * marking.correct,
    note: req.body.note,
  });
  res.status(201).json(await log.populate("tracker", "name color"));
});

router.delete("/:id", async (req, res) => {
  await McqLog.deleteOne({ _id: req.params.id, user: req.userId });
  res.json({ message: "Entry deleted" });
});

module.exports = router;
