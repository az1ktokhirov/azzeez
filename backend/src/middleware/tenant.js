const prisma = require("../db");

// Set search_path to tenant schema for all queries
const setTenantSchema = async (req, res, next) => {
  if (!req.schemaName) {
    return next();
  }

  try {
    // Set the search_path for this connection
    await prisma.$executeRawUnsafe(
      `SET search_path TO ${req.schemaName}, public`,
    );
    next();
  } catch (error) {
    console.error("Error setting tenant schema:", error);
    return res.status(500).json({ error: "Database error" });
  }
};

module.exports = { setTenantSchema };
