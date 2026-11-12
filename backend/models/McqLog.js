const mongoose = require("mongoose");

// One block of MCQs the user practised (anywhere — book, app, mock test)
// and how it went, logged per subject.
const mcqLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tracker: { type: mongoose.Schema.Types.ObjectId, ref: "Tracker" }, // subject (optional)
    date: { type: Date, required: true, default: Date.now }, // when it was practised (date + time)
    total: { type: Number, required: true, min: 1 },
    correct: { type: Number, required: true, min: 0 },
    wrong: { type: Number, required: true, min: 0 },
    skipped: { type: Number, required: true, min: 0 }, // total - correct - wrong
    marking: { name: String, correct: Number, wrong: Number }, // e.g. +4 / -1
    score: Number,
    maxScore: Number,
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("McqLog", mcqLogSchema);
