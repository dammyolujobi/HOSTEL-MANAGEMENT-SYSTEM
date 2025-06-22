from fastapi import APIRouter, Depends, HTTPException, status
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


router = APIRouter(prefix="/maintenance-requests", tags=["maintenance-requests"])

@router.get("/", response_model=List[MaintenanceRequest])
def read_maintenance_requests(
    skip: int = 0,
    limit: int = 100,
    student_id: Optional[int] = None,
    status_id: Optional[int] = None,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get all maintenance requests with optional filtering"""
    requests = get_maintenance_requests(
        db, 
        skip=skip, 
        limit=limit,
        student_id=student_id,
        status_id=status_id,
        category_id=category_id,
    )
    return requests

@router.get("/active", response_model=List[MaintenanceRequest])
def read_active_requests(db: Session = Depends(get_db)):
    """Get all active (pending, assigned, in progress) maintenance requests"""
    return get_active_requests(db)

@router.get("/hall/{hall_id}", response_model=List[MaintenanceRequest])
def read_requests_by_hall(hall_id: int, db: Session = Depends(get_db)):
    """Get all maintenance requests for a specific hall"""
    return get_requests_by_hall(db, hall_id=hall_id)

@router.get("/{request_id}", response_model=MaintenanceRequest)
def read_maintenance_request(request_id: int, db: Session = Depends(get_db)):
    """Get a specific maintenance request by ID"""
    db_request = get_maintenance_request(db, request_id=request_id)
    if db_request is None:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    return db_request

@router.post("/", response_model=MaintenanceRequest, status_code=status.HTTP_201_CREATED)
def create_new_maintenance_request(
    request: MaintenanceRequestCreate, 
    db: Session = Depends(get_db)
):
    """Create a new maintenance request"""
    return create_maintenance_request(db=db, request=request)

@router.put("/{request_id}", response_model=MaintenanceRequest)
def update_existing_maintenance_request(
    request_id: int,
    request_update: MaintenanceRequestUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing maintenance request"""
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
    db: Session = Depends(get_db)
):
    """Delete a maintenance request"""
    success = delete_maintenance_request(db, request_id=request_id)
    if not success:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    return MessageResponse(message="Maintenance request deleted successfully")
