import React, { useEffect, useState } from "react";
import { reportsAPI, productsAPI } from "../../../api";
import { Card, Loading } from "../../../components/UI";
import { formatCurrency } from "../../../utils/helpers";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [summaryRes, topRes, productsRes] = await Promise.all([
        reportsAPI.getSummary(),
        reportsAPI.getTopProducts({ limit: 5 }),
        productsAPI.getAll(),
      ]);

      setSummary(summaryRes.data);
      setTopProducts(topRes.data.products);

      // Filter low stock products
      const low = productsRes.data.products.filter(
        (p) => parseFloat(p.quantity) <= parseFloat(p.min_quantity),
      );
      setLowStock(low);
    } catch (error) {
      console.error("Load dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="text-center">
            <p className="text-gray-600 text-sm">Total Sales</p>
            <p className="text-3xl font-bold text-primary-600 mt-2">
              {summary?.salesCount || 0}
            </p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-gray-600 text-sm">Revenue</p>
            <p className="text-3xl font-bold text-success mt-2">
              {formatCurrency(summary?.revenue || 0)}
            </p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-gray-600 text-sm">Profit</p>
            <p className="text-3xl font-bold text-primary-600 mt-2">
              {formatCurrency(summary?.profit || 0)}
            </p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-gray-600 text-sm">Low Stock Items</p>
            <p className="text-3xl font-bold text-warning mt-2">
              {summary?.lowStockCount || 0}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card title="Top Selling Products">
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((product, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      Sold: {parseFloat(product.quantity_sold).toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold text-primary-600">
                    {formatCurrency(product.revenue)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center">No sales data yet</p>
          )}
        </Card>

        {/* Low Stock Alert */}
        <Card
          title="Low Stock Alert"
          action={<span className="badge badge-danger">{lowStock.length}</span>}
        >
          {lowStock.length > 0 ? (
            <div className="space-y-3">
              {lowStock.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      Min: {product.min_quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-danger">
                    {parseFloat(product.quantity).toFixed(2)}{" "}
                    {product.type === "kg_price" ? "kg" : "pcs"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center">
              All products have sufficient stock
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
