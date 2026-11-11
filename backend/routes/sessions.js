const router = require("express").Router();
const Session = require("../models/Session");
const auth = require("../middleware/auth");

router.use(auth);

// Last 20 sessions, newest first
router.get("/", async (req, res) => {
  const sessions = await Session.find({ user: req.userId })
    .sort("-date")
    .limit(20)
    .populate("tracker", "name color");
  res.json(sessions);
});

// Called by the timer when the user finishes / stops a session
router.post("/", async (req, res) => {
  const minutes = Math.round(Number(req.body.minutes));
  if (!minutes || minutes < 1) return res.status(400).json({ message: "Session is too short to save" });

  const session = await Session.create({
    user: req.userId,
    minutes,
    tracker: req.body.tracker || undefined,
  });
  res.status(201).json(session);
});

module.exports = router;
