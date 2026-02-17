import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore, useSuperAdminStore } from "./store/authStore";

// Auth Pages
import Login from "./apps/store/pages/Login";
import SuperAdminLogin from "./apps/superadmin/pages/Login";

// Super Admin Pages
import SuperAdminLayout from "./apps/superadmin/components/Layout";
import SuperAdminDashboard from "./apps/superadmin/pages/Dashboard";
import SuperAdminStores from "./apps/superadmin/pages/Stores";
import SuperAdminStoreDetails from "./apps/superadmin/pages/StoreDetails";
import SuperAdminAnnounce from "./apps/superadmin/pages/Announce";

// Store Admin Pages
import StoreLayout from "./apps/store/components/Layout";
import Dashboard from "./apps/store/pages/Dashboard";
import Products from "./apps/store/pages/Products";
import Categories from "./apps/store/pages/Categories";
import Users from "./apps/store/pages/Users";
import Branches from "./apps/store/pages/Branches";
import Reports from "./apps/store/pages/Reports";

// POS Page
import POS from "./apps/store/pages/POS";

function App() {
  const { user, token } = useAuthStore();
  const { superAdmin, superToken } = useSuperAdminStore();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/superadmin/login" element={<SuperAdminLogin />} />

      {/* Super Admin Routes */}
      <Route
        path="/superadmin/*"
        element={
          superToken ? (
            <SuperAdminLayout>
              <Routes>
                <Route
                  path="/"
                  element={<Navigate to="/superadmin/dashboard" replace />}
                />
                <Route path="/dashboard" element={<SuperAdminDashboard />} />
                <Route path="/stores" element={<SuperAdminStores />} />
                <Route
                  path="/stores/:id"
                  element={<SuperAdminStoreDetails />}
                />
                <Route path="/announce" element={<SuperAdminAnnounce />} />
              </Routes>
            </SuperAdminLayout>
          ) : (
            <Navigate to="/superadmin/login" replace />
          )
        }
      />

      {/* Store Routes */}
      <Route
        path="/*"
        element={
          token && user ? (
            user.role === "cashier" ? (
              // Cashier - redirect to POS
              <Routes>
                <Route path="/" element={<Navigate to="/pos" replace />} />
                <Route path="/pos" element={<POS />} />
                <Route path="*" element={<Navigate to="/pos" replace />} />
              </Routes>
            ) : (
              // Admin - full access
              <StoreLayout>
                <Routes>
                  <Route
                    path="/"
                    element={<Navigate to="/dashboard" replace />}
                  />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/branches" element={<Branches />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/pos" element={<POS />} />
                </Routes>
              </StoreLayout>
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;
