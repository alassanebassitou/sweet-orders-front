import {
  ShoppingBag, Truck, Wallet, AlertTriangle, TrendingUp, CakeSlice, Clock, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockDashboard, statutColors } from '@/lib/mockData';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
}

const kpis = [
  { label: 'Commandes en cours', value: mockDashboard.commandesEnCours, icon: ShoppingBag, color: 'text-primary' },
  { label: 'Livraisons aujourd\'hui', value: mockDashboard.livraisonsAujourdhui, icon: Truck, color: 'text-success' },
  { label: 'Revenus du mois', value: formatFCFA(mockDashboard.revenuesMois), icon: TrendingUp, color: 'text-primary' },
  { label: 'Impayés', value: formatFCFA(mockDashboard.impayesTotal), icon: Wallet, color: 'text-destructive' },
];

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm">Vue d'ensemble de votre activité</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-bold font-display">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alertes */}
      {mockDashboard.alertes.length > 0 && (
        <Card className="border-warning/30 bg-warning/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Alertes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {mockDashboard.alertes.map((a) => (
              <div key={a.id} className="flex items-center gap-3 text-sm py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0" />
                <span className="text-foreground">{a.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenus — 30 derniers jours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockDashboard.revenus30j}>
                  <defs>
                    <linearGradient id="colorRevenu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(18, 45%, 57%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(18, 45%, 57%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(20, 10%, 45%)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(20, 10%, 45%)" tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip formatter={(v: number) => formatFCFA(v)} />
                  <Area type="monotone" dataKey="montant" stroke="hsl(18, 45%, 57%)" fill="url(#colorRevenu)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top produits */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top produits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockDashboard.topProduits} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(20, 10%, 45%)" />
                  <YAxis type="category" dataKey="nom" tick={{ fontSize: 11 }} width={100} stroke="hsl(20, 10%, 45%)" />
                  <Tooltip />
                  <Bar dataKey="commandes" fill="hsl(18, 45%, 57%)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Commandes récentes */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Commandes récentes</CardTitle>
            <button onClick={() => navigate('/admin/commandes')} className="text-xs text-primary flex items-center gap-1 hover:underline">
              Tout voir <ChevronRight className="w-3 h-3" />
            </button>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockDashboard.commandesRecentes.map((c) => {
              const st = statutColors[c.statut];
              return (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.client}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.numero} — {c.produit}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <Badge variant="secondary" className={`${st?.bg} ${st?.text} text-[10px]`}>{st?.label}</Badge>
                    <p className="text-xs font-medium mt-1">{formatFCFA(c.montant)}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Prochaines livraisons */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Prochaines livraisons</CardTitle>
            <button onClick={() => navigate('/admin/livraisons')} className="text-xs text-primary flex items-center gap-1 hover:underline">
              Tout voir <ChevronRight className="w-3 h-3" />
            </button>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockDashboard.livraisonsAVenir.map((l) => (
              <div key={l.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{l.client}</p>
                  <p className="text-xs text-muted-foreground truncate">{l.adresse}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-primary">{l.heure}</p>
                  <p className="text-xs text-muted-foreground">{l.produit}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
