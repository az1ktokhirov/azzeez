import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../../store/authStore";
import { Alert } from "../../../components/UI";
import { getDaysRemaining } from "../../../utils/helpers";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, tenant, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/products", label: "Products", icon: "📦" },
    { path: "/categories", label: "Categories", icon: "🏷️" },
    { path: "/users", label: "Cashiers", icon: "👥" },
    { path: "/branches", label: "Branches", icon: "🏪" },
    { path: "/reports", label: "Reports", icon: "📈" },
    { path: "/pos", label: "POS Terminal", icon: "💰" },
  ];

  const isSuspended = tenant?.status === "suspended";
  const isTrial = tenant?.status === "trial";
  const daysRemaining =
    isTrial && tenant?.trialEndsAt ? getDaysRemaining(tenant.trialEndsAt) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Warning Banner */}
      {isSuspended && (
        <Alert type="warning">
          ⚠️ Your store is currently suspended. Please contact support to
          reactivate.
        </Alert>
      )}

      {isTrial && daysRemaining <= 3 && (
        <Alert type="info">
          ℹ️ Trial expires in {daysRemaining} day
          {daysRemaining !== 1 ? "s" : ""}. Contact support to upgrade.
        </Alert>
      )}

      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-primary-600">
              🛒 {tenant?.storeName}
            </h1>
            <span className="text-sm text-gray-500">|</span>
            <span className="text-sm text-gray-600">
              {user?.fullName} ({user?.role})
            </span>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          {user?.role === "admin" && (
            <aside className="w-64 flex-shrink-0">
              <nav className="bg-white rounded-lg shadow p-4 space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                      location.pathname === item.path
                        ? "bg-primary-100 text-primary-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </aside>
          )}

          {/* Content */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
