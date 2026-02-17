const router = require("express").Router();
const { authenticateStore, requireRole } = require("../middleware/auth");
const {
  queryInTenantSchema,
  executeInTenantSchema,
} = require("../utils/tenantDb");
const prisma = require("../db");

// Create Sale (Main POS Transaction)
router.post("/", authenticateStore, async (req, res) => {
  try {
    const { items, paymentType } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items required" });
    }

    if (!["cash", "card"].includes(paymentType)) {
      return res.status(400).json({ error: "Invalid payment type" });
    }

    // Start transaction
    await executeInTenantSchema(req.schemaName, "BEGIN");

    try {
      let totalAmount = 0;
      const processedItems = [];

      // Process each item
      for (const item of items) {
        const { productId, input } = item; // input = quantity for piece, money for kg_price

        // Get product details
        const products = await queryInTenantSchema(
          req.schemaName,
          `SELECT * FROM products WHERE id = $1 AND is_active = true FOR UPDATE`,
          [productId],
        );

        if (products.length === 0) {
          throw new Error(`Product ${productId} not found`);
        }

        const product = products[0];
        let quantity, totalPrice, profit;

        if (product.type === "piece") {
          // Piece: input is quantity
          quantity = input;
          totalPrice = quantity * parseFloat(product.sale_price);
          profit =
            (parseFloat(product.sale_price) -
              parseFloat(product.purchase_price)) *
            quantity;

          // Check stock
          if (parseFloat(product.quantity) < quantity) {
            throw new Error(`Insufficient stock for ${product.name}`);
          }
        } else if (product.type === "kg_price") {
          // Weight-based: input is money amount
          totalPrice = input;
          quantity = input / parseFloat(product.sale_price); // Calculate kg sold
          profit =
            (parseFloat(product.sale_price) -
              parseFloat(product.purchase_price)) *
            quantity;

          // Check stock
          if (parseFloat(product.quantity) < quantity) {
            throw new Error(`Insufficient stock for ${product.name}`);
          }
        }

        // Deduct stock
        await executeInTenantSchema(
          req.schemaName,
          `UPDATE products SET quantity = quantity - $1 WHERE id = $2`,
          [quantity, productId],
        );

        totalAmount += totalPrice;
        processedItems.push({
          productId,
          quantity,
          totalPrice,
          profit,
        });
      }

      // Create sale record
      const saleResult = await queryInTenantSchema(
        req.schemaName,
        `INSERT INTO sales (user_id, branch_id, total_amount, payment_type) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [req.user.id, req.user.branchId, totalAmount, paymentType],
      );

      const sale = saleResult[0];

      // Create sale items
      for (const item of processedItems) {
        await executeInTenantSchema(
          req.schemaName,
          `INSERT INTO sale_items (sale_id, product_id, quantity, total_price, profit) 
           VALUES ($1, $2, $3, $4, $5)`,
          [
            sale.id,
            item.productId,
            item.quantity,
            item.totalPrice,
            item.profit,
          ],
        );
      }

      // Commit transaction
      await executeInTenantSchema(req.schemaName, "COMMIT");

      res.json({
        message: "Sale completed",
        sale: {
          id: sale.id,
          totalAmount: sale.total_amount,
          paymentType: sale.payment_type,
          createdAt: sale.created_at,
        },
      });
    } catch (error) {
      // Rollback on error
      await executeInTenantSchema(req.schemaName, "ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Create sale error:", error);
    res.status(500).json({ error: error.message || "Failed to create sale" });
  }
});

// Get Sales (Admin only)
router.get("/", authenticateStore, requireRole("admin"), async (req, res) => {
  try {
    const { page = 1, limit = 50, branchId, from, to } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT s.*, u.full_name as cashier_name, b.name as branch_name
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN branches b ON s.branch_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (branchId) {
      params.push(branchId);
      query += ` AND s.branch_id = $${params.length}`;
    }

    if (from) {
      params.push(from);
      query += ` AND s.created_at >= $${params.length}`;
    }

    if (to) {
      params.push(to);
      query += ` AND s.created_at <= $${params.length}`;
    }

    query += ` ORDER BY s.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const sales = await queryInTenantSchema(req.schemaName, query, params);

    res.json({ sales });
  } catch (error) {
    console.error("Get sales error:", error);
    res.status(500).json({ error: "Failed to get sales" });
  }
});

// Get Sale Details
router.get(
  "/:id",
  authenticateStore,
  requireRole("admin"),
  async (req, res) => {
    try {
      const sales = await queryInTenantSchema(
        req.schemaName,
        `SELECT s.*, u.full_name as cashier_name, b.name as branch_name
       FROM sales s
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN branches b ON s.branch_id = b.id
       WHERE s.id = $1`,
        [req.params.id],
      );

      if (sales.length === 0) {
        return res.status(404).json({ error: "Sale not found" });
      }

      const items = await queryInTenantSchema(
        req.schemaName,
        `SELECT si.*, p.name as product_name, p.type as product_type
       FROM sale_items si
       LEFT JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = $1`,
        [req.params.id],
      );

      res.json({
        sale: sales[0],
        items,
      });
    } catch (error) {
      console.error("Get sale details error:", error);
      res.status(500).json({ error: "Failed to get sale details" });
    }
  },
);

module.exports = router;
