const router = require("express").Router();
const { authenticateStore, requireRole } = require("../middleware/auth");
const {
  queryInTenantSchema,
  executeInTenantSchema,
} = require("../utils/tenantDb");

// Get All Products
router.get("/", authenticateStore, async (req, res) => {
  try {
    const { categoryId, search } = req.query;

    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.is_active = true
    `;
    const params = [];

    if (categoryId) {
      params.push(categoryId);
      query += ` AND p.category_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND p.name ILIKE $${params.length}`;
    }

    query += ` ORDER BY p.name`;

    const products = await queryInTenantSchema(req.schemaName, query, params);

    res.json({ products });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ error: "Failed to get products" });
  }
});

// Get Single Product
router.get("/:id", authenticateStore, async (req, res) => {
  try {
    const products = await queryInTenantSchema(
      req.schemaName,
      `SELECT p.*, c.name as category_name FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = $1`,
      [req.params.id],
    );

    if (products.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ product: products[0] });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({ error: "Failed to get product" });
  }
});

// Create Product
router.post("/", authenticateStore, requireRole("admin"), async (req, res) => {
  try {
    const {
      name,
      categoryId,
      type,
      purchasePrice,
      salePrice,
      quantity,
      minQuantity,
    } = req.body;

    if (!name || !type || !purchasePrice || !salePrice) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    if (!["piece", "kg_price"].includes(type)) {
      return res.status(400).json({ error: "Invalid product type" });
    }

    const result = await queryInTenantSchema(
      req.schemaName,
      `INSERT INTO products (name, category_id, type, purchase_price, sale_price, quantity, min_quantity) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        name,
        categoryId || null,
        type,
        purchasePrice,
        salePrice,
        quantity || 0,
        minQuantity || 0,
      ],
    );

    res.json({
      message: "Product created",
      product: result[0],
    });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// Update Product
router.put(
  "/:id",
  authenticateStore,
  requireRole("admin"),
  async (req, res) => {
    try {
      const {
        name,
        categoryId,
        type,
        purchasePrice,
        salePrice,
        quantity,
        minQuantity,
      } = req.body;

      const result = await queryInTenantSchema(
        req.schemaName,
        `UPDATE products 
       SET name = $1, category_id = $2, type = $3, purchase_price = $4, 
           sale_price = $5, quantity = $6, min_quantity = $7
       WHERE id = $8
       RETURNING *`,
        [
          name,
          categoryId,
          type,
          purchasePrice,
          salePrice,
          quantity,
          minQuantity,
          req.params.id,
        ],
      );

      if (result.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json({
        message: "Product updated",
        product: result[0],
      });
    } catch (error) {
      console.error("Update product error:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  },
);

// Restock Product
router.patch(
  "/:id/restock",
  authenticateStore,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { quantity } = req.body;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({ error: "Invalid quantity" });
      }

      const result = await queryInTenantSchema(
        req.schemaName,
        `UPDATE products SET quantity = quantity + $1 WHERE id = $2 RETURNING *`,
        [quantity, req.params.id],
      );

      if (result.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json({
        message: "Stock updated",
        product: result[0],
      });
    } catch (error) {
      console.error("Restock error:", error);
      res.status(500).json({ error: "Failed to restock product" });
    }
  },
);

// Delete Product (Soft Delete)
router.delete(
  "/:id",
  authenticateStore,
  requireRole("admin"),
  async (req, res) => {
    try {
      await executeInTenantSchema(
        req.schemaName,
        `UPDATE products SET is_active = false WHERE id = $1`,
        [req.params.id],
      );

      res.json({ message: "Product deleted" });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  },
);

module.exports = router;
