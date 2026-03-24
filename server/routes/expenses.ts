import { Router } from 'express';
import { z } from 'zod';
import { IStorage } from '../storage';
import { isAuthenticated } from '../middleware/auth';

const amountRegex = /^\d+(\.\d{1,2})?$/;

const createExpenseBodySchema = z.object({
  categoryId: z.string().min(1),
  description: z.string().min(1, 'Descrizione obbligatoria'),
  amount: z.string().regex(amountRegex, 'Importo non valido'),
  date: z.string().optional(),
  notes: z.string().optional(),
});

const getExpensesQuerySchema = z.object({
  categoryId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export function createExpenseRoutes(storage: IStorage) {
  const router = Router();

  // All routes require authentication
  router.use(isAuthenticated);

  // Get expenses (CRITICAL: filtered by userId for private category expenses)
  router.get('/', async (req, res) => {
    try {
      const userId = req.session.userId!;

      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(400).json({ error: 'Non fai parte di una famiglia' });
      }

      const query = getExpensesQuerySchema.parse(req.query);

      const filters: any = {};
      if (query.categoryId) {
        filters.categoryId = query.categoryId;
      }
      if (query.startDate) {
        filters.startDate = new Date(query.startDate);
      }
      if (query.endDate) {
        filters.endDate = new Date(query.endDate);
      }

      // CRITICAL: This method filters expenses from private categories by userId
      const expenses = await storage.getExpenses(member.familyId, userId, filters);

      res.json(expenses);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Get expenses error:', error);
      res.status(500).json({ error: 'Errore durante il recupero delle spese' });
    }
  });

  // Get single expense
  router.get('/:id', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { id } = req.params;

      // CRITICAL: getExpense checks if user has access to this expense
      const expense = await storage.getExpense(id, userId);

      if (!expense) {
        return res.status(404).json({ error: 'Spesa non trovata o non autorizzato' });
      }

      res.json(expense);
    } catch (error) {
      console.error('Get expense error:', error);
      res.status(500).json({ error: 'Errore durante il recupero della spesa' });
    }
  });

  // Create expense
  router.post('/', async (req, res) => {
    try {
      const userId = req.session.userId!;

      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(400).json({ error: 'Non fai parte di una famiglia' });
      }

      // Verify user has access to the category
      const category = await storage.getCategory(req.body.categoryId, userId);
      if (!category) {
        return res.status(400).json({ error: 'Categoria non trovata o non autorizzato' });
      }

      const body = createExpenseBodySchema.parse(req.body);
      const expense = await storage.createExpense({
        ...body,
        familyId: member.familyId,
        userId,
        date: body.date ? new Date(body.date) : new Date(),
      });

      // Check if budget is exceeded and create notification
      const expenseDate = new Date(expense.date);
      const month = expenseDate.getMonth() + 1;
      const year = expenseDate.getFullYear();

      // Get spending for this category
      const categorySpending = await storage.getFamilySpendingByCategory(
        member.familyId,
        userId,
        month,
        year
      );

      const categoryData = categorySpending.find(c => c.categoryId === expense.categoryId);
      if (categoryData) {
        const totalSpent = parseFloat(categoryData.total);
        const budget = await storage.getBudget(expense.categoryId, month, year);

        if (budget) {
          const budgetAmount = parseFloat(budget.amount);
          const percentage = (totalSpent / budgetAmount) * 100;

          // Create notification if budget exceeded
          if (percentage >= 90 && percentage < 100) {
            await storage.createNotification({
              userId,
              type: 'budget_warning',
              title: 'Budget quasi esaurito',
              message: `Hai raggiunto il ${percentage.toFixed(0)}% del budget per ${category.name}`,
              relatedId: expense.categoryId,
            });
          } else if (percentage >= 100) {
            await storage.createNotification({
              userId,
              type: 'budget_exceeded',
              title: 'Budget superato!',
              message: `Hai superato il budget per ${category.name}`,
              relatedId: expense.categoryId,
            });
          }
        }
      }

      res.json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Create expense error:', error);
      res.status(500).json({ error: 'Errore durante la creazione della spesa' });
    }
  });

  // Update expense
  router.patch('/:id', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { id } = req.params;

      const data = insertExpenseSchema.partial().parse({
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : undefined,
      });

      // CRITICAL: updateExpense checks if user has access to this expense
      const expense = await storage.updateExpense(id, userId, data);

      if (!expense) {
        return res.status(404).json({ error: 'Spesa non trovata o non autorizzato' });
      }

      res.json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Update expense error:', error);
      res.status(500).json({ error: 'Errore durante l\'aggiornamento della spesa' });
    }
  });

  // Delete expense
  router.delete('/:id', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { id } = req.params;

      // CRITICAL: deleteExpense checks if user has access to this expense
      await storage.deleteExpense(id, userId);

      res.json({ message: 'Spesa eliminata con successo' });
    } catch (error) {
      console.error('Delete expense error:', error);
      res.status(500).json({ error: 'Errore durante l\'eliminazione della spesa' });
    }
  });

  return router;
}
