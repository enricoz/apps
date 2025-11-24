import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/api';
import { formatCurrency, getCurrentMonthYear, getMonthName } from '@/lib/format';

export function AnalyticsPage() {
  const { month, year } = getCurrentMonthYear();

  // CRITICAL: This endpoint filters by userId
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
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          {getMonthName(month)} {year}
        </p>
      </div>

      {/* Total Spending Card */}
      <Card>
        <CardHeader>
          <CardTitle>Spesa Totale</CardTitle>
          <CardDescription>Tutte le categorie</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatCurrency(total)}</div>
        </CardContent>
      </Card>

      {/* Spending by Category */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Per Categoria</h2>
        <div className="space-y-2">
          {spendingByCategory && spendingByCategory.length > 0 ? (
            spendingByCategory.map((category: any) => {
              const amount = parseFloat(category.total);
              const percentage = total > 0 ? (amount / total) * 100 : 0;

              return (
                <Card key={category.categoryId}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{category.categoryIcon}</span>
                        <span className="font-medium">{category.categoryName}</span>
                      </div>
                      <span className="font-semibold">{formatCurrency(amount)}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: category.categoryColor,
                        }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {percentage.toFixed(1)}% del totale
                    </p>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Nessuna spesa questo mese</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
