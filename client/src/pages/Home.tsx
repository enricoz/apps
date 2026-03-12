import { useQuery } from '@tanstack/react-query';
import { Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressRing } from '@/components/ui/progress-ring';
import { AppHeader } from '@/components/layout/AppHeader';
import { apiRequest } from '@/lib/api';
import { formatCurrency, getCurrentMonthYear, getMonthName } from '@/lib/format';
import { cn } from '@/lib/utils';

export function HomePage() {
  const { month, year } = getCurrentMonthYear();

  const { data: familyBudget } = useQuery({
    queryKey: ['/api/budgets/family', month, year],
    queryFn: () => apiRequest(`/api/budgets/family?month=${month}&year=${year}`),
  });

  const { data: totalSpending } = useQuery({
    queryKey: ['/api/analytics/total-spending', month, year],
    queryFn: () => apiRequest(`/api/analytics/total-spending?month=${month}&year=${year}`),
  });

  const { data: expenses } = useQuery({
    queryKey: ['/api/expenses'],
    queryFn: () => apiRequest('/api/expenses'),
  });

  const budgetTotal = familyBudget?.totalAmount ? parseFloat(familyBudget.totalAmount) : 0;
  const spent = totalSpending?.total ? parseFloat(totalSpending.total) : 0;
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
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <ArrowUpRight className="h-3 w-3 text-emerald-600" />
              </div>
              <span className="text-xs text-muted-foreground">Entrate</span>
            </div>
            <p className="font-mono font-semibold text-lg">{formatCurrency(budgetTotal)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
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
      </div>

      {/* Recent Expenses */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Spese recenti</h2>
          <Button size="sm" className="rounded-full gap-1 h-8 px-3 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Nuova
          </Button>
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
                      </p>
                    </div>
                  </div>
                  <span className="font-mono font-semibold text-sm">
                    -{formatCurrency(expense.amount)}
                  </span>
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
                <Button className="mt-4 rounded-full" size="sm">
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
