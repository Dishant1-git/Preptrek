const router = require("express").Router();
const Target = require("../models/Target");
const auth = require("../middleware/auth");
const { targetProgress } = require("../utils/progress");

router.use(auth);

// All targets with their live progress (used for the login notifications too)
router.get("/", async (req, res) => {
  const targets = await Target.find({ user: req.userId }).sort("deadline").populate("tracker", "name");
  res.json(await Promise.all(targets.map(targetProgress)));
});

router.post("/", async (req, res) => {
  const { title, type, goal, deadline, tracker } = req.body;
  if (!title || !type || !goal || !deadline) {
    return res.status(400).json({ message: "Please fill in all fields" });
  }
  const target = await Target.create({
    user: req.userId, title, type, goal, deadline,
    tracker: tracker || undefined,
  });
  res.status(201).json(target);
});

router.delete("/:id", async (req, res) => {
  await Target.deleteOne({ _id: req.params.id, user: req.userId });
  res.json({ message: "Target deleted" });
});

module.exports = router;
