import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, XAxis, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout/AppHeader';
import { apiRequest } from '@/lib/api';
import { formatCurrency, getMonthName } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  PiggyBank, Wallet, Target, Users, User,
} from 'lucide-react';

const COLORS = [
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
  const [view, setView] = useState<'family' | 'personal'>('family');

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

  // Family data
  const { data: spendingByCategory } = useQuery({
    queryKey: ['/api/analytics/spending-by-category', month, year],
    queryFn: () => apiRequest(`/api/analytics/spending-by-category?month=${month}&year=${year}`),
  });

  const { data: totalSpending } = useQuery({
    queryKey: ['/api/analytics/total-spending', month, year],
    queryFn: () => apiRequest(`/api/analytics/total-spending?month=${month}&year=${year}`),
  });

  // Personal data
  const { data: personalSpendingByCategory } = useQuery({
    queryKey: ['/api/analytics/personal-spending-by-category', month, year],
    queryFn: () => apiRequest(`/api/analytics/personal-spending-by-category?month=${month}&year=${year}`),
  });

  const { data: personalSpending } = useQuery({
    queryKey: ['/api/analytics/personal-spending', month, year],
    queryFn: () => apiRequest(`/api/analytics/personal-spending?month=${month}&year=${year}`),
  });

  const { data: monthlyTrend } = useQuery({
    queryKey: ['/api/analytics/monthly-trend'],
    queryFn: () => apiRequest('/api/analytics/monthly-trend?months=6'),
  });

  const { data: balance } = useQuery({
    queryKey: ['/api/accounts/balance', month, year],
    queryFn: () => apiRequest(`/api/accounts/balance?month=${month}&year=${year}`),
  });

  const { data: familyBudget } = useQuery({
    queryKey: ['/api/budgets/family', month, year],
    queryFn: () => apiRequest(`/api/budgets/family?month=${month}&year=${year}`),
  });

  const { data: personalBudget } = useQuery({
    queryKey: ['/api/budgets/personal', month, year],
    queryFn: () => apiRequest(`/api/budgets/personal?month=${month}&year=${year}`),
  });

  const familyTotal = totalSpending?.total ? parseFloat(totalSpending.total) : 0;
  const personalTotal = personalSpending?.total ? parseFloat(personalSpending.total) : 0;
  const totalIncome = balance?.income ? parseFloat(balance.income) : 0;
  const familyBudgetTotal = familyBudget?.totalAmount ? parseFloat(familyBudget.totalAmount) : 0;
  const personalBudgetTotal = personalBudget?.totalAmount ? parseFloat(personalBudget.totalAmount) : 0;

  // Current view values
  const isFamily = view === 'family';
  const total = isFamily ? familyTotal : personalTotal;
  const budgetTotal = isFamily ? familyBudgetTotal : personalBudgetTotal;
  const currentCategories = isFamily ? spendingByCategory : personalSpendingByCategory;
  const savings = totalIncome - familyTotal;
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
  const budgetUsed = budgetTotal > 0 ? (total / budgetTotal) * 100 : 0;

  const trendData = (monthlyTrend || []).map((item: any) => ({
    name: getShortMonthName(item.month),
    spesa: parseFloat(item.total),
    month: item.month,
    year: item.year,
  }));

  const prevMonthTrend = trendData.length >= 2 ? trendData[trendData.length - 2] : null;
  const monthOverMonth = prevMonthTrend && prevMonthTrend.spesa > 0
    ? ((familyTotal - prevMonthTrend.spesa) / prevMonthTrend.spesa) * 100
    : 0;

  const pieData = (currentCategories || [])
    .map((cat: any, i: number) => ({
      name: cat.categoryName,
      value: parseFloat(cat.total),
      color: cat.categoryColor || COLORS[i % COLORS.length],
      icon: cat.categoryIcon,
    }))
    .filter((d: any) => d.value > 0)
    .sort((a: any, b: any) => b.value - a.value);

  return (
    <div className="space-y-5 pb-4">
      <AppHeader title="Report" subtitle="Analisi dettagliata" />

      {/* Month Navigation */}
      <div className="px-5">
        <div className="flex items-center justify-between bg-muted/50 rounded-2xl px-4 py-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={goBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <p className="text-sm font-semibold">{getMonthName(month)} {year}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={goForward} disabled={isCurrentMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="px-5">
        <div className="flex bg-muted rounded-xl p-1 gap-1">
          <button
            onClick={() => setView('family')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
              view === 'family' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Users className="h-4 w-4" />
            Famiglia
          </button>
          <button
            onClick={() => setView('personal')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
              view === 'personal' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <User className="h-4 w-4" />
            Personale
          </button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="px-5">
        <Card className={cn(
          'border-0 shadow-lg overflow-hidden',
          isFamily
            ? 'bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900'
            : 'bg-gradient-to-br from-blue-900 to-blue-800 dark:from-blue-800 dark:to-blue-900'
        )}>
          <CardContent className="p-6">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">
              {isFamily ? 'Spesa totale famiglia' : 'Le mie spese'}
            </p>
            <p className="text-4xl font-mono font-bold text-white tracking-tight mb-4">
              {formatCurrency(total)}
            </p>

            {/* Month over month - only family */}
            {isFamily && prevMonthTrend && (
              <div className="flex items-center gap-1.5 mb-4">
                {monthOverMonth <= 0 ? (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20">
                    <TrendingDown className="h-3 w-3 text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-400">{Math.abs(monthOverMonth).toFixed(0)}%</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20">
                    <TrendingUp className="h-3 w-3 text-red-400" />
                    <span className="text-xs font-medium text-red-400">+{monthOverMonth.toFixed(0)}%</span>
                  </div>
                )}
                <span className="text-xs text-slate-500">vs mese precedente</span>
              </div>
            )}

            {/* Personal view - contribution info */}
            {!isFamily && familyTotal > 0 && (
              <div className="flex items-center gap-1.5 mb-4">
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20">
                  <span className="text-xs font-medium text-blue-400">
                    {((personalTotal / familyTotal) * 100).toFixed(0)}%
                  </span>
                </div>
                <span className="text-xs text-slate-500">del totale famiglia ({formatCurrency(familyTotal)})</span>
              </div>
            )}

            {/* Mini stats row */}
            <div className={cn('grid gap-3 pt-4 border-t border-white/10', isFamily ? 'grid-cols-3' : 'grid-cols-2')}>
              {isFamily && (
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                    <span className="text-[10px] text-slate-500 uppercase">Entrate</span>
                  </div>
                  <p className="font-mono font-semibold text-sm text-emerald-400">{formatCurrency(totalIncome)}</p>
                </div>
              )}
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <ArrowDownRight className="h-3 w-3 text-red-400" />
                  <span className="text-[10px] text-slate-500 uppercase">Uscite</span>
                </div>
                <p className="font-mono font-semibold text-sm text-red-400">{formatCurrency(total)}</p>
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <PiggyBank className="h-3 w-3 text-blue-400" />
                  <span className="text-[10px] text-slate-500 uppercase">
                    {isFamily ? 'Risparmi' : 'Budget'}
                  </span>
                </div>
                <p className={cn('font-mono font-semibold text-sm',
                  isFamily ? (savings >= 0 ? 'text-blue-400' : 'text-red-400') : 'text-blue-400'
                )}>
                  {isFamily ? formatCurrency(savings) : (budgetTotal > 0 ? formatCurrency(budgetTotal - total) : '—')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick metric cards */}
      <div className="px-5 grid grid-cols-2 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <PiggyBank className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <span className="text-xs text-muted-foreground">
                {isFamily ? 'Tasso risparmio' : 'Quota famiglia'}
              </span>
            </div>
            <p className={cn('text-2xl font-mono font-bold',
              isFamily
                ? (savingsRate >= 20 ? 'text-emerald-600' : savingsRate >= 0 ? 'text-amber-600' : 'text-red-600')
                : 'text-blue-600'
            )}>
              {isFamily
                ? `${savingsRate.toFixed(0)}%`
                : (familyTotal > 0 ? `${((personalTotal / familyTotal) * 100).toFixed(0)}%` : '—')
              }
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {isFamily
                ? (savingsRate >= 20 ? 'Ottimo!' : savingsRate >= 0 ? 'Può migliorare' : 'Attenzione')
                : 'delle spese totali'
              }
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Target className="h-3.5 w-3.5 text-violet-600" />
              </div>
              <span className="text-xs text-muted-foreground">Budget usato</span>
            </div>
            <p className={cn('text-2xl font-mono font-bold', budgetUsed <= 80 ? 'text-violet-600' : budgetUsed <= 100 ? 'text-amber-600' : 'text-red-600')}>
              {budgetTotal > 0 ? `${budgetUsed.toFixed(0)}%` : '—'}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {budgetTotal > 0 ? `di ${formatCurrency(budgetTotal)}` : 'Nessun budget'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Spending Trend Chart - only family */}
      {isFamily && trendData.length > 1 && (
        <div className="px-5">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Andamento spese
              </h3>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="spesaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Spesa']}
                    contentStyle={{
                      borderRadius: '12px', border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="spesa"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    fill="url(#spesaGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Donut Chart + Legend */}
      {pieData.length > 0 && (
        <div className="px-5">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                {isFamily ? 'Distribuzione spese famiglia' : 'Distribuzione le mie spese'}
              </h3>
              <div className="flex items-center gap-6">
                <div className="relative flex-shrink-0">
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={46}
                        outerRadius={66}
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
                      <p className="text-[10px] text-muted-foreground">Totale</p>
                      <p className="text-xs font-mono font-bold">{formatCurrency(total)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-2.5">
                  {pieData.slice(0, 5).map((entry: any) => {
                    const pct = total > 0 ? ((entry.value / total) * 100).toFixed(0) : '0';
                    return (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="text-xs truncate flex-1">{entry.icon} {entry.name}</span>
                        <span className="text-xs font-mono font-medium text-muted-foreground">{pct}%</span>
                      </div>
                    );
                  })}
                  {pieData.length > 5 && (
                    <p className="text-[10px] text-muted-foreground">+{pieData.length - 5} altre</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Personal vs Family comparison - only in family view */}
      {isFamily && personalTotal > 0 && familyTotal > 0 && (
        <div className="px-5">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Le tue spese vs famiglia
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">Tu</span>
                    <span className="font-mono font-semibold">{formatCurrency(personalTotal)}</span>
                  </div>
                  <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500 transition-all duration-700"
                      style={{ width: `${(personalTotal / familyTotal) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">Altri membri</span>
                    <span className="font-mono font-semibold">{formatCurrency(familyTotal - personalTotal)}</span>
                  </div>
                  <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-violet-500 transition-all duration-700"
                      style={{ width: `${((familyTotal - personalTotal) / familyTotal) * 100}%` }} />
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-3 text-center">
                Le tue spese rappresentano il {((personalTotal / familyTotal) * 100).toFixed(0)}% del totale famiglia
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="px-5">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-3">
          {isFamily ? 'Dettaglio per categoria (famiglia)' : 'Dettaglio per categoria (personale)'}
        </h2>
        <div className="space-y-1.5">
          {pieData.length > 0 ? (
            pieData.map((category: any) => {
              const percentage = total > 0 ? (category.value / total) * 100 : 0;
              return (
                <Card key={category.name} className="border-0 shadow-sm">
                  <CardContent className="p-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ backgroundColor: `${category.color}18` }}
                      >
                        {category.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm truncate">{category.name}</p>
                          <span className="font-mono font-semibold text-sm flex-shrink-0 ml-2">
                            {formatCurrency(category.value)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700 ease-out"
                              style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: category.color }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">
                  {isFamily ? 'Nessuna spesa famiglia questo mese' : 'Nessuna tua spesa questo mese'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
