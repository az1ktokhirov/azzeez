# 🔌 GroceryOS API Reference

**Base URL**: `http://localhost:5000/api`

All protected endpoints require `Authorization: Bearer <token>` header.

---

## 🔐 Authentication

### Store User Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response: {
  "token": "jwt_token",
  "user": { ... },
  "tenant": { ... }
}
```

### Get Current User

```http
GET /api/auth/me
Authorization: Bearer <token>

Response: { "user": {...}, "tenant": {...} }
```

---

## 👑 Super Admin API

### Super Admin Login

```http
POST /api/super/login
Content-Type: application/json

{
  "email": "admin@groceryos.com",
  "password": "admin123"
}
```

### List All Stores

```http
GET /api/super/stores
Authorization: Bearer <super_token>

Response: { "stores": [...] }
```

### Create Store

```http
POST /api/super/stores
Authorization: Bearer <super_token>
Content-Type: application/json

{
  "storeName": "My Store",
  "ownerName": "John Doe",
  "ownerEmail": "john@example.com",
  "ownerPassword": "password123",
  "trialDays": 14
}
```

### Get Store Details

```http
GET /api/super/stores/:id
Authorization: Bearer <super_token>

Response: {
  "tenant": {...},
  "stats": { users, sales, products, totalRevenue }
}
```

### Update Store Status

```http
PATCH /api/super/stores/:id/status
Authorization: Bearer <super_token>
Content-Type: application/json

{
  "status": "active" | "suspended" | "trial" | "deleted",
  "trialDays": 14  // optional, for trial status
}
```

### Send Announcement

```http
POST /api/super/announce
Authorization: Bearer <super_token>
Content-Type: application/json

{
  "title": "Platform Update",
  "message": "New features available",
  "tenantId": 1  // optional, null = all stores
}
```

### Get Platform Analytics

```http
GET /api/super/analytics
Authorization: Bearer <super_token>

Response: {
  "totalStores": 10,
  "activeStores": 8,
  "trialStores": 2,
  "suspendedStores": 0,
  "recentSignups": 3,
  "expiringTrials": 1
}
```

---

## 📦 Products API

### List Products

```http
GET /api/products?categoryId=1&search=apple
Authorization: Bearer <token>

Response: { "products": [...] }
```

### Get Single Product

```http
GET /api/products/:id
Authorization: Bearer <token>
```

### Create Product (Admin Only)

```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Apple",
  "categoryId": 1,
  "type": "piece" | "kg_price",
  "purchasePrice": 500,
  "salePrice": 800,
  "quantity": 100,
  "minQuantity": 10
}
```

### Update Product (Admin Only)

```http
PUT /api/products/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "categoryId": 1,
  "type": "piece",
  "purchasePrice": 500,
  "salePrice": 800,
  "quantity": 100,
  "minQuantity": 10
}
```

### Restock Product (Admin Only)

```http
PATCH /api/products/:id/restock
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 50  // amount to add
}
```

### Delete Product (Admin Only)

```http
DELETE /api/products/:id
Authorization: Bearer <token>
```

---

## 🏷️ Categories API

### List Categories

```http
GET /api/categories
Authorization: Bearer <token>
```

### Create Category (Admin Only)

```http
POST /api/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Fruits"
}
```

### Update Category (Admin Only)

```http
PUT /api/categories/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name"
}
```

### Delete Category (Admin Only)

```http
DELETE /api/categories/:id
Authorization: Bearer <token>
```

---

## 💰 Sales API

### Create Sale (POS Transaction)

```http
POST /api/sales
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "productId": 1,
      "input": 5  // For piece: quantity. For kg_price: money amount
    },
    {
      "productId": 2,
      "input": 8000
    }
  ],
  "paymentType": "cash" | "card"
}

Response: {
  "message": "Sale completed",
  "sale": { "id": 1, "totalAmount": 15000, ... }
}
```

### List Sales (Admin Only)

```http
GET /api/sales?page=1&limit=50&branchId=1&from=2024-01-01&to=2024-12-31
Authorization: Bearer <token>

Response: { "sales": [...] }
```

### Get Sale Details (Admin Only)

```http
GET /api/sales/:id
Authorization: Bearer <token>

Response: {
  "sale": {...},
  "items": [...]
}
```

---

## 📊 Reports API (Admin Only)

### Get Summary KPIs

```http
GET /api/reports/summary?from=2024-01-01&to=2024-12-31&branchId=1
Authorization: Bearer <token>

