import { useState, useMemo } from 'react';
import { Search, Filter, ShoppingBag } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CommandeDetailSheet from '@/components/admin/CommandeDetailSheet';
import { commandeService } from '@/lib/services';
import { statutColors } from '@/lib/constants';
import { formatFCFA } from '@/lib/format';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/StateViews';

export default function CommandesPage() {
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const qc = useQueryClient();

  const { data: commandes = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['commandes', statutFilter],
    queryFn: () => commandeService.listAdmin(statutFilter !== 'ALL' ? { statut: statutFilter } : {}),
  });

  const filtered = useMemo(() => commandes.filter((c: any) =>
    (c.clientNom || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.numero || '').toLowerCase().includes(search.toLowerCase())
  ), [commandes, search]);

  const selected = commandes.find((c: any) => c.id === selectedId) || null;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['commandes'] });
  };

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold">Commandes reçues</h1>
        <p className="text-muted-foreground text-sm">{commandes.length} commande(s) — gérez les commandes envoyées par les clients</p>
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

      {isLoading ? <LoadingState /> :
       isError ? <ErrorState message="Impossible de charger les commandes" onRetry={refetch} /> :
       filtered.length === 0 ? <EmptyState message="Aucune commande trouvée" icon={ShoppingBag} /> : (
        <div className="space-y-3">
          {filtered.map((c: any) => {
            const st = statutColors[c.status];
            const reste = (c.totalAmount || 0) - (c.totalPaye ?? c.paye ?? 0);
            return (
              <Card key={c.id} className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedId(c.id)}>
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selected && (
        <CommandeDetailSheet
          commande={selected}
          onClose={() => setSelectedId(null)}
          onUpdated={refresh}
        />
      )}
    </div>
  );
}
