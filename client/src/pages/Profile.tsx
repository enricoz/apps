import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  LogOut, Users, ChevronRight, Crown, Camera, Check, X,
  Bell, Tag, Target, PieChart, CreditCard, Shield, Edit2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AppHeader } from '@/components/layout/AppHeader';
import { useToast } from '@/components/ui/use-toast';
import { apiRequest } from '@/lib/api';
import { cn } from '@/lib/utils';

const AVATAR_COLORS = [
  'from-emerald-400 to-teal-500',
  'from-blue-400 to-indigo-500',
  'from-violet-400 to-purple-500',
  'from-pink-400 to-rose-500',
  'from-amber-400 to-orange-500',
  'from-cyan-400 to-blue-500',
];

export function ProfilePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  const { data: authData } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => apiRequest('/api/auth/me'),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: { fullName?: string; profilePicture?: string }) =>
      apiRequest('/api/auth/profile', {
        method: 'PATCH',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      setEditingName(false);
      toast({ title: 'Profilo aggiornato' });
    },
    onError: () => toast({ title: 'Errore', description: 'Impossibile aggiornare il profilo.', variant: 'destructive' }),
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

  // Deterministic color based on user id
  const colorIndex = user?.id ? user.id.charCodeAt(0) % AVATAR_COLORS.length : 0;
  const avatarGradient = AVATAR_COLORS[colorIndex];

  const startEditName = () => {
    setNewName(user?.fullName || '');
    setEditingName(true);
  };

  const saveName = () => {
    if (newName.trim()) {
      updateProfileMutation.mutate({ fullName: newName.trim() });
    }
  };

  const settingsItems = [
    { icon: PieChart, label: 'Report', description: 'Statistiche e grafici', path: '/analytics', color: 'bg-blue-100 text-blue-600' },
    { icon: Target, label: 'Budget', description: 'Imposta limiti di spesa', path: '/budget', color: 'bg-emerald-100 text-emerald-600' },
    { icon: CreditCard, label: 'Banca', description: 'Importa estratti conto', path: '/revolut', color: 'bg-violet-100 text-violet-600' },
    { icon: Tag, label: 'Categorie', description: 'Gestisci le categorie', path: '/categories', color: 'bg-amber-100 text-amber-600' },
    { icon: Bell, label: 'Notifiche', description: 'Preferenze notifiche', path: null, color: 'bg-pink-100 text-pink-600' },
  ];

  return (
    <div className="space-y-5 pb-4">
      <AppHeader title="Profilo" />

      {/* Avatar + Name Card - Revolut style */}
      <div className="px-5">
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            {/* Gradient header */}
            <div className={cn('h-20 bg-gradient-to-r', avatarGradient)} />

            {/* Avatar + info */}
            <div className="px-5 pb-5 -mt-10">
              <div className="flex items-end gap-4 mb-4">
                <div className="relative">
                  <div className={cn(
                    'w-20 h-20 rounded-2xl flex items-center justify-center border-4 border-background shadow-lg bg-gradient-to-br',
                    avatarGradient
                  )}>
                    {user?.profilePicture ? (
                      <img src={user.profilePicture} alt="" className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-white">{initials}</span>
                    )}
                  </div>
                  <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  {editingName ? (
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="h-8 text-sm"
                        placeholder="Il tuo nome"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && saveName()}
                      />
                      <Button size="icon" className="h-8 w-8 rounded-lg" onClick={saveName} disabled={updateProfileMutation.isPending}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => setEditingName(false)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-lg truncate">{user?.fullName || 'Utente'}</p>
                      <button onClick={startEditName} className="text-muted-foreground hover:text-foreground">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>

              {/* Member since */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                <span>Membro dal {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }) : '—'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Family Card */}
      <div className="px-5">
        <Card className="border-0 shadow-sm overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/family')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate">{family?.name || 'Nessuna famiglia'}</p>
                  {isAdmin && (
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-amber-100 text-amber-700 border-0">
                      <Crown className="h-2.5 w-2.5 mr-0.5" />
                      Admin
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {family ? 'Gestisci membri e impostazioni' : 'Crea o unisciti a una famiglia'}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Settings */}
      <div className="px-5">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
          Impostazioni
        </h2>
        <Card className="border-0 shadow-sm overflow-hidden divide-y divide-border">
          {settingsItems.map((item) => (
            <button
              key={item.label}
              onClick={() => item.path && navigate(item.path)}
              className={cn(
                'w-full flex items-center gap-3 p-3.5 hover:bg-secondary/50 transition-colors text-left',
                !item.path && 'opacity-40 cursor-default'
              )}
            >
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', item.color)}>
                <item.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-[11px] text-muted-foreground">{item.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </Card>
      </div>

      {/* Logout */}
      <div className="px-5 pt-2 pb-8">
        <Button
          variant="outline"
          className="w-full h-12 rounded-2xl text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20 font-medium"
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
