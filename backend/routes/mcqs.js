const router = require("express").Router();
const Mcq = require("../models/Mcq");
const Attempt = require("../models/Attempt");
const auth = require("../middleware/auth");

router.use(auth);

const round = (n) => Math.round(n * 100) / 100;

// List questions (optionally for one tracker)
router.get("/", async (req, res) => {
  const filter = { user: req.userId };
  if (req.query.tracker) filter.tracker = req.query.tracker;
  res.json(await Mcq.find(filter).sort("-createdAt").populate("tracker", "name color"));
});

router.post("/", async (req, res) => {
  const { question, options, answer, explanation, tracker } = req.body;
  if (!question || options?.length !== 4 || options.some((o) => !o?.trim())) {
    return res.status(400).json({ message: "Add a question and all 4 options" });
  }
  if (![0, 1, 2, 3].includes(Number(answer))) {
    return res.status(400).json({ message: "Choose the correct option" });
  }
  const mcq = await Mcq.create({
    user: req.userId, question, options, answer, explanation,
    tracker: tracker || undefined,
  });
  res.status(201).json(await mcq.populate("tracker", "name color"));
});

router.delete("/:id", async (req, res) => {
  await Mcq.deleteOne({ _id: req.params.id, user: req.userId });
  res.json({ message: "Question deleted" });
});

// Submit a test: { answers: [{ mcq, chosen }], marking: { name, correct, wrong } }
// Marking is done here on the server, so the result can be trusted.
router.post("/attempts", async (req, res) => {
  const { answers = [] } = req.body;
  const m = req.body.marking || {};
  const marking = { name: m.name || "+1 / 0", correct: Number(m.correct) || 1, wrong: -Math.abs(Number(m.wrong) || 0) };
  if (!answers.length) return res.status(400).json({ message: "No questions in this test" });

  const mcqs = await Mcq.find({ user: req.userId, _id: { $in: answers.map((a) => a.mcq) } });
  const byId = Object.fromEntries(mcqs.map((m) => [String(m._id), m]));

  const checked = answers
    .filter((a) => byId[a.mcq])
    .map((a) => {
      const correctAnswer = byId[a.mcq].answer;
      const chosen = a.chosen ?? null;
      return { mcq: a.mcq, chosen, correctAnswer, isCorrect: chosen === correctAnswer };
    });

  const correct = checked.filter((a) => a.isCorrect).length;
  const skipped = checked.filter((a) => a.chosen === null).length;
  const wrong = checked.length - correct - skipped;

  const attempt = await Attempt.create({
    user: req.userId,
    marking,
    correct,
    wrong,
    skipped,
    score: round(correct * marking.correct + wrong * marking.wrong),
    maxScore: checked.length * marking.correct,
    answers: checked,
  });
  res.status(201).json(attempt);
});

// Test history + overall result across every test
router.get("/attempts", async (req, res) => {
  const attempts = await Attempt.find({ user: req.userId }).sort("-createdAt").select("-answers");

  const sum = (key) => attempts.reduce((total, a) => total + a[key], 0);
  const correct = sum("correct");
  const wrong = sum("wrong");
  const attempted = correct + wrong;

  res.json({
    attempts,
    overall: {
      tests: attempts.length,
      questions: attempted + sum("skipped"),
      correct,
      wrong,
      skipped: sum("skipped"),
      accuracy: attempted ? Math.round((correct / attempted) * 100) : 0, // of the ones you answered
      avgPercent: attempts.length
        ? Math.round(attempts.reduce((t, a) => t + (a.maxScore ? (a.score / a.maxScore) * 100 : 0), 0) / attempts.length)
        : 0,
    },
  });
});

module.exports = router;
