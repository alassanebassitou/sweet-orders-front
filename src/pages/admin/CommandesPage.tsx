import { useState, useMemo, useRef } from 'react';
import { Search, Filter, ShoppingBag, Plus, MessageCircle, Trash2, Loader2, Truck } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CommandeDetailSheet from '@/components/admin/CommandeDetailSheet';
import NouvelleCommandeWizard from '@/components/admin/NouvelleCommandeWizard';
import { commandeService, parametreService, paiementService } from '@/lib/services';
import { statutColors } from '@/lib/constants';
import { formatFCFA } from '@/lib/format';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/StateViews';
import { getWhatsAppAction, handleSendWhatsAppFull, buttonColorClass } from '@/lib/whatsappUtils';
import { cn } from '@/lib/utils';
import { useInView, motion, AnimatePresence } from 'framer-motion';

/* function WhatsAppButtonAsync({
  commande,
  templates,
  patisserie,
  className,
}: {
  commande: any;
  templates: any[];
  patisserie: { nom?: string; telephone?: string };
  className?: string;
}) {
  const { data: isVerified = false, isLoading } = useQuery({
    queryKey: ['payment-verified', commande.id],
    queryFn: () => paiementService.verifyPayment(commande.id),
    staleTime: 30 * 1000,
    enabled: !!commande.id,
  });

  const total = commande.totalAmount || commande.montantTotal || 0;
  const paid = commande.totalPaye ?? commande.paye ?? 0;
  const solde = commande.soldeRestant ?? (total - paid);
  const isFullyPaid = solde <= 0;
  const action = getWhatsAppAction(
    commande.status || commande.statut,
    isVerified,
    isFullyPaid
  );

  if (isLoading) {
    return (
      <Button size="sm" variant="outline" disabled className={cn("gap-1 opacity-60", className)}>
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Vérification...
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className={cn('gap-1', buttonColorClass[action.variant], className)}
      disabled={!(commande.clientPhone || commande.clientTelephone)}
      onClick={(e) => {
        e.stopPropagation();
        handleSendWhatsAppFull(commande, templates, patisserie, isVerified, isFullyPaid);
      }}>
      <MessageCircle className="w-3.5 h-3.5" />
      {action.label}
    </Button>
  );
} */

const PAYMENT_FILTERS = [
  { value: 'all',     label: 'Tous' },
  { value: 'unpaid',  label: 'Impayé' },
  { value: 'partial', label: 'Partiellement payé' },
  { value: 'paid',    label: 'Payé' },
  { value: 'frais_manquants', label: '🚚 Frais manquants' },
];

const hasMissingDeliveryFee = (c: any) =>
  !!c.isDeliveryFeesApplied ||
  ((c.deliveryMode === 'HOME_DELIVERY') 
  && (!c.deliveryFees || c.deliveryFees === 0) 
  && !!(c.deliveryAddress || c.deliveryAddress));

const getPaymentBadge = (c: any) => {
  const total = c.totalAmount || c.montantTotal || 0;
  const paid  = c.totalPaye ?? c.paye ?? 0;
  const solde = c.soldeRestant ?? (total - paid);
  if (paid === 0) return { label: 'Impayé', type: 'unpaid',  className: 'bg-destructive/10 text-destructive' };
  if (solde <= 0) return { label: 'Payé ✓', type: 'paid',    className: 'bg-success/15 text-success'         };
  return              { label: 'Partiel', type: 'partial', className: 'bg-warning/15 text-warning'          };
};
 
// ─── Scroll-reveal wrapper ────────────────────────────────────────────────────
function RevealCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
 
// ─── BADGE: "Payé ✓" — ping-pong left↔right like tennis ball ─────────────────
function PaidBadge({ className }: { className?: string }) {
  return (
    <motion.span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium select-none',
        'bg-success/15 text-success',
        className,
      )}
      animate={{ x: [-4, 4, -4] }}
      transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
    >
      Payé ✓
    </motion.span>
  );
}
 
// ─── BADGE: "Impayé" — continuous fade-out / fade-in (alert pulse) ───────────
function UnpaidBadge({ className }: { className?: string }) {
  return (
    <motion.span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium select-none',
        'bg-destructive/10 text-destructive',
        className,
      )}
      animate={{ opacity: [1, 0.2, 1] }}
      transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
    >
      Impayé
    </motion.span>
  );
}
 
