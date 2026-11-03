# StockFlow MVP - Multi-Tenant SaaS Inventory Management System

StockFlow is a production-grade multi-tenant SaaS inventory tracking application built according to the **Phase 1 – 6-Hour MVP PRD**.

## Features

- **Multi-Tenancy & Security (FR-1, FR-2)**:
  - User signup and login with email, password, and Organization Name.
  - Organization record created on signup; all data (products, inventory, logs, settings) scoped by `organizationId`.
  - Passwords hashed using `bcryptjs` (10 rounds).
  - Stateless JWT authentication with automatic tenant context injection.
  - Zero cross-tenant data leakage (verified by automated multi-tenant test suite).

- **Product & Inventory Management (FR-3, FR-4)**:
  - Full CRUD for products: Name, SKU, Quantity on Hand, Cost Price, Selling Price, Low Stock Threshold, Description.
  - Composite uniqueness constraint: `[organizationId, sku]` ensures SKU uniqueness per store while allowing different stores to use identical SKUs.
  - Soft or hard delete with confirmation dialog.
  - Case-insensitive search by product name or SKU.
  - Low-stock filter toggle.

- **Quick Stock Adjustments (FR-5)**:
  - Fast inline +/- quantity adjustment modal with quick increment/decrement buttons (`+1`, `+5`, `+10`, `-1`, `-5`, `-10`).
  - Audit logging (`StockLog`) with note, updated timestamp, and user attribution.

- **Actionable Dashboard (FR-6)**:
  - Summary KPI cards: Total Products, Total Units on Hand, Inventory Valuation (Cost & Selling), Low Stock Count.
  - Dedicated "Low stock items" table displaying products where `quantity <= threshold` (with direct "Adjust Stock" action).

- **Global Settings (FR-7)**:
  - Configurable Default Low Stock Threshold (default: 5 units).
  - Organization display profile and tenant ID display.

---

## Architecture & Tech Stack

```
VSFU/
├── backend/                  # Node.js + Express (TypeScript)
│   ├── prisma/               # Prisma Schema & SQLite database
│   └── src/
│       ├── config/           # Environment variables
│       ├── controllers/      # API Controllers (Auth, Product, Dashboard, Settings)
│       ├── middlewares/      # JWT Auth & Error Handling
│       ├── routes/           # REST API routes
│       ├── services/         # Multi-tenant business logic
│       ├── validators/       # Zod input schemas
│       └── server.ts         # Express bootstrap (Port 5000)
└── frontend/                 # React 18 + Vite (TypeScript)
    └── src/
        ├── api/              # Typed API Client
        ├── components/       # Modals, StatCards, StockBadges, Layout
        ├── context/          # AuthContext with session persistence
        ├── pages/            # Login, Signup, Dashboard, Products, Settings
        └── App.tsx           # React Router with Route Guards (Port 3000)
```

---

## Quick Start / Running the App

### 1. Pre-requisites
- Node.js v18+ (tested on Node.js v24 LTS)
- npm

### 2. Backend
```bash
cd backend
npm install
npx prisma db push
npx tsx prisma/seed.ts     # Preloads demo data
npm run dev                # Starts backend API on http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev                # Starts Vite SPA on http://localhost:3000
```

---

## Preloaded Demo Account
For rapid evaluation and demoing without creating a new store:
- **Email**: `demo@stockflow.com`
- **Password**: `password123`
- **Organization**: `Acme Supply Co.`
*(Preloaded with healthy stock, low-stock warnings, and out-of-stock items)*

You can also click the **"Auto-fill Preloaded Demo Account"** button on the Login page!

---

## Automated Multi-Tenant Verification
To verify multi-tenant isolation, run:
```bash
node test_e2e_multitenancy.js
```
