import { useState } from 'react';
import { Search, Plus, Filter, ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockCommandes, statutColors } from '@/lib/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import NouvelleCommandeWizard from '@/components/commandes/NouvelleCommandeWizard';

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
}

export default function CommandesPage() {
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('ALL');
  const [showWizard, setShowWizard] = useState(false);

  const filtered = mockCommandes.filter((c) => {
    const matchSearch = c.clientNom.toLowerCase().includes(search.toLowerCase()) || c.numero.toLowerCase().includes(search.toLowerCase());
    const matchStatut = statutFilter === 'ALL' || c.statut === statutFilter;
    return matchSearch && matchStatut;
  });

  if (showWizard) {
    return <NouvelleCommandeWizard onClose={() => setShowWizard(false)} />;
  }

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Commandes</h1>
          <p className="text-muted-foreground text-sm">{mockCommandes.length} commande(s)</p>
        </div>
        <Button onClick={() => setShowWizard(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Nouvelle
        </Button>
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
            <SelectItem value="EN_ATTENTE_CONFIRMATION">En attente</SelectItem>
            <SelectItem value="CONFIRMEE">Confirmée</SelectItem>
            <SelectItem value="EN_PRODUCTION">En production</SelectItem>
            <SelectItem value="PRETE">Prête</SelectItem>
            <SelectItem value="LIVREE">Livrée</SelectItem>
            <SelectItem value="ANNULEE">Annulée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((c) => {
          const st = statutColors[c.statut];
          const resteAPayer = c.montantTotal - c.paye;
          return (
            <Card key={c.id} className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ShoppingBag className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{c.numero}</span>
                        <Badge variant="secondary" className={`${st?.bg} ${st?.text} text-[10px]`}>{st?.label}</Badge>
                        {c.estUrgent && <Badge variant="destructive" className="text-[10px]">Urgent</Badge>}
                      </div>
                      <p className="text-sm text-foreground mt-0.5">{c.clientNom}</p>
                      <p className="text-xs text-muted-foreground">{c.produits.map(p => `${p.nom} x${p.quantite}`).join(', ')}</p>
                      <p className="text-xs text-muted-foreground mt-1">📅 Livraison: {c.dateLivraisonSouhaitee}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm">{formatFCFA(c.montantTotal)}</p>
                    {resteAPayer > 0 && (
                      <p className="text-xs text-destructive mt-1">Reste: {formatFCFA(resteAPayer)}</p>
                    )}
                    {resteAPayer === 0 && (
                      <p className="text-xs text-success mt-1">Payé ✓</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucune commande trouvée</p>
          </div>
        )}
      </div>
    </div>
  );
}
