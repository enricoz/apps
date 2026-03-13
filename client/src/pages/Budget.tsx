import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Wallet, AlertTriangle, CheckCircle2, XCircle, Edit2, Save, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { AppHeader } from '@/components/layout/AppHeader';
import { apiRequest } from '@/lib/api';
import { formatCurrency, getCurrentMonthYear, getMonthName } from '@/lib/format';
import { cn } from '@/lib/utils';

interface CategoryBudgetStatus {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount?: string;
  yearlyAmount?: string;
  spent: string;
  percentage: number;
  alertLevel: 'ok' | 'warning' | 'danger' | 'exceeded';
  alertThreshold?: number;
}

interface BudgetStatus {
  familyBudget: { totalAmount: string } | null;
  monthlyCategories: CategoryBudgetStatus[];
  yearlyCategories: CategoryBudgetStatus[];
  month: number;
  year: number;
}

const alertConfig = {
  ok: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'OK' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Attenzione' },
  danger: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30', label: 'Quasi al limite' },
  exceeded: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Superato' },
};

export function BudgetPage() {
  const { month, year } = getCurrentMonthYear();
  const [editingFamily, setEditingFamily] = useState(false);
  const [familyAmount, setFamilyAmount] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryAmount, setCategoryAmount] = useState('');
  const [editingYearly, setEditingYearly] = useState<string | null>(null);
  const [yearlyAmount, setYearlyAmount] = useState('');
  const [yearlyThreshold, setYearlyThreshold] = useState('80');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: budgetStatus } = useQuery<BudgetStatus>({
    queryKey: ['/api/budgets/status', month, year],
    queryFn: () => apiRequest(`/api/budgets/status?month=${month}&year=${year}`),
  });

  const { data: categories } = useQuery<any[]>({
    queryKey: ['/api/categories'],
    queryFn: () => apiRequest('/api/categories'),
  });

  const setFamilyBudgetMutation = useMutation({
    mutationFn: (amount: string) =>
      apiRequest('/api/budgets/family', {
        method: 'PUT',
        body: { totalAmount: amount, month, year },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/budgets'] });
      setEditingFamily(false);
      toast({ title: 'Budget famiglia aggiornato' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Errore', description: error.message });
    },
  });

  const setCategoryBudgetMutation = useMutation({
    mutationFn: ({ categoryId, amount }: { categoryId: string; amount: string }) =>
      apiRequest(`/api/budgets/categories/${categoryId}`, {
        method: 'PUT',
        body: { amount, month, year },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/budgets'] });
      setEditingCategory(null);
      toast({ title: 'Limite categoria aggiornato' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Errore', description: error.message });
    },
  });

  const setYearlyBudgetMutation = useMutation({
    mutationFn: ({ categoryId, yearlyAmount, alertThreshold }: { categoryId: string; yearlyAmount: string; alertThreshold: number }) =>
      apiRequest(`/api/budgets/yearly/${categoryId}`, {
        method: 'PUT',
        body: { yearlyAmount, year, alertThreshold },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/budgets'] });
      setEditingYearly(null);
      toast({ title: 'Budget annuale aggiornato' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Errore', description: error.message });
    },
  });

  const familyBudgetTotal = budgetStatus?.familyBudget
    ? parseFloat(budgetStatus.familyBudget.totalAmount)
    : 0;

  const totalMonthlySpent = budgetStatus?.monthlyCategories.reduce(
    (sum, c) => sum + parseFloat(c.spent),
    0
  ) || 0;

  const monthlyPercentage = familyBudgetTotal > 0
    ? (totalMonthlySpent / familyBudgetTotal) * 100
    : 0;

  return (
    <div className="space-y-6">
      <AppHeader subtitle={`${getMonthName(month)} ${year}`} />

      {/* Family Budget Overview */}
      <div className="px-5">
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-violet-500 to-violet-600 dark:from-violet-600 dark:to-violet-700">
          <CardContent className="p-6">
            <div className="space-y-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-80">Budget Famiglia</p>
                  <p className="text-3xl font-mono font-bold tracking-tight">
                    {formatCurrency(familyBudgetTotal)}
                  </p>
                </div>
                {!editingFamily ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20 rounded-full"
                    onClick={() => {
                      setFamilyAmount(familyBudgetTotal > 0 ? familyBudgetTotal.toString() : '');
                      setEditingFamily(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={familyAmount}
                      onChange={(e) => setFamilyAmount(e.target.value)}
                      className="h-9 w-28 rounded-lg bg-white/20 border-white/30 text-white placeholder:text-white/50 font-mono"
                      placeholder="0.00"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-white/20 rounded-full h-9 w-9 p-0"
                      onClick={() => {
                        if (familyAmount && /^\d+(\.\d{1,2})?$/.test(familyAmount)) {
                          setFamilyBudgetMutation.mutate(familyAmount);
                        }
                      }}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-white/20 rounded-full h-9 w-9 p-0"
                      onClick={() => setEditingFamily(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-xs opacity-70 mb-1.5">
                  <span>Speso: {formatCurrency(totalMonthlySpent)}</span>
                  <span>{Math.round(monthlyPercentage)}%</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      monthlyPercentage >= 100 ? 'bg-red-300' :
                      monthlyPercentage >= 80 ? 'bg-amber-300' :
                      'bg-white/80'
                    )}
                    style={{ width: `${Math.min(monthlyPercentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Category Budgets */}
      <div className="px-5">
        <h2 className="text-lg font-semibold mb-3">Limiti mensili per categoria</h2>
        <div className="space-y-2">
          {budgetStatus?.monthlyCategories && budgetStatus.monthlyCategories.length > 0 ? (
            budgetStatus.monthlyCategories.map((cat) => {
              const alert = alertConfig[cat.alertLevel];
              const AlertIcon = alert.icon;
              const isEditing = editingCategory === cat.categoryId;

              return (
                <Card key={cat.id} className="border-0 shadow-sm">
                  <CardContent className="p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cat.categoryIcon}</span>
                        <span className="font-medium text-sm">{cat.categoryName}</span>
                        {cat.alertLevel !== 'ok' && (
                          <Badge variant={cat.alertLevel === 'exceeded' ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 py-0">
                            <AlertIcon className={cn('h-3 w-3 mr-0.5', alert.color)} />
                            {alert.label}
                          </Badge>
                        )}
                      </div>
                      {!isEditing ? (
                        <button
                          onClick={() => {
                            setCategoryAmount(cat.amount || '');
                            setEditingCategory(cat.categoryId);
                          }}
                          className="p-1 rounded-md hover:bg-secondary transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            step="0.01"
                            value={categoryAmount}
                            onChange={(e) => setCategoryAmount(e.target.value)}
                            className="h-8 w-24 rounded-lg font-mono text-xs"
                            placeholder="0.00"
                          />
                          <button
                            onClick={() => {
                              if (categoryAmount && /^\d+(\.\d{1,2})?$/.test(categoryAmount)) {
                                setCategoryBudgetMutation.mutate({ categoryId: cat.categoryId, amount: categoryAmount });
                              }
                            }}
                            className="p-1 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                          >
                            <Save className="h-3.5 w-3.5 text-emerald-600" />
                          </button>
                          <button
                            onClick={() => setEditingCategory(null)}
                            className="p-1 rounded-md hover:bg-secondary transition-colors"
                          >
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>{formatCurrency(cat.spent)} di {formatCurrency(cat.amount || '0')}</span>
                      <span>{cat.percentage}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          cat.alertLevel === 'exceeded' ? 'bg-red-500' :
                          cat.alertLevel === 'danger' ? 'bg-orange-500' :
                          cat.alertLevel === 'warning' ? 'bg-amber-500' :
                          'bg-emerald-500'
                        )}
                        style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground text-sm">
                  Nessun limite mensile impostato.
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  Imposta limiti per le categorie per monitorare le spese.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Add monthly budget for categories without one */}
          {categories && budgetStatus && (() => {
            const budgetedCategoryIds = new Set(budgetStatus.monthlyCategories.map(c => c.categoryId));
            const unbudgeted = categories.filter((c: any) => !budgetedCategoryIds.has(c.id));
            if (unbudgeted.length === 0) return null;

            return (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2">Aggiungi limite mensile:</p>
                <div className="flex flex-wrap gap-2">
                  {unbudgeted.map((cat: any) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setCategoryAmount('');
                        setEditingCategory(cat.id);
                      }}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs',
                        'border border-dashed border-border hover:border-primary/50 hover:bg-primary/5',
                        'transition-colors',
                        editingCategory === cat.id && 'border-primary bg-primary/5'
                      )}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
                {editingCategory && !budgetedCategoryIds.has(editingCategory) && (
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={categoryAmount}
                      onChange={(e) => setCategoryAmount(e.target.value)}
                      className="h-9 rounded-xl font-mono flex-1"
                      placeholder="Limite mensile..."
                    />
                    <Button
                      size="sm"
                      className="rounded-xl h-9"
                      onClick={() => {
                        if (categoryAmount && /^\d+(\.\d{1,2})?$/.test(categoryAmount)) {
                          setCategoryBudgetMutation.mutate({ categoryId: editingCategory, amount: categoryAmount });
                        }
                      }}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Salva
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-xl h-9"
                      onClick={() => setEditingCategory(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Yearly Category Budgets */}
      <div className="px-5 pb-6">
        <h2 className="text-lg font-semibold mb-3">Budget annuali {year}</h2>
        <div className="space-y-2">
          {budgetStatus?.yearlyCategories && budgetStatus.yearlyCategories.length > 0 ? (
            budgetStatus.yearlyCategories.map((cat) => {
              const alert = alertConfig[cat.alertLevel];
              const AlertIcon = alert.icon;
              const isEditing = editingYearly === cat.categoryId;

              return (
                <Card key={cat.id} className="border-0 shadow-sm">
                  <CardContent className="p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cat.categoryIcon}</span>
                        <span className="font-medium text-sm">{cat.categoryName}</span>
                        {cat.alertLevel !== 'ok' && (
                          <Badge variant={cat.alertLevel === 'exceeded' ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 py-0">
                            <AlertIcon className={cn('h-3 w-3 mr-0.5', alert.color)} />
                            {alert.label}
                          </Badge>
                        )}
                      </div>
                      {!isEditing ? (
                        <button
                          onClick={() => {
                            setYearlyAmount(cat.yearlyAmount || '');
                            setYearlyThreshold(String(cat.alertThreshold || 80));
                            setEditingYearly(cat.categoryId);
                          }}
                          className="p-1 rounded-md hover:bg-secondary transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            step="0.01"
                            value={yearlyAmount}
                            onChange={(e) => setYearlyAmount(e.target.value)}
                            className="h-8 w-24 rounded-lg font-mono text-xs"
                            placeholder="Cap annuale"
                          />
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            value={yearlyThreshold}
                            onChange={(e) => setYearlyThreshold(e.target.value)}
                            className="h-8 w-16 rounded-lg font-mono text-xs"
                            placeholder="%"
                          />
                          <button
                            onClick={() => {
                              if (yearlyAmount && /^\d+(\.\d{1,2})?$/.test(yearlyAmount)) {
                                setYearlyBudgetMutation.mutate({
                                  categoryId: cat.categoryId,
                                  yearlyAmount,
                                  alertThreshold: parseInt(yearlyThreshold) || 80,
                                });
                              }
                            }}
                            className="p-1 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                          >
                            <Save className="h-3.5 w-3.5 text-emerald-600" />
                          </button>
                          <button
                            onClick={() => setEditingYearly(null)}
                            className="p-1 rounded-md hover:bg-secondary transition-colors"
                          >
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>{formatCurrency(cat.spent)} di {formatCurrency(cat.yearlyAmount || '0')}</span>
                      <span>{cat.percentage}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          cat.alertLevel === 'exceeded' ? 'bg-red-500' :
                          cat.alertLevel === 'danger' ? 'bg-orange-500' :
                          cat.alertLevel === 'warning' ? 'bg-amber-500' :
                          'bg-violet-500'
                        )}
                        style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-8 text-center">
                <Wallet className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">
                  Nessun budget annuale impostato.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Add yearly budget for categories without one */}
          {categories && budgetStatus && (() => {
            const yearlyCategoryIds = new Set(budgetStatus.yearlyCategories.map(c => c.categoryId));
            const unbudgeted = categories.filter((c: any) => !c.isPrivate && !yearlyCategoryIds.has(c.id));
            if (unbudgeted.length === 0) return null;

            return (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2">Aggiungi cap annuale:</p>
                <div className="flex flex-wrap gap-2">
                  {unbudgeted.map((cat: any) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setYearlyAmount('');
                        setYearlyThreshold('80');
                        setEditingYearly(cat.id);
                      }}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs',
                        'border border-dashed border-border hover:border-violet-500/50 hover:bg-violet-500/5',
                        'transition-colors',
                        editingYearly === cat.id && 'border-violet-500 bg-violet-500/5'
                      )}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
                {editingYearly && !yearlyCategoryIds.has(editingYearly) && (
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={yearlyAmount}
                      onChange={(e) => setYearlyAmount(e.target.value)}
                      className="h-9 rounded-xl font-mono flex-1"
                      placeholder="Cap annuale..."
                    />
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={yearlyThreshold}
                      onChange={(e) => setYearlyThreshold(e.target.value)}
                      className="h-9 rounded-xl font-mono w-16"
                      placeholder="% alert"
                    />
                    <Button
                      size="sm"
                      className="rounded-xl h-9"
                      onClick={() => {
                        if (editingYearly && yearlyAmount && /^\d+(\.\d{1,2})?$/.test(yearlyAmount)) {
                          setYearlyBudgetMutation.mutate({
                            categoryId: editingYearly,
                            yearlyAmount,
                            alertThreshold: parseInt(yearlyThreshold) || 80,
                          });
                        }
                      }}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Salva
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-xl h-9"
                      onClick={() => setEditingYearly(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
