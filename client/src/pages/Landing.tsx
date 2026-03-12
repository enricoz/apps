import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { apiRequest } from '@/lib/api';
import { FaGoogle, FaApple, FaMicrosoft, FaFacebook } from 'react-icons/fa';
import { ArrowRight, Wallet, Users, PieChart, Shield } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(1, 'Password richiesta'),
});

const registerSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'La password deve essere di almeno 6 caratteri'),
  fullName: z.string().optional(),
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

const socialProviders = [
  { id: 'google', label: 'Google', icon: FaGoogle, color: 'hover:bg-red-50 dark:hover:bg-red-950/20' },
  { id: 'apple', label: 'Apple', icon: FaApple, color: 'hover:bg-gray-100 dark:hover:bg-gray-800' },
  { id: 'microsoft', label: 'Microsoft', icon: FaMicrosoft, color: 'hover:bg-blue-50 dark:hover:bg-blue-950/20' },
  { id: 'facebook', label: 'Facebook', icon: FaFacebook, color: 'hover:bg-blue-50 dark:hover:bg-blue-950/20' },
];

const features = [
  { icon: Wallet, label: 'Budget condiviso' },
  { icon: Users, label: 'Per tutta la famiglia' },
  { icon: PieChart, label: 'Analisi intelligenti' },
  { icon: Shield, label: 'Sicuro e privato' },
];

export function LandingPage() {
  const [isRegister, setIsRegister] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginData) =>
      apiRequest('/api/auth/login', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Errore', description: error.message });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) =>
      apiRequest('/api/auth/register', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Errore', description: error.message });
    },
  });

  const handleSocialLogin = (provider: string) => {
    window.location.href = `/api/auth/${provider}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8 animate-fade-in">
          {/* Logo & Brand */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
              <span className="text-2xl font-bold text-primary-foreground">F</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Famiglia</h1>
            <p className="text-muted-foreground">
              Il budget familiare, semplice e insieme
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium"
              >
                <f.icon className="h-3 w-3" />
                {f.label}
              </div>
            ))}
          </div>

          {/* Social Login */}
          <div className="space-y-2">
            {socialProviders.map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleSocialLogin(provider.id)}
                className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border bg-card text-sm font-medium transition-all active:scale-[0.98] ${provider.color}`}
              >
                <provider.icon className="h-4 w-4" />
                Continua con {provider.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-xs text-muted-foreground uppercase tracking-wider">
                oppure con email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          {!isRegister ? (
            <form onSubmit={loginForm.handleSubmit((d) => loginMutation.mutate(d))} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="tuo@email.com"
                  className="h-12 rounded-xl"
                  {...loginForm.register('email')}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="La tua password"
                  className="h-12 rounded-xl"
                  {...loginForm.register('password')}
                />
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-semibold"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? 'Accesso...' : 'Accedi'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit((d) => registerMutation.mutate(d))} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-fullName" className="text-sm font-medium">Nome</Label>
                <Input
                  id="register-fullName"
                  type="text"
                  placeholder="Mario Rossi"
                  className="h-12 rounded-xl"
                  {...registerForm.register('fullName')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-sm font-medium">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="tuo@email.com"
                  className="h-12 rounded-xl"
                  {...registerForm.register('email')}
                />
                {registerForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{registerForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-sm font-medium">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="Minimo 6 caratteri"
                  className="h-12 rounded-xl"
                  {...registerForm.register('password')}
                />
                {registerForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{registerForm.formState.errors.password.message}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-semibold"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? 'Registrazione...' : 'Crea account'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>
          )}

          {/* Toggle */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isRegister ? (
                <>Hai gia un account? <span className="text-primary font-medium">Accedi</span></>
              ) : (
                <>Non hai un account? <span className="text-primary font-medium">Registrati</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
