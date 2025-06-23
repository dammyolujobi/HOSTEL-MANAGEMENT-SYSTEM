from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from api.routes import users, maintenance_requests, auth

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    debug=settings.DEBUG
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://v0-frontend-build-with-next-js.vercel.app",  # Your frontend URL
        "https://*.vercel.app",
        "https://vercel.app",
        "https://*.railway.app",
        "https://*.up.railway.app",
        "*"  # Temporary - remove in production
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)
# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(maintenance_requests.router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup"""
    try:
        from database.database import engine, Base
        import models.models  # Import models module
        
        # Check if tables exist, if not create them
        from sqlalchemy import inspect
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        
        if not existing_tables or 'User' not in existing_tables:
            print("🔄 Creating database tables...")
            Base.metadata.create_all(bind=engine)
            print("✅ Database tables created successfully")
            
            # Run the database initialization script if tables were just created
            try:
                import subprocess
                import os
                init_script = os.path.join(os.path.dirname(__file__), 'init_db.py')
                if os.path.exists(init_script):
                    print("🔄 Running database initialization...")
                    subprocess.run([
                        'python', init_script
                    ], check=True, capture_output=True, text=True)
                    print("✅ Database initialization completed")
            except Exception as init_e:
                print(f"⚠️ Database initialization failed: {init_e}")
        else:
            print("✅ Database tables already exist")
            
    except Exception as e:
        print(f"⚠️ Database connection issue: {e}")
        print("Application will start but database features may not work")
        # Don't fail the startup, just log the error

@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.VERSION,
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG
    )
