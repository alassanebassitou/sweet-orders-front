import { useState } from 'react';
import { Phone, MapPin, Check, X as XIcon, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockCommandes } from '@/lib/mockData';
import { formatFCFA } from '@/lib/format';

export default function LivraisonsPage() {
  const [livraisons, setLivraisons] = useState(
    mockCommandes
      .filter((c) => c.modeLivraison === 'LIVRAISON_DOMICILE' && c.statut !== 'ANNULEE')
      .map((c, i) => ({ ...c, heure: ['09:00', '11:00', '14:00', '16:30'][i % 4], livre: c.statut === 'LIVREE' }))
  );

  const todayDeliveries = livraisons.slice(0, 4);

  const marquerLivre = (id: string) => {
    setLivraisons((prev) => prev.map((l) => (l.id === id ? { ...l, livre: true, statut: 'LIVREE' } : l)));
    toast.success('Livraison marquée comme livrée');
  };

  const marquerEchec = (id: string) => {
    toast.error('Livraison marquée comme échec — à reprogrammer');
  };

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold">Livraisons</h1>
        <p className="text-muted-foreground text-sm">Tournée du jour et calendrier</p>
      </div>

      <Tabs defaultValue="jour">
        <TabsList>
          <TabsTrigger value="jour">Tournée du jour</TabsTrigger>
          <TabsTrigger value="calendrier">Calendrier</TabsTrigger>
        </TabsList>

        <TabsContent value="jour" className="space-y-3 pt-4">
          {todayDeliveries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucune livraison aujourd'hui</p>
            </div>
          ) : (
            todayDeliveries.map((l) => {
              const reste = l.montantTotal - l.paye;
              return (
                <Card key={l.id} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-lg font-semibold text-primary">{l.heure}</span>
                          <span className="font-medium">{l.clientNom}</span>
                        </div>
                        <a href={`tel:${l.clientTelephone}`} className="flex items-center gap-1 text-sm text-muted-foreground mt-1 hover:text-primary">
                          <Phone className="w-3.5 h-3.5" /> {l.clientTelephone}
                        </a>
                        <p className="flex items-start gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {l.adresseLivraison}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{l.produits.map((p) => `${p.nom} ×${p.quantite}`).join(', ')}</p>
                        {reste > 0 && <p className="text-xs text-destructive font-semibold mt-1">À encaisser : {formatFCFA(reste)}</p>}
                      </div>
                    </div>
                    {!l.livre ? (
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" className="flex-1 gap-2 bg-success hover:bg-success/90" onClick={() => marquerLivre(l.id)}>
                          <Check className="w-4 h-4" /> Livré
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 gap-2 text-destructive" onClick={() => marquerEchec(l.id)}>
                          <XIcon className="w-4 h-4" /> Échec
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-success font-semibold mt-3">✓ Livrée</p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="calendrier" className="pt-4">
          <Card><CardContent className="p-8 text-center text-muted-foreground">
            <p className="font-medium">Vue calendrier mensuelle</p>
            <p className="text-sm mt-2">Intégration avec composant Calendar — à connecter à l'API</p>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
