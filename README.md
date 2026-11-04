# StockFlow Pro - Commercial Multi-Tenant SaaS Inventory & POS Billing Platform

StockFlow is a production-ready, commercial-grade multi-tenant SaaS inventory management and Point-of-Sale (POS) platform designed for small-to-medium retail stores, warehouses, and wholesalers.

---

## 🚀 Commercial Features (Client-Ready)

### 1. Point of Sale (POS) Counter & Fast Billing
- **Real-Time Barcode Scanner Support**: Tap or scan products by barcode or SKU with keyboard / hardware scanner support to instantly populate customer carts.
- **Dynamic Cart Register**: Line item quantity controls, real-time stock balance validation (prevents overselling).
- **Payment Method Flexibility**: Support for Cash, UPI / QR, Card, and Credit sales.
- **Automated Inventory Deduction**: Every completed sale automatically deducts product inventory in an atomic transaction and generates a `StockLog` audit trail.
- **Printable Thermal / Standard Invoices**: Instant receipt modal with store branding, phone, address, tax breakdown, and customizable invoice footer.

### 2. Barcode & QR Code Label Generation
- Generate printable Code128 barcode labels for shelf stickers and product packaging with store name, SKU, price, and barcode graphic.
- One-click print label dialog formatted for thermal sticker printers.

### 3. Bulk CSV Product Import & Export
- **One-Click Catalog Export**: Download complete inventory spreadsheets with SKUs, valuations, and stock statuses.
- **Bulk CSV Importer**: Drag-and-drop CSV importer with downloadable sample templates to onboard 500+ products in seconds with automatic upserting.

### 4. Supplier & Vendor Management
- Directory of wholesale vendors, distributors, contact persons, phone numbers, and addresses.
- Track SKUs supplied per vendor.

### 5. Multi-Currency, GST/VAT & Store Branding
- Configurable currency symbols (`₹`, `$`, `€`, `£`, `AED`).
- Auto-calculated GST / VAT tax percentages on POS sales.
- Custom invoice headers, store physical address, and footer greetings.

### 6. Sales Analytics & Profit Tracking
- Real-time revenue aggregates, average order value, estimated gross margins, and customer order history.

---

## 🔒 Security Architecture

- **OWASP User Enumeration Defense**: Identical generic error responses prevent attacker discovery of registered user emails.
- **Rate Limiting**: `express-rate-limit` shields authentication routes from brute-force credential stuffing.
- **HTTP Security Headers**: `helmet` enforces protective headers across all endpoints.
- **Password Protection**: Hashing with `bcryptjs` (10 rounds) and 8-to-72 character enforcement to prevent bcrypt DoS.
- **Tenant Partitioning**: Strict `organizationId` scoping across all tables and composite uniqueness indexes (`[organizationId, sku]`).

---

## Architecture & Code Structure

```
VSFU/
├── backend/                       # Node.js + Express + Prisma (TypeScript)
│   ├── prisma/                    # Schema with Orders, OrderItems, Suppliers, Products
│   ├── src/
│   │   ├── config/                # Environment configuration with fail-fast guards
│   │   ├── controllers/           # Auth, Product, POS Order, Supplier, Settings
│   │   ├── middlewares/           # JWT verification, rate limiting, error handler
│   │   ├── routes/                # Typed REST route definitions
│   │   ├── services/              # Pure business logic & multi-tenant isolation
│   │   ├── validators/            # Zod input schemas
│   │   ├── app.ts                 # Decoupled Express app (exportable for tests)
│   │   └── server.ts              # Server lifecycle & graceful shutdown
│   └── tests/                     # Automated Test Suites (Vitest + Supertest)
│       ├── auth.test.ts           # Authentication & enumeration tests
│       ├── multitenancy.test.ts   # Multi-tenant boundary isolation tests
│       ├── inventory.test.ts      # Product CRUD, stock adjustments & audit tests
│       └── pos_orders.test.ts     # POS billing, stock deductions & bulk import tests
├── frontend/                      # React 18 + Vite (TypeScript)
│   └── src/
│       ├── api/                   # Strongly typed REST client (Products, Orders, Suppliers)
│       ├── components/            # BarcodeModal, BulkImportModal, ProductDetailModal, Layout
│       ├── pages/
│       │   ├── DashboardPage.tsx  # Revenue metrics & alert overview
│       │   ├── ProductsPage.tsx   # Catalog, sorting, CSV export, barcode actions
│       │   ├── PosBillingPage.tsx # Point of Sale checkout & bill printing
│       │   ├── OrdersHistoryPage.tsx # Completed sales & invoice reprints
│       │   ├── SuppliersPage.tsx  # Wholesale vendor directory
│       │   └── SettingsPage.tsx   # Store profile, tax rates & currency
│       └── App.tsx                # App routing & protected route guards
```

---

## Automated Testing Suite

StockFlow features 27 automated integration tests powered by **Vitest** and **Supertest**:

```bash
# Run all tests from root
npm test
```

---

## Running Locally

```bash
# 1. Install & build
npm install
npm run build

# 2. Start development servers
npm run dev
```

### Preloaded Demo Account:
- **Email**: `demo@stockflow.com`
- **Password**: `password123`
- **Organization**: `Acme Supply Co.`
