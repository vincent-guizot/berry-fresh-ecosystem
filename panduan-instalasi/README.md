# 📚 Panduan Instalasi & Menjalankan Ekosistem Berry Fresh

Selamat datang di direktori dokumentasi panduan instalasi resmi **Berry Fresh Ecosystem** dalam Bahasa Indonesia.

---

## 📂 Daftar Panduan Tersedia

| No | File Panduan | Deskripsi & Target Pengguna |
|:---:|---|---|
| 1 | [PANDUAN_INSTALASI_NON_IT.md](PANDUAN_INSTALASI_NON_IT.md) | **Panduan Lengkap untuk Non-IT / Pemula:** Instruksi langkah-demi-langkah dari mengunduh perangkat lunak (Node.js, Go, Git, PostgreSQL Port 1000) hingga menjalankan seluruh aplikasi dengan gambar dan penjelasan sederhana. |
| 2 | [PANDUAN_BACKEND.md](PANDUAN_BACKEND.md) | **Panduan Back-End & Database:** Instruksi teknis konfigurasi Go 1.24, PostgreSQL Lokal pada Port 1000, penerapan 9 skrip migrasi, impor 18 file seeder JSON, dan outbox worker. |
| 3 | [PANDUAN_FRONTEND.md](PANDUAN_FRONTEND.md) | **Panduan Front-End:** Instruksi menjalankan 4 aplikasi antarmuka (Shop Next.js port 3000, Studio port 3001, POS port 3002, dan Articles UI port 5173). |

---

## ⚡ Skrip Otomatis Database 1-Klik

Direktori ini juga menyediakan skrip untuk membuat basis data, menjalankan 9 migrasi skema, dan mengisi 18 data awal JSON ke PostgreSQL port 1000:
- **Windows Command Prompt:** Klik dua kali file [`setup-db.bat`](setup-db.bat).
- **Windows PowerShell:** Jalankan [`setup-db.ps1`](setup-db.ps1).
