import { useState } from 'react';
import { Phone, MapPin, Check, X as XIcon, Truck, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { deliveriesService } from '@/lib/services';
import { formatFCFA } from '@/lib/format';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/StateViews';

export default function LivraisonsPage() {
  const qc = useQueryClient();
  const today = new Date();
  const [mois, setMois] = useState(today.getMonth() + 1);
  const [annee, setAnnee] = useState(today.getFullYear());

  const { data: tournee = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['livraisons-aujourd-hui'],
    queryFn: deliveriesService.aujourdhui,
  });

  const calendrierQ = useQuery({
    queryKey: ['livraisons-calendrier', mois, annee],
    queryFn: () => deliveriesService.calendrier(mois, annee),
  });

  const livrerMut = useMutation({
    mutationFn: (id: any) => deliveriesService.livrer(id),
    onSuccess: () => { toast.success('Livraison validée'); qc.invalidateQueries({ queryKey: ['livraisons-aujourd-hui'] }); },
    onError: () => toast.error('Erreur'),
  });

  const [echecOpen, setEchecOpen] = useState<any | null>(null);
  const [echecRaison, setEchecRaison] = useState('');
  const [echecNotes, setEchecNotes] = useState('');
  const echecMut = useMutation({
    mutationFn: ({ id, raison, notes }: any) => deliveriesService.echec(id, raison, notes),
    onSuccess: () => { toast.success('Échec enregistré'); setEchecOpen(null); qc.invalidateQueries({ queryKey: ['livraisons-aujourd-hui'] }); },
    onError: () => toast.error('Erreur'),
  });

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
          {isLoading ? <LoadingState /> :
           isError ? <ErrorState message="Impossible de charger les livraisons" onRetry={refetch} /> :
           tournee.length === 0 ? <EmptyState message="Aucune livraison aujourd'hui" icon={Truck} /> :
           tournee.map((l: any) => {
            const livre = l.status === 'DELIVERED';
            return (
              <Card key={l.id} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-lg font-semibold text-primary">{l.heurePrevue}</span>
                        <span className="font-medium">{l.clientName}</span>
                      </div>
                      {l.clientPhone && (
                        <a href={`tel:${l.clientPhone}`} className="flex items-center gap-1 text-sm text-muted-foreground mt-1 hover:text-primary">
                          <Phone className="w-3.5 h-3.5" /> {l.clientPhone}
                        </a>
                      )}
                      <p className="flex items-start gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {l.deliveryAddress}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{(l.products || []).join(', ')}</p>
                      {l.remainingBalance > 0 && <p className="text-xs text-destructive font-semibold mt-1">À encaisser : {formatFCFA(l.remainingBalance)}</p>}
                    </div>
                  </div>
                  {!livre ? (
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" className="flex-1 gap-2 bg-success hover:bg-success/90" onClick={() => livrerMut.mutate(l.id)}>
                        <Check className="w-4 h-4" /> Livré
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 gap-2 text-destructive" onClick={() => setEchecOpen(l)}>
                        <XIcon className="w-4 h-4" /> Échec
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-success mt-3 font-semibold flex items-center gap-1"><Check className="w-4 h-4" /> Livré</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="calendrier" className="pt-4">
          <Card><CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <CalendarIcon className="w-5 h-5 text-primary" />
              <Input type="month" value={`${annee}-${String(mois).padStart(2, '0')}`} onChange={(e) => {
                const [y, m] = e.target.value.split('-');
                setAnnee(parseInt(y, 10)); setMois(parseInt(m, 10));
              }} className="w-48" />
            </div>
            {calendrierQ.isLoading ? <LoadingState /> :
             (calendrierQ.data || []).length === 0 ? <EmptyState message="Aucune livraison ce mois-ci" icon={Truck} /> : (
              <div className="space-y-2">
                {calendrierQ.data.map((l: any) => (
                  <div key={l.id} className="flex justify-between text-sm p-2 border-b border-border">
                    <span>{l.expectedDate} {l.expectedHour}</span>
                    <span className="font-medium">{l.clientName}</span>
                    <span className="text-muted-foreground">{l.deliveryAddress}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!echecOpen} onOpenChange={(o) => !o && setEchecOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Signaler un échec de livraison</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Raison</Label><Input value={echecRaison} onChange={(e) => setEchecRaison(e.target.value)} className="mt-1" /></div>
            <div><Label>Notes</Label><Textarea value={echecNotes} onChange={(e) => setEchecNotes(e.target.value)} className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEchecOpen(null)}>Annuler</Button>
            <Button onClick={() => echecMut.mutate({ id: echecOpen.id, raison: echecRaison, notes: echecNotes })}>Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
