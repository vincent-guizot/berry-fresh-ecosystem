# 🍓 Berry Fresh — Architectural Diagrams & Transaction Flows

Dokumen ini memuat diagram alur teknis interaktif (**Mermaid Diagrams**) untuk dua perjalanan transaksi paling krusial dalam ekosistem Berry Fresh:
1. **Alur Checkout E-Commerce (Shop) dengan Otoritas Harga Server-Side & FEFO Reservation**
2. **Alur Kasir Ritel (POS) dengan Offline Session Guard & Sinkronisasi Idempoten**

---

## 1. Alur Checkout E-Commerce (Shop) & FEFO Reservation

Diagram ini mengilustrasikan perjalanan dari saat pelanggan memilih buah di web store Next.js, pembuatan reservasi lot panen tertua (FEFO), otorisasi pembayaran (Dynamic QRIS / Bank VA), pemotongan stok permanen, hingga penerbitan event RabbitMQ melalui Transactional Outbox.

### 1.1 Diagram Sequence (Interaksi Sistem)

```mermaid
sequenceDiagram
    autonumber
    actor Customer as 🛒 Customer (Browser)
    participant Shop as 🌐 Berry Fresh Shop (Next.js)
    participant Core as 🍓 Core API (Fiber v3)
    participant DB as 🐘 PostgreSQL 16 (ACID Tx)
    participant Outbox as 📦 Outbox Worker
    participant RMQ as 🐇 RabbitMQ Broker

    Customer->>Shop: Pilih Produk (contoh: Stroberi Albion 250g)
    Shop->>Shop: Simpan item di Client Cart (Jangan percaya harga/total client)
    Customer->>Shop: Klik "Checkout" & Isi Alamat Pengiriman
    Shop->>Core: POST /api/v1/commerce/orders/checkout (items, customer, payment_method)
    
    activate Core
    Core->>DB: BEGIN TRANSACTION
    Core->>DB: Query catalog.products & catalog.product_prices (Hitung Subtotal Server-side)
    Core->>Core: Enforce Ongkir Rantai Dingin Standar Rp 25.000
    
    Note over Core,DB: FEFO Allocation & Row Locking
    Core->>DB: SELECT ... FROM inventory.stock_balances WHERE facility=Warehouse FOR UPDATE
    Core->>DB: INSERT INTO inventory.stock_reservations (status='ACTIVE', expires_in=15m)
    Core->>DB: INSERT INTO commerce.orders (status='PENDING_PAYMENT', total_amount)
    Core->>DB: INSERT INTO commerce.order_items (product_id, batch_id, line_total)
    Core->>DB: COMMIT TRANSACTION
    deactivate Core

    Core-->>Shop: 201 Created (order_number, total, qr_string / va_number)
    Shop->>Shop: Simpan Order ID & KOSONGKAN Keranjang Belanja
    Shop-->>Customer: Tampilkan Layar Pembayaran (Dynamic QRIS / BCA Virtual Account)

    Customer->>Shop: Konfirmasi Pembayaran (Scan QRIS / Transfer VA)
    Shop->>Core: POST /api/v1/commerce/orders/:id/pay
    
    activate Core
    Core->>DB: BEGIN TRANSACTION
    Core->>DB: UPDATE inventory.stock_reservations SET status='COMMITTED'
    Core->>DB: UPDATE inventory.stock_balances (Potong qty_on_hand gudang)
    Core->>DB: INSERT INTO inventory.stock_movements (type='ECOMMERCE_SALE')
    Core->>DB: UPDATE commerce.orders SET status='PAID', paid_at=NOW()
    Core->>DB: INSERT INTO audit.outbox_events (event_type='order.paid', status='PENDING')
    Core->>DB: COMMIT TRANSACTION
    deactivate Core

    Core-->>Shop: 200 OK (status='PAID')
    Shop-->>Customer: Status "Pembayaran Berhasil! Pesanan Sedang Dikemas"

    loop Outbox Worker Loop (Tiap 3 detik)
        Outbox->>DB: SELECT * FROM audit.outbox_events WHERE status='PENDING' FOR UPDATE SKIP LOCKED
        Outbox->>RMQ: Publish message ke Exchange 'berryfresh.events'
        Outbox->>DB: UPDATE audit.outbox_events SET status='PUBLISHED'
    end
```

