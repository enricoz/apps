import { Router } from 'express';
import { z } from 'zod';
import { IStorage } from '../storage';
import { isAuthenticated } from '../middleware/auth';
import { insertCategorySchema } from '../db/schema';

export function createCategoryRoutes(storage: IStorage) {
  const router = Router();

  // All routes require authentication
  router.use(isAuthenticated);

  // Get all categories (CRITICAL: filtered by userId for private categories)
  router.get('/', async (req, res) => {
    try {
      const userId = req.session.userId!;

      // Get user's family
      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(400).json({ error: 'Non fai parte di una famiglia' });
      }

      // CRITICAL: This method filters private categories by userId
      const categories = await storage.getCategories(member.familyId, userId);

      res.json(categories);
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ error: 'Errore durante il recupero delle categorie' });
    }
  });

  // Create category
  router.post('/', async (req, res) => {
    try {
      const userId = req.session.userId!;

      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(400).json({ error: 'Non fai parte di una famiglia' });
      }

      const data = insertCategorySchema.parse({
        ...req.body,
        familyId: member.familyId,
        userId: req.body.isPrivate ? userId : null,
      });

      const category = await storage.createCategory(data);

      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Create category error:', error);
      res.status(500).json({ error: 'Errore durante la creazione della categoria' });
    }
  });

  // Update category
  router.patch('/:id', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { id } = req.params;

      const data = insertCategorySchema.partial().parse(req.body);

      // CRITICAL: updateCategory checks if user owns the category
      const category = await storage.updateCategory(id, userId, data);

      if (!category) {
        return res.status(404).json({ error: 'Categoria non trovata o non autorizzato' });
      }

      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Update category error:', error);
      res.status(500).json({ error: 'Errore durante l\'aggiornamento della categoria' });
    }
  });

  // Delete category
  router.delete('/:id', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { id } = req.params;

      // CRITICAL: deleteCategory checks if user owns the category
      await storage.deleteCategory(id, userId);

      res.json({ message: 'Categoria eliminata con successo' });
    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({ error: 'Errore durante l\'eliminazione della categoria' });
    }
  });

  return router;
}
