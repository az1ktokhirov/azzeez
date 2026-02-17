import React, { useEffect, useState } from "react";
import { categoriesAPI } from "../../../api";
import { Card, Modal, Table, Loading } from "../../../components/UI";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await categoriesAPI.getAll();
      setCategories(res.data.categories);
    } catch (error) {
      console.error("Load categories error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id, { name });
      } else {
        await categoriesAPI.create({ name });
      }
      setIsModalOpen(false);
      setName("");
      setEditingCategory(null);
      loadCategories();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to save category");
    }
  };

  const handleDelete = async (category) => {
    if (confirm(`Delete "${category.name}"?`)) {
      try {
        await categoriesAPI.delete(category.id);
        loadCategories();
      } catch (error) {
        alert(error.response?.data?.error || "Failed to delete");
      }
    }
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setName(category.name);
    setIsModalOpen(true);
  };

  const columns = [
    { header: "ID", accessor: "id" },
    { header: "Name", accessor: "name" },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditModal(row)}
            className="text-primary-600"
          >
            Edit
          </button>
          <button onClick={() => handleDelete(row)} className="text-danger">
            Delete
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <Card
        title="Categories"
        action={
          <button
            onClick={() => {
              setName("");
              setEditingCategory(null);
              setIsModalOpen(true);
            }}
            className="btn btn-primary"
          >
            + Add Category
          </button>
        }
      >
        <Table columns={columns} data={categories} />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? "Edit Category" : "Add Category"}
      >
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            required
            className="input mb-4"
            placeholder="Category Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex gap-3">
            <button type="submit" className="btn btn-primary flex-1">
              {editingCategory ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
