# ========================================================
#   Berry Fresh - Automated Local Database Setup & Seed
# ========================================================
Write-Host "🍓 Menjalankan Setup Database, Migrasi & Seeder JSON..." -ForegroundColor Green

Push-Location "$PSScriptRoot/core"
try {
    go run ./cmd/seed/main.go
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Database berryfresh_db berhasil dibuat, dimigrasi, dan di-seed dari data JSON!" -ForegroundColor Green
    } else {
        Write-Host "`n❌ Terjadi kesalahan saat migrasi/seeding. Pastikan PostgreSQL berjalan di localhost:5432." -ForegroundColor Red
    }
} finally {
    Pop-Location
}
