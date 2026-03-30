import { X, Phone, Mail, MapPin, Star, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockCommandes, statutColors } from '@/lib/mockData';

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
}

interface Client {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  ville: string;
  adresse: string;
  estVip: boolean;
  remiseVip: number;
  totalCommandes: number;
  totalDepense: number;
  dateAnniversaire?: string;
}

interface Props {
  client: Client;
  onClose: () => void;
}

export default function ClientDetailSheet({ client, onClose }: Props) {
  const clientCommandes = mockCommandes.filter((c) => c.clientId === client.id);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-card shadow-xl animate-slide-in-right overflow-y-auto">
        <div className="sticky top-0 bg-card z-10 flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display text-lg font-semibold">Fiche client</h2>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary mb-3">
              {client.prenom.charAt(0)}{client.nom.charAt(0)}
            </div>
            <h3 className="font-display text-xl font-bold">{client.prenom} {client.nom}</h3>
            {client.estVip && (
              <Badge className="bg-warning/15 text-warning gap-1 mt-2"><Star className="w-3 h-3" /> VIP — {client.remiseVip}% remise</Badge>
            )}
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <a href={`tel:${client.telephone}`} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 text-sm hover:bg-secondary transition-colors">
              <Phone className="w-4 h-4 text-primary" />{client.telephone}
            </a>
            <a href={`mailto:${client.email}`} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 text-sm hover:bg-secondary transition-colors">
              <Mail className="w-4 h-4 text-primary" />{client.email}
            </a>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 text-sm">
              <MapPin className="w-4 h-4 text-primary" />{client.adresse}, {client.ville}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-primary/5 text-center">
              <p className="text-2xl font-bold font-display text-primary">{client.totalCommandes}</p>
              <p className="text-xs text-muted-foreground">Commandes</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/5 text-center">
              <p className="text-lg font-bold font-display text-primary">{formatFCFA(client.totalDepense)}</p>
              <p className="text-xs text-muted-foreground">Total dépensé</p>
            </div>
          </div>

          {/* Historique */}
          <div>
            <h4 className="font-display font-semibold mb-3">Historique des commandes</h4>
            {clientCommandes.length > 0 ? (
              <div className="space-y-2">
                {clientCommandes.map((c) => {
                  const st = statutColors[c.statut];
                  return (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div>
                        <p className="text-sm font-medium">{c.numero}</p>
                        <p className="text-xs text-muted-foreground">{c.dateLivraisonSouhaitee}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className={`${st?.bg} ${st?.text} text-[10px]`}>{st?.label}</Badge>
                        <p className="text-xs font-medium mt-1">{formatFCFA(c.montantTotal)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune commande</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button className="flex-1 gap-2" onClick={() => window.open(`https://wa.me/${client.telephone.replace('+', '')}`, '_blank')}>
              WhatsApp
            </Button>
            <Button variant="outline" className="flex-1 gap-2">
              <ShoppingBag className="w-4 h-4" /> Nouvelle commande
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
