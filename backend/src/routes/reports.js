const router = require("express").Router();
const { authenticateStore, requireRole } = require("../middleware/auth");
const { queryInTenantSchema } = require("../utils/tenantDb");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

// Get Summary KPIs
router.get(
  "/summary",
  authenticateStore,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { from, to, branchId } = req.query;

      let dateFilter = "";
      let branchFilter = "";
      const params = [];

      if (from) {
        params.push(from);
        dateFilter += ` AND created_at >= $${params.length}`;
      }

      if (to) {
        params.push(to);
        dateFilter += ` AND created_at <= $${params.length}`;
      }

      if (branchId) {
        params.push(branchId);
        branchFilter = ` AND branch_id = $${params.length}`;
      }

      // Total revenue and sales count
      const salesData = await queryInTenantSchema(
        req.schemaName,
        `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue 
       FROM sales WHERE 1=1 ${dateFilter} ${branchFilter}`,
      );

      // Total profit
      const profitData = await queryInTenantSchema(
        req.schemaName,
        `SELECT COALESCE(SUM(si.profit), 0) as profit 
       FROM sale_items si 
       JOIN sales s ON si.sale_id = s.id 
       WHERE 1=1 ${dateFilter} ${branchFilter}`,
      );

      // Low stock products count
      const lowStock = await queryInTenantSchema(
        req.schemaName,
        `SELECT COUNT(*) as count FROM products 
       WHERE quantity <= min_quantity AND is_active = true`,
      );

      res.json({
        salesCount: salesData[0].count,
        revenue: salesData[0].revenue,
        profit: profitData[0].profit,
        lowStockCount: lowStock[0].count,
      });
    } catch (error) {
      console.error("Get summary error:", error);
      res.status(500).json({ error: "Failed to get summary" });
    }
  },
);

// Get Top Products
router.get(
  "/top-products",
  authenticateStore,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { limit = 5, from, to } = req.query;

      let dateFilter = "";
      const params = [];

      if (from) {
        params.push(from);
        dateFilter += ` AND s.created_at >= $${params.length}`;
      }

      if (to) {
        params.push(to);
        dateFilter += ` AND s.created_at <= $${params.length}`;
      }

      params.push(limit);

      const products = await queryInTenantSchema(
        req.schemaName,
        `SELECT p.name, SUM(si.total_price) as revenue, SUM(si.quantity) as quantity_sold
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       JOIN products p ON si.product_id = p.id
       WHERE 1=1 ${dateFilter}
       GROUP BY p.id, p.name
       ORDER BY revenue DESC
       LIMIT $${params.length}`,
        params,
      );

      res.json({ products });
    } catch (error) {
      console.error("Get top products error:", error);
      res.status(500).json({ error: "Failed to get top products" });
    }
  },
);

// Get Sales by Category
router.get(
  "/by-category",
  authenticateStore,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { from, to } = req.query;

      let dateFilter = "";
      const params = [];

      if (from) {
        params.push(from);
        dateFilter += ` AND s.created_at >= $${params.length}`;
      }

      if (to) {
        params.push(to);
        dateFilter += ` AND s.created_at <= $${params.length}`;
      }

      const categories = await queryInTenantSchema(
        req.schemaName,
        `SELECT c.name, COALESCE(SUM(si.total_price), 0) as revenue
       FROM categories c
       LEFT JOIN products p ON c.id = p.category_id
       LEFT JOIN sale_items si ON p.id = si.product_id
       LEFT JOIN sales s ON si.sale_id = s.id
       WHERE 1=1 ${dateFilter}
       GROUP BY c.id, c.name
       ORDER BY revenue DESC`,
        params,
      );

      res.json({ categories });
    } catch (error) {
      console.error("Get by category error:", error);
      res.status(500).json({ error: "Failed to get category report" });
    }
  },
);

// Get Sales by Cashier
router.get(
  "/by-cashier",
  authenticateStore,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { from, to } = req.query;

      let dateFilter = "";
      const params = [];

      if (from) {
        params.push(from);
        dateFilter += ` AND created_at >= $${params.length}`;
      }

      if (to) {
        params.push(to);
        dateFilter += ` AND created_at <= $${params.length}`;
      }

      const cashiers = await queryInTenantSchema(
        req.schemaName,
        `SELECT u.full_name, COUNT(s.id) as sales_count, SUM(s.total_amount) as revenue
       FROM users u
       LEFT JOIN sales s ON u.id = s.user_id ${dateFilter ? "AND 1=1" + dateFilter : ""}
       WHERE u.role = 'cashier'
       GROUP BY u.id, u.full_name
       ORDER BY revenue DESC`,
        params,
      );

      res.json({ cashiers });
    } catch (error) {
      console.error("Get by cashier error:", error);
      res.status(500).json({ error: "Failed to get cashier report" });
    }
  },
);

