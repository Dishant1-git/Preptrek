const mongoose = require("mongoose");

// A tracker is anything the user wants to follow: a subject, a book, a course...
// Each tracker holds a list of topics (the syllabus).
const topicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  status: { type: String, enum: ["todo", "in-progress", "done"], default: "todo" },
  dueDate: Date,
  completedAt: Date,
});

const trackerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: "#6B4FA8" },
    topics: [topicSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tracker", trackerSchema);
