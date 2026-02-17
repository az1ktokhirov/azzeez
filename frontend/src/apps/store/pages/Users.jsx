import React, { useEffect, useState } from "react";
import { usersAPI, branchesAPI } from "../../../api";
import { Card, Modal, Table, Loading, Badge } from "../../../components/UI";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "cashier",
    branchId: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, branchesRes] = await Promise.all([
        usersAPI.getAll(),
        branchesAPI.getAll(),
      ]);
      setUsers(usersRes.data.users);
      setBranches(branchesRes.data.branches);
    } catch (error) {
      console.error("Load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.create(formData);
      setIsModalOpen(false);
      setFormData({
        fullName: "",
        email: "",
        password: "",
        role: "cashier",
        branchId: "",
      });
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to create user");
    }
  };

  const handleToggle = async (user) => {
    try {
      await usersAPI.toggle(user.id);
      loadData();
    } catch (error) {
      alert("Failed to toggle user status");
    }
  };

  const columns = [
    { header: "Name", accessor: "full_name" },
    { header: "Email", accessor: "email" },
    {
      header: "Role",
      render: (row) => (
        <Badge variant={row.role === "admin" ? "success" : "info"}>
          {row.role}
        </Badge>
      ),
    },
    { header: "Branch", accessor: "branch_name" },
    {
      header: "Status",
      render: (row) => (
        <Badge variant={row.is_active ? "success" : "danger"}>
          {row.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      render: (row) => (
        <button onClick={() => handleToggle(row)} className="text-primary-600">
          {row.is_active ? "Deactivate" : "Activate"}
        </button>
      ),
    },
  ];

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <Card
        title="Cashiers"
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            + Add User
          </button>
        }
      >
        <Table columns={columns} data={users} />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add User"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            required
            className="input"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={(e) =>
              setFormData({ ...formData, fullName: e.target.value })
            }
          />
          <input
            type="email"
            required
            className="input"
            placeholder="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
          <input
            type="password"
            required
            className="input"
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />
          <select
            className="input"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          >
            <option value="cashier">Cashier</option>
            <option value="admin">Admin</option>
          </select>
          <select
            className="input"
            value={formData.branchId}
            onChange={(e) =>
              setFormData({ ...formData, branchId: e.target.value })
            }
          >
            <option value="">Select Branch</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary w-full">
            Create User
          </button>
        </form>
      </Modal>
    </div>
  );
}
