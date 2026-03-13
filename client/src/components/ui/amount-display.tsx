import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AmountDisplayProps {
  value: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  trend?: 'up' | 'down' | 'neutral';
  showSign?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-4xl',
};

export function AmountDisplay({
  value,
  size = 'md',
  trend,
  showSign = false,
  className,
}: AmountDisplayProps) {
  const formatted = new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(Math.abs(value));

  const sign = value < 0 ? '-' : value > 0 && showSign ? '+' : '';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        className={cn(
          'font-mono font-semibold tracking-tight tabular-nums',
          sizeClasses[size],
          trend === 'up' && 'text-primary',
          trend === 'down' && 'text-destructive',
        )}
      >
        {sign}{formatted}
      </span>
      {trend && (
        <span className={cn(
          'flex items-center',
          trend === 'up' && 'text-primary',
          trend === 'down' && 'text-destructive',
          trend === 'neutral' && 'text-muted-foreground',
        )}>
          {trend === 'up' && <TrendingUp className="h-4 w-4" />}
          {trend === 'down' && <TrendingDown className="h-4 w-4" />}
          {trend === 'neutral' && <Minus className="h-4 w-4" />}
        </span>
      )}
    </div>
  );
}
