const router = require("express").Router();
const { authenticateStore, requireRole } = require("../middleware/auth");
const {
  queryInTenantSchema,
  executeInTenantSchema,
} = require("../utils/tenantDb");
const { hashPassword } = require("../utils/auth");

// Get All Users (Cashiers)
router.get("/", authenticateStore, requireRole("admin"), async (req, res) => {
  try {
    const users = await queryInTenantSchema(
      req.schemaName,
      `SELECT u.id, u.full_name, u.email, u.role, u.branch_id, u.is_active, u.created_at,
              b.name as branch_name
       FROM users u
       LEFT JOIN branches b ON u.branch_id = b.id
       ORDER BY u.created_at DESC`,
    );

    res.json({ users });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Failed to get users" });
  }
});

// Create User (Cashier)
router.post("/", authenticateStore, requireRole("admin"), async (req, res) => {
  try {
    const { fullName, email, password, role, branchId } = req.body;

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ error: "All fields required" });
    }

    if (!["admin", "cashier"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    if (role === "cashier" && !branchId) {
      return res.status(400).json({ error: "Branch required for cashier" });
    }

    // Check if email exists
    const existing = await queryInTenantSchema(
      req.schemaName,
      `SELECT id FROM users WHERE email = $1`,
      [email],
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const hashedPassword = await hashPassword(password);

    // Convert branchId to integer if it exists
    const branchIdInt = branchId ? parseInt(branchId, 10) : null;

    const result = await queryInTenantSchema(
      req.schemaName,
      `INSERT INTO users (full_name, email, password, role, branch_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, full_name, email, role, branch_id, is_active`,
      [fullName, email, hashedPassword, role, branchIdInt],
    );

    res.json({
      message: "User created",
      user: result[0],
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Update User
router.put(
  "/:id",
  authenticateStore,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { fullName, email, role, branchId, password } = req.body;

      let query = `UPDATE users SET full_name = $1, email = $2, role = $3, branch_id = $4`;
      const params = [fullName, email, role, branchId];

      if (password) {
        const hashedPassword = await hashPassword(password);
        params.push(hashedPassword);
        query += `, password = $${params.length}`;
      }

      params.push(req.params.id);
      query += ` WHERE id = $${params.length} RETURNING id, full_name, email, role, branch_id, is_active`;

      const result = await queryInTenantSchema(req.schemaName, query, params);

      if (result.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        message: "User updated",
        user: result[0],
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  },
);

// Toggle User Active Status
router.patch(
  "/:id/toggle",
  authenticateStore,
  requireRole("admin"),
  async (req, res) => {
    try {
      const result = await queryInTenantSchema(
        req.schemaName,
        `UPDATE users SET is_active = NOT is_active WHERE id = $1 
       RETURNING id, full_name, is_active`,
        [req.params.id],
      );

      if (result.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        message: result[0].is_active ? "User activated" : "User deactivated",
        user: result[0],
      });
    } catch (error) {
      console.error("Toggle user error:", error);
      res.status(500).json({ error: "Failed to toggle user status" });
    }
  },
);

// Delete User
router.delete(
  "/:id",
  authenticateStore,
  requireRole("admin"),
  async (req, res) => {
    try {
      // Prevent deleting self
      if (parseInt(req.params.id) === req.user.id) {
        return res
          .status(400)
          .json({ error: "Cannot delete your own account" });
      }

      await executeInTenantSchema(
        req.schemaName,
        `DELETE FROM users WHERE id = $1`,
        [req.params.id],
      );

      res.json({ message: "User deleted" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  },
);

module.exports = router;
