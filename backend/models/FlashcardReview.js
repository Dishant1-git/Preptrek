const mongoose = require("mongoose");

// One finished flashcard review round and its result
const flashcardReviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tracker: { type: mongoose.Schema.Types.ObjectId, ref: "Tracker" }, // subject reviewed (empty = all)
    total: Number,
    known: Number,
    unknown: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("FlashcardReview", flashcardReviewSchema);
