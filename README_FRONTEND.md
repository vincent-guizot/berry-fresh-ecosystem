# 🍓 Berry Fresh Front-End Applications
> **Kumpulan Aplikasi Antarmuka Pengguna Ekosistem Berry Fresh**

Ekosistem Berry Fresh memiliki 4 aplikasi frontend mandiri yang terhubung langsung ke Core API:

```
berry-fresh-ecosystem/
├── shop/             # [Port 3000] Toko Online E-Commerce Pelanggan (Next.js 15 + React 19)
├── studio/           # [Port 3001] Dashboard Operasional Bisnis & CMS (Vite + React 19)
├── pos/              # [Port 3002] Aplikasi Kasir Toko Fisik / POS (Vite + React 19)
└── articles/ui/      # [Port 5173] Portal Pengetahuan & Edukasi Sains Rantai Dingin (Vite + MUI v6)
```

---

## 1. 🛒 Berry Fresh Shop (`shop/`)
**Target Pengguna:** Pelanggan umum / pembeli buah berry segar.
- **Teknologi:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **Port:** `http://localhost:3000`
- **Fitur Utama:**
  - Katalog buah langsung terhubung ke database Core via `/api/v1/catalog/products?channel=ECOMMERCE`.
  - Filter kategori varietas (Stroberi, Bluberi, Rasberi, Blakberi).
  - Keranjang belanja interaktif dengan estimasi kurir rantai dingin (Rp 25.000).
  - Checkout aman: harga dihitung ulang oleh server (server-side authority).
  - Metode pembayaran QRIS Dinamis dan Virtual Account Bank BCA.
  - Simulasi konfirmasi pembayaran seketika yang langsung memperbarui status order menjadi `PAID` dan memotong stok gudang secara permanen.
- **Cara Menjalankan:**
  ```bash
  cd shop
  npm install
  npm run dev
  ```
- **Kompilasi Produksi:** `npm run build`

---

## 2. 🏢 Berry Fresh Studio (`studio/`)
**Target Pengguna:** Manajer operasional, staf gudang, dan eksekutif bisnis.
- **Teknologi:** Vite, React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **Port:** `http://localhost:3001`
- **Fitur Utama:**
  - **Overview Operasional:** Menampilkan omzet harian (gross sales today), rincian penjualan per channel (POS, E-Commerce, B2B), suhu cold storage hub (2.1°C), dan persentase susut.
  - **Batches & Jam FEFO:** Memantau lot panen buah, jam tersisa sebelum kedaluwarsa (*First Expired, First Out*), kadar kemanisan Brix (°Bx), dan grade kualitas (Grade A).
  - **Inventaris & Write-off Susut:** Perbandingan stok antara Gudang Utama (Central Cold Storage) dan Gerai Toko, dilengkapi modal pencatatan susut/shrinkage yang langsung memotong stok di database.
  - **Rekonsiliasi Shift Kasir:** Riwayat penutupan laci kas, penerimaan penjualan, dan selisih kas fisik vs sistem.
  - **Architecture View:** Visualisasi interaktif 16 skema domain dan arsitektur event outbox.
- **Cara Menjalankan:**
  ```bash
  cd studio
  npm install
  npm run dev
  ```
- **Kompilasi Produksi:** `npm run build`

---

## 3. 📟 Berry Fresh POS (`pos/`)
**Target Pengguna:** Kasir gerai ritel fisik.
- **Teknologi:** Vite, React 19, TypeScript, Tailwind CSS, LocalStorage Offline Sync.
- **Port:** `http://localhost:3002`
- **Fitur Utama:**
  - Tombol cepat PLU (Price Look-Up) dan pencarian barcode instan.
  - **Scale Station (Catch-Weight):** Menimbang buah curah berdasarkan gramasi riil dan mengonversinya ke harga final secara otomatis.
  - **Manajemen Shift:** Buka shift kasir dengan uang modal laci (*opening float*), serta tutup shift dengan audit selisih kas fisik (*cash discrepancy audit*).
  - **Offline Session Guard:** Saat jaringan internet putus, transaksi tetap dapat diproses dan disimpan di penyimpanan lokal kasir. Begitu internet pulih, sistem otomatis melakukan sinkronisasi replay ke Core dengan pengaman idempotensi (`receipt_number`) agar tidak terjadi pemotongan stok ganda.
  - Format cetak struk kasir termal standar POS.
- **Cara Menjalankan:**
  ```bash
  cd pos
  npm install
  npm run dev
  ```
- **Kompilasi Produksi:** `npm run build`

---

## 4. 📚 Articles Knowledge Hub (`articles/ui/`)
**Target Pengguna:** Edukasi budidaya agrikultur dan pembaca umum.
- **Teknologi:** Vite, React 18, Material UI (MUI v6), Emotion.
- **Port:** `http://localhost:5173`
- **Fitur Utama:**
  - Menampilkan artikel riset rantai dingin, nutrisi antosianin, dan agronomi buah berry.
  - Filter kategori, pencarian artikel, likes, dan kolom komentar interaktif.
  - Formulir penerbitan artikel baru langsung ke database.
- **Cara Menjalankan:**
  ```bash
  cd articles/ui
  npm install
  npm run dev
  ```

---

## ⚙️ Variabel Lingkungan Front-End

Masing-masing aplikasi membaca URL Core API melalui file konfigurasi lingkungan:

| Aplikasi | File Konfigurasi | Variabel Lingkungan | Nilai Default |
|---|---|---|---|
| **Shop** | `shop/.env.local` | `NEXT_PUBLIC_CORE_API_URL` | `http://localhost:8080` |
| **Studio** | `studio/.env` | `VITE_CORE_API_URL` | `http://localhost:8080` |
| **POS** | `pos/.env` | `VITE_CORE_API_URL` | `http://localhost:8080` |
| **Articles UI** | `articles/ui/.env` | `VITE_ARTICLES_API_URL` | `http://localhost:5000` |
