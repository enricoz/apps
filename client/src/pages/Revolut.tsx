import { useQuery } from '@tanstack/react-query';
import { CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/api';

export function RevolutPage() {
  const { data: status } = useQuery({
    queryKey: ['/api/revolut/status'],
    queryFn: () => apiRequest('/api/revolut/status'),
  });

  const handleConnect = () => {
    window.location.href = '/api/revolut/connect';
  };

  if (!status?.connected) {
    return (
      <div className="space-y-6 p-4">
        <div>
          <h1 className="text-2xl font-bold">Revolut</h1>
          <p className="text-sm text-muted-foreground">
            Integrazione con Revolut Business
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Connetti Revolut</CardTitle>
                <CardDescription>
                  Sincronizza automaticamente le tue transazioni
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Requisiti:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Account Revolut Business attivo</li>
                <li>API OAuth configurata</li>
                <li>Permessi di lettura transazioni</li>
              </ul>
            </div>

            <Button onClick={handleConnect} className="w-full" disabled>
              Connetti Revolut (Prossimamente)
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              L'integrazione Revolut sarà disponibile a breve
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Revolut</h1>
        <p className="text-sm text-muted-foreground">
          Account connesso
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transazioni</CardTitle>
          <CardDescription>Ultimi movimenti</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Nessuna transazione disponibile
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
