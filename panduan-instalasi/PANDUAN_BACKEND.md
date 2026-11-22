# 🍓 Panduan Back-End Core API & Database PostgreSQL (Port 1000)
> **Panduan Teknis Arsitektur Back-End, Migrasi Skema, Seeder 18 JSON, dan Menjalankan Service Core**

Dokumen ini berisi panduan teknis mendalam untuk konfigurasi dan eksekusi layanan Back-End **Berry Fresh Core API** yang dibangun menggunakan **Go 1.24**, arsitektur **Clean Modular Monolith**, dan basis data relasional **PostgreSQL (Port 1000)**.

---

## 🏗️ 1. Arsitektur Back-End (`apps/core/`)

Layanan Core API mengelola seluruh logika bisnis sentral ekosistem Berry Fresh:
- **Port Layanan:** `http://localhost:8080`
- **Framework & Router:** Standar Go HTTP Router (`net/http`) dengan arsitektur modular tanpa framework berat.
- **Database Driver:** `github.com/lib/pq` dengan koneksi pool thread-safe.
- **Pola Desain:**
  - **Modular Monolith:** Domain terisolasi (`catalog`, `commerce`, `inventory`, `analytics`, `retail`).
  - **Transactional Outbox Pattern:** Menjamin keandalan pengiriman event asinkron antar modul tanpa *distributed transaction* (2PC).
  - **Stock Allocation Lease & Sweeper:** Reservasi stok sementara (hold timeout 15 menit) yang otomatis dikembalikan jika pelanggan tidak menyelesaikan pembayaran.
  - **Optimistic Concurrency Control:** Menggunakan `version` pada tabel inventaris untuk mencegah *race condition* dan *overselling*.

---

## ⚙️ 2. Persyaratan & Variabel Lingkungan

### A. Persyaratan Sistem
1. **Go:** Versi 1.24 atau lebih baru (`go version`).
2. **PostgreSQL:** Service aktif di port **1000** (Service bawaan sistem atau instance PostgreSQL lokal).

### B. Konfigurasi Lingkungan (`apps/core/.env`)
Salin file template `.env.example`:
```bash
cd apps/core
copy .env.example .env
```

Pastikan variabel `DATABASE_URL` mengarah ke port **1000**:
```env
PORT=8080
DATABASE_URL=postgres://postgres:admin@localhost:1000/berryfresh_db?sslmode=disable
JWT_SECRET=supersecretberryfreshkey_change_in_production
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:5173
ENVIRONMENT=development
```

---

## ⚡ 3. Otomasi Database: Migrasi & Seeder (Port 1000)

Ekosistem Berry Fresh memiliki skrip mandiri pintar yang:
1. Mengecek ketersediaan PostgreSQL di `localhost:1000`.
2. Membuat database `berryfresh_db` secara otomatis jika belum ada.
3. Menjalankan **9 skrip migrasi SQL** secara berurutan.
4. Mengimpor **18 file seeder JSON** (total 114 record master & data operasional).

### Cara Menjalankan (Pilih Salah Satu):

#### Opsi 1: Klik Dua Kali Skrip Otomatis
- Double-click file `setup-db.bat` di root direktori proyek atau di dalam folder `panduan-instalasi/`.

#### Opsi 2: Menggunakan PowerShell
```powershell
.\setup-db.ps1
```

#### Opsi 3: Eksekusi Langsung via Go CLI
```bash
cd apps/core
go run ./cmd/seed
```

### Rincian 9 Skrip Migrasi SQL:
| File Migrasi | Deskripsi Skema |
|---|---|
| `000001_init_schema.up.sql` | Tabel `products`, `categories`, `stores`, `inventory_items`, `users` |
| `000002_add_batch_and_cold_chain.up.sql` | Tabel `batches` (FEFO, Brix, suhu panen, kedaluwarsa) |
| `000003_add_pos_retail_features.up.sql` | Tabel `pos_shifts`, `cash_drawer_events`, barcode, catch-weight |
| `000004_add_outbox_events.up.sql` | Tabel `outbox_events` (Transactional Outbox Pattern) |
| `000005_add_stock_write_offs.up.sql` | Tabel `stock_write_offs` (audit susut & buah busuk) |
| `000006_create_customers.up.sql` | Tabel `customers` (loyalti pelanggan & CRM) |
| `000007_create_orders.up.sql` | Tabel `orders`, `order_items` (lifecycle e-commerce & multi-channel) |
| `000008_create_payments.up.sql` | Tabel `payments` (QRIS, VA Bank, riwayat pembayaran) |
| `000009_create_promotions.up.sql` | Tabel `promotions`, `promotion_usages` (kupon diskon & voucher) |

