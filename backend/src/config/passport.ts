import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { config } from './environment';

/**
 * Passport Configuration for OAuth Authentication
 * 
 * This module configures Passport.js for Google OAuth 2.0 authentication.
 * We use a JWT-only approach (no sessions) for stateless authentication.
 */

/**
 * Google OAuth Strategy Configuration
 * 
 * Flow:
 * 1. User clicks "Login with Google"
 * 2. Redirected to Google for authentication
 * 3. Google redirects back to our callback URL with authorization code
 * 4. Passport exchanges code for user profile
 * 5. We verify/create user and attach to req.user
 * 6. Controller generates JWT and redirects to frontend
 */

// Only configure Google OAuth if credentials are provided
if (!config.googleClientId || !config.googleClientSecret) {
  throw new Error('Google OAuth env vars missing');
}

passport.use(
  new GoogleStrategy(
    {
      clientID: config.googleClientId,
      clientSecret: config.googleClientSecret,
      callbackURL: `${config.serverUrl}/api/v1/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('Email not provided'), undefined);
        }

        return done(null, {
          email,
          name: profile.displayName,
          profilePicture: profile.photos?.[0]?.value,
          providerId: profile.id,
          authProvider: 'GOOGLE',
        });
      } catch (err) {
        done(err as Error, undefined);
      }
    }
  )
);

/**
 * Disable session serialization
 * We use JWT tokens instead of sessions for stateless authentication
 */
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

export { passport };
