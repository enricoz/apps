import { Router } from 'express';
import { z } from 'zod';
import { IStorage } from '../storage';
import { isAuthenticated } from '../middleware/auth';

const analyticsQuerySchema = z.object({
  month: z.string().transform(Number),
  year: z.string().transform(Number),
});

export function createAnalyticsRoutes(storage: IStorage) {
  const router = Router();

  // All routes require authentication
  router.use(isAuthenticated);

  // Get family spending by category (CRITICAL: filtered by userId for personal analytics)
  router.get('/spending-by-category', async (req, res) => {
    try {
      const userId = req.session.userId!;

      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(400).json({ error: 'Non fai parte di una famiglia' });
      }

      const query = analyticsQuerySchema.parse(req.query);

      // CRITICAL: This method filters by userId to show only categories the user has access to
      const spending = await storage.getFamilySpendingByCategory(
        member.familyId,
        userId,
        query.month,
        query.year
      );

      res.json(spending);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Get spending by category error:', error);
      res.status(500).json({ error: 'Errore durante il recupero delle statistiche' });
    }
  });

  // Get total spending (CRITICAL: filtered by userId)
  router.get('/total-spending', async (req, res) => {
    try {
      const userId = req.session.userId!;

      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(400).json({ error: 'Non fai parte di una famiglia' });
      }

      const query = analyticsQuerySchema.parse(req.query);

      // CRITICAL: This method filters by userId
      const total = await storage.getTotalSpending(
        member.familyId,
        userId,
        query.month,
        query.year
      );

      res.json({ total });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Get total spending error:', error);
      res.status(500).json({ error: 'Errore durante il recupero del totale speso' });
    }
  });

  // Get personal spending
  router.get('/personal-spending', async (req, res) => {
    try {
      const userId = req.session.userId!;

      const query = analyticsQuerySchema.parse(req.query);

      const total = await storage.getPersonalSpending(userId, query.month, query.year);

      res.json({ total });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Get personal spending error:', error);
      res.status(500).json({ error: 'Errore durante il recupero della spesa personale' });
    }
  });

  return router;
}
