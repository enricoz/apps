import { Router } from 'express';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { IStorage } from '../storage';
import { isAuthenticated } from '../middleware/auth';

const createInviteSchema = z.object({
  email: z.string().email('Email non valida'),
});

export function createInviteRoutes(storage: IStorage) {
  const router = Router();

  // All routes require authentication
  router.use(isAuthenticated);

  // Get family invites (admin only)
  router.get('/', async (req, res) => {
    try {
      const userId = req.session.userId!;

      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(400).json({ error: 'Non fai parte di una famiglia' });
      }

      // Only admins can view invites
      const isAdmin = await storage.isFamilyAdmin(member.familyId, userId);
      if (!isAdmin) {
        return res.status(403).json({ error: 'Solo gli admin possono visualizzare gli inviti' });
      }

      const invites = await storage.getInvitesByFamily(member.familyId);

      res.json(invites);
    } catch (error) {
      console.error('Get invites error:', error);
      res.status(500).json({ error: 'Errore durante il recupero degli inviti' });
    }
  });

  // Create invite (admin only)
  router.post('/', async (req, res) => {
    try {
      const userId = req.session.userId!;

      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(400).json({ error: 'Non fai parte di una famiglia' });
      }

      // Only admins can create invites
      const isAdmin = await storage.isFamilyAdmin(member.familyId, userId);
      if (!isAdmin) {
        return res.status(403).json({ error: 'Solo gli admin possono inviare inviti' });
      }

      const data = createInviteSchema.parse(req.body);

      // Check if user is already in a family
      const invitedUser = await storage.getUserByEmail(data.email);
      if (invitedUser) {
        const invitedMember = await storage.getFamilyMember(invitedUser.id);
        if (invitedMember) {
          return res.status(400).json({ error: 'L\'utente è già membro di una famiglia' });
        }
      }

      // Create invite
      const token = nanoid(32);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      const invite = await storage.createInvite({
        familyId: member.familyId,
        email: data.email,
        token,
        status: 'pending',
        invitedBy: userId,
        expiresAt,
      });

      // TODO: Send email with invite link
      // For now, return the token so it can be shared manually
      res.json({
        ...invite,
        inviteUrl: `${req.protocol}://${req.get('host')}/invite/${token}`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Create invite error:', error);
      res.status(500).json({ error: 'Errore durante la creazione dell\'invito' });
    }
  });

  // Accept invite
  router.post('/:token/accept', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { token } = req.params;

      // Check if user already has a family
      const existingMember = await storage.getFamilyMember(userId);
      if (existingMember) {
        return res.status(400).json({ error: 'Sei già membro di una famiglia' });
      }

      // Get invite
      const invite = await storage.getInvite(token);
      if (!invite) {
        return res.status(404).json({ error: 'Invito non trovato' });
      }

      // Check if invite is valid
      if (invite.status !== 'pending') {
        return res.status(400).json({ error: 'Invito non più valido' });
      }

      if (new Date() > new Date(invite.expiresAt)) {
        await storage.updateInviteStatus(invite.id, 'expired');
        return res.status(400).json({ error: 'Invito scaduto' });
      }

      // Get user email
      const user = await storage.getUser(userId);
      if (user?.email !== invite.email) {
        return res.status(400).json({ error: 'Questo invito non è per il tuo account' });
      }

      // Add user to family
      await storage.createFamilyMember({
        familyId: invite.familyId,
        userId,
        role: 'member',
      });

      // Update invite status
      await storage.updateInviteStatus(invite.id, 'accepted');

      // Create notification for family admins
      const family = await storage.getFamily(invite.familyId);
      const members = await storage.getFamilyMembers(invite.familyId);

      for (const member of members) {
        if (member.role === 'admin') {
          await storage.createNotification({
            userId: member.userId,
            type: 'member_joined',
            title: 'Nuovo membro',
            message: `${user?.fullName || user?.email} si è unito alla famiglia`,
            relatedId: userId,
          });
        }
      }

      res.json({ message: 'Ti sei unito alla famiglia con successo', family });
    } catch (error) {
      console.error('Accept invite error:', error);
      res.status(500).json({ error: 'Errore durante l\'accettazione dell\'invito' });
    }
  });

  return router;
}
