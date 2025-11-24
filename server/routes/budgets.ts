import { Router } from 'express';
import { z } from 'zod';
import { IStorage } from '../storage';
import { isAuthenticated } from '../middleware/auth';
import { insertBudgetSchema, insertFamilyBudgetSchema, insertPersonalBudgetSchema } from '../db/schema';

const budgetQuerySchema = z.object({
  month: z.string().transform(Number),
  year: z.string().transform(Number),
});

export function createBudgetRoutes(storage: IStorage) {
  const router = Router();

  // All routes require authentication
  router.use(isAuthenticated);

  // Get family budget
  router.get('/family', async (req, res) => {
    try {
      const userId = req.session.userId!;

      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(400).json({ error: 'Non fai parte di una famiglia' });
      }

      const query = budgetQuerySchema.parse(req.query);
      const budget = await storage.getFamilyBudget(member.familyId, query.month, query.year);

      res.json(budget || null);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Get family budget error:', error);
      res.status(500).json({ error: 'Errore durante il recupero del budget famiglia' });
    }
  });

  // Set family budget
  router.put('/family', async (req, res) => {
    try {
      const userId = req.session.userId!;

      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(400).json({ error: 'Non fai parte di una famiglia' });
      }

      // Only admins can set family budget
      const isAdmin = await storage.isFamilyAdmin(member.familyId, userId);
      if (!isAdmin) {
        return res.status(403).json({ error: 'Solo gli admin possono impostare il budget famiglia' });
      }

      const data = insertFamilyBudgetSchema.parse({
        ...req.body,
        familyId: member.familyId,
      });

      const budget = await storage.upsertFamilyBudget(data);

      res.json(budget);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Set family budget error:', error);
      res.status(500).json({ error: 'Errore durante l\'impostazione del budget famiglia' });
    }
  });

  // Get category budgets
  router.get('/categories', async (req, res) => {
    try {
      const userId = req.session.userId!;

      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(400).json({ error: 'Non fai parte di una famiglia' });
      }

      const query = budgetQuerySchema.parse(req.query);
      const budgets = await storage.getBudgets(member.familyId, query.month, query.year);

      res.json(budgets);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Get category budgets error:', error);
      res.status(500).json({ error: 'Errore durante il recupero dei budget categorie' });
    }
  });

  // Set category budget
  router.put('/categories/:categoryId', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { categoryId } = req.params;

      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(400).json({ error: 'Non fai parte di una famiglia' });
      }

      // Verify category exists and user has access
      const category = await storage.getCategory(categoryId, userId);
      if (!category) {
        return res.status(404).json({ error: 'Categoria non trovata' });
      }

      // Only admins can set budgets for shared categories
      if (!category.isPrivate) {
        const isAdmin = await storage.isFamilyAdmin(member.familyId, userId);
        if (!isAdmin) {
          return res.status(403).json({ error: 'Solo gli admin possono impostare budget per categorie condivise' });
        }
      }

      const data = insertBudgetSchema.parse({
        ...req.body,
        familyId: member.familyId,
        categoryId,
      });

      const budget = await storage.upsertBudget(data);

      res.json(budget);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Set category budget error:', error);
      res.status(500).json({ error: 'Errore durante l\'impostazione del budget categoria' });
    }
  });

  // Get personal budget
  router.get('/personal', async (req, res) => {
    try {
      const userId = req.session.userId!;

      const query = budgetQuerySchema.parse(req.query);
      const budget = await storage.getPersonalBudget(userId, query.month, query.year);

      res.json(budget || null);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Get personal budget error:', error);
      res.status(500).json({ error: 'Errore durante il recupero del budget personale' });
    }
  });

  // Set personal budget
  router.put('/personal', async (req, res) => {
    try {
      const userId = req.session.userId!;

      const data = insertPersonalBudgetSchema.parse({
        ...req.body,
        userId,
      });

      const budget = await storage.upsertPersonalBudget(data);

      res.json(budget);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Set personal budget error:', error);
      res.status(500).json({ error: 'Errore durante l\'impostazione del budget personale' });
    }
  });

  return router;
}
