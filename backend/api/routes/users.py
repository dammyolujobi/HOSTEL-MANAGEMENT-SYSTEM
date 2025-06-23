from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database.database import get_db
from schemas.schemas import User, UserCreate, UserUpdate, MessageResponse
from crud.user_crud import (
    get_user, get_users, create_user, update_user, delete_user, get_user_by_email
)
from models.models import UserRole

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=List[User])
def read_users(
    skip: int = 0,
    limit: int = 100,
    role: UserRole = None,
    db: Session = Depends(get_db)
):
    """Get all users with optional filtering by role"""
    users = get_users(db, skip=skip, limit=limit, role=role)
    return users

@router.get("/{user_id}", response_model=User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    """Get a specific user by ID"""
    db_user = get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.get("/email/{email}", response_model=User)
def read_user_by_email(email: str, db: Session = Depends(get_db)):
    """Get a specific user by email"""
    db_user = get_user_by_email(db, email=email)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
def create_new_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user"""
    # Check if user with email already exists
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    return create_user(db=db, user=user)

@router.put("/{user_id}", response_model=User)
def update_existing_user(
    user_id: int, 
    user_update: UserUpdate, 
    db: Session = Depends(get_db)
):
    """Update an existing user"""
    db_user = update_user(db, user_id=user_id, user_update=user_update)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.delete("/{user_id}", response_model=MessageResponse)
def delete_existing_user(user_id: int, db: Session = Depends(get_db)):
    """Delete a user"""
    success = delete_user(db, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return MessageResponse(message="User deleted successfully")

@router.get("/{user_id}/hall")
def get_user_hall(user_id: int, db: Session = Depends(get_db)):
    """Get hall ID for a hall officer"""
    from models.models import HallOfficer
    
    # First check if user exists and is a hall officer
    user = get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role != "hall officer":
        return {"hall_id": None}
    
    # Get hall officer record and associated hall
    hall_officer = db.query(HallOfficer).filter(HallOfficer.user_ID == user_id).first()
    if not hall_officer:
        return {"hall_id": None}
    
    return {"hall_id": hall_officer.hall_ID}
