import { useState, useMemo } from 'react';
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

function WhatsAppButtonAsync({
  commande,
  templates,
  patisserie,
}: {
  commande: any;
  templates: any[];
  patisserie: { nom?: string; telephone?: string };
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
      <Button size="sm" variant="outline" disabled className="gap-1 opacity-60">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Vérification...
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className={cn('gap-1', buttonColorClass[action.variant])}
      disabled={!(commande.clientPhone || commande.clientTelephone)}
      onClick={(e) => {
        e.stopPropagation();
        handleSendWhatsAppFull(commande, templates, patisserie, isVerified, isFullyPaid);
      }}>
      <MessageCircle className="w-3.5 h-3.5" />
      {action.label}
    </Button>
  );
}

const PAYMENT_FILTERS = [
  { value: 'all',     label: 'Tous' },
  { value: 'unpaid',  label: 'Impayé' },
  { value: 'partial', label: 'Partiellement payé' },
  { value: 'paid',    label: 'Payé' },
  { value: 'frais_manquants', label: '🚚 Frais manquants' },
];

const hasMissingDeliveryFee = (c: any) =>
  !!c.fraisLivraisonNonDefini ||
  ((c.deliveryMode === 'HOME_DELIVERY' || c.modeLivraison === 'HOME_DELIVERY') &&
    (!c.fraisLivraison || c.fraisLivraison === 0) &&
    !!(c.deliveryAddress || c.adresseLivraison));

const getPaymentBadge = (c: any) => {
  const total = c.totalAmount || c.montantTotal || 0;
  const paid = c.totalPaye ?? c.paye ?? 0;
  const solde = c.soldeRestant ?? (total - paid);
  if (paid === 0) return { label: 'Impayé', className: 'bg-destructive/10 text-destructive' };
  if (solde <= 0) return { label: 'Payé ✓', className: 'bg-success/15 text-success' };
  return { label: 'Partiel', className: 'bg-warning/15 text-warning' };
};

export default function CommandesPage() {
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selected, setSelected] = useState<Array<string | number>>([]);
  const qc = useQueryClient();

  const { data: commandes = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['commandes', statutFilter],
    queryFn: () => commandeService.listAdmin(statutFilter !== 'ALL' ? { status: statutFilter } : {}),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => parametreService.templates(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: settings } = useQuery({
    queryKey: ['parametres'],
    queryFn: parametreService.get,
    staleTime: 5 * 60 * 1000,
  });

  const patisserie = {
    nom: (settings as any)?.namePatisserie,
    telephone: (settings as any)?.whatsappPhoneNumber,
  };

  const bulkDeleteMut = useMutation({
    mutationFn: (ids: Array<string | number>) => commandeService.bulkDeleteCommandes(ids),
    onSuccess: () => {
      toast.success(`${selected.length} commande(s) supprimée(s)`);
      setSelected([]);
      qc.invalidateQueries({ queryKey: ['commandes'] });
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });


  const filtered = useMemo(() => commandes
    .filter((c: any) =>
      (c.clientName || '').toLowerCase().includes(search.toLowerCase())
      || (c.numero || '').toLowerCase().includes(search.toLowerCase())
    )
    .filter((c: any) => {
      const total = c.totalAmount || c.montantTotal || 0;
      const paid = c.totalPaye ?? c.paye ?? 0;
      const solde = c.soldeRestant ?? (total - paid);
      if (paymentFilter === 'unpaid') return paid === 0;
      if (paymentFilter === 'paid') return solde <= 0 && paid > 0;
      if (paymentFilter === 'partial') return paid > 0 && solde > 0;
      if (paymentFilter === 'frais_manquants') return hasMissingDeliveryFee(c);
      return true;
    }), [commandes, search, paymentFilter]);

  const selected_obj = commandes.find((c: any) => c.id === selectedId) || null;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['commandes'] });
  };

  const toggleSelect = (id: string | number, checked: boolean) => {
    if (checked) setSelected((s) => [...s, id]);
    else setSelected((s) => s.filter((x) => x !== id));
  };

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold">Commandes reçues</h1>
          <p className="text-muted-foreground text-sm">{commandes.length} commande(s) — gérez les commandes envoyées par les clients</p>
        </div>
        <Button onClick={() => setWizardOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Nouvelle commande</Button>
      </div>

      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {PAYMENT_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setPaymentFilter(f.value)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-colors',
              paymentFilter === f.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:bg-secondary'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {selected.length > 0 && (
        <div className="sticky top-0 z-20 flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex-wrap">
          <span className="text-sm font-medium">
            {selected.length} commande(s) sélectionnée(s)
          </span>
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
          <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
            Annuler
          </Button>
        </div>
      )}

      {isLoading ? <LoadingState /> :
       isError ? <ErrorState message="Impossible de charger les commandes" onRetry={refetch} /> :
       filtered.length === 0 ? <EmptyState message="Aucune commande trouvée" icon={ShoppingBag} /> : (
        <div className="space-y-3">
          {filtered.map((c: any) => {
            const st = statutColors[c.status];
            const reste = (c.totalAmount || 0) - (c.totalPaye ?? c.paye ?? 0);
            const isSelected = selected.includes(c.id);
            return (
              <Card key={c.id} className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedId(c.id)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div onClick={(e) => e.stopPropagation()} className="pt-1">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => toggleSelect(c.id, !!checked)}
                        />
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <ShoppingBag className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{c.numero}</span>
                          <Badge variant="secondary" className={`${st?.bg} ${st?.text} text-[10px]`}>{st?.label}</Badge>
                          {(() => { const pb = getPaymentBadge(c); return <Badge variant="secondary" className={`${pb.className} text-[10px]`}>{pb.label}</Badge>; })()}
                          {c.isEmergency && <Badge variant="destructive" className="text-[10px]">Urgent</Badge>}
                        </div>
                        <p className="text-sm text-foreground mt-0.5">{c.clientName}</p>
                        <p className="text-xs text-muted-foreground">{(c.products || []).map((p: any) => `${p.productName} x${p.quantity}`).join(', ')}</p>
                        <p className="text-xs text-muted-foreground mt-1">📅 Livraison : {c.wishDeliveryDate}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm">{formatFCFA(c.totalAmount || 0)}</p>
                      {reste > 0 ? (
                        <p className="text-xs text-destructive mt-1">Reste : {formatFCFA(reste)}</p>
                      ) : (
                        <p className="text-xs text-success mt-1">Payé ✓</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex justify-end">
                    <WhatsAppButtonAsync commande={c} templates={templates as any[]} patisserie={patisserie} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selected_obj && (
        <CommandeDetailSheet
          commande={selected_obj}
          onClose={() => setSelectedId(null)}
          onUpdated={refresh}
        />
      )}

      <NouvelleCommandeWizard open={wizardOpen} onClose={() => { setWizardOpen(false); refresh(); }} />
    </div>
  );
}
