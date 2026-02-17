const router = require("express").Router();
const { authenticateStore, requireRole } = require("../middleware/auth");
const {
  queryInTenantSchema,
  executeInTenantSchema,
} = require("../utils/tenantDb");

// Get All Branches
router.get("/", authenticateStore, requireRole("admin"), async (req, res) => {
  try {
    const branches = await queryInTenantSchema(
      req.schemaName,
      `SELECT * FROM branches ORDER BY name`,
    );

    res.json({ branches });
  } catch (error) {
    console.error("Get branches error:", error);
    res.status(500).json({ error: "Failed to get branches" });
  }
});

// Create Branch
router.post("/", authenticateStore, requireRole("admin"), async (req, res) => {
  try {
    const { name, address } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name required" });
    }

    const result = await queryInTenantSchema(
      req.schemaName,
      `INSERT INTO branches (name, address) VALUES ($1, $2) RETURNING *`,
      [name, address || ""],
    );

    res.json({
      message: "Branch created",
      branch: result[0],
    });
  } catch (error) {
    console.error("Create branch error:", error);
    res.status(500).json({ error: "Failed to create branch" });
  }
});

// Update Branch
router.put(
  "/:id",
  authenticateStore,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { name, address, isActive } = req.body;

      const result = await queryInTenantSchema(
        req.schemaName,
        `UPDATE branches SET name = $1, address = $2, is_active = $3 WHERE id = $4 RETURNING *`,
        [name, address, isActive, req.params.id],
      );

      if (result.length === 0) {
        return res.status(404).json({ error: "Branch not found" });
      }

      res.json({
        message: "Branch updated",
        branch: result[0],
      });
    } catch (error) {
      console.error("Update branch error:", error);
      res.status(500).json({ error: "Failed to update branch" });
    }
  },
);

// Delete Branch
router.delete(
  "/:id",
  authenticateStore,
  requireRole("admin"),
  async (req, res) => {
    try {
      await executeInTenantSchema(
        req.schemaName,
        `DELETE FROM branches WHERE id = $1`,
        [req.params.id],
      );

      res.json({ message: "Branch deleted" });
    } catch (error) {
      console.error("Delete branch error:", error);
      res.status(500).json({ error: "Failed to delete branch" });
    }
  },
);

module.exports = router;
