const router = require("express").Router();
const {
  hashPassword,
  verifyPassword,
  generateToken,
} = require("../utils/auth");
const { authenticateStore } = require("../middleware/auth");
const { queryInTenantSchema } = require("../utils/tenantDb");
const prisma = require("../db");

// Store User Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Find user across all tenant schemas
    const tenants = await prisma.tenant.findMany({
      where: {
        status: { in: ["active", "trial", "suspended"] },
      },
    });

    let foundUser = null;
    let foundTenant = null;

    for (const tenant of tenants) {
      const users = await queryInTenantSchema(
        tenant.schemaName,
        `SELECT * FROM users WHERE email = $1 LIMIT 1`,
        [email],
      );

      if (users.length > 0) {
        foundUser = users[0];
        foundTenant = tenant;
        break;
      }
    }

    if (!foundUser) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!foundUser.is_active) {
      return res.status(403).json({ error: "Account deactivated" });
    }

    const isValid = await verifyPassword(password, foundUser.password);

    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken({
      id: foundUser.id,
      tenantId: foundTenant.id,
      role: foundUser.role,
      branchId: foundUser.branch_id,
    });

    res.json({
      token,
      user: {
        id: foundUser.id,
        fullName: foundUser.full_name,
        email: foundUser.email,
        role: foundUser.role,
        branchId: foundUser.branch_id,
      },
      tenant: {
        id: foundTenant.id,
        storeName: foundTenant.storeName,
        status: foundTenant.status,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Get Current User
router.get("/me", authenticateStore, async (req, res) => {
  try {
    const users = await queryInTenantSchema(
      req.schemaName,
      `SELECT id, full_name, email, role, branch_id, is_active FROM users WHERE id = $1`,
      [req.user.id],
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: users[0],
      tenant: {
        id: req.tenant.id,
        storeName: req.tenant.storeName,
        status: req.tenant.status,
        suspended: req.storeSuspended || false,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

module.exports = router;
