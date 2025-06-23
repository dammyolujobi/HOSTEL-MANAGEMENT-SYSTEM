from sqlalchemy import create_engine, event, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import DisconnectionError, OperationalError, SQLAlchemyError
from sqlalchemy.pool import StaticPool
import logging
from config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment-specific engine configuration
def get_engine_config():
    """Get database engine configuration based on environment"""    
    base_config = {
        "echo": False,  # Changed from settings.DEBUG to False to reduce SQL logging
        "pool_pre_ping": True,
        "pool_recycle": settings.DB_POOL_RECYCLE,
        "pool_timeout": 20,
        "max_overflow": settings.DB_MAX_OVERFLOW,
        "pool_size": settings.DB_POOL_SIZE,
    }
    
    if settings.ENVIRONMENT == "production":
        # Railway MySQL optimized settings
        base_config.update({
            "connect_args": {
                "connect_timeout": settings.DB_CONNECTION_TIMEOUT,
                "read_timeout": settings.DB_CONNECTION_TIMEOUT,
                "write_timeout": settings.DB_CONNECTION_TIMEOUT,
                "charset": "utf8mb4",
                "autocommit": False,
                "sql_mode": "TRADITIONAL"
            }
        })
    elif settings.ENVIRONMENT == "local":
        # Local MySQL settings
        base_config.update({
            "connect_args": {
                "connect_timeout": settings.DB_CONNECTION_TIMEOUT,
                "charset": "utf8mb4",
                "autocommit": False
            }
        })
    else:
        # Development settings
        base_config.update({
            "connect_args": {
                "connect_timeout": settings.DB_CONNECTION_TIMEOUT,
                "charset": "utf8mb4",
                "autocommit": False
            }
        })
    
    return base_config

# Create database engine with environment-specific configuration
engine_config = get_engine_config()
engine = create_engine(settings.DATABASE_URL, **engine_config)

# Add connection event listeners for better error handling
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Set connection-specific settings"""
    if settings.ENVIRONMENT == "production":
        # Railway-specific optimizations
        try:
            with dbapi_connection.cursor() as cursor:
                cursor.execute("SET SESSION wait_timeout = 1800")  # 30 minutes
                cursor.execute("SET SESSION interactive_timeout = 1800")
                cursor.execute("SET SESSION sql_mode = 'TRADITIONAL'")
        except Exception as e:
            logger.warning(f"Could not set MySQL session variables: {e}")

@event.listens_for(engine, "checkout")
def ping_connection(dbapi_connection, connection_record, connection_proxy):
    """Test connections before use"""
    try:
        dbapi_connection.ping(reconnect=False)
    except Exception:
        # Connection is invalid, invalidate it
        logger.warning("Database connection failed ping test, invalidating")
        raise DisconnectionError()

# Create SessionLocal class with better error handling
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

# Improved dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        # Test the connection
        db.execute(text("SELECT 1"))
        yield db
    except (DisconnectionError, OperationalError) as e:
        logger.error(f"Database connection error: {e}")
        db.rollback()
        db.close()
        
        # Try to create a new session with exponential backoff
        import time
        for attempt in range(3):
            try:
                time.sleep(2 ** attempt)  # 0, 2, 4 seconds
                db = SessionLocal()
                db.execute(text("SELECT 1"))
                logger.info(f"Database reconnected on attempt {attempt + 1}")
                yield db
                break
            except Exception as retry_e:
                if attempt == 2:  # Last attempt
                    logger.error(f"All database reconnection attempts failed: {retry_e}")
                    raise retry_e
                db.close()
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error: {e}")
        db.rollback()
        raise e
    except Exception as e:
        logger.error(f"Unexpected database error: {e}")
        db.rollback()
        raise e
    finally:
        try:
            db.close()
        except Exception as close_e:
            logger.error(f"Error closing database session: {close_e}")

# Health check function
def check_database_health():
    """Check if database is accessible"""
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False
