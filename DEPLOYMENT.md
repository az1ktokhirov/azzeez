# GroceryOS Platform - Deployment Guide

## 🚀 Quick Start (Local Development)

### Prerequisites

- Docker Desktop installed and running
- Node.js 20+ (for local development without Docker)

### Option 1: Full Docker Setup (Recommended)

1. **Navigate to project:**

```bash
cd "d:\веб проекты\mini-market"
```

2. **Start all services:**

```bash
docker-compose up --build
```

3. **Wait for services to start** (may take 2-3 minutes on first run)

4. **Initialize Super Admin account:**

```bash
docker-compose exec backend sh -c "psql $DATABASE_URL -f /app/prisma/seed.sql"
```

5. **Access the application:**

- Frontend: http://localhost
- API: http://localhost:5000
- Super Admin: http://localhost/superadmin

### Option 2: Local Development

**Backend:**

```bash
cd backend
npm install
npx prisma migrate deploy
npx prisma generate
npm run dev
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

## 🔐 Default Credentials

### Super Admin

- URL: http://localhost/superadmin/login
- Email: `admin@groceryos.com`
- Password: `admin123`

**⚠️ IMPORTANT:** Change this password immediately in production!

## 📝 First Steps After Installation

### 1. Login as Super Admin

Navigate to `/superadmin/login` and use the default credentials above.

### 2. Register Your First Store

1. Go to "Stores" section
2. Click "+ Register Store"
3. Fill in:
   - Store Name: "My First Store"
   - Owner Name: "John Doe"
   - Owner Email: "john@example.com"
   - Owner Password: "password123"
   - Trial Days: 14

4. Click "Create Store"

### 3. Login as Store Owner

1. Go to `/login` (main login page)
2. Use the store owner credentials you just created
3. You'll see the Store Admin Dashboard

### 4. Setup Your Store

As Store Owner (Admin):

1. **Add Categories**: Products > Categories (e.g., "Fruits", "Dairy", "Snacks")
2. **Add Products**: Products > Add Product
   - Piece products (e.g., Coca Cola, Bread)
   - Weight products (e.g., Bananas, Apples)
3. **Add Branches** (if multiple locations)
4. **Create Cashier Accounts**: Users > Add User

### 5. Test POS System

1. Login as Cashier or use Admin account
2. Navigate to "POS Terminal"
3. Add products to cart
4. Complete a sale

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────┐
│         Nginx (Port 80)                 │
│  Routes /api/* to Backend               │
│  Serves React SPA for other routes      │
└─────────────────────────────────────────┘
           │                    │
           ▼                    ▼
┌──────────────────┐  ┌──────────────────┐
│   React Frontend │  │  Node.js Backend │
│   (Vite + React) │  │  (Express + JWT) │
│   Port 3000 (dev)│  │      Port 5000   │
└──────────────────┘  └──────────────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │   PostgreSQL 16      │
                   │   Schema-per-Tenant  │
                   │      Port 5432       │
                   └──────────────────────┘
```

## 🗄️ Database Structure

### Public Schema

- `tenants` - All registered stores
- `super_admins` - Platform administrators
- `announcements` - Messages to stores

### Per-Store Schema (store_1, store_2, etc.)

- `users` - Store admin + cashiers
- `branches` - Store locations
- `categories` - Product categories
- `products` - Inventory
- `sales` - Sale transactions
- `sale_items` - Individual items per sale

## 🔧 Configuration

### Environment Variables (.env)

```
DB_PASSWORD=groceryos_strong_password_2026
JWT_SECRET=store_jwt_secret_key_very_long_random_string_here_12345678
SUPER_JWT_SECRET=super_admin_jwt_different_secret_key_abcdefgh987654321
VITE_API_URL=http://localhost:5000
```

**For Production:** Generate secure random strings for all secrets!

## 📊 Key Features Implemented

### ✅ Multi-Tenant Architecture

- Complete data isolation per store
- Schema-per-tenant model
- Automatic schema switching

### ✅ Three Role System

- **Super Admin**: Platform management
- **Store Admin**: Full store control
- **Cashier**: POS terminal only

### ✅ POS System

- Piece products (count-based)
- Weight products (kg/price calculation)
- Cash/Card payment types
- Real-time stock deduction
- Transaction integrity

### ✅ Store Management

- Product CRUD with categories
- Multi-branch support
- Cashier management
- Inventory tracking
- Low-stock alerts

### ✅ Reports & Analytics

- Sales summary (revenue, profit, count)
- Top products
- By category, cashier, branch
- Excel/PDF export

### ✅ Trial & Status Control

- 14-day free trial
- Auto-suspension on expiry
- Grace period (3 days)
- Manual activation by Super Admin

## 🚨 Troubleshooting

### Docker Issues

**Port already in use:**

```bash
# Stop conflicting services
docker-compose down
# Or change ports in docker-compose.yml
```

**Database connection errors:**

```bash
# Check if DB is healthy
docker-compose ps
# View logs
docker-compose logs db
```

**Frontend not loading:**

```bash
# Rebuild frontend
docker-compose up --build frontend
```

### Development Issues

**Prisma errors:**

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

**Module not found:**

```bash
# Reinstall dependencies
npm install
```

## 🔒 Security Checklist for Production

- [ ] Change default Super Admin password
- [ ] Generate new JWT secrets (at least 32 characters)
- [ ] Update DB password
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up backup system
- [ ] Enable rate limiting
- [ ] Review CORS settings
- [ ] Use environment-specific configs

## 📈 Performance Tips

- Index frequently queried fields
- Enable PostgreSQL query caching
- Use Redis for session storage
- Implement CDN for static assets
- Enable Gzip compression (already configured in Nginx)

## 🆘 Support

For issues or questions:

1. Check the logs: `docker-compose logs [service]`
2. Review the README.md
3. Check the technical specification (POS_TZ.docx)

## 📚 API Documentation

Full API documentation available at:

- Check `backend/src/routes/` for all endpoints
- Postman collection can be generated from code

---

**Built with ❤️ for Small & Mid-Size Grocery Stores**
