from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, DECIMAL, Date, ForeignKey, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.mysql import ENUM as MySQL_ENUM
import enum

Base = declarative_base()

# Enum classes
class UserRole(str, enum.Enum):
    STUDENT = "student"
    OFFICER = "officer" 
    HALL_OFFICER = "hall_officer"  # Fixed: changed from "officer" to "hall_officer"
    ADMIN = "admin"

class AdminLevel(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    MODERATOR = "moderator"

class ActionType(str, enum.Enum):
    CREATED = "created"
    UPDATED = "updated"
    ASSIGNED = "assigned"
    COMPLETED = "completed"
    CANCELED = "canceled"
    LOGIN = "login"
    LOGOUT = "logout"

# Lookup Tables
class Roles(Base):
    __tablename__ = "roles"
    
    role_id = Column(Integer, primary_key=True, autoincrement=True)
    role_name = Column(String(50), nullable=False, unique=True)
    description = Column(Text)
    created_at = Column(DateTime, default=func.current_timestamp())

class Category(Base):
    __tablename__ = "category"
    
    category_ID = Column(Integer, primary_key=True, autoincrement=True)
    category_name = Column(String(50), nullable=False, unique=True)
    description = Column(Text)
    created_at = Column(DateTime, default=func.current_timestamp())
    
    # Relationships
    maintenance_requests = relationship("MaintenanceRequest", back_populates="category")

class Status(Base):
    __tablename__ = "status"
    
    status_ID = Column(Integer, primary_key=True, autoincrement=True)
    status_name = Column(String(50), nullable=False, unique=True)
    description = Column(Text)
    created_at = Column(DateTime, default=func.current_timestamp())
    
    # Relationships
    maintenance_requests = relationship("MaintenanceRequest", back_populates="status")

class Specialty(Base):
    __tablename__ = "specialty"
    
    specialty_ID = Column(Integer, primary_key=True, autoincrement=True)
    specialty_name = Column(String(50), nullable=False, unique=True)
    description = Column(Text)
    created_at = Column(DateTime, default=func.current_timestamp())
    
    # Relationships
    maintenance_officers = relationship("MaintenanceOfficer", back_populates="specialty")

# Main Tables
class User(Base):
    __tablename__ = "user"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False, unique=True)
    phone_number = Column(String(20))
    password = Column(String(255))
    role = Column(MySQL_ENUM('student', 'officer', 'hall_officer', 'admin', name='userrole'), nullable=False)  # Fixed: updated enum values
    created_at = Column(DateTime, default=func.current_timestamp())
    updated_at = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    student = relationship("Student", back_populates="user", uselist=False)
    hall_officer = relationship("HallOfficer", back_populates="user", uselist=False)
    maintenance_officer = relationship("MaintenanceOfficer", back_populates="user", uselist=False)
    administrator = relationship("Administrator", back_populates="user", uselist=False)
    audit_logs = relationship("AuditLog", back_populates="user")

class HallOfficer(Base):
    __tablename__ = "hall_officer"
    
    officer_ID = Column(Integer, primary_key=True, autoincrement=True)  # Fixed: changed from manager_ID
    user_ID = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False, unique=True)
    created_at = Column(DateTime, default=func.current_timestamp())
    
    # Relationships
    user = relationship("User", back_populates="hall_officer")
    hall = relationship("Hall", back_populates="officer", uselist=False)

class Hall(Base):
    __tablename__ = "hall"
    
    hall_ID = Column(Integer, primary_key=True, autoincrement=True)
    hall_name = Column(String(100), nullable=False)
    officer_ID = Column(Integer, ForeignKey("hall_officer.officer_ID", ondelete="RESTRICT"), nullable=False)  # Fixed: updated FK reference
    created_at = Column(DateTime, default=func.current_timestamp())
    updated_at = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    officer = relationship("HallOfficer", back_populates="hall")
    rooms = relationship("Room", back_populates="hall")

class Room(Base):
    __tablename__ = "room"
    
    room_ID = Column(Integer, primary_key=True, autoincrement=True)    
    room_number = Column(String(10), nullable=False)
    hall_ID = Column(Integer, ForeignKey("hall.hall_ID", ondelete="RESTRICT"), nullable=False)
    floor_number = Column(Integer)
    capacity = Column(Integer, default=1)  # Added capacity field
    created_at = Column(DateTime, default=func.current_timestamp())
    
    __table_args__ = (UniqueConstraint('room_number', 'hall_ID', name='unique_room_per_hall'),)
    
    # Relationships
    hall = relationship("Hall", back_populates="rooms")
    students = relationship("Student", back_populates="room")
    maintenance_requests = relationship("MaintenanceRequest", back_populates="room")
    maintenance_history = relationship("RoomMaintenanceHistory", back_populates="room")

class Student(Base):
    __tablename__ = "student"
    
    student_ID = Column(Integer, primary_key=True, autoincrement=True)
    user_ID = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False, unique=True)
    student_number = Column(String(20), unique=True)
    room_ID = Column(Integer, ForeignKey("room.room_ID", ondelete="SET NULL"))
    enrollment_date = Column(Date)
    created_at = Column(DateTime, default=func.current_timestamp())
    updated_at = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    user = relationship("User", back_populates="student")
    room = relationship("Room", back_populates="students")
    maintenance_requests = relationship("MaintenanceRequest", back_populates="student")

