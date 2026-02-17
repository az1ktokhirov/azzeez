const jwt = require("jsonwebtoken");
const prisma = require("../db");

// Verify Store User JWT
const authenticateStore = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check tenant status
    const tenant = await prisma.tenant.findUnique({
      where: { id: decoded.tenantId },
    });

    if (!tenant) {
      return res.status(403).json({ error: "Tenant not found" });
    }

    if (tenant.status === "deleted") {
      return res.status(403).json({ error: "Store access denied" });
    }

    if (tenant.status === "expired") {
      // Allow only export endpoint
      if (!req.path.includes("/export")) {
        return res.status(423).json({
          error: "Store subscription expired",
          allowExport: true,
        });
      }
    }

    // Check trial expiry
    if (tenant.status === "trial" && tenant.trialEndsAt < new Date()) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { status: "expired" },
      });
      return res.status(423).json({
        error: "Trial period expired",
        allowExport: true,
      });
    }

    // Attach user and tenant info
    req.user = decoded;
    req.tenant = tenant;
    req.schemaName = tenant.schemaName;

    // Add warning flag for suspended stores
    if (tenant.status === "suspended") {
      req.storeSuspended = true;
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Verify Super Admin JWT
const authenticateSuperAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.SUPER_JWT_SECRET);

    // Verify super admin exists and is active
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: decoded.id },
    });

    if (!superAdmin || !superAdmin.isActive) {
      return res.status(403).json({ error: "Access denied" });
    }

    req.superAdmin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Check role (for store users)
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};

module.exports = {
  authenticateStore,
  authenticateSuperAdmin,
  requireRole,
};
