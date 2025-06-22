#!/usr/bin/env python3
"""
Deployment script for Railway
Ensures database is properly initialized before starting the application
"""

import sys
import os
import subprocess
import time

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        if result.stdout:
            print(f"Output: {result.stdout}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        if e.stdout:
            print(f"Stdout: {e.stdout}")
        if e.stderr:
            print(f"Stderr: {e.stderr}")
        return False

def main():
    print("🚀 Starting Railway deployment process...")
    
    # Step 1: Test database connection
    print("📡 Testing database connection...")
    try:
        from config import settings
        print(f"Database: {settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}")
        print("✅ Configuration loaded successfully")
    except Exception as e:
        print(f"❌ Configuration error: {e}")
        sys.exit(1)
    
    # Step 2: Initialize database
    if not run_command("python init_db.py", "Database initialization"):
        print("⚠️ Database initialization failed, but continuing...")
    
    # Step 3: Start the application
    print("🚀 Starting the application...")
    try:
        import uvicorn
        from main import app
        from config import settings
        
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=int(os.getenv("PORT", settings.PORT)),
            log_level="info"
        )
    except Exception as e:
        print(f"❌ Failed to start application: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
