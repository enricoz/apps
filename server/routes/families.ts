import { Router } from 'express';
import { z } from 'zod';
import { IStorage } from '../storage';
import { isAuthenticated } from '../middleware/auth';

const createFamilySchema = z.object({
  name: z.string().min(1, 'Il nome della famiglia è richiesto'),
});

export function createFamilyRoutes(storage: IStorage) {
  const router = Router();

  // All routes require authentication
  router.use(isAuthenticated);

  // Create family
  router.post('/', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const data = createFamilySchema.parse(req.body);

      // Check if user already has a family
      const existingMember = await storage.getFamilyMember(userId);
      if (existingMember) {
        return res.status(400).json({ error: 'Sei già membro di una famiglia' });
      }

      // Create family
      const family = await storage.createFamily({
        name: data.name,
        createdBy: userId,
      });

      // Add creator as admin
      await storage.createFamilyMember({
        familyId: family.id,
        userId,
        role: 'admin',
      });

      res.json(family);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Create family error:', error);
      res.status(500).json({ error: 'Errore durante la creazione della famiglia' });
    }
  });

  // Get family details
  router.get('/:id', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { id } = req.params;

      // Verify user is member of this family
      const member = await storage.getFamilyMember(userId);
      if (!member || member.familyId !== id) {
        return res.status(403).json({ error: 'Non autorizzato' });
      }

      const family = await storage.getFamily(id);
      if (!family) {
        return res.status(404).json({ error: 'Famiglia non trovata' });
      }

      // Get all members
      const members = await storage.getFamilyMembers(id);

      res.json({
        ...family,
        members,
      });
    } catch (error) {
      console.error('Get family error:', error);
      res.status(500).json({ error: 'Errore durante il recupero della famiglia' });
    }
  });

  // Update family
  router.patch('/:id', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { id } = req.params;

      // Verify user is admin of this family
      const isAdmin = await storage.isFamilyAdmin(id, userId);
      if (!isAdmin) {
        return res.status(403).json({ error: 'Solo gli admin possono modificare la famiglia' });
      }

      const data = createFamilySchema.partial().parse(req.body);
      const family = await storage.updateFamily(id, data);

      if (!family) {
        return res.status(404).json({ error: 'Famiglia non trovata' });
      }

      res.json(family);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Update family error:', error);
      res.status(500).json({ error: 'Errore durante l\'aggiornamento della famiglia' });
    }
  });

  // Remove family member (admin only)
  router.delete('/:id/members/:memberId', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { id, memberId } = req.params;

      // Verify user is admin of this family
      const isAdmin = await storage.isFamilyAdmin(id, userId);
      if (!isAdmin) {
        return res.status(403).json({ error: 'Solo gli admin possono rimuovere membri' });
      }

      // Cannot remove yourself
      if (memberId === userId) {
        return res.status(400).json({ error: 'Non puoi rimuovere te stesso' });
      }

      await storage.removeFamilyMember(id, memberId);
      res.json({ message: 'Membro rimosso con successo' });
    } catch (error) {
      console.error('Remove member error:', error);
      res.status(500).json({ error: 'Errore durante la rimozione del membro' });
    }
  });

  return router;
}
