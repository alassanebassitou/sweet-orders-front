import { useState } from 'react';
import { X, Phone, Mail, MapPin, MessageCircle, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AjouterDepenseDialog from '@/components/admin/AjouterDepenseDialog';
import { commandeService, paiementService, financeService } from '@/lib/services';
import { statutColors } from '@/lib/constants';
import { formatFCFA, formatDate } from '@/lib/format';

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

export default function CommandeDetailSheet({ commande, onClose, onUpdated }: Props) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState(commande.notesInternes || '');
  const [statut, setStatut] = useState(commande.statut);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [depenseOpen, setDepenseOpen] = useState(false);

  const totalPaye = commande.totalPaye ?? commande.paye ?? 0;
  const total = commande.montantTotal ?? commande.totalAmount ?? 0;
  const reste = total - totalPaye;
  const st = statutColors[commande.statut];
  const transition = transitions[commande.statut];

  const depensesQ = useQuery({
    queryKey: ['depenses-commande', commande.id],
    queryFn: () => financeService.depensesParCommande(commande.id),
    enabled: !!commande.id,
  });
  const depenses = depensesQ.data || [];
  const totalDepenses = depenses.reduce((s: number, d: any) => s + (d.amount ?? d.montant ?? 0), 0);
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
    },
    onError: () => toast.error('Erreur lors du changement de statut'),
  });

  const paiementMutation = useMutation({
    mutationFn: (montant: number) =>
      paiementService.enregistrer({ commandeId: commande.id, montant, modePaiement: 'ESPECES', typePaiement: 'COMPLEMENT' }),
    onSuccess: () => {
      toast.success('Paiement enregistré');
      setPaymentOpen(false);
      setPaymentAmount('');
      onUpdated?.();
    },
    onError: () => toast.error("Erreur lors de l'enregistrement"),
  });

  const change = (s: string) => statutMutation.mutate(s);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-card shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-card z-10 flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="font-display text-lg font-semibold">{commande.numero}</h2>
            <Badge variant="secondary" className={`${st?.bg} ${st?.text} text-[10px] mt-1`}>{st?.label}</Badge>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 space-y-5">
          <section className="space-y-2">
            <h3 className="font-display font-semibold text-sm">Client</h3>
            <p className="font-medium">{commande.clientName}</p>
            {commande.clientTelephone && (
              <a href={`tel:${commande.clientTelephone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                <Phone className="w-4 h-4" /> {commande.clientTelephone}
              </a>
            )}
            {commande.clientEmail && (
              <a href={`mailto:${commande.clientEmail}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                <Mail className="w-4 h-4" /> {commande.clientEmail}
              </a>
            )}
          </section>

          <section>
            <h3 className="font-display font-semibold text-sm mb-2">Produits</h3>
            <div className="space-y-2">
              {(commande.produits || commande.products || []).map((p: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/40 text-sm">
                  <div className="flex justify-between"><span className="font-medium">{p.nom || p.productName} ×{p.quantite ?? p.quantity}</span><span>{formatFCFA(p.prixTotal || 0)}</span></div>
                  {p.cakeMessage && <p className="text-xs text-muted-foreground italic mt-1">Message : "{p.cakeMessage}"</p>}
                  {p.customizationJson && p.customizationJson.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">+ {(typeof p.customizationJson === 'string' ? p.customizationJson : p.customizationJson.join(', '))}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-1 text-sm">
            <h3 className="font-display font-semibold text-sm mb-1">Livraison</h3>
            <p>📅 {formatDate(commande.dateLivraisonSouhaitee || commande.wishDeliveryDate)} — {commande.creneauHoraire}</p>
            {(commande.modeLivraison === 'LIVRAISON_DOMICILE' || commande.deliveryMode === 'HOME_DELIVERY') ? (
              <p className="flex items-start gap-1"><MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" /> {commande.adresseLivraison || commande.deliveryAddress}</p>
            ) : (
              <p>🏪 Retrait sur place</p>
            )}
          </section>

          {/* 💰 Finances de cette commande */}
          <section className="rounded-lg border border-border p-3 space-y-3 bg-secondary/30">
            <h3 className="font-display font-semibold text-sm">💰 Finances de cette commande</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span>Montant total</span><span className="font-semibold">{formatFCFA(total)}</span></div>
              <div className="flex justify-between text-success"><span>Acompte reçu</span><span>{formatFCFA(totalPaye)}</span></div>
              {reste > 0 && <div className="flex justify-between text-destructive"><span>Solde restant</span><span className="font-semibold">{formatFCFA(reste)}</span></div>}
            </div>
            <div className="border-t border-border pt-2 text-sm space-y-1">
              <div className="flex justify-between">
                <span>Dépenses liées</span>
                <span className="font-semibold">{formatFCFA(totalDepenses)}</span>
              </div>
              {depenses.map((d: any) => (
                <div key={d.id} className="flex justify-between text-xs text-muted-foreground pl-2">
                  <span>- {d.category || d.categorie} : {d.description}</span>
                  <div className="flex items-center gap-1">
                    <span>{formatFCFA(d.amount ?? d.montant ?? 0)}</span>
                    <button onClick={() => removeDepMut.mutate(d.id)} className="text-destructive p-0.5"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
              <span>Bénéfice net</span>
              <span className={beneficeNet >= 0 ? 'text-success' : 'text-destructive'}>{formatFCFA(beneficeNet)} {beneficeNet >= 0 ? '📈' : '📉'}</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setDepenseOpen(true)} className="w-full gap-2">
              <Plus className="w-4 h-4" /> Ajouter une dépense pour ce gâteau
            </Button>
          </section>

          <section>
            <Label>Changer le statut</Label>
            <Select value={statut} onValueChange={change}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING_CONFIRMATION">En attente</SelectItem>
                <SelectItem value="CONFIRMED">Confirmée</SelectItem>
                <SelectItem value="IN_PRODUCTION">En production</SelectItem>
                <SelectItem value="READY">Prête</SelectItem>
                <SelectItem value="DELIVERED">Livrée</SelectItem>
                <SelectItem value="CANCELLED">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </section>

          <section>
            <Label>Notes internes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" placeholder="Notes non visibles par le client" />
          </section>

          {paymentOpen && (
            <section className="p-3 rounded-lg border border-border space-y-2">
              <Label>Montant du paiement (FCFA)</Label>
              <Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder={String(reste)} />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => paiementMutation.mutate(parseInt(paymentAmount || '0', 10))} disabled={!paymentAmount || paiementMutation.isPending}>
                  Valider
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPaymentOpen(false)}>Annuler</Button>
              </div>
            </section>
          )}

          <div className="space-y-2">
            {transition && commande.status !== 'CANCELLED' && (
              <Button onClick={() => change(transition.next)} disabled={statutMutation.isPending} className="w-full">
                {transition.label}
              </Button>
            )}
            {reste > 0 && !paymentOpen && (
              <Button variant="secondary" onClick={() => setPaymentOpen(true)} className="w-full">
                Enregistrer un paiement
              </Button>
            )}
            {commande.clientTelephone && (
              <Button
                variant="outline"
                onClick={() => window.open(`https://wa.me/${commande.clientTelephone.replace('+', '')}`, '_blank')}
                className="w-full gap-2"
              >
                <MessageCircle className="w-4 h-4" /> Contacter sur WhatsApp
              </Button>
            )}
            {commande.status !== 'CANCELLED' && commande.status !== 'DELIVERED' && (
              <Button variant="ghost" onClick={() => change('CANCELLED')} className="w-full text-destructive hover:text-destructive">
                Annuler la commande
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
