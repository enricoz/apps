import { Request, Response, NextFunction } from 'express';
import { Issuer, Client, generators, TokenSet } from 'openid-client';

// Extend Express Request type to include session and user
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    code_verifier?: string;
    state?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        claims: {
          sub: string;
          email: string;
          name?: string;
          picture?: string;
        };
      };
    }
  }
}

let oidcClient: Client | null = null;

export async function initializeOIDC(): Promise<Client> {
  if (oidcClient) {
    return oidcClient;
  }

  try {
    const replitIssuer = await Issuer.discover(
      'https://replit.com/.well-known/openid-configuration'
    );

    oidcClient = new replitIssuer.Client({
      client_id: process.env.REPLIT_CLIENT_ID!,
      client_secret: process.env.REPLIT_CLIENT_SECRET!,
      redirect_uris: [process.env.REPLIT_REDIRECT_URI!],
      response_types: ['code'],
    });

    console.log('✅ OIDC client initialized');
    return oidcClient;
  } catch (error) {
    console.error('❌ Failed to initialize OIDC client:', error);
    throw error;
  }
}

export function getOIDCClient(): Client {
  if (!oidcClient) {
    throw new Error('OIDC client not initialized');
  }
  return oidcClient;
}

export function generateAuthUrl(codeVerifier: string, state: string): string {
  const client = getOIDCClient();
  const codeChallenge = generators.codeChallenge(codeVerifier);

  return client.authorizationUrl({
    scope: 'openid email profile',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
  });
}

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<TokenSet> {
  const client = getOIDCClient();

  return await client.callback(
    process.env.REPLIT_REDIRECT_URI!,
    { code },
    { code_verifier: codeVerifier }
  );
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Non autenticato' });
  }

  // Load user claims from session (would be loaded from DB in real app)
  // For now, we'll set a placeholder
  req.user = {
    claims: {
      sub: req.session.userId,
      email: '', // Will be populated from DB
      name: '',
      picture: '',
    },
  };

  next();
}

// Middleware to check if user is family admin
export async function isAdmin(req: Request, res: Response, next: NextFunction) {
  // This will be implemented when we have storage available in routes
  next();
}
