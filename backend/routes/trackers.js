const router = require("express").Router();
const Tracker = require("../models/Tracker");
const auth = require("../middleware/auth");

router.use(auth);

// Small helper so every route only touches the logged-in user's trackers
const findMine = (req) => Tracker.findOne({ _id: req.params.id, user: req.userId });

router.get("/", async (req, res) => {
  res.json(await Tracker.find({ user: req.userId }).sort("createdAt"));
});

router.post("/", async (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ message: "Tracker name is required" });
  res.status(201).json(await Tracker.create({ user: req.userId, name, color }));
});

router.delete("/:id", async (req, res) => {
  await Tracker.deleteOne({ _id: req.params.id, user: req.userId });
  res.json({ message: "Tracker deleted" });
});

// Add a topic to a tracker
router.post("/:id/topics", async (req, res) => {
  const tracker = await findMine(req);
  if (!tracker) return res.status(404).json({ message: "Tracker not found" });
  if (!req.body.title) return res.status(400).json({ message: "Topic title is required" });

  tracker.topics.push({ title: req.body.title, dueDate: req.body.dueDate || undefined });
  await tracker.save();
  res.json(tracker);
});

// Update a topic's status (records when it was completed)
router.put("/:id/topics/:topicId", async (req, res) => {
  const tracker = await findMine(req);
  const topic = tracker?.topics.id(req.params.topicId);
  if (!topic) return res.status(404).json({ message: "Topic not found" });

  const { status } = req.body;
  if (status) {
    topic.status = status;
    topic.completedAt = status === "done" ? new Date() : undefined;
  }
  await tracker.save();
  res.json(tracker);
});

router.delete("/:id/topics/:topicId", async (req, res) => {
  const tracker = await findMine(req);
  if (!tracker) return res.status(404).json({ message: "Tracker not found" });

  tracker.topics.pull(req.params.topicId);
  await tracker.save();
  res.json(tracker);
});

module.exports = router;
