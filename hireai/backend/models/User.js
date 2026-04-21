const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    role:     { type: String, enum: ["hr", "admin"], default: "hr" },
    company:  { type: String, default: "" },
    phone:    { type: String, default: "" },
    credits:  { type: Number, default: 5 },
    plan:     { type: String, enum: ["free", "starter", "pro", "enterprise"], default: "free" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
