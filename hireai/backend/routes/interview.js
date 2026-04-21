const express   = require("express");
const router    = express.Router();
const crypto    = require("crypto");
const OpenAI    = require("openai");
const Interview = require("../models/Interview");
const Session   = require("../models/Session");
const User      = require("../models/User");
const { protect, hrOnly } = require("../middleware/auth");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── AI Helpers ────────────────────────────────────────────
async function generateQuestions({ jobTitle, jobDescription, skills, experienceLevel, numQuestions }) {
  const prompt = `You are a senior technical interviewer. Generate exactly ${numQuestions} interview questions.
Job Title: ${jobTitle}
Experience: ${experienceLevel}
Skills: ${(skills || []).join(", ")}
Job Description: ${jobDescription}
Rules: 50% technical, 25% behavioral, 25% situational. Return ONLY a JSON array (no markdown):
[{"text":"...","type":"technical","difficulty":"medium"}]`;
  try {
    const r = await openai.chat.completions.create({ model: "gpt-4o", messages: [{ role: "user", content: prompt }], temperature: 0.7 });
    return JSON.parse(r.choices[0].message.content.replace(/```json|```/g, "").trim());
  } catch {
    return [
      { text: "Tell me about yourself and your experience.", type: "behavioral", difficulty: "easy" },
      { text: `What is your experience with ${(skills||["this technology"])[0]}?`, type: "technical", difficulty: "medium" },
      { text: "Describe a challenging project you worked on.", type: "situational", difficulty: "medium" },
    ];
  }
}

async function evaluateAnswer(question, answer, type) {
  const prompt = `You are an expert ${type === "technical" ? "technical" : "HR"} interviewer.
Question: ${question}
Answer: ${answer}
Return ONLY valid JSON (no markdown): {"score":<1-10>,"feedback":"<2-3 sentences>"}`;
  try {
    const r = await openai.chat.completions.create({ model: "gpt-4o", messages: [{ role: "user", content: prompt }], temperature: 0.3 });
    return JSON.parse(r.choices[0].message.content.replace(/```json|```/g, "").trim());
  } catch {
    return { score: 5, feedback: "Auto-evaluation failed. Manual review needed." };
  }
}

async function generateSummary(jobTitle, answers, overall) {
  const text = answers.map((a, i) => `Q${i+1}: ${a.questionText}\nA: ${a.answerText}`).join("\n\n").substring(0, 3000);
  const prompt = `You are an HR analyst. Candidate interviewed for: ${jobTitle}. Overall Score: ${overall}/10\nTranscript:\n${text}\nReturn ONLY JSON: {"sentiment":"Confident|Calm|Nervous|Unsure","summary":"<3-4 sentences>","recommendation":"Strongly Recommend|Recommend|Maybe|Reject"}`;
  try {
    const r = await openai.chat.completions.create({ model: "gpt-4o", messages: [{ role: "user", content: prompt }], temperature: 0.4 });
    return JSON.parse(r.choices[0].message.content.replace(/```json|```/g, "").trim());
  } catch {
    return { sentiment: "Calm", summary: "AI summary unavailable. Please review manually.", recommendation: "Maybe" };
  }
}

// ═══════════════════════════════════════
// HR ROUTES
// ═══════════════════════════════════════

