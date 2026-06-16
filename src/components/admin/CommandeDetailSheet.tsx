import { useState } from 'react';
import { X, Phone, Mail, MapPin, MessageCircle, Plus, Trash2, AlertTriangle, AlertCircle, CheckCircle2, CreditCard, Truck, Check, FileText, Download, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AjouterDepenseDialog from '@/components/admin/AjouterDepenseDialog';
import { commandeService, paiementService, financeService, parametreService, invoiceService } from '@/lib/services';
import { zoneService } from '@/lib/zoneService';
import { getWhatsAppAction, handleSendWhatsAppFull, buttonColorClass } from '@/lib/whatsappUtils';
import { statutColors } from '@/lib/constants';
import { formatFCFA, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

interface Props {
  commande: any;
  onClose: () => void;
  onUpdated?: () => void;
}

const transitions: Record<string, { next: string; label: string }> = {
  PENDING_CONFIRMATION: { next: 'CONFIRMED', label: 'Confirmer' },
  CONFIRMED: { next: 'IN_PRODUCTION', label: 'Marquer en production' },
  IN_PRODUCTION: { next: 'READY', label: 'Marquer prête' },
  READY: { next: 'DELIVERED', label: 'Marquer livrée' },
};

export default function CommandeDetailSheet({
  commande,
  onClose,
  onUpdated,
}: Props) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState(commande.internalNote || '');
  const [statut, setStatut] = useState(commande.status);
  const [depenseOpen, setDepenseOpen] = useState(false);
  const [deliveryFeeInput, setDeliveryFeeInput] = useState('');

  const totalPaye = commande.totalPaye ?? commande.paye ?? 0;
  const total = commande.montantTotal ?? commande.totalAmount ?? 0;
  const reste = total - totalPaye;
  const isFullyPaid = reste <= 0;
  const st = statutColors[commande.status];
  const transition = transitions[commande.status];
  const isDelivered = commande.status === 'DELIVERED';

  const depensesQ = useQuery({
    queryKey: ['depenses-commande', commande.id],
    queryFn: () => financeService.depensesParCommande(commande.id),
    enabled: !!commande.id,
  });
  const depenses = depensesQ.data || [];

  const invoicesQ = useQuery({
    queryKey: ['invoices-admin', commande.id],
    queryFn: () => invoiceService.getByCommande(commande.id),
    enabled: !!commande.id,
  });
  const invoices = invoicesQ.data || [];

  const resendInvoiceMut = useMutation({
    mutationFn: (id: number) => invoiceService.resend(id),
    onSuccess: () => toast.success('Email de relance envoyé'),
    onError: () => toast.error("Échec d'envoi de la relance"),
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

  const handleSendWhatsApp = () => {
    // isVerified replaced by isFullyPaid check only — client pays via the app link
    handleSendWhatsAppFull(commande, templates as any[], patisserie, isFullyPaid, isFullyPaid);
  };

  const totalDepenses = depenses.reduce(
    (s: number, d: any) => s + (d.amount ?? d.montant ?? 0),
    0
  );
  const beneficeNet = total - totalDepenses;

  const removeDepMut = useMutation({
    mutationFn: (id: any) => financeService.supprimerDepense(id),
    onSuccess: () => {
      toast.success('Dépense supprimée');
      qc.invalidateQueries({ queryKey: ['depenses-commande', commande.id] });
      qc.invalidateQueries({ queryKey: ['depenses'] });
    },
  });

  const statutMutation = useMutation({
    mutationFn: (newStatut: string) =>
      commandeService.changerStatut(commande.id, newStatut, notes),
    onSuccess: (_, newStatut) => {
      setStatut(newStatut);
      toast.success('Statut mis à jour');
      onUpdated?.();
      qc.invalidateQueries({ queryKey: ['commandes'] });
    },
    onError: (err: any) => {
      const code = err?.response?.data?.error;
      const msg = err?.response?.data?.message;
      if (code === 'PAYMENT_REQUIRED') {
        toast.error(
          msg || 'Le client doit régler le solde avant que la commande puisse être livrée.',
          { duration: 5000 }
        );
      } else if (code === 'ORDER_ALREADY_DELIVERED') {
        toast.error('Cette commande a déjà été livrée.');
      } else {
        toast.error(msg || 'Erreur lors du changement de statut');
      }
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => commandeService.deleteCommande(commande.id),
    onSuccess: () => {
      toast.success('Commande supprimée');
      qc.invalidateQueries({ queryKey: ['commandes'] });
      onUpdated?.();
      onClose();
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const change = (s: string) => statutMutation.mutate(s);

  // ── Delivery fee application ──
  const villeCmd: string | undefined = commande.city;
  const { data: allZonesForThisVille = [] } = useQuery({
    queryKey: ['zones-for-ville', villeCmd],
    queryFn: () =>
      villeCmd
        ? zoneService.getQuartiersForVille(villeCmd)
        : Promise.resolve([]),
    enabled: !!villeCmd,
  });
  const fraisManquants =
    !!commande.isDeliveryFeesApplied ||
    (commande.deliveryMode === 'HOME_DELIVERY' &&
      (!commande.deliveryFees || commande.deliveryFees === 0));

  const applyFeeMut = useMutation({
    mutationFn: ({
      commandeId,
      deliveryFees,
    }: {
      commandeId: any;
      deliveryFees: number;
    }) => zoneService.applyFeeToCommande(commandeId, deliveryFees),
    onSuccess: () => {
      toast.success('Frais appliqués — client notifié par email et notification');
      setDeliveryFeeInput('');
      qc.invalidateQueries({ queryKey: ['commandes'] });
      qc.invalidateQueries({ queryKey: ['commande', commande.id] });
      onUpdated?.();
    },
    onError: () => toast.error("Erreur lors de l'application des frais"),
  });

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div
        className="absolute right-0 top-0 bottom-0 w-full sm:max-w-md
                    bg-card shadow-xl overflow-y-auto"
      >
        {/* ── Header ── */}
        <div
          className="sticky top-0 bg-card z-10 flex items-center
                      justify-between p-4 border-b border-border"
        >
          <div>
            <h2 className="font-display text-lg font-semibold">
              {commande.numero}
            </h2>
            <Badge
              variant="secondary"
              className={`${st?.bg} ${st?.text} text-[10px] mt-1`}
            >
              {st?.label}
            </Badge>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-5">

          {/* ── Client modified warning ── */}
          {commande.lastModifiedByClient && (
            <div className="flex items-center gap-2 p-2 bg-warning/10 border border-warning/30 rounded-lg text-xs text-warning">
              <AlertCircle className="w-3.5 h-3.5" />
              Le client a modifié cette commande
            </div>
          )}

          {/* ── Client ── */}
          <section className="space-y-2">
            <h3 className="font-display font-semibold text-sm">Client</h3>
            <p className="font-medium">{commande.clientName}</p>
            {commande.clientTelephone && (
              <a
                href={`tel:${commande.clientTelephone}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
              >
                <Phone className="w-4 h-4" />
                {commande.clientTelephone}
              </a>
            )}
            {commande.clientEmail && (
              <a
                href={`mailto:${commande.clientEmail}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
              >
                <Mail className="w-4 h-4" />
                {commande.clientEmail}
              </a>
            )}
          </section>

          {/* ── Produits ── */}
          <section>
            <h3 className="font-display font-semibold text-sm mb-2">Produits</h3>
            <div className="space-y-2">
              {(commande.produits || commande.products || []).map(
                (p: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-secondary/40 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {p.nom || p.productName} ×{p.quantite ?? p.quantity}
                      </span>
                      <span>{formatFCFA(p.totalPrice || 0)}</span>
                    </div>
                    {p.cakeMessage && (
                      <p className="text-xs text-muted-foreground italic mt-1">
                        Message : "{p.cakeMessage}"
                      </p>
                    )}
                    {p.customizationJson && p.customizationJson.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        +{' '}
                        {typeof p.customizationJson === 'string'
                          ? p.customizationJson
                          : p.customizationJson.join(', ')}
                      </p>
                    )}
                  </div>
                )
              )}
            </div>
          </section>

          {/* ── Livraison ── */}
          <section className="space-y-1 text-sm">
            <h3 className="font-display font-semibold text-sm mb-1">Livraison</h3>
            <p>
              📅{' '}
              {formatDate(
                commande.dateLivraisonSouhaitee || commande.wishDeliveryDate
              )}{' '}
              — {commande.creneauHoraire}
            </p>
            {commande.modeLivraison === 'LIVRAISON_DOMICILE' ||
            commande.deliveryMode === 'HOME_DELIVERY' ? (
              <p className="flex items-start gap-1">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {commande.adresseLivraison || commande.deliveryAddress}
              </p>
            ) : (
              <p>🏪 Retrait sur place</p>
            )}
          </section>

          {/* ── Frais livraison non définis ── */}
          {fraisManquants && (
            <section className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-900">
                <Truck className="w-5 h-5" />
                <p className="font-semibold text-sm">Frais de livraison non définis</p>
              </div>
              <div className="text-xs text-amber-800 space-y-1">
                <p>
                  🏙️ Ville : <strong>{commande.city || '—'}</strong>
                </p>
                <p>
                  🏘️ Quartier : <strong>{commande.neighborhood || '—'}</strong>
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-amber-900">
                  Appliquer les frais de livraison (FCFA)
                </Label>
                {(allZonesForThisVille as any[]).filter((z) => z.deliveryFees > 0)
                  .length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Zones existantes pour {commande.city} :
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {(allZonesForThisVille as any[])
                        .filter((z) => z.deliveryFees > 0)
                        .map((z: any) => (
                          <button
                            key={z.id}
                            type="button"
                            onClick={() =>
                              setDeliveryFeeInput(String(z.deliveryFees))
                            }
                            className="text-xs px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                          >
                            {z.neighborhood}: {formatFCFA(z.deliveryFees)}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={deliveryFeeInput}
                    onChange={(e) => setDeliveryFeeInput(e.target.value)}
                    placeholder="Ex: 1500"
                    className="flex-1"
                    min={0}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!deliveryFeeInput || Number(deliveryFeeInput) <= 0) {
                        toast.error('Entrez un montant valide');
                        return;
                      }
                      applyFeeMut.mutate({
                        commandeId: commande.id,
                        deliveryFees: Number(deliveryFeeInput),
                      });
                    }}
                    disabled={!deliveryFeeInput || applyFeeMut.isPending}
                    className="gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Appliquer
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Le client sera notifié par email et in-app avec un lien pour
                  payer ces frais.
                </p>
              </div>
            </section>
          )}

          {/* ── Finances ── */}
          <section className="rounded-lg border border-border p-3 space-y-3 bg-secondary/30">
            <h3 className="font-display font-semibold text-sm">
              💰 Finances de cette commande
            </h3>

            {/* Totals */}
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Montant total</span>
                <span className="font-semibold">{formatFCFA(total)}</span>
              </div>
              <div className="flex justify-between text-success">
                <span>Acompte reçu</span>
                <span>{formatFCFA(totalPaye)}</span>
              </div>
              <div
                className={cn(
                  'flex justify-between font-medium',
                  reste > 0 ? 'text-destructive' : 'text-success'
                )}
              >
                <span>Solde restant</span>
                <span className="font-semibold">{formatFCFA(reste)}</span>
              </div>

              {/* Payment status badge — read only, driven by actual payments from client */}
              <div className="pt-2">
                {isFullyPaid ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success">
                    ✅ Entièrement payée
                  </span>
                ) : totalPaye > 0 ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                    🔶 Partiellement payée — solde : {formatFCFA(reste)}
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                    ⚠️ En attente de paiement client
                  </span>
                )}
              </div>
            </div>

            {/* Dépenses liées */}
            <div className="border-t border-border pt-2 text-sm space-y-1">
              <div className="flex justify-between">
                <span>Dépenses liées</span>
                <span className="font-semibold">{formatFCFA(totalDepenses)}</span>
              </div>
              {depenses.map((d: any) => (
                <div
                  key={d.id}
                  className="flex justify-between text-xs text-muted-foreground pl-2"
                >
                  <span>
                    - {d.category || d.categorie} : {d.description}
                  </span>
                  <div className="flex items-center gap-1">
                    <span>{formatFCFA(d.amount ?? d.montant ?? 0)}</span>
                    <button
                      onClick={() => removeDepMut.mutate(d.id)}
                      className="text-destructive p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bénéfice net */}
            <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
              <span>Bénéfice net</span>
              <span className={beneficeNet >= 0 ? 'text-success' : 'text-destructive'}>
                {formatFCFA(beneficeNet)} {beneficeNet >= 0 ? '📈' : '📉'}
              </span>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setDepenseOpen(true)}
              className="w-full gap-2"
            >
              <Plus className="w-4 h-4" /> Ajouter une dépense pour ce gâteau
            </Button>
          </section>

          {/* ── Statut ── */}
          {isDelivered ? (
            <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/30 rounded-lg text-sm">
              <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
              <div>
                <p className="font-semibold text-success">Commande livrée</p>
                <p className="text-xs text-muted-foreground">
                  Cette commande est finalisée. Aucune modification n'est possible.
                </p>
              </div>
            </div>
          ) : (
            <section className="space-y-1">
              <Label>Changer le statut</Label>
              <Select value={statut} onValueChange={change}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING_CONFIRMATION">En attente</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmée</SelectItem>
                  <SelectItem value="IN_PRODUCTION">En production</SelectItem>
                  <SelectItem value="READY">Prête</SelectItem>
                  <SelectItem
                    value="DELIVERED"
                    disabled={!isFullyPaid}
                    className={cn(!isFullyPaid && 'opacity-40 cursor-not-allowed')}
                  >
                    Livrée {!isFullyPaid && '(paiement requis)'}
                  </SelectItem>
                  <SelectItem value="CANCELLED">Annulée</SelectItem>
                </SelectContent>
              </Select>
              {/* Only guard remaining: full payment required for DELIVERED */}
              {!isFullyPaid && (
                <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3" />
                  Solde restant : {formatFCFA(reste)} — le client doit régler avant livraison.
                </p>
              )}
            </section>
          )}

          {/* ── Notes internes ── */}
          <section>
            <Label>Notes internes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1"
              placeholder="Notes non visibles par le client"
            />
          </section>

          {/* ── Actions ── */}
          <div className="space-y-2">

            {/* Quick transition button */}
            {transition &&
              commande.status !== 'CANCELLED' &&
              !isDelivered && (
                <Button
                  onClick={() => change(transition.next)}
                  disabled={
                    statutMutation.isPending ||
                    (transition.next === 'DELIVERED' && !isFullyPaid)
                  }
                  className={cn(
                    'w-full',
                    transition.next === 'DELIVERED' &&
                      !isFullyPaid &&
                      'opacity-50 cursor-not-allowed'
                  )}
                >
                  {transition.label}
                  {transition.next === 'DELIVERED' && !isFullyPaid && (
                    <span className="ml-2 text-xs opacity-70">(paiement requis)</span>
                  )}
                </Button>
              )}

            {/* Invoices */}
            {invoices.length > 0 && (
              <div className="space-y-2 p-3 bg-secondary/30 rounded-lg border border-border">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Factures (
                  {invoices.length})
                </h4>
                {invoices.map((inv: any) => {
                  const typeLabel =
                    ({
                      ACOMPTE: "🧾 Facture d'acompte",
                      SOLDE: '🧾 Facture de solde',
                      INTEGRAL: '🧾 Facture paiement intégral',
                      FRAIS_LIVRAISON: '🧾 Facture frais de livraison',
                    } as Record<string, string>)[inv.type] || '🧾 Facture';
                  return (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between gap-2 p-2 bg-card rounded border border-border"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{typeLabel}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {inv.numero} —{' '}
                          {new Date(inv.submitDate).toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-xs font-semibold text-primary">
                          {formatFCFA(inv.invoiceAmount)}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 h-7 text-xs"
                          onClick={() => invoiceService.downloadPdf(inv.id)}
                        >
                          <Download className="w-3 h-3" /> PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1 h-7 text-xs"
                          disabled={resendInvoiceMut.isPending}
                          onClick={() => resendInvoiceMut.mutate(inv.id)}
                        >
                          <Send className="w-3 h-3" /> Relance
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* WhatsApp smart message */}
            {(() => {
              const action = getWhatsAppAction(
                commande.status || commande.statut,
                isFullyPaid,   // replaces isVerified — client pays via app
                isFullyPaid
              );
              return (
                <Button
                  variant="outline"
                  onClick={handleSendWhatsApp}
                  className={cn('w-full gap-2', buttonColorClass[action.variant])}
                >
                  <MessageCircle className="w-4 h-4" />
                  {action.label}
                </Button>
              );
            })()}

            {commande.clientTelephone && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  window.open(
                    `https://wa.me/${commande.clientTelephone.replace('+', '')}`,
                    '_blank'
                  )
                }
                className="w-full gap-2 text-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Ouvrir WhatsApp sans message
              </Button>
            )}

            {/* Cancel */}
            {commande.status !== 'CANCELLED' && !isDelivered && (
              <Button
                variant="ghost"
                onClick={() => change('CANCELLED')}
                className="w-full text-destructive hover:text-destructive"
              >
                Annuler la commande
              </Button>
            )}

            {/* Delete — only for CANCELLED or DRAFT */}
            {(commande.status === 'CANCELLED' ||
              commande.status === 'DRAFT' ||
              commande.statut === 'CANCELLED' ||
              commande.statut === 'DRAFT') && (
              <Button
                variant="ghost"
                onClick={() => {
                  if (confirm('Supprimer définitivement cette commande ?')) {
                    deleteMut.mutate();
                  }
                }}
                disabled={deleteMut.isPending}
                className="w-full text-destructive hover:bg-destructive/5 gap-2 border border-destructive/20"
              >
                <Trash2 className="w-4 h-4" /> Supprimer la commande
              </Button>
            )}
          </div>
        </div>
      </div>

      <AjouterDepenseDialog
        open={depenseOpen}
        onOpenChange={setDepenseOpen}
        commandeId={commande.id}
      />
    </div>
  );
}
