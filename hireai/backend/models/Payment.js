const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    user:         { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderId:      { type: String },
    paymentId:    { type: String },
    amount:       { type: Number },
    currency:     { type: String, default: "INR" },
    plan:         { type: String },
    creditsAdded: { type: Number, default: 0 },
    status:       { type: String, enum: ["created", "paid", "failed"], default: "created" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", PaymentSchema);