### 1.2 Diagram Alur Logika (Flowchart)

```mermaid
flowchart TD
    Start(["Mulai Checkout"]) --> SubmitPayload["Shop mengirim payload items & alamat ke Core"]
    SubmitPayload --> ServerCalc["Core hitung ulang subtotal & enforce ongkir Rp 25.000"]
    ServerCalc --> CheckStock{"Stok gudang tersedia?"}
    
    CheckStock -- Tidak --> Return400["Kembalikan 400 Bad Request: Stok Tidak Mencukupi"]
    CheckStock -- Ya --> LockBatch["Row Locking (SELECT FOR UPDATE) pada lot panen FEFO tertua"]
    
    LockBatch --> CreateReservation["Buat Reservasi di inventory.stock_reservations"]
    CreateReservation --> CreateOrder["Buat Order dengan status PENDING_PAYMENT"]
    CreateOrder --> GeneratePayment["Generate Dynamic QRIS / VA Number"]
    GeneratePayment --> Return201["Respon 201 Created ke Frontend"]
    
    Return201 --> ClearCart["Frontend KOSONGKAN Cart & Render QRIS/VA"]
    ClearCart --> AwaitPayment{"Pelanggan membayar?"}
    
    AwaitPayment -- Tidak / Timeout --> ReleaseHold["Reservasi Kedaluwarsa: Stok Dikembalikan"]
    AwaitPayment -- Ya --> CommitStock["Komit Reservasi & Potong Saldo Stok Gudang"]
    
    CommitStock --> AppendLedger["Catat di Append-Only inventory.stock_movements"]
    AppendLedger --> SetPaid["Update Order status = PAID"]
    SetPaid --> EmitOutbox["Tulis Event 'order.paid' ke Transactional Outbox"]
    EmitOutbox --> RMQPublish["RabbitMQ menerbitkan event ke logistik / gudang"]
    RMQPublish --> End(["Selesai"])
```

---

## 2. Alur Kasir Ritel (POS) & Offline Session Guard

Diagram ini mengilustrasikan mekanisme keandalan kasir toko fisik: bagaimana kasir tetap dapat memindai barcode, menimbang buah curah (*catch-weight*), melayani pembeli saat koneksi internet putus, menyimpan transaksi ke penyimpanan lokal (*local storage cache*), dan melakukan sinkronisasi otomatis (*idempotent background replay*) saat internet pulih.

### 2.1 Diagram Alur Kerja Kasir & Offline Sync

