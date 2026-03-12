import { useQuery } from '@tanstack/react-query';
import { CreditCard, Link2, RefreshCw, Shield, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppHeader } from '@/components/layout/AppHeader';
import { apiRequest } from '@/lib/api';

export function RevolutPage() {
  const { data: status } = useQuery({
    queryKey: ['/api/revolut/status'],
    queryFn: () => apiRequest('/api/revolut/status'),
  });

  const isConnected = status?.connected;

  return (
    <div className="space-y-6">
      <AppHeader title="Banca" subtitle="Integrazione Revolut" />

      <div className="px-5 space-y-4">
        {/* Connection Status */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />
          <CardContent className="p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0075EB]/10 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-[#0075EB]" />
              </div>
              <div>
                <p className="font-semibold">Revolut</p>
                <Badge variant={isConnected ? 'success' : 'secondary'} className="mt-0.5">
                  {isConnected ? 'Connesso' : 'Non connesso'}
                </Badge>
              </div>
            </div>

            {isConnected ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Le tue transazioni vengono sincronizzate automaticamente.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-full flex-1">
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Sincronizza
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full text-destructive hover:text-destructive">
                    Disconnetti
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Collega il tuo conto Revolut per importare automaticamente le transazioni.
                </p>
                <Button className="w-full rounded-xl h-11">
                  <Link2 className="h-4 w-4 mr-2" />
                  Connetti Revolut
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Cosa puoi fare
          </h2>
          {[
            { icon: Zap, title: 'Importazione automatica', desc: 'Le transazioni vengono importate in tempo reale' },
            { icon: RefreshCw, title: 'Sincronizzazione', desc: 'Sync manuale o automatica delle transazioni' },
            { icon: Shield, title: 'Sicuro', desc: 'Connessione OAuth sicura, nessuna password salvata' },
          ].map((feature) => (
            <Card key={feature.title} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <feature.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{feature.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{feature.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
