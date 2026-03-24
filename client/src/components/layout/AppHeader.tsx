import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Bell, ArrowLeft } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
}

export function AppHeader({ title, subtitle, showBack }: AppHeaderProps) {
  const [, navigate] = useLocation();
  const { data: authData } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => apiRequest('/api/auth/me'),
  });

  const { data: notifications } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: () => apiRequest('/api/notifications'),
  });

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;
  const user = authData?.user;
  const displayName = user?.fullName?.split(' ')[0] || 'Ciao';

  return (
    <div className="flex items-center justify-between px-5 pt-5 pb-2">
      <div className="flex items-center gap-2">
        {showBack && (
          <button onClick={() => window.history.back()} className="p-1.5 -ml-1.5 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-2xl font-bold tracking-tight">
          {title || `Ciao, ${displayName}`}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="relative">
        <button
          className="p-2 rounded-full hover:bg-secondary transition-colors"
          aria-label="Notifiche"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
