import { useQuery, useMutation } from '@tanstack/react-query';
import { Crown, Check, Sparkles, ArrowRight, Settings, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { AppHeader } from '@/components/layout/AppHeader';
import { apiRequest } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Plan {
  name: string;
  price: number;
  priceDisplay?: string;
  features: string[];
  limits: { members: number; categories: number };
}

interface PlansResponse {
  plans: { free: Plan; base: Plan; premium: Plan };
  configured: boolean;
}

interface SubscriptionStatus {
  plan: string;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
}

export function SubscriptionPage() {
  const { toast } = useToast();

  const { data: plansData } = useQuery<PlansResponse>({
    queryKey: ['/api/subscriptions/plans'],
    queryFn: () => apiRequest('/api/subscriptions/plans'),
  });

  const { data: currentSub } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscriptions/current'],
    queryFn: () => apiRequest('/api/subscriptions/current'),
  });

  const checkoutMutation = useMutation({
    mutationFn: (plan: string) =>
      apiRequest('/api/subscriptions/checkout', {
        method: 'POST',
        body: { plan },
      }),
    onSuccess: (data: { url: string }) => {
      window.location.href = data.url;
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Errore', description: error.message });
    },
  });

  const portalMutation = useMutation({
    mutationFn: () =>
      apiRequest('/api/subscriptions/portal', { method: 'POST' }),
    onSuccess: (data: { url: string }) => {
      window.location.href = data.url;
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Errore', description: error.message });
    },
  });

  const plans = plansData?.plans;
  const isConfigured = plansData?.configured;
  const currentPlan = currentSub?.plan || 'free';
  const isActive = currentSub?.status === 'active' || currentSub?.status === 'trialing';

  return (
    <div className="space-y-6">
      <AppHeader title="Abbonamento" subtitle="Scegli il piano giusto" />

      <div className="px-5 space-y-4">
        {/* Current plan banner */}
        {isActive && currentPlan !== 'free' && (
          <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600">
            <CardContent className="p-5 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Crown className="h-6 w-6" />
                <div>
                  <p className="font-bold text-lg">
                    Piano {currentPlan === 'premium' ? 'Premium' : 'Base'}
                  </p>
                  {currentSub?.cancelAtPeriodEnd && (
                    <Badge variant="secondary" className="bg-white/20 text-white border-0 text-[10px]">
                      Si disattiva a fine periodo
                    </Badge>
                  )}
                </div>
              </div>
              {currentSub?.currentPeriodEnd && (
                <p className="text-sm opacity-80">
                  {currentSub.cancelAtPeriodEnd ? 'Attivo fino al' : 'Prossimo rinnovo'}:{' '}
                  {new Date(currentSub.currentPeriodEnd).toLocaleDateString('it-IT', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              )}
              {currentSub?.trialEnd && currentSub.status === 'trialing' && (
                <p className="text-sm opacity-80">
                  Prova gratuita fino al{' '}
                  {new Date(currentSub.trialEnd).toLocaleDateString('it-IT', {
                    day: 'numeric', month: 'long'
                  })}
                </p>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 text-white hover:bg-white/20 rounded-full"
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
              >
                <Settings className="h-4 w-4 mr-1.5" />
                Gestisci abbonamento
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Not configured warning */}
        {!isConfigured && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              Il sistema di pagamento non è ancora configurato. Le funzionalità premium saranno disponibili dopo la configurazione di Stripe.
            </p>
          </div>
        )}

        {/* Plans */}
        {plans && (
          <div className="space-y-3">
            {/* Free Plan */}
            <PlanCard
              plan={plans.free}
              planKey="free"
              isCurrent={currentPlan === 'free'}
              isActive={currentPlan === 'free'}
              onSelect={() => {}}
              isLoading={false}
              disabled
            />

            {/* Base Plan */}
            <PlanCard
              plan={plans.base}
              planKey="base"
              isCurrent={currentPlan === 'base'}
              isActive={isActive && currentPlan === 'base'}
              popular
              onSelect={() => checkoutMutation.mutate('base')}
              isLoading={checkoutMutation.isPending}
              disabled={!isConfigured || (isActive && currentPlan !== 'free')}
            />

            {/* Premium Plan */}
            <PlanCard
              plan={plans.premium}
              planKey="premium"
              isCurrent={currentPlan === 'premium'}
              isActive={isActive && currentPlan === 'premium'}
              onSelect={() => checkoutMutation.mutate('premium')}
              isLoading={checkoutMutation.isPending}
              disabled={!isConfigured || (isActive && currentPlan === 'premium')}
            />
          </div>
        )}

        {/* FAQ */}
        <div className="pt-2 pb-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
            Domande frequenti
          </h3>
          <div className="space-y-2">
            {[
              { q: 'Posso provare gratis?', a: 'I piani a pagamento includono 14 giorni di prova gratuita.' },
              { q: 'Posso cancellare in qualsiasi momento?', a: 'Puoi cancellare l\'abbonamento quando vuoi. Rimarrà attivo fino a fine periodo.' },
              { q: 'Cosa succede se torno al piano gratuito?', a: 'Mantieni i tuoi dati ma le funzionalità avanzate verranno limitate.' },
            ].map((faq) => (
              <Card key={faq.q} className="border-0 shadow-sm">
                <CardContent className="p-3.5">
                  <p className="font-medium text-sm">{faq.q}</p>
                  <p className="text-xs text-muted-foreground mt-1">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  planKey,
  isCurrent,
  isActive,
  popular,
  onSelect,
  isLoading,
  disabled,
}: {
  plan: Plan;
  planKey: string;
  isCurrent: boolean;
  isActive: boolean;
  popular?: boolean;
  onSelect: () => void;
  isLoading: boolean;
  disabled?: boolean;
}) {
  return (
    <Card className={cn(
      'border-0 shadow-sm relative overflow-hidden',
      popular && 'ring-2 ring-primary shadow-md',
      isCurrent && isActive && 'ring-2 ring-amber-500'
    )}>
      {popular && (
        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-bl-lg">
          <Sparkles className="h-3 w-3 inline mr-0.5" />
          Popolare
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-lg">{plan.name}</h3>
            {plan.price > 0 ? (
              <p className="text-2xl font-mono font-bold">
                {(plan as any).priceDisplay}
                <span className="text-sm text-muted-foreground font-normal">/mese</span>
              </p>
            ) : (
              <p className="text-2xl font-mono font-bold">
                Gratis
              </p>
            )}
          </div>
          {isCurrent && isActive && (
            <Badge variant="success" className="text-[10px]">Attivo</Badge>
          )}
        </div>

        <ul className="space-y-2 mb-4">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {planKey !== 'free' && (
          <Button
            className="w-full rounded-xl h-10"
            variant={popular ? 'default' : 'outline'}
            onClick={onSelect}
            disabled={disabled || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isCurrent && isActive ? (
              'Piano attuale'
            ) : (
              <>
                {plan.price > 0 ? 'Inizia la prova gratuita' : 'Seleziona'}
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
