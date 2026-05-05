import { useState } from 'react';
import { Search, Plus, Users, Phone, MapPin, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockClients } from '@/lib/mockData';
import ClientDetailSheet from '@/components/clients/ClientDetailSheet';

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
}

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const filtered = mockClients.filter(
    (c) =>
      c.nom.toLowerCase().includes(search.toLowerCase()) ||
      c.prenom.toLowerCase().includes(search.toLowerCase()) ||
      c.telephone.includes(search) ||
      c.ville.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground text-sm">{mockClients.length} client(s)</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Nouveau
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Rechercher par nom, téléphone ou ville..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <Card
            key={c.id}
            className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedClientId(c.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {c.prenom.charAt(0)}{c.nom.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{c.prenom} {c.nom}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" /> {c.ville}
                    </div>
                  </div>
                </div>
                {c.estVip && (
                  <Badge className="bg-warning/15 text-warning text-[10px] gap-1">
                    <Star className="w-3 h-3" /> VIP
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {c.telephone}
                </div>
                <span>{c.totalCommandes} commande(s)</span>
              </div>
              <div className="mt-2 pt-2 border-t border-border flex justify-between text-xs">
                <span className="text-muted-foreground">Total dépensé</span>
                <span className="font-semibold">{formatFCFA(c.totalDepense)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucun client trouvé</p>
          </div>
        )}
      </div>

      {selectedClientId && (
        <ClientDetailSheet
          client={mockClients.find((c) => c.id === selectedClientId)!}
          onClose={() => setSelectedClientId(null)}
        />
      )}
    </div>
  );
}
