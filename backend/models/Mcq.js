const mongoose = require("mongoose");

// A question the user adds for practice
const mcqSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tracker: { type: mongoose.Schema.Types.ObjectId, ref: "Tracker" }, // optional subject
    question: { type: String, required: true, trim: true },
    options: { type: [String], validate: (v) => v.length === 4 },
    answer: { type: Number, required: true, min: 0, max: 3 }, // index of the correct option
    explanation: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Mcq", mcqSchema);
