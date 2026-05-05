import { useState } from 'react';
import { X, Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { statutColors } from '@/lib/mockData';
import { formatFCFA, formatDate } from '@/lib/format';

interface Commande {
  id: string;
  numero: string;
  clientNom: string;
  clientTelephone: string;
  clientEmail: string;
  statut: string;
  dateCommande: string;
  dateLivraisonSouhaitee: string;
  creneauHoraire: string;
  modeLivraison: string;
  adresseLivraison: string;
  montantTotal: number;
  paye: number;
  acompteRequis: number;
  notesInternes: string;
  produits: { nom: string; quantite: number; prixTotal: number; messageGateau?: string; personnalisations?: string[] }[];
}

interface Props {
  commande: Commande;
  onClose: () => void;
  onChangeStatut: (statut: string) => void;
}

const transitions: Record<string, { next: string; label: string }> = {
  EN_ATTENTE_CONFIRMATION: { next: 'CONFIRMEE', label: 'Confirmer' },
  CONFIRMEE: { next: 'EN_PRODUCTION', label: 'Marquer en production' },
  EN_PRODUCTION: { next: 'PRETE', label: 'Marquer prête' },
  PRETE: { next: 'LIVREE', label: 'Marquer livrée' },
};

export default function CommandeDetailSheet({ commande, onClose, onChangeStatut }: Props) {
  const [notes, setNotes] = useState(commande.notesInternes || '');
  const [statut, setStatut] = useState(commande.statut);
  const reste = commande.montantTotal - commande.paye;
  const st = statutColors[commande.statut];
  const transition = transitions[commande.statut];

  const change = (s: string) => {
    setStatut(s);
    onChangeStatut(s);
    toast.success('Statut mis à jour');
  };

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
          {/* Client */}
          <section className="space-y-2">
            <h3 className="font-display font-semibold text-sm">Client</h3>
            <p className="font-medium">{commande.clientNom}</p>
            <a href={`tel:${commande.clientTelephone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
              <Phone className="w-4 h-4" /> {commande.clientTelephone}
            </a>
            <a href={`mailto:${commande.clientEmail}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
              <Mail className="w-4 h-4" /> {commande.clientEmail}
            </a>
          </section>

          {/* Products */}
          <section>
            <h3 className="font-display font-semibold text-sm mb-2">Produits</h3>
            <div className="space-y-2">
              {commande.produits.map((p, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/40 text-sm">
                  <div className="flex justify-between"><span className="font-medium">{p.nom} ×{p.quantite}</span><span>{formatFCFA(p.prixTotal)}</span></div>
                  {p.messageGateau && <p className="text-xs text-muted-foreground italic mt-1">Message : "{p.messageGateau}"</p>}
                  {p.personnalisations && p.personnalisations.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">+ {p.personnalisations.join(', ')}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Delivery */}
          <section className="space-y-1 text-sm">
            <h3 className="font-display font-semibold text-sm mb-1">Livraison</h3>
            <p>📅 {formatDate(commande.dateLivraisonSouhaitee)} — {commande.creneauHoraire}</p>
            {commande.modeLivraison === 'LIVRAISON_DOMICILE' ? (
              <p className="flex items-start gap-1"><MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" /> {commande.adresseLivraison}</p>
            ) : (
              <p>🏪 Retrait sur place</p>
            )}
          </section>

          {/* Payment */}
          <section className="text-sm space-y-1">
            <h3 className="font-display font-semibold mb-1">Paiement</h3>
            <div className="flex justify-between"><span>Total</span><span className="font-semibold">{formatFCFA(commande.montantTotal)}</span></div>
            <div className="flex justify-between text-success"><span>Payé</span><span>{formatFCFA(commande.paye)}</span></div>
            {reste > 0 && <div className="flex justify-between text-destructive"><span>Reste</span><span>{formatFCFA(reste)}</span></div>}
          </section>

          {/* Status change */}
          <section>
            <Label>Changer le statut</Label>
            <Select value={statut} onValueChange={change}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EN_ATTENTE_CONFIRMATION">En attente</SelectItem>
                <SelectItem value="CONFIRMEE">Confirmée</SelectItem>
                <SelectItem value="EN_PRODUCTION">En production</SelectItem>
                <SelectItem value="PRETE">Prête</SelectItem>
                <SelectItem value="LIVREE">Livrée</SelectItem>
                <SelectItem value="ANNULEE">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </section>

          {/* Notes */}
          <section>
            <Label>Notes internes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" placeholder="Notes non visibles par le client" />
          </section>

          {/* Actions */}
          <div className="space-y-2">
            {transition && commande.statut !== 'ANNULEE' && (
              <Button onClick={() => change(transition.next)} className="w-full">{transition.label}</Button>
            )}
            {reste > 0 && (
              <Button variant="secondary" onClick={() => toast.info('Modal paiement à venir')} className="w-full">
                Enregistrer un paiement
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => window.open(`https://wa.me/${commande.clientTelephone.replace('+', '')}`, '_blank')}
              className="w-full gap-2"
            >
              <MessageCircle className="w-4 h-4" /> Contacter sur WhatsApp
            </Button>
            {commande.statut !== 'ANNULEE' && commande.statut !== 'LIVREE' && (
              <Button variant="ghost" onClick={() => change('ANNULEE')} className="w-full text-destructive hover:text-destructive">
                Annuler la commande
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
