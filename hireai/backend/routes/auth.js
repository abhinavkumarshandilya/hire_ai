const express = require("express");
const router  = express.Router();
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const User    = require("../models/User");
const { protect } = require("../middleware/auth");

const makeToken = (u) => jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
const safe      = (u) => ({ _id: u._id, name: u.name, email: u.email, role: u.role, company: u.company, credits: u.credits, plan: u.plan });

// Register
router.post("/register", async (req, res) => {
  const { name, email, password, company } = req.body;
  try {
    if (!name || !email || !password) return res.status(400).json({ message: "All fields required." });
    if (await User.findOne({ email })) return res.status(400).json({ message: "Email already registered." });
    const hashed = await bcrypt.hash(password, 12);
    const user   = await User.create({ name, email, password: hashed, company });
    res.status(201).json({ token: makeToken(user), user: safe(user) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ message: "Invalid email or password." });
    res.json({ token: makeToken(user), user: safe(user) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Get Me
router.get("/me", protect, (req, res) => res.json(safe(req.user)));

// Update Profile
router.put("/profile", protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, { name: req.body.name, company: req.body.company, phone: req.body.phone }, { new: true }).select("-password");
    res.json({ message: "Profile updated!", user: safe(user) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
