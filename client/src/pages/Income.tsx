import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, ArrowUpRight, RefreshCw, Trash2, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { AppHeader } from '@/components/layout/AppHeader';
import { apiRequest } from '@/lib/api';
import { formatCurrency, getCurrentMonthYear, getMonthName } from '@/lib/format';

const incomeSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Importo non valido'),
  description: z.string().min(1, 'Descrizione richiesta'),
  isRecurring: z.boolean().default(false),
  recurringDay: z.string().optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
});

type IncomeFormData = z.infer<typeof incomeSchema>;

export function IncomePage() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { month, year } = getCurrentMonthYear();

  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      isRecurring: false,
    },
  });

  const { data: incomes } = useQuery({
    queryKey: ['/api/incomes'],
    queryFn: () => apiRequest('/api/incomes'),
  });

  const { data: totalIncome } = useQuery({
    queryKey: ['/api/incomes/total', month, year],
    queryFn: () => apiRequest(`/api/incomes/total?month=${month}&year=${year}`),
  });

  const { data: balance } = useQuery({
    queryKey: ['/api/accounts/balance', month, year],
    queryFn: () => apiRequest(`/api/accounts/balance?month=${month}&year=${year}`),
  });

  const createMutation = useMutation({
    mutationFn: (data: IncomeFormData) =>
      apiRequest('/api/incomes', {
        method: 'POST',
        body: {
          ...data,
          recurringDay: data.recurringDay ? parseInt(data.recurringDay) : undefined,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incomes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/incomes/total'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts/balance'] });
      setShowForm(false);
      form.reset();
      toast({ title: 'Entrata aggiunta' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Errore', description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/incomes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incomes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/incomes/total'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts/balance'] });
      toast({ title: 'Entrata eliminata' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Errore', description: error.message });
    },
  });

  const totalIncomeAmount = totalIncome?.total ? parseFloat(totalIncome.total) : 0;
  const balanceAmount = balance?.balance ? parseFloat(balance.balance) : 0;
  const spendingAmount = balance?.spending ? parseFloat(balance.spending) : 0;

  return (
    <div className="space-y-6">
      <AppHeader subtitle={`${getMonthName(month)} ${year}`} />

      {/* Balance Overview */}
      <div className="px-5">
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700">
          <CardContent className="p-6">
            <div className="space-y-4 text-white">
              <div>
                <p className="text-sm font-medium opacity-80">Bilancio del mese</p>
                <p className="text-3xl font-mono font-bold tracking-tight">
                  {formatCurrency(balanceAmount)}
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/20">
                <div>
                  <p className="text-xs opacity-70">Entrate</p>
                  <p className="font-mono font-semibold text-sm">
                    +{formatCurrency(totalIncomeAmount)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-70">Uscite</p>
                  <p className="font-mono font-semibold text-sm">
                    -{formatCurrency(spendingAmount)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Income Form */}
      {showForm && (
        <div className="px-5">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Nuova entrata</h3>
                <button onClick={() => setShowForm(false)}>
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              <form
                onSubmit={form.handleSubmit((d) => createMutation.mutate(d))}
                className="space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Importo</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="h-10 rounded-xl font-mono"
                      {...form.register('amount')}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Data</Label>
                    <Input
                      type="date"
                      className="h-10 rounded-xl"
                      {...form.register('date')}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Descrizione</Label>
                  <Input
                    placeholder="es. Stipendio, Freelance..."
                    className="h-10 rounded-xl"
                    {...form.register('description')}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Note (opzionale)</Label>
                  <Input
                    placeholder="Note aggiuntive..."
                    className="h-10 rounded-xl"
                    {...form.register('notes')}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-border"
                      {...form.register('isRecurring')}
                    />
                    <span className="text-sm">Ricorrente</span>
                  </label>
                  {form.watch('isRecurring') && (
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="Giorno"
                      className="h-8 w-20 rounded-lg text-xs"
                      {...form.register('recurringDay')}
                    />
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full h-10 rounded-xl"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Salvataggio...' : 'Aggiungi entrata'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Income List */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Entrate recenti</h2>
          <Button
            size="sm"
            className="rounded-full gap-1 h-8 px-3 text-xs"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Nuova
          </Button>
        </div>

        <div className="space-y-2 stagger-children">
          {incomes && incomes.length > 0 ? (
            incomes.slice(0, 10).map((income: any) => (
              <Card key={income.id} className="border-0 shadow-sm">
                <CardContent className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      {income.isRecurring ? (
                        <RefreshCw className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{income.description}</p>
                        {income.isRecurring && (
                          <Badge variant="success" className="text-[10px] px-1.5 py-0">
                            Ricorrente
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {income.user?.fullName || 'Membro'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-sm text-emerald-600">
                      +{formatCurrency(income.amount)}
                    </span>
                    <button
                      onClick={() => deleteMutation.mutate(income.id)}
                      className="p-1 rounded-md hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
                  <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-muted-foreground text-sm">Nessuna entrata registrata</p>
                <Button
                  className="mt-4 rounded-full"
                  size="sm"
                  onClick={() => setShowForm(true)}
                >
                  Aggiungi la prima entrata
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
