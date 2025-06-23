from pydantic_settings import BaseSettings
from pydantic import field_validator, computed_field
from typing import List
import os
from dotenv import load_dotenv
from urllib.parse import quote_plus

load_dotenv()

class Settings(BaseSettings):
    # Database components
    DB_HOST: str = "hopper.proxy.rlwy.net"
    DB_PORT: int = 14988
    DB_USER: str = "root" 
    DB_PASSWORD: str = "RBSkzqpuAeCGdVankDFOXPbNSlEXybHS"
    DB_NAME: str = "railway"
    DB_CHARSET: str = "utf8mb4"
    DB_CONNECTION_TIMEOUT: int = 60
    DB_SSL_DISABLED: bool = True
    
    # JWT
    SECRET_KEY: str = "your-super-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
      # CORS - Railway deployment URLs  
    FRONTEND_URL: str = "https://v0-frontend-build-with-next-js.vercel.app"
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,https://v0-frontend-build-with-next-js.vercel.app"
    
    # App
    DEBUG: bool = False
    APP_NAME: str = "Hostel Management System API"
    VERSION: str = "1.0.0"
    PORT: int = 8000
    @computed_field    
    @property  
    def ALLOWED_ORIGINS_LIST(self) -> List[str]:
        """Convert ALLOWED_ORIGINS string to list for CORS middleware"""
        base_origins = [
            "http://localhost:3000", 
            "http://127.0.0.1:3000",
            "https://v0-frontend-build-with-next-js.vercel.app",
            "https://*.vercel.app",
            "https://vercel.app",
            "https://*.railway.app",
            "https://*.up.railway.app"
        ]
        
        if isinstance(self.ALLOWED_ORIGINS, str):
            env_origins = [url.strip() for url in self.ALLOWED_ORIGINS.split(',') if url.strip()]
            return list(set(base_origins + env_origins))
        return base_origins
    
    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        """Construct DATABASE_URL from individual components"""
        password = quote_plus(self.DB_PASSWORD)
        return f"mysql+mysqlconnector://{self.DB_USER}:{password}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset={self.DB_CHARSET}&ssl_disabled={self.DB_SSL_DISABLED}"
    
    class Config:
        env_file = ".env"

settings = Settings()