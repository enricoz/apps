import { Router } from 'express';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import passport from 'passport';
import { IStorage } from '../storage';
import { hashPassword, comparePassword, isAuthenticated } from '../middleware/auth';

const registerSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'La password deve essere di almeno 6 caratteri'),
  fullName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(1, 'Password richiesta'),
});

export function createAuthRoutes(storage: IStorage) {
  const router = Router();

  // Register
  router.post('/register', async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email già registrata' });
      }

      // Hash password
      const hashedPassword = await hashPassword(data.password);

      // Create user
      const user = await storage.createUser({
        id: nanoid(),
        email: data.email,
        password: hashedPassword,
        fullName: data.fullName,
      });

      // Store user ID in session
      req.session.userId = user.id;

      res.json({
        message: 'Registrazione completata',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Register error:', error);
      res.status(500).json({ error: 'Errore durante la registrazione' });
    }
  });

  // Login
  router.post('/login', async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);

      // Get user
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ error: 'Email o password non corretti' });
      }

      // Check if user has a password (OAuth-only users don't)
      if (!user.password) {
        return res.status(401).json({
          error: `Questo account usa il login con ${user.authProvider}. Usa il pulsante corrispondente.`,
        });
      }

      // Verify password
      const isValid = await comparePassword(data.password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Email o password non corretti' });
      }

      // Store user ID in session
      req.session.userId = user.id;

      res.json({
        message: 'Login effettuato',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Login error:', error);
      res.status(500).json({ error: 'Errore durante il login' });
    }
  });

  // Logout
  router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Errore durante il logout' });
      }
      res.json({ message: 'Logout effettuato' });
    });
  });

  // Get current user
  router.get('/me', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: 'Utente non trovato' });
      }

      // Get family membership
      const familyMember = await storage.getFamilyMember(userId);
      let family = null;

      if (familyMember) {
        family = await storage.getFamily(familyMember.familyId);
      }

      // Don't send password to client
      const { password, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword,
        familyMember,
        family,
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Errore durante il recupero dell\'utente' });
    }
  });

  // Update profile
  router.patch('/profile', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const updateSchema = z.object({
        fullName: z.string().min(1).optional(),
        profilePicture: z.string().optional(),
      });
      const data = updateSchema.parse(req.body);
      const updated = await storage.updateUser(userId, data);
      if (!updated) {
        return res.status(404).json({ error: 'Utente non trovato' });
      }
      const { password, ...userWithoutPassword } = updated;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Errore durante l\'aggiornamento del profilo' });
    }
  });

  // ========== OAUTH ROUTES ==========
  const CLIENT_URL = process.env.CLIENT_URL || '/';

  // Helper: handle successful OAuth login
  function handleOAuthSuccess(req: any, res: any) {
    const user = req.user;
    if (user) {
      // Store userId in session (same as email/password login)
      req.session.userId = user.id;
    }
    res.redirect(CLIENT_URL);
  }

  function handleOAuthError(req: any, res: any) {
    res.redirect(`${CLIENT_URL}?error=auth_failed`);
  }

  // --- Google ---
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: `${CLIENT_URL}?error=google_auth_failed` }),
    handleOAuthSuccess
  );

  // --- Facebook ---
  router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
  router.get(
    '/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: `${CLIENT_URL}?error=facebook_auth_failed` }),
    handleOAuthSuccess
  );

  // --- Microsoft ---
  router.get('/microsoft', passport.authenticate('microsoft', { scope: ['user.read'] }));
  router.get(
    '/microsoft/callback',
    passport.authenticate('microsoft', { failureRedirect: `${CLIENT_URL}?error=microsoft_auth_failed` }),
    handleOAuthSuccess
  );

  // --- Apple ---
  router.get('/apple', passport.authenticate('apple'));
  router.post(
    '/apple/callback',
    passport.authenticate('apple', { failureRedirect: `${CLIENT_URL}?error=apple_auth_failed` }),
    handleOAuthSuccess
  );

  // --- Get linked OAuth accounts for current user ---
  router.get('/oauth-accounts', isAuthenticated, async (req, res) => {
    try {
      const accounts = await storage.getOauthAccountsByUser(req.session.userId!);
      res.json(
        accounts.map((a) => ({
          id: a.id,
          provider: a.provider,
          createdAt: a.createdAt,
        }))
      );
    } catch (error) {
      console.error('Get OAuth accounts error:', error);
      res.status(500).json({ error: 'Errore durante il recupero degli account OAuth' });
    }
  });

  return router;
}
