import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Plus, ArrowUpRight, ArrowDownRight, X, Check, Trash2, ChevronDown, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProgressRing } from '@/components/ui/progress-ring';
import { AppHeader } from '@/components/layout/AppHeader';
import { useToast } from '@/components/ui/use-toast';
import { apiRequest } from '@/lib/api';
import { formatCurrency, getCurrentMonthYear, getMonthName } from '@/lib/format';
import { cn } from '@/lib/utils';

const GROUP_TAG: Record<string, { emoji: string; label: string; color: string }> = {
  sopravvivenza: { emoji: '🔴', label: 'Sopr.', color: 'text-red-500' },
  necessarie: { emoji: '🟡', label: 'Neces.', color: 'text-amber-500' },
  necessarie_personali: { emoji: '🔵', label: 'Nec.Pers.', color: 'text-blue-500' },
  voluttarie: { emoji: '🟣', label: 'Volut.', color: 'text-violet-500' },
  investimenti: { emoji: '🟢', label: 'Invest.', color: 'text-emerald-500' },
};

function SearchResults({ categories, search, selectedId, onSelect }: {
  categories: any[]; search: string; selectedId: string; onSelect: (id: string) => void;
}) {
  const filtered = categories.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="space-y-1 max-h-[200px] overflow-y-auto">
      {filtered.length > 0 ? filtered.map((cat: any) => {
        const tag = GROUP_TAG[cat.categoryGroup];
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all border',
              selectedId === cat.id
                ? 'border-primary bg-primary/10 shadow-sm'
                : 'border-border hover:border-primary/50 hover:bg-primary/5'
            )}
          >
            <span className="text-base">{cat.icon}</span>
            <span className="text-xs font-medium flex-1">{cat.name}</span>
            {tag && (
              <span className={cn('text-[9px] font-medium', tag.color)}>
                {tag.emoji} {tag.label}
              </span>
            )}
            {cat.isPrivate ? (
              <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 rounded-full dark:bg-blue-900/30">👤 Mia</span>
            ) : (
              <span className="text-[9px] bg-violet-100 text-violet-600 px-1.5 rounded-full dark:bg-violet-900/30">👥 Fam</span>
            )}
          </button>
        );
      }) : (
        <p className="text-xs text-muted-foreground py-2 w-full text-center">Nessun risultato</p>
      )}
    </div>
  );
}

