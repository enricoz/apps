import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/api';
import { formatCurrency, getCurrentMonthYear, getMonthName } from '@/lib/format';

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
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ciao!</h1>
          <p className="text-sm text-muted-foreground">
            {getMonthName(month)} {year}
          </p>
        </div>
      </div>

      {/* Family Budget Card */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Famiglia</CardTitle>
          <CardDescription>Spesa mensile totale</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-3xl font-bold">{formatCurrency(spent)}</span>
              <span className="text-sm text-muted-foreground">
                di {formatCurrency(budgetTotal)}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Rimanente</span>
            <span className="font-semibold">{formatCurrency(remaining)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Expenses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Spese recenti</h2>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Aggiungi
          </Button>
        </div>

        <div className="space-y-2">
          {expenses && expenses.length > 0 ? (
            expenses.slice(0, 10).map((expense: any) => (
              <Card key={expense.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{expense.category.icon}</span>
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {expense.category.name}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold">{formatCurrency(expense.amount)}</span>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Nessuna spesa registrata</p>
                <Button className="mt-4" size="sm">
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
