from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
import os
from dotenv import load_dotenv

from database.database import get_db
from models.models import User
from schemas.schemas import LoginCredentials, LoginResponse, TokenData

load_dotenv()

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-please-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Default Covenant University credentials
DEFAULT_CREDENTIALS = {
    "student": {
        "email": "john.doe@stu.cu.edu.ng",
        "password": "student123",
        "name": "John Doe",
        "role": "student"
    },
    "admin": {
        "email": "admin@cu.edu.ng", 
        "password": "admin123",
        "name": "System Administrator",
        "role": "admin"
    },    "manager": {
        "email": "hall.officer@cu.edu.ng",
        "password": "manager123", 
        "name": "Hall Officer",
        "role": "manager"
    },
    "officer": {
        "email": "maintenance@cu.edu.ng",
        "password": "officer123",
        "name": "Maintenance Officer", 
        "role": "officer"
    }
}

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a new JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def hash_password(password: str) -> str:
    """Hash a password"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def authenticate_user(db: Session, email: str, password: str):
    """Authenticate a user with email and password"""
    # First check default credentials for demo
    for role, creds in DEFAULT_CREDENTIALS.items():
        if creds["email"] == email and creds["password"] == password:
            return {
                "id": 0,  # Demo user ID
                "email": creds["email"],
                "name": creds["name"],
                "role": creds["role"],
                "phone_number": None
            }
    
    # Then check database
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    
    if not verify_password(password, user.password):
        return None
    
    return user

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token"""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        token_data = TokenData(email=email)    
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token_data

@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginCredentials, db: Session = Depends(get_db)):
    """
    Login endpoint that accepts Covenant University email format.
    
    Default demo credentials:
    - Student: john.doe@stu.cu.edu.ng / student123
    - Admin: admin@cu.edu.ng / admin123  
    - Hall Officer: hall.officer@cu.edu.ng / manager123
    - Maintenance Officer: maintenance@cu.edu.ng / officer123
    """
    
    # Authenticate user
    user = authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"] if isinstance(user, dict) else user.email, 
              "role": user["role"] if isinstance(user, dict) else user.role},
        expires_delta=access_token_expires
    )
    
    # Prepare user data for response
    user_data = {
        "id": user["id"] if isinstance(user, dict) else user.id,
        "email": user["email"] if isinstance(user, dict) else user.email,
        "name": user["name"] if isinstance(user, dict) else user.name,
        "role": user["role"] if isinstance(user, dict) else user.role,
        "phone_number": user.get("phone_number") if isinstance(user, dict) else user.phone_number
    }
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_data,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

@router.get("/verify")
async def verify_token_endpoint(token_data: TokenData = Depends(verify_token)):
    """Verify if the current token is valid"""
    return {"valid": True, "email": token_data.email}

@router.post("/logout")
async def logout():
    """Logout endpoint (client should delete the token)"""
    return {"message": "Successfully logged out"}
