# StockFlow MVP - Multi-Tenant SaaS Inventory Management System

StockFlow is a production-grade multi-tenant SaaS inventory tracking system designed with strict tenant data isolation, secure authentication, real-time stock valuation, and automated testing.

---

## Key Features

- **Multi-Tenancy & Data Isolation (FR-1, FR-2)**:
  - Complete tenant partitioning: Every resource (users, products, stock audit logs, settings) is scoped by `organizationId`.
  - Zero cross-tenant data leakage: Guaranteed and verified by automated integration test suites.
  - Organization-scoped SKU uniqueness: Composite database index `@@unique([organizationId, sku])` permits separate tenants to use identical SKUs without collision.

- **Enterprise Security Practices**:
  - **OWASP User Enumeration Defense**: Generic credential error responses prevent attacker discovery of registered user accounts.
  - **Rate Limiting**: `express-rate-limit` protects authentication endpoints (`/api/auth/*`) from brute-force and credential stuffing attacks.
  - **HTTP Security Headers**: `helmet` enforces protective HTTP headers across all API endpoints.
  - **Password Security**: Strong hashing with `bcryptjs` (10 rounds), length restrictions (8 to 72 characters) to guard against bcrypt DoS attacks.
  - **Fail-Safe Secrets**: Production guard prevents booting with unconfigured or default JWT secrets.

- **Inventory Tracking & Audit Logging (FR-3, FR-4, FR-5)**:
  - Full CRUD operations with server-side validation via Zod.
  - Inline stock adjustment with negative inventory prevention.
  - Immutable audit logs (`StockLog`) capturing previous quantity, new quantity, change delta, optional notes, and user attribution.
  - Dynamic low-stock threshold resolution: Falls back to organization default when product threshold is unspecified.

- **Actionable Metrics & Dashboard (FR-6)**:
  - High-level KPIs: Total Products, Total Units on Hand, Inventory Valuation (Cost & Selling), Low Stock Count.
  - Filtered table highlighting low-stock items with direct restock triggers.

---

## Architecture & Code Organization

```
VSFU/
├── backend/                       # Node.js + Express + Prisma (TypeScript)
│   ├── prisma/                    # Prisma Schema & Database Migrations
│   │   ├── schema.prisma          # Relational schema with composite indexes
│   │   └── seed.ts                # Preloaded enterprise demo data
│   ├── src/
│   │   ├── config/                # Environment configuration with fail-fast guards
│   │   ├── controllers/           # HTTP Request & Response handlers
│   │   ├── middlewares/           # JWT verification, rate limiting, error handler
│   │   ├── routes/                # Typed REST route definitions
│   │   ├── services/              # Pure business logic & multi-tenant isolation
│   │   ├── validators/            # Zod schemas for input validation
│   │   ├── app.ts                 # Decoupled Express app (exportable for tests)
│   │   └── server.ts              # Server lifecycle & graceful shutdown
│   └── tests/                     # Automated Test Suites (Vitest + Supertest)
│       ├── setup.ts               # Test lifecycle & Prisma connection management
│       ├── auth.test.ts           # Authentication & enumeration tests
│       ├── multitenancy.test.ts   # Multi-tenant boundary isolation tests
│       └── inventory.test.ts      # Product CRUD, stock adjustments & audit tests
├── frontend/                      # React 18 + Vite (TypeScript)
│   └── src/
│       ├── api/                   # Strongly typed REST client
│       ├── components/            # Reusable UI widgets & modal dialogs
│       ├── context/               # AuthContext & session management
│       ├── pages/                 # Login, Signup, Dashboard, Products, Settings
│       └── App.tsx                # App routing & protected route guards
└── scripts/                       # Supplementary manual verification scripts
```

---

## Quick Start / Running Locally

### 1. Pre-requisites
- Node.js v18+ (tested on Node.js v24 LTS)
- npm

### 2. Install & Start Everything (One Command)
```bash
# Install dependencies, generate Prisma client, push schema, seed DB, and build
npm run dev
```

Alternatively, run backend and frontend independently:

```bash
# Backend
cd backend
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev               # Runs on http://localhost:5000

# Frontend
cd frontend
npm install
npm run dev               # Runs on http://localhost:3000
```

---

## Automated Testing Suite

StockFlow features a self-contained, in-memory automated test suite powered by **Vitest** and **Supertest**. Tests run against isolated databases without requiring manual server execution:

```bash
# Run all automated tests from repository root
npm test
```

### Test Coverage Highlights:
- **`auth.test.ts`**: Verifies tenant registration, duplicate email rejection (409), password strength enforcement, generic error responses against account enumeration (401), and JWT profile resolution.
- **`multitenancy.test.ts`**: Confirms that Tenant A and Tenant B cannot view, edit, adjust stock, or delete each other's resources, while allowing identical SKUs across tenants without collision.
- **`inventory.test.ts`**: Verifies product CRUD, SKU uniqueness within an organization, positive/negative stock adjustments, audit log generation, and negative stock prevention.

---

## Preloaded Demo Account

For rapid evaluation and testing without creating a new store:
- **Email**: `demo@stockflow.com`
- **Password**: `password123`
- **Organization**: `Acme Supply Co.`
*(Preloaded with healthy inventory, low-stock alerts, and sample stock audit logs)*
