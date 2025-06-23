# 🏢 Backend Environment Configuration Guide

This backend is configured to work seamlessly across different environments:

## 🌍 Available Environments

### 1. 🏠 Local Development
- **Database**: Local MySQL server (localhost:3306)
- **Use case**: Development on your local machine
- **Configuration**: `.env.local`

### 2. 🚧 Development/Staging  
- **Database**: Railway MySQL (shared dev database)
- **Use case**: Testing, staging, or shared development
- **Configuration**: `.env.development`

### 3. 🚀 Production
- **Database**: Railway MySQL (production database) 
- **Use case**: Live production deployment
- **Configuration**: `.env.production`

## ⚙️ Quick Environment Switching

### Windows:
```bash
./switch-env.bat
```

### Linux/macOS:
```bash
chmod +x switch-env.sh
./switch-env.sh
```

### Manual:
Copy the desired environment file to `.env`:
```bash
# For development
cp .env.development .env

# For production  
cp .env.production .env

# For local
cp .env.local .env
```

## 🔧 Environment-Specific Features

### Database Drivers
- **Local/Development**: `mysql+mysqlconnector` (mysql-connector-python)
- **Production**: `mysql+pymysql` (PyMySQL - more stable for Railway)

### Connection Pooling
- **Local**: Larger pool (5 connections, 10 overflow)
- **Production**: Smaller pool (3 connections, 2 overflow) for Railway limits

### Connection Timeouts
- **Local**: 60 seconds (generous for development)
- **Production**: 20 seconds (Railway optimized)

### CORS Origins
- **Local**: `localhost:3000`, `127.0.0.1:3000`
- **Production**: Only specific production URLs

## 🚀 Deployment Instructions

### Railway Deployment

1. **Set Environment Variables** in Railway dashboard:
   ```
   ENVIRONMENT=production
   SECRET_KEY=your-super-secure-production-key
   ```

2. **Database** will auto-configure from Railway's MySQL service

3. **Deploy**: Railway auto-deploys from GitHub

### Local Development Setup

1. **Install MySQL** locally
2. **Create database**: `hostel_management`
3. **Update** `.env.local` with your MySQL credentials:
   ```env
   DB_PASSWORD=your_local_mysql_password
   ```
4. **Switch environment**:
   ```bash
   ./switch-env.bat  # Windows
   # or
   ./switch-env.sh   # Linux/macOS
   ```
5. **Start server**:
   ```bash
   uvicorn main:app --reload
   ```

## 🔍 Health Monitoring

### Health Check Endpoint
```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "environment": "production", 
  "version": "1.0.0",
  "database": "connected"
}
```

### Logging
- **Development**: DEBUG level, detailed logs
- **Production**: INFO level, structured logs

## 🛡️ Security Notes

### Production Checklist
- [ ] Strong `SECRET_KEY` (64+ random characters)
- [ ] Restricted CORS origins (no wildcards)
- [ ] Database credentials secured
- [ ] API docs disabled (`/docs`, `/redoc`)
- [ ] Error messages sanitized

### Environment Variables
Never commit `.env` files to git. Each environment has its own:
- `.env.local` - Local development
- `.env.development` - Development/staging  
- `.env.production` - Production secrets

## 🐛 Troubleshooting

### Database Connection Issues
1. Check environment with `GET /health`
2. Verify database credentials in current `.env`
3. Test connection: `python -c "from database.database import check_database_health; print(check_database_health())"`

### Railway Specific Issues
- Connection drops: Handled with automatic reconnection
- Pool exhaustion: Reduced pool size for Railway limits
- Timeouts: Optimized for Railway's connection timeouts

### Local MySQL Issues
- Service not running: `brew services start mysql` (macOS) or start MySQL service
- Wrong credentials: Update `.env.local`
- Database not created: `CREATE DATABASE hostel_management;`

## 📝 Example Configurations

### `.env.local` (Local Development)
```env
ENVIRONMENT=local
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hostel_management
SECRET_KEY=local-dev-key
ALLOWED_ORIGINS=http://localhost:3000
```

### `.env.production` (Railway)
```env
ENVIRONMENT=production
SECRET_KEY=super-secure-64-char-random-string
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

Railway auto-injects database credentials for production.
