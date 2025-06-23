from pydantic_settings import BaseSettings
from pydantic import field_validator, computed_field
from typing import List, Optional
import os
from dotenv import load_dotenv
from urllib.parse import quote_plus

load_dotenv()

class Settings(BaseSettings):
    # Environment detection
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")  # development, production, local
    
    # Database components with environment-specific defaults
    DB_HOST: str = os.getenv("DB_HOST", "localhost" if os.getenv("ENVIRONMENT") == "local" else "hopper.proxy.rlwy.net")
    DB_PORT: int = int(os.getenv("DB_PORT", "3306" if os.getenv("ENVIRONMENT") == "local" else "14988"))
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "RBSkzqpuAeCGdVankDFOXPbNSlEXybHS")
    DB_NAME: str = os.getenv("DB_NAME", "hostel_management" if os.getenv("ENVIRONMENT") == "local" else "railway")
    DB_CHARSET: str = "utf8mb4"
    
    # Database connection settings based on environment
    @computed_field
    @property
    def DB_CONNECTION_TIMEOUT(self) -> int:
        if self.ENVIRONMENT == "production":
            return 20  # Shorter timeout for Railway
        elif self.ENVIRONMENT == "local":
            return 60  # Longer timeout for local dev
        return 30  # Default for development
    
    @computed_field
    @property 
    def DB_POOL_SIZE(self) -> int:
        if self.ENVIRONMENT == "production":
            return 3  # Smaller pool for Railway
        return 5  # Larger pool for local/dev
    
    @computed_field
    @property
    def DB_MAX_OVERFLOW(self) -> int:
        if self.ENVIRONMENT == "production":
            return 2  # Conservative overflow for Railway
        return 10  # More overflow for local/dev
    
    @computed_field
    @property
    def DB_POOL_RECYCLE(self) -> int:
        if self.ENVIRONMENT == "production":
            return 1800  # 30 minutes for Railway (connection timeout)
        return 3600  # 1 hour for local/dev    
    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-this-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS - Environment-aware origins
    @computed_field
    @property
    def FRONTEND_URL(self) -> str:
        if self.ENVIRONMENT == "production":
            return "https://v0-frontend-build-with-next-js.vercel.app"
        elif self.ENVIRONMENT == "local":
            return "http://localhost:3000"
        return "http://localhost:3000"  # development default
    
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
      # App
    @computed_field
    @property
    def DEBUG(self) -> bool:
        return self.ENVIRONMENT != "production"
    
    APP_NAME: str = "Hostel Management System API"
    VERSION: str = "1.0.0"
    PORT: int = int(os.getenv("PORT", "8000"))
    
    @computed_field    
    @property  
    def ALLOWED_ORIGINS_LIST(self) -> List[str]:
        """Convert ALLOWED_ORIGINS string to list for CORS middleware"""
        base_origins = []
        
        if self.ENVIRONMENT == "production":
            base_origins = [
                "https://v0-frontend-build-with-next-js.vercel.app",
                "https://*.vercel.app",
                "https://vercel.app",
                "https://*.railway.app",
                "https://*.up.railway.app"
            ]        
        else:
            base_origins = [
                "http://localhost:3000", 
                "http://127.0.0.1:3000",
                "http://localhost:8080",
                "http://127.0.0.1:8080"
            ]
        
        # Add environment-specific origins
        if isinstance(self.ALLOWED_ORIGINS, str):
            env_origins = [url.strip() for url in self.ALLOWED_ORIGINS.split(',') if url.strip()]
            base_origins.extend(env_origins)
            
        return list(set(base_origins))
    
    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        """Construct DATABASE_URL from individual components with environment-specific drivers"""
        password = quote_plus(self.DB_PASSWORD)
        
        # Use different MySQL drivers based on environment
        if self.ENVIRONMENT == "production":
            # Use PyMySQL for Railway (more reliable for cloud)
            driver = "mysql+pymysql"
            ssl_params = "ssl_disabled=true"
        else:
            # Use mysqlconnector for local/dev
            driver = "mysql+mysqlconnector" 
            ssl_params = "ssl_disabled=true"
            
        return f"{driver}://{self.DB_USER}:{password}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset={self.DB_CHARSET}&{ssl_params}"
    
    class Config:
        env_file = ".env"

settings = Settings()