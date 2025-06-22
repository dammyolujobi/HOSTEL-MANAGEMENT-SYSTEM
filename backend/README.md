# Hostel Management System - Backend API

A FastAPI-based backend for managing hostel maintenance requests, built with a normalized database schema and modular architecture.

## 🏗️ Architecture

``` 
backend/
├── api/
│   └── routes/          # API route handlers
├── crud/                # Database CRUD operations
├── database/            # Database configuration and connection
├── models/              # SQLAlchemy ORM models
├── schemas/             # Pydantic schemas for validation
├── config.py           # Application configuration
├── main.py             # FastAPI application entry point
├── run.py              # Startup script
├── requirements.txt    # Python dependencies
└── .env               # Environment variables
```

## 🚀 Quick Start

### Prerequisites  
- Python 3.8+
- MySQL 8.0+
- Git

### 1. Environment Setup

1. Copy the environment file and configure your settings:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=hostelmanagementsystem
   ```

### 2. Database Setup

1. Create the database:
   ```sql
   CREATE DATABASE hostelmanagementsystem;
   ```

2. Run the schema file to create tables:
   ```bash
   mysql -u your_username -p hostelmanagementsystem < database/schema.sql
   ```

### 3. Install Dependencies and Run

```bash
# Install dependencies
python run.py --install

# Check database connection
python run.py --check-db

# Create/update tables (optional, done automatically)
python run.py --create-tables

# Start the server
python run.py --run
```

Or manually:
```bash
# Install dependencies
pip install -r requirements.txt

# Run the application
python main.py
```

## 📚 API Documentation

Once the server is running, you can access:

- **Interactive API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 🛠️ Features

### Core Functionality
- ✅ **User Management**: Students, Officers, Managers, Administrators
- ✅ **Maintenance Requests**: Create, track, and manage maintenance issues
- ✅ **Room & Hall Management**: Hierarchical structure for accommodation
- ✅ **Officer Assignment**: Assign maintenance officers to requests
- ✅ **Audit Logging**: Track all system changes
- ✅ **Status Tracking**: Real-time request status updates

### API Endpoints

#### Users (`/api/v1/users`)
- `GET /` - List all users (with role filtering)
- `GET /{user_id}` - Get user by ID
- `GET /email/{email}` - Get user by email
- `POST /` - Create new user
- `PUT /{user_id}` - Update user
- `DELETE /{user_id}` - Delete user

#### Maintenance Requests (`/api/v1/maintenance-requests`)
- `GET /` - List requests (with filtering)
- `GET /active` - Get active requests
- `GET /hall/{hall_id}` - Get requests by hall
- `GET /{request_id}` - Get specific request
- `POST /` - Create new request
- `PUT /{request_id}` - Update request
- `DELETE /{request_id}` - Delete request

## 🗄️ Database Schema

The system uses a normalized MySQL database with the following key entities:

### Core Tables
- **User**: Base user information for all system users
- **Student**: Student-specific data linked to users
- **MaintenanceOfficer**: Officer information with specialties
- **HallManager**: Hall management personnel
- **Administrator**: System administrators

### Operational Tables
- **Hall**: Hostel building information
- **Room**: Individual room details
- **MaintenanceRequest**: Service requests from students
- **OfficerAssignment**: Assignment of officers to requests
- **AuditLog**: System activity tracking

### Lookup Tables
- **Category**: Maintenance categories (electrical, plumbing, etc.)
- **Status**: Request status options
- **Specialty**: Officer specialization areas

## 🔧 Configuration

### Environment Variables
- `DB_HOST`: Database host (default: localhost)
- `DB_PORT`: Database port (default: 3306)
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name
- `SECRET_KEY`: JWT secret key
- `DEBUG`: Debug mode (default: True)

### CORS Configuration
Update `ALLOWED_ORIGINS` in config.py for your frontend URLs.

## 🧪 Development

### Code Structure
- **Models**: SQLAlchemy ORM models in `models/models.py`
- **Schemas**: Pydantic validation schemas in `schemas/schemas.py`
- **CRUD**: Database operations in `crud/` directory
- **Routes**: API endpoints in `api/routes/` directory

### Adding New Endpoints
1. Create CRUD functions in appropriate `crud/` file
2. Define schemas in `schemas/schemas.py`
3. Create route handlers in `api/routes/`
4. Include router in `main.py`

### Database Migrations
For schema changes:
1. Update models in `models/models.py`
2. Update the `schema.sql` file
3. Run database recreation or manual migration

## 🚦 Error Handling

The API uses standard HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `404`: Not Found
- `422`: Validation Error
- `500`: Internal Server Error

## 🔒 Security

- Input validation using Pydantic schemas
- SQL injection prevention through SQLAlchemy ORM
- CORS protection
- Environment-based configuration

## 📝 Logging

The application includes:
- Database query logging (in debug mode)
- Audit logging for data changes
- Request/response logging

## 🤝 Contributing

1. Follow the existing code structure
2. Add appropriate tests
3. Update documentation
4. Follow PEP 8 style guidelines

## 📄 License

This project is part of the Hostel Management System and is intended for educational/internal use.
