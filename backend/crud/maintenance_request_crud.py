from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from typing import List, Optional
from models.models import MaintenanceRequest, Student, Room, Category, Status
from schemas.schemas import MaintenanceRequestCreate, MaintenanceRequestUpdate

def get_maintenance_request(db: Session, request_id: int) -> Optional[MaintenanceRequest]:
    """Get a single maintenance request by ID with related data"""
    return db.query(MaintenanceRequest).options(
        joinedload(MaintenanceRequest.student),
        joinedload(MaintenanceRequest.room),
        joinedload(MaintenanceRequest.category),
        joinedload(MaintenanceRequest.status)
    ).filter(MaintenanceRequest.issue_ID == request_id).first()

def get_maintenance_requests(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    student_id: Optional[int] = None,
    status_id: Optional[int] = None,
    category_id: Optional[int] = None,
    hall_id: Optional[int] = None
) -> List[MaintenanceRequest]:
    """Get maintenance requests with optional filtering"""
    query = db.query(MaintenanceRequest).options(
        joinedload(MaintenanceRequest.student),
        joinedload(MaintenanceRequest.room),
        joinedload(MaintenanceRequest.category),
        joinedload(MaintenanceRequest.status)
    )
    
    # Apply filters
    if student_id is not None:
        query = query.filter(MaintenanceRequest.student_ID == student_id)
    if status_id is not None:
        query = query.filter(MaintenanceRequest.status_ID == status_id)
    if category_id is not None:
        query = query.filter(MaintenanceRequest.category_ID == category_id)
    if hall_id is not None:
        query = query.join(Room).filter(Room.hall_ID == hall_id)
    
    return query.offset(skip).limit(limit).all()

def create_maintenance_request(db: Session, request: MaintenanceRequestCreate) -> MaintenanceRequest:
    """Create a new maintenance request"""
    db_request = MaintenanceRequest(**request.dict())
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    
    # Fetch with related data
    return get_maintenance_request(db, db_request.issue_ID)

def update_maintenance_request(
    db: Session, 
    request_id: int, 
    request_update: MaintenanceRequestUpdate
) -> Optional[MaintenanceRequest]:
    """Update an existing maintenance request"""
    db_request = get_maintenance_request(db, request_id)
    if db_request:
        update_data = request_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_request, field, value)
        db.commit()
        db.refresh(db_request)
        
        # Return with fresh related data
        return get_maintenance_request(db, request_id)
    return None

def delete_maintenance_request(db: Session, request_id: int) -> bool:
    """Delete a maintenance request"""
    db_request = get_maintenance_request(db, request_id)
    if db_request:
        db.delete(db_request)
        db.commit()
        return True
    return False

def get_active_requests(db: Session) -> List[MaintenanceRequest]:
    """Get all active maintenance requests (not completed)"""
    return db.query(MaintenanceRequest).options(
        joinedload(MaintenanceRequest.student),
        joinedload(MaintenanceRequest.room),
        joinedload(MaintenanceRequest.category),
        joinedload(MaintenanceRequest.status)
    ).filter(MaintenanceRequest.status_ID != 4).all()  # Assuming status_ID 4 is "Completed"

def get_requests_by_hall(db: Session, hall_id: int) -> List[MaintenanceRequest]:
    """Get all maintenance requests for a specific hall"""
    return db.query(MaintenanceRequest).options(
        joinedload(MaintenanceRequest.student),
        joinedload(MaintenanceRequest.room),
        joinedload(MaintenanceRequest.category),
        joinedload(MaintenanceRequest.status)
    ).join(Room).filter(Room.hall_ID == hall_id).all()

def get_requests_by_student(db: Session, student_id: int) -> List[MaintenanceRequest]:
    """Get all maintenance requests for a specific student"""
    return db.query(MaintenanceRequest).options(
        joinedload(MaintenanceRequest.student),
        joinedload(MaintenanceRequest.room),
        joinedload(MaintenanceRequest.category),
        joinedload(MaintenanceRequest.status)
    ).filter(MaintenanceRequest.student_ID == student_id).all()

def get_pending_requests(db: Session) -> List[MaintenanceRequest]:
    """Get all pending maintenance requests"""
    return db.query(MaintenanceRequest).options(
        joinedload(MaintenanceRequest.student),
        joinedload(MaintenanceRequest.room),
        joinedload(MaintenanceRequest.category),
        joinedload(MaintenanceRequest.status)
    ).filter(MaintenanceRequest.status_ID == 1).all()  # Assuming status_ID 1 is "Pending"

def get_completed_requests(db: Session) -> List[MaintenanceRequest]:
    """Get all completed maintenance requests"""
    return db.query(MaintenanceRequest).options(
        joinedload(MaintenanceRequest.student),
        joinedload(MaintenanceRequest.room),
        joinedload(MaintenanceRequest.category),
        joinedload(MaintenanceRequest.status)
    ).filter(MaintenanceRequest.status_ID == 4).all()  # Assuming status_ID 4 is "Completed"
