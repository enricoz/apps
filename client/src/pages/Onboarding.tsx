import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { apiRequest } from '@/lib/api';

const createFamilySchema = z.object({
  name: z.string().min(1, 'Il nome della famiglia è richiesto'),
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
      apiRequest('/api/families', {
        method: 'POST',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: 'Famiglia creata!',
        description: 'Benvenuto in Famiglia',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: error.message,
      });
    },
  });

  const onSubmit = (data: CreateFamilyData) => {
    createFamilyMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Benvenuto in Famiglia</h1>
          <p className="text-muted-foreground">
            Per iniziare, crea una nuova famiglia
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Crea la tua famiglia</CardTitle>
            <CardDescription>
              Scegli un nome per la tua famiglia. Potrai invitare altri membri successivamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome famiglia</Label>
                <Input
                  id="name"
                  placeholder="es. Famiglia Rossi"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createFamilyMutation.isPending}
              >
                {createFamilyMutation.isPending ? 'Creazione...' : 'Crea famiglia'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Hai ricevuto un invito? Usa il link nell'email per unirti.
          </p>
        </div>
      </div>
    </div>
  );
}
