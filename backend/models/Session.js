const mongoose = require("mongoose");

// One study session saved from the timer
const sessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tracker: { type: mongoose.Schema.Types.ObjectId, ref: "Tracker" },
  minutes: { type: Number, required: true, min: 1 },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Session", sessionSchema);
