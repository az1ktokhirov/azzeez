require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: "Too many login attempts, please try again later",
});

app.use("/api/auth/login", authLimiter);
app.use("/api/super/login", authLimiter);

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/super", require("./routes/superAdmin"));
app.use("/api/products", require("./routes/products"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/sales", require("./routes/sales"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/branches", require("./routes/branches"));
app.use("/api/users", require("./routes/users"));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 GroceryOS API Server running on port ${PORT}`);
});