// Get Sales by Branch
router.get(
  "/by-branch",
  authenticateStore,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { from, to } = req.query;

      let dateFilter = "";
      const params = [];

      if (from) {
        params.push(from);
        dateFilter += ` AND created_at >= $${params.length}`;
      }

      if (to) {
        params.push(to);
        dateFilter += ` AND created_at <= $${params.length}`;
      }

      const branches = await queryInTenantSchema(
        req.schemaName,
        `SELECT b.name, COUNT(s.id) as sales_count, COALESCE(SUM(s.total_amount), 0) as revenue
       FROM branches b
       LEFT JOIN sales s ON b.id = s.branch_id ${dateFilter ? "AND 1=1" + dateFilter : ""}
       GROUP BY b.id, b.name
       ORDER BY revenue DESC`,
        params,
      );

      res.json({ branches });
    } catch (error) {
      console.error("Get by branch error:", error);
      res.status(500).json({ error: "Failed to get branch report" });
    }
  },
);

// Get Chart Data
router.get(
  "/chart",
  authenticateStore,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { period = "weekly" } = req.query;

      let dateFormat, dateTrunc;
      switch (period) {
        case "daily":
          dateTrunc = "day";
          break;
        case "weekly":
          dateTrunc = "week";
          break;
        case "monthly":
          dateTrunc = "month";
          break;
        default:
          dateTrunc = "week";
      }

      const chartData = await queryInTenantSchema(
        req.schemaName,
        `SELECT 
         DATE_TRUNC('${dateTrunc}', created_at) as date,
         COUNT(*) as sales,
         SUM(total_amount) as revenue
       FROM sales
       WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY date
       ORDER BY date`,
        [],
      );

      res.json({ chartData });
    } catch (error) {
      console.error("Get chart data error:", error);
      res.status(500).json({ error: "Failed to get chart data" });
    }
  },
);

// Export to Excel
router.get(
  "/export",
  authenticateStore,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { type = "sales", from, to } = req.query;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Report");

      let dateFilter = "";
      const params = [];

      if (from) {
        params.push(from);
        dateFilter += ` AND s.created_at >= $${params.length}`;
      }

      if (to) {
        params.push(to);
        dateFilter += ` AND s.created_at <= $${params.length}`;
      }

      if (type === "sales") {
        // Sales report
        const sales = await queryInTenantSchema(
          req.schemaName,
          `SELECT s.id, s.total_amount, s.payment_type, s.created_at, 
                u.full_name as cashier, b.name as branch
         FROM sales s
         LEFT JOIN users u ON s.user_id = u.id
         LEFT JOIN branches b ON s.branch_id = b.id
         WHERE 1=1 ${dateFilter}
         ORDER BY s.created_at DESC`,
          params,
        );

        worksheet.columns = [
          { header: "ID", key: "id", width: 10 },
          { header: "Amount", key: "total_amount", width: 15 },
          { header: "Payment", key: "payment_type", width: 10 },
          { header: "Cashier", key: "cashier", width: 20 },
          { header: "Branch", key: "branch", width: 20 },
          { header: "Date", key: "created_at", width: 20 },
        ];

        worksheet.addRows(sales);
      } else if (type === "inventory") {
        // Inventory report
        const products = await queryInTenantSchema(
          req.schemaName,
          `SELECT p.id, p.name, c.name as category, p.type, 
                p.quantity, p.min_quantity, p.purchase_price, p.sale_price
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.is_active = true
         ORDER BY p.name`,
          [],
        );

        worksheet.columns = [
          { header: "ID", key: "id", width: 10 },
          { header: "Product", key: "name", width: 30 },
          { header: "Category", key: "category", width: 20 },
          { header: "Type", key: "type", width: 10 },
          { header: "Stock", key: "quantity", width: 10 },
          { header: "Min Stock", key: "min_quantity", width: 10 },
          { header: "Purchase Price", key: "purchase_price", width: 15 },
          { header: "Sale Price", key: "sale_price", width: 15 },
        ];

        worksheet.addRows(products);
      }

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=report_${Date.now()}.xlsx`,
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  },
);

module.exports = router;