class MaintenanceOfficer(Base):
    __tablename__ = "maintenance_officer"
    
    officer_ID = Column(Integer, primary_key=True, autoincrement=True)
    user_ID = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False, unique=True)
    specialty_ID = Column(Integer, ForeignKey("specialty.specialty_ID", ondelete="RESTRICT"), nullable=False)
    employee_number = Column(String(20), unique=True)
    hire_date = Column(Date)
    created_at = Column(DateTime, default=func.current_timestamp())
    updated_at = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    user = relationship("User", back_populates="maintenance_officer")
    specialty = relationship("Specialty", back_populates="maintenance_officers")
    assignments = relationship("OfficerAssignment", back_populates="officer")
    workload = relationship("OfficerWorkload", back_populates="officer", uselist=False)

class Administrator(Base):
    __tablename__ = "administrator"
    
    admin_ID = Column(Integer, primary_key=True, autoincrement=True)
    user_ID = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False, unique=True)
    admin_level = Column(Enum(AdminLevel), default=AdminLevel.ADMIN)
    permissions = Column(Text)  # JSON field for permissions
    created_at = Column(DateTime, default=func.current_timestamp())
    
    # Relationships
    user = relationship("User", back_populates="administrator")

class MaintenanceRequest(Base):
    __tablename__ = "maintenance_request"    
    
    issue_ID = Column(Integer, primary_key=True, autoincrement=True)
    student_ID = Column(Integer, ForeignKey("student.student_ID", ondelete="RESTRICT"), nullable=False)
    room_ID = Column(Integer, ForeignKey("room.room_ID", ondelete="RESTRICT"), nullable=False)
    category_ID = Column(Integer, ForeignKey("category.category_ID", ondelete="RESTRICT"), nullable=False)
    status_ID = Column(Integer, ForeignKey("status.status_ID", ondelete="RESTRICT"), nullable=False, default=1)
    description = Column(Text, nullable=False)
    availability = Column(Text)
    submission_timestamp = Column(DateTime, default=func.current_timestamp())
    last_updated = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())
    completion_timestamp = Column(DateTime)
    estimated_cost = Column(DECIMAL(10, 2))
    actual_cost = Column(DECIMAL(10, 2))
    
    # Relationships
    student = relationship("Student", back_populates="maintenance_requests")
    room = relationship("Room", back_populates="maintenance_requests")
    category = relationship("Category", back_populates="maintenance_requests")
    status = relationship("Status", back_populates="maintenance_requests")
    assignments = relationship("OfficerAssignment", back_populates="issue")
    audit_logs = relationship("AuditLog", back_populates="issue")

class ActiveRequests(Base):
    __tablename__ = "active_requests"
    
    request_id = Column(Integer, primary_key=True, autoincrement=True)
    issue_ID = Column(Integer, ForeignKey("maintenance_request.issue_ID", ondelete="CASCADE"), nullable=False)
    priority_level = Column(Integer, default=1)
    created_at = Column(DateTime, default=func.current_timestamp())
    
    # Relationships
    maintenance_request = relationship("MaintenanceRequest")

class OfficerAssignment(Base):
    __tablename__ = "officer_assignment"
    
    assignment_ID = Column(Integer, primary_key=True, autoincrement=True)
    issue_ID = Column(Integer, ForeignKey("maintenance_request.issue_ID", ondelete="CASCADE"), nullable=False)
    officer_ID = Column(Integer, ForeignKey("maintenance_officer.officer_ID", ondelete="CASCADE"), nullable=False)
    assignment_date = Column(DateTime, default=func.current_timestamp())
    estimated_completion_date = Column(DateTime)
    actual_completion_date = Column(DateTime)
    notes = Column(Text)
    hours_worked = Column(DECIMAL(5, 2))
    
    __table_args__ = (UniqueConstraint('issue_ID', 'officer_ID', name='unique_active_assignment'),)
    
    # Relationships
    issue = relationship("MaintenanceRequest", back_populates="assignments")
    officer = relationship("MaintenanceOfficer", back_populates="assignments")

class OfficerWorkload(Base):
    __tablename__ = "officer_workload"
    
    workload_id = Column(Integer, primary_key=True, autoincrement=True)
    officer_ID = Column(Integer, ForeignKey("maintenance_officer.officer_ID", ondelete="CASCADE"), nullable=False, unique=True)
    active_assignments = Column(Integer, default=0)
    total_hours_week = Column(DECIMAL(5, 2), default=0.00)
    availability_status = Column(String(20), default="available")
    last_updated = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    officer = relationship("MaintenanceOfficer", back_populates="workload")

class RoomMaintenanceHistory(Base):
    __tablename__ = "room_maintenance_history"
    
    history_id = Column(Integer, primary_key=True, autoincrement=True)
    room_ID = Column(Integer, ForeignKey("room.room_ID", ondelete="RESTRICT"), nullable=False)
    issue_ID = Column(Integer, ForeignKey("maintenance_request.issue_ID", ondelete="RESTRICT"), nullable=False)
    completion_date = Column(DateTime)
    cost = Column(DECIMAL(10, 2))
    notes = Column(Text)
    created_at = Column(DateTime, default=func.current_timestamp())
    
    # Relationships
    room = relationship("Room", back_populates="maintenance_history")
    maintenance_request = relationship("MaintenanceRequest")

class AuditLog(Base):
    __tablename__ = "audit_log"
    
    log_ID = Column(Integer, primary_key=True, autoincrement=True)    
    user_ID = Column(Integer, ForeignKey("user.id", ondelete="SET NULL"))
    action_type = Column(Enum(ActionType), nullable=False)
    table_affected = Column(String(50))
    record_ID = Column(Integer)
    old_values = Column(Text)  # JSON field
    new_values = Column(Text)  # JSON field
    timestamp = Column(DateTime, default=func.current_timestamp())
    issue_ID = Column(Integer, ForeignKey("maintenance_request.issue_ID", ondelete="SET NULL"))
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
    issue = relationship("MaintenanceRequest", back_populates="audit_logs")
