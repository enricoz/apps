import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';

// Extend Express Request type to include session and user
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    revolutState?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Compare password with hash
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Middleware to check if user is authenticated (session or Passport)
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  // Check session-based auth first
  if (req.session.userId) {
    req.user = {
      id: req.session.userId,
      email: '',
    };
    return next();
  }

  // Check Passport-based auth (OAuth)
  if (req.isAuthenticated && req.isAuthenticated() && (req.user as any)?.id) {
    req.session.userId = (req.user as any).id;
    return next();
  }

  return res.status(401).json({ error: 'Non autenticato' });
}

// Middleware to check if user is family admin
export async function isAdmin(req: Request, res: Response, next: NextFunction) {
  // This will be implemented when we have storage available in routes
  next();
}