export function HomePage() {
  const { month, year } = getCurrentMonthYear();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [catSearch, setCatSearch] = useState('');

  const { data: familyBudget } = useQuery({
    queryKey: ['/api/budgets/family', month, year],
    queryFn: () => apiRequest(`/api/budgets/family?month=${month}&year=${year}`),
  });

  const { data: totalSpending } = useQuery({
    queryKey: ['/api/analytics/total-spending', month, year],
    queryFn: () => apiRequest(`/api/analytics/total-spending?month=${month}&year=${year}`),
  });

  const { data: balance } = useQuery({
    queryKey: ['/api/accounts/balance', month, year],
    queryFn: () => apiRequest(`/api/accounts/balance?month=${month}&year=${year}`),
  });

  const { data: expenses } = useQuery({
    queryKey: ['/api/expenses'],
    queryFn: () => apiRequest('/api/expenses'),
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => apiRequest('/api/categories'),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ predicate: (q) => {
      const key = q.queryKey[0] as string;
      return key?.startsWith('/api/expenses') || key?.startsWith('/api/analytics') ||
             key?.startsWith('/api/budgets') || key?.startsWith('/api/accounts');
    }});
  };

  const createExpenseMutation = useMutation({
    mutationFn: (data: { categoryId: string; description: string; amount: string; date: string }) =>
      apiRequest('/api/expenses', { method: 'POST', body: data }),
    onSuccess: () => {
      invalidateAll();
      resetForm();
      toast({ title: 'Spesa aggiunta' });
    },
    onError: (err: Error) => toast({ variant: 'destructive', title: 'Errore', description: err.message }),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/expenses/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidateAll();
      setConfirmDelete(null);
      toast({ title: 'Spesa eliminata' });
    },
    onError: (err: Error) => toast({ variant: 'destructive', title: 'Errore', description: err.message }),
  });

  const resetForm = () => {
    setShowForm(false);
    setAmount('');
    setDescription('');
    setCategoryId('');
    setDate(new Date().toISOString().split('T')[0]);
    setCatSearch('');
    setOpenGroup(null);
  };

  const handleSubmit = () => {
    if (!amount || !description.trim() || !categoryId) return;
    if (!/^\d+(\.\d{1,2})?$/.test(amount)) return;
    createExpenseMutation.mutate({ categoryId, description: description.trim(), amount, date });
  };

  const budgetTotal = familyBudget?.totalAmount ? parseFloat(familyBudget.totalAmount) : 0;
  const spent = totalSpending?.total ? parseFloat(totalSpending.total) : 0;
  const totalIncome = balance?.income ? parseFloat(balance.income) : 0;
  const remaining = budgetTotal - spent;
  const percentage = budgetTotal > 0 ? (spent / budgetTotal) * 100 : 0;

  return (
    <div className="space-y-6">
      <AppHeader subtitle={`${getMonthName(month)} ${year}`} />

      {/* Budget Overview Card */}
      <div className="px-5">
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-primary to-primary/80">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1 text-primary-foreground">
                <p className="text-sm font-medium opacity-80">Speso questo mese</p>
                <p className="text-3xl font-mono font-bold tracking-tight">
                  {formatCurrency(spent)}
                </p>
                <p className="text-sm opacity-70">
                  di {formatCurrency(budgetTotal)} budget
                </p>
              </div>
              <ProgressRing value={percentage} size={90} strokeWidth={6}>
                <div className="text-center text-primary-foreground">
                  <p className="text-lg font-bold font-mono">{Math.round(percentage)}%</p>
                </div>
              </ProgressRing>
            </div>

            {/* Remaining */}
            <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
              <span className="text-sm text-primary-foreground/70">Rimanente</span>
              <span className={cn(
                'font-mono font-semibold text-primary-foreground',
                remaining < 0 && 'text-red-200'
              )}>
                {formatCurrency(remaining)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="px-5 grid grid-cols-2 gap-3">
        <Link href="/income">
          <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                </div>
                <span className="text-xs text-muted-foreground">Entrate</span>
              </div>
              <p className="font-mono font-semibold text-lg">{formatCurrency(totalIncome)}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/analytics">
          <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <ArrowDownRight className="h-3 w-3 text-red-600" />
                </div>
                <span className="text-xs text-muted-foreground">Uscite</span>
              </div>
              <p className="font-mono font-semibold text-lg">{formatCurrency(spent)}</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Add Expense Form */}
      {showForm && (
        <div className="px-5">
          <Card className="border-2 border-primary shadow-md">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Nuova spesa</p>
                <button onClick={resetForm} className="p-1 rounded-md hover:bg-secondary">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Importo</label>
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-12 rounded-xl font-mono text-lg"
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Descrizione</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-11 rounded-xl"
                  placeholder="Es: Spesa al supermercato"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
              </div>

              {/* Category - search + grouped accordion */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Categoria</label>

                {/* Selected category preview */}
                {categoryId && (() => {
                  const sel = categories?.find((c: any) => c.id === categoryId);
                  return sel ? (
                    <div className="flex items-center gap-2 mb-2 p-2 rounded-xl bg-primary/5 border border-primary/20">
                      <span className="text-lg">{sel.icon}</span>
                      <span className="text-sm font-medium flex-1">{sel.name}</span>
                      <button onClick={() => { setCategoryId(''); setCatSearch(''); }} className="p-0.5 rounded hover:bg-secondary">
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  ) : null;
                })()}

                {/* Frequent categories */}
                {!categoryId && (() => {
                  // Count category frequency from recent expenses
                  const freq = new Map<string, number>();
                  (expenses || []).forEach((e: any) => {
                    freq.set(e.categoryId, (freq.get(e.categoryId) || 0) + 1);
                  });
                  const topCats = [...freq.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6)
                    .map(([id]) => categories?.find((c: any) => c.id === id))
                    .filter(Boolean);

                  if (topCats.length === 0) return null;
                  return (
                    <div className="mb-2">
                      <p className="text-[10px] text-muted-foreground font-medium mb-1.5">⚡ Più usate</p>
                      <div className="flex flex-wrap gap-1.5">
                        {topCats.map((cat: any) => (
                          <button
                            key={cat.id}
                            onClick={() => { setCategoryId(cat.id); setCatSearch(''); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
                          >
                            <span>{cat.icon}</span>
                            <span>{cat.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Search */}
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={catSearch}
                    onChange={(e) => setCatSearch(e.target.value)}
                    className="h-9 rounded-xl pl-8 text-xs"
                    placeholder="Cerca categoria..."
                  />
                </div>

                {/* Search results or grouped accordion */}
                {catSearch.trim() ? (
                  <SearchResults
                    categories={categories || []}
                    search={catSearch}
                    selectedId={categoryId}
                    onSelect={(id: string) => { setCategoryId(id); setCatSearch(''); }}
                  />
                ) : (
                  /* Grouped accordion */
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto rounded-xl">
                    {[
                      { key: 'sopravvivenza', label: 'Sopravvivenza', emoji: '🔴', cats: categories?.filter((c: any) => !c.isPrivate && c.categoryGroup === 'sopravvivenza') || [] },
                      { key: 'necessarie', label: 'Necessarie', emoji: '🟡', cats: categories?.filter((c: any) => !c.isPrivate && c.categoryGroup === 'necessarie') || [] },
                      { key: 'voluttarie_fam', label: 'Voluttarie Famiglia', emoji: '🟣', cats: categories?.filter((c: any) => !c.isPrivate && c.categoryGroup === 'voluttarie') || [] },
                      { key: 'nec_pers', label: 'Necessarie Personali', emoji: '🔵', cats: categories?.filter((c: any) => c.isPrivate && c.categoryGroup === 'necessarie_personali') || [] },
                      { key: 'voluttarie_pers', label: 'Voluttarie Personali', emoji: '🟣', cats: categories?.filter((c: any) => c.isPrivate && c.categoryGroup === 'voluttarie') || [] },
                      { key: 'investimenti', label: 'Investimenti', emoji: '🟢', cats: categories?.filter((c: any) => c.isPrivate && c.categoryGroup === 'investimenti') || [] },
                      { key: 'altro', label: 'Altro', emoji: '⚪', cats: categories?.filter((c: any) => !c.categoryGroup) || [] },
                    ].filter(g => g.cats.length > 0).map(group => (
                      <div key={group.key} className="rounded-xl border border-border overflow-hidden">
                        <button
                          onClick={() => setOpenGroup(openGroup === group.key ? null : group.key)}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors',
                            openGroup === group.key ? 'bg-secondary' : 'hover:bg-secondary/50',
                            group.cats.some((c: any) => c.id === categoryId) && 'bg-primary/5 border-primary/20'
                          )}
                        >
                          <span className="text-sm">{group.emoji}</span>
                          <span className="text-xs font-semibold flex-1">{group.label}</span>
                          <span className="text-[10px] text-muted-foreground">{group.cats.length}</span>
                          <ChevronDown className={cn(
                            'h-3.5 w-3.5 text-muted-foreground transition-transform',
                            openGroup === group.key && 'rotate-180'
                          )} />
                        </button>
                        {openGroup === group.key && (
                          <div className="px-2 pb-2 pt-1 flex flex-wrap gap-1.5">
                            {group.cats.map((cat: any) => (
                              <button
                                key={cat.id}
                                onClick={() => { setCategoryId(cat.id); setOpenGroup(null); }}
                                className={cn(
                                  'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all border',
                                  categoryId === cat.id
                                    ? 'border-primary bg-primary/10 shadow-sm'
                                    : 'border-border hover:border-primary/50 hover:bg-primary/5'
                                )}
                              >
                                <span>{cat.icon}</span>
                                <span>{cat.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <Button
                className="w-full h-11 rounded-xl"
                onClick={handleSubmit}
                disabled={createExpenseMutation.isPending || !amount || !description.trim() || !categoryId}
              >
                <Check className="h-4 w-4 mr-2" />
                {createExpenseMutation.isPending ? 'Salvataggio...' : 'Aggiungi spesa'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Expenses */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Spese recenti</h2>
          {!showForm && (
            <Button size="sm" className="rounded-full gap-1 h-8 px-3 text-xs" onClick={() => setShowForm(true)}>
              <Plus className="h-3.5 w-3.5" />
              Nuova
            </Button>
          )}
        </div>

        <div className="space-y-2 stagger-children">
          {expenses && expenses.length > 0 ? (
            expenses.slice(0, 8).map((expense: any) => (
              <Card key={expense.id} className="border-0 shadow-sm">
                <CardContent className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${expense.category?.color}15` }}
                    >
                      {expense.category?.icon || '💰'}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{expense.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {expense.category?.name}
                        {expense.date && (
                          <span className="ml-1.5 opacity-60">
                            {new Date(expense.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-semibold text-sm">
                      -{formatCurrency(expense.amount)}
                    </span>
                    {confirmDelete === expense.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => deleteExpenseMutation.mutate(expense.id)}
                          className="p-1 rounded-md bg-red-100 hover:bg-red-200 transition-colors">
                          <Check className="h-3 w-3 text-red-600" />
                        </button>
                        <button onClick={() => setConfirmDelete(null)}
                          className="p-1 rounded-md hover:bg-secondary transition-colors">
                          <X className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(expense.id)}
                        className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">Nessuna spesa registrata</p>
                <Button className="mt-4 rounded-full" size="sm" onClick={() => setShowForm(true)}>
                  Aggiungi la prima spesa
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
