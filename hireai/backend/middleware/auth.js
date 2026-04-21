const jwt  = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : null;
  if (!token) return res.status(401).json({ message: "No token. Access denied." });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ message: "User not found." });
    next();
  } catch {
    res.status(401).json({ message: "Token invalid or expired. Please login again." });
  }
};

const hrOnly = (req, res, next) => {
  if (!["hr", "admin"].includes(req.user?.role))
    return res.status(403).json({ message: "HR access only." });
  next();
};

module.exports = { protect, hrOnly };
