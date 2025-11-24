import { Router } from 'express';
import { IStorage } from '../storage';
import { isAuthenticated } from '../middleware/auth';

// Placeholder for Revolut integration
// In a real implementation, this would use the Revolut Business API
// with OAuth2 and JWT Client Assertion

export function createRevolutRoutes(storage: IStorage) {
  const router = Router();

  // All routes require authentication
  router.use(isAuthenticated);

  // Get Revolut connection status
  router.get('/status', async (req, res) => {
    try {
      const userId = req.session.userId!;

      const connection = await storage.getRevolutConnection(userId);

      res.json({
        connected: !!connection,
        lastSync: connection?.lastSync || null,
      });
    } catch (error) {
      console.error('Get Revolut status error:', error);
      res.status(500).json({ error: 'Errore durante il recupero dello stato Revolut' });
    }
  });

  // Connect to Revolut (OAuth flow)
  router.get('/connect', async (req, res) => {
    try {
      // TODO: Implement OAuth flow with Revolut
      // 1. Generate JWT Client Assertion
      // 2. Redirect to Revolut authorization URL
      // 3. Handle callback and exchange code for tokens
      // 4. Store encrypted tokens in database

      res.status(501).json({
        error: 'Integrazione Revolut non ancora implementata',
        message: 'Questa funzionalità sarà disponibile a breve',
      });
    } catch (error) {
      console.error('Connect Revolut error:', error);
      res.status(500).json({ error: 'Errore durante la connessione a Revolut' });
    }
  });

  // Disconnect from Revolut
  router.post('/disconnect', async (req, res) => {
    try {
      const userId = req.session.userId!;

      await storage.deleteRevolutConnection(userId);

      res.json({ message: 'Disconnesso da Revolut' });
    } catch (error) {
      console.error('Disconnect Revolut error:', error);
      res.status(500).json({ error: 'Errore durante la disconnessione da Revolut' });
    }
  });

  // Get transactions
  router.get('/transactions', async (req, res) => {
    try {
      const userId = req.session.userId!;

      const connection = await storage.getRevolutConnection(userId);
      if (!connection) {
        return res.status(400).json({ error: 'Non sei connesso a Revolut' });
      }

      // TODO: Fetch transactions from Revolut API
      // 1. Check if access token is expired
      // 2. Refresh if needed
      // 3. Fetch transactions with filters (period, etc.)
      // 4. Return formatted data

      res.json([]);
    } catch (error) {
      console.error('Get Revolut transactions error:', error);
      res.status(500).json({ error: 'Errore durante il recupero delle transazioni Revolut' });
    }
  });

  // Get spending stats from Revolut
  router.get('/spending-stats', async (req, res) => {
    try {
      const userId = req.session.userId!;

      const connection = await storage.getRevolutConnection(userId);
      if (!connection) {
        return res.status(400).json({ error: 'Non sei connesso a Revolut' });
      }

      // TODO: Aggregate spending stats from Revolut transactions

      res.json({
        total: '0',
        transactionCount: 0,
        averageTransaction: '0',
      });
    } catch (error) {
      console.error('Get Revolut spending stats error:', error);
      res.status(500).json({ error: 'Errore durante il recupero delle statistiche Revolut' });
    }
  });

  return router;
}
