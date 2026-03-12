import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { AppHeader } from '@/components/layout/AppHeader';
import { apiRequest } from '@/lib/api';
import { formatCurrency, getCurrentMonthYear, getMonthName } from '@/lib/format';
import { cn } from '@/lib/utils';
import { TrendingDown, TrendingUp } from 'lucide-react';

export function AnalyticsPage() {
  const { month, year } = getCurrentMonthYear();

  const { data: spendingByCategory } = useQuery({
    queryKey: ['/api/analytics/spending-by-category', month, year],
    queryFn: () =>
      apiRequest(`/api/analytics/spending-by-category?month=${month}&year=${year}`),
  });

  const { data: totalSpending } = useQuery({
    queryKey: ['/api/analytics/total-spending', month, year],
    queryFn: () => apiRequest(`/api/analytics/total-spending?month=${month}&year=${year}`),
  });

  const total = totalSpending?.total ? parseFloat(totalSpending.total) : 0;

  return (
    <div className="space-y-6">
      <AppHeader title="Analisi" subtitle={`${getMonthName(month)} ${year}`} />

      {/* Total Spending */}
      <div className="px-5">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Spesa totale del mese</p>
            <p className="text-3xl font-mono font-bold tracking-tight">{formatCurrency(total)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="px-5">
        <h2 className="text-lg font-semibold mb-3">Per categoria</h2>
        <div className="space-y-2 stagger-children">
          {spendingByCategory && spendingByCategory.length > 0 ? (
            spendingByCategory.map((category: any) => {
              const amount = parseFloat(category.total);
              const percentage = total > 0 ? (amount / total) * 100 : 0;

              return (
                <Card key={category.categoryId} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                          style={{ backgroundColor: `${category.categoryColor}15` }}
                        >
                          {category.categoryIcon}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{category.categoryName}</p>
                          <p className="text-xs text-muted-foreground">
                            {percentage.toFixed(1)}% del totale
                          </p>
                        </div>
                      </div>
                      <span className="font-mono font-semibold text-sm">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: category.categoryColor,
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">Nessuna spesa questo mese</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Le statistiche appariranno quando aggiungi spese
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
