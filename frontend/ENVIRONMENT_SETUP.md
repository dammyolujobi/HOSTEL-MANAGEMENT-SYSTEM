# Hostel Management System - Frontend Environment Configuration

## Quick Start

### For Local Development (Backend running locally)

#### Option 1: Use the environment switcher (Windows)
```bash
# Run in the frontend directory
switch-env.bat
# Choose option 1 for local development
```

#### Option 2: Manual configuration
```bash
# Create/update .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

### For Production (Railway backend)

#### Option 1: Use the environment switcher (Windows)
```bash
# Run in the frontend directory  
switch-env.bat
# Choose option 2 for production
```

#### Option 2: Manual configuration
```bash
# Create/update .env.local file
echo "NEXT_PUBLIC_API_URL=https://hostel-management-system-production-cc97.up.railway.app" > .env.local
```

## Environment Files

- `.env.development` - Used automatically during `npm run dev` when no `.env.local` exists
- `.env.production` - Used automatically during `npm run build` when no `.env.local` exists  
- `.env.local` - **Always takes priority** - use this to override the environment

## Development Workflow

### Local Development
1. Start your FastAPI backend locally:
   ```bash
   cd backend
   python main.py
   # Backend runs on http://localhost:8000
   ```

2. Configure frontend for local backend:
   ```bash
   cd frontend
   switch-env.bat  # Choose option 1
   # OR manually: echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
   ```

3. Start frontend:
   ```bash
   npm run dev
   # Frontend runs on http://localhost:3000
   ```

### Production Testing
1. Configure frontend for production backend:
   ```bash
   cd frontend
   switch-env.bat  # Choose option 2
   # OR manually: echo "NEXT_PUBLIC_API_URL=https://hostel-management-system-production-cc97.up.railway.app" > .env.local
   ```

2. Start frontend:
   ```bash
   npm run dev
   # Frontend runs on http://localhost:3000 but calls production API
   ```

## API Endpoints

The frontend automatically adds the `/api/v1` prefix to all API calls:

### Local Development
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api/v1/*`
- Examples:
  - Login: `http://localhost:8000/api/v1/auth/login/`
  - Maintenance Requests: `http://localhost:8000/api/v1/maintenance-requests/`

### Production
- Frontend: `https://your-frontend.vercel.app`
- Backend API: `https://hostel-management-system-production-cc97.up.railway.app/api/v1/*`
- Examples:
  - Login: `https://hostel-management-system-production-cc97.up.railway.app/api/v1/auth/login/`
  - Maintenance Requests: `https://hostel-management-system-production-cc97.up.railway.app/api/v1/maintenance-requests/`

## Troubleshooting

### CORS Issues
If you get CORS errors in local development, make sure:
1. Your backend CORS is configured to allow `http://localhost:3000`
2. Your frontend is calling `http://localhost:8000` (not https)

### 404 Errors
If you get 404 errors:
1. Check that your API URL includes the `/api/v1` prefix
2. Verify the backend is running on the expected port
3. Check the browser dev tools Network tab to see the actual URLs being called

### Environment Not Switching
If changes don't take effect:
1. Restart the Next.js dev server (`npm run dev`)
2. Clear browser cache
3. Check the browser console for the "🔗 API Base URL:" log message
