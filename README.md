# 🛒 GroceryOS - Multi-Tenant SaaS POS Platform

A comprehensive Point of Sale and inventory management system for grocery stores with multi-tenant architecture.

## 🚀 Features

- **Multi-Tenant SaaS**: Schema-per-tenant isolation in PostgreSQL
- **Three Role Levels**: Super Admin, Store Admin, Cashier
- **POS System**: Support for piece and weight-based products
- **Multi-Branch**: Manage multiple store branches
- **Trial Mode**: 14-day free trial with auto-suspension
- **Reports & Analytics**: Comprehensive sales and profit reports
- **Data Export**: Excel and PDF export capabilities
- **Real-time Notifications**: Announcement system

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + Zustand
- **Backend**: Node.js + Express + Prisma ORM
- **Database**: PostgreSQL 16
- **Auth**: JWT + bcrypt
- **Infrastructure**: Docker + Docker Compose

## 📦 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ (for local development)

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd mini-market
```

2. Create `.env` file (already included, update if needed)

3. Start the application

```bash
docker-compose up -d
```

4. Access the application

- Frontend: http://localhost
- API: http://localhost:5000
- Super Admin Panel: http://localhost/superadmin

### Default Credentials

**Super Admin:**

- Email: admin@groceryos.com
- Password: admin123

## 🏗️ Project Structure

```
mini-market/
├── backend/               # Express.js API
│   ├── prisma/           # Database schema & migrations
│   ├── src/
│   │   ├── middleware/   # Auth, tenant, validation
│   │   ├── routes/       # API routes
│   │   ├── controllers/  # Business logic
│   │   └── utils/        # Helpers
│   └── Dockerfile
├── frontend/             # React application
│   ├── src/
│   │   ├── apps/        # Super Admin & Store apps
│   │   ├── components/  # Shared UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── store/       # Zustand state management
│   │   └── utils/       # Utility functions
│   ├── nginx.conf
│   └── Dockerfile
└── docker-compose.yml
```

## 📚 API Documentation

### Auth Endpoints

- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Super Admin Endpoints

- `POST /api/super/login` - Super admin login
- `GET /api/super/stores` - List all stores
- `POST /api/super/stores` - Register new store
- `PATCH /api/super/stores/:id/status` - Update store status
- `POST /api/super/announce` - Send announcement

### Store Admin Endpoints

- `GET /api/products` - List products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `GET /api/reports/summary` - Get KPI summary
- `GET /api/reports/export` - Export data

### Cashier Endpoints

- `POST /api/sales` - Create sale
- `GET /api/products` - View products (read-only)

## 🔒 Security

- JWT-based authentication with separate secrets for Super Admin and Store users
- Schema-per-tenant data isolation
- bcrypt password hashing (12 rounds)
- Rate limiting on authentication endpoints
- Input validation on all endpoints
- SQL injection protection via Prisma ORM

## 📊 Database Architecture

- **Public Schema**: Platform-level data (tenants, super_admins, announcements)
- **Store Schemas**: Each store gets isolated schema (store_1, store_2, etc.)
- **Automatic Schema Switching**: Middleware sets `search_path` per request

## 🎯 Roadmap

- [x] Multi-tenant infrastructure
- [x] Authentication system
- [x] Super Admin panel
- [x] POS terminal
- [x] Reports & analytics
- [ ] Mobile app
- [ ] Payment gateway integration
- [ ] Advanced analytics with ML

## 📄 License

Proprietary - GroceryOS Platform

## 👥 Contact

For support and inquiries, contact the platform owner.
