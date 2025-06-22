#!/usr/bin/env python3
"""
Startup script for the Hostel Management System Backend
"""
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def install_dependencies():
    """Install required dependencies"""
    import subprocess
    print("Installing dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False
    return True

def check_database_connection():
    """Check if database connection is working"""
    try:
        from database.database import engine
        from sqlalchemy import text
        
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("✅ Database connection successful")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("Please check your database configuration in .env file")
        return False

def create_tables():
    """Create database tables"""
    try:
        from database.database import engine, Base
        import models.models  # Import models module
        
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to create tables: {e}")
        return False

def run_server():
    """Run the FastAPI server"""
    try:
        import uvicorn
        from config import settings
        
        print(f"🚀 Starting {settings.APP_NAME} v{settings.VERSION}")
        print(f"📱 Server will be available at: http://localhost:{settings.PORT}")
        print(f"📚 API Documentation: http://localhost:{settings.PORT}/docs")
        
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=settings.PORT,
            reload=settings.DEBUG
        )
    except Exception as e:
        print(f"❌ Failed to start server: {e}")

def main():
    """Main startup function"""
    print("🏢 Hostel Management System Backend")
    print("=" * 40)
    
    # Check if running in development mode
    if "--install" in sys.argv:
        if not install_dependencies():
            sys.exit(1)
    
    if "--check-db" in sys.argv:
        if not check_database_connection():
            sys.exit(1)
    
    if "--create-tables" in sys.argv:
        if not create_tables():
            sys.exit(1)
    
    # Default action: run server
    if len(sys.argv) == 1 or "--run" in sys.argv:
        run_server()

if __name__ == "__main__":
    main()
