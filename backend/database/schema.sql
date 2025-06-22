-- Hall Maintenance Management System Database Schema (Normalized)
-- Created: June 2025

-- Disable foreign key checks to handle circular dependencies during drop/create
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables if they exist (for clean setup) - in correct dependency order
DROP TABLE IF EXISTS Audit_Log;
DROP TABLE IF EXISTS Officer_Assignment;
DROP TABLE IF EXISTS Maintenance_Request;
DROP TABLE IF EXISTS Student;
DROP TABLE IF EXISTS Room;
DROP TABLE IF EXISTS Hall_Officer;
DROP TABLE IF EXISTS Hall;
DROP TABLE IF EXISTS Maintenance_Officer;
DROP TABLE IF EXISTS Administrator;
DROP TABLE IF EXISTS User;
DROP TABLE IF EXISTS Category;
DROP TABLE IF EXISTS Status;
DROP TABLE IF EXISTS Specialty;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Create lookup tables for normalization

-- Create Category lookup table
CREATE TABLE Category (
    category_ID INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Status lookup table
CREATE TABLE Status (
    status_ID INT PRIMARY KEY AUTO_INCREMENT,
    status_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Specialty lookup table
CREATE TABLE Specialty (
    specialty_ID INT PRIMARY KEY AUTO_INCREMENT,
    specialty_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create User supertype table (normalized - single source of truth for user info)
CREATE TABLE User (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'hall officer', 'maintenance officer', 'admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Hall_Officer table (normalized - references User table)
CREATE TABLE Hall_Officer (
    manager_ID INT PRIMARY KEY AUTO_INCREMENT,
    user_ID INT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_ID) REFERENCES User(id) ON DELETE CASCADE
);

-- Create Hall table
CREATE TABLE Hall (
    hall_ID INT PRIMARY KEY AUTO_INCREMENT,
    hall_name VARCHAR(100) NOT NULL,
    manager_ID INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_ID) REFERENCES Hall_Officer(manager_ID) ON DELETE RESTRICT
);

-- Create Room table (normalized - separate entity)
CREATE TABLE Room (
    room_ID INT PRIMARY KEY AUTO_INCREMENT,
    room_number VARCHAR(10) NOT NULL,
    hall_ID INT NOT NULL,
    floor_number INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hall_ID) REFERENCES Hall(hall_ID) ON DELETE RESTRICT,
    UNIQUE KEY unique_room_per_hall (room_number, hall_ID)
);

-- Create Student table (normalized)
CREATE TABLE Student (
    student_ID INT PRIMARY KEY AUTO_INCREMENT,
    user_ID INT NOT NULL UNIQUE,
    student_number VARCHAR(20) UNIQUE,
    room_ID INT,
    enrollment_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_ID) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (room_ID) REFERENCES Room(room_ID) ON DELETE SET NULL
);

-- Create Maintenance_Officer table (normalized)
CREATE TABLE Maintenance_Officer (
    officer_ID INT PRIMARY KEY AUTO_INCREMENT,
    user_ID INT NOT NULL UNIQUE,
    specialty_ID INT NOT NULL,
    employee_number VARCHAR(20) UNIQUE,
    hire_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_ID) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (specialty_ID) REFERENCES Specialty(specialty_ID) ON DELETE RESTRICT
);

-- Create Administrator table (normalized)
CREATE TABLE Administrator (
    admin_ID INT PRIMARY KEY AUTO_INCREMENT,
    user_ID INT NOT NULL UNIQUE,
    admin_level ENUM('super_admin', 'admin', 'moderator') DEFAULT 'admin',
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_ID) REFERENCES User(id) ON DELETE CASCADE
);

