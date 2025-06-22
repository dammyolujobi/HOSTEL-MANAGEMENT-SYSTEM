from pydantic import BaseModel, EmailStr, constr
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from models.models import UserRole, RoomType,AdminLevel, ActionType
import bcrypt


# Base schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone_number: Optional[str] = None
    role: UserRole
    password:str

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    password: str

    def set_password(self, raw_password: str):
        """Hashes and sets a new password."""
        self.password = bcrypt.hashpw(raw_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    @classmethod
    def verify_password(cls, hashed_password: str, raw_password: str) -> bool:
        """Verifies if the provided password matches the hashed password."""
        return bcrypt.checkpw(raw_password.encode('utf-8'), hashed_password.encode('utf-8'))
        
class User(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Category schemas
class CategoryBase(BaseModel):
    category_name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    category_ID: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Status schemas
class StatusBase(BaseModel):
    status_name: str
    description: Optional[str] = None

class StatusCreate(StatusBase):
    pass

class Status(StatusBase):
    status_ID: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Specialty schemas
class SpecialtyBase(BaseModel):
    specialty_name: str
    description: Optional[str] = None

class SpecialtyCreate(SpecialtyBase):
    pass

class Specialty(SpecialtyBase):
    specialty_ID: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Hall Manager schemas
class HallManagerBase(BaseModel):
    user_ID: int

class HallManagerCreate(HallManagerBase):
    pass

class HallManager(HallManagerBase):
    manager_ID: int
    hall_ID: Optional[int] = None
    created_at: datetime
    user: User
    
    class Config:
        from_attributes = True

# Hall schemas
class HallBase(BaseModel):
    hall_name: str
    location: str
    capacity: Optional[int] = None
    manager_ID: int

class HallCreate(HallBase):
    pass

class HallUpdate(BaseModel):
    hall_name: Optional[str] = None
    location: Optional[str] = None
    capacity: Optional[int] = None
    manager_ID: Optional[int] = None

class Hall(HallBase):
    hall_ID: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Room schemas
class RoomBase(BaseModel):
    room_number: str
    hall_ID: int
    floor_number: Optional[int] = None
    room_type: RoomType = RoomType.SINGLE
    capacity: int = 1

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    room_number: Optional[str] = None
    floor_number: Optional[int] = None
    room_type: Optional[RoomType] = None
    capacity: Optional[int] = None

class Room(RoomBase):
    room_ID: int
    created_at: datetime
    hall: Hall
    
    class Config:
        from_attributes = True

# Student schemas
class StudentBase(BaseModel):
    user_ID: int
    student_number: Optional[str] = None
    room_ID: Optional[int] = None
    enrollment_date: Optional[date] = None

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    student_number: Optional[str] = None
    room_ID: Optional[int] = None
    enrollment_date: Optional[date] = None

class Student(StudentBase):
    student_ID: int
    created_at: datetime
    updated_at: datetime
    user: User
    room: Optional[Room] = None
    
    class Config:
        from_attributes = True

# Maintenance Officer schemas
class MaintenanceOfficerBase(BaseModel):
    user_ID: int
    specialty_ID: int
    employee_number: Optional[str] = None
    hire_date: Optional[date] = None

class MaintenanceOfficerCreate(MaintenanceOfficerBase):
    pass

class MaintenanceOfficerUpdate(BaseModel):
    specialty_ID: Optional[int] = None
    employee_number: Optional[str] = None
    hire_date: Optional[date] = None

class MaintenanceOfficer(MaintenanceOfficerBase):
    officer_ID: int
    created_at: datetime
    updated_at: datetime
    user: User
    specialty: Specialty
    
    class Config:
        from_attributes = True

# Administrator schemas
class AdministratorBase(BaseModel):
    user_ID: int
    admin_level: AdminLevel = AdminLevel.ADMIN
    permissions: Optional[str] = None

class AdministratorCreate(AdministratorBase):
    pass

class Administrator(AdministratorBase):
    admin_ID: int
    created_at: datetime
    user: User
    
    class Config:
        from_attributes = True

# Maintenance Request schemas
class MaintenanceRequestBase(BaseModel):
    student_ID: int
    room_ID: int
    category_ID: int
    description: str
    availability: Optional[str] = None

    estimated_cost: Optional[Decimal] = None

class MaintenanceRequestCreate(MaintenanceRequestBase):
    pass

class MaintenanceRequestUpdate(BaseModel):
    category_ID: Optional[int] = None
    status_ID: Optional[int] = None
    description: Optional[str] = None
    availability: Optional[str] = None
    estimated_cost: Optional[Decimal] = None
    actual_cost: Optional[Decimal] = None
    completion_timestamp: Optional[datetime] = None

class MaintenanceRequest(MaintenanceRequestBase):
    issue_ID: int
    status_ID: int
    submission_timestamp: datetime
    last_updated: datetime
    completion_timestamp: Optional[datetime] = None
    actual_cost: Optional[Decimal] = None
    student: Student
    room: Room
    category: Category
    status: Status
    
    class Config:
        from_attributes = True

# Officer Assignment schemas
class OfficerAssignmentBase(BaseModel):
    issue_ID: int
    officer_ID: int
    estimated_completion_date: Optional[datetime] = None
    notes: Optional[str] = None

class OfficerAssignmentCreate(OfficerAssignmentBase):
    pass

class OfficerAssignmentUpdate(BaseModel):
    estimated_completion_date: Optional[datetime] = None
    actual_completion_date: Optional[datetime] = None
    notes: Optional[str] = None
    hours_worked: Optional[Decimal] = None

class OfficerAssignment(OfficerAssignmentBase):
    assignment_ID: int
    assignment_date: datetime
    actual_completion_date: Optional[datetime] = None
    hours_worked: Optional[Decimal] = None
    officer: MaintenanceOfficer
    issue: MaintenanceRequest
    
    class Config:
        from_attributes = True

# Audit Log schemas
class AuditLogBase(BaseModel):
    action_type: ActionType
    table_affected: Optional[str] = None
    record_ID: Optional[int] = None
    old_values: Optional[str] = None
    new_values: Optional[str] = None

class AuditLog(AuditLogBase):
    log_ID: int
    user_ID: Optional[int] = None
    timestamp: datetime
    issue_ID: Optional[int] = None
    
    class Config:
        from_attributes = True

# Response schemas
class MessageResponse(BaseModel):
    message: str

class ListResponse(BaseModel):
    items: List
    total: int
    page: int
    size: int
    pages: int
