import { Router } from 'express';
import { IStorage } from '../storage';
import { isAuthenticated } from '../middleware/auth';
import {
  PLANS,
  PlanType,
  isStripeConfigured,
  createCustomer,
  createCheckoutSession,
  createPortalSession,
  cancelSubscription,
  resumeSubscription,
  constructWebhookEvent,
  mapStripePriceToPlan,
} from '../services/stripe';

export function createSubscriptionRoutes(storage: IStorage) {
  const router = Router();

  // ====== PUBLIC: Webhook (no auth, raw body) ======
  // Raw body parsed at app level for this route
  router.post('/webhook', async (req, res) => {
    if (!isStripeConfigured()) {
      return res.status(400).json({ error: 'Stripe non configurato' });
    }

    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      return res.status(400).json({ error: 'Missing signature' });
    }

    try {
      const event = constructWebhookEvent(req.body, signature);

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as any;
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;

          // Find the subscription record by customer ID and update with subscription details
          const sub = await storage.getSubscriptionByStripeCustomerId(customerId);
          if (sub) {
            await storage.updateSubscriptionStatus(subscriptionId, {
              stripeSubscriptionId: subscriptionId,
              status: 'active',
            });
          }
          break;
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as any;
          const customerId = subscription.customer as string;
          const priceId = subscription.items?.data?.[0]?.price?.id;
          const plan = priceId ? mapStripePriceToPlan(priceId) : 'free';

          const sub = await storage.getSubscriptionByStripeCustomerId(customerId);
          if (sub) {
            await storage.updateSubscriptionStatus(subscription.id, {
              status: subscription.status,
              plan,
              stripePriceId: priceId,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
            });
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as any;
          const sub = await storage.getSubscriptionByStripeSubscriptionId(subscription.id);
          if (sub) {
            await storage.updateSubscriptionStatus(subscription.id, {
              status: 'canceled',
              plan: 'free',
              cancelAtPeriodEnd: false,
            });
          }
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as any;
          const subscriptionId = invoice.subscription as string;
          if (subscriptionId) {
            await storage.updateSubscriptionStatus(subscriptionId, {
              status: 'past_due',
            });
          }
          break;
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).json({ error: 'Webhook error' });
    }
  });

  // ====== Authenticated routes ======
  router.use(isAuthenticated);

  // Get plans info
  router.get('/plans', (_req, res) => {
    res.json({
      plans: PLANS,
      configured: isStripeConfigured(),
    });
  });

  // Get current subscription
  router.get('/current', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.json({ plan: 'free', status: null });
      }

      const sub = await storage.getSubscription(member.familyId);
      if (!sub) {
        return res.json({ plan: 'free', status: null });
      }

      res.json({
        plan: sub.plan,
        status: sub.status,
        currentPeriodEnd: sub.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        trialEnd: sub.trialEnd,
      });
    } catch (error) {
      console.error('Get subscription error:', error);
      res.status(500).json({ error: 'Errore durante il recupero dell\'abbonamento' });
    }
  });

  // Create checkout session to subscribe/upgrade
  router.post('/checkout', async (req, res) => {
    try {
      if (!isStripeConfigured()) {
        return res.status(400).json({ error: 'Stripe non configurato' });
      }

      const userId = req.session.userId!;
      const { plan } = req.body as { plan: PlanType };

      if (!plan || !['base', 'premium'].includes(plan)) {
        return res.status(400).json({ error: 'Piano non valido' });
      }

      const priceId = plan === 'base'
        ? process.env.STRIPE_PRICE_BASE
        : process.env.STRIPE_PRICE_PREMIUM;

      if (!priceId) {
        return res.status(400).json({ error: 'Prezzo Stripe non configurato per questo piano' });
      }

      const user = await storage.getUser(userId);
      const member = await storage.getFamilyMember(userId);
      if (!user || !member) {
        return res.status(400).json({ error: 'Utente o famiglia non trovata' });
      }

      const family = await storage.getFamily(member.familyId);

      // Get or create subscription record with Stripe customer
      let sub = await storage.getSubscription(member.familyId);
      let customerId: string;

      if (sub?.stripeCustomerId) {
        customerId = sub.stripeCustomerId;
      } else {
        customerId = await createCustomer(user.email, family?.name || 'Famiglia');
        sub = await storage.upsertSubscription({
          familyId: member.familyId,
          stripeCustomerId: customerId,
          status: 'incomplete',
          plan: 'free',
        });
      }

      const clientUrl = process.env.CLIENT_URL || '/';
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const successUrl = `${clientUrl.startsWith('http') ? clientUrl : appUrl + clientUrl}subscription?success=true`;
      const cancelUrl = `${clientUrl.startsWith('http') ? clientUrl : appUrl + clientUrl}subscription?canceled=true`;

      const checkoutUrl = await createCheckoutSession(
        customerId,
        priceId,
        successUrl,
        cancelUrl,
        14 // 14-day free trial
      );

      res.json({ url: checkoutUrl });
    } catch (error) {
      console.error('Create checkout error:', error);
      res.status(500).json({ error: 'Errore durante la creazione del checkout' });
    }
  });

  // Open customer portal for managing subscription
  router.post('/portal', async (req, res) => {
    try {
      if (!isStripeConfigured()) {
        return res.status(400).json({ error: 'Stripe non configurato' });
      }

      const userId = req.session.userId!;
      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(400).json({ error: 'Non fai parte di una famiglia' });
      }

      const sub = await storage.getSubscription(member.familyId);
      if (!sub?.stripeCustomerId) {
        return res.status(400).json({ error: 'Nessun abbonamento attivo' });
      }

      const clientUrl = process.env.CLIENT_URL || '/';
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const returnUrl = `${clientUrl.startsWith('http') ? clientUrl : appUrl + clientUrl}subscription`;

      const portalUrl = await createPortalSession(sub.stripeCustomerId, returnUrl);
      res.json({ url: portalUrl });
    } catch (error) {
      console.error('Create portal error:', error);
      res.status(500).json({ error: 'Errore durante l\'apertura del portale' });
    }
  });

  // Cancel subscription
  router.post('/cancel', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(400).json({ error: 'Non fai parte di una famiglia' });
      }

      const isAdmin = await storage.isFamilyAdmin(member.familyId, userId);
      if (!isAdmin) {
        return res.status(403).json({ error: 'Solo gli admin possono gestire l\'abbonamento' });
      }

      const sub = await storage.getSubscription(member.familyId);
      if (!sub?.stripeSubscriptionId) {
        return res.status(400).json({ error: 'Nessun abbonamento da cancellare' });
      }

      await cancelSubscription(sub.stripeSubscriptionId);
      res.json({ message: 'L\'abbonamento verrà cancellato a fine periodo' });
    } catch (error) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({ error: 'Errore durante la cancellazione' });
    }
  });

  // Resume canceled subscription
  router.post('/resume', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(400).json({ error: 'Non fai parte di una famiglia' });
      }

      const sub = await storage.getSubscription(member.familyId);
      if (!sub?.stripeSubscriptionId || !sub.cancelAtPeriodEnd) {
        return res.status(400).json({ error: 'Nessun abbonamento da riattivare' });
      }

      await resumeSubscription(sub.stripeSubscriptionId);
      res.json({ message: 'Abbonamento riattivato' });
    } catch (error) {
      console.error('Resume subscription error:', error);
      res.status(500).json({ error: 'Errore durante la riattivazione' });
    }
  });

  return router;
}
