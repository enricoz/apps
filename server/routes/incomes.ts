import { Router } from 'express';
import { z } from 'zod';
import { IStorage } from '../storage';
import { isAuthenticated } from '../middleware/auth';

const createIncomeSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Importo non valido'),
  description: z.string().min(1, 'Descrizione richiesta'),
  source: z.enum(['manual', 'revolut']).default('manual'),
  isRecurring: z.boolean().default(false),
  recurringDay: z.number().int().min(1).max(31).optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
});

const updateIncomeSchema = createIncomeSchema.partial();

export function createIncomeRoutes(storage: IStorage) {
  const router = Router();
  router.use(isAuthenticated);

  // List incomes for the family
  router.get('/', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(403).json({ error: 'Non fai parte di una famiglia' });
      }

      const { startDate, endDate, userId: filterUserId } = req.query;

      const incomes = await storage.getIncomes(member.familyId, {
        userId: filterUserId as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.json(incomes);
    } catch (error) {
      console.error('Get incomes error:', error);
      res.status(500).json({ error: 'Errore durante il recupero delle entrate' });
    }
  });

  // Get total income for a month
  router.get('/total', async (req, res) => {
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

      const total = await storage.getTotalIncome(member.familyId, month, year);
      res.json({ total });
    } catch (error) {
      console.error('Get total income error:', error);
      res.status(500).json({ error: 'Errore durante il calcolo del totale entrate' });
    }
  });

  // Get recurring incomes
  router.get('/recurring', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(403).json({ error: 'Non fai parte di una famiglia' });
      }

      const incomes = await storage.getRecurringIncomes(member.familyId);
      res.json(incomes);
    } catch (error) {
      console.error('Get recurring incomes error:', error);
      res.status(500).json({ error: 'Errore durante il recupero delle entrate ricorrenti' });
    }
  });

  // Get single income
  router.get('/:id', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(403).json({ error: 'Non fai parte di una famiglia' });
      }

      const income = await storage.getIncome(req.params.id);
      if (!income || income.familyId !== member.familyId) {
        return res.status(404).json({ error: 'Entrata non trovata' });
      }

      res.json(income);
    } catch (error) {
      console.error('Get income error:', error);
      res.status(500).json({ error: 'Errore durante il recupero dell\'entrata' });
    }
  });

  // Create income
  router.post('/', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(403).json({ error: 'Non fai parte di una famiglia' });
      }

      const data = createIncomeSchema.parse(req.body);

      const income = await storage.createIncome({
        familyId: member.familyId,
        userId,
        amount: data.amount,
        description: data.description,
        source: data.source,
        isRecurring: data.isRecurring,
        recurringDay: data.recurringDay,
        date: data.date ? new Date(data.date) : new Date(),
        notes: data.notes,
      });

      res.status(201).json(income);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Create income error:', error);
      res.status(500).json({ error: 'Errore durante la creazione dell\'entrata' });
    }
  });

  // Update income
  router.patch('/:id', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(403).json({ error: 'Non fai parte di una famiglia' });
      }

      const existing = await storage.getIncome(req.params.id);
      if (!existing || existing.familyId !== member.familyId) {
        return res.status(404).json({ error: 'Entrata non trovata' });
      }

      // Only the owner or admin can update
      if (existing.userId !== userId) {
        const isAdmin = await storage.isFamilyAdmin(member.familyId, userId);
        if (!isAdmin) {
          return res.status(403).json({ error: 'Non autorizzato a modificare questa entrata' });
        }
      }

      const data = updateIncomeSchema.parse(req.body);
      const updated = await storage.updateIncome(req.params.id, {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      });

      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Update income error:', error);
      res.status(500).json({ error: 'Errore durante l\'aggiornamento dell\'entrata' });
    }
  });

  // Delete income
  router.delete('/:id', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(403).json({ error: 'Non fai parte di una famiglia' });
      }

      const existing = await storage.getIncome(req.params.id);
      if (!existing || existing.familyId !== member.familyId) {
        return res.status(404).json({ error: 'Entrata non trovata' });
      }

      // Only the owner or admin can delete
      if (existing.userId !== userId) {
        const isAdmin = await storage.isFamilyAdmin(member.familyId, userId);
        if (!isAdmin) {
          return res.status(403).json({ error: 'Non autorizzato a eliminare questa entrata' });
        }
      }

      await storage.deleteIncome(req.params.id);
      res.json({ message: 'Entrata eliminata' });
    } catch (error) {
      console.error('Delete income error:', error);
      res.status(500).json({ error: 'Errore durante l\'eliminazione dell\'entrata' });
    }
  });

  return router;
}
