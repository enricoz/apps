import { Router } from 'express';
import { z } from 'zod';
import { IStorage } from '../storage';
import { isAuthenticated } from '../middleware/auth';

const updateAccountSchema = z.object({
  accountType: z.enum(['shared', 'separate', 'mixed']),
});

export function createAccountRoutes(storage: IStorage) {
  const router = Router();
  router.use(isAuthenticated);

  // Get family account settings
  router.get('/', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(403).json({ error: 'Non fai parte di una famiglia' });
      }

      const account = await storage.getFamilyAccount(member.familyId);

      // Return default if no account config exists
      if (!account) {
        return res.json({
          familyId: member.familyId,
          accountType: 'shared',
        });
      }

      res.json(account);
    } catch (error) {
      console.error('Get account error:', error);
      res.status(500).json({ error: 'Errore durante il recupero delle impostazioni account' });
    }
  });

  // Update family account type (admin only)
  router.put('/', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(403).json({ error: 'Non fai parte di una famiglia' });
      }

      const isAdmin = await storage.isFamilyAdmin(member.familyId, userId);
      if (!isAdmin) {
        return res.status(403).json({ error: 'Solo gli admin possono modificare il tipo di account' });
      }

      const data = updateAccountSchema.parse(req.body);

      const account = await storage.upsertFamilyAccount({
        familyId: member.familyId,
        accountType: data.accountType,
      });

      res.json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Update account error:', error);
      res.status(500).json({ error: 'Errore durante l\'aggiornamento del tipo di account' });
    }
  });

  // Get family balance summary (income - expenses for current month)
  router.get('/balance', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(403).json({ error: 'Non fai parte di una famiglia' });
      }

      const month = parseInt(req.query.month as string);
      const year = parseInt(req.query.year as string);

      if (!month || !year) {
        return res.status(400).json({ error: 'Mese e anno richiesti' });
      }

      const totalIncome = await storage.getTotalIncome(member.familyId, month, year);
      const totalSpending = await storage.getTotalSpending(member.familyId, userId, month, year);

      const income = parseFloat(totalIncome);
      const spending = parseFloat(totalSpending);
      const balance = income - spending;

      res.json({
        income: totalIncome,
        spending: totalSpending,
        balance: balance.toFixed(2),
        month,
        year,
      });
    } catch (error) {
      console.error('Get balance error:', error);
      res.status(500).json({ error: 'Errore durante il calcolo del bilancio' });
    }
  });

  return router;
}
