@echo off

REM Backend Environment Switcher for Windows

echo 🔧 Backend Environment Switcher
echo ================================
echo 1. Local (localhost MySQL)
echo 2. Development (Railway dev)
echo 3. Production (Railway prod)
echo.

set /p choice="Select environment (1-3): "

if "%choice%"=="1" (
    echo 🏠 Switching to LOCAL environment...
    copy .env.local .env >nul
    echo ✅ Switched to LOCAL
    echo 📋 Database: localhost:3306
) else if "%choice%"=="2" (
    echo 🚧 Switching to DEVELOPMENT environment...
    copy .env.development .env >nul
    echo ✅ Switched to DEVELOPMENT
    echo 📋 Database: Railway development
) else if "%choice%"=="3" (
    echo 🚀 Switching to PRODUCTION environment...
    copy .env.production .env >nul
    echo ✅ Switched to PRODUCTION
    echo 📋 Database: Railway production
    echo ⚠️  Make sure to use secure SECRET_KEY!
) else (
    echo ❌ Invalid choice
    pause
    exit /b 1
)

echo.
echo 🔄 Restart your backend server to apply changes:
echo    uvicorn main:app --reload
pause
