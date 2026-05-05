import { useState } from 'react';
import { Plus, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockDashboard, mockDepenses, mockCommandes } from '@/lib/mockData';
import { formatFCFA } from '@/lib/format';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';

const categories = ['INGREDIENTS', 'EMBALLAGES', 'TRANSPORT', 'AUTRE'];

export default function FinancesPage() {
  const [depenses, setDepenses] = useState(mockDepenses);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [form, setForm] = useState({ categorie: 'INGREDIENTS', montant: 0, description: '', date: new Date().toISOString().split('T')[0] });

  const totalDepenses = depenses.reduce((s, d) => s + d.montant, 0);
  const benefice = mockDashboard.revenuesMois - totalDepenses;
  const payees = mockCommandes.filter((c) => c.paye === c.montantTotal).length;
  const partielles = mockCommandes.filter((c) => c.paye > 0 && c.paye < c.montantTotal).length;
  const impayes = mockCommandes.filter((c) => c.paye === 0).reduce((s, c) => s + c.montantTotal, 0);

  const depByCat = categories.map((c) => ({ categorie: c, montant: depenses.filter((d) => d.categorie === c).reduce((s, d) => s + d.montant, 0) }));
  const months = ['Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar'].map((m, i) => ({ mois: m, revenu: 200000 + Math.round(Math.random() * 300000) }));

  const addDep = () => {
    setDepenses((prev) => [{ ...form, id: String(prev.length + 1) }, ...prev]);
    setOpen(false);
    toast.success('Dépense ajoutée');
  };

  const exportCsv = () => {
    const rows = [['Date', 'Catégorie', 'Description', 'Montant'], ...depenses.map((d) => [d.date, d.categorie, d.description, d.montant])];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'depenses.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = filter === 'ALL' ? depenses : depenses.filter((d) => d.categorie === filter);

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-display text-2xl font-bold">Finances</h1>
          <p className="text-muted-foreground text-sm">Vue d'ensemble financière</p>
        </div>
        <Button variant="outline" onClick={exportCsv} className="gap-2"><Download className="w-4 h-4" /> Exporter CSV</Button>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="depenses">Dépenses</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Revenu du mois', value: formatFCFA(mockDashboard.revenuesMois), color: 'text-primary' },
              { label: 'Revenu de l\'année', value: formatFCFA(mockDashboard.revenuesMois * 10), color: 'text-primary' },
              { label: 'Dépenses du mois', value: formatFCFA(totalDepenses), color: 'text-destructive' },
              { label: 'Bénéfice net', value: formatFCFA(benefice), color: benefice >= 0 ? 'text-success' : 'text-destructive' },
            ].map((k) => (
              <Card key={k.label}><CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className={`font-display text-xl font-bold mt-1 ${k.color}`}>{k.value}</p>
              </CardContent></Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-base">Revenus 12 mois</CardTitle></CardHeader>
              <CardContent>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={months}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} />
                      <Tooltip formatter={(v: number) => formatFCFA(v)} />
                      <Line type="monotone" dataKey="revenu" stroke="hsl(18, 45%, 57%)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-base">Dépenses par catégorie</CardTitle></CardHeader>
              <CardContent>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={depByCat}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="categorie" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} />
                      <Tooltip formatter={(v: number) => formatFCFA(v)} />
                      <Bar dataKey="montant" fill="hsl(18, 45%, 57%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Commandes payées</p>
              <p className="font-display text-2xl font-bold text-success mt-1">{payees}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Partiellement payées</p>
              <p className="font-display text-2xl font-bold text-warning mt-1">{partielles}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Impayés total</p>
              <p className="font-display text-xl font-bold text-destructive mt-1">{formatFCFA(impayes)}</p>
            </CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="depenses" className="space-y-3 pt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes catégories</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Nouvelle dépense</Button>
          </div>
          <Card><CardContent className="p-0">
            {filtered.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-3 border-b border-border last:border-0">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{d.categorie}</Badge>
                    <span className="text-sm font-medium">{d.description}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{d.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{formatFCFA(d.montant)}</span>
                  <Button size="icon" variant="ghost" onClick={() => setDepenses((p) => p.filter((x) => x.id !== d.id))}>
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
              <Select value={form.categorie} onValueChange={(v) => setForm({ ...form, categorie: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Montant (FCFA)</Label><Input type="number" value={form.montant} onChange={(e) => setForm({ ...form, montant: parseInt(e.target.value || '0', 10) })} className="mt-1" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
            <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={addDep}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
