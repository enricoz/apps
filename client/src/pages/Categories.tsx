import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Check, X, Tag, Users, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppHeader } from '@/components/layout/AppHeader';
import { useToast } from '@/components/ui/use-toast';
import { apiRequest } from '@/lib/api';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  '#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#E91E63',
  '#00BCD4', '#FF5722', '#607D8B', '#795548', '#3F51B5',
  '#8BC34A', '#FFC107',
];

const PRESET_ICONS = [
  '🛒', '🍔', '🏠', '🚗', '💡', '🎬', '👕', '💊',
  '📚', '✈️', '🎁', '💇', '🐕', '🏋️', '📱', '🎵',
  '🍕', '☕', '🏥', '⛽', '🚌', '🎮', '👶', '📦',
];

interface Category {
  id: string;
  familyId: string;
  name: string;
  color: string;
  icon: string;
  isPrivate: boolean;
  userId: string | null;
  categoryGroup: string | null;
  createdAt: string;
}

const GROUP_LABELS: Record<string, { label: string; emoji: string; order: number }> = {
  sopravvivenza: { label: 'Sopravvivenza', emoji: '🔴', order: 1 },
  necessarie: { label: 'Necessarie', emoji: '🟡', order: 2 },
  necessarie_personali: { label: 'Necessarie Personali', emoji: '🔵', order: 3 },
  voluttarie: { label: 'Voluttarie', emoji: '🟣', order: 4 },
  investimenti: { label: 'Investimenti', emoji: '🟢', order: 5 },
};

