# Railway Deployment Guide - Backend

## Prerequisites
1. Railway account (https://railway.app)
2. MySQL database service on Railway

## Deployment Steps

### 1. Create MySQL Database
```bash
# In Railway dashboard, create a MySQL service
# Note down the connection details
```

### 2. Deploy Backend
1. Fork/clone this repository
2. Connect your GitHub repository to Railway
3. Create a new service for the backend
4. Set the following environment variables in Railway:

```env
DB_HOST=your-railway-mysql-host
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-railway-mysql-password
DB_NAME=railway
DEBUG=False
PORT=8000
SECRET_KEY=your-super-secret-key-change-this
FRONTEND_URL=https://your-frontend-app.up.railway.app
```

### 3. Deploy
- Railway will automatically deploy from the `backend` directory
- The `railway.json` file configures the build and deployment
- The app will be available at your Railway-provided URL

### 4. Initialize Database
Once deployed, you may need to create tables manually or through the API.

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | MySQL host | localhost |
| `DB_PORT` | MySQL port | 3306 |
| `DB_USER` | MySQL username | root |
| `DB_PASSWORD` | MySQL password | "" |
| `DB_NAME` | Database name | railway |
| `DEBUG` | Debug mode | False |
| `PORT` | Server port | 8000 |
| `SECRET_KEY` | JWT secret key | Required |
| `FRONTEND_URL` | Frontend URL for CORS | Required |

## API Endpoints

After deployment, your API will be available at:
- Root: `https://your-backend-app.up.railway.app/`
- Docs: `https://your-backend-app.up.railway.app/docs`
- Health: `https://your-backend-app.up.railway.app/health`
