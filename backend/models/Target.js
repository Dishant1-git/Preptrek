const mongoose = require("mongoose");

// A goal like "finish 30 topics by 1 Dec" or "study 50 hours by 1 Dec"
const targetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    type: { type: String, enum: ["topics", "hours"], required: true },
    goal: { type: Number, required: true, min: 1 },
    tracker: { type: mongoose.Schema.Types.ObjectId, ref: "Tracker" }, // optional: limit to one tracker
    deadline: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Target", targetSchema);
