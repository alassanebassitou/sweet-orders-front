import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingBag, Truck, Wallet, AlertTriangle, TrendingUp, Clock, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { financeService, commandeService, livraisonService, notificationService } from '@/lib/services';
import { statutColors } from '@/lib/constants';
import { formatFCFA } from '@/lib/format';
import { LoadingState, ErrorState } from '@/components/common/StateViews';

export default function DashboardPage() {
  const navigate = useNavigate();

  const dashboardQ = useQuery({ queryKey: ['finance-dashboard'], queryFn: financeService.dashboard });
  const commandesQ = useQuery({ queryKey: ['commandes'], queryFn: () => commandeService.listAdmin() });
  const livraisonsQ = useQuery({ queryKey: ['livraisons-aujourd-hui'], queryFn: livraisonService.aujourdhui });
  const alertesQ = useQuery({ queryKey: ['notifications-non-lues'], queryFn: notificationService.nonLues });

  const dashboard = dashboardQ.data;
  const commandes = commandesQ.data || [];
  const livraisons = livraisonsQ.data || [];
  const alertes = alertesQ.data || [];

  const commandesEnCours = useMemo(
    () => commandes.filter((c: any) => !['LIVREE', 'ANNULEE'].includes(c.statut)).length,
    [commandes]
  );
  const recents = commandes.slice(0, 5);

  const revenuChart = useMemo(() => {
    if (!dashboard?.revenuParMois) return [];
    return dashboard.revenuParMois.map((r: any) => ({
      date: r.mois || r.date,
      montant: r.revenu || r.montant || 0,
    }));
  }, [dashboard]);

  const topProduits = dashboard?.topProduits || [];

  const isLoading = dashboardQ.isLoading || commandesQ.isLoading;
  const isError = dashboardQ.isError && commandesQ.isError;

  if (isLoading) {
    return <div className="p-6"><LoadingState label="Chargement du tableau de bord..." /></div>;
  }
  if (isError) {
    return <div className="p-6"><ErrorState message="Impossible de charger le tableau de bord." onRetry={() => { dashboardQ.refetch(); commandesQ.refetch(); }} /></div>;
  }

  const kpis = [
    { label: 'Commandes en cours', value: commandesEnCours, icon: ShoppingBag, color: 'text-primary' },
    { label: "Livraisons aujourd'hui", value: livraisons.length, icon: Truck, color: 'text-success' },
    { label: 'Revenus du mois', value: formatFCFA(dashboard?.revenuMois || 0), icon: TrendingUp, color: 'text-primary' },
    { label: 'Impayés', value: formatFCFA(dashboard?.totalSoldesRestants || 0), icon: Wallet, color: 'text-destructive' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm">Vue d'ensemble de votre activité</p>
      </div>

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

      {alertes.length > 0 && (
        <Card className="border-warning/30 bg-warning/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" /> Alertes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alertes.slice(0, 5).map((a: any) => (
              <div key={a.id} className="flex items-center gap-3 text-sm py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0" />
                <span className="text-foreground">{a.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base">Revenus — par mois</CardTitle></CardHeader>
          <CardContent>
            <div className="h-52">
              {revenuChart.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Aucune donnée</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenuChart}>
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
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base">Top produits</CardTitle></CardHeader>
          <CardContent>
            <div className="h-52">
              {topProduits.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Aucune donnée</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProduits} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(20, 10%, 45%)" />
                    <YAxis type="category" dataKey="nom" tick={{ fontSize: 11 }} width={100} stroke="hsl(20, 10%, 45%)" />
                    <Tooltip />
                    <Bar dataKey="commandes" fill="hsl(18, 45%, 57%)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Commandes récentes</CardTitle>
            <button onClick={() => navigate('/admin/commandes')} className="text-xs text-primary flex items-center gap-1 hover:underline">
              Tout voir <ChevronRight className="w-3 h-3" />
            </button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune commande</p>
            ) : recents.map((c: any) => {
              const st = statutColors[c.statut];
              const produit = c.produits?.[0]?.nom || '';
              return (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.clientNom}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.numero} — {produit}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <Badge variant="secondary" className={`${st?.bg} ${st?.text} text-[10px]`}>{st?.label}</Badge>
                    <p className="text-xs font-medium mt-1">{formatFCFA(c.montantTotal)}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Prochaines livraisons</CardTitle>
            <button onClick={() => navigate('/admin/livraisons')} className="text-xs text-primary flex items-center gap-1 hover:underline">
              Tout voir <ChevronRight className="w-3 h-3" />
            </button>
          </CardHeader>
          <CardContent className="space-y-3">
            {livraisons.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune livraison aujourd'hui</p>
            ) : livraisons.slice(0, 5).map((l: any) => (
              <div key={l.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{l.clientNom}</p>
                  <p className="text-xs text-muted-foreground truncate">{l.adresseLivraison}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-primary">{l.heurePrevue}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[100px]">{l.produits?.[0]}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
