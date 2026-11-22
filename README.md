# 🍓 Berry Fresh — Integrated Fruit Business Ecosystem
> **Berry Good Business. Freshness Connected.**  
> Business Category: Fruit & Agricultural Business Ecosystem

An integrated digital ecosystem connecting the entire agricultural and fruit distribution lifecycle:  
**Farm → Harvest → Procurement → Receiving → Batch Tracking → Warehouse → Distribution → Retail Store → E-Commerce → Customer**

---

## 🏛 Ecosystem Architecture Overview

Berry Fresh is organized in a decoupled modular structure comprising 5 dedicated applications and infrastructure services:

```
berry-fresh-ecosystem/
├── core/             # Centralized Backend Modular Monolith (Go 1.24 + Fiber v3 + PostgreSQL 16 + RabbitMQ + Outbox Worker)
├── shop/             # Customer E-Commerce Application (Next.js 15 + React 19 + TypeScript + Tailwind CSS)
├── studio/           # Enterprise Operations & CMS Dashboard (Vite + React 19 + TypeScript + Tailwind CSS)
├── pos/              # Dedicated Retail Point of Sale Terminal (Vite + React 19 + TypeScript + Tailwind CSS)
├── articles/         # Agricultural Knowledge & Cold-Chain Science Portal (Node.js/Express/MongoDB + React MUI v6)
│   ├── server/       # REST API with Express & Mongoose
│   └── ui/           # React 18 / MUI v6 Frontend
├── docs/             # Master Architectural Blueprints & Sprint Roadmaps
└── docker-compose.yml# Multi-container orchestration for all 11 ecosystem services
```

### 📚 Dokumentasi & Panduan Khusus
- **👤 Untuk Pengguna Pemula / Non-IT:** Baca panduan langkah demi langkah di [`PANDUAN_INSTALASI_NON_IT.md`](PANDUAN_INSTALASI_NON_IT.md).
- **⚙️ Dokumentasi Khusus Back-End:** Baca arsitektur & endpoint di [`core/README.md`](core/README.md).
- **🎨 Dokumentasi Khusus Front-End:** Baca panduan aplikasi Shop, Studio, dan POS di [`README_FRONTEND.md`](README_FRONTEND.md).
- **🌱 Setup Database & Seeder Otomatis:** Cukup jalankan [`setup-db.bat`](setup-db.bat) atau script [`setup-db.ps1`](setup-db.ps1).

---

## 🚀 Service Ports & Technology Matrix

| Component | Directory | Technology | Default Port | Description |
|---|---|---|---|---|
| **Core API** | `core/` | Go 1.24, Fiber v3, pgx v5 | `http://localhost:8080` | Modular Monolith API with 16 domain schemas & JWT RBAC |
| **Core Worker** | `core/` | Go 1.24, RabbitMQ (`amqp091-go`) | Background | Transactional Outbox Worker polling pending events |
| **Shop** | `shop/` | Next.js 15, React 19, TypeScript | `http://localhost:3000` | Customer storefront with server-side pricing & FEFO checkout |
| **Studio** | `studio/` | Vite, React 19, Tailwind CSS | `http://localhost:3001` | Executive operations overview, FEFO clock, balances & shrinkage write-off |
| **POS** | `pos/` | Vite, React 19, Tailwind CSS | `http://localhost:3002` | Retail cashier with catch-weight scales, shift audits & offline sync |
| **Articles UI**| `articles/ui/` | Vite, React, Material UI v6 | `http://localhost:5173` | Cold-chain science reader, publishing, comments & likes |
| **Articles API**| `articles/server/` | Node.js 24+, Express 4.21, Mongoose | `http://localhost:5000` | Knowledge Hub REST API with MongoDB storage |
| **PostgreSQL** | Docker / Host | PostgreSQL 16 | `localhost:5432` | Primary database (`berryfresh_db`) across 16 domain schemas |
| **RabbitMQ** | Docker / Host | RabbitMQ 3.13 Management | `5672` (AMQP) / `15672` (UI) | Message broker with transactional outbox event routing |
| **MongoDB** | Docker / Host | MongoDB 7.0 | `localhost:27017` | Document store for Articles Knowledge Hub |
| **Redis** | Docker / Host | Redis 7.2 | `localhost:6379` | Fast caching and token revocation |

