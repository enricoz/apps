import { Router } from 'express';
import { generators } from 'openid-client';
import { IStorage } from '../storage';
import { generateAuthUrl, exchangeCodeForTokens, isAuthenticated } from '../middleware/auth';

export function createAuthRoutes(storage: IStorage) {
  const router = Router();

  // Login - redirect to Replit OIDC
  router.get('/login', (req, res) => {
    try {
      const codeVerifier = generators.codeVerifier();
      const state = generators.state();

      // Store in session
      req.session.code_verifier = codeVerifier;
      req.session.state = state;

      const authUrl = generateAuthUrl(codeVerifier, state);
      res.redirect(authUrl);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Errore durante il login' });
    }
  });

  // OAuth callback
  router.get('/callback', async (req, res) => {
    try {
      const { code, state } = req.query;

      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Codice di autorizzazione mancante' });
      }

      if (state !== req.session.state) {
        return res.status(400).json({ error: 'State mismatch' });
      }

      const codeVerifier = req.session.code_verifier;
      if (!codeVerifier) {
        return res.status(400).json({ error: 'Code verifier mancante' });
      }

      // Exchange code for tokens
      const tokenSet = await exchangeCodeForTokens(code, codeVerifier);
      const claims = tokenSet.claims();

      // Upsert user in database
      let user = await storage.getUserByEmail(claims.email!);

      if (!user) {
        user = await storage.createUser({
          id: claims.sub,
          email: claims.email!,
          fullName: claims.name,
          profilePicture: claims.picture,
        });
      }

      // Store user ID in session
      req.session.userId = user.id;

      // Clear OIDC session data
      delete req.session.code_verifier;
      delete req.session.state;

      // Redirect to frontend
      res.redirect('/');
    } catch (error) {
      console.error('Callback error:', error);
      res.status(500).json({ error: 'Errore durante l\'autenticazione' });
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

      res.json({
        user,
        familyMember,
        family,
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Errore durante il recupero dell\'utente' });
    }
  });

  return router;
}