---

## 🚀 4. Menjalankan Layanan Back-End

### A. Menjalankan Core HTTP API Server
Buka terminal dan jalankan:
```bash
cd apps/core
go run ./cmd/api
```
Layanan akan mulai menerima request di:
```
🍓 Berry Fresh Core API starting on http://localhost:8080
[GIN-debug] Loaded 45+ endpoints across catalog, commerce, inventory, analytics, retail
```

### B. Menjalankan Outbox Worker (Pemroses Event Asinkron)
Di terminal terpisah, jalankan worker untuk memproses outbox events:
```bash
cd apps/core
go run ./cmd/worker
```
Worker akan memproses antrean `outbox_events` dan menyiarkan notifikasi serta sinkronisasi event antar modul.

---

## 🧪 5. Menjalankan Pengujian (Unit & E2E Integration Tests)

Seluruh pengujian unit dan integrasi database telah divalidasi 100% lulus pada PostgreSQL port 1000:

```bash
cd apps/core
go test -v -count=1 ./...
```

Hasil uji modul:
- `apps/core/internal/database`: Pengujian koneksi DB & eksekusi 9 migrasi.
- `apps/core/internal/middleware`: Pengujian JWT Auth & CORS handling.
- `apps/core/internal/modules/commerce`: Pengujian full lifecycle checkout, payment, cancellation, and inventory allocation hold.
- `apps/core/internal/modules/inventory`: Pengujian FEFO sorting, write-offs susut, dan pencegahan overselling.
- `apps/core/internal/modules/retail`: Pengujian buka/tutup shift kasir dan rekonsiliasi kas.
- `apps/core/internal/e2e`: Pengujian End-to-End integrasi multi-modul.

---

## 📡 6. Dokumentasi Ringkas REST API

| Modul | Method | Endpoint | Deskripsi |
|---|:---:|---|---|
| **Health** | `GET` | `/health` | Pemeriksaan kesehatan service & koneksi database |
| **Catalog** | `GET` | `/api/v1/catalog/products` | Mengambil produk buah (mendukung `?channel=ECOMMERCE` / `POS`) |
| **Catalog** | `GET` | `/api/v1/catalog/categories` | Mengambil daftar kategori varietas buah |
| **Commerce** | `POST` | `/api/v1/commerce/checkout` | Membuat pesanan baru dan mereservasi alokasi stok |
| **Commerce** | `POST` | `/api/v1/commerce/orders/:id/pay` | Konfirmasi pembayaran (mengubah status ke `PAID` & potong stok permanen) |
| **Commerce** | `POST` | `/api/v1/commerce/orders/:id/cancel`| Membatalkan pesanan dan mengembalikan alokasi stok |
| **Inventory** | `GET` | `/api/v1/inventory/batches` | Menampilkan batch FEFO, sisa jam kedaluwarsa, & kadar Brix |
| **Inventory** | `POST` | `/api/v1/inventory/write-off` | Mencatat susut buah busuk/rusak |
| **Retail** | `POST` | `/api/v1/retail/shifts/open` | Membuka shift kasir toko baru |
| **Retail** | `POST` | `/api/v1/retail/shifts/close` | Menutup shift kasir & menghitung selisih kas fisik |
| **Retail** | `POST` | `/api/v1/retail/sync` | Sinkronisasi batch transaksi offline dari aplikasi POS |
| **Analytics** | `GET` | `/api/v1/analytics/overview` | Metrik dashboard operasional Studio |
