const router = require("express").Router();
const {
  hashPassword,
  verifyPassword,
  generateSuperToken,
} = require("../utils/auth");
const { authenticateSuperAdmin } = require("../middleware/auth");
const {
  createTenantSchema,
  queryInTenantSchema,
} = require("../utils/tenantDb");
const prisma = require("../db");

// Super Admin Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email },
    });

    if (!superAdmin || !superAdmin.isActive) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await verifyPassword(password, superAdmin.password);

    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateSuperToken({
      id: superAdmin.id,
      email: superAdmin.email,
    });

    res.json({
      token,
      superAdmin: {
        id: superAdmin.id,
        fullName: superAdmin.fullName,
        email: superAdmin.email,
      },
    });
  } catch (error) {
    console.error("Super admin login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Get All Stores
router.get("/stores", authenticateSuperAdmin, async (req, res) => {
  try {
    const stores = await prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json({ stores });
  } catch (error) {
    console.error("Get stores error:", error);
    res.status(500).json({ error: "Failed to get stores" });
  }
});

// Register New Store
router.post("/stores", authenticateSuperAdmin, async (req, res) => {
  try {
    const {
      storeName,
      ownerEmail,
      ownerPassword,
      ownerName,
      trialDays = 14,
    } = req.body;

    if (!storeName || !ownerEmail || !ownerPassword || !ownerName) {
      return res.status(400).json({ error: "All fields required" });
    }

    // Check if email exists
    const existing = await prisma.tenant.findUnique({
      where: { ownerEmail },
    });

    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        storeName,
        ownerEmail,
        schemaName: `store_${Date.now()}`,
        status: "trial",
        trialEndsAt: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000),
      },
    });

    // Create schema
    await createTenantSchema(tenant.schemaName);

    // Create default branch
    await queryInTenantSchema(
      tenant.schemaName,
      `INSERT INTO branches (name, address) VALUES ($1, $2)`,
      ["Main Branch", "Default"],
    );

    // Create owner admin account
    const hashedPassword = await hashPassword(ownerPassword);
    await queryInTenantSchema(
      tenant.schemaName,
      `INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, $4)`,
      [ownerName, ownerEmail, hashedPassword, "admin"],
    );

    res.json({
      message: "Store created successfully",
      tenant: {
        id: tenant.id,
        storeName: tenant.storeName,
        status: tenant.status,
        trialEndsAt: tenant.trialEndsAt,
      },
    });
  } catch (error) {
    console.error("Create store error:", error);
    res.status(500).json({ error: "Failed to create store" });
  }
});

// Get Store Details
router.get("/stores/:id", authenticateSuperAdmin, async (req, res) => {
  try {
    const tenantId = parseInt(req.params.id);

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return res.status(404).json({ error: "Store not found" });
    }

    // Get store stats
    const userCount = await queryInTenantSchema(
      tenant.schemaName,
      `SELECT COUNT(*) as count FROM users`,
    );

    const salesCount = await queryInTenantSchema(
      tenant.schemaName,
      `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM sales`,
    );

    const productCount = await queryInTenantSchema(
      tenant.schemaName,
      `SELECT COUNT(*) as count FROM products WHERE is_active = true`,
    );

    res.json({
      tenant,
      stats: {
        users: userCount[0].count,
        sales: salesCount[0].count,
        totalRevenue: salesCount[0].total,
        products: productCount[0].count,
      },
    });
  } catch (error) {
    console.error("Get store details error:", error);
    res.status(500).json({ error: "Failed to get store details" });
  }
});

// Update Store Status
router.patch("/stores/:id/status", authenticateSuperAdmin, async (req, res) => {
  try {
    const tenantId = parseInt(req.params.id);
    const { status, trialDays } = req.body;

    if (
      !status ||
      !["active", "suspended", "trial", "deleted"].includes(status)
    ) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updateData = { status };

    if (status === "trial" && trialDays) {
      updateData.trialEndsAt = new Date(
        Date.now() + trialDays * 24 * 60 * 60 * 1000,
      );
    }

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
    });

    res.json({
      message: "Store status updated",
      tenant,
    });
  } catch (error) {
    console.error("Update store status error:", error);
    res.status(500).json({ error: "Failed to update store status" });
  }
});

// Send Announcement
router.post("/announce", authenticateSuperAdmin, async (req, res) => {
  try {
    const { title, message, tenantId } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: "Title and message required" });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        message,
        tenantId: tenantId || null, // null = all stores
      },
    });

    res.json({
      message: "Announcement sent",
      announcement,
    });
  } catch (error) {
    console.error("Send announcement error:", error);
    res.status(500).json({ error: "Failed to send announcement" });
  }
});

// Get Platform Analytics
router.get("/analytics", authenticateSuperAdmin, async (req, res) => {
  try {
    const totalStores = await prisma.tenant.count();
    const activeStores = await prisma.tenant.count({
      where: { status: { in: ["active", "trial"] } },
    });
    const suspendedStores = await prisma.tenant.count({
      where: { status: "suspended" },
    });
    const trialStores = await prisma.tenant.count({
      where: { status: "trial" },
    });

    // Get recent signups (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSignups = await prisma.tenant.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Get expiring trials (next 3 days)
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const expiringTrials = await prisma.tenant.count({
      where: {
        status: "trial",
        trialEndsAt: {
          lte: threeDaysFromNow,
          gte: new Date(),
        },
      },
    });

    res.json({
      totalStores,
      activeStores,
      suspendedStores,
      trialStores,
      recentSignups,
      expiringTrials,
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    res.status(500).json({ error: "Failed to get analytics" });
  }
});

module.exports = router;
