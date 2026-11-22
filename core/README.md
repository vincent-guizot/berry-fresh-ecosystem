# 🍓 Berry Fresh Core — Back-End Modular Monolith
> **Engine Inti Manajemen Rantai Pasok, Inventaris FEFO, Retail POS, dan E-Commerce**

Komponen backend terpusat untuk ekosistem Berry Fresh yang dibangun menggunakan **Go 1.24**, framework **Fiber v3**, driver **pgx v5**, basis data **PostgreSQL 16 (16 skema domain)**, broker pesan **RabbitMQ**, serta sistem autentikasi **JWT RBAC**.

---

## 🏛 Arsitektur Domain Back-End

Core API mengelola 16 skema domain dalam satu sistem modular monolith:
1. `identity`: Pengguna, role (`ADMIN`, `CASHIER`, `MANAGER`, `WAREHOUSE`, `CUSTOMER`), JWT token.
2. `governance`: Organisasi (`BF-HQ`), Fasilitas Cold Storage & Kebun, Toko Ritel.
3. `catalog`: Kategori buah, varietas, produk, unit of measure (UOM), matriks harga multi-channel.
4. `procurement`: Data pemasok, kontrak, dan purchase order petani.
5. `production`: Kebun mitra, elevasi, dan sertifikasi pertanian (GlobalG.A.P, Organik).
6. `traceability`: Manajemen batch panen, pencatatan kadar kemanisan Brix, tanggal kedaluwarsa, grade A/B/C.
7. `inventory`: Saldo stok gudang vs toko, reservasi sementara, mutasi stok *append-only*, dan audit susut/shrinkage.
8. `retail`: Manajemen shift kasir, rekonsiliasi laci kas, checkout POS, dan transaksi catch-weight.
9. `commerce`: Order toko online, kalkulasi subtotal/ongkir server-side, pembayaran Dynamic QRIS & Virtual Account.
10. `analytics`: Telemetri suhu cold hub (2.1°C), omzet harian, rasio susut buah.
11. `audit`: **Transactional Outbox** event table untuk penerbitan pesan ke RabbitMQ.
12. `logistics`, `finance`, `communication`, `content`, `integration`.

---

## 🚀 Persyaratan Sistem
- **Go:** versi 1.24 atau lebih baru
- **PostgreSQL:** versi 16+ (lokal pada port 5432 atau cloud Neon)
- **RabbitMQ:** (opsional, pada port 5672)

---

## ⚡ Setup Database, Migrasi & Seeder JSON

Kami menyediakan script terpadu yang otomatis memeriksa keberadaan database `berryfresh_db`, menjalankan seluruh migrasi skema `000001` - `000007`, serta mengimpor data awal dari file JSON di `core/seeds/`:

```bash
# Jalankan seeder otomatis
cd core
go run ./cmd/seed/main.go
```

Atau cukup klik dua kali file `setup-db.bat` di root direktori.

### Daftar File Seeder JSON (`core/seeds/`):
| File JSON | Target Tabel Database | Keterangan |
|---|---|---|
| `01_organizations.json` | `governance.organizations` | Profil holding perusahaan |
| `02_facilities.json` | `governance.facilities` | Gudang cold storage & kebun |
| `03_stores.json` | `governance.stores` | Gerai ritel buah segar |
| `04_cash_registers.json` | `retail.cash_registers` | Terminal mesin kasir POS |
| `05_roles.json` | `identity.roles` | Matriks hak akses RBAC |
| `06_users.json` | `identity.users` | Akun pengguna terenkripsi bcrypt |
| `07_user_roles.json` | `identity.user_roles` | Relasi role pengguna |
| `08_categories.json` | `catalog.categories` | Kategori buah & agrikultur |
| `09_units_of_measure.json`| `catalog.units_of_measure` | Satuan ukur (kg, gram, punnet) |
| `10_varieties.json` | `catalog.varieties` | Varietas kultivar buah |
| `11_products.json` | `catalog.products` | Master katalog SKU |
| `12_product_prices.json` | `catalog.product_prices` | Harga channel POS & E-Commerce |
| `13_suppliers.json` | `procurement.suppliers` | Direktori pemasok & kelompok tani |
| `14_farms.json` | `production.farms` | Lahan kebun & elevasi mdpl |
| `15_batches.json` | `traceability.batches` | Lot panen & kadar Brix |
| `16_stock_balances.json` | `inventory.stock_balances` | Saldo stok awal gudang & toko |
| `17_cashier_shifts.json` | `retail.cashier_shifts` | Sesi shift kasir aktif |
| `18_articles.json` | `articles` (Knowledge Hub) | Artikel edukasi rantai dingin |

---

## 🏃 Menjalankan Back-End

### 1. Menjalankan Core API (Port 8080)
```bash
cd core
go run ./cmd/api
```
Server akan aktif di `http://localhost:8080`.
Endpoint cek kesehatan: `http://localhost:8080/health`.

### 2. Menjalankan Transactional Outbox Worker
```bash
cd core
go run ./cmd/worker
```
Worker akan mem-polling tabel `audit.outbox_events` setiap 3 detik dan menerbitkan event ke RabbitMQ.

---

## 🧪 Menjalankan Automated Test
```bash
cd core
# Menjalankan seluruh pengujian unit, integrasi, dan E2E contract
go test -v ./...
```

---

## 📋 Daftar Endpoint Utama

- **Health Check:** `GET /health`
- **Auth:**
  - `POST /api/v1/auth/login` (body: `{ "email", "password" }`)
  - `GET /api/v1/auth/me` (header: `Authorization: Bearer <token>`)
- **Katalog:**
  - `GET /api/v1/catalog/products` (query: `channel`, `category`, `search`)
  - `GET /api/v1/catalog/plu-quick-keys` (tombol cepat kasir POS)
- **Inventaris & FEFO:**
  - `GET /api/v1/inventory/batches` (urutan FEFO & sisa jam kedaluwarsa)
  - `GET /api/v1/inventory/balances` (saldo gudang vs toko)
  - `POST /api/v1/inventory/adjustments` (audit susut/penyesuaian stok atomik)
- **POS Ritel:**
  - `GET /api/v1/retail/shifts/current`
  - `POST /api/v1/retail/shifts/open`
  - `POST /api/v1/retail/shifts/close`
  - `POST /api/v1/retail/sales/checkout` (idempotent via `receipt_number`)
- **Commerce:**
  - `POST /api/v1/commerce/orders/checkout` (kalkulasi harga & reservasi stok server-side)
  - `POST /api/v1/commerce/orders/:id/pay` (konfirmasi pembayaran)
- **Analytics:**
  - `GET /api/v1/analytics/overview` (telemetri live Studio)
