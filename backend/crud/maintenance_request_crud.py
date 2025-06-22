from sqlalchemy.orm import Session
from typing import List, Optional
from models.models import MaintenanceRequest
from schemas.schemas import MaintenanceRequestCreate, MaintenanceRequestUpdate

def get_maintenance_request(db: Session, request_id: int) -> Optional[MaintenanceRequest]:
    return db.query(MaintenanceRequest).filter(MaintenanceRequest.issue_ID == request_id).first()

def get_maintenance_requests(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    student_id: Optional[int] = None,
    status_id: Optional[int] = None,
    category_id: Optional[int] = None,
) -> List[MaintenanceRequest]:
    query = db.query(MaintenanceRequest)
    
    if student_id:
        query = query.filter(MaintenanceRequest.student_ID == student_id)
    if status_id:
        query = query.filter(MaintenanceRequest.status_ID == status_id)
    if category_id:
        query = query.filter(MaintenanceRequest.category_ID == category_id)

    
    return query.offset(skip).limit(limit).all()

def create_maintenance_request(db: Session, request: MaintenanceRequestCreate) -> MaintenanceRequest:
    db_request = MaintenanceRequest(**request.dict())
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

def update_maintenance_request(
    db: Session, 
    request_id: int, 
    request_update: MaintenanceRequestUpdate
) -> Optional[MaintenanceRequest]:
    db_request = get_maintenance_request(db, request_id)
    if db_request:
        update_data = request_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_request, field, value)
        db.commit()
        db.refresh(db_request)
    return db_request

def delete_maintenance_request(db: Session, request_id: int) -> bool:
    db_request = get_maintenance_request(db, request_id)
    if db_request:
        db.delete(db_request)
        db.commit()
        return True
    return False

def get_requests_by_hall(db: Session, hall_id: int) -> List[MaintenanceRequest]:
    return db.query(MaintenanceRequest).join(MaintenanceRequest.room).filter(
        MaintenanceRequest.room.has(hall_ID=hall_id)
    ).all()

def get_active_requests(db: Session) -> List[MaintenanceRequest]:
    """Get all pending, assigned, or in-progress requests"""
    from models.models import Status
    return db.query(MaintenanceRequest).join(
        Status, MaintenanceRequest.status_ID == Status.status_ID
    ).filter(
        Status.status_name.in_(["Pending", "Assigned", "In Progress"])
    ).all()
