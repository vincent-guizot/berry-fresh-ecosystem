# 🍓 Panduan Instalasi & Penggunaan Berry Fresh (Untuk Pemula / Non-IT)
> **Panduan praktis langkah demi langkah untuk menjalankan ekosistem aplikasi Berry Fresh di komputer Anda.**

Selamat datang! Panduan ini dirancang khusus agar siapa pun—bahkan yang tidak memiliki latar belakang IT—dapat menginstal, menyiapkan data, dan menjalankan seluruh aplikasi Berry Fresh (Toko Online, Mesin Kasir Toko, dan Dashboard Manajemen) dengan mudah.

---

## 🧭 Gambaran Singkat Aplikasi

Berry Fresh terdiri dari 2 bagian utama:
1. **Back-End (Otak Sistem):** Pusat data yang mencatat stok buah, harga, shift kasir, dan pesanan.
2. **Front-End (Tampilan Layar):**
   - 🛒 **Toko Online (Shop):** Website belanja buah berry untuk pelanggan (di browser).
   - 📟 **Aplikasi Kasir (POS):** Layar kasir toko fisik untuk scan barcode, timbang buah, dan cetak struk.
   - 🏢 **Dashboard Manajemen (Studio):** Layar manajer untuk melihat grafik omzet, sisa kedaluwarsa buah, dan stok gudang.

---

## 🛠️ Langkah 1: Persiapan Aplikasi Pendukung (Hanya 1x Saja)

Sebelum memulai, pastikan komputer Anda telah terpasang 3 aplikasi gratis berikut. Jika sudah ada, lewati langkah ini:

