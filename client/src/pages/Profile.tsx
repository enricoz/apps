import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut, Users, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { apiRequest } from '@/lib/api';

export function ProfilePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: authData } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => apiRequest('/api/auth/me'),
  });

  const logoutMutation = useMutation({
    mutationFn: () =>
      apiRequest('/api/auth/logout', {
        method: 'POST',
      }),
    onSuccess: () => {
      window.location.href = '/';
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const user = authData?.user;
  const family = authData?.family;
  const isAdmin = authData?.familyMember?.role === 'admin';

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Profilo</h1>
        <p className="text-sm text-muted-foreground">
          Gestisci il tuo account e la famiglia
        </p>
      </div>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informazioni Utente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-sm text-muted-foreground">Nome</p>
            <p className="font-medium">{user?.fullName || user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Family Info */}
      {family && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5" />
              <div>
                <CardTitle>{family.name}</CardTitle>
                <CardDescription>
                  {isAdmin ? 'Amministratore' : 'Membro'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {isAdmin && (
              <div>
                <Button variant="outline" className="w-full" disabled>
                  <Users className="h-4 w-4 mr-2" />
                  Gestisci Membri
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5" />
            <CardTitle>Impostazioni</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full" disabled>
            Categorie
          </Button>
          <Button variant="outline" className="w-full" disabled>
            Budget
          </Button>
          <Button variant="outline" className="w-full" disabled>
            Notifiche
          </Button>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="destructive"
        className="w-full"
        onClick={handleLogout}
        disabled={logoutMutation.isPending}
      >
        <LogOut className="h-4 w-4 mr-2" />
        {logoutMutation.isPending ? 'Disconnessione...' : 'Esci'}
      </Button>
    </div>
  );
}