```mermaid
sequenceDiagram
    autonumber
    actor Cashier as 📟 Kasir Ritel
    participant POS as 💻 POS Terminal (Vite React)
    participant LocalDB as 💾 LocalStorage (Offline Cache)
    participant Core as 🍓 Core API (Fiber v3)
    participant DB as 🐘 PostgreSQL 16
    participant RMQ as 🐇 RabbitMQ

    Note over Cashier,POS: Buka Shift Kasir Pagi
    Cashier->>POS: Masukkan Modal Kas Laci (Opening Float Rp 200.000)
    POS->>Core: POST /api/v1/retail/shifts/open
    Core->>DB: INSERT INTO retail.cashier_shifts (status='OPEN')
    Core-->>POS: 201 Created (shift_id)

    Note over Cashier,POS: Transaksi Penjualan Normal (Online)
    Cashier->>POS: Scan Barcode / Input Timbangan Buah Curah (Scale Catch-Weight)
    POS->>POS: Hitung Gramasi x Harga/kg + PPN 11%
    Cashier->>POS: Tekan Bayar (Cash / QRIS)
    POS->>Core: POST /api/v1/retail/sales/checkout (receipt_number='REC-001')
    Core->>DB: Deduct Toko Stock (FEFO) + Insert retail.pos_sales + Outbox Event
    Core-->>POS: 200 OK (struk terkonfirmasi)
    POS-->>Cashier: Cetak Struk Belanja Pelanggan

    Note over POS,Core: ⚡ KONEKSI INTERNET TERPUTUS (OFFLINE) ⚡
    Cashier->>POS: Transaksi Berikutnya (Pelanggan berikutnya di antrean)
    Cashier->>POS: Tekan Bayar
    POS->>Core: POST /api/v1/retail/sales/checkout (Gagal / Network Timeout)
    activate POS
    POS->>LocalDB: saveOfflineSale(receipt_number='REC-002', payload)
    POS->>POS: Munculkan Banner Kuning: "Offline Mode (1 transaksi tersimpan)"
    POS-->>Cashier: Cetak Struk Transaksi Lokal (Pelanggan tidak perlu menunggu!)
    deactivate POS

    Note over POS,Core: 🌐 KONEKSI INTERNET PULIH (ONLINE) 🌐
    activate POS
    POS->>POS: Event 'online' terdeteksi oleh browser window
    POS->>LocalDB: loadOfflineSales() (Dapatkan daftar transaksi pending)
    
    loop Replay Setiap Transaksi Tertunda
        POS->>Core: POST /api/v1/retail/sales/checkout (receipt_number='REC-002')
        activate Core
        Note over Core,DB: Idempotency Verification
        Core->>DB: SELECT id FROM retail.pos_sales WHERE receipt_number='REC-002'
        alt Belum Ada di DB (Transaksi Baru)
            Core->>DB: Simpan Sale + Potong Stok Toko + Update Shift Revenue
            Core-->>POS: 200 OK
        else Sudah Ada di DB (Duplicate Retry)
            Core-->>POS: 200 OK (Idempotent response - Stok TIDAK dipotong ganda)
        end
        deactivate Core
        POS->>LocalDB: removeOfflineSale('REC-002')
    end

    POS->>POS: Banner berubah Hijau: "Semua data tersinkronisasi" (Badge 0)
    deactivate POS

    Note over Cashier,POS: Tutup Shift Kasir Malam
    Cashier->>POS: Hitung Fisik Kas Laci (Tutup Shift)
    POS->>Core: POST /api/v1/retail/shifts/close (actual_cash)
    Core->>DB: Rekonsiliasi (Expected vs Actual Cash) -> Status 'RECONCILED'
    Core->>DB: INSERT INTO audit.outbox_events (event_type='shift.closed')
    Core-->>POS: 200 OK (Menampilkan selisih kas fisik Rp 0 / selisih wajar)
```

### 2.2 Diagram Status Transaksi Kasir (State Machine)

```mermaid
stateDiagram-v2
    [*] --> Idle: Buka Terminal Kasir
    Idle --> Scanning: Tambah Item / Timbang Skala
    Scanning --> Payment: Pilih Metode Pembayaran (Tunai / QRIS)
    
    Payment --> TryOnline: Kirim ke Core API
    
    state TryOnline {
        [*] --> Sending
        Sending --> OnlineSuccess: Respon 200 OK
        Sending --> ConnectionFailed: Timeout / Network Error
    }
    
    OnlineSuccess --> PrintReceipt: Transaksi Terverifikasi di PostgreSQL
    ConnectionFailed --> LocalStorageSave: Simpan ke LocalStorage
    
    LocalStorageSave --> PrintOfflineReceipt: Cetak Struk Offline
    PrintOfflineReceipt --> QueueWait: Antrean Offline Bertambah (+1)
    
    QueueWait --> ConnectionRestored: Sinyal Internet Pulih
    ConnectionRestored --> IdempotentReplay: Kirim Ulang dengan receipt_number asli
    
    IdempotentReplay --> BackendCheck: Cek Idempotensi di Backend
    BackendCheck --> SyncComplete: Berhasil Sinkron & Hapus dari LocalStorage
    
    SyncComplete --> Idle: Siap Melayani Transaksi Baru
    PrintReceipt --> Idle: Selesai
```