-- Create Maintenance_Request table (normalized)
CREATE TABLE Maintenance_Request (
    issue_ID INT PRIMARY KEY AUTO_INCREMENT,
    student_ID INT NOT NULL,
    room_ID INT NOT NULL,
    category_ID INT NOT NULL,
    status_ID INT NOT NULL DEFAULT 1,
    description TEXT NOT NULL,
    availability TEXT,
    submission_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completion_timestamp TIMESTAMP NULL,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    FOREIGN KEY (student_ID) REFERENCES Student(student_ID) ON DELETE RESTRICT,
    FOREIGN KEY (room_ID) REFERENCES Room(room_ID) ON DELETE RESTRICT,
    FOREIGN KEY (category_ID) REFERENCES Category(category_ID) ON DELETE RESTRICT,
    FOREIGN KEY (status_ID) REFERENCES Status(status_ID) ON DELETE RESTRICT,
    INDEX idx_status (status_ID),
    INDEX idx_category (category_ID),
    INDEX idx_submission_date (submission_timestamp)
);

-- Create Officer_Assignment associative table (normalized)
CREATE TABLE Officer_Assignment (
    assignment_ID INT PRIMARY KEY AUTO_INCREMENT,
    issue_ID INT NOT NULL,
    officer_ID INT NOT NULL,
    assignment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estimated_completion_date TIMESTAMP NULL,
    actual_completion_date TIMESTAMP NULL,
    notes TEXT,
    hours_worked DECIMAL(5,2),
    FOREIGN KEY (issue_ID) REFERENCES Maintenance_Request(issue_ID) ON DELETE CASCADE,
    FOREIGN KEY (officer_ID) REFERENCES Maintenance_Officer(officer_ID) ON DELETE CASCADE,
    INDEX idx_assignment_date (assignment_date),
    INDEX idx_issue (issue_ID),
    INDEX idx_officer (officer_ID),
    UNIQUE KEY unique_active_assignment (issue_ID, officer_ID)
);

-- Create Audit_Log table
CREATE TABLE Audit_Log (
    log_ID INT PRIMARY KEY AUTO_INCREMENT,
    user_ID INT,
    action_type ENUM('created', 'updated', 'assigned', 'completed', 'canceled', 'login', 'logout') NOT NULL,
    table_affected VARCHAR(50),
    record_ID INT,
    old_values JSON,
    new_values JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    issue_ID INT NULL,
    FOREIGN KEY (user_ID) REFERENCES User(id) ON DELETE SET NULL,
    FOREIGN KEY (issue_ID) REFERENCES Maintenance_Request(issue_ID) ON DELETE SET NULL,
    INDEX idx_timestamp (timestamp),
    INDEX idx_user_action (user_ID, action_type),
    INDEX idx_table_record (table_affected, record_ID)
);

-- Create indexes for better performance
CREATE INDEX idx_student_room ON Student(room_ID);
CREATE INDEX idx_request_student ON Maintenance_Request(student_ID);
CREATE INDEX idx_request_room ON Maintenance_Request(room_ID);
CREATE INDEX idx_user_role ON User(role);
CREATE INDEX idx_user_email ON User(email);
CREATE INDEX idx_room_hall ON Room(hall_ID);
CREATE INDEX idx_officer_specialty ON Maintenance_Officer(specialty_ID);

-- Add hall_ID column to Hall_Officer table and create foreign key constraint
-- (Done after table creation to avoid circular dependency)
ALTER TABLE Hall_Officer ADD COLUMN hall_ID INT UNIQUE;
ALTER TABLE Hall_Officer ADD CONSTRAINT fk_hall_officer_hall 
    FOREIGN KEY (hall_ID) REFERENCES Hall(hall_ID) ON DELETE SET NULL;

-- Insert lookup data
INSERT INTO Category (category_name, description) VALUES 
('Electrical', 'Electrical systems and wiring issues'),
('Plumbing', 'Water, drainage, and plumbing systems'),
('Carpentry', 'Furniture, doors, windows, and wooden fixtures'),
('Welding','Welding issues in rooms'),
('General Maintenance', 'General repairs and maintenance tasks');

INSERT INTO Status (status_name, description) VALUES 
('Pending', 'Request submitted and awaiting assignment'),
('Assigned', 'Request assigned to maintenance officer'),
('In Progress', 'Work in progress'),
('Completed', 'Work completed successfully'),
('Canceled', 'Request canceled'),
('On Hold', 'Request temporarily suspended');

INSERT INTO Specialty (specialty_name, description) VALUES 
('Electrical', 'Electrical systems specialist'),
('Plumbing', 'Plumbing and water systems specialist'),
('Carpentry', 'Carpentry and woodwork specialist'),
('General Maintenance', 'General maintenance and repairs');

