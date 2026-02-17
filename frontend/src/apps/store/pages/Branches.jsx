import React, { useEffect, useState } from "react";
import { branchesAPI } from "../../../api";
import { Card, Modal, Table, Loading } from "../../../components/UI";

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", address: "" });

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const res = await branchesAPI.getAll();
      setBranches(res.data.branches);
    } catch (error) {
      console.error("Load branches error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await branchesAPI.create(formData);
      setIsModalOpen(false);
      setFormData({ name: "", address: "" });
      loadBranches();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to create branch");
    }
  };

  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Address", accessor: "address" },
    {
      header: "Created",
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
  ];

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <Card
        title="Branches"
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            + Add Branch
          </button>
        }
      >
        <Table columns={columns} data={branches} />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Branch"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            required
            className="input"
            placeholder="Branch Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <textarea
            className="input"
            placeholder="Address"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
          />
          <button type="submit" className="btn btn-primary w-full">
            Create Branch
          </button>
        </form>
      </Modal>
    </div>
  );
}
