const express  = require("express");
const router   = express.Router();
const crypto   = require("crypto");
const Razorpay = require("razorpay");
const Payment  = require("../models/Payment");
const User     = require("../models/User");
const { protect } = require("../middleware/auth");

const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });

const PLANS = {
  starter: { amount: 99900,  credits: 20,    plan: "starter", label: "Starter" },
  pro:     { amount: 299900, credits: 99999,  plan: "pro",     label: "Professional" },
};

// Create Razorpay order
router.post("/create-order", protect, async (req, res) => {
  const plan = PLANS[req.body.planId];
  if (!plan) return res.status(400).json({ message: "Invalid plan." });
  try {
    const order = await razorpay.orders.create({ amount: plan.amount, currency: "INR", receipt: `hireai_${Date.now()}`, notes: { userId: req.user._id.toString(), planId: req.body.planId } });
    await Payment.create({ user: req.user._id, orderId: order.id, amount: plan.amount, plan: req.body.planId });
    res.json({ orderId: order.id, amount: plan.amount, currency: "INR", keyId: process.env.RAZORPAY_KEY_ID, planLabel: plan.label });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Verify payment
router.post("/verify", protect, async (req, res) => {
  const { orderId, paymentId, signature, planId } = req.body;
  const plan = PLANS[planId];
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
  if (expected !== signature) return res.status(400).json({ message: "Payment verification failed!" });
  try {
    await Payment.findOneAndUpdate({ orderId }, { paymentId, status: "paid", creditsAdded: plan.credits });
    const user = await User.findByIdAndUpdate(req.user._id, { $inc: { credits: plan.credits }, plan: plan.plan }, { new: true });
    res.json({ message: `Payment successful! Credits added.`, credits: user.credits, plan: user.plan });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Razorpay webhook (backup)
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["x-razorpay-signature"];
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(req.body).digest("hex");
  if (sig !== expected) return res.status(400).send("Invalid");
  try {
    const event = JSON.parse(req.body.toString());
    if (event.event === "payment.captured") {
      const { order_id, id: payment_id, notes } = event.payload.payment.entity;
      const plan = PLANS[notes?.planId];
      if (plan && notes?.userId) {
        await Payment.findOneAndUpdate({ orderId: order_id }, { paymentId: payment_id, status: "paid", creditsAdded: plan.credits });
        await User.findByIdAndUpdate(notes.userId, { $inc: { credits: plan.credits }, plan: plan.plan });
      }
    }
    res.json({ received: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Payment history
router.get("/history", protect, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id, status: "paid" }).sort({ createdAt: -1 });
    res.json(payments);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
