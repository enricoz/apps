import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout/AppHeader';
import { apiRequest } from '@/lib/api';
import { formatCurrency, getMonthName } from '@/lib/format';
import { ChevronLeft, ChevronRight, TrendingUp, BarChart3 } from 'lucide-react';

const FALLBACK_COLORS = [
  '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
];

function getShortMonthName(month: number): string {
  const names = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
  return names[month - 1] || '';
}

export function AnalyticsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const goBack = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const goForward = () => {
    const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();
    if (isCurrentMonth) return;
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  const { data: spendingByCategory } = useQuery({
    queryKey: ['/api/analytics/spending-by-category', month, year],
    queryFn: () => apiRequest(`/api/analytics/spending-by-category?month=${month}&year=${year}`),
  });

  const { data: totalSpending } = useQuery({
    queryKey: ['/api/analytics/total-spending', month, year],
    queryFn: () => apiRequest(`/api/analytics/total-spending?month=${month}&year=${year}`),
  });

  const { data: monthlyTrend } = useQuery({
    queryKey: ['/api/analytics/monthly-trend'],
    queryFn: () => apiRequest('/api/analytics/monthly-trend?months=6'),
  });

  const total = totalSpending?.total ? parseFloat(totalSpending.total) : 0;

  // Prepare pie chart data
  const pieData = (spendingByCategory || [])
    .map((cat: any, i: number) => ({
      name: cat.categoryName,
      value: parseFloat(cat.total),
      color: cat.categoryColor || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
      icon: cat.categoryIcon,
    }))
    .filter((d: any) => d.value > 0);

  // Prepare bar chart data
  const barData = (monthlyTrend || []).map((item: any) => ({
    name: getShortMonthName(item.month),
    spesa: parseFloat(item.total),
  }));

  return (
    <div className="space-y-6 pb-4">
      <AppHeader title="Analisi" subtitle={`${getMonthName(month)} ${year}`} />

      {/* Month Navigation */}
      <div className="px-5 flex items-center justify-between">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={goBack}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold">
          {getMonthName(month)} {year}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={goForward}
          disabled={isCurrentMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Total Spending */}
      <div className="px-5">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Spesa totale del mese</p>
            <p className="text-3xl font-mono font-bold tracking-tight">{formatCurrency(total)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Donut Chart */}
      {pieData.length > 0 && (
        <div className="px-5">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Distribuzione spese
              </h3>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Totale</p>
                      <p className="text-sm font-mono font-bold">{formatCurrency(total)}</p>
                    </div>
                  </div>
                </div>
                {/* Legend */}
                <div className="flex-1 space-y-2">
                  {pieData.slice(0, 5).map((entry: any) => {
                    const pct = total > 0 ? ((entry.value / total) * 100).toFixed(0) : '0';
                    return (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-xs truncate flex-1">{entry.icon} {entry.name}</span>
                        <span className="text-xs font-mono text-muted-foreground">{pct}%</span>
                      </div>
                    );
                  })}
                  {pieData.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      +{pieData.length - 5} altre categorie
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monthly Trend */}
      {barData.length > 1 && (
        <div className="px-5">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Trend ultimi 6 mesi
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={barData} barSize={28}>
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis hide />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Spesa']}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="spesa" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Breakdown List */}
      <div className="px-5">
        <h2 className="text-lg font-semibold mb-3">Per categoria</h2>
        <div className="space-y-2 stagger-children">
          {spendingByCategory && spendingByCategory.length > 0 ? (
            spendingByCategory.map((category: any, i: number) => {
              const amount = parseFloat(category.total);
              const percentage = total > 0 ? (amount / total) * 100 : 0;
              const color = category.categoryColor || FALLBACK_COLORS[i % FALLBACK_COLORS.length];

              return (
                <Card key={category.categoryId} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                          style={{ backgroundColor: `${color}15` }}
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
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: color,
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
