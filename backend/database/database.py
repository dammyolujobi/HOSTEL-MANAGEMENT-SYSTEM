from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings
import os

# For Railway deployment, use the DATABASE_URL if available
database_url = os.getenv("DATABASE_URL")
if database_url:
    # Railway provides DATABASE_URL, use it directly
    if database_url.startswith("mysql://"):
        # Convert mysql:// to mysql+mysqlconnector://
        database_url = database_url.replace("mysql://", "mysql+mysqlconnector://")
    engine_url = database_url
else:
    # Use constructed URL from settings
    engine_url = settings.DATABASE_URL

# Create database engine with Railway-optimized settings
engine = create_engine(
    engine_url,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_recycle=3600,  # Longer recycle time for Railway
    pool_timeout=30,
    max_overflow=10,
    pool_size=5,
    connect_args={
        "connect_timeout": 60,
        "read_timeout": 30,
        "write_timeout": 30,
        "charset": "utf8mb4",
        "use_unicode": True,
        "autocommit": False  # Set to False for better transaction handling
    }
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
