import Stripe from 'stripe';

/**
 * Stripe Subscription Service
 *
 * Plans:
 * - Free: basic features, 1 family member, no Revolut
 * - Base (€4.99/mo): up to 4 members, Revolut sync, yearly budgets
 * - Premium (€9.99/mo): unlimited members, advanced analytics, priority support
 */

export const PLANS = {
  free: {
    name: 'Gratuito',
    price: 0,
    features: [
      '1 membro famiglia',
      'Categorie base',
      'Budget mensile',
      'Tracking spese',
    ],
    limits: { members: 1, categories: 5 },
  },
  base: {
    name: 'Base',
    price: 499, // cents
    priceDisplay: '€4,99',
    features: [
      'Fino a 4 membri',
      'Categorie illimitate',
      'Budget mensili e annuali',
      'Integrazione Revolut',
      'Report mensili',
    ],
    limits: { members: 4, categories: Infinity },
  },
  premium: {
    name: 'Premium',
    price: 999, // cents
    priceDisplay: '€9,99',
    features: [
      'Membri illimitati',
      'Tutte le funzionalità Base',
      'Analisi avanzate',
      'Esportazione dati',
      'Supporto prioritario',
    ],
    limits: { members: Infinity, categories: Infinity },
  },
} as const;

export type PlanType = keyof typeof PLANS;

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY non configurata');
    stripeInstance = new Stripe(key, { apiVersion: '2025-04-30.basil' });
  }
  return stripeInstance;
}

export function isStripeConfigured(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

/**
 * Create a Stripe customer for a family
 */
export async function createCustomer(email: string, familyName: string): Promise<string> {
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    name: familyName,
    metadata: { app: 'famiglia-budget' },
  });
  return customer.id;
}

/**
 * Create a checkout session for subscribing to a plan
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  trialDays?: number
): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: trialDays ? { trial_period_days: trialDays } : undefined,
    allow_promotion_codes: true,
  });
  return session.url!;
}

/**
 * Create a customer portal session for managing subscription
 */
export async function createPortalSession(customerId: string, returnUrl: string): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const stripe = getStripe();
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Resume a canceled subscription
 */
export async function resumeSubscription(subscriptionId: string): Promise<void> {
  const stripe = getStripe();
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Get subscription details from Stripe
 */
export async function getStripeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  const stripe = getStripe();
  return await stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Construct and verify a webhook event
 */
export function constructWebhookEvent(body: string | Buffer, signature: string): Stripe.Event {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET!;
  return stripe.webhooks.constructEvent(body, signature, secret);
}

/**
 * Map Stripe subscription status to our plan type
 */
export function mapStripePriceToPlan(priceId: string): PlanType {
  if (priceId === process.env.STRIPE_PRICE_BASE) return 'base';
  if (priceId === process.env.STRIPE_PRICE_PREMIUM) return 'premium';
  return 'free';
}
