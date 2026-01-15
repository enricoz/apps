import { Route, Switch, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { Toaster } from '@/components/ui/toaster';
import { BottomNav } from '@/components/layout/BottomNav';

// Pages
import { LandingPage } from '@/pages/Landing';
import { HomePage } from '@/pages/Home';
import { AnalyticsPage } from '@/pages/Analytics';
import { RevolutPage } from '@/pages/Revolut';
import { ProfilePage } from '@/pages/Profile';
import { OnboardingPage } from '@/pages/Onboarding';
import { AmaltiaPage } from '@/pages/amaltia';

interface AuthData {
  user: any;
  familyMember: any;
  family: any;
}

function App() {
  const [location] = useLocation();

  // Amaltia product page - accessible without auth
  if (location === '/amaltia' || location.startsWith('/amaltia/')) {
    return <AmaltiaPage />;
  }

  const { data: authData, isLoading } = useQuery<AuthData>({
    queryKey: ['/api/auth/me'],
    queryFn: () => apiRequest('/api/auth/me'),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="app-container flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!authData?.user) {
    return (
      <div className="app-container">
        <LandingPage />
        <Toaster />
      </div>
    );
  }

  // Authenticated but no family - show onboarding
  if (!authData.familyMember) {
    return (
      <div className="app-container">
        <OnboardingPage />
        <Toaster />
      </div>
    );
  }

  // Authenticated and has family - show main app
  return (
    <div className="app-container">
      <div className="main-content">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/analytics" component={AnalyticsPage} />
          <Route path="/revolut" component={RevolutPage} />
          <Route path="/profile" component={ProfilePage} />
          <Route>
            <div className="p-4 text-center">
              <h1 className="text-2xl font-bold">404 - Pagina non trovata</h1>
            </div>
          </Route>
        </Switch>
      </div>
      <BottomNav />
      <Toaster />
    </div>
  );
}

export default App;
