# 🍓 Changelog — Berry Fresh Ecosystem

All notable changes, architectural milestones, and feature progress of the **Berry Fresh Ecosystem** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v2.1.0] - 2026-11-22

### 🎯 Highlight: Commerce Lifecycle, FEFO Sweeper, Order Cancellation, Refund Restock Policy, and Cold-Chain Tracking

Pembaruan ini menuntaskan siklus hidup transaksi e-commerce secara menyeluruh dari hulu ke hilir: mulai dari pembuatan pesanan, pelepasan otomatis reservasi kadaluwarsa lewat background sweeper, pembatalan mandiri sebelum bayar, pemrosesan refund dengan kebijakan perlakuan stok buah segar, hingga orkestrasi pengiriman rantai dingin terpadu di Studio dan pelacakan pesanan pelanggan di Shop.

### 🚀 Added

#### 1. Core API Backend & Database
* **Database Migration (`000009_order_lifecycle_and_refund.up.sql`):**
  - Memperluas check constraint `commerce.orders.status` untuk mendukung 8 status siklus hidup lengkap: `'PENDING_PAYMENT'`, `'PAID'`, `'ALLOCATED'`, `'PACKING'`, `'IN_TRANSIT'`, `'DELIVERED'`, `'CANCELLED'`, `'REFUNDED'`.
  - Menambahkan kolom audit pengembalian dana: `refund_amount_cents`, `refund_reason`, dan `refunded_at`.
  - Menambahkan partial index `idx_stock_reservations_sweeper` untuk efisiensi pemindaian reservasi kadaluwarsa secara instan.
  - Menambahkan index `idx_commerce_orders_status_created` untuk optimalisasi query riwayat pesanan.
* **Background Sweeper Reservasi FEFO (`core/internal/modules/commerce/sweeper.go`):**
  - Goroutine background independen yang berjalan pada ticker berkala (interval 1 menit).
  - Memindai reservasi stok yang lewat masa tenggang 30 menit (`status = 'ACTIVE' AND expires_at < NOW()`).
  - Secara atomik membebaskan kuantitas tertahan dari `inventory.stock_balances`, menandai status reservasi `RELEASED`, mengubah status order menjadi `CANCELLED`, dan menerbitkan event outbox `order.expired`.
* **Endpoint Pembatalan Pesanan (`POST /api/v1/commerce/orders/:id/cancel`):**
  - Membatalkan pesanan yang belum dibayar (`PENDING_PAYMENT`), melepaskan alokasi stok lot FEFO, dan menerbitkan event `order.cancelled`.
* **Endpoint Refund Fleksibel (`POST /api/v1/commerce/orders/:id/refund`):**
  - Endpoint pengembalian dana pesanan terbayar (`PAID`) dengan hak akses Admin/Manager.
  - **Opsi `restock: true`:** Mengembalikan kuantitas fisik buah ke lot panen asal (`traceability.batches`) dan saldo gudang (`inventory.stock_balances`) dengan mutasi ledger `RETURN`.
  - **Opsi `restock: false`:** Menjaga standar sanitasi pangan rantai dingin; buah rusak/susut dicatat sebagai mutasi ledger `SPOILAGE` tanpa menambah saldo on-hand aktif.
* **Endpoint Fulfillment Rantai Dingin (`PATCH /api/v1/commerce/orders/:id/fulfillment`):**
  - Mengorkestrasi tahapan logistik: `PAID` $\rightarrow$ `PACKING` (pengemasan cold-pack 2°C) $\rightarrow$ `IN_TRANSIT` (kurir pendingin berangkat) $\rightarrow$ `DELIVERED` (selesai diterima).
* **Endpoint Query Riwayat Pesanan (`GET /api/v1/commerce/orders`):**
  - Query pesanan dengan filter status, pencarian nomor pesanan / nama / telepon pelanggan, pagination, dan relasi item pesanan untuk tim operasional Studio.
* **Enriched Detail Pesanan (`GET /api/v1/commerce/orders/:orderNumber`):**
  - Mengembalikan rincian lengkap komoditas pesanan, kode lot batch FEFO yang dialokasikan, alamat pengiriman, dan riwayat audit refund.

