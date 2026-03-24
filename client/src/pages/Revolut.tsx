import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard, Link2, RefreshCw, Shield, Zap, ArrowDownRight, ArrowUpRight,
  Unlink, Loader2, Upload, FileSpreadsheet, Check, X, ChevronDown,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { AppHeader } from '@/components/layout/AppHeader';
import { apiRequest } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

interface RevolutTransaction {
  id: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  type: 'debit' | 'credit';
  merchant?: { name: string; category: string };
  status: string;
}

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'expense' | 'income';
  selected?: boolean;
}

interface ImportPreview {
  filename: string;
  totalRows: number;
  parsedRows: number;
  transactions: ParsedTransaction[];
  categories: { id: string; name: string; icon: string; color: string }[];
}

export function RevolutPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import state
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Revolut queries
  const { data: status } = useQuery({
    queryKey: ['/api/revolut/status'],
    queryFn: () => apiRequest('/api/revolut/status'),
  });

  const { data: transactions } = useQuery<RevolutTransaction[]>({
    queryKey: ['/api/revolut/transactions'],
    queryFn: () => apiRequest('/api/revolut/transactions'),
    enabled: !!status?.connected,
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/revolut/spending-stats'],
    queryFn: () => apiRequest('/api/revolut/spending-stats'),
    enabled: !!status?.connected,
  });

  const connectMutation = useMutation({
    mutationFn: () => apiRequest('/api/revolut/connect'),
    onSuccess: (data: { url: string }) => {
      window.location.href = data.url;
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Errore', description: error.message });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest('/api/revolut/disconnect', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/revolut'] });
      toast({ title: 'Disconnesso da Revolut' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Errore', description: error.message });
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => apiRequest('/api/revolut/sync', { method: 'POST' }),
    onSuccess: (data: { imported: number; total: number }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/revolut'] });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
      toast({ title: `Importate ${data.imported} transazioni` });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Errore sync', description: error.message });
    },
  });

  const isConnected = status?.connected;
  const balance = status?.balance;

  // File upload handler
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import/preview', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore durante il caricamento');
      }

      const preview: ImportPreview = await response.json();
      setImportPreview(preview);
      // Select all transactions by default
      setSelectedTransactions(new Set(preview.transactions.map((_, i) => i)));
      // Auto-select first category
      if (preview.categories.length > 0) {
        setSelectedCategory(preview.categories[0].id);
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Errore', description: error.message });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // Confirm import
  async function handleConfirmImport() {
    if (!importPreview || !selectedCategory) return;

    const selected = importPreview.transactions.filter((_, i) => selectedTransactions.has(i));
    if (selected.length === 0) {
      toast({ variant: 'destructive', title: 'Errore', description: 'Seleziona almeno una transazione' });
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch('/api/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: selected, categoryId: selectedCategory }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore durante l\'importazione');
      }

      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/incomes'] });

      toast({
        title: `Importazione completata!`,
        description: `${result.expenses} spese e ${result.incomes} entrate importate`,
      });
      setImportPreview(null);
      setSelectedTransactions(new Set());
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Errore', description: error.message });
    } finally {
      setIsImporting(false);
    }
  }

  function toggleTransaction(index: number) {
    setSelectedTransactions((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function toggleAll() {
    if (!importPreview) return;
    if (selectedTransactions.size === importPreview.transactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(importPreview.transactions.map((_, i) => i)));
    }
  }

  const selectedCategoryData = importPreview?.categories.find((c) => c.id === selectedCategory);

  return (
    <div className="space-y-6">
      <AppHeader title="Banca" subtitle="Importa e gestisci transazioni" />

      <div className="px-5 space-y-4">
        {/* Manual Import Card */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500" />
          <CardContent className="p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Importa estratto conto</p>
                <p className="text-xs text-muted-foreground mt-0.5">CSV, Excel (.xlsx)</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-3">
              Carica il file scaricato dalla tua banca (Revolut, Intesa, UniCredit, ecc.) per importare le transazioni.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />

            <Button
              className="w-full rounded-xl h-11"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {isUploading ? 'Analizzando...' : 'Carica file'}
            </Button>
          </CardContent>
        </Card>

        {/* Import Preview */}
        {importPreview && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Anteprima importazione
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => { setImportPreview(null); setSelectedTransactions(new Set()); }}
              >
                <X className="h-3 w-3 mr-1" />
                Annulla
              </Button>
            </div>

            {/* File info */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">File:</span>
                  <span className="font-medium truncate max-w-[200px]">{importPreview.filename}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Transazioni trovate:</span>
                  <span className="font-medium">{importPreview.parsedRows}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Selezionate:</span>
                  <span className="font-medium">{selectedTransactions.size}</span>
                </div>
              </CardContent>
            </Card>

            {/* Category picker */}
            <div className="relative">
              <button
                onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-card shadow-sm text-sm"
              >
                <span className="text-muted-foreground">Categoria:</span>
                <span className="flex items-center gap-2 font-medium">
                  {selectedCategoryData ? (
                    <>
                      <span>{selectedCategoryData.icon}</span>
                      <span>{selectedCategoryData.name}</span>
                    </>
                  ) : (
                    'Seleziona...'
                  )}
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
              </button>

              {showCategoryPicker && (
                <Card className="absolute z-10 mt-1 w-full border-0 shadow-lg">
                  <CardContent className="p-2 max-h-48 overflow-y-auto">
                    {importPreview.categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => { setSelectedCategory(cat.id); setShowCategoryPicker(false); }}
                        className={cn(
                          'w-full flex items-center gap-2 p-2.5 rounded-lg text-sm text-left',
                          selectedCategory === cat.id ? 'bg-primary/10 font-medium' : 'hover:bg-muted'
                        )}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                        {selectedCategory === cat.id && <Check className="h-3.5 w-3.5 ml-auto text-primary" />}
                      </button>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Select all toggle */}
            <button
              onClick={toggleAll}
              className="flex items-center gap-2 px-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <div className={cn(
                'w-4 h-4 rounded border flex items-center justify-center',
                selectedTransactions.size === importPreview.transactions.length
                  ? 'bg-primary border-primary'
                  : 'border-muted-foreground/30'
              )}>
                {selectedTransactions.size === importPreview.transactions.length && (
                  <Check className="h-3 w-3 text-primary-foreground" />
                )}
              </div>
              Seleziona/Deseleziona tutto
            </button>

            {/* Transaction list */}
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {importPreview.transactions.map((tx, i) => (
                <button
                  key={i}
                  onClick={() => toggleTransaction(i)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors',
                    selectedTransactions.has(i) ? 'bg-card shadow-sm' : 'bg-muted/30 opacity-50'
                  )}
                >
                  <div className={cn(
                    'w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center',
                    selectedTransactions.has(i) ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                  )}>
                    {selectedTransactions.has(i) && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    tx.type === 'expense' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'
                  )}>
                    {tx.type === 'expense' ? (
                      <ArrowDownRight className="h-3.5 w-3.5 text-red-600" />
                    ) : (
                      <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={cn(
                    'font-mono font-semibold text-sm flex-shrink-0',
                    tx.type === 'expense' ? 'text-red-600' : 'text-emerald-600'
                  )}>
                    {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                  </span>
                </button>
              ))}
            </div>

            {/* Confirm button */}
            <Button
              className="w-full rounded-xl h-12 text-base"
              onClick={handleConfirmImport}
              disabled={isImporting || selectedTransactions.size === 0 || !selectedCategory}
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {isImporting
                ? 'Importando...'
                : `Importa ${selectedTransactions.size} transazioni`
              }
            </Button>
          </div>
        )}

        {/* Revolut Connection (collapsed) */}
        {!importPreview && (
          <>
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-[#0075EB] via-[#00D4AA] to-[#0075EB]" />
              <CardContent className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#0075EB]/10 flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-[#0075EB]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Revolut</p>
                    <Badge variant={isConnected ? 'success' : 'secondary'} className="mt-0.5">
                      {isConnected ? 'Connesso' : 'Non connesso'}
                    </Badge>
                  </div>
                  {isConnected && balance && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Saldo</p>
                      <p className="font-mono font-bold text-lg">
                        {formatCurrency(balance.amount)}
                      </p>
                    </div>
                  )}
                </div>

                {isConnected ? (
                  <div className="space-y-3">
                    {status?.lastSync && (
                      <p className="text-xs text-muted-foreground">
                        Ultimo sync: {new Date(status.lastSync).toLocaleDateString('it-IT', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full flex-1"
                        onClick={() => syncMutation.mutate()}
                        disabled={syncMutation.isPending}
                      >
                        {syncMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        {syncMutation.isPending ? 'Sincronizzando...' : 'Sincronizza'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-destructive hover:text-destructive"
                        onClick={() => disconnectMutation.mutate()}
                        disabled={disconnectMutation.isPending}
                      >
                        <Unlink className="h-3.5 w-3.5 mr-1.5" />
                        Disconnetti
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Collega il tuo conto Revolut Business per importare automaticamente le transazioni.
                    </p>
                    {status?.configured ? (
                      <Button
                        className="w-full rounded-xl h-11"
                        variant="outline"
                        onClick={() => connectMutation.mutate()}
                        disabled={connectMutation.isPending}
                      >
                        {connectMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Link2 className="h-4 w-4 mr-2" />
                        )}
                        Connetti Revolut
                      </Button>
                    ) : (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                        <p className="text-xs text-amber-800 dark:text-amber-200">
                          L'integrazione automatica richiede un account Revolut Business con credenziali API.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Spending Stats */}
            {isConnected && stats && (
              <div className="grid grid-cols-3 gap-2">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-3 text-center">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Uscite 30gg</p>
                    <p className="font-mono font-semibold text-sm text-red-600">
                      -{formatCurrency(stats.totalSpent)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-3 text-center">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Entrate 30gg</p>
                    <p className="font-mono font-semibold text-sm text-emerald-600">
                      +{formatCurrency(stats.totalReceived)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-3 text-center">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Transazioni</p>
                    <p className="font-mono font-semibold text-sm">
                      {stats.transactionCount}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Recent Revolut Transactions */}
            {isConnected && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-3">
                  Transazioni recenti
                </h2>
                <div className="space-y-2">
                  {transactions && transactions.length > 0 ? (
                    transactions.slice(0, 20).map((tx) => (
                      <Card key={tx.id} className="border-0 shadow-sm">
                        <CardContent className="p-3.5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'w-9 h-9 rounded-xl flex items-center justify-center',
                              tx.type === 'debit'
                                ? 'bg-red-100 dark:bg-red-900/30'
                                : 'bg-emerald-100 dark:bg-emerald-900/30'
                            )}>
                              {tx.type === 'debit' ? (
                                <ArrowDownRight className="h-4 w-4 text-red-600" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm truncate max-w-[180px]">
                                {tx.merchant?.name || tx.description}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {new Date(tx.date).toLocaleDateString('it-IT', {
                                  day: 'numeric', month: 'short'
                                })}
                              </p>
                            </div>
                          </div>
                          <span className={cn(
                            'font-mono font-semibold text-sm',
                            tx.type === 'debit' ? 'text-red-600' : 'text-emerald-600'
                          )}>
                            {tx.type === 'debit' ? '-' : '+'}{formatCurrency(tx.amount)}
                          </span>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="border-0 shadow-sm">
                      <CardContent className="py-8 text-center">
                        <p className="text-muted-foreground text-sm">
                          Nessuna transazione trovata
                        </p>
                        <Button
                          className="mt-3 rounded-full"
                          size="sm"
                          onClick={() => syncMutation.mutate()}
                        >
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                          Sincronizza ora
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* Features */}
            {!isConnected && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  Come funziona
                </h2>
                {[
                  { icon: Upload, title: 'Carica il file', desc: 'Scarica il CSV o Excel dalla tua app bancaria e caricalo qui' },
                  { icon: Zap, title: 'Riconoscimento automatico', desc: 'Le colonne vengono rilevate automaticamente (data, importo, descrizione)' },
                  { icon: Shield, title: 'Rivedi e conferma', desc: 'Controlla le transazioni, scegli la categoria e importa' },
                ].map((feature) => (
                  <Card key={feature.title} className="border-0 shadow-sm">
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        <feature.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{feature.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{feature.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
