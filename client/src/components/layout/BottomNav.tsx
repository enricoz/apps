import { Link, useLocation } from 'wouter';
import { Home, PieChart, CreditCard, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/analytics', label: 'Analisi', icon: PieChart },
  { path: '/revolut', label: 'Banca', icon: CreditCard },
  { path: '/profile', label: 'Profilo', icon: User },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 pb-safe">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;

          return (
            <Link key={item.path} href={item.path}>
              <a
                className={cn(
                  'flex flex-col items-center justify-center w-16 h-full gap-0.5 relative',
                  'active:scale-95 transition-all duration-200',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                {isActive && (
                  <span className="absolute -top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                )}
                <Icon className={cn('h-5 w-5', isActive && 'drop-shadow-sm')} strokeWidth={isActive ? 2.5 : 2} />
                <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>{item.label}</span>
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
