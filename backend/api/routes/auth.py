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

# Default Covenant University credentials - redirects to real accounts
DEFAULT_CREDENTIALS = {
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
    try:
        # Check if the stored password is already hashed (starts with $2b$)
        if not hashed_password.startswith('$2b$'):
            # If it's not hashed, it's a plain text password (for demo/testing)
            return plain_password == hashed_password
        
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except (ValueError, TypeError) as e:
        logger.warning(f"Password verification failed: {e}")
        return False

def hash_password(password: str) -> str:
    """Hash a password"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def authenticate_user(db: Session, email: str, password: str):
    """Authenticate a user with email and password"""
    # Check database first for real users
    user = db.query(User).filter(User.email == email).first()
    if user and verify_password(password, user.password):
        return user
    
    # Fallback to default credentials only for non-student roles
    for role, creds in DEFAULT_CREDENTIALS.items():
        if creds["email"] == email and creds["password"] == password:
            return {
                "id": 0,  # Demo user ID for non-students only
                "email": creds["email"],
                "name": creds["name"],
                "role": creds["role"],
                "phone_number": None
            }
    
    return None

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
    Login endpoint that accepts university email format.
    
    Available demo credentials:
    - Student: jane.student@university.edu / student123
    - Admin: admin@cu.edu.ng / admin123  
    - Hall Officer: hall.officer@cu.edu.ng / manager123
    - Maintenance Officer: maintenance@cu.edu.ng / officer123
    
    For maintenance requests, use the student account which has proper student_ID.
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
    
    # If user is a student, fetch student_ID and room_ID
    if (user["role"] if isinstance(user, dict) else user.role) == "student":
        from models.models import Student
        student_record = db.query(Student).filter(Student.user_ID == user_data["id"]).first()
        if student_record:
            user_data["student_ID"] = student_record.student_ID
            user_data["room_ID"] = student_record.room_ID
        else:
            # Student record doesn't exist - this is an error
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student record not found. Please contact administrator."
            )
    
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
