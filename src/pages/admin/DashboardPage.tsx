import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingBag, Truck, Wallet, AlertTriangle, TrendingUp, Clock, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { financeService, commandeService, deliveriesService, notificationService } from '@/lib/services';
import { statutColors } from '@/lib/constants';
import { formatFCFA } from '@/lib/format';
import { LoadingState, ErrorState } from '@/components/common/StateViews';

// ─── Status badge colours (unchanged) ────────────────────────────────────────
/* const statutColors: Record<string, { bg: string; text: string; label: string }> = {
  PENDING:     { bg: 'bg-warning/15',     text: 'text-warning',     label: 'En attente'    },
  IN_PROGRESS: { bg: 'bg-primary/15',     text: 'text-primary',     label: 'En production' },
  DELIVERED:   { bg: 'bg-success/15',     text: 'text-success',     label: 'Livré'         },
  CANCELLED:   { bg: 'bg-destructive/15', text: 'text-destructive', label: 'Annulé'        },
}; */

// Animation variants

const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: (delay = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut', delay },
  }),
};

const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.93 },
  visible: (delay = 0) => ({
    opacity: 1, scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

// Scroll-reveal wrapper (same as LandingPage)
function RevealOnScroll({
  children,
  variants = fadeUp,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  variants?: Variants;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={variants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      custom={delay}
    >
      {children}
    </motion.div>
  );
}
import { useEffect, useState } from 'react';
import { Variants, useInView, motion } from 'framer-motion';

function CountUp({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      current = Math.min(current + increment, value);
      setDisplay(Math.round(current));
      if (step >= steps) clearInterval(timer);
    }, (duration * 1000) / steps);
    return () => clearInterval(timer);
  }, [value, duration]);

  return <>{display.toLocaleString('fr-FR')}</>;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, icon: Icon, color, delay,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  delay: number;
}) {
  const isNumeric = typeof value === 'number';

  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      custom={delay}
      whileHover={{ y: -4, boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      <Card className="shadow-sm overflow-hidden min-w-0 h-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <motion.div
              initial={{ rotate: -15, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ delay: delay + 0.2, duration: 0.4 }}
            >
              <Icon className={`w-5 h-5 ${color} shrink-0`} />
            </motion.div>
          </div>

          <p className="text-lg sm:text-2xl font-bold font-display leading-tight break-words">
            {isNumeric ? (
              <CountUp value={value as number} />
            ) : (
              // For formatted strings like "57 501 FCFA", animate opacity only
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.3, duration: 0.5 }}
              >
                {value}
              </motion.span>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-1 truncate">{label}</p>

          {/* Subtle bottom accent line */}
          <motion.div
            className={`h-0.5 rounded-full mt-3 bg-current ${color} opacity-20`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: delay + 0.4, duration: 0.5, ease: 'easeOut' }}
            style={{ transformOrigin: 'left' }}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();

  const dashboardQ  = useQuery({ queryKey: ['finance-dashboard'],       queryFn: financeService.dashboard });
  const commandesQ  = useQuery({ queryKey: ['commandes'],               queryFn: () => commandeService.listAdmin() });
  const livraisonsQ = useQuery({ queryKey: ['livraisons-aujourd-hui'],  queryFn: deliveriesService.aujourdhui });
  const alertesQ    = useQuery({ queryKey: ['notifications-non-lues'],  queryFn: notificationService.nonLues });

  const dashboard  = dashboardQ.data;
  const commandes  = commandesQ.data  || [];
  const livraisons = livraisonsQ.data || [];
  const alertes    = alertesQ.data    || [];

  const commandesEnCours = useMemo(
    () => commandes.filter((c: any) => !['DELIVERED', 'CANCELLED'].includes(c.status)).length,
    [commandes],
  );
  const recents = commandes.slice(0, 5);

  const revenuChart = useMemo(() => {
    if (!dashboard?.revenueByMonth) return [];
    return dashboard.revenueByMonth.map((r: any) => ({
      date: r.month,
      montant: r.revenue || 0,
    }));
  }, [dashboard]);

  const topProducts = dashboard?.topProducts || [];

  const isLoading = dashboardQ.isLoading || commandesQ.isLoading;
  const isError   = dashboardQ.isError && commandesQ.isError;

  if (isLoading) return <div className="p-6"><LoadingState label="Chargement du tableau de bord..." /></div>;
  if (isError)   return (
    <div className="p-6">
      <ErrorState
        message="Impossible de charger le tableau de bord."
        onRetry={() => { dashboardQ.refetch(); commandesQ.refetch(); }}
      />
    </div>
  );

  const kpis = [
    { label: 'Commandes en cours',   value: commandesEnCours,                         icon: ShoppingBag, color: 'text-primary'     },
    { label: "Livraisons aujourd'hui", value: livraisons.length,                        icon: Truck,       color: 'text-success'     },
    { label: 'Revenus du mois',      value: formatFCFA(dashboard?.monthlyRevenue || 0), icon: TrendingUp,  color: 'text-primary'     },
    { label: 'Impayés',              value: formatFCFA(dashboard?.totalRemainingBalances || 0), icon: Wallet, color: 'text-destructive' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* ── Page title ── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="font-display text-2xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm">Vue d'ensemble de votre activité</p>
      </motion.div>

      {/* ── KPI grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} {...kpi} delay={i * 0.1} />
        ))}
      </div>

      {/* ── Alerts ── */}
      {alertes.length > 0 && (
        <RevealOnScroll variants={fadeUp}>
          <motion.div
            initial={{ borderLeftWidth: 0 }}
            animate={{ borderLeftWidth: 4 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <Card className="border-warning/30 bg-warning/5 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                  >
                    <AlertTriangle className="w-4 h-4 text-warning" />
                  </motion.div>
                  Alertes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {alertes.slice(0, 5).map((a: any, i: number) => (
                  <motion.div
                    key={a.id}
                    className="flex items-center gap-3 text-sm py-1.5"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.08, duration: 0.4 }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0" />
                    <span className="text-foreground">{a.message}</span>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </RevealOnScroll>
      )}

      {/* ── Charts ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        <RevealOnScroll variants={scaleIn} delay={0}>
          <Card className="shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Revenus — par mois</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                {revenuChart.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    Aucune donnée
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenuChart}>
                      <defs>
                        <linearGradient id="colorRevenu" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="hsl(18, 45%, 57%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(18, 45%, 57%)" stopOpacity={0}   />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(20, 10%, 45%)" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(20, 10%, 45%)" tickFormatter={(v) => `${v / 1000}k`} />
                      <Tooltip formatter={(v: number) => formatFCFA(v)} />
                      <Area
                        type="monotone"
                        dataKey="montant"
                        stroke="hsl(18, 45%, 57%)"
                        fill="url(#colorRevenu)"
                        strokeWidth={2}
                        // Recharts animates on mount by default ✓
                        isAnimationActive
                        animationDuration={1200}
                        animationEasing="ease-out"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </RevealOnScroll>

        <RevealOnScroll variants={scaleIn} delay={0.1}>
          <Card className="shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top produits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                {topProducts.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    Aucune donnée
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProducts} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(20, 10%, 45%)" />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} stroke="hsl(20, 10%, 45%)" />
                      <Tooltip />
                      <Bar
                        dataKey="commande"
                        fill="hsl(18, 45%, 57%)"
                        radius={[0, 6, 6, 0]}
                        isAnimationActive
                        animationDuration={1000}
                        animationEasing="ease-out"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </RevealOnScroll>
      </div>

      {/* ── Recent orders + Deliveries ── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Commandes récentes */}
        <RevealOnScroll variants={fadeUp} delay={0}>
          <Card className="shadow-sm h-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Commandes récentes</CardTitle>
              <motion.button
                onClick={() => navigate('/admin/commandes')}
                className="text-xs text-primary flex items-center gap-1 hover:underline"
                whileHover={{ x: 3 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                Tout voir <ChevronRight className="w-3 h-3" />
              </motion.button>
            </CardHeader>
            <CardContent className="space-y-3">
              {recents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune commande</p>
              ) : recents.map((c: any, i: number) => {
                const st = statutColors[c.status];
                const produit = c.products?.[0]?.productName || '';
                return (
                  <motion.div
                    key={c.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.07, duration: 0.4, ease: 'easeOut' }}
                    whileHover={{ backgroundColor: 'hsl(var(--muted) / 0.4)', borderRadius: '6px', paddingLeft: '6px' }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.clientName}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.numero} — {produit}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <Badge variant="secondary" className={`${st?.bg} ${st?.text} text-[10px]`}>
                        {st?.label}
                      </Badge>
                      <p className="text-xs font-medium mt-1">{formatFCFA(c.totalAmount)}</p>
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </RevealOnScroll>

        {/* Prochaines livraisons */}
        <RevealOnScroll variants={fadeUp} delay={0.1}>
          <Card className="shadow-sm h-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Prochaines livraisons</CardTitle>
              <motion.button
                onClick={() => navigate('/admin/livraisons')}
                className="text-xs text-primary flex items-center gap-1 hover:underline"
                whileHover={{ x: 3 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                Tout voir <ChevronRight className="w-3 h-3" />
              </motion.button>
            </CardHeader>
            <CardContent className="space-y-3">
              {livraisons.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune livraison aujourd'hui</p>
              ) : livraisons.slice(0, 5).map((l: any, i: number) => (
                <motion.div
                  key={l.id}
                  className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.07, duration: 0.4, ease: 'easeOut' }}
                  whileHover={{ backgroundColor: 'hsl(var(--muted) / 0.4)', borderRadius: '6px', paddingLeft: '6px' }}
                >
                  <motion.div
                    className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"
                    whileHover={{ scale: 1.12, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <Clock className="w-5 h-5 text-primary" />
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{l.clientName}</p>
                    <p className="text-xs text-muted-foreground truncate">{l.deliveryAddress}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-primary">{l.expectedHour}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[100px]">{l.products?.[0]}</p>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </RevealOnScroll>
      </div>
    </div>
  );
}