// Create interview
router.post("/create", protect, hrOnly, async (req, res) => {
  const { jobTitle, jobDescription, skills, experienceLevel, numQuestions = 8, settings } = req.body;
  try {
    const hr = await User.findById(req.user._id);
    if (hr.plan === "free" && hr.credits < 1)
      return res.status(403).json({ message: "No credits left. Buy more credits to create interviews." });

    const questions    = await generateQuestions({ jobTitle, jobDescription, skills, experienceLevel, numQuestions });
    const inviteToken  = crypto.randomBytes(20).toString("hex");

    const interview = await Interview.create({
      createdBy: req.user._id, jobTitle, jobDescription,
      skills: skills || [], experienceLevel, questions, inviteToken,
      settings: settings || {},
    });

    if (["free", "starter"].includes(hr.plan))
      await User.findByIdAndUpdate(req.user._id, { $inc: { credits: -1 } });

    res.status(201).json({
      message: "Interview created!",
      _id:         interview._id,
      jobTitle:    interview.jobTitle,
      inviteToken: inviteToken,
      inviteLink:  `${process.env.FRONTEND_URL}/interview/${inviteToken}`,
      questionsCount: questions.length,
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Get all interviews for HR
router.get("/", protect, hrOnly, async (req, res) => {
  try {
    const interviews = await Interview.find({ createdBy: req.user._id }).sort({ createdAt: -1 }).select("-questions");
    res.json(interviews);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Get one interview + its sessions
router.get("/:id", protect, hrOnly, async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!interview) return res.status(404).json({ message: "Not found." });
    const sessions = await Session.find({ interview: req.params.id }).sort({ createdAt: -1 });
    res.json({ interview, sessions });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Update status
router.put("/:id/status", protect, hrOnly, async (req, res) => {
  try {
    const interview = await Interview.findOneAndUpdate({ _id: req.params.id, createdBy: req.user._id }, { status: req.body.status }, { new: true });
    res.json({ message: "Updated", interview });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Delete
router.delete("/:id", protect, hrOnly, async (req, res) => {
  try {
    await Interview.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    await Session.deleteMany({ interview: req.params.id });
    res.json({ message: "Deleted." });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Shortlist candidate
router.put("/session/:id/shortlist", protect, hrOnly, async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(req.params.id, { shortlisted: req.body.shortlisted, hrNotes: req.body.hrNotes }, { new: true });
    res.json({ message: req.body.shortlisted ? "Shortlisted!" : "Removed from shortlist.", session });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ═══════════════════════════════════════
// CANDIDATE ROUTES (no auth)
// ═══════════════════════════════════════

// Join by token
router.get("/join/:token", async (req, res) => {
  try {
    const interview = await Interview.findOne({ inviteToken: req.params.token, status: "active" })
      .select("jobTitle skills experienceLevel questions settings _id");
    if (!interview) return res.status(404).json({ message: "Interview link is invalid or has been closed." });
    res.json(interview);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Start session
router.post("/session/start", async (req, res) => {
  const { interviewId, candidateName, candidateEmail } = req.body;
  try {
    if (!candidateName || !candidateEmail) return res.status(400).json({ message: "Name and email required." });
    const iv = await Interview.findById(interviewId);
    if (!iv || iv.status !== "active") return res.status(400).json({ message: "Interview not available." });
    const session = await Session.create({ interview: interviewId, candidate: { name: candidateName, email: candidateEmail } });
    await Interview.findByIdAndUpdate(interviewId, { $inc: { totalAttempts: 1 } });
    res.status(201).json({ sessionId: session._id });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Submit answer
router.post("/session/answer", async (req, res) => {
  const { sessionId, questionIndex, questionText, questionType, answerText, timeTaken } = req.body;
  try {
    if (!answerText?.trim()) return res.status(400).json({ message: "Answer cannot be empty." });
    const { score, feedback } = await evaluateAnswer(questionText, answerText, questionType);
    await Session.findByIdAndUpdate(sessionId, {
      $push: { answers: { questionIndex, questionText, questionType, answerText, aiScore: score, aiFeedback: feedback, timeTaken } },
    });
    req.app.get("io")?.to(sessionId.toString()).emit("answer-evaluated", { questionIndex, score, feedback });
    res.json({ score, feedback });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Anti-cheat event
router.post("/session/anticheat", async (req, res) => {
  const map = { tabSwitch: "antiCheat.tabSwitches", faceNotDetected: "antiCheat.faceNotDetected", multipleFaces: "antiCheat.multiplePersons" };
  try {
    if (map[req.body.event]) await Session.findByIdAndUpdate(req.body.sessionId, { $inc: { [map[req.body.event]]: 1 } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Complete session
router.post("/session/complete", async (req, res) => {
  const { sessionId, duration } = req.body;
  try {
    const session = await Session.findById(sessionId).populate("interview", "jobTitle");
    const scores  = session.answers.map(a => a.aiScore).filter(Boolean);
    const overall = scores.length ? +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;
    const techQ   = session.answers.filter(a => a.questionType === "technical");
    const techScore = techQ.length ? +(techQ.map(a => a.aiScore).reduce((a, b) => a + b, 0) / techQ.length).toFixed(1) : overall;
    const summary = await generateSummary(session.interview?.jobTitle || "Unknown", session.answers, overall);
    await Session.findByIdAndUpdate(sessionId, {
      status: "completed", duration: duration || 0,
      "scores.overall":       overall,
      "scores.technical":     techScore,
      "scores.communication": Math.min(10, +(overall * 0.9 + Math.random() * 0.8).toFixed(1)),
      "scores.confidence":    Math.min(10, +(overall * 0.88 + Math.random()).toFixed(1)),
      sentiment:      summary.sentiment,
      aiSummary:      summary.summary,
      recommendation: summary.recommendation,
    });
    res.json({ message: "Interview completed!", overall, sentiment: summary.sentiment });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Get session (for results page)
router.get("/session/:id", protect, async (req, res) => {
  try {
    const s = await Session.findById(req.params.id).populate("interview", "jobTitle jobDescription skills");
    if (!s) return res.status(404).json({ message: "Not found." });
    res.json(s);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
