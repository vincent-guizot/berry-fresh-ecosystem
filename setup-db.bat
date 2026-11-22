@echo off
echo ========================================================
echo   Berry Fresh - Automated Local Database Setup & Seed
echo ========================================================
echo.
if exist apps\core (
    cd apps\core
) else (
    cd core
)
if "%DATABASE_URL%"=="" set DATABASE_URL=postgres://postgres:admin@localhost:1000/berryfresh_db?sslmode=disable
go run ./cmd/seed/main.go
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Setup database gagal. Pastikan PostgreSQL berjalan di localhost:1000!
    pause
    exit /b 1
)
echo.
echo [SUCCESS] Database berryfresh_db siap digunakan pada port 1000!
pause