---

## ⚡ Quickstart

### Method A: Docker Compose (All-in-One Deployment)

Ensure Docker and Docker Compose are installed, then run:

```bash
# 1. Clone or enter the repository
cd "Berry Fresh Ecosystem"

# 2. Copy the root environment file
cp .env.example .env

# 3. Launch all 11 services in the background
docker compose up -d --build

# 4. Check status of all containers
docker compose ps
```

Once running, access:
- **Shop:** `http://localhost:3000`
- **Studio Dashboard:** `http://localhost:3001`
- **POS Cashier:** `http://localhost:3002`
- **Articles UI:** `http://localhost:5173`
- **Core API Health:** `http://localhost:8080/health`
- **RabbitMQ Management:** `http://localhost:15672` (user: `guest`, pass: `guest`)

---

### Method B: Local Development Setup

#### 1. Prerequisites
- **Go:** 1.24+
- **Node.js:** 20+ / 24+ and npm 10+
- **PostgreSQL:** 16+ running locally on port 5432
- **RabbitMQ:** running on port 5672 (optional for local mock outbox)

#### 2. Setup PostgreSQL Database & Migrations
Create the database `berryfresh_db` in PostgreSQL:
```sql
CREATE DATABASE berryfresh_db;
```

The Core backend includes an automated migration runner (`core/internal/database/migrations.go`) that automatically executes migrations `000001` through `000008` sequentially on startup, verifying table schema integrity and seeding:
- Master Organizations (`BF-HQ`) & Facilities (`WH-JKT-MAIN`, `FARM-CWD-01`, etc.)
- Retail Store (`STORE-JKT-01`) & Cash Registers (`POS-REG-01`)
- Seed Users with bcrypt hashes:
  - **Admin:** `admin@berryfresh.com` (password: `admin123`)
  - **Cashier:** `cashier@berryfresh.com` (password: `pos123`)
  - **Manager:** `manager@berryfresh.com` (password: `mgr123`)
  - **Warehouse:** `warehouse@berryfresh.com` (password: `wh123`)
  - **Customer:** `customer@berryfresh.com` (password: `cust123`)
- Master Fruit Catalog & Varieties: Albion Strawberries, Sweet Charlie Catch-weight, Duke Blueberries, Emerald Jumbo, Heritage Raspberries, Prime-Ark Blackberries.
- Active Batches with Brix sweetness levels and expiration dates.
- Initial Warehouse and Retail Store Stock Balances.
- Active POS Cashier Shift for testing.

#### 3. Start Core API Backend
```bash
cd core
cp .env.example .env # edit DATABASE_URL if needed
go run ./cmd/api
```

#### 4. Start Core Outbox Worker (Optional)
```bash
cd core
go run ./cmd/worker
```

#### 5. Start Frontend Applications
Open separate terminals for each service:

```bash
# Terminal 1: Berry Fresh Shop
cd shop
npm install
npm run dev
# Running on http://localhost:3000

# Terminal 2: Berry Fresh Studio
cd studio
npm install
npm run dev
# Running on http://localhost:3001

# Terminal 3: Berry Fresh POS
cd pos
npm install
npm run dev
# Running on http://localhost:3002

# Terminal 4: Articles Backend & Frontend
cd articles/server && npm install && npm run dev
cd articles/ui && npm install && npm run dev
```

---

## 🔐 Environment Variables

### Root / Docker Compose (`.env.example`)
```env
POSTGRES_DB=berryfresh_db
POSTGRES_USER=berry
POSTGRES_PASSWORD=fresh_secret
POSTGRES_PORT=5432

RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_PORT=5672
RABBITMQ_MGMT_PORT=15672

CORE_API_PORT=8080
DATABASE_URL=postgres://berry:fresh_secret@postgres:5432/berryfresh_db?sslmode=disable
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
JWT_ACCESS_SECRET=berryfresh_jwt_access_secret_2026_super_secure_key
JWT_REFRESH_SECRET=berryfresh_jwt_refresh_secret_2026_super_secure_key

NEXT_PUBLIC_CORE_API_URL=http://localhost:8080
VITE_CORE_API_URL=http://localhost:8080
VITE_ARTICLES_API_URL=http://localhost:5000
```

