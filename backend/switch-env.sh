#!/bin/bash

# Backend Environment Switcher for Unix/Linux/macOS

echo "🔧 Backend Environment Switcher"
echo "================================"
echo "1. Local (localhost MySQL)"
echo "2. Development (Railway dev)"  
echo "3. Production (Railway prod)"
echo ""

read -p "Select environment (1-3): " choice

case $choice in
    1)
        echo "🏠 Switching to LOCAL environment..."
        cp .env.local .env
        echo "✅ Switched to LOCAL"
        echo "📋 Database: localhost:3306"
        ;;
    2)
        echo "🚧 Switching to DEVELOPMENT environment..."
        cp .env.development .env
        echo "✅ Switched to DEVELOPMENT"
        echo "📋 Database: Railway development"
        ;;
    3)
        echo "🚀 Switching to PRODUCTION environment..."
        cp .env.production .env
        echo "✅ Switched to PRODUCTION"
        echo "📋 Database: Railway production"
        echo "⚠️  Make sure to use secure SECRET_KEY!"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🔄 Restart your backend server to apply changes:"
echo "   uvicorn main:app --reload"
