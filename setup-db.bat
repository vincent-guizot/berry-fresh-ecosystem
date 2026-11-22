@echo off
echo ========================================================
echo   Berry Fresh - Automated Local Database Setup & Seed
echo ========================================================
echo.
cd core
go run ./cmd/seed/main.go
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Setup database gagal. Pastikan PostgreSQL sedang berjalan di localhost:5432!
    pause
    exit /b 1
)
echo.
echo [SUCCESS] Database berryfresh_db siap digunakan!
pause
