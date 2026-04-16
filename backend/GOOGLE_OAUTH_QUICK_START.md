# 🚀 Google OAuth - Quick Start

## Backend Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/google` | GET | Initiates Google OAuth flow |
| `/api/v1/auth/google/callback` | GET | Google callback (auto-handled) |

## Frontend Integration

### 1. Login Button
```tsx
<button onClick={() => window.location.href = 'http://localhost:3001/api/v1/auth/google'}>
  Sign in with Google
</button>
```

### 2. Success Handler (`/auth/success`)
```tsx
const { token, refreshToken } = router.query;
localStorage.setItem('accessToken', token);
localStorage.setItem('refreshToken', refreshToken);
router.push('/dashboard');
```

## Environment Setup

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
FRONTEND_URL=http://localhost:3000
PORT=3001
```

## Google Cloud Console

1. Create OAuth 2.0 Client ID
2. Add redirect URI: `http://localhost:3001/api/v1/auth/google/callback`
3. Copy credentials to `.env`

## Testing

```bash
# Start backend
cd backend && npm run dev

# Test flow
open http://localhost:3001/api/v1/auth/google
```

---

**Note:** User's Prisma schema already supports Google OAuth - no migration needed! ✅
