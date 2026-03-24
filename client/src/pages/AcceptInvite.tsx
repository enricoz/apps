import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X, Users, Clock, AlertTriangle, LogIn } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { apiRequest } from '@/lib/api';

export function AcceptInvitePage() {
  const [, params] = useRoute('/invite/:token');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const token = params?.token;

  const { data: authData } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => apiRequest('/api/auth/me'),
    retry: false,
  });

  const isAuthenticated = !!authData?.user;

  const acceptMutation = useMutation({
    mutationFn: () => apiRequest(`/api/invites/${token}/accept`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({ title: 'Benvenuto!', description: 'Ti sei unito alla famiglia con successo.' });
      setTimeout(() => navigate('/'), 1500);
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Errore', description: error.message });
    },
  });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-sm w-full border-0 shadow-lg">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
              <X className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold">Link non valido</h2>
            <p className="text-sm text-muted-foreground">
              Questo link di invito non è valido. Chiedi un nuovo invito.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not authenticated — prompt to login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-sm w-full border-0 shadow-lg">
          <CardContent className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Accedi per continuare</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Devi accedere o registrarti per accettare l'invito alla famiglia.
              </p>
            </div>
            <Button
              className="w-full h-12 rounded-xl text-base font-semibold"
              onClick={() => {
                localStorage.setItem('pendingInvite', window.location.pathname);
                window.location.href = '/api/auth/google';
              }}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Accedi con Google
            </Button>
            <p className="text-[10px] text-muted-foreground">
              Dopo l'accesso, tornerai automaticamente a questa pagina per accettare l'invito.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-sm w-full border-0 shadow-lg">
        <CardContent className="p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto">
            <Users className="h-8 w-8 text-violet-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Invito alla famiglia</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Sei stato invitato a unirti a una famiglia. Accetta per iniziare a gestire il budget insieme.
            </p>
          </div>

          {acceptMutation.isError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-sm">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{(acceptMutation.error as Error)?.message || 'Errore durante l\'accettazione'}</span>
            </div>
          )}

          {acceptMutation.isSuccess ? (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 text-emerald-700">
              <Check className="h-5 w-5" />
              <span className="font-medium">Benvenuto nella famiglia!</span>
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                className="w-full h-12 rounded-xl text-base font-semibold"
                onClick={() => acceptMutation.mutate()}
                disabled={acceptMutation.isPending}
              >
                {acceptMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Accetta invito
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                className="w-full h-10 rounded-xl text-sm"
                onClick={() => navigate('/')}
              >
                Annulla
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