function groupCategories(cats: Category[]): { group: string; label: string; emoji: string; items: Category[] }[] {
  const groups = new Map<string, Category[]>();
  for (const cat of cats) {
    const key = cat.categoryGroup || 'altro';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(cat);
  }
  return [...groups.entries()]
    .map(([key, items]) => ({
      group: key,
      label: GROUP_LABELS[key]?.label || 'Altro',
      emoji: GROUP_LABELS[key]?.emoji || '⚪',
      items,
    }))
    .sort((a, b) => (GROUP_LABELS[a.group]?.order || 99) - (GROUP_LABELS[b.group]?.order || 99));
}

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon] = useState(PRESET_ICONS[0]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [showIcons, setShowIcons] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    queryFn: () => apiRequest('/api/categories'),
  });

  const familyCategories = categories.filter(c => !c.isPrivate);
  const personalCategories = categories.filter(c => c.isPrivate);

  const invalidate = () => {
    queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.startsWith('/api/categories') });
    queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.startsWith('/api/budgets') });
  };

  const createMutation = useMutation({
    mutationFn: (data: { name: string; color: string; icon: string; isPrivate: boolean }) =>
      apiRequest('/api/categories', { method: 'POST', body: data }),
    onSuccess: () => {
      invalidate();
      resetForm();
      toast({ title: 'Categoria creata' });
    },
    onError: (err: Error) => toast({ variant: 'destructive', title: 'Errore', description: err.message }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; color?: string; icon?: string } }) =>
      apiRequest(`/api/categories/${id}`, { method: 'PATCH', body: data }),
    onSuccess: () => {
      invalidate();
      setEditing(null);
      toast({ title: 'Categoria aggiornata' });
    },
    onError: (err: Error) => toast({ variant: 'destructive', title: 'Errore', description: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidate();
      setConfirmDelete(null);
      toast({ title: 'Categoria eliminata' });
    },
    onError: (err: Error) => toast({ variant: 'destructive', title: 'Errore', description: err.message }),
  });

  const resetForm = () => {
    setCreating(false);
    setEditing(null);
    setName('');
    setColor(PRESET_COLORS[0]);
    setIcon(PRESET_ICONS[0]);
    setIsPrivate(false);
    setShowIcons(false);
  };

  const startEdit = (cat: Category) => {
    setEditing(cat.id);
    setCreating(false);
    setName(cat.name);
    setColor(cat.color);
    setIcon(cat.icon);
    setShowIcons(false);
  };

  const startCreate = (personal: boolean) => {
    resetForm();
    setIsPrivate(personal);
    setCreating(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editing) {
      updateMutation.mutate({ id: editing, data: { name: name.trim(), color, icon } });
    } else {
      createMutation.mutate({ name: name.trim(), color, icon, isPrivate });
    }
  };

  const isFormActive = creating || editing !== null;

  const renderCategoryCard = (cat: Category) => {
    const isEditing = editing === cat.id;
    const isDeleting = confirmDelete === cat.id;

    if (isEditing) {
      return (
        <Card key={cat.id} className="border-2 border-primary shadow-md">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowIcons(!showIcons)}
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-secondary hover:bg-secondary/80 transition-colors"
              >
                {icon}
              </button>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 h-11 rounded-xl"
                placeholder="Nome categoria"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>

            {showIcons && (
              <div className="grid grid-cols-8 gap-2 p-2 bg-secondary/50 rounded-xl">
                {PRESET_ICONS.map((ic) => (
                  <button
                    key={ic}
                    onClick={() => { setIcon(ic); setShowIcons(false); }}
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center text-lg hover:bg-background transition-colors',
                      icon === ic && 'bg-background shadow-sm ring-2 ring-primary'
                    )}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-7 h-7 rounded-full transition-all',
                    color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <Button size="sm" className="flex-1 rounded-xl h-10" onClick={handleSave}
                disabled={updateMutation.isPending || !name.trim()}>
                <Check className="h-4 w-4 mr-1" />
                Salva
              </Button>
              <Button size="sm" variant="ghost" className="rounded-xl h-10" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card key={cat.id} className="border-0 shadow-sm">
        <CardContent className="p-3.5">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: cat.color + '20' }}
            >
              {cat.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{cat.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
              </div>
            </div>

            {isDeleting ? (
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="destructive" className="h-8 rounded-lg text-xs px-3"
                  onClick={() => deleteMutation.mutate(cat.id)} disabled={deleteMutation.isPending}>
                  Elimina
                </Button>
                <Button size="sm" variant="ghost" className="h-8 rounded-lg" onClick={() => setConfirmDelete(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => startEdit(cat)}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                  disabled={isFormActive}
                >
                  <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button
                  onClick={() => setConfirmDelete(cat.id)}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  disabled={isFormActive}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCreateForm = () => (
    <Card className="border-2 border-primary shadow-md">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          {isPrivate ? (
            <User className="h-4 w-4 text-blue-500" />
          ) : (
            <Users className="h-4 w-4 text-violet-500" />
          )}
          <p className="text-sm font-semibold">
            Nuova categoria {isPrivate ? 'personale' : 'famiglia'}
          </p>
        </div>

        {/* Type toggle */}
        <div className="flex gap-1 p-1 bg-secondary rounded-xl">
          <button
            onClick={() => setIsPrivate(false)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all',
              !isPrivate ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Users className="h-3.5 w-3.5" />
            Famiglia
          </button>
          <button
            onClick={() => setIsPrivate(true)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all',
              isPrivate ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <User className="h-3.5 w-3.5" />
            Personale
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground">
          {isPrivate
            ? 'Solo tu vedrai questa categoria e le relative spese.'
            : 'Tutti i membri della famiglia vedranno questa categoria.'}
        </p>

        {/* Icon + Name */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowIcons(!showIcons)}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-secondary hover:bg-secondary/80 transition-colors"
          >
            {icon}
          </button>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 h-11 rounded-xl"
            placeholder="Nome categoria"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
        </div>

        {/* Icon picker */}
        {showIcons && (
          <div className="grid grid-cols-8 gap-2 p-2 bg-secondary/50 rounded-xl">
            {PRESET_ICONS.map((ic) => (
              <button
                key={ic}
                onClick={() => { setIcon(ic); setShowIcons(false); }}
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center text-lg hover:bg-background transition-colors',
                  icon === ic && 'bg-background shadow-sm ring-2 ring-primary'
                )}
              >
                {ic}
              </button>
            ))}
          </div>
        )}

        {/* Color picker */}
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                'w-7 h-7 rounded-full transition-all',
                color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button size="sm" className="flex-1 rounded-xl h-10" onClick={handleSave}
            disabled={createMutation.isPending || !name.trim()}>
            <Check className="h-4 w-4 mr-1" />
            Crea
          </Button>
          <Button size="sm" variant="ghost" className="rounded-xl h-10" onClick={resetForm}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-5 pb-4">
      <AppHeader title="Categorie" showBack />

      {/* Family Categories */}
      <div className="px-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
            <Users className="h-3.5 w-3.5 text-violet-600" />
          </div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Famiglia
          </h2>
          <span className="text-xs text-muted-foreground ml-auto">{familyCategories.length}</span>
        </div>
        {groupCategories(familyCategories).map(({ group, label, emoji, items }) => (
          <div key={group} className="mb-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
              {emoji} {label}
            </p>
            <div className="space-y-2">
              {items.map(renderCategoryCard)}
            </div>
          </div>
        ))}
        {familyCategories.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-6 text-center">
              <p className="text-muted-foreground text-xs">Nessuna categoria famiglia.</p>
            </CardContent>
          </Card>
        )}
        {!isFormActive && (
          <button
            onClick={() => startCreate(false)}
            className="w-full mt-2 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50/50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Aggiungi categoria famiglia
          </button>
        )}
      </div>

      {/* Personal Categories */}
      <div className="px-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Personali
          </h2>
          <span className="text-xs text-muted-foreground ml-auto">{personalCategories.length}</span>
        </div>
        {groupCategories(personalCategories).map(({ group, label, emoji, items }) => (
          <div key={group} className="mb-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
              {emoji} {label}
            </p>
            <div className="space-y-2">
              {items.map(renderCategoryCard)}
            </div>
          </div>
        ))}
        {personalCategories.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-6 text-center">
              <p className="text-muted-foreground text-xs">Nessuna categoria personale.</p>
            </CardContent>
          </Card>
        )}
        {!isFormActive && (
          <button
            onClick={() => startCreate(true)}
            className="w-full mt-2 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Aggiungi categoria personale
          </button>
        )}
      </div>

      {/* Create Form - shown inline */}
      {creating && (
        <div className="px-5">
          {renderCreateForm()}
        </div>
      )}
    </div>
  );
}