Response: {
  "salesCount": 100,
  "revenue": 5000000,
  "profit": 1500000,
  "lowStockCount": 5
}
```

### Get Top Products

```http
GET /api/reports/top-products?limit=5&from=2024-01-01&to=2024-12-31
Authorization: Bearer <token>

Response: {
  "products": [
    { "name": "Product A", "revenue": 50000, "quantity_sold": 100 },
    ...
  ]
}
```

### Get Sales by Category

```http
GET /api/reports/by-category?from=2024-01-01&to=2024-12-31
Authorization: Bearer <token>

Response: {
  "categories": [
    { "name": "Fruits", "revenue": 100000 },
    ...
  ]
}
```

### Get Sales by Cashier

```http
GET /api/reports/by-cashier?from=2024-01-01&to=2024-12-31
Authorization: Bearer <token>

Response: {
  "cashiers": [
    { "full_name": "John", "sales_count": 50, "revenue": 200000 },
    ...
  ]
}
```

### Get Sales by Branch

```http
GET /api/reports/by-branch?from=2024-01-01&to=2024-12-31
Authorization: Bearer <token>

Response: {
  "branches": [
    { "name": "Main Branch", "sales_count": 100, "revenue": 500000 },
    ...
  ]
}
```

### Get Chart Data

```http
GET /api/reports/chart?period=daily|weekly|monthly
Authorization: Bearer <token>

Response: {
  "chartData": [
    { "date": "2024-01-01", "sales": 10, "revenue": 50000 },
    ...
  ]
}
```

### Export Data

```http
GET /api/reports/export?type=sales|inventory&from=2024-01-01&to=2024-12-31
Authorization: Bearer <token>

Response: Excel file (blob)
```

---

## 🏪 Branches API (Admin Only)

### List Branches

```http
GET /api/branches
Authorization: Bearer <token>
```

### Create Branch

```http
POST /api/branches
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Downtown Branch",
  "address": "123 Main St"
}
```

### Update Branch

```http
PUT /api/branches/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "address": "New Address",
  "isActive": true
}
```

### Delete Branch

```http
DELETE /api/branches/:id
Authorization: Bearer <token>
```

---

## 👥 Users API (Admin Only)

### List Users

```http
GET /api/users
Authorization: Bearer <token>

Response: { "users": [...] }
```

### Create User (Cashier)

```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "role": "admin" | "cashier",
  "branchId": 1  // required for cashiers
}
```

### Update User

```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Jane Smith",
  "email": "jane@example.com",
  "role": "cashier",
  "branchId": 1,
  "password": "newpassword"  // optional
}
```

### Toggle User Active Status

```http
PATCH /api/users/:id/toggle
Authorization: Bearer <token>

Response: {
  "message": "User activated" | "User deactivated",
  "user": {...}
}
```

### Delete User

```http
DELETE /api/users/:id
Authorization: Bearer <token>
```

---

## 🔄 Response Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `423` - Locked (store expired/suspended)
- `500` - Internal Server Error

---

## 🧪 Example Flow: Complete Sale

1. **Login as Cashier:**

```http
POST /api/auth/login
{ "email": "cashier@store.com", "password": "pass123" }
```

2. **Get Products:**

```http
GET /api/products
```

3. **Create Sale:**

```http
POST /api/sales
{
  "items": [
    { "productId": 5, "input": 3 },      // 3 pieces of product #5
    { "productId": 8, "input": 10000 }   // 10000 UZS of product #8 (kg_price)
  ],
  "paymentType": "cash"
}
```

---

## 📝 Notes

### Product Types

- **piece**: Input is quantity (e.g., 5 bottles)
  - Total = quantity × sale_price
  - Stock -= quantity

- **kg_price**: Input is money amount (e.g., 8000 UZS)
  - Quantity (kg) = money / sale_price
  - Total = money amount
  - Stock -= calculated kg

### Store Status

- **active**: Full access
- **trial**: Full access, expires automatically
- **suspended**: Warning shown, 3-day grace period
- **expired**: Admin locked, export only
- **deleted**: No access

### Date Filters

All date filters accept ISO 8601 format: `YYYY-MM-DD`

---

**API Version**: 1.0  
**Last Updated**: February 2026
