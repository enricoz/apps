import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';

// Extend Express Request type to include session and user
declare module 'express-session' {
  interface SessionData {
    userId?: string;
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

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Non autenticato' });
  }

  // Set user info from session
  req.user = {
    id: req.session.userId,
    email: '', // Will be populated from DB in routes if needed
  };

  next();
}

// Middleware to check if user is family admin
export async function isAdmin(req: Request, res: Response, next: NextFunction) {
  // This will be implemented when we have storage available in routes
  next();
}
