from pydantic_settings import BaseSettings
from pydantic import field_validator, computed_field
from typing import List, Optional
import os
from dotenv import load_dotenv
from urllib.parse import quote_plus

load_dotenv()

class Settings(BaseSettings):
    # Force local environment - completely ignore any cloud settings
    ENVIRONMENT: str = "local"  # Force local development
    
    # Local database settings only - hardcoded to avoid any Railway influence
    DB_HOST: str = "localhost"  # Force localhost
    DB_PORT: int = 3307  # Force local MySQL port
    DB_USER: str = "root"  # Force local MySQL user
    DB_PASSWORD: str = "Jesus@lord10"  # Force local MySQL password
    DB_NAME: str = "hostelmanagementsystem"  # Force local database name
    DB_CHARSET: str = "utf8mb4"
      # Database connection settings for local development
    @computed_field
    @property
    def DB_CONNECTION_TIMEOUT(self) -> int:
        return 60  # Longer timeout for local dev
    
    @computed_field
    @property 
    def DB_POOL_SIZE(self) -> int:
        return 5  # Good pool size for local dev
    
    @computed_field
    @property
    def DB_MAX_OVERFLOW(self) -> int:
        return 10  # More overflow for local dev
    
    @computed_field
    @property
    def DB_POOL_RECYCLE(self) -> int:
        return 3600  # 1 hour for local dev
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
                "http://localhost:3001",  # Frontend might start on 3001 if 3000 is busy
                "http://127.0.0.1:3001",
                "http://localhost:8000",
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
        """Construct DATABASE_URL from individual components - FORCE LOCAL ONLY"""
        password = quote_plus(self.DB_PASSWORD)
        
        # Force local MySQL driver and settings only
        driver = "mysql+mysqlconnector" 
        ssl_params = "ssl_disabled=true"
            
        url = f"{driver}://{self.DB_USER}:{password}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset={self.DB_CHARSET}&{ssl_params}"
        print(f"🔗 DATABASE_URL: {url}")  # Debug print to verify URL
        return url
    
    class Config:
        env_file = ".env"

settings = Settings()