# 🚀 Quick Environment Setup

## Current Configuration: LOCAL DEVELOPMENT ✅

**API Target:** `http://localhost:8000`

## To Switch Environments:

### 🏠 For Local Development:
Edit `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 🌍 For Production:
Edit `.env.local`:
```bash
NEXT_PUBLIC_API_URL=https://hostel-management-system-production-cc97.up.railway.app
```

## Quick Commands:

```bash
# Test environment config
node test-env.js

# Start development server
npm run dev

# Build for production
npm run build
```

## Important Notes:

1. **Always restart** `npm run dev` after changing `.env.local`
2. Check browser console for "🔗 API Base URL" to verify config
3. For local dev, make sure backend is running on port 8000
4. All API calls automatically use `/api/v1` prefix
5. POST requests automatically get trailing slashes to avoid 307 redirects
