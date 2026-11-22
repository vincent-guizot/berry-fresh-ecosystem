# 🍓 Berry Fresh Studio (Operations & Fulfillment Dashboard)

Dashboard operasional back-office berbasis **Vite**, **React 19**, **TypeScript**, dan **Tailwind CSS** untuk tim manajemen gudang, admin, dan supervisor rantai pasok.

---

## 🌟 Fitur Utama
1. **Executive Overview:** Telemetri penjualan hari ini, breakdown channel penjualan, metrik susut (*shrinkage*), dan suhu Central Cold Storage (2.1°C).
2. **Orders & Fulfillment Management:** Manajemen status pesanan toko online e-commerce (`PACKING` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `DELIVERED`), filter status, dan modal konfirmasi **Refund** dengan toggle:
   - 📦 *Restock ke Gudang (`RETURN` movement)*
   - 🗑️ *Tulis Buah Rusak (`SPOILAGE` movement)*
3. **Batches & FEFO Clocks:** Countdown sisa jam kedaluwarsa lot panen aktif dengan peringkat manis Brix.
4. **Stock & Shrinkage:** Perbandingan saldo fisik Central Cold Storage Pluit vs Gerai Ritel Senopati, dilengkapi modal audit penyesuaian stok (*shrinkage write-off*).
5. **POS Shifts & Cash Audit:** Rekonsiliasi modal uang laci kasir terminal POS toko fisik.
6. **Architecture View:** Visualisasi 16 skema domain dan arsitektur Event-Driven Architecture (EDA).

---

## 🏃 Menjalankan Aplikasi

```bash
cd apps/studio
npm install
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3001`.

### Variabel Lingkungan (`.env`):
```env
VITE_CORE_API_URL=http://localhost:8080
```