#### 2. Antarmuka Studio Operations (Vite + React 19)
* **Tab Baru "Orders & Fulfillment" (`OrdersView.tsx`):**
  - Tab navigasi sidebar baru lengkap dengan ikon truk logistik (`Truck`) dan badge *E-Comm*.
  - Filter status pesanan cepat (*Semua Pesanan, Belum Bayar, Terbayar, Packing, Dalam Pengiriman, Terkirim, Refund, Dibatalkan*).
  - Kartu pesanan interaktif menampilkan nama pelanggan, telepon, alamat pengiriman rantai dingin, item count, dan grand total.
  - Tombol aksi fulfillment cepat: *Mulai Packing Buah*, *Kirim ke Kurir Dingin*, *Tandai Terkirim Selesai*, dan *Batalkan Reservasi*.
  - Modal interaktif **Refund Pesanan** dengan pilihan kartu toggle visual:
    - 📦 *Restock ke Gudang (Gerakan Stok RETURN)*
    - 🗑️ *Tulis Buah Rusak (Gerakan Stok SPOILAGE)*

#### 3. Antarmuka Shop E-Commerce (Next.js 15)
* **Aksi Pembatalan Checkout Langsung (`shop/src/app/checkout/page.tsx`):**
  - Tombol *"Batalkan Pesanan (Release Hold)"* di layar pembayaran saat status `PENDING_PAYMENT`.
  - Indikator status real-time: `CANCELLED • RESERVATIONS RELEASED` ketika dibatalkan.
* **Halaman Pelacakan Pesanan Pelanggan (`shop/src/app/track/page.tsx`):**
  - Halaman mandiri `/track` untuk melacak status pesanan secara real-time (mendukung query param `?order=...`).
  - Bar progres visual tahapan rantai dingin (Reservasi FEFO $\rightarrow$ Pembayaran $\rightarrow$ Pengemasan 2°C $\rightarrow$ Kurir Pendingin $\rightarrow$ Terkirim).
  - Tautan navigasi *"Lacak Pesanan"* ditambahkan ke header navbar utama.

#### 4. Pengujian & Verifikasi (100% Passing)
* **Unit Tests (`core/internal/modules/commerce/commerce_test.go`):**
  - `TestOrderTotalCalculationServerSide`: Verifikasi otoritas harga server-side dan ongkir Rp 25.000.
  - `TestPaymentLifecycleStatusTransitions`: Validasi matriks transisi status siklus hidup pesanan.
  - `TestRefundRestockPolicy`: Validasi kebijakan restock (`RETURN`) vs susut pangan (`SPOILAGE`).
  - `TestReservationSweeperTimeoutDetection`: Validasi logika deteksi kadaluwarsa sweeper.
  - `TestReservationSweeperEmptyPoolGraceful`: Validasi penanganan graceful pool kosong.
* **E2E Integration Journey (`core/internal/e2e/e2e_test.go`):**
  - `TestE2E_OrderLifecycle_Cancel_Fulfillment_Refund`: Pengujian end-to-end checkout order $\rightarrow$ pembatalan unpaid order $\rightarrow$ pelepasan reservasi stok, serta checkout order $\rightarrow$ pembayaran $\rightarrow$ tahapan fulfillment logistik $\rightarrow$ refund audit dengan restock lot fisik.

---

## [v2.0.0] - 2026-11-22

### 🎯 Highlight: End-to-End Real Integration & Master Architecture Hardening

Transformasi repositori Berry Fresh dari prototipe terisolasi dengan data statis menjadi ekosistem agribisnis buah terintegrasi penuh yang nyata, aman, dan siap produksi.

### 🚀 Added

#### 1. Core API Backend & Database (Go 1.24, Fiber v3, PostgreSQL 16)
* **Automated Migration Runner (`core/internal/database/migrations.go`):**
  - Menjalankan 8 migrasi skema domain (`000001` - `000008`) secara berurutan dan otomatis saat server menyala.
* **18 File Seeder JSON (`core/seeds/`):**
  - Data master organisasi, fasilitas cold storage, gerai ritel, register POS, RBAC peran & pengguna (hash bcrypt), kategori komoditas, varietas kultivar buah, SKU produk, matriks harga POS & E-Commerce, pemasok, lahan kebun, lot panen aktif dengan Brix 9°-13° Bx, saldo stok awal, shift kasir berjalan, dan artikel riset.
* **1-Click Database Setup Launcher:**
  - `setup-db.bat` (Windows Command Prompt) dan `setup-db.ps1` (PowerShell) yang menjalankan migrasi dan seeding 18 tabel secara otomatis.
* **FEFO Inventory Allocation Engine:**
  - Pemilihan lot panen tertua berdasarkan `best_before_date` dengan row-locking (`SELECT ... FOR UPDATE OF sb`).
  - Pencatatan buku besar mutasi stok append-only yang immutable pada `inventory.stock_movements`.
