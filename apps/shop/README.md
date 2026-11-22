# 🍓 Berry Fresh Shop (E-Commerce Direct-to-Consumer)

Aplikasi toko online berbasis **Next.js 15 (App Router)**, **React 19**, **TypeScript**, dan **Tailwind CSS** untuk pembelian komoditas buah berry segar berkualitas tinggi dengan jaminan rantai dingin 2°C.

---

## 🌟 Fitur Utama
1. **Master Katalog Terkoneksi:** Mengambil data produk aktif langsung dari Core API (`/api/v1/catalog/products?channel=ECOMMERCE`).
2. **Kalkulasi & Otoritas Server-Side:** Keranjang belanja memvalidasi ketersediaan stok, harga per punnet, dan ongkir rantai dingin flat Rp 25.000 di sisi backend.
3. **Pemesanan FEFO & Reservasi 30 Menit:** Saat checkout, stok lot panen terlama otomatis di-reserve selama 30 menit.
4. **Metode Pembayaran:** Dynamic QRIS (QR Server) dan Transfer Bank (BCA Virtual Account).
5. **Pembatalan Pesanan Mandiri:** Pelanggan dapat membatalkan pesanan yang belum dibayar langsung dari layar checkout.
6. **Pelacakan Pesanan Rantai Dingin (`/track`):** Pantau status pengiriman (*Pending*, *Terbayar*, *Packing 2°C*, *Kurir Pendingin*, *Terkirim*) menggunakan nomor pesanan (`BF-ORD-XXXX`).

---

## 🏃 Menjalankan Aplikasi

```bash
cd apps/shop
npm install
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`.

### Variabel Lingkungan (`.env.local`):
```env
NEXT_PUBLIC_CORE_API_URL=http://localhost:8080
```
