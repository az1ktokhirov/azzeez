import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSuperAdminStore } from "../../../store/authStore";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { superAdmin, logout } = useSuperAdminStore();

  const handleLogout = () => {
    logout();
    navigate("/superadmin/login");
  };

  const menuItems = [
    { path: "/superadmin/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/superadmin/stores", label: "Stores", icon: "🏪" },
    { path: "/superadmin/announce", label: "Announcements", icon: "📢" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">🔐 GroceryOS Super Admin</h1>
            <span className="text-sm opacity-90">|</span>
            <span className="text-sm opacity-90">{superAdmin?.fullName}</span>
          </div>
          <button
            onClick={handleLogout}
            className="btn bg-white text-purple-600 hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <aside className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow p-4 space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? "bg-purple-100 text-purple-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </aside>

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
