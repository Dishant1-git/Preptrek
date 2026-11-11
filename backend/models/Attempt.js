const mongoose = require("mongoose");

// One finished MCQ test and how it went
const attemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    marking: { name: String, correct: Number, wrong: Number }, // e.g. +4 / -1
    correct: Number,
    wrong: Number,
    skipped: Number,
    score: Number,
    maxScore: Number,
    answers: [
      {
        _id: false,
        mcq: { type: mongoose.Schema.Types.ObjectId, ref: "Mcq" },
        chosen: Number, // null = not attempted
        correctAnswer: Number,
        isCorrect: Boolean,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attempt", attemptSchema);
