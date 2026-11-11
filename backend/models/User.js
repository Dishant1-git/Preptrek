const mongoose = require("mongoose");

// Which dashboard widgets are shown and which chart type each uses
const defaultDashboard = [
  { key: "status", title: "Topic Status", chart: "pie", visible: true },
  { key: "daily", title: "Study Hours (this month)", chart: "bar", visible: true },
  { key: "monthly", title: "Topics Completed by Month", chart: "bar", visible: true },
  { key: "trackers", title: "Progress by Tracker", chart: "bar", visible: true },
  { key: "hoursByTracker", title: "Time per Tracker", chart: "pie", visible: true },
];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    domain: { type: String, required: true }, // e.g. JEE, NEET, UPSC, Web Development
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    dashboard: {
      type: [{ _id: false, key: String, title: String, chart: String, visible: Boolean }],
      default: defaultDashboard,
    },
  },
  { timestamps: true }
);

// Never send the password back to the client
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
