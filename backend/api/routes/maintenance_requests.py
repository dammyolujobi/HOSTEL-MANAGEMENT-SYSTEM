from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from typing import List, Optional
from database.database import get_db
from schemas.schemas import (
    MaintenanceRequest, MaintenanceRequestCreate, MaintenanceRequestUpdate, MessageResponse
)
from crud.maintenance_request_crud import (
    get_maintenance_request, get_maintenance_requests, create_maintenance_request,
    update_maintenance_request, delete_maintenance_request, get_active_requests,
    get_requests_by_hall
)
from models.models import User, Student, HallOfficer
from api.routes.auth import verify_token
from jose import jwt, JWTError
import os

router = APIRouter(prefix="/maintenance-requests", tags=["maintenance-requests"])
security = HTTPBearer()

def get_current_user(db: Session = Depends(get_db), token = Depends(verify_token)):
    """Get current user from token - Authentication required"""
    user = db.query(User).filter(User.email == token.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user

# Explicit OPTIONS handler for debugging
@router.options("/")
@router.options("")
async def options_handler():
    """Handle OPTIONS requests for CORS preflight"""
    return JSONResponse(
        content={"message": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

@router.get("/", response_model=List[MaintenanceRequest])
def read_maintenance_requests(
    skip: int = 0,
    limit: int = 100,
    student_id: Optional[int] = None,
    status_id: Optional[int] = None,
    category_id: Optional[int] = None,
    hall_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all maintenance requests with optional filtering - Authentication required"""
    
    # Role-based filtering
    if current_user.role == "student":
        # Students can only see their own requests
        student_record = db.query(Student).filter(Student.user_ID == current_user.id).first()
        if student_record:
            student_id = student_record.student_ID
        else:
            # If no student record, return empty list
            return []
            
    elif current_user.role == "hall officer":
        # Hall officers can only see requests from their assigned hall
        hall_officer = db.query(HallOfficer).filter(HallOfficer.user_ID == current_user.id).first()
        if hall_officer and hall_officer.hall_ID:
            hall_id = hall_officer.hall_ID
        else:
            # If no hall assignment, return empty list
            return []
    
    # Admin and maintenance officers can see all requests (no additional filtering)
    
    requests = get_maintenance_requests(
        db, 
        skip=skip, 
        limit=limit,
        student_id=student_id,
        status_id=status_id,
        category_id=category_id,
        hall_id=hall_id,
    )
    return requests

@router.get("/active", response_model=List[MaintenanceRequest])
def read_active_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all active (pending, assigned, in progress) maintenance requests - Authentication required"""
    return get_active_requests(db)

@router.get("/hall/{hall_id}", response_model=List[MaintenanceRequest])
def read_requests_by_hall(
    hall_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all maintenance requests for a specific hall - Authentication required"""
    return get_requests_by_hall(db, hall_id=hall_id)

@router.get("/{request_id}", response_model=MaintenanceRequest)
def read_maintenance_request(
    request_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific maintenance request by ID - Authentication required"""
    db_request = get_maintenance_request(db, request_id=request_id)
    if db_request is None:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    return db_request

@router.post("/", response_model=MaintenanceRequest, status_code=status.HTTP_201_CREATED)
def create_new_maintenance_request(
    request: MaintenanceRequestCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new maintenance request (Students only)"""
    
    # If we have a logged-in user, enforce role restrictions
    if current_user:
        # Only students can create maintenance requests
        if current_user.role != "student":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Only students can create maintenance requests. Current role: {current_user.role}"
            )
        
        # Verify the user has a student record
        student_record = db.query(Student).filter(Student.user_ID == current_user.id).first()
        if not student_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student record not found. Please contact administrator."
            )
        
        # Override the student_ID in the request with the current user's student ID
        request.student_ID = student_record.student_ID
    else:
        # For testing without authentication, validate that student_ID exists
        student_record = db.query(Student).filter(Student.student_ID == request.student_ID).first()
        if not student_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Student ID {request.student_ID} not found in database"
            )
    
    return create_maintenance_request(db=db, request=request)

@router.put("/{request_id}", response_model=MaintenanceRequest)
def update_existing_maintenance_request(
    request_id: int,
    request_update: MaintenanceRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing maintenance request - Authentication required"""
    db_request = update_maintenance_request(
        db, 
        request_id=request_id, 
        request_update=request_update
    )
    if db_request is None:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    return db_request

@router.delete("/{request_id}", response_model=MessageResponse)
def delete_existing_maintenance_request(
    request_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a maintenance request - Authentication required"""
    success = delete_maintenance_request(db, request_id=request_id)
    if not success:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    return MessageResponse(message="Maintenance request deleted successfully")

# Status Update Endpoints for easier progress management
@router.patch("/{request_id}/status/{status_id}", response_model=MaintenanceRequest)
def update_request_status(
    request_id: int,
    status_id: int,
    db: Session = Depends(get_db)
):
    """Update the status of a maintenance request"""
    from schemas.schemas import MaintenanceRequestUpdate
    from datetime import datetime
    
    # Validate status_id (1=Pending, 2=In Progress, 3=Under Review, 4=Completed)
    valid_statuses = [1, 2, 3, 4]
    if status_id not in valid_statuses:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid status_id. Must be one of: {valid_statuses}"
        )
    
    # Create update data
    update_data = MaintenanceRequestUpdate(
        status_ID=status_id,
        last_updated=datetime.now()
    )
    
    # Add completion timestamp if marking as completed
    if status_id == 4:  # Completed
        update_data.completion_timestamp = datetime.now()
    
    db_request = update_maintenance_request(db, request_id=request_id, request_update=update_data)
    if db_request is None:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    return db_request

@router.patch("/{request_id}/in-progress", response_model=MaintenanceRequest)
def mark_request_in_progress(request_id: int, db: Session = Depends(get_db)):
    """Mark a maintenance request as in progress"""
    return update_request_status(request_id, 2, db)

@router.patch("/{request_id}/complete", response_model=MaintenanceRequest)
def mark_request_complete(request_id: int, db: Session = Depends(get_db)):
    """Mark a maintenance request as completed"""
    return update_request_status(request_id, 4, db)

@router.patch("/{request_id}/under-review", response_model=MaintenanceRequest)
def mark_request_under_review(request_id: int, db: Session = Depends(get_db)):
    """Mark a maintenance request as under review"""
    return update_request_status(request_id, 3, db)

@router.patch("/{request_id}/reopen", response_model=MaintenanceRequest)
def reopen_request(request_id: int, db: Session = Depends(get_db)):
    """Reopen a maintenance request (set back to pending)"""
    return update_request_status(request_id, 1, db)
