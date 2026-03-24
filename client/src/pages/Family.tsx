import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  Users, Crown, Mail, Trash2, ChevronLeft, Plus, Copy, Check,
  UserPlus, Clock, AlertTriangle, Edit2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { apiRequest } from '@/lib/api';
import { cn } from '@/lib/utils';

export function FamilyPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const { data: authData } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => apiRequest('/api/auth/me'),
  });

  const family = authData?.family;
  const isAdmin = authData?.familyMember?.role === 'admin';
  const currentUserId = authData?.user?.id;

  const { data: familyDetails } = useQuery({
    queryKey: ['/api/families', family?.id],
    queryFn: () => apiRequest(`/api/families/${family?.id}`),
    enabled: !!family?.id,
  });

  const { data: invites } = useQuery({
    queryKey: ['/api/invites'],
    queryFn: () => apiRequest('/api/invites'),
    enabled: isAdmin,
  });

  const members = familyDetails?.members || [];
  const pendingInvites = (invites || []).filter((i: any) => i.status === 'pending');

  // Update family name
  const updateNameMutation = useMutation({
    mutationFn: () => apiRequest(`/api/families/${family?.id}`, {
      method: 'PATCH',
      body: { name: familyName },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/families'] });
      setEditingName(false);
      toast({ title: 'Nome aggiornato', description: 'Il nome della famiglia è stato modificato.' });
    },
    onError: () => toast({ title: 'Errore', description: 'Impossibile aggiornare il nome.', variant: 'destructive' }),
  });

  // Invite member
  const inviteMutation = useMutation({
    mutationFn: () => apiRequest('/api/invites', {
      method: 'POST',
      body: { email: inviteEmail },
    }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/invites'] });
      const email = inviteEmail;
      setInviteEmail('');
      toast({
        title: data.emailSent ? 'Invito inviato!' : 'Invito creato!',
        description: data.emailSent
          ? `Email di invito inviata a ${email}`
          : `Link di invito generato per ${email} (email non configurata, condividi il link manualmente)`,
      });
    },
    onError: (error: any) => toast({
      title: 'Errore',
      description: error?.message || 'Impossibile creare l\'invito.',
      variant: 'destructive',
    }),
  });

  // Remove member
  const removeMutation = useMutation({
    mutationFn: (memberId: string) => apiRequest(`/api/families/${family?.id}/members/${memberId}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/families'] });
      toast({ title: 'Membro rimosso', description: 'L\'utente è stato rimosso dalla famiglia.' });
    },
    onError: () => toast({ title: 'Errore', description: 'Impossibile rimuovere il membro.', variant: 'destructive' }),
  });

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: 'Link copiato!', description: 'Condividi questo link con il membro da invitare.' });
  };

  const startEditName = () => {
    setFamilyName(family?.name || '');
    setEditingName(true);
  };

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <div className="px-5 pt-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => navigate('/profile')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Gestione Famiglia</h1>
          <p className="text-xs text-muted-foreground">Membri, inviti e impostazioni</p>
        </div>
      </div>

      {/* Family Name Card */}
      <div className="px-5">
        <Card className="border-0 shadow-sm overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      className="h-8 bg-white/20 border-white/30 text-white placeholder:text-white/50 text-sm"
                      placeholder="Nome famiglia"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      className="h-8 bg-white/20 hover:bg-white/30 text-white text-xs"
                      onClick={() => updateNameMutation.mutate()}
                      disabled={updateNameMutation.isPending || !familyName.trim()}
                    >
                      Salva
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-white/70 hover:text-white text-xs"
                      onClick={() => setEditingName(false)}
                    >
                      ✕
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white text-lg truncate">{family?.name}</p>
                    {isAdmin && (
                      <button onClick={startEditName} className="text-white/60 hover:text-white">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
                <p className="text-white/70 text-xs">{members.length} {members.length === 1 ? 'membro' : 'membri'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      <div className="px-5">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
          Membri ({members.length})
        </h2>
        <div className="space-y-1.5">
          {members.map((member: any) => {
            const isCurrentUser = member.userId === currentUserId;
            const isMemberAdmin = member.role === 'admin';
            const initials = member.user?.fullName
              ? member.user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
              : member.user?.email?.[0]?.toUpperCase() || '?';

            return (
              <Card key={member.id} className="border-0 shadow-sm">
                <CardContent className="p-3.5">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold',
                      isMemberAdmin ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'
                    )}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-sm truncate">
                          {member.user?.fullName || member.user?.email}
                        </p>
                        {isCurrentUser && (
                          <span className="text-[10px] text-muted-foreground">(tu)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-xs text-muted-foreground truncate">{member.user?.email}</p>
                        {isMemberAdmin && (
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5">
                            <Crown className="h-2 w-2 mr-0.5" />
                            Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                    {isAdmin && !isCurrentUser && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm(`Rimuovere ${member.user?.fullName || member.user?.email} dalla famiglia?`)) {
                            removeMutation.mutate(member.userId);
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Invite Section - Admin only */}
      {isAdmin && (
        <div className="px-5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
            Invita un membro
          </h2>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <UserPlus className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Inserisci l'email del nuovo membro
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@esempio.com"
                  className="text-sm h-10"
                  onKeyDown={(e) => e.key === 'Enter' && inviteEmail && inviteMutation.mutate()}
                />
                <Button
                  className="h-10 px-4 rounded-xl"
                  onClick={() => inviteMutation.mutate()}
                  disabled={inviteMutation.isPending || !inviteEmail}
                >
                  {inviteMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Verrà generato un link di invito da condividere
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending Invites */}
      {isAdmin && pendingInvites.length > 0 && (
        <div className="px-5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
            Inviti in attesa ({pendingInvites.length})
          </h2>
          <div className="space-y-1.5">
            {pendingInvites.map((invite: any) => {
              const isExpired = new Date(invite.expiresAt) < new Date();
              return (
                <Card key={invite.id} className="border-0 shadow-sm">
                  <CardContent className="p-3.5">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        isExpired ? 'bg-red-100' : 'bg-amber-100'
                      )}>
                        {isExpired ? (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{invite.email}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {isExpired ? 'Scaduto' : `Scade il ${new Date(invite.expiresAt).toLocaleDateString('it-IT')}`}
                        </p>
                      </div>
                      {!isExpired && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyInviteLink(invite.token)}
                        >
                          {copied === invite.token ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Info for non-admins */}
      {!isAdmin && (
        <div className="px-5">
          <Card className="border-0 shadow-sm bg-blue-50 dark:bg-blue-950/20">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Sei un membro</p>
                  <p className="text-xs text-blue-700/70 dark:text-blue-300/70 mt-0.5">
                    Solo gli admin possono invitare membri, modificare il nome della famiglia o rimuovere membri.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
