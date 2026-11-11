// PrepTrek API — built by Team Crudify (www.crudify.in)
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Allow the frontend URL(s) from .env (comma separated) and any localhost port during development
const allowed = (process.env.CLIENT_URL || "").split(",").map((u) => u.trim());
app.use(
  cors({
    origin: (origin, cb) => {
      const ok = !origin || allowed.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
      cb(null, ok);
    },
  })
);
app.use(express.json());

// Health check — registered before the DB guard so it always responds
app.get("/api/health", (req, res) => {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? "ok" : "degraded",
    database: states[mongoose.connection.readyState] || "unknown",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Give a clear message instead of hanging when MongoDB isn't connected
app.use("/api", (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: "Database not connected. Check MONGO_URI in backend/.env" });
  }
  next();
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/trackers", require("./routes/trackers"));
app.use("/api/sessions", require("./routes/sessions"));
app.use("/api/targets", require("./routes/targets"));
app.use("/api/stats", require("./routes/stats"));
app.use("/api/mcqs", require("./routes/mcqs"));

app.get("/", (req, res) => res.send("PrepTrek API is running"));

// Any error thrown in a route ends up here
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ message: "Something went wrong" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection failed:", err.message));
