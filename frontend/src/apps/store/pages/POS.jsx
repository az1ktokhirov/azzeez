import React, { useEffect, useState } from "react";
import { productsAPI, salesAPI } from "../../../api";
import { useCartStore } from "../../../store/cartStore";
import { useAuthStore } from "../../../store/authStore";
import { formatCurrency, calculateSale } from "../../../utils/helpers";
import { Card, Badge, Loading } from "../../../components/UI";

export default function POS() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentType, setPaymentType] = useState("cash");

  const { items, addItem, removeItem, updateItemInput, clearCart, getTotal } =
    useCartStore();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [search, selectedCategory, products]);

  const loadProducts = async () => {
    try {
      const res = await productsAPI.getAll();
      setProducts(res.data.products);

      // Extract unique categories
      const cats = [
        ...new Set(
          res.data.products.map((p) => p.category_name).filter(Boolean),
        ),
      ];
      setCategories(cats);
    } catch (error) {
      console.error("Load products error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (search) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category_name === selectedCategory);
    }

    setFilteredProducts(filtered);
  };

  const handleProductClick = (product) => {
    const input = parseFloat(
      prompt(
        product.type === "piece"
          ? `Enter quantity for ${product.name}:`
          : `Enter money amount for ${product.name} (${formatCurrency(product.sale_price)}/kg):`,
        product.type === "piece" ? "1" : "1000",
      ),
    );

    if (input && input > 0) {
      // Check stock
      if (product.type === "piece") {
        if (parseFloat(product.quantity) < input) {
          return alert("Insufficient stock!");
        }
      } else {
        const requiredKg = input / parseFloat(product.sale_price);
        if (parseFloat(product.quantity) < requiredKg) {
          return alert("Insufficient stock!");
        }
      }

      addItem(product, input);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      return alert("Cart is empty");
    }

    if (!confirm("Complete this sale?")) {
      return;
    }

    setProcessing(true);

    try {
      const saleItems = items.map((item) => ({
        productId: item.product.id,
        input: item.input,
      }));

      await salesAPI.create({
        items: saleItems,
        paymentType,
      });

      alert("Sale completed successfully!");
      clearCart();
      loadProducts(); // Reload to update stock
    } catch (error) {
      alert(error.response?.data?.error || "Failed to complete sale");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header */}
      <div className="bg-primary-600 text-white p-4 rounded-lg mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">💰 POS Terminal</h1>
          <p className="text-sm opacity-90">Cashier: {user?.fullName}</p>
        </div>
        <button
          onClick={logout}
          className="btn bg-white text-primary-600 hover:bg-gray-100"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Products List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search & Filter */}
          <Card>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Search products..."
                className="input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedCategory("")}
                  className={`px-3 py-1 rounded-lg text-sm ${!selectedCategory ? "bg-primary-600 text-white" : "bg-gray-200"}`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-sm ${selectedCategory === cat ? "bg-primary-600 text-white" : "bg-gray-200"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredProducts.map((product) => {
              const isLowStock =
                parseFloat(product.quantity) <=
                parseFloat(product.min_quantity);

              return (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-left"
                  disabled={parseFloat(product.quantity) === 0}
                >
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-primary-600 font-bold">
                    {formatCurrency(product.sale_price)}
                  </p>
                  <p
                    className={`text-xs mt-1 ${isLowStock ? "text-danger" : "text-gray-500"}`}
                  >
                    Stock: {parseFloat(product.quantity).toFixed(2)}{" "}
                    {product.type === "kg_price" ? "kg" : "pcs"}
                  </p>
                  {product.type === "kg_price" && (
                    <Badge variant="success">Weight</Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cart */}
        <div className="lg:col-span-1">
          <Card title="Cart">
            <div className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {items.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Cart is empty
                  </p>
                ) : (
                  items.map((item, idx) => {
                    const calc = calculateSale(item.product, item.input);

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {calc.displayText}
                          </p>
                        </div>
                        <div className="text-right ml-2">
                          <p className="font-semibold">
                            {formatCurrency(calc.totalPrice)}
                          </p>
                          <button
                            onClick={() => removeItem(item.product.id)}
                            className="text-xs text-danger hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {formatCurrency(getTotal())}
                  </span>
                </div>

                {/* Payment Type */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPaymentType("cash")}
                      className={`py-2 rounded-lg ${paymentType === "cash" ? "bg-primary-600 text-white" : "bg-gray-200"}`}
                    >
                      💵 Cash
                    </button>
                    <button
                      onClick={() => setPaymentType("card")}
                      className={`py-2 rounded-lg ${paymentType === "card" ? "bg-primary-600 text-white" : "bg-gray-200"}`}
                    >
                      💳 Card
                    </button>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={items.length === 0 || processing}
                  className="btn btn-success w-full text-lg"
                >
                  {processing ? "Processing..." : "✓ Complete Sale"}
                </button>

                {items.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="btn btn-secondary w-full mt-2"
                  >
                    Clear Cart
                  </button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