### Core API (`core/.env`)
```env
APP_NAME=Berry Fresh Core
APP_ENV=development
APP_PORT=8080
DATABASE_URL=postgres://postgres:admin@localhost:5432/berryfresh_db?sslmode=disable
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
RABBITMQ_EXCHANGE=berryfresh.events
REDIS_URL=redis://localhost:6379/0
JWT_ACCESS_SECRET=berryfresh_jwt_access_secret_2026_super_secure_key
JWT_REFRESH_SECRET=berryfresh_jwt_refresh_secret_2026_super_secure_key
CORS_ALLOW_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:5173
```

---

## 📡 Core API Specification

### 1. Health & Telemetry
- `GET /health`: Core system readiness check, reporting database connectivity status, outbox worker state, timestamp, and version.

### 2. Identity & RBAC
- `POST /api/v1/auth/login`: Authenticate user with email and password. Returns JWT Access Token, Refresh Token, user role, organization, and assigned store.
- `GET /api/v1/auth/me`: Validates JWT Bearer token in `Authorization` header and returns current authenticated user profile and permissions.

### 3. Master Catalog
- `GET /api/v1/catalog/products`: Query sellable products with filtering (`category`, `variety`, `channel=ECOMMERCE|POS`, `search`), pagination (`page`, `limit`).
- `GET /api/v1/catalog/products/:id`: Fetch specific SKU detail, nutritional facts, and optimum storage temperature.
- `GET /api/v1/catalog/plu-quick-keys`: Quick key product map for high-speed POS cashier buttons.

### 4. Inventory & Batches (FEFO Engine)
- `GET /api/v1/inventory/batches`: Returns active harvest batches sorted by **First Expired, First Out (FEFO)** priority, showing remaining shelf life in hours, Brix sweetness ratings, and quality grade (Grade A/B/C).
- `GET /api/v1/inventory/balances`: Grouped stock balances across Central Cold Storage Warehouse and Retail Stores.
- `POST /api/v1/inventory/adjustments`: Audit-logged shrinkage write-off with atomic `SELECT ... FOR UPDATE` row locking, balance deduction, immutable stock movement ledger entry, and `inventory.adjusted` transactional outbox event.

### 5. Retail POS
- `GET /api/v1/retail/shifts/current`: Returns the currently active cashier drawer shift, register terminal code, opening cash float, total sales count, and revenue.
- `GET /api/v1/retail/shifts/history`: Reconciled history of previous cashier shifts.
- `POST /api/v1/retail/shifts/open`: Open a new cashier shift with opening cash float amount.
- `POST /api/v1/retail/shifts/close`: Close and reconcile cashier shift with actual drawer cash count, calculating cash overage/shortage discrepancy.
- `POST /api/v1/retail/sales/checkout`: Atomic checkout with server-side 11% PPN calculation, FEFO store stock deduction, receipt record, and **idempotency guard** on `receipt_number`.
- `GET /api/v1/retail/sales/qris/generate`: Dynamic QRIS string and QR code generator for Indonesian retail standard payments.

### 6. Commerce (Shop E-Commerce)
- `POST /api/v1/commerce/orders/checkout`: Validates items, calculates server-side subtotal and Rp 25.000 cold courier fee, performs warehouse FEFO reservation in `inventory.stock_reservations`, generates Dynamic QRIS / BCA Virtual Account. Cart is never emptied before confirmed 201 Created order persistence.
- `POST /api/v1/commerce/orders/:id/pay`: Confirms payment, commits stock reservation, permanently deducts warehouse balances, appends `inventory.stock_movements`, transitions order to `PAID`, and triggers `order.paid` outbox event.
- `GET /api/v1/commerce/orders/:orderNumber`: Customer order tracking and delivery status.

### 7. Analytics & Studio Dashboard
- `GET /api/v1/analytics/overview`: Real-time executive metrics: gross sales today, channel breakdown (POS, E-Commerce, Manual B2B), active batches count, cold storage hub temperature (2.1°C), shrinkage percentage, and outbox queue metrics.

---

## 🔄 Resilient Offline POS Synchronization

