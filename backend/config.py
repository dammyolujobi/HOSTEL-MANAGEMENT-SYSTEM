from pydantic_settings import BaseSettings
from typing import List
import os
from dotenv import load_dotenv
from urllib.parse import quote_plus

load_dotenv()

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    
    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
      # CORS - Railway deployment URLs
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
        "https://*.railway.app",
        "https://*.up.railway.app",
        "https://v0-frontend-build-with-next-js.vercel.app"
    ]
    
    # App
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    APP_NAME: str = os.getenv("APP_NAME", "Hostel Management System API")
    VERSION: str = os.getenv("VERSION", "1.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    class Config:
        env_file = ".env"

settings = Settings()