1. **Node.js (Pemutar Front-End):**
   - Buka website: [https://nodejs.org](https://nodejs.org)
   - Unduh versi **LTS (Recommended for Most Users)**.
   - Buka installer yang terunduh, klik **Next** sampai selesai.

2. **Go Programming Language (Pemutar Back-End):**
   - Buka website: [https://go.dev/dl/](https://go.dev/dl/)
   - Unduh installer untuk Windows (file `.msi`).
   - Buka installer, klik **Next** sampai selesai.

3. **PostgreSQL (Tempat Penyimpanan Data):**
   - Buka website: [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
   - Unduh versi 16 atau yang terbaru.
   - Saat proses instalasi, Anda akan diminta memasukkan password untuk user `postgres` (misalnya isi: `admin`). Ingat password ini!

---

## ⚡ Langkah 2: Buat Database & Isi Data Buah Otomatis (1 Klik Saja)

Kami telah membuatkan script pintar otomatis sehingga Anda tidak perlu mengetik perintah database yang rumit:

1. Buka folder proyek **Berry Fresh Ecosystem** di File Explorer komputer Anda.
2. Cari file bernama **`setup-db.bat`**.
3. **Klik dua kali (Double-click)** file `setup-db.bat` tersebut.
4. Jendela hitam (Command Prompt) akan muncul dan otomatis:
   - Membuat database `berryfresh_db`.
   - Membuat 16 skema tabel sistem.
   - Mengisi otomatis data buah (Stroberi Albion, Bluberi Duke, Rasberi Heritage, dll.), lot panen, harga toko, akun kasir, dan stok gudang dari file JSON.
5. Bila muncul tulisan **`[SUCCESS] Database berryfresh_db siap digunakan!`**, tekan tombol apa saja di keyboard untuk menutup jendela. Selesai!

---

## 🚀 Langkah 3: Menjalankan Back-End (Pusat Data)

Back-End harus dinyalakan terlebih dahulu agar Toko Online dan Kasir dapat mengambil data:

1. Buka folder **`core`** di dalam folder proyek.
2. Di dalam folder `core`, tekan tombol keyboard `Shift` + **Klik Kanan** di area kosong, lalu pilih **"Open in Terminal"** atau **"Open PowerShell window here"**.
3. Ketik perintah berikut lalu tekan **Enter**:
   ```bash
   go run ./cmd/api
   ```
4. Jika muncul tulisan:
   ```
   🍓 Berry Fresh Core API starting on http://localhost:8080
   ```
   Artinya Pusat Data sudah menyala dan aktif! **Biarkan jendela terminal ini tetap terbuka.**

---

## 🖥️ Langkah 4: Menjalankan Aplikasi Tampilan (Front-End)

Sekarang, Anda bisa memilih aplikasi mana yang ingin Anda buka di browser:

### A. Membuka Toko Online Pelanggan (Shop)
1. Buka jendela terminal baru di folder **`shop`**.
2. Ketik perintah:
   ```bash
   npm run dev
   ```
3. Buka browser (Google Chrome / Edge) dan buka alamat: **`http://localhost:3000`**
4. Anda sudah bisa melihat katalog buah, memasukkan buah ke keranjang belanja, dan melakukan checkout simulasi dengan QRIS atau Bank Virtual Account!

---

### B. Membuka Mesin Kasir Toko (POS)
1. Buka jendela terminal baru di folder **`pos`**.
2. Ketik perintah:
   ```bash
   npm run dev
   ```
3. Buka browser dan buka alamat: **`http://localhost:3002`**
4. Anda akan masuk ke layar kasir toko. Anda bisa:
   - Membuka shift kasir dengan uang modal laci (misal Rp 200.000).
   - Memilih tombol buah PLU stroberi / bluberi.
   - Menimbang buah curah gram demi gram di stasiun timbangan.
   - Melakukan transaksi tunai atau QRIS.
   - Jika koneksi internet dimatikan, kasir tetap bisa melayani dan struk akan disimpan otomatis, lalu otomatis tersinkronisasi saat internet kembali!

---

### C. Membuka Dashboard Manajemen Operasional (Studio)
1. Buka jendela terminal baru di folder **`studio`**.
2. Ketik perintah:
   ```bash
   npm run dev
   ```
3. Buka browser dan buka alamat: **`http://localhost:3001`**
4. Anda akan melihat layar dashboard eksekutif:
   - **Overview:** Omzet penjualan hari ini, grafik channel penjualan, dan suhu lemari pendingin (2.1°C).
   - **Batches & FEFO:** Jam kedaluwarsa buah panen dan kadar manis buah (Brix 9°+).
   - **Inventory:** Sisa buah di Gudang Pluit vs Toko Senopati, serta tombol pencatatan buah busuk/susut.
   - **POS Shifts:** Riwayat setoran uang kasir harian.

---

## 🔑 Akun Login Siap Pakai

Sistem sudah dilengkapi akun uji coba yang langsung aktif:

| Peran (Role) | Alamat Email | Password | Hak Akses |
|---|---|---|---|
| **Administrator** | `admin@berryfresh.com` | `admin123` | Akses penuh ke seluruh sistem & konfigurasi |
| **Kasir Toko** | `cashier@berryfresh.com` | `pos123` | Transaksi kasir POS & buka/tutup laci uang |
| **Manajer Toko** | `manager@berryfresh.com` | `mgr123` | Rekonsiliasi kasir & audit inventaris |
| **Staf Gudang** | `warehouse@berryfresh.com` | `wh123` | Penerimaan buah & pemotongan susut |
| **Pelanggan** | `customer@berryfresh.com` | `cust123` | Belanja di toko online & riwayat order |

---

## ❓ Pertanyaan & Kendala Umum (FAQ)

### 1. Muncul pesan "password authentication failed for user 'postgres'" saat setup database
- **Penyebab:** Password database PostgreSQL Anda berbeda dengan password standar.
- **Solusi:** Buka file `core/.env` menggunakan Notepad, lalu cari baris `DATABASE_URL=postgres://postgres:admin@localhost:5432/...`. Ganti kata `admin` dengan password PostgreSQL yang Anda buat saat instalasi.

### 2. Apakah internet harus menyala?
- **Tidak harus!** Seluruh sistem ini berjalan secara lokal di komputer laptop Anda (`localhost`). Anda dapat menggunakannya bahkan saat sedang offline (tanpa koneksi internet).

### 3. Cara mematikan aplikasi jika sudah selesai
- Cukup klik pada jendela terminal yang sedang berjalan, lalu tekan tombol keyboard `Ctrl` + `C`, atau langsung tutup tanda silang (X) pada jendela terminal tersebut.
