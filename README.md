# 🍓 Berry Fresh — Integrated Fruit Business Ecosystem
> **Berry Good Business. Freshness Connected.**  
> Business Category: Fruit & Agricultural Business Ecosystem

An integrated digital ecosystem connecting the entire agricultural and fruit distribution lifecycle:  
**Farm → Harvest → Procurement → Receiving → Batch Tracking → Warehouse → Distribution → Retail Store → E-Commerce → Customer**

---

## 🏛 Ecosystem Architecture Overview

Berry Fresh is organized in a flat-root decoupled structure comprising five dedicated components:

```
fruit_hub/
├── core/         # Centralized Backend Modular Monolith (Go 1.24 + Fiber v3 + Neon PostgreSQL 16 Schemas + RabbitMQ)
├── shop/         # Customer E-Commerce Application (Next.js 15 + React 19 + TypeScript + Tailwind CSS)
├── studio/       # Business Management & CMS Application (Vite + React 19 + TypeScript + Tailwind CSS)
├── pos/          # Dedicated Retail Point of Sale Application (Vite + React 19 + TypeScript + Tailwind CSS)
├── articles/     # Modernized Knowledge & Educational Portal (Node.js/Express/MongoDB + Vite React/Material-UI)
└── docs/         # Architectural Blueprints, 16 Schemas Specification, and Sprint Roadmaps
```

---

## 1. 🍓 Berry Fresh Core (`core/`)
- **Technology:** Go 1.24, Fiber v3, PostgreSQL (Neon) with 16 domain schemas, pgx v5, sqlc, golang-migrate, RabbitMQ outbox worker, JWT RBAC.
- **Key Features:**
  - 16 Domain Schemas: `identity`, `governance`, `production`, `catalog`, `procurement`, `traceability`, `inventory`, `logistics`, `commerce`, `retail`, `finance`, `communication`, `content`, `analytics`, `integration`, `audit`.
  - FEFO (First Expired, First Out) batch allocator.
  - Dual Unit of Measure (UOM) engine (discrete clamshells + variable catch-weight grams).
  - Transactional Outbox Pattern relaying business events to RabbitMQ.
- **Port:** `http://localhost:8080`
- **Compile & Run:**
  ```bash
  cd core
  go run ./cmd/api
  ```

---

## 2. 🛒 Berry Fresh Shop (`shop/`)
- **Technology:** Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide icons.
- **Key Features:**
  - Product catalog filtered by berry variety.
  - Real-time shopping cart with cold-chain express delivery calculation.
  - Checkout with Indonesian payment options (Dynamic QRIS and Bank VA Transfer).
  - Automated FEFO reservation from Central Warehouse.
- **Port:** `http://localhost:3000`
- **Run:**
  ```bash
  cd shop
  npm run dev
  ```

---

## 3. 🏢 Berry Fresh Studio (`studio/`)
- **Technology:** Vite, React 19, TypeScript, Tailwind CSS.
- **Key Features:**
  - Executive Operations Overview with live sales and cold chain telemetry.
  - Batches & FEFO Clocks tracking hours until expiration, Brix ratings, and Grade A/B/C.
  - Real-time warehouse vs store inventory balances and Spoilage/Shrinkage write-offs.
  - POS Cashier Shift and cash drawer reconciliation audit.
  - 16 Domain Schemas and Transactional Outbox architecture viewer.
- **Port:** `http://localhost:3001`
- **Run:**
  ```bash
  cd studio
  npm run dev
  ```

---

## 4. 📟 Berry Fresh POS (`pos/`)
- **Technology:** Vite, React 19, TypeScript, Tailwind CSS.
- **Key Features:**
  - High-speed retail cashier interface with PLU quick-keys and barcode search.
  - Catch-Weight Scale Station for variable weighed loose berries.
  - Cashier Shift Open & Close with cash float drawer counting and discrepancy audit.
  - Cash tender with quick buttons, change calculation, and simulated Dynamic QRIS.
  - ESC/POS thermal receipt printing layout.
  - **Offline Session Guard:** Active cart and shift state are automatically preserved in `localStorage`/`IndexedDB` during brief network disconnects.
- **Port:** `http://localhost:3002`
- **Run:**
  ```bash
  cd pos
  npm run dev
  ```

---

## 5. 📚 Berry Fresh Articles Knowledge Hub (`articles/`)
*(Modernized and upgraded from the original project stack)*
- **Technology:**
  - **Server (`articles/server`):** Node.js 24+, Express 4.21, MongoDB / Mongoose 8+, CORS, REST endpoints with graceful in-memory fallback.
  - **UI (`articles/ui`):** Vite, React 18, Material-UI (MUI v6), `@emotion/react`, `@emotion/styled`.
- **Key Features:**
  - Agricultural field articles covering Cold Chain Science, Brix Sweetness Standards, Highland Blueberry Farming, and Nutritional Anthocyanins.
  - Search, fruit type chips, category filter chips, and article reader modal.
  - Interactive discussion comments and helpfulness likes.
  - In-app article publisher form.
- **Ports:** API `http://localhost:5000` | UI `http://localhost:3000` (or `http://localhost:5173`)
- **Run:**
  ```bash
  # Start API
  cd articles/server && npm run dev
  
  # Start UI
  cd articles/ui && npm run dev
  ```

---

## 📄 Documentation & Blueprints
- **Master Project Blueprint:** [`docs/architecture/BERRY_FRESH_MASTER_BLUEPRINT.md`](docs/architecture/BERRY_FRESH_MASTER_BLUEPRINT.md)
- **Database Migrations:** [`core/migrations/`](core/migrations/)

---
© 2026 Berry Fresh Holdings. Berry Good Business. Freshness Connected.
