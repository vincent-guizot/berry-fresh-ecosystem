# 🍓 Berry Fresh POS (Point of Sale Ritel)

Aplikasi kasir gerai fisik toko buah berbasis **Vite**, **React 19**, **TypeScript**, dan **Tailwind CSS**, dioptimalkan untuk kecepatan transaksi kasir dengan perlindungan luring (*offline session guard*).

---

## 🌟 Fitur Utama
1. **Sinkronisasi Katalog & Quick Keys:** Mengambil data produk dan PLU langsung dari Core API (`/api/v1/catalog/plu-quick-keys`).
2. **Kalkulasi Catch-Weight:** Perhitungan otomatis bobot gram timbangan buah ke harga satuan rupiah secara akurat.
3. **Manajemen Shift Kasir:** Buka/tutup shift kasir dengan pencatatan modal awal laci kas (*cash float*) dan rekonsiliasi selisih kas.
4. **Metode Pembayaran Kasir:** Tunai (*Cash Tender*) dengan rekomendasi uang pas & pecahan cepat, serta Dynamic QRIS.
5. **Offline Session Guard & Idempotent Sync:**
   - Saat internet terputus, transaksi tetap dapat diproses dan disimpan di `localStorage`.
   - Banner rekoneksi visual menampilkan jumlah transaksi luring tertunda.
   - Saat online kembali, transaksi otomatis diputar ulang (*replay*) ke Core API dengan proteksi idempoten `receipt_number` agar saldo stok tidak terpotong ganda.

---

## 🏃 Menjalankan Aplikasi

```bash
cd apps/pos
npm install
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3002`.

### Variabel Lingkungan (`.env`):
```env
VITE_CORE_API_URL=http://localhost:8080
```
