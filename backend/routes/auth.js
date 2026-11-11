const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

const makeToken = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

router.post("/register", async (req, res) => {
  const { name, email, domain, gender, password, confirmPassword } = req.body;

  if (!name || !email || !domain || !gender || !password) {
    return res.status(400).json({ message: "Please fill in all fields" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }
  if (await User.findOne({ email: email.toLowerCase() })) {
    return res.status(400).json({ message: "An account with this email already exists" });
  }

  const user = await User.create({
    name, email, domain, gender,
    password: await bcrypt.hash(password, 10),
  });

  res.status(201).json({ token: makeToken(user), user });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });

  if (!user || !(await bcrypt.compare(password || "", user.password))) {
    return res.status(400).json({ message: "Wrong email or password" });
  }

  res.json({ token: makeToken(user), user });
});

router.get("/me", auth, async (req, res) => {
  res.json(await User.findById(req.userId));
});

// Save the user's dashboard layout (which charts to show + chart types)
router.put("/dashboard", auth, async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.userId,
    { dashboard: req.body.dashboard },
    { new: true }
  );
  res.json(user);
});

module.exports = router;
