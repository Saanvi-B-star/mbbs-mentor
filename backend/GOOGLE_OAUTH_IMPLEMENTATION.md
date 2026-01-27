# Google OAuth Implementation - MBBS Mentor

## Overview
Google OAuth 2.0 authentication has been successfully integrated into the MBBS Mentor backend. Users can now sign up/log in using their Google accounts.

## What Was Implemented

### 1. **Passport Configuration** (`src/config/passport.ts`)
- Created Google OAuth 2.0 strategy using `passport-google-oauth20`
- Configured to extract user profile (email, name, photo) from Google
- Session disabled (JWT-only authentication)

### 2. **Auth Service** (`src/modules/auth/auth.service.ts`)
- Added `googleAuth()` method to handle Google login/signup
- **Logic:**
  - If user exists with same email → log them in
  - If user doesn't exist → create new user with:
    - `authProvider = "GOOGLE"`
    - `emailVerified = true`
    - `passwordHash = null` (no password for OAuth users)
    - Initial 100 token bonus
- Returns JWT tokens (access + refresh)

### 3. **Auth Controller** (`src/modules/auth/auth.controller.ts`)
- Added `googleCallback()` method
- Processes OAuth data from Passport
- Redirects to frontend with JWT tokens:
  - Success: `http://localhost:3000/auth/success?token=JWT&refreshToken=JWT`
  - Error: `http://localhost:3000/auth/error?message=ERROR_MESSAGE`

### 4. **Auth Routes** (`src/modules/auth/auth.routes.ts`)
- **GET `/api/v1/auth/google`** - Initiates Google OAuth flow
- **GET `/api/v1/auth/google/callback`** - Google redirect URL after auth

### 5. **App Configuration** (`src/app.ts`)
- Initialized Passport middleware
- Imported passport config

### 6. **Environment Config** (`src/config/environment.ts`)
- Added `serverUrl` for callback URL construction
- Exposed Google OAuth credentials

### 7. **Prisma Schema**
- Already had `authProvider` enum (EMAIL, GOOGLE, APPLE) ✅
- Already had `passwordHash` as nullable ✅
- No changes needed!

## Environment Variables

Add these to your `.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Frontend URL (for OAuth redirects)
FRONTEND_URL=http://localhost:3000
```

## Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API** or **People API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web application**
6. Add authorized redirect URI:
   - Development: `http://localhost:3001/api/v1/auth/google/callback`
   - Production: `https://your-domain.com/api/v1/auth/google/callback`
7. Copy **Client ID** and **Client Secret** to `.env`

## Frontend Integration

### Login Button
```typescript
// Redirect user to backend OAuth endpoint
const handleGoogleLogin = () => {
  window.location.href = 'http://localhost:3001/api/v1/auth/google';
};
```

### Success Handler (`/auth/success` page)
```typescript
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function AuthSuccess() {
  const router = useRouter();
  
  useEffect(() => {
    const { token, refreshToken } = router.query;
    
    if (token && refreshToken) {
      // Store tokens
      localStorage.setItem('accessToken', token as string);
      localStorage.setItem('refreshToken', refreshToken as string);
      
      // Redirect to dashboard
      router.push('/dashboard');
    }
  }, [router.query]);
  
  return <div>Logging you in...</div>;
}
```

### Error Handler (`/auth/error` page)
```typescript
import { useRouter } from 'next/router';

export default function AuthError() {
  const router = useRouter();
  const { message } = router.query;
  
  return (
    <div>
      <h1>Authentication Failed</h1>
      <p>{message || 'Something went wrong'}</p>
      <button onClick={() => router.push('/login')}>
        Try Again
      </button>
    </div>
  );
}
```

## Testing

### 1. Start the Backend
```bash
cd backend
npm run dev
```

### 2. Test OAuth Flow
1. Navigate to: `http://localhost:3001/api/v1/auth/google`
2. You should be redirected to Google login
3. After authentication, you'll be redirected to frontend with tokens

### 3. Check Database
```bash
# Check if user was created
npx prisma studio
# Look for user with authProvider = "GOOGLE"
```

## Key Features

✅ **No password required** for Google users  
✅ **Email verified automatically** (Google emails are verified)  
✅ **Merges accounts** - If email exists, logs in existing user  
✅ **JWT-only** - No sessions, fully stateless  
✅ **Token bonus** - New Google users get 100 tokens  
✅ **Error handling** - Redirects to frontend with error messages  
✅ **TypeScript** - Fully typed with proper interfaces  

## Important Notes

1. **Existing email/password auth is untouched** - All existing functionality works as before
2. **No password for OAuth users** - Users who sign up with Google don't have passwords
3. **Account merging** - If a user signs up with email/password and later logs in with Google (same email), their account is updated to use Google auth
4. **Port configuration** - Backend runs on port 3001, frontend on 3000

## Next Steps

1. **Add Apple OAuth** (optional) - Similar implementation as Google
2. **Email verification** - Implement for email/password users
3. **Account linking** - Allow users to link multiple auth providers
4. **Profile picture** - Use Google profile picture in app
5. **Password reset** - Implement password reset for email/password users

## Troubleshooting

### "redirect_uri_mismatch" Error
- Make sure the callback URL in Google Console matches exactly:
  - `http://localhost:3001/api/v1/auth/google/callback`
- No trailing slashes, correct port number

### "Email not provided by Google"
- Check that you requested `email` scope in Passport config
- Verify Google account has email permission enabled

### Token not received in frontend
- Check browser console for errors
- Verify `FRONTEND_URL` in `.env` is correct
- Check that frontend has `/auth/success` and `/auth/error` pages

## Files Modified

1. ✅ `src/config/passport.ts` (NEW)
2. ✅ `src/config/environment.ts`
3. ✅ `src/config/index.ts`
4. ✅ `src/modules/auth/auth.service.ts`
5. ✅ `src/modules/auth/auth.controller.ts`
6. ✅ `src/modules/auth/auth.routes.ts`
7. ✅ `src/app.ts`
8. ✅ `.env`

## Security Considerations

- ✅ JWT secrets are 32+ characters
- ✅ Passwords are hashed with bcrypt
- ✅ OAuth uses secure HTTPS in production
- ✅ CORS configured for specific origins
- ✅ Rate limiting on auth endpoints
- ✅ Input validation with Zod schemas
- ✅ Error messages don't leak sensitive info

---

**Implementation Complete! 🎉**

The Google OAuth authentication is now fully integrated and ready to use. Users can seamlessly sign up or log in using their Google accounts while maintaining all existing email/password functionality.
