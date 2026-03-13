import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Link2, RefreshCw, Shield, Zap, ArrowDownRight, ArrowUpRight, Unlink, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { AppHeader } from '@/components/layout/AppHeader';
import { apiRequest } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

interface RevolutTransaction {
  id: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  type: 'debit' | 'credit';
  merchant?: { name: string; category: string };
  status: string;
}

export function RevolutPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: status } = useQuery({
    queryKey: ['/api/revolut/status'],
    queryFn: () => apiRequest('/api/revolut/status'),
  });

  const { data: transactions } = useQuery<RevolutTransaction[]>({
    queryKey: ['/api/revolut/transactions'],
    queryFn: () => apiRequest('/api/revolut/transactions'),
    enabled: !!status?.connected,
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/revolut/spending-stats'],
    queryFn: () => apiRequest('/api/revolut/spending-stats'),
    enabled: !!status?.connected,
  });

  const connectMutation = useMutation({
    mutationFn: () => apiRequest('/api/revolut/connect'),
    onSuccess: (data: { url: string }) => {
      window.location.href = data.url;
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Errore', description: error.message });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest('/api/revolut/disconnect', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/revolut'] });
      toast({ title: 'Disconnesso da Revolut' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Errore', description: error.message });
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => apiRequest('/api/revolut/sync', { method: 'POST' }),
    onSuccess: (data: { imported: number; total: number }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/revolut'] });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
      toast({ title: `Importate ${data.imported} transazioni` });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Errore sync', description: error.message });
    },
  });

  const isConnected = status?.connected;
  const balance = status?.balance;

  return (
    <div className="space-y-6">
      <AppHeader title="Banca" subtitle="Integrazione Revolut" />

      <div className="px-5 space-y-4">
        {/* Connection Status + Balance */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#0075EB] via-[#00D4AA] to-[#0075EB]" />
          <CardContent className="p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0075EB]/10 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-[#0075EB]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Revolut</p>
                <Badge variant={isConnected ? 'success' : 'secondary'} className="mt-0.5">
                  {isConnected ? 'Connesso' : 'Non connesso'}
                </Badge>
              </div>
              {isConnected && balance && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Saldo</p>
                  <p className="font-mono font-bold text-lg">
                    {formatCurrency(balance.amount)}
                  </p>
                </div>
              )}
            </div>

            {isConnected ? (
              <div className="space-y-3">
                {status?.lastSync && (
                  <p className="text-xs text-muted-foreground">
                    Ultimo sync: {new Date(status.lastSync).toLocaleDateString('it-IT', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full flex-1"
                    onClick={() => syncMutation.mutate()}
                    disabled={syncMutation.isPending}
                  >
                    {syncMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {syncMutation.isPending ? 'Sincronizzando...' : 'Sincronizza'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full text-destructive hover:text-destructive"
                    onClick={() => disconnectMutation.mutate()}
                    disabled={disconnectMutation.isPending}
                  >
                    <Unlink className="h-3.5 w-3.5 mr-1.5" />
                    Disconnetti
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Collega il tuo conto Revolut per importare automaticamente le transazioni.
                </p>
                {status?.configured ? (
                  <Button
                    className="w-full rounded-xl h-11"
                    onClick={() => connectMutation.mutate()}
                    disabled={connectMutation.isPending}
                  >
                    {connectMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Link2 className="h-4 w-4 mr-2" />
                    )}
                    Connetti Revolut
                  </Button>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      L'integrazione Revolut richiede la configurazione delle credenziali API nel server.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spending Stats */}
        {isConnected && stats && (
          <div className="grid grid-cols-3 gap-2">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-0.5">Uscite 30gg</p>
                <p className="font-mono font-semibold text-sm text-red-600">
                  -{formatCurrency(stats.totalSpent)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-0.5">Entrate 30gg</p>
                <p className="font-mono font-semibold text-sm text-emerald-600">
                  +{formatCurrency(stats.totalReceived)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-0.5">Transazioni</p>
                <p className="font-mono font-semibold text-sm">
                  {stats.transactionCount}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Transactions */}
        {isConnected && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-3">
              Transazioni recenti
            </h2>
            <div className="space-y-2">
              {transactions && transactions.length > 0 ? (
                transactions.slice(0, 20).map((tx) => (
                  <Card key={tx.id} className="border-0 shadow-sm">
                    <CardContent className="p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-9 h-9 rounded-xl flex items-center justify-center',
                          tx.type === 'debit'
                            ? 'bg-red-100 dark:bg-red-900/30'
                            : 'bg-emerald-100 dark:bg-emerald-900/30'
                        )}>
                          {tx.type === 'debit' ? (
                            <ArrowDownRight className="h-4 w-4 text-red-600" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm truncate max-w-[180px]">
                            {tx.merchant?.name || tx.description}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(tx.date).toLocaleDateString('it-IT', {
                              day: 'numeric', month: 'short'
                            })}
                          </p>
                        </div>
                      </div>
                      <span className={cn(
                        'font-mono font-semibold text-sm',
                        tx.type === 'debit' ? 'text-red-600' : 'text-emerald-600'
                      )}>
                        {tx.type === 'debit' ? '-' : '+'}{formatCurrency(tx.amount)}
                      </span>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-0 shadow-sm">
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground text-sm">
                      Nessuna transazione trovata
                    </p>
                    <Button
                      className="mt-3 rounded-full"
                      size="sm"
                      onClick={() => syncMutation.mutate()}
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                      Sincronizza ora
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Features (shown when not connected) */}
        {!isConnected && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Cosa puoi fare
            </h2>
            {[
              { icon: Zap, title: 'Importazione automatica', desc: 'Le transazioni vengono importate e categorizzate' },
              { icon: RefreshCw, title: 'Sincronizzazione', desc: 'Importa le spese degli ultimi 30 giorni con un tap' },
              { icon: Shield, title: 'Sicuro', desc: 'Connessione OAuth sicura tramite Open Banking' },
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
        )}
      </div>
    </div>
  );
}
