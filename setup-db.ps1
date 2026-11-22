# ========================================================
#   Berry Fresh - Automated Local Database Setup & Seed
# ========================================================
Write-Host "🍓 Menjalankan Setup Database, Migrasi & Seeder JSON (Port 1000)..." -ForegroundColor Green

$coreDir = if (Test-Path "$PSScriptRoot/apps/core") { "$PSScriptRoot/apps/core" } else { "$PSScriptRoot/core" }
Push-Location $coreDir
try {
    if (-not $env:DATABASE_URL) {
        $env:DATABASE_URL = "postgres://postgres:admin@localhost:1000/berryfresh_db?sslmode=disable"
    }
    go run ./cmd/seed/main.go
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Database berryfresh_db berhasil dibuat, dimigrasi, dan di-seed pada port 1000!" -ForegroundColor Green
    } else {
        Write-Host "`n❌ Terjadi kesalahan saat migrasi/seeding. Pastikan PostgreSQL berjalan di localhost:1000." -ForegroundColor Red
    }
} finally {
    Pop-Location
}
