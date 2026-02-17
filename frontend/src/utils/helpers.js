// Format currency in UZS
export const formatCurrency = (amount) => {
  return (
    new Intl.NumberFormat("uz-UZ", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount) + " UZS"
  );
};

// Format date
export const formatDate = (date) => {
  return new Intl.DateTimeFormat("uz-UZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

// Format date for input
export const formatDateForInput = (date) => {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};

// Calculate sale details for POS
export const calculateSale = (product, input) => {
  if (product.type === "piece") {
    // Input is quantity
    const quantity = input;
    const totalPrice = quantity * parseFloat(product.sale_price);
    const profit =
      (parseFloat(product.sale_price) - parseFloat(product.purchase_price)) *
      quantity;

    return {
      quantity,
      totalPrice,
      profit,
      displayText: `${quantity} x ${formatCurrency(product.sale_price)}`,
    };
  } else {
    // Input is money amount (kg_price)
    const totalPrice = input;
    const quantity = input / parseFloat(product.sale_price);
    const profit =
      (parseFloat(product.sale_price) - parseFloat(product.purchase_price)) *
      quantity;

    return {
      quantity,
      totalPrice,
      profit,
      displayText: `${quantity.toFixed(3)} kg @ ${formatCurrency(product.sale_price)}/kg`,
    };
  }
};

// Get status badge color
export const getStatusBadge = (status) => {
  const badges = {
    active: "badge-success",
    trial: "badge-info",
    suspended: "badge-warning",
    expired: "badge-danger",
    deleted: "badge-danger",
  };

  return badges[status] || "badge-info";
};

// Get status text
export const getStatusText = (status) => {
  const texts = {
    active: "Active",
    trial: "Trial",
    suspended: "Suspended",
    expired: "Expired",
    deleted: "Deleted",
  };

  return texts[status] || status;
};

// Calculate days remaining
export const getDaysRemaining = (endDate) => {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
};
