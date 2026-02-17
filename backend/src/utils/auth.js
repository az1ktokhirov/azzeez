const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SALT_ROUNDS = 12;

// Hash password
const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

// Verify password
const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Generate Store User JWT
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "8h" });
};

// Generate Super Admin JWT
const generateSuperToken = (payload) => {
  return jwt.sign(payload, process.env.SUPER_JWT_SECRET, { expiresIn: "8h" });
};

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  generateSuperToken,
};