-- Create triggers for audit logging (updated for normalized schema)

-- Trigger for Maintenance_Request INSERT
CREATE TRIGGER tr_maintenance_request_insert
AFTER INSERT ON Maintenance_Request
FOR EACH ROW
INSERT INTO Audit_Log (user_ID, action_type, table_affected, record_ID, new_values, issue_ID)
VALUES (
    (SELECT user_ID FROM Student WHERE student_ID = NEW.student_ID),
    'created',
    'Maintenance_Request',
    NEW.issue_ID,
    JSON_OBJECT(
        'issue_ID', NEW.issue_ID,
        'category_ID', NEW.category_ID,
        'status_ID', NEW.status_ID,
        'room_ID', NEW.room_ID
    ),
    NEW.issue_ID
);

-- Trigger for Maintenance_Request UPDATE
CREATE TRIGGER tr_maintenance_request_update
AFTER UPDATE ON Maintenance_Request
FOR EACH ROW
INSERT INTO Audit_Log (user_ID, action_type, table_affected, record_ID, old_values, new_values, issue_ID)
VALUES (
    (SELECT user_ID FROM Student WHERE student_ID = NEW.student_ID),
    'updated',
    'Maintenance_Request',
    NEW.issue_ID,
    JSON_OBJECT(
        'status_ID', OLD.status_ID,
        'last_updated', OLD.last_updated
    ),
    JSON_OBJECT(
        'status_ID', NEW.status_ID,
        'last_updated', NEW.last_updated
    ),
    NEW.issue_ID
);

-- Trigger for Officer_Assignment INSERT
CREATE TRIGGER tr_officer_assignment_insert
AFTER INSERT ON Officer_Assignment
FOR EACH ROW
INSERT INTO Audit_Log (user_ID, action_type, table_affected, record_ID, new_values, issue_ID)
VALUES (
    (SELECT user_ID FROM Maintenance_Officer WHERE officer_ID = NEW.officer_ID),
    'assigned',
    'Officer_Assignment',
    NEW.assignment_ID,
    JSON_OBJECT(
        'assignment_ID', NEW.assignment_ID,
        'issue_ID', NEW.issue_ID,
        'officer_ID', NEW.officer_ID,
        'assignment_date', NEW.assignment_date
    ),
    NEW.issue_ID
);

-- Insert sample data for testing (normalized) - FIXED VERSION
INSERT INTO User (name, email, phone_number, password, role) VALUES 
('John Admin', 'admin@university.edu', '555-0001', '$2b$12$LQv3c1yqBw2FVK4AjKdO3eF8QL.vI7YB8.eCcJw4vGZxQ3ZxjCn6i', 'admin'),
('Mike Officer', 'mike.officer@university.edu', '555-0003', '$2b$12$LQv3c1yqBw2FVK4AjKdO3eF8QL.vI7YB8.eCcJw4vGZxQ3ZxjCn4f', 'hall officer'),
('Jane Student', 'jane.student@university.edu', '555-0123', '$2b$12$LQv3c1yqBw2FVK4AjKdO3eF8QL.vI7YB8.eCcJw4vGZxQ3ZxjCn1f', 'student'),
('Bob MaintenanceOfficer', 'bob.maintenance@university.edu', '555-0004', '$2b$12$LQv3c1yqBw2FVK4AjKdO3eF8QL.vI7YB8.eCcJw4vGZxQ3ZxjCn63', 'maintenance officer'),
('Sarah MaintenanceOfficer', 'sarah.maintenance@university.edu', '555-0005', '$2b$12$LQv3c1yqBw2FVK4AjKdO3eF8QL.vI7YB8.eCcJw4vGZxQ3ZxjCn64', 'maintenance officer');

INSERT INTO Hall_Officer (user_ID) VALUES 
(2);

INSERT INTO Hall (hall_name, manager_ID) VALUES 
-- Male Halls of Residence
('Peter Hall', 1),
('Paul Hall', 1),
('John Hall', 1),
('Joseph Hall', 1),
('Daniel Hall', 1),
-- Female Halls of Residence
('Esther Hall', 1),
('Mary Hall', 1),
('Deborah Hall', 1),
('Lydia Hall', 1),
('Dorcas Hall', 1);

