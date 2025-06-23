from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import logging
import os
from config import settings
from api.routes import users, maintenance_requests, auth
from database.database import check_database_health

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.ENVIRONMENT == "production" else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create FastAPI app with environment-specific configuration
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    debug=settings.DEBUG,
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,  # Disable docs in production
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None
)

# Configure CORS with environment-specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS_LIST,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)
# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(maintenance_requests.router, prefix="/api/v1")

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error" if settings.ENVIRONMENT == "production" else str(exc)
        }
    )

@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.VERSION}")
    logger.info(f"🌍 Environment: {settings.ENVIRONMENT}")
    logger.info(f"🔧 Debug mode: {settings.DEBUG}")
    
    # Check database connection
    if not check_database_health():
        logger.error("❌ Database connection failed during startup")
        if settings.ENVIRONMENT == "production":
            raise Exception("Database connection required for production startup")
        else:
            logger.warning("⚠️ Continuing startup without database (development mode)")
    else:
        logger.info("✅ Database connection verified")
    
    # Initialize database tables if needed
    try:
        from database.database import engine, Base
        import models.models  # Import models to register them
        
        # Check if tables exist
        from sqlalchemy import inspect
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        
        if not existing_tables or 'User' not in existing_tables:
            logger.info("🔄 Creating database tables...")
            Base.metadata.create_all(bind=engine)
            logger.info("✅ Database tables created successfully")
        else:
            logger.info("✅ Database tables already exist")
            
    except Exception as e:
        logger.error(f"⚠️ Database initialization issue: {e}")
        if settings.ENVIRONMENT == "production":
            raise e
        else:
            logger.warning("Application will start but database features may not work")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("🛑 Shutting down application")

@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "docs": "/docs" if settings.ENVIRONMENT != "production" else "Documentation disabled in production"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    db_healthy = check_database_health()
    
    health_status = {
        "status": "healthy" if db_healthy else "unhealthy",
        "environment": settings.ENVIRONMENT,
        "version": settings.VERSION,
        "database": "connected" if db_healthy else "disconnected"
    }
    
    if not db_healthy and settings.ENVIRONMENT == "production":
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    return health_status

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG
    )
