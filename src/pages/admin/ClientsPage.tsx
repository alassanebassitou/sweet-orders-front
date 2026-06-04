import { useState } from 'react';
import { Search, Plus, Users, Phone, MapPin, Star, Eye, UserCheck, UserX } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { userService } from '@/lib/services';
import { formatFCFA } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ClientDetailSheet from '@/components/clients/ClientDetailSheet';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/StateViews';
// Come back to update client info and commandes in the detail sheet, and add possibility to create new client from the page (with a form in a sheet)
export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const { data: users = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => userService.listAdmin(),
  });

  const clients = users.filter((u: any) => u.role === 'ROLE_CLIENT');
  const filtered = clients.filter((c: any) =>
    [c.name, c.firstname, c.telephone, c.city, c.email].filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase())
  );
  const selected = clients.find((c: any) => c.id === selectedClientId);

  console.log("clients", clients);
  console.log("filtered", filtered);

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground text-sm">{clients.length} client(s)</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" /> Nouveau</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Rechercher par nom, téléphone ou ville..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? <LoadingState /> :
       isError ? <ErrorState message="Impossible de charger les clients" onRetry={refetch} /> :
       filtered.length === 0 ? <EmptyState message="Aucun client trouvé" icon={Users} /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c: any) => (
            <Card key={c.id} className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedClientId(c.id)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {(c.firstname?.charAt(0) || '')}{(c.lastname?.charAt(0) || c.name?.charAt(0) || '')}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{c.firstname} {c.lastname || c.name}</p>
                      {c.city && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" /> {c.city}
                        </div>
                      )}
                    </div>
                  </div>
                  {(c.estVip || c.isVIP) && (
                    <Badge className="bg-warning/15 text-warning text-[10px] gap-1">
                      <Star className="w-3 h-3" /> VIP
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {c.telephone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.telephone}</div>}
                  <span>{c.totalCommande ?? 0} commande(s)</span>
                </div>
                <div className="mt-2 pt-2 border-t border-border flex justify-between text-xs">
                  <span className="text-muted-foreground">Total dépensé</span>
                  <span className="font-semibold">{formatFCFA(c.totalExpenses ?? 0)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selected && <ClientDetailSheet client={selected} onClose={() => setSelectedClientId(null)} />}
    </div>
  );
}
