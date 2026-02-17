const router = require("express").Router();
const { authenticateStore, requireRole } = require("../middleware/auth");
const {
  queryInTenantSchema,
  executeInTenantSchema,
} = require("../utils/tenantDb");

// Get All Categories
router.get("/", authenticateStore, async (req, res) => {
  try {
    const categories = await queryInTenantSchema(
      req.schemaName,
      `SELECT * FROM categories ORDER BY name`,
    );

    res.json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ error: "Failed to get categories" });
  }
});

// Create Category
router.post("/", authenticateStore, requireRole("admin"), async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name required" });
    }

    const result = await queryInTenantSchema(
      req.schemaName,
      `INSERT INTO categories (name) VALUES ($1) RETURNING *`,
      [name],
    );

    res.json({
      message: "Category created",
      category: result[0],
    });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
});

// Update Category
router.put(
  "/:id",
  authenticateStore,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { name } = req.body;

      const result = await queryInTenantSchema(
        req.schemaName,
        `UPDATE categories SET name = $1 WHERE id = $2 RETURNING *`,
        [name, req.params.id],
      );

      if (result.length === 0) {
        return res.status(404).json({ error: "Category not found" });
      }

      res.json({
        message: "Category updated",
        category: result[0],
      });
    } catch (error) {
      console.error("Update category error:", error);
      res.status(500).json({ error: "Failed to update category" });
    }
  },
);

// Delete Category
router.delete(
  "/:id",
  authenticateStore,
  requireRole("admin"),
  async (req, res) => {
    try {
      await executeInTenantSchema(
        req.schemaName,
        `DELETE FROM categories WHERE id = $1`,
        [req.params.id],
      );

      res.json({ message: "Category deleted" });
    } catch (error) {
      console.error("Delete category error:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  },
);

module.exports = router;