// ─── BADGE: "Partiel" — gentle scale pulse (amber, calm) ─────────────────────
function PartialBadge({ className }: { className?: string }) {
  return (
    <motion.span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium select-none',
        'bg-warning/15 text-warning',
        className,
      )}
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      Partiel
    </motion.span>
  );
}
 
// ─── BADGE: "Frais livraison non définis" — shimmer sweep ────────────────────
function DeliveryFeeBadge() {
  return (
    <motion.span
      className="relative inline-flex items-center gap-1 overflow-hidden rounded-full px-2 py-0.5 text-[10px] font-medium select-none bg-amber-100 text-amber-800 border border-amber-300"
      animate={{ borderColor: ['#f59e0b', '#fbbf24', '#f59e0b'] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Shimmer layer */}
      <motion.span
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
        animate={{ x: ['-100%', '160%'] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.5 }}
      />
      <Truck className="w-3 h-3 relative z-10" />
      <span className="relative z-10">Frais livraison non définis</span>
    </motion.span>
  );
}
 
// ─── FILTER PILL — active one bounces like "Payé" ────────────────────────────
function FilterPill({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-colors',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-card text-muted-foreground border-border hover:bg-secondary',
      )}
      animate={active ? { x: [-3, 3, -3] } : { x: 0 }}
      transition={active
        ? { duration: 0.9, repeat: Infinity, ease: 'easeInOut' }
        : { duration: 0.2 }
      }
      whileTap={{ scale: 0.93 }}
    >
      {label}
    </motion.button>
  );
}
 
// ─── WhatsApp button (unchanged logic, micro-animation added) ─────────────────
function WhatsAppButtonAsync({
  commande, templates, patisserie, className,
}: {
  commande: any;
  templates: any[];
  patisserie: { nom?: string; telephone?: string };
  className?: string;
}) {
  const { data: isVerified = false, isLoading } = useQuery({
    queryKey: ['payment-verified', commande.id],
    queryFn:  () => paiementService.verifyPayment(commande.id),
    staleTime: 30 * 1000,
    enabled:  !!commande.id,
  });
 
  const total       = commande.totalAmount || commande.montantTotal || 0;
  const paid        = commande.totalPaye ?? commande.paye ?? 0;
  const solde       = commande.soldeRestant ?? (total - paid);
  const isFullyPaid = solde <= 0;
  const action      = getWhatsAppAction(commande.status || commande.statut, isVerified, isFullyPaid);
 
  if (isLoading) {
    return (
      <Button size="sm" variant="outline" disabled className={cn('gap-1 opacity-60', className)}>
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Vérification...
      </Button>
    );
  }
 
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="w-full">
      <Button
        size="sm"
        variant="outline"
        className={cn('gap-1 w-full', buttonColorClass[action.variant], className)}
        disabled={!(commande.clientPhone || commande.clientTelephone)}
        onClick={(e) => {
          e.stopPropagation();
          handleSendWhatsAppFull(commande, templates, patisserie, isVerified, isFullyPaid);
        }}
      >
        <MessageCircle className="w-3.5 h-3.5" />
        {action.label}
      </Button>
    </motion.div>
  );
}
 
