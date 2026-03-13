import { Router } from 'express';
import crypto from 'crypto';
import { IStorage } from '../storage';
import { isAuthenticated } from '../middleware/auth';
import { getRevolutService } from '../services/revolut';

export function createRevolutRoutes(storage: IStorage) {
  const router = Router();
  const revolut = getRevolutService();

  router.use(isAuthenticated);

  // Get connection status + account info
  router.get('/status', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const connection = await storage.getRevolutConnection(userId);

      if (!connection) {
        return res.json({
          connected: false,
          configured: revolut.isConfigured(),
          lastSync: null,
        });
      }

      // Try to get account balance
      let balance = null;
      try {
        const validToken = await revolut.ensureValidToken(
          connection.accessToken,
          connection.refreshToken,
          async (newAccess, newRefresh) => {
            await storage.upsertRevolutConnection({
              userId,
              accessToken: newAccess,
              refreshToken: newRefresh,
              accountId: connection.accountId,
            });
          }
        );
        balance = await revolut.getBalances(validToken, connection.accountId);
      } catch {
        // Token invalid, connection may be stale
      }

      res.json({
        connected: true,
        configured: true,
        lastSync: connection.lastSync,
        accountId: connection.accountId,
        balance,
      });
    } catch (error) {
      console.error('Get Revolut status error:', error);
      res.status(500).json({ error: 'Errore durante il recupero dello stato Revolut' });
    }
  });

  // Start OAuth consent flow
  router.get('/connect', async (req, res) => {
    try {
      if (!revolut.isConfigured()) {
        return res.status(400).json({
          error: 'Revolut non configurato',
          message: 'Le credenziali Revolut non sono state configurate nel server.',
        });
      }

      // Generate state for CSRF protection
      const state = crypto.randomBytes(32).toString('hex');
      req.session.revolutState = state;

      const consentUrl = revolut.getConsentUrl(state);
      res.json({ url: consentUrl });
    } catch (error) {
      console.error('Connect Revolut error:', error);
      res.status(500).json({ error: 'Errore durante la connessione a Revolut' });
    }
  });

  // OAuth callback
  router.get('/callback', async (req, res) => {
    try {
      const { code, state } = req.query;
      const userId = req.session.userId;

      if (!userId) {
        return res.redirect('/?error=not_authenticated');
      }

      // Validate state for CSRF protection
      if (!state || state !== req.session.revolutState) {
        return res.redirect('/?error=invalid_state');
      }
      delete req.session.revolutState;

      if (!code || typeof code !== 'string') {
        return res.redirect('/?error=no_code');
      }

      // Exchange code for tokens
      const tokens = await revolut.exchangeCode(code);

      // Get accounts to find the primary account ID
      const accounts = await revolut.getAccounts(tokens.accessToken);
      const primaryAccount = accounts[0];

      if (!primaryAccount) {
        return res.redirect('/?error=no_accounts');
      }

      // Store connection
      await storage.upsertRevolutConnection({
        userId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accountId: primaryAccount.id,
      });

      // Redirect to Revolut page
      const clientUrl = process.env.CLIENT_URL || '/';
      res.redirect(`${clientUrl}revolut?connected=true`);
    } catch (error) {
      console.error('Revolut callback error:', error);
      res.redirect('/?error=revolut_failed');
    }
  });

  // Disconnect
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

  // Get accounts list
  router.get('/accounts', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const connection = await storage.getRevolutConnection(userId);

      if (!connection) {
        return res.status(400).json({ error: 'Non sei connesso a Revolut' });
      }

      const validToken = await revolut.ensureValidToken(
        connection.accessToken,
        connection.refreshToken,
        async (newAccess, newRefresh) => {
          await storage.upsertRevolutConnection({
            userId,
            accessToken: newAccess,
            refreshToken: newRefresh,
            accountId: connection.accountId,
          });
        }
      );

      const accounts = await revolut.getAccounts(validToken);

      // Fetch balances for each account
      const accountsWithBalances = await Promise.all(
        accounts.map(async (acc) => {
          try {
            const balance = await revolut.getBalances(validToken, acc.id);
            return { ...acc, balance: balance.amount, currency: balance.currency };
          } catch {
            return acc;
          }
        })
      );

      res.json(accountsWithBalances);
    } catch (error) {
      console.error('Get Revolut accounts error:', error);
      res.status(500).json({ error: 'Errore durante il recupero dei conti Revolut' });
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

      const validToken = await revolut.ensureValidToken(
        connection.accessToken,
        connection.refreshToken,
        async (newAccess, newRefresh) => {
          await storage.upsertRevolutConnection({
            userId,
            accessToken: newAccess,
            refreshToken: newRefresh,
            accountId: connection.accountId,
          });
        }
      );

      const { from, to } = req.query;
      const transactions = await revolut.getTransactions(
        validToken,
        connection.accountId,
        from as string | undefined,
        to as string | undefined
      );

      res.json(transactions);
    } catch (error) {
      console.error('Get Revolut transactions error:', error);
      res.status(500).json({ error: 'Errore durante il recupero delle transazioni' });
    }
  });

  // Sync transactions → import as expenses
  router.post('/sync', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const connection = await storage.getRevolutConnection(userId);

      if (!connection) {
        return res.status(400).json({ error: 'Non sei connesso a Revolut' });
      }

      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(400).json({ error: 'Non fai parte di una famiglia' });
      }

      const validToken = await revolut.ensureValidToken(
        connection.accessToken,
        connection.refreshToken,
        async (newAccess, newRefresh) => {
          await storage.upsertRevolutConnection({
            userId,
            accessToken: newAccess,
            refreshToken: newRefresh,
            accountId: connection.accountId,
          });
        }
      );

      // Get transactions from last 30 days
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 30);
      const transactions = await revolut.getTransactions(
        validToken,
        connection.accountId,
        fromDate.toISOString(),
        new Date().toISOString()
      );

      // Import debit transactions as expenses (skip credits = income)
      const debits = transactions.filter(tx => tx.type === 'debit' && tx.status === 'Booked');

      // Get default category for Revolut imports
      const categories = await storage.getCategories(member.familyId, userId);
      const defaultCategory = categories.find(c => c.name === 'Revolut') || categories[0];

      if (!defaultCategory) {
        return res.status(400).json({ error: 'Nessuna categoria disponibile per l\'importazione' });
      }

      let imported = 0;
      for (const tx of debits) {
        try {
          await storage.createExpense({
            familyId: member.familyId,
            categoryId: defaultCategory.id,
            userId,
            amount: tx.amount.toFixed(2),
            description: tx.description || tx.merchant?.name || 'Transazione Revolut',
            date: new Date(tx.date),
            notes: `Revolut: ${tx.reference || tx.id}`,
          });
          imported++;
        } catch {
          // Skip duplicates or errors
        }
      }

      // Update last sync timestamp
      await storage.upsertRevolutConnection({
        userId,
        accessToken: connection.accessToken,
        refreshToken: connection.refreshToken,
        accountId: connection.accountId,
      });

      res.json({
        imported,
        total: debits.length,
        message: `Importate ${imported} transazioni su ${debits.length}`,
      });
    } catch (error) {
      console.error('Sync Revolut error:', error);
      res.status(500).json({ error: 'Errore durante la sincronizzazione' });
    }
  });

  // Get spending stats from Revolut transactions
  router.get('/spending-stats', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const connection = await storage.getRevolutConnection(userId);

      if (!connection) {
        return res.status(400).json({ error: 'Non sei connesso a Revolut' });
      }

      const validToken = await revolut.ensureValidToken(
        connection.accessToken,
        connection.refreshToken,
        async (newAccess, newRefresh) => {
          await storage.upsertRevolutConnection({
            userId,
            accessToken: newAccess,
            refreshToken: newRefresh,
            accountId: connection.accountId,
          });
        }
      );

      // Last 30 days
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 30);
      const transactions = await revolut.getTransactions(
        validToken,
        connection.accountId,
        fromDate.toISOString(),
        new Date().toISOString()
      );

      const debits = transactions.filter(tx => tx.type === 'debit');
      const credits = transactions.filter(tx => tx.type === 'credit');
      const totalSpent = debits.reduce((sum, tx) => sum + tx.amount, 0);
      const totalReceived = credits.reduce((sum, tx) => sum + tx.amount, 0);
      const avgTransaction = debits.length > 0 ? totalSpent / debits.length : 0;

      res.json({
        totalSpent: totalSpent.toFixed(2),
        totalReceived: totalReceived.toFixed(2),
        transactionCount: transactions.length,
        debitCount: debits.length,
        creditCount: credits.length,
        averageTransaction: avgTransaction.toFixed(2),
      });
    } catch (error) {
      console.error('Get Revolut spending stats error:', error);
      res.status(500).json({ error: 'Errore durante il recupero delle statistiche' });
    }
  });

  return router;
}
