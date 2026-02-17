import React, { useEffect, useState } from "react";
import { reportsAPI } from "../../../api";
import { Card, Loading } from "../../../components/UI";
import { formatCurrency } from "../../../utils/helpers";

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [byCategory, setByCategory] = useState([]);
  const [byCashier, setByCashier] = useState([]);
  const [byBranch, setByBranch] = useState([]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const [summaryRes, catRes, cashierRes, branchRes] = await Promise.all([
        reportsAPI.getSummary(),
        reportsAPI.getByCategory(),
        reportsAPI.getByCashier(),
        reportsAPI.getByBranch(),
      ]);

      setSummary(summaryRes.data);
      setByCategory(catRes.data.categories);
      setByCashier(cashierRes.data.cashiers);
      setByBranch(branchRes.data.branches);
    } catch (error) {
      console.error("Load reports error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    try {
      const res = await reportsAPI.export({ type });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${type}_report_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Failed to export");
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reports & Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-center">
            <p className="text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-success mt-2">
              {formatCurrency(summary?.revenue || 0)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-600">Total Profit</p>
            <p className="text-2xl font-bold text-primary-600 mt-2">
              {formatCurrency(summary?.profit || 0)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-600">Total Sales</p>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              {summary?.salesCount || 0}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Sales by Category">
          {byCategory.map((cat, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center p-3 bg-gray-50 rounded-lg mb-2"
            >
              <span>{cat.name}</span>
              <span className="font-semibold">
                {formatCurrency(cat.revenue)}
              </span>
            </div>
          ))}
        </Card>

        <Card title="Sales by Cashier">
          {byCashier.map((cashier, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center p-3 bg-gray-50 rounded-lg mb-2"
            >
              <span>{cashier.full_name}</span>
              <span className="font-semibold">
                {formatCurrency(cashier.revenue)}
              </span>
            </div>
          ))}
        </Card>
      </div>

      <Card title="Export Data">
        <div className="flex gap-3">
          <button
            onClick={() => handleExport("sales")}
            className="btn btn-primary"
          >
            Export Sales
          </button>
          <button
            onClick={() => handleExport("inventory")}
            className="btn btn-primary"
          >
            Export Inventory
          </button>
        </div>
      </Card>
    </div>
  );
}
