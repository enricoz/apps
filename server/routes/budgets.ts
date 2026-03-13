import { Router } from 'express';
import { z } from 'zod';
import { IStorage } from '../storage';
import { isAuthenticated } from '../middleware/auth';
import { insertBudgetSchema, insertFamilyBudgetSchema, insertPersonalBudgetSchema, insertYearlyBudgetSchema } from '../db/schema';

const yearlyBudgetBodySchema = z.object({
  yearlyAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Importo non valido'),
  year: z.number().int().min(2020),
  alertThreshold: z.number().int().min(1).max(100).default(80),
});

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

  // ============ YEARLY BUDGETS ============

  // Get yearly budgets
  router.get('/yearly', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(400).json({ error: 'Non fai parte di una famiglia' });
      }

      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const budgets = await storage.getYearlyBudgets(member.familyId, year);
      res.json(budgets);
    } catch (error) {
      console.error('Get yearly budgets error:', error);
      res.status(500).json({ error: 'Errore durante il recupero dei budget annuali' });
    }
  });

  // Set yearly budget for a category
  router.put('/yearly/:categoryId', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { categoryId } = req.params;

      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(400).json({ error: 'Non fai parte di una famiglia' });
      }

      const isAdmin = await storage.isFamilyAdmin(member.familyId, userId);
      if (!isAdmin) {
        return res.status(403).json({ error: 'Solo gli admin possono impostare budget annuali' });
      }

      const category = await storage.getCategory(categoryId, userId);
      if (!category) {
        return res.status(404).json({ error: 'Categoria non trovata' });
      }

      const body = yearlyBudgetBodySchema.parse(req.body);
      const budget = await storage.upsertYearlyBudget({
        familyId: member.familyId,
        categoryId,
        yearlyAmount: body.yearlyAmount,
        year: body.year,
        alertThreshold: body.alertThreshold,
      });

      res.json(budget);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Set yearly budget error:', error);
      res.status(500).json({ error: 'Errore durante l\'impostazione del budget annuale' });
    }
  });

  // Delete yearly budget
  router.delete('/yearly/:id', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(400).json({ error: 'Non fai parte di una famiglia' });
      }

      const isAdmin = await storage.isFamilyAdmin(member.familyId, userId);
      if (!isAdmin) {
        return res.status(403).json({ error: 'Solo gli admin possono eliminare budget annuali' });
      }

      await storage.deleteYearlyBudget(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete yearly budget error:', error);
      res.status(500).json({ error: 'Errore durante l\'eliminazione del budget annuale' });
    }
  });

  // ============ BUDGET STATUS (comprehensive overview with alerts) ============

  router.get('/status', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(400).json({ error: 'Non fai parte di una famiglia' });
      }

      const month = parseInt(req.query.month as string) || (new Date().getMonth() + 1);
      const year = parseInt(req.query.year as string) || new Date().getFullYear();

      // Get all data in parallel
      const [familyBudget, categoryBudgets, yearlyBudgets, categories] = await Promise.all([
        storage.getFamilyBudget(member.familyId, month, year),
        storage.getBudgets(member.familyId, month, year),
        storage.getYearlyBudgets(member.familyId, year),
        storage.getCategories(member.familyId, userId),
      ]);

      // Compute spending per category for yearly budgets
      const yearlyStatus = await Promise.all(
        yearlyBudgets.map(async (yb) => {
          const spent = await storage.getYearlyCategorySpending(member.familyId, yb.categoryId, year);
          const spentNum = parseFloat(spent);
          const capNum = parseFloat(yb.yearlyAmount);
          const percentage = capNum > 0 ? (spentNum / capNum) * 100 : 0;
          const category = categories.find(c => c.id === yb.categoryId);

          let alertLevel: 'ok' | 'warning' | 'danger' | 'exceeded' = 'ok';
          if (percentage >= 100) alertLevel = 'exceeded';
          else if (percentage >= yb.alertThreshold) alertLevel = 'danger';
          else if (percentage >= yb.alertThreshold * 0.8) alertLevel = 'warning';

          return {
            ...yb,
            categoryName: category?.name,
            categoryIcon: category?.icon,
            categoryColor: category?.color,
            spent,
            percentage: Math.round(percentage * 10) / 10,
            alertLevel,
          };
        })
      );

      // Monthly category status
      const monthlyStatus = await Promise.all(
        categoryBudgets.map(async (cb) => {
          const categoryExpenses = await storage.getCategorySpending(member.familyId, cb.categoryId, month, year);
          const spentNum = parseFloat(categoryExpenses);
          const capNum = parseFloat(cb.amount);
          const percentage = capNum > 0 ? (spentNum / capNum) * 100 : 0;
          const category = categories.find(c => c.id === cb.categoryId);

          let alertLevel: 'ok' | 'warning' | 'danger' | 'exceeded' = 'ok';
          if (percentage >= 100) alertLevel = 'exceeded';
          else if (percentage >= 80) alertLevel = 'danger';
          else if (percentage >= 60) alertLevel = 'warning';

          return {
            ...cb,
            categoryName: category?.name,
            categoryIcon: category?.icon,
            categoryColor: category?.color,
            spent: categoryExpenses,
            percentage: Math.round(percentage * 10) / 10,
            alertLevel,
          };
        })
      );

      res.json({
        familyBudget,
        monthlyCategories: monthlyStatus,
        yearlyCategories: yearlyStatus,
        month,
        year,
      });
    } catch (error) {
      console.error('Get budget status error:', error);
      res.status(500).json({ error: 'Errore durante il recupero dello stato budget' });
    }
  });

  return router;
}
