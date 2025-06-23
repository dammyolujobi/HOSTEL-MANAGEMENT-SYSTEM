from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
import os
import logging
from dotenv import load_dotenv

from database.database import get_db
from models.models import User
from schemas.schemas import LoginCredentials, LoginResponse, TokenData

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-please-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Default Covenant University credentials - redirects to real accounts
# Default credentials matching actual database users
DEFAULT_CREDENTIALS = {
    "admin": {
        "email": "admin@university.edu", 
        "password": "admin123",
        "name": "John Admin",
        "role": "admin"
    },
    "hall_officer": {
        "email": "hall.officer@university.edu",
        "password": "officer123", 
        "name": "Hall Officer Demo",
        "role": "hall officer"
    },
    "student": {
        "email": "jane.student@university.edu",
        "password": "student123",
        "name": "Jane Student", 
        "role": "student"
    },
    "maintenance_officer": {
        "email": "bob.maintenance@university.edu",
        "password": "maintenance123",
        "name": "Bob MaintenanceOfficer",
        "role": "maintenance officer"
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
        logger.debug(f"Verifying password. Hashed password starts with: {hashed_password[:10]}...")
        logger.debug(f"Hashed password length: {len(hashed_password)}")
        
        # Check if the stored password is already hashed (starts with $2b$)
        if not hashed_password.startswith('$2b$'):
            logger.debug("Password is not bcrypt hashed, comparing as plain text")
            result = plain_password == hashed_password
            logger.debug(f"Plain text comparison result: {result}")
            return result
        
        logger.debug("Password is bcrypt hashed, using bcrypt verification")
        result = bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
        logger.debug(f"Bcrypt verification result: {result}")
        return result
    except (ValueError, TypeError) as e:
        logger.warning(f"Password verification failed with error: {e}")
        return False

def hash_password(password: str) -> str:
    """Hash a password"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def authenticate_user(db: Session, email: str, password: str):
    """Authenticate a user with email and password"""
    # Check database for real users only
    user = db.query(User).filter(User.email == email).first()
    if user:
        logger.info(f"Found user {email} in database, checking password...")
        logger.debug(f"Stored password starts with: {user.password[:10]}...")
        password_valid = verify_password(password, user.password)
        logger.info(f"Password verification result for {email}: {password_valid}")
        if password_valid:
            return user
    else:
        logger.info(f"User {email} not found in database")
    
    # No fallback to default credentials - only use database users for security
    logger.warning(f"Authentication failed for {email}")
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
@router.post("/login/", response_model=LoginResponse)  # Handle both with and without trailing slash
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
