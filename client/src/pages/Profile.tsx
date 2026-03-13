import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { LogOut, Users, ChevronRight, Crown, CreditCard, Bell, Tag, Target, PieChart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppHeader } from '@/components/layout/AppHeader';
import { apiRequest } from '@/lib/api';
import { cn } from '@/lib/utils';

export function ProfilePage() {
  const [, navigate] = useLocation();

  const { data: authData } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => apiRequest('/api/auth/me'),
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest('/api/auth/logout', { method: 'POST' }),
    onSuccess: () => { window.location.href = '/'; },
  });

  const user = authData?.user;
  const family = authData?.family;
  const isAdmin = authData?.familyMember?.role === 'admin';
  const initials = user?.fullName
    ? user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?';

  const settingsItems = [
    { icon: PieChart, label: 'Analisi', description: 'Statistiche e grafici', path: '/analytics' },
    { icon: Target, label: 'Budget', description: 'Imposta limiti di spesa', path: '/budget' },
    { icon: Tag, label: 'Categorie', description: 'Gestisci le categorie di spesa', path: null },
    { icon: Bell, label: 'Notifiche', description: 'Preferenze notifiche', path: null },
    { icon: CreditCard, label: 'Abbonamento', description: 'Piano e fatturazione', path: '/subscription' },
  ];

  return (
    <div className="space-y-6">
      <AppHeader title="Profilo" />

      {/* User Card */}
      <div className="px-5">
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base truncate">{user?.fullName || 'Utente'}</p>
                <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Family Card */}
      {family && (
        <div className="px-5">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{family.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {isAdmin ? (
                        <Badge variant="success" className="text-[10px] px-1.5 py-0">
                          <Crown className="h-2.5 w-2.5 mr-0.5" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          Membro
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <Button variant="outline" size="sm" className="rounded-full text-xs h-8">
                    Gestisci
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings */}
      <div className="px-5">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
          Impostazioni
        </h2>
        <Card className="border-0 shadow-sm overflow-hidden">
          {settingsItems.map((item, i) => (
            <button
              key={item.label}
              onClick={() => item.path && navigate(item.path)}
              className={cn(
                'w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors text-left',
                i < settingsItems.length - 1 && 'border-b border-border',
                !item.path && 'opacity-50 cursor-default'
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </Card>
      </div>

      {/* Logout */}
      <div className="px-5 pb-8">
        <Button
          variant="outline"
          className="w-full h-11 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {logoutMutation.isPending ? 'Disconnessione...' : 'Esci dall\'account'}
        </Button>
      </div>
    </div>
  );
}
