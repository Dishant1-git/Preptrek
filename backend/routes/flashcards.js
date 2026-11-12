const router = require("express").Router();
const Flashcard = require("../models/Flashcard");
const FlashcardReview = require("../models/FlashcardReview");
const auth = require("../middleware/auth");

router.use(auth);

// List cards (optionally for one subject)
router.get("/", async (req, res) => {
  const filter = { user: req.userId };
  if (req.query.tracker) filter.tracker = req.query.tracker;
  res.json(await Flashcard.find(filter).sort("-createdAt").populate("tracker", "name color"));
});

router.post("/", async (req, res) => {
  const { front, back, tracker } = req.body;
  if (!front?.trim() || !back?.trim()) return res.status(400).json({ message: "Fill in both sides of the card" });
  const card = await Flashcard.create({ user: req.userId, front, back, tracker: tracker || undefined });
  res.status(201).json(await card.populate("tracker", "name color"));
});

router.delete("/:id", async (req, res) => {
  await Flashcard.deleteOne({ _id: req.params.id, user: req.userId });
  res.json({ message: "Card deleted" });
});

// Save a finished review: { tracker, results: [{ card, known: true|false }] }
router.post("/reviews", async (req, res) => {
  const results = (req.body.results || []).filter((r) => r.card);
  if (!results.length) return res.status(400).json({ message: "No cards were reviewed" });

  const now = new Date();
  await Flashcard.bulkWrite(
    results.map((r) => ({
      updateOne: {
        filter: { _id: r.card, user: req.userId },
        update: {
          $inc: r.known ? { known: 1 } : { unknown: 1 },
          $set: { lastResult: r.known ? "known" : "unknown", lastReviewedAt: now },
        },
      },
    }))
  );

  const known = results.filter((r) => r.known).length;
  const review = await FlashcardReview.create({
    user: req.userId,
    tracker: req.body.tracker || undefined,
    total: results.length,
    known,
    unknown: results.length - known,
  });
  res.status(201).json(review);
});

// Review history + overall result + card status per subject
router.get("/reviews", async (req, res) => {
  const reviews = await FlashcardReview.find({ user: req.userId }).sort("-createdAt").populate("tracker", "name color");
  const cards = await Flashcard.find({ user: req.userId }).populate("tracker", "name color");

  const groups = {};
  cards.forEach((c) => {
    const key = c.tracker ? String(c.tracker._id) : "none";
    if (!groups[key]) groups[key] = { tracker: c.tracker || null, cards: 0, mastered: 0, learning: 0, notReviewed: 0 };
    const g = groups[key];
    g.cards++;
    if (c.lastResult === "known") g.mastered++;
    else if (c.lastResult === "unknown") g.learning++;
    else g.notReviewed++;
  });

  const reviewed = reviews.reduce((t, r) => t + r.total, 0);
  const known = reviews.reduce((t, r) => t + r.known, 0);
  res.json({
    reviews,
    overall: {
      cards: cards.length,
      reviews: reviews.length,
      reviewed,
      known,
      unknown: reviewed - known,
      accuracy: reviewed ? Math.round((known / reviewed) * 100) : 0,
      mastered: cards.filter((c) => c.lastResult === "known").length,
    },
    bySubject: Object.values(groups).sort((a, b) => b.cards - a.cards),
  });
});

module.exports = router;
