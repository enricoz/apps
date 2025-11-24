import { Router } from 'express';
import { IStorage } from '../storage';
import { isAuthenticated } from '../middleware/auth';

export function createNotificationRoutes(storage: IStorage) {
  const router = Router();

  // All routes require authentication
  router.use(isAuthenticated);

  // Get all notifications
  router.get('/', async (req, res) => {
    try {
      const userId = req.session.userId!;

      const notifications = await storage.getNotifications(userId);

      res.json(notifications);
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ error: 'Errore durante il recupero delle notifiche' });
    }
  });

  // Get unread count
  router.get('/unread/count', async (req, res) => {
    try {
      const userId = req.session.userId!;

      const count = await storage.getUnreadNotificationsCount(userId);

      res.json({ count });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({ error: 'Errore durante il recupero del conteggio' });
    }
  });

  // Mark notification as read
  router.patch('/:id/read', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { id } = req.params;

      await storage.markNotificationAsRead(id, userId);

      res.json({ message: 'Notifica segnata come letta' });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({ error: 'Errore durante l\'aggiornamento della notifica' });
    }
  });

  // Delete notification
  router.delete('/:id', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { id } = req.params;

      await storage.deleteNotification(id, userId);

      res.json({ message: 'Notifica eliminata' });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({ error: 'Errore durante l\'eliminazione della notifica' });
    }
  });

  return router;
}
