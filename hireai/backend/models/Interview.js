const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  text:       { type: String, required: true },
  type:       { type: String, enum: ["technical", "behavioral", "situational"], default: "technical" },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
});

const InterviewSchema = new mongoose.Schema(
  {
    createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    jobTitle:        { type: String, required: true },
    jobDescription:  { type: String, required: true },
    skills:          [String],
    experienceLevel: { type: String, enum: ["fresher", "mid", "senior"], default: "mid" },
    questions:       [QuestionSchema],
    inviteToken:     { type: String, unique: true },
    status:          { type: String, enum: ["active", "paused", "closed"], default: "active" },
    totalAttempts:   { type: Number, default: 0 },
    settings: {
      timePerQuestion:      { type: Number, default: 120 },
      enableProctoring:     { type: Boolean, default: true },
      showScoreToCandidate: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Interview", InterviewSchema);
