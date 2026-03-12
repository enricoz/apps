import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { apiRequest } from '@/lib/api';
import { ArrowRight, Users, Heart } from 'lucide-react';

const createFamilySchema = z.object({
  name: z.string().min(1, 'Il nome della famiglia e richiesto'),
});

type CreateFamilyData = z.infer<typeof createFamilySchema>;

export function OnboardingPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateFamilyData>({
    resolver: zodResolver(createFamilySchema),
  });

  const createFamilyMutation = useMutation({
    mutationFn: (data: CreateFamilyData) =>
      apiRequest('/api/families', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({ title: 'Famiglia creata!', description: 'Inizia a gestire il budget' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Errore', description: error.message });
    },
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto">
            <Heart className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Crea la tua famiglia</h1>
            <p className="text-muted-foreground text-sm mt-2">
              Scegli un nome e inizia a gestire il budget insieme
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit((d) => createFamilyMutation.mutate(d))} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Nome famiglia</Label>
            <Input
              id="name"
              placeholder="es. Famiglia Rossi"
              className="h-12 rounded-xl"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-xl text-base font-semibold"
            disabled={createFamilyMutation.isPending}
          >
            {createFamilyMutation.isPending ? 'Creazione...' : 'Inizia'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </form>

        {/* Info */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
          <Users className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Potrai invitare altri membri della famiglia successivamente dalle impostazioni.
          </p>
        </div>
      </div>
    </div>
  );
}
