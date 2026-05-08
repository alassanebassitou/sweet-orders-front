import { useState } from 'react';
import { Plus, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { financeService } from '@/lib/services';
import { CATEGORIES_DEPENSES } from '@/lib/constants';
import { formatFCFA } from '@/lib/format';
import { LoadingState, ErrorState } from '@/components/common/StateViews';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';

export default function FinancesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [linkFilter, setLinkFilter] = useState<'ALL' | 'LIEES' | 'GENERALES'>('ALL');
  const [form, setForm] = useState({ category: 'INGREDIENTS', amount: 0, description: '', expenseDate: new Date().toISOString().split('T')[0] });

  const dashQ = useQuery({ queryKey: ['finance-dashboard'], queryFn: financeService.dashboard });
  const depQ = useQuery({
    queryKey: ['depenses', filter],
    queryFn: () => financeService.depenses(filter !== 'ALL' ? { category: filter } : {}),
  });

  const createMut = useMutation({
    mutationFn: (payload: any) => financeService.creerDepense(payload),
    onSuccess: () => { toast.success('Dépense ajoutée'); qc.invalidateQueries({ queryKey: ['depenses'] }); qc.invalidateQueries({ queryKey: ['finance-dashboard'] }); setOpen(false); },
    onError: () => toast.error('Erreur'),
  });
  const removeMut = useMutation({
    mutationFn: (id: any) => financeService.supprimerDepense(id),
    onSuccess: () => { toast.success('Dépense supprimée'); qc.invalidateQueries({ queryKey: ['depenses'] }); },
    onError: () => toast.error('Erreur'),
  });

  const dashboard = dashQ.data;
  const allDepenses = depQ.data || [];
  const depenses = allDepenses.filter((d: any) => {
    if (linkFilter === 'LIEES') return !!d.commandeId;
    if (linkFilter === 'GENERALES') return !d.commandeId;
    return true;
  });
  const months = (dashboard?.monthlyRevenue || []).map((m: any) => ({ mois: m.mois, revenu: m.revenu || 0 }));
  const depByCat = Object.entries(dashboard?.expensesByCategory || {}).map(([category, amount]: any) => ({ category, amount }));

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-display text-2xl font-bold">Finances</h1>
          <p className="text-muted-foreground text-sm">Vue d'ensemble financière</p>
        </div>
        <Button variant="outline" onClick={() => financeService.exportCSV()} className="gap-2"><Download className="w-4 h-4" /> Exporter CSV</Button>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="depenses">Dépenses</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 pt-4">
          {dashQ.isLoading ? <LoadingState /> :
           dashQ.isError ? <ErrorState onRetry={dashQ.refetch} /> : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Revenu du mois', value: formatFCFA(dashboard?.monthlyRevenue || 0), color: 'text-primary' },
                  { label: "Revenu de l'année", value: formatFCFA(dashboard?.yearlyRevenue || 0), color: 'text-primary' },
                  { label: 'Dépenses du mois', value: formatFCFA(dashboard?.monthlyExpenses || 0), color: 'text-destructive' },
                  { label: 'Bénéfice net', value: formatFCFA(dashboard?.netProfitMonthly || 0), color: (dashboard?.netProfitMonthly || 0) >= 0 ? 'text-success' : 'text-destructive' },
                ].map((k) => (
                  <Card key={k.label}><CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">{k.label}</p>
                    <p className={`font-display text-xl font-bold mt-1 ${k.color}`}>{k.value}</p>
                  </CardContent></Card>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <Card><CardHeader className="pb-2"><CardTitle className="text-base">Revenus par mois</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-52">
                      {months.length === 0 ? <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Aucune donnée</div> : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={months}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} />
                            <Tooltip formatter={(v: number) => formatFCFA(v)} />
                            <Line type="monotone" dataKey="revenu" stroke="hsl(18, 45%, 57%)" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-base">Dépenses par catégorie</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-52">
                      {depByCat.length === 0 ? <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Aucune donnée</div> : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={depByCat}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} />
                            <Tooltip formatter={(v: number) => formatFCFA(v)} />
                            <Bar dataKey="amount" fill="hsl(18, 45%, 57%)" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card><CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Commandes payées</p>
                  <p className="font-display text-2xl font-bold text-success mt-1">{dashboard?.paidOrders || 0}</p>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Commandes impayées</p>
                  <p className="font-display text-2xl font-bold text-warning mt-1">{dashboard?.unpaidOrders || 0}</p>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Soldes restants</p>
                  <p className="font-display text-xl font-bold text-destructive mt-1">{formatFCFA(dashboard?.totalRemainingBalances || 0)}</p>
                </CardContent></Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="depenses" className="space-y-3 pt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes catégories</SelectItem>
                {CATEGORIES_DEPENSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Nouvelle dépense</Button>
          </div>
          <Card><CardContent className="p-0">
            {depQ.isLoading ? <LoadingState /> :
             depenses.length === 0 ? <p className="text-center text-sm text-muted-foreground py-8">Aucune dépense</p> :
             depenses.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between p-3 border-b border-border last:border-0">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{d.category}</Badge>
                    <span className="text-sm font-medium">{d.description}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{d.expenseDate || d.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{formatFCFA(d.amount)}</span>
                  <Button size="icon" variant="ghost" onClick={() => removeMut.mutate(d.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle dépense</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Catégorie</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES_DEPENSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Montant (FCFA)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseInt(e.target.value || '0', 10) })} className="mt-1" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
            <div><Label>Date</Label><Input type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={() => createMut.mutate(form)} disabled={createMut.isPending}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
