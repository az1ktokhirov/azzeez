import React, { useEffect, useState } from "react";
import { productsAPI, categoriesAPI } from "../../../api";
import { Card, Modal, Table, Loading, Badge } from "../../../components/UI";
import { formatCurrency } from "../../../utils/helpers";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    type: "piece",
    purchasePrice: "",
    salePrice: "",
    quantity: "",
    minQuantity: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productsAPI.getAll(),
        categoriesAPI.getAll(),
      ]);
      setProducts(productsRes.data.products);
      setCategories(categoriesRes.data.categories);
    } catch (error) {
      console.error("Load products error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productsAPI.update(editingProduct.id, formData);
      } else {
        await productsAPI.create(formData);
      }
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to save product");
    }
  };

  const handleRestock = async (product) => {
    const quantity = prompt(`Add stock for ${product.name}:`, "0");
    if (quantity && parseFloat(quantity) > 0) {
      try {
        await productsAPI.restock(product.id, {
          quantity: parseFloat(quantity),
        });
        loadData();
      } catch (error) {
        alert(error.response?.data?.error || "Failed to restock");
      }
    }
  };

  const handleDelete = async (product) => {
    if (confirm(`Delete ${product.name}?`)) {
      try {
        await productsAPI.delete(product.id);
        loadData();
      } catch (error) {
        alert(error.response?.data?.error || "Failed to delete");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      categoryId: "",
      type: "piece",
      purchasePrice: "",
      salePrice: "",
      quantity: "",
      minQuantity: "",
    });
    setEditingProduct(null);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      categoryId: product.category_id || "",
      type: product.type,
      purchasePrice: product.purchase_price,
      salePrice: product.sale_price,
      quantity: product.quantity,
      minQuantity: product.min_quantity,
    });
    setIsModalOpen(true);
  };

  const columns = [
    { header: "Name", accessor: "name" },
    {
      header: "Category",
      render: (row) => row.category_name || "N/A",
    },
    {
      header: "Type",
      render: (row) => (
        <Badge variant={row.type === "piece" ? "info" : "success"}>
          {row.type === "piece" ? "Piece" : "Weight"}
        </Badge>
      ),
    },
    {
      header: "Purchase Price",
      render: (row) => formatCurrency(row.purchase_price),
    },
    {
      header: "Sale Price",
      render: (row) => formatCurrency(row.sale_price),
    },
    {
      header: "Stock",
      render: (row) => {
        const qty = parseFloat(row.quantity);
        const minQty = parseFloat(row.min_quantity);
        const isLow = qty <= minQty;
        return (
          <span className={isLow ? "text-danger font-semibold" : ""}>
            {qty.toFixed(2)} {row.type === "kg_price" ? "kg" : "pcs"}
          </span>
        );
      },
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditModal(row)}
            className="text-primary-600 hover:text-primary-700"
          >
            Edit
          </button>
          <button
            onClick={() => handleRestock(row)}
            className="text-success hover:text-green-600"
          >
            Restock
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="text-danger hover:text-red-600"
          >
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
        title="Products"
        action={
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="btn btn-primary"
          >
            + Add Product
          </button>
        }
      >
        <Table columns={columns} data={products} />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingProduct ? "Edit Product" : "Add Product"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Product Name
            </label>
            <input
              type="text"
              required
              className="input"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              className="input"
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: e.target.value })
              }
            >
              <option value="">No Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              className="input"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
            >
              <option value="piece">Piece (Count)</option>
              <option value="kg_price">Weight (kg/price)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Purchase Price
              </label>
              <input
                type="number"
                required
                step="0.01"
                className="input"
                value={formData.purchasePrice}
                onChange={(e) =>
                  setFormData({ ...formData, purchasePrice: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Sale Price
              </label>
              <input
                type="number"
                required
                step="0.01"
                className="input"
                value={formData.salePrice}
                onChange={(e) =>
                  setFormData({ ...formData, salePrice: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Initial Stock
              </label>
              <input
                type="number"
                required
                step="0.001"
                className="input"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Min Stock Alert
              </label>
              <input
                type="number"
                required
                step="0.001"
                className="input"
                value={formData.minQuantity}
                onChange={(e) =>
                  setFormData({ ...formData, minQuantity: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn btn-primary flex-1">
              {editingProduct ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
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
