import React, { useState, useEffect } from "react";
import { superAdminAPI } from "../../../api";
import { Card } from "../../../components/UI";

export default function SuperAdminAnnounce() {
  const [stores, setStores] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    tenantId: "", // empty = all stores
  });
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const res = await superAdminAPI.getStores();
      setStores(res.data.stores);
    } catch (error) {
      console.error("Load stores error:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await superAdminAPI.sendAnnouncement({
        title: formData.title,
        message: formData.message,
        tenantId: formData.tenantId ? parseInt(formData.tenantId) : null,
      });
      setSuccess("Announcement sent successfully!");
      setFormData({ title: "", message: "", tenantId: "" });
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      alert(error.response?.data?.error || "Failed to send announcement");
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Send Announcement">
        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Target Store
            </label>
            <select
              className="input"
              value={formData.tenantId}
              onChange={(e) =>
                setFormData({ ...formData, tenantId: e.target.value })
              }
            >
              <option value="">All Stores</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.storeName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              required
              className="input"
              placeholder="Announcement title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea
              required
              rows="5"
              className="input"
              placeholder="Announcement message"
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
            />
          </div>

          <button type="submit" className="btn btn-primary w-full">
            📢 Send Announcement
          </button>
        </form>
      </Card>
    </div>
  );
}
