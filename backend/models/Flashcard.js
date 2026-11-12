const mongoose = require("mongoose");

// A flashcard: question on the front, answer on the back
const flashcardSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tracker: { type: mongoose.Schema.Types.ObjectId, ref: "Tracker" }, // subject (optional)
    front: { type: String, required: true, trim: true },
    back: { type: String, required: true, trim: true },
    known: { type: Number, default: 0 }, // times marked "Got it"
    unknown: { type: Number, default: 0 }, // times marked "Didn't know"
    lastResult: { type: String, enum: ["known", "unknown"] },
    lastReviewedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Flashcard", flashcardSchema);
