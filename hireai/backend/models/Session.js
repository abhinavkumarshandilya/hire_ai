const mongoose = require("mongoose");

const AnswerSchema = new mongoose.Schema({
  questionIndex: Number,
  questionText:  String,
  questionType:  String,
  answerText:    String,
  aiScore:       { type: Number, min: 0, max: 10, default: 0 },
  aiFeedback:    { type: String, default: "" },
  timeTaken:     { type: Number, default: 0 },
});

const SessionSchema = new mongoose.Schema(
  {
    interview: { type: mongoose.Schema.Types.ObjectId, ref: "Interview", required: true },
    candidate: {
      name:  { type: String, required: true },
      email: { type: String, required: true },
    },
    answers: [AnswerSchema],
    scores: {
      overall:       { type: Number, default: 0 },
      technical:     { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
      confidence:    { type: Number, default: 0 },
    },
    sentiment:      { type: String, enum: ["Confident", "Calm", "Nervous", "Unsure"], default: "Calm" },
    status:         { type: String, enum: ["in-progress", "completed", "abandoned"], default: "in-progress" },
    aiSummary:      { type: String, default: "" },
    recommendation: { type: String, enum: ["Strongly Recommend", "Recommend", "Maybe", "Reject"], default: "Maybe" },
    shortlisted:    { type: Boolean, default: false },
    hrNotes:        { type: String, default: "" },
    duration:       { type: Number, default: 0 },
    antiCheat: {
      tabSwitches:     { type: Number, default: 0 },
      faceNotDetected: { type: Number, default: 0 },
      multiplePersons: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", SessionSchema);