To ensure continuous store operations during internet interruptions:
1. **Local Transaction Caching:** When offline, POS saves completed sales to `localStorage` via `posStorage.saveOfflineSale()`.
2. **Visual Reconnection Banner:** `OfflineBanner.tsx` displays offline connection status, count of pending offline sales, and a "Sync Now" trigger.
3. **Idempotent Background Replay:** When connectivity is restored, the POS auto-replays queued sales to `POST /api/v1/retail/sales/checkout` using the unique `receipt_number`.
4. **Backend Idempotency Guard:** Core API checks `retail.pos_sales` for existing `receipt_number`. If found, it safely returns `200 OK (Idempotent response)` without double-deducting stock or duplicating shift revenue.

---

## 📦 Transactional Outbox Pattern & RabbitMQ

Berry Fresh implements the **Transactional Outbox Pattern** to prevent dual-write discrepancies between PostgreSQL commits and RabbitMQ:
1. Inside the same ACID transaction that updates inventory or creates an order/sale, an event record is inserted into `audit.outbox_events` with status `PENDING`.
2. The Outbox Worker polls pending events (`SELECT ... FOR UPDATE SKIP LOCKED`), publishes them to the RabbitMQ topic exchange (`berryfresh.events`), and marks them `PUBLISHED`.
3. In case of network failure or RabbitMQ unavailability, events remain securely queued in PostgreSQL until reconnect, with retries and eventual Dead Letter routing.

---

## 🧪 Testing & Verification

Run the comprehensive automated test suites:

```bash
# Run all Go tests in Core (Unit, Integration, and Contract E2E)
cd core
go test -v ./...
```

### Test Suites Included:
- **E2E Integration Journey (`core/internal/e2e/e2e_test.go`):**
  - `TestE2EHealthCheck`: Validates `/health` system diagnostics.
  - `TestE2EIdentityAndRBAC`: Validates login, JWT issuance, `/me` profile claims, and unauthorized rejection.
  - `TestE2ECatalogContract`: Validates catalog filtering and POS PLU quick-keys.
  - `TestE2ECommerceJourney`: Validates customer order checkout with server-side totals, FEFO reservations, and payment status lifecycle.
  - `TestE2EPOSRetailJourneyAndIdempotency`: Validates POS sale checkout, catch-weight calculations, and offline retry idempotency without duplicate stock deduction.
  - `TestE2EInventoryBatchesAndStudioOverview`: Validates FEFO batch sorting, shrinkage write-off with row locking, and Studio live telemetry overview.
- **Unit Tests:**
  - `core/internal/modules/inventory/inventory_test.go`: FEFO sorting, stock reservation math, and reason code validation.
  - `core/internal/modules/retail/retail_test.go`: Catch-weight scale gram-to-cent formula and cash drawer discrepancy reconciliation.
  - `core/internal/modules/commerce/commerce_test.go`: Server-side subtotal/delivery calculation and payment transition state machine.
  - `core/internal/middleware/auth_test.go`: JWT claims issuance, token verification, and RBAC matrix.
  - `core/internal/database/integration_test.go`: PostgreSQL connection pool and ACID transaction rollback.

---

## 🛠 Troubleshooting

### 1. Database Connection Issues
- **Error:** `connect: connection refused` or `password authentication failed`.
- **Solution:** Verify `DATABASE_URL` in `core/.env`. For local PostgreSQL, check your postgres username/password (e.g. `postgres://postgres:admin@localhost:5432/berryfresh_db?sslmode=disable`). Ensure `berryfresh_db` database exists.

### 2. RabbitMQ Refused Connection in Local Development
- **Log Notice:** `[Outbox] RabbitMQ connection notice (dial tcp [::1]:5672: connectex: ...). Events will be queued in PostgreSQL outbox.`
- **Behavior:** This is normal when developing locally without RabbitMQ running. Core automatically persists all outbox events in PostgreSQL table `audit.outbox_events` without crashing.

### 3. CORS Configuration
- **Error:** `CORS header 'Access-Control-Allow-Origin' missing` or `When 'AllowCredentials' is set to true, 'AllowOrigins' cannot contain wildcard '*'`.
- **Solution:** `core/internal/middleware/cors.go` explicitly allows origins `http://localhost:3000`, `http://localhost:3001`, `http://localhost:3002`, `http://localhost:5173` while supporting additional origins configured via `CORS_ALLOW_ORIGINS`.

---

© 2026 Berry Fresh Holdings. Berry Good Business. Freshness Connected.
