import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { IStorage } from '../storage';

type OAuthProvider = 'google' | 'apple' | 'microsoft' | 'facebook';

interface OAuthProfile {
  provider: OAuthProvider;
  providerAccountId: string;
  email: string;
  fullName?: string;
  profilePicture?: string;
  accessToken?: string;
  refreshToken?: string;
}

export function configurePassport(storage: IStorage) {
  // Serialize user ID into session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || null);
    } catch (err) {
      done(err, null);
    }
  });

  // Helper: handle OAuth callback for any provider
  async function handleOAuthCallback(
    profile: OAuthProfile,
    done: (error: any, user?: any) => void
  ) {
    try {
      const user = await storage.findOrCreateOauthUser({
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
        email: profile.email,
        fullName: profile.fullName,
        profilePicture: profile.profilePicture,
        accessToken: profile.accessToken,
        refreshToken: profile.refreshToken,
      });
      done(null, user);
    } catch (err) {
      done(err);
    }
  }

  // ========== GOOGLE ==========
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${process.env.APP_URL || ''}/api/auth/google/callback`,
          scope: ['profile', 'email'],
        },
        async (accessToken, refreshToken, profile, done) => {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('Email non disponibile dal profilo Google'));
          }

          await handleOAuthCallback(
            {
              provider: 'google',
              providerAccountId: profile.id,
              email,
              fullName: profile.displayName,
              profilePicture: profile.photos?.[0]?.value,
              accessToken,
              refreshToken,
            },
            done
          );
        }
      )
    );
    console.log('✅ Google OAuth configured');
  } else {
    console.log('⚠️  Google OAuth not configured (missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET)');
  }

  // ========== FACEBOOK ==========
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: `${process.env.APP_URL || ''}/api/auth/facebook/callback`,
          profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('Email non disponibile dal profilo Facebook'));
          }

          const fullName = [profile.name?.givenName, profile.name?.familyName]
            .filter(Boolean)
            .join(' ');

          await handleOAuthCallback(
            {
              provider: 'facebook',
              providerAccountId: profile.id,
              email,
              fullName: fullName || undefined,
              profilePicture: profile.photos?.[0]?.value,
              accessToken,
              refreshToken,
            },
            done
          );
        }
      )
    );
    console.log('✅ Facebook OAuth configured');
  } else {
    console.log('⚠️  Facebook OAuth not configured (missing FACEBOOK_APP_ID/FACEBOOK_APP_SECRET)');
  }

  // ========== MICROSOFT ==========
  // Using passport-microsoft (OIDCStrategy-based)
  if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
    // Dynamic import since passport-microsoft may use different strategy pattern
    const MicrosoftStrategy = require('passport-microsoft').Strategy;
    passport.use(
      new MicrosoftStrategy(
        {
          clientID: process.env.MICROSOFT_CLIENT_ID,
          clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
          callbackURL: `${process.env.APP_URL || ''}/api/auth/microsoft/callback`,
          scope: ['user.read'],
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
          const email = profile.emails?.[0]?.value || profile._json?.mail || profile._json?.userPrincipalName;
          if (!email) {
            return done(new Error('Email non disponibile dal profilo Microsoft'));
          }

          await handleOAuthCallback(
            {
              provider: 'microsoft',
              providerAccountId: profile.id,
              email,
              fullName: profile.displayName,
              profilePicture: profile.photos?.[0]?.value,
              accessToken,
              refreshToken,
            },
            done
          );
        }
      )
    );
    console.log('✅ Microsoft OAuth configured');
  } else {
    console.log('⚠️  Microsoft OAuth not configured (missing MICROSOFT_CLIENT_ID/MICROSOFT_CLIENT_SECRET)');
  }

  // ========== APPLE ==========
  // Apple Sign In requires special setup (private key, team ID, etc.)
  if (
    process.env.APPLE_CLIENT_ID &&
    process.env.APPLE_TEAM_ID &&
    process.env.APPLE_KEY_ID &&
    process.env.APPLE_PRIVATE_KEY
  ) {
    const AppleStrategy = require('passport-apple').Strategy;
    passport.use(
      new AppleStrategy(
        {
          clientID: process.env.APPLE_CLIENT_ID,
          teamID: process.env.APPLE_TEAM_ID,
          keyID: process.env.APPLE_KEY_ID,
          privateKeyString: process.env.APPLE_PRIVATE_KEY,
          callbackURL: `${process.env.APP_URL || ''}/api/auth/apple/callback`,
          scope: ['name', 'email'],
          passReqToCallback: true,
        },
        async (req: any, accessToken: string, refreshToken: string, idToken: any, profile: any, done: any) => {
          // Apple only sends name/email on first login
          const email = profile.email || idToken?.email;
          if (!email) {
            return done(new Error('Email non disponibile dal profilo Apple'));
          }

          const fullName = profile.name
            ? [profile.name.firstName, profile.name.lastName].filter(Boolean).join(' ')
            : undefined;

          await handleOAuthCallback(
            {
              provider: 'apple',
              providerAccountId: profile.id || idToken?.sub,
              email,
              fullName,
              accessToken,
              refreshToken,
            },
            done
          );
        }
      )
    );
    console.log('✅ Apple OAuth configured');
  } else {
    console.log('⚠️  Apple OAuth not configured (missing APPLE_CLIENT_ID/APPLE_TEAM_ID/APPLE_KEY_ID/APPLE_PRIVATE_KEY)');
  }

  return passport;
}