-- Update Hall_Officer with hall_ID after halls are created
UPDATE Hall_Officer SET hall_ID = 1 WHERE manager_ID = 1;

INSERT INTO Room (room_number, hall_ID, floor_number) VALUES 
('101A', 1, 1),
('102A', 1, 1),
('201B', 2, 2);

INSERT INTO Administrator (user_ID, admin_level) VALUES 
(1, 'super_admin');

-- FIXED: Now using correct user_IDs that exist and have maintenance officer role
INSERT INTO Maintenance_Officer (user_ID, specialty_ID, employee_number, hire_date) VALUES 
(4, 1, 'EMP001', '2024-01-15'),  -- Bob MaintenanceOfficer (user_ID 4)
(5, 3, 'EMP002', '2024-02-01');  -- Sarah MaintenanceOfficer (user_ID 5)

INSERT INTO Student (user_ID, student_number, room_ID, enrollment_date) VALUES 
(3, 'STU2024001', 1, '2024-08-15');  -- Jane Student (user_ID 3)

-- Drop existing views if they exist
DROP VIEW IF EXISTS active_requests;
DROP VIEW IF EXISTS officer_workload;
DROP VIEW IF EXISTS room_maintenance_history;

-- Views for common queries (updated for normalized schema)
CREATE VIEW active_requests AS
SELECT 
    mr.issue_ID,
    c.category_name,
    s.status_name,
    r.room_number,
    h.hall_name,
    u.name as student_name,
    u.email as student_email,
    mr.submission_timestamp,
    mr.description,
    mr.estimated_cost
FROM Maintenance_Request mr
JOIN Student st ON mr.student_ID = st.student_ID
JOIN User u ON st.user_ID = u.id
JOIN Room r ON mr.room_ID = r.room_ID
JOIN Hall h ON r.hall_ID = h.hall_ID
JOIN Category c ON mr.category_ID = c.category_ID
JOIN Status s ON mr.status_ID = s.status_ID
WHERE s.status_name IN ('Pending', 'Assigned', 'In Progress');

CREATE VIEW officer_workload AS
SELECT 
    mo.officer_ID,
    u.name as officer_name,
    u.email as officer_email,
    sp.specialty_name,
    COUNT(oa.assignment_ID) as active_assignments,
    SUM(oa.hours_worked) as total_hours_worked
FROM Maintenance_Officer mo
JOIN User u ON mo.user_ID = u.id
JOIN Specialty sp ON mo.specialty_ID = sp.specialty_ID
LEFT JOIN Officer_Assignment oa ON mo.officer_ID = oa.officer_ID
LEFT JOIN Maintenance_Request mr ON oa.issue_ID = mr.issue_ID
LEFT JOIN Status s ON mr.status_ID = s.status_ID
WHERE s.status_name IN ('Pending', 'Assigned', 'In Progress') OR s.status_name IS NULL
GROUP BY mo.officer_ID, u.name, u.email, sp.specialty_name;

CREATE VIEW room_maintenance_history AS
SELECT 
    r.room_number,
    h.hall_name,
    COUNT(mr.issue_ID) as total_requests,
    AVG(CASE WHEN mr.actual_cost IS NOT NULL THEN mr.actual_cost END) as avg_cost,
    MAX(mr.submission_timestamp) as last_request_date
FROM Room r
JOIN Hall h ON r.hall_ID = h.hall_ID
LEFT JOIN Maintenance_Request mr ON r.room_ID = mr.room_ID
GROUP BY r.room_ID, r.room_number, h.hall_name;

-- Grant permissions (adjust as needed for your environment)
-- GRANT SELECT, INSERT, UPDATE ON hall_maintenance.* TO 'student_user'@'%';
-- GRANT ALL PRIVILEGES ON hall_maintenance.* TO 'admin_user'@'%';
-- GRANT SELECT, INSERT, UPDATE ON hall_maintenance.* TO 'officer_user'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON hall_maintenance.* TO 'manager_user'@'%';