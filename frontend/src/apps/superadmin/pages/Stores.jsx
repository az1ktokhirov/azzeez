import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { superAdminAPI } from "../../../api";
import { Card, Modal, Table, Badge, Loading } from "../../../components/UI";
import {
  getStatusBadge,
  getStatusText,
  getDaysRemaining,
  formatDate,
} from "../../../utils/helpers";

export default function SuperAdminStores() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    storeName: "",
    ownerEmail: "",
    ownerPassword: "",
    ownerName: "",
    trialDays: 14,
  });

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const res = await superAdminAPI.getStores();
      setStores(res.data.stores);
    } catch (error) {
      console.error("Load stores error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await superAdminAPI.createStore(formData);
      setIsModalOpen(false);
      setFormData({
        storeName: "",
        ownerEmail: "",
        ownerPassword: "",
        ownerName: "",
        trialDays: 14,
      });
      loadStores();
      alert("Store created successfully!");
    } catch (error) {
      alert(error.response?.data?.error || "Failed to create store");
    }
  };

  const handleStatusChange = async (store, newStatus) => {
    try {
      await superAdminAPI.updateStoreStatus(store.id, {
        status: newStatus,
        trialDays: 14,
      });
      loadStores();
    } catch (error) {
      alert("Failed to update status");
    }
  };

  const columns = [
    { header: "ID", accessor: "id" },
    { header: "Store Name", accessor: "storeName" },
    { header: "Owner Email", accessor: "ownerEmail" },
    {
      header: "Status",
      render: (row) => (
        <Badge variant={getStatusBadge(row.status).replace("badge-", "")}>
          {getStatusText(row.status)}
        </Badge>
      ),
    },
    {
      header: "Trial Info",
      render: (row) => {
        if (row.status === "trial" && row.trialEndsAt) {
          const days = getDaysRemaining(row.trialEndsAt);
          return (
            <span className={days <= 3 ? "text-danger font-semibold" : ""}>
              {days} days left
            </span>
          );
        }
        return "-";
      },
    },
    { header: "Created", render: (row) => formatDate(row.createdAt) },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => navigate(`/superadmin/stores/${row.id}`)}
            className="text-primary-600"
          >
            View
          </button>
          {row.status !== "active" && (
            <button
              onClick={() => handleStatusChange(row, "active")}
              className="text-success"
            >
              Activate
            </button>
          )}
          {row.status === "active" && (
            <button
              onClick={() => handleStatusChange(row, "suspended")}
              className="text-warning"
            >
              Suspend
            </button>
          )}
          {row.status !== "trial" && (
            <button
              onClick={() => handleStatusChange(row, "trial")}
              className="text-blue-600"
            >
              Trial
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <Card
        title="All Stores"
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            + Register Store
          </button>
        }
      >
        <Table columns={columns} data={stores} />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Store"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Store Name</label>
            <input
              type="text"
              required
              className="input"
              value={formData.storeName}
              onChange={(e) =>
                setFormData({ ...formData, storeName: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Owner Name</label>
            <input
              type="text"
              required
              className="input"
              value={formData.ownerName}
              onChange={(e) =>
                setFormData({ ...formData, ownerName: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Owner Email
            </label>
            <input
              type="email"
              required
              className="input"
              value={formData.ownerEmail}
              onChange={(e) =>
                setFormData({ ...formData, ownerEmail: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Owner Password
            </label>
            <input
              type="password"
              required
              className="input"
              value={formData.ownerPassword}
              onChange={(e) =>
                setFormData({ ...formData, ownerPassword: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Trial Days</label>
            <input
              type="number"
              required
              className="input"
              value={formData.trialDays}
              onChange={(e) =>
                setFormData({ ...formData, trialDays: e.target.value })
              }
            />
          </div>
          <button type="submit" className="btn btn-primary w-full">
            Create Store
          </button>
        </form>
      </Modal>
    </div>
  );
}
