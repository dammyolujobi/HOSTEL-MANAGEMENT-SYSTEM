#!/bin/bash

# Environment switcher script for Hostel Management System Frontend

echo "🔧 Hostel Management System - Environment Switcher"
echo "=================================================="
echo ""
echo "Choose your target environment:"
echo "1) Local Development (http://localhost:8000)"
echo "2) Production (Railway - https://hostel-management-system-production-cc97.up.railway.app)"
echo ""

read -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        echo "🔄 Switching to LOCAL DEVELOPMENT environment..."
        echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
        echo "✅ Environment set to LOCAL DEVELOPMENT"
        echo "📝 Make sure your backend is running on http://localhost:8000"
        echo "🚀 Run: npm run dev"
        ;;
    2)
        echo "🔄 Switching to PRODUCTION environment..."
        echo "NEXT_PUBLIC_API_URL=https://hostel-management-system-production-cc97.up.railway.app" > .env.local
        echo "✅ Environment set to PRODUCTION"
        echo "🚀 Run: npm run dev or npm run build"
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again and choose 1 or 2."
        exit 1
        ;;
esac

echo ""
echo "📋 Current configuration:"
cat .env.local