* **Autentikasi & RBAC:**
  - Login JWT Access & Refresh Token dengan bcrypt.
  - Endpoint `/api/v1/auth/me` untuk validasi klaim identitas.
  - Middleware `RequireAuth` dan `RequireRoles` untuk perlindungan mutasi transaksi.
* **Retail POS Domain & Idempotency Guard:**
  - Pembukaan dan penutupan shift kasir dengan audit discrepancy uang laci.
  - Transaksi checkout ritel dengan kalkulasi catch-weight timbangan presisi gram.
  - Backend idempotency guard pada `receipt_number` untuk mencegah pemotongan stok ganda saat sinkronisasi offline.
* **Transactional Outbox Worker:**
  - Worker background yang memindai `audit.outbox_events` dan menerbitkan event ke exchange RabbitMQ `berryfresh.events`.
* **CORS Middleware Aman:**
  - Mengonfigurasi origin eksplisit (`http://localhost:3000`, `:3001`, `:3002`, `:5173`) dan kompatibilitas `AllowCredentials: true`.

#### 2. Front-End Apps Integrations
* **Shop E-Commerce (Next.js 15):**
  - Katalog buah terhubung ke Core API (`/api/v1/catalog/products?channel=ECOMMERCE`).
  - Otoritas harga dan ongkir server-side (keranjang tidak pernah dikosongkan sebelum pesanan tersimpan di database).
  - Pembayaran Dynamic QRIS dan BCA Virtual Account.
* **Point of Sale (POS) Ritel (Vite + React 19):**
  - Sinkronisasi katalog produk dan tombol cepat PLU ke database Core.
  - Manajemen modal awal laci dan shift kasir.
  - **Offline Session Guard:** Penyimpanan transaksi di `localStorage` saat internet terputus, banner visual rekoneksi (`OfflineBanner.tsx`), dan pemutaran ulang otomatis berulang (*idempotent background replay*) saat online kembali.
* **Studio Operations Dashboard (Vite + React 19):**
  - Telemetri overview penjualan kotor, breakdown channel, dan suhu cold storage (2.1°C) dari Core API.
  - FEFO Batch Expiry Clock dengan countdown jam kedaluwarsa.
  - Perbandingan stok fisik Central Cold Storage Pluit vs Gerai Toko Senopati.
  - Modal audit susut/kerusakan buah (Shrinkage Write-off) yang memotong stok secara real-time.
* **Articles & Knowledge Hub:**
  - Server Express terhubung dengan MongoDB/Mongoose dan validasi input.
  - Articles UI (React MUI v6) terhubung dengan konfigurasi environment `VITE_ARTICLES_API_URL`.

#### 3. Dokumentasi & Blueprint Arsitektur
* **[README.md](README.md):** Status badges teknologi, tabel 18 file seeder JSON, panduan setup 1-klik, matriks port service, dan troubleshooting.
* **[PANDUAN_INSTALASI_NON_IT.md](PANDUAN_INSTALASI_NON_IT.md):** Panduan langkah demi langkah bahasa Indonesia ramah pemula non-IT.
* **[DIAGRAMS_AND_FLOWS.md](docs/architecture/DIAGRAMS_AND_FLOWS.md):** Diagram alur Mermaid untuk Checkout E-Commerce FEFO dan POS Offline Synchronization.
* **[berryfresh_erd.dbml](docs/database/berryfresh_erd.dbml):** Skrip DBML lengkap 16 skema, 27 tabel, 11 enum, dan visual table group untuk [dbdiagram.io](https://dbdiagram.io).

---

## [v1.0.0] - 2026-11-21

### 🎯 Initial Architecture Setup
* Struktur monorepo multi-aplikasi:
  - `core/`: Go Fiber v3 skeleton backend.
  - `shop/`: Next.js frontend mockup.
  - `studio/`: Vite React operations dashboard prototype.
  - `pos/`: Vite React retail cashier prototype.
  - `articles/`: Node.js Express server & React UI.
* 16 Skema domain PostgreSQL terdefinisi dalam migrasi awal (`governance`, `identity`, `catalog`, `traceability`, `inventory`, `quality`, `procurement`, `production`, `sales`, `retail`, `logistics`, `commerce`, `audit`, `cold_chain`, `analytics`, `finance`).

---

© 2026 Berry Fresh Holdings. Berry Good Business. Freshness Connected.
