import { useEffect } from 'react';
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
import { IncomePage } from '@/pages/Income';
import { BudgetPage } from '@/pages/Budget';
import { SubscriptionPage } from '@/pages/Subscription';
import { FamilyPage } from '@/pages/Family';
import { OnboardingPage } from '@/pages/Onboarding';
import { CategoriesPage } from '@/pages/Categories';
import { AcceptInvitePage } from '@/pages/AcceptInvite';

interface AuthData {
  user: any;
  familyMember: any;
  family: any;
}

function App() {
  const [, navigate] = useLocation();
  const { data: authData, isLoading } = useQuery<AuthData>({
    queryKey: ['/api/auth/me'],
    queryFn: () => apiRequest('/api/auth/me'),
    retry: false,
  });

  // After OAuth login, redirect to pending invite if stored
  useEffect(() => {
    if (authData?.user) {
      const pendingInvite = localStorage.getItem('pendingInvite');
      if (pendingInvite) {
        localStorage.removeItem('pendingInvite');
        navigate(pendingInvite);
      }
    }
  }, [authData?.user]);

  if (isLoading) {
    return (
      <div className="app-container flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <span className="text-xl font-bold text-primary-foreground">F</span>
          </div>
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mt-4" />
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!authData?.user) {
    // Check if visiting invite link — show invite page instead of landing
    if (window.location.pathname.startsWith('/invite/')) {
      return (
        <div className="app-container">
          <Switch>
            <Route path="/invite/:token" component={AcceptInvitePage} />
          </Switch>
          <Toaster />
        </div>
      );
    }
    return (
      <div className="app-container">
        <LandingPage />
        <Toaster />
      </div>
    );
  }

  // Authenticated but no family - check for invite link first
  if (!authData.familyMember) {
    if (window.location.pathname.startsWith('/invite/')) {
      return (
        <div className="app-container">
          <Switch>
            <Route path="/invite/:token" component={AcceptInvitePage} />
          </Switch>
          <Toaster />
        </div>
      );
    }
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
          <Route path="/income" component={IncomePage} />
          <Route path="/budget" component={BudgetPage} />
          <Route path="/analytics" component={AnalyticsPage} />
          <Route path="/revolut" component={RevolutPage} />
          <Route path="/subscription" component={SubscriptionPage} />
          <Route path="/family" component={FamilyPage} />
          <Route path="/profile" component={ProfilePage} />
          <Route path="/categories" component={CategoriesPage} />
          <Route path="/invite/:token" component={AcceptInvitePage} />
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
