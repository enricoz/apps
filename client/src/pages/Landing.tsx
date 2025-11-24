import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function LandingPage() {
  const handleLogin = () => {
    window.location.href = '/api/auth/login';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/20">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Famiglia</h1>
          <p className="text-lg text-muted-foreground">
            Gestisci il budget familiare insieme
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Benvenuto</CardTitle>
            <CardDescription>
              Famiglia ti aiuta a tracciare le spese, gestire budget mensili e collaborare con i membri della tua famiglia.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Funzionalità principali:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Categorie condivise e private</li>
                <li>Budget mensili personalizzati</li>
                <li>Analytics dettagliate</li>
                <li>Integrazione Revolut</li>
                <li>Notifiche automatiche</li>
              </ul>
            </div>
            <Button onClick={handleLogin} className="w-full" size="lg">
              Accedi con Replit
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Crea un account o accedi per iniziare
        </p>
      </div>
    </div>
  );
}
