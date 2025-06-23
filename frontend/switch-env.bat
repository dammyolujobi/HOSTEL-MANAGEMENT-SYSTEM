@echo off
REM Environment switcher script for Windows (Hostel Management System Frontend)

echo 🔧 Hostel Management System - Environment Switcher
echo ==================================================
echo.
echo Choose your target environment:
echo 1) Local Development (http://localhost:8000)
echo 2) Production (Railway)
echo.

set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="1" (
    echo 🔄 Switching to LOCAL DEVELOPMENT environment...
    echo NEXT_PUBLIC_API_URL=http://localhost:8000> .env.local
    echo ✅ Environment set to LOCAL DEVELOPMENT
    echo 📝 Make sure your backend is running on http://localhost:8000
    echo 🚀 Run: npm run dev
) else if "%choice%"=="2" (
    echo 🔄 Switching to PRODUCTION environment...
    echo NEXT_PUBLIC_API_URL=https://hostel-management-system-production-cc97.up.railway.app> .env.local
    echo ✅ Environment set to PRODUCTION
    echo 🚀 Run: npm run dev or npm run build
) else (
    echo ❌ Invalid choice. Please run the script again and choose 1 or 2.
    pause
    exit /b 1
)

echo.
echo 📋 Current configuration:
type .env.local
pause