// ─── Main page ────────────────────────────────────────────────────────────────
export default function CommandesPage() {
  const [search,        setSearch]        = useState('');
  const [statutFilter,  setStatutFilter]  = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedId,    setSelectedId]    = useState<string | number | null>(null);
  const [wizardOpen,    setWizardOpen]    = useState(false);
  const [selected,      setSelected]      = useState<Array<string | number>>([]);
  const qc = useQueryClient();
 
  const { data: commandes = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['commandes', statutFilter],
    queryFn:  () => commandeService.listAdmin(statutFilter !== 'ALL' ? { status: statutFilter } : {}),
  });
 
  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn:  () => parametreService.templates(),
    staleTime: 5 * 60 * 1000,
  });
 
  const { data: settings } = useQuery({
    queryKey: ['parametres'],
    queryFn:  parametreService.get,
    staleTime: 5 * 60 * 1000,
  });
 
  const patisserie = {
    nom:       (settings as any)?.namePatisserie,
    telephone: (settings as any)?.whatsappPhoneNumber,
  };
 
  const bulkDeleteMut = useMutation({
    mutationFn: (ids: Array<string | number>) => commandeService.bulkDeleteCommandes(ids),
    onSuccess:  () => {
      toast.success(`${selected.length} commande(s) supprimée(s)`);
      setSelected([]);
      qc.invalidateQueries({ queryKey: ['commandes'] });
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });
 
  const filtered = useMemo(() => commandes
    .filter((c: any) =>
      (c.clientName || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.numero     || '').toLowerCase().includes(search.toLowerCase()),
    )
    .filter((c: any) => {
      const total = c.totalAmount || c.montantTotal || 0;
      const paid  = c.totalPaye ?? c.paye ?? 0;
      const solde = c.soldeRestant ?? (total - paid);
      if (paymentFilter === 'unpaid')          return paid === 0;
      if (paymentFilter === 'paid')            return solde <= 0 && paid > 0;
      if (paymentFilter === 'partial')         return paid > 0 && solde > 0;
      if (paymentFilter === 'frais_manquants') return hasMissingDeliveryFee(c);
      return true;
    }), [commandes, search, paymentFilter]);
 
  const selected_obj = commandes.find((c: any) => c.id === selectedId) || null;
  const refresh      = () => qc.invalidateQueries({ queryKey: ['commandes'] });
 
  const toggleSelect = (id: string | number, checked: boolean) => {
    if (checked) setSelected((s) => [...s, id]);
    else         setSelected((s) => s.filter((x) => x !== id));
  };
 
  return (
    <div className="p-4 md:p-6 space-y-4">
 
      {/* ── Page header ── */}
      <motion.div
        className="flex items-start justify-between gap-3 flex-wrap"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div>
          <h1 className="font-display text-2xl font-bold">Commandes reçues</h1>
          <motion.p
            className="text-muted-foreground text-sm truncate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {commandes.length} commande(s) — gérez les commandes
          </motion.p>
        </div>
      </motion.div>
 
      {/* ── Search + status filter ── */}
      <motion.div
        className="flex gap-3 flex-col sm:flex-row"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statutFilter} onValueChange={setStatutFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les statuts</SelectItem>
            <SelectItem value="PENDING_CONFIRMATION">En attente</SelectItem>
            <SelectItem value="CONFIRMED">Confirmée</SelectItem>
            <SelectItem value="IN_PRODUCTION">En production</SelectItem>
            <SelectItem value="READY">Prête</SelectItem>
            <SelectItem value="DELIVERED">Livrée</SelectItem>
            <SelectItem value="CANCELLED">Annulée</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>
 
      {/* ── Payment filter pills ── */}
      <motion.div
        className="overflow-x-auto -mx-4 px-4 pb-1 sm:mx-0 sm:px-0"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.45 }}
      >
        <div className="flex gap-2 min-w-max sm:min-w-0 sm:flex-wrap">
          {PAYMENT_FILTERS.map((f) => (
            <FilterPill
              key={f.value}
              label={f.label}
              active={paymentFilter === f.value}
              onClick={() => setPaymentFilter(f.value)}
            />
          ))}
        </div>
      </motion.div>
 
      {/* ── Bulk-delete bar ── */}
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            className="sticky top-0 z-20 flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex-wrap"
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0,   height: 'auto' }}
            exit={{    opacity: 0, y: -10,  height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-sm font-medium">
              {selected.length} commande(s) sélectionnée(s)
            </span>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Button
                size="sm"
                variant="destructive"
                disabled={bulkDeleteMut.isPending}
                onClick={() => {
                  if (confirm(`Supprimer ${selected.length} commande(s) ?`)) {
                    bulkDeleteMut.mutate(selected);
                  }
                }}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Supprimer la sélection
              </Button>
            </motion.div>
            <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
              Annuler
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
 
      {/* ── List ── */}
      {isLoading ? <LoadingState /> :
       isError   ? <ErrorState message="Impossible de charger les commandes" onRetry={refetch} /> :
       filtered.length === 0 ? <EmptyState message="Aucune commande trouvée" icon={ShoppingBag} /> : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((c: any, i: number) => {
              const st         = statutColors[c.status];
              const reste      = (c.totalAmount || 0) - (c.totalPaye ?? c.paye ?? 0);
              const isSelected = selected.includes(c.id);
              const pb         = getPaymentBadge(c);
              const missingFee = hasMissingDeliveryFee(c);
 
              return (
                <RevealCard key={c.id} delay={Math.min(i * 0.06, 0.4)}>
                  <motion.div
                    layout
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      whileHover={{ y: -3, boxShadow: '0 8px 28px rgba(0,0,0,0.07)' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                    >
                      <Card
                        className={cn(
                          'shadow-sm cursor-pointer transition-colors',
                          isSelected && 'ring-2 ring-primary/40',
                        )}
                        onClick={() => setSelectedId(c.id)}
                      >
                        <CardContent className="p-4 flex flex-col gap-3">
                          <div className="flex items-start gap-3 min-w-0 w-full">
 
                            {/* Checkbox */}
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="pt-1.5 flex-shrink-0"
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => toggleSelect(c.id, !!checked)}
                              />
                            </div>
 
                            {/* Icon */}
                            <motion.div
                              className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5"
                              whileHover={{ rotate: 6, scale: 1.1 }}
                              transition={{ type: 'spring', stiffness: 400 }}
                            >
                              <ShoppingBag className="w-5 h-5 text-primary" />
                            </motion.div>
 
                            {/* Content */}
                            <div className="min-w-0 flex-1 flex flex-col">
 
                              {/* Top row */}
                              <div className="flex justify-between items-start gap-2 w-full mb-1">
                                <span className="font-bold text-base text-foreground">{c.numero}</span>
                                <div className="text-right flex-shrink-0">
                                  <p className="font-bold text-sm text-foreground">
                                    {formatFCFA(c.totalAmount || 0)}
                                  </p>
                                  {reste > 0 ? (
                                    // "Reste : X FCFA" — fades like impayé
                                    <motion.p
                                      className="text-[11px] text-destructive mt-0.5"
                                      animate={{ opacity: [1, 0.4, 1] }}
                                      transition={{ duration: 1.6, repeat: Infinity }}
                                    >
                                      Reste : {formatFCFA(reste)}
                                    </motion.p>
                                  ) : (
                                    // "Payé ✓" text — ping-pong
                                    <motion.p
                                      className="text-[11px] text-success mt-0.5"
                                      animate={{ x: [-2, 2, -2] }}
                                      transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
                                    >
                                      Payé ✓
                                    </motion.p>
                                  )}
                                </div>
                              </div>
 
                              {/* Badges row */}
                              <div className="flex items-center gap-2 flex-wrap mt-1 mb-2">
                                {/* Order status — static */}
                                <Badge
                                  variant="secondary"
                                  className={`${st?.bg} ${st?.text} text-[10px]`}
                                >
                                  {st?.label}
                                </Badge>
 
                                {/* Payment badge — animated per type */}
                                {pb.type === 'paid'    && <PaidBadge />}
                                {pb.type === 'unpaid'  && <UnpaidBadge />}
                                {pb.type === 'partial' && <PartialBadge />}
 
                                {/* Delivery fee missing — shimmer */}
                                {missingFee && <DeliveryFeeBadge />}
 
                                {/* Urgent */}
                                {c.isEmergency && (
                                  <motion.span
                                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-destructive text-destructive-foreground"
                                    animate={{ scale: [1, 1.12, 1] }}
                                    transition={{ duration: 0.7, repeat: Infinity }}
                                  >
                                    Urgent
                                  </motion.span>
                                )}
                              </div>
 
                              {/* Client info */}
                              <p className="mt-2 text-sm font-medium text-foreground">{c.clientName}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {(c.products || []).map((p: any) => `${p.productName} x${p.quantity}`).join(', ')}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                                <span>📅</span> Livraison : {c.wishDeliveryDate}
                              </p>
                            </div>
                          </div>
 
                          {/* WhatsApp button */}
                          <div className="mt-3 pt-3 border-t border-border w-full">
                            <WhatsAppButtonAsync
                              commande={c}
                              templates={templates as any[]}
                              patisserie={patisserie}
                              className="flex items-center justify-center gap-2 text-sm"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </motion.div>
                </RevealCard>
              );
            })}
          </AnimatePresence>
        </div>
      )}
 
      {selected_obj && (
        <CommandeDetailSheet
          commande={selected_obj}
          onClose={() => setSelectedId(null)}
          onUpdated={refresh}
        />
      )}
 
      <NouvelleCommandeWizard
        open={wizardOpen}
        onClose={() => { setWizardOpen(false); refresh(); }}
      />
    </div>
  );
}
