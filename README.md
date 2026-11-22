# 🍓 Berry Fresh — Integrated Fruit Business Ecosystem

[![Go Version](https://img.shields.io/badge/Go-1.24-00ADD8?style=flat&logo=go)](https://go.dev/)
[![Fiber](https://img.shields.io/badge/Fiber-v3.0.0_beta.4-00ACD7?style=flat&logo=fiber)](https://gofiber.io/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Port_1000-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.13-FF6600?style=flat&logo=rabbitmq)](https://www.rabbitmq.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker_Compose-11_Services-2496ED?style=flat&logo=docker)](https://www.docker.com/)
[![Automated Tests](https://img.shields.io/badge/E2E_&_Unit_Tests-100%25_Passing-brightgreen?style=flat)](apps/core/internal/e2e/e2e_test.go)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **Berry Good Business. Freshness Connected.**  
> Business Category: Fruit & Agricultural Business Ecosystem

An integrated digital ecosystem connecting the entire agricultural and fruit distribution lifecycle:  
**Farm → Harvest → Procurement → Receiving → Batch Tracking → Warehouse → Distribution → Retail Store → E-Commerce → Customer**

---

## 🏛 Ecosystem Architecture Overview

Repositori Berry Fresh distrukturisasi rapi ke dalam **3 folder utama**:

```
berry-fresh-ecosystem/
├── apps/                         # 📱 SELURUH APLIKASI EKOSISTEM (BACK-END & FRONT-END)
│   ├── core/                     # Central Modular Monolith (Go 1.24 + PostgreSQL Port 1000 + Outbox Worker)
│   ├── shop/                     # Customer E-Commerce (Next.js 15 + React 19 + Tailwind CSS)
│   ├── studio/                   # Enterprise Operations & CMS Dashboard (Vite + React 19 + Tailwind CSS)
│   ├── pos/                      # Retail Point of Sale Terminal (Vite + React 19 + Catch-Weight + Offline Replay)
│   └── articles/                 # Agricultural Knowledge Portal (Express + MongoDB + React MUI v6)
│       ├── server/               # REST API dengan Express & Mongoose
│       └── ui/                   # React 18 / Material UI v6 Interface
├── docs/                         # 📑 DOKUMENTASI ARSITEKTUR & BASIS DATA
│   ├── architecture/             # Diagram Alur Checkout, Arsitektur Sistem, dan Sinkronisasi Offline POS
│   └── database/                 # Schema DB, ERD Diagram, dan Catatan Query
├── panduan-instalasi/            # 📚 PANDUAN LENGKAP BAHASA INDONESIA
│   ├── README.md                 # Katalog Panduan Instalasi
│   ├── PANDUAN_INSTALASI_NON_IT.md # Panduan Langkah-demi-Langkah untuk Pemula / Non-IT
│   ├── PANDUAN_BACKEND.md        # Panduan Teknis Go 1.24, PostgreSQL Port 1000, 9 Migrasi & 18 Seeder
│   ├── PANDUAN_FRONTEND.md       # Panduan Menjalankan 4 Aplikasi Antarmuka Pengguna
│   ├── setup-db.bat              # Skrip Otomatisasi Database 1-Klik (Windows CMD)
│   └── setup-db.ps1              # Skrip Otomatisasi Database (PowerShell)
├── setup-db.bat                  # Pintasan Skrip Database di Root
├── setup-db.ps1                  # Pintasan Skrip Database di Root
└── docker-compose.yml            # Multi-container orchestration untuk seluruh 11 services
```

### 📚 Dokumentasi & Panduan Khusus
- **👤 Untuk Pengguna Pemula / Non-IT:** Baca panduan langkah demi langkah di [`panduan-instalasi/PANDUAN_INSTALASI_NON_IT.md`](panduan-instalasi/PANDUAN_INSTALASI_NON_IT.md).
- **⚙️ Panduan Back-End & Database:** Baca arsitektur & panduan teknis di [`panduan-instalasi/PANDUAN_BACKEND.md`](panduan-instalasi/PANDUAN_BACKEND.md) dan [`apps/core/README.md`](apps/core/README.md).
- **🎨 Panduan Front-End:** Baca panduan aplikasi Shop, Studio, dan POS di [`panduan-instalasi/PANDUAN_FRONTEND.md`](panduan-instalasi/PANDUAN_FRONTEND.md).
- **🌱 Setup Database & Seeder Otomatis (Port 1000):** Cukup jalankan [`setup-db.bat`](setup-db.bat) atau script [`setup-db.ps1`](setup-db.ps1).

---

## 🚀 Service Ports & Technology Matrix

| Component | Directory | Technology | Default Port | Description |
|---|---|---|---|---|
| **Core API** | `apps/core/` | Go 1.24, Fiber v3, pgx v5 | `http://localhost:8080` | Modular Monolith API with 16 domain schemas & JWT RBAC |
| **Core Worker** | `apps/core/` | Go 1.24, RabbitMQ (`amqp091-go`) | Background | Transactional Outbox Worker polling pending events |
| **Shop** | `apps/shop/` | Next.js 15, React 19, TypeScript | `http://localhost:3000` | Customer storefront with server-side pricing & FEFO checkout |
| **Studio** | `apps/studio/` | Vite, React 19, Tailwind CSS | `http://localhost:3001` | Executive operations overview, FEFO clock, balances & shrinkage write-off |
| **POS** | `apps/pos/` | Vite, React 19, Tailwind CSS | `http://localhost:3002` | Retail cashier with catch-weight scales, shift audits & offline sync |
| **Articles UI**| `apps/articles/ui/` | Vite, React, Material UI v6 | `http://localhost:5173` | Cold-chain science reader, publishing, comments & likes |
| **Articles API**| `apps/articles/server/`| Node.js 24+, Express 4.21, Mongoose | `http://localhost:5000` | Knowledge Hub REST API with MongoDB storage |
| **PostgreSQL** | Host / Dedicated | PostgreSQL 16/17 | `localhost:1000` | Basis data utama (`berryfresh_db`) pada **Port 1000** |
| **RabbitMQ** | Docker / Host | RabbitMQ 3.13 Management | `5672` / `15672` | Message broker with transactional outbox event routing |
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

### Method B: Local Development Setup (Port 1000)

#### 1. Prerequisites
- **Go:** 1.24+
- **Node.js:** 20+ / 24+ and npm 10+
- **PostgreSQL:** Service aktif di **port 1000** (user: `postgres`, password: `admin` atau sesuaikan `.env`)
- **RabbitMQ:** running on port 5672 (opsional, Core API memiliki fallback PostgreSQL Outbox)

#### 2. Setup PostgreSQL Database & Migrations (Port 1000)

Anda dapat membuat database, menjalankan 9 skrip migrasi, dan mengisi data awal cukup dengan menjalankan script 1-klik:
```bash
# Jalankan via Windows Command Prompt / Explorer:
setup-db.bat

# Atau via PowerShell:
.\setup-db.ps1

# Atau via Go CLI langsung:
cd apps/core && go run ./cmd/seed/main.go
```

Script ini otomatis memigrasikan 16 skema domain (migrasi `000001` hingga `000009`), mengonfigurasi constraint lifecycle order & refund, serta mengimpor **18 data seeder JSON** dari folder [`apps/core/internal/database/seeds/data/`](apps/core/internal/database/seeds/data/):

| No | File Seeder JSON | Target Tabel Domain | Keterangan Data Awal |
|---|---|---|---|
| 1 | `01_organizations.json` | `governance.organizations` | Holding perusahaan (*Berry Fresh Holdings*) |
| 2 | `02_facilities.json` | `governance.facilities` | Central Cold Storage Pluit & Kebun Ciwidey/Lembang/Batu |
| 3 | `03_stores.json` | `governance.stores` | Gerai toko fisik Senopati (*STORE-JKT-01*) |
| 4 | `04_cash_registers.json` | `retail.cash_registers` | Mesin terminal POS 01 (Main) & 02 (Express) |
| 5 | `05_roles.json` | `identity.roles` | Role hak akses (OWNER, ADMIN, CASHIER, dll.) |
| 6 | `06_users.json` | `identity.users` | Akun pengguna uji coba dengan password hash bcrypt |
| 7 | `07_user_roles.json` | `identity.user_roles` | Relasi penugasan role ke masing-masing pengguna |
| 8 | `08_categories.json` | `catalog.categories` | Kategori komoditas (Berries, Citrus, dll.) |
| 9 | `09_units_of_measure.json` | `catalog.units_of_measure` | Satuan ukur (kg, gram, punnet 125g, 250g, 500g, crate) |
| 10 | `10_varieties.json` | `catalog.varieties` | Varietas kultivar (Albion, Sweet Charlie, Duke, dll.) |
| 11 | `11_products.json` | `catalog.products` | Master katalog SKU stroberi, bluberi, rasberi, blakberi |
| 12 | `12_product_prices.json` | `catalog.product_prices` | Matriks harga channel POS & E-Commerce |
| 13 | `13_suppliers.json` | `procurement.suppliers` | Direktori pemasok & kelompok tani agro mitra |
| 14 | `14_farms.json` | `production.farms` | Lahan kebun dataran tinggi & sertifikasi GlobalG.A.P |
| 15 | `15_batches.json` | `traceability.batches` | Lot panen aktif dengan Brix 9°-13° Bx & jam kedaluwarsa FEFO |
| 16 | `16_stock_balances.json` | `inventory.stock_balances` | Saldo stok awal di Gudang Pluit dan Toko Senopati |
| 17 | `17_cashier_shifts.json` | `retail.cashier_shifts` | Sesi shift kasir berjalan dengan modal laci Rp 200.000 |
| 18 | `18_articles.json` | `articles` (Knowledge Hub) | Artikel edukasi riset sains rantai dingin & nutrisi |

Akun pengguna yang otomatis aktif setelah seeding:
- **Admin:** `admin@berryfresh.com` (password: `admin123`)
- **Cashier:** `cashier@berryfresh.com` (password: `pos123`)
- **Manager:** `manager@berryfresh.com` (password: `mgr123`)
- **Warehouse:** `warehouse@berryfresh.com` (password: `wh123`)
- **Customer:** `customer@berryfresh.com` (password: `cust123`)

#### 3. Start Core API Backend
```bash
cd apps/core
go run ./cmd/api
```

#### 4. Start Core Outbox Worker (Optional)
```bash
cd apps/core
go run ./cmd/worker
```

#### 5. Start Frontend Applications
Open separate terminals for each service:

```bash
# Terminal 1: Berry Fresh Shop
cd apps/shop
npm install
npm run dev
# Running on http://localhost:3000

# Terminal 2: Berry Fresh Studio
cd apps/studio
npm install
npm run dev
# Running on http://localhost:3001

# Terminal 3: Berry Fresh POS
cd apps/pos
npm install
npm run dev
# Running on http://localhost:3002

# Terminal 4: Articles Backend & Frontend
cd apps/articles/server && npm install && npm run dev
cd apps/articles/ui && npm install && npm run dev
```

---

## 🔐 Environment Variables

### Root / Docker Compose (`.env.example`)
```env
POSTGRES_DB=berryfresh_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=admin
POSTGRES_PORT=1000

RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_PORT=5672
RABBITMQ_MGMT_PORT=15672

CORE_API_PORT=8080
DATABASE_URL=postgres://postgres:admin@localhost:1000/berryfresh_db?sslmode=disable
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
JWT_ACCESS_SECRET=berryfresh_jwt_access_secret_2026_super_secure_key
JWT_REFRESH_SECRET=berryfresh_jwt_refresh_secret_2026_super_secure_key

NEXT_PUBLIC_CORE_API_URL=http://localhost:8080
VITE_CORE_API_URL=http://localhost:8080
VITE_ARTICLES_API_URL=http://localhost:5000
```

### Core API (`apps/core/.env`)
```env
APP_NAME=Berry Fresh Core
APP_ENV=development
APP_PORT=8080
DATABASE_URL=postgres://postgres:admin@localhost:1000/berryfresh_db?sslmode=disable
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

### 6. Commerce & Order Lifecycle (Shop E-Commerce)
- `GET /api/v1/commerce/orders`: Query daftar pesanan e-commerce dengan filter status (`PENDING_PAYMENT`, `PAID`, `PACKING`, `IN_TRANSIT`, `DELIVERED`, `CANCELLED`, `REFUNDED`), pencarian (nama pelanggan, nomor telepon, nomor pesanan), dan pagination.
- `POST /api/v1/commerce/orders/checkout`: Validates items, calculates server-side subtotal and Rp 25.000 cold courier fee, performs warehouse FEFO reservation in `inventory.stock_reservations` (held for 30 mins), and generates Dynamic QRIS / BCA Virtual Account. Cart is never emptied before confirmed 201 Created order persistence.
- `POST /api/v1/commerce/orders/:id/pay`: Confirms payment, commits stock reservation, permanently deducts warehouse balances, appends `inventory.stock_movements`, transitions order to `PAID`, and triggers `payment.success` outbox event.
- `POST /api/v1/commerce/orders/:id/cancel`: Pembatalan pesanan yang belum dibayar (`PENDING_PAYMENT`), melepaskan alokasi reservasi stok (`RELEASED`), dan memulihkan kuantitas `quantity_reserved_base` ke gudang.
- `POST /api/v1/commerce/orders/:id/refund`: Pengembalian dana untuk pesanan yang sudah dibayar (`PAID`). Mendukung opsi perlakuan stok:
  - `restock: true` $\rightarrow$ Mengembalikan saldo fisik ke lot batch asal dan gudang dengan mutasi ledger `RETURN`.
  - `restock: false` $\rightarrow$ Menjaga standar keamanan pangan cold-chain; dicatat sebagai susut/rusak (`SPOILAGE` movement) tanpa menambah stok on-hand aktif.
- `PATCH /api/v1/commerce/orders/:id/fulfillment`: Pembaruan status fulfillment rantai dingin: `PAID` $\rightarrow$ `PACKING` (pengemasan cold-pack 2°C) $\rightarrow$ `IN_TRANSIT` (kurir pendingin berangkat) $\rightarrow$ `DELIVERED` (selesai diterima).
- `GET /api/v1/commerce/orders/:orderNumber`: Customer order tracking and delivery status lengkap dengan item buah yang dipesan, rincian lot panen FEFO, dan audit refund.

### 7. Analytics & Studio Dashboard
- `GET /api/v1/analytics/overview`: Real-time executive metrics: gross sales today, channel breakdown (POS, E-Commerce, Manual B2B), active batches count, cold storage hub temperature (2.1°C), shrinkage percentage, and outbox queue metrics.
- **Tab Orders & Fulfillment di Studio:** Antarmuka operasional admin dan gudang untuk memantau status pesanan online, mengorkestrasi pengiriman kurir pendingin, dan memproses refund interaktif.
- **Halaman Pelacakan Pesanan di Shop (`/track`):** Halaman customer self-service untuk melacak status pesanan secara real-time, melihat timeline rantai dingin 2°C, dan membatalkan pesanan unpaid.

### 8. FEFO Stock Reservation Background Sweeper
- **Automatic Expiration Goroutine:** Core API menjalankan sweeper background berkala (interval 1 menit) untuk mendeteksi reservasi yang lewat waktu 30 menit (`expires_at < NOW() AND status = 'ACTIVE'`).
- Sweeper otomatis membebaskan kuantitas tertahan dari `inventory.stock_balances`, menandai status reservasi `RELEASED`, mengubah order menjadi `CANCELLED`, serta memicu event outbox `order.expired`.

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
cd apps/core
go test -v ./...
```

### Test Suites Included:
- **E2E Integration Journey (`apps/core/internal/e2e/e2e_test.go`):**
  - `TestE2EHealthCheck`: Validates `/health` system diagnostics.
  - `TestE2EIdentityAndRBAC`: Validates login, JWT issuance, `/me` profile claims, and unauthorized rejection.
  - `TestE2ECatalogContract`: Validates catalog filtering and POS PLU quick-keys.
  - `TestE2ECommerceJourney`: Validates customer order checkout with server-side totals, FEFO reservations, and payment status lifecycle.
  - `TestE2E_OrderLifecycle_Cancel_Fulfillment_Refund`: Validates full lifecycle: unpaid order cancellation with reservation release, cold-chain fulfillment transitions (`PACKING` -> `IN_TRANSIT` -> `DELIVERED`), refund with physical lot restocking and ledger auditing, and orders listing.
  - `TestE2EPOSRetailJourneyAndIdempotency`: Validates POS sale checkout, catch-weight calculations, and offline retry idempotency without duplicate stock deduction.
  - `TestE2EInventoryBatchesAndStudioOverview`: Validates FEFO batch sorting, shrinkage write-off with row locking, and Studio live telemetry overview.
- **Unit Tests:**
  - `apps/core/internal/modules/inventory/inventory_test.go`: FEFO sorting, stock reservation math, and reason code validation.
  - `apps/core/internal/modules/retail/retail_test.go`: Catch-weight scale gram-to-cent formula and cash drawer discrepancy reconciliation.
  - `apps/core/internal/modules/commerce/commerce_test.go`: Server-side subtotal/delivery calculation, payment transition state machine, restock vs spoilage write-off policy, and reservation sweeper timeout detection.
  - `apps/core/internal/middleware/auth_test.go`: JWT claims issuance, token verification, and RBAC matrix.
  - `apps/core/internal/database/integration_test.go`: PostgreSQL connection pool and ACID transaction rollback on Port 1000.

---

## 🛠 Troubleshooting

### 1. Database Connection Issues
- **Error:** `connect: connection refused` or `password authentication failed`.
- **Solution:** Verify `DATABASE_URL` in `apps/core/.env`. PostgreSQL berjalan di port 1000: `postgres://postgres:admin@localhost:1000/berryfresh_db?sslmode=disable`. Pastikan database `berryfresh_db` sudah dibuat menggunakan `setup-db.bat` atau `setup-db.ps1`.

### 2. RabbitMQ Refused Connection in Local Development
- **Log Notice:** `[Outbox] RabbitMQ connection notice (dial tcp [::1]:5672: connectex: ...). Events will be queued in PostgreSQL outbox.`
- **Behavior:** This is normal when developing locally without RabbitMQ running. Core automatically persists all outbox events in PostgreSQL table `audit.outbox_events` without crashing.

### 3. CORS Configuration
- **Error:** `CORS header 'Access-Control-Allow-Origin' missing` or `When 'AllowCredentials' is set to true, 'AllowOrigins' cannot contain wildcard '*'`.
- **Solution:** `apps/core/internal/middleware/cors.go` explicitly allows origins `http://localhost:3000`, `http://localhost:3001`, `http://localhost:3002`, `http://localhost:5173` while supporting additional origins configured via `CORS_ALLOW_ORIGINS`.

---

© 2026 Berry Fresh Holdings. Berry Good Business. Freshness Connected.
