import { useMemo, useState } from 'react';
import { Printer, ChefHat } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { productionService } from '@/lib/services';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/StateViews';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function getMonday() {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));
  return monday;
}

export default function ProductionPage() {
  const qc = useQueryClient();
  const monday = useMemo(getMonday, []);
  const dateDebut = monday.toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];

  const planningQ = useQuery({
    queryKey: ['planning', dateDebut],
    queryFn: () => productionService.planning(dateDebut),
  });
  const ficheQ = useQuery({
    queryKey: ['fiche-jour', today],
    queryFn: () => productionService.ficheJour(today),
  });

  const terminerMut = useMutation({
    mutationFn: (commandeId: any) => productionService.terminer(commandeId),
    onSuccess: () => { toast.success('Marqué terminé'); qc.invalidateQueries({ queryKey: ['fiche-jour'] }); },
    onError: () => toast.error('Erreur'),
  });

  // Group planning by date
  const byDay: Record<string, any[]> = {};
  (planningQ.data || []).forEach((item: any) => {
    const d = item.date || item.wishDeliveryDate;
    if (!d) return;
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(item);
  });

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const formData = ficheQ.data;
  const todayItems: any[] = formData?.lines || [];
  const totalCakes: number = formData?.totalCakes || 0;
  const isSurcharge: boolean = formData?.surcharge || false;

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      {isSurcharge && (
        <div className="bg-orange-100 border border-orange-300 text-orange-800 px-4 py-2 rounded mb-4">
          ⚠️ Capacité dépassée — {totalCakes} cakes aujourd'hui
        </div>
      )}
      <div>
        <h1 className="font-display text-2xl font-bold">Production</h1>
        <p className="text-muted-foreground text-sm">Planning et fiche du jour</p>
      </div>

      <Tabs defaultValue="planning">
        <TabsList>
          <TabsTrigger value="planning">Planning semaine</TabsTrigger>
          <TabsTrigger value="jour">Fiche du jour</TabsTrigger>
        </TabsList>

        <TabsContent value="planning" className="space-y-3 pt-4">
          {planningQ.isLoading ? <LoadingState /> :
           planningQ.isError ? <ErrorState onRetry={planningQ.refetch} /> : (
            <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
              {week.map((d, i) => {
                const orders = byDay[d] || [];
                const overload = orders.length > 5;
                return (
                  <Card key={d} className={cn('shadow-sm', overload && 'border-warning bg-warning/5', d === today && 'ring-2 ring-primary')}>
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground">{days[i]}</p>
                      <p className="font-display text-lg font-bold">{new Date(d).getDate()}</p>
                      <p className="text-xs mt-2 font-semibold text-primary">{orders.length} cake(s)</p>
                      <div className="mt-2 space-y-1">
                        {orders.slice(0, 3).map((o: any, idx: number) => (
                          <p key={idx} className="text-[10px] text-muted-foreground truncate">{o.produits?.[0]?.name || o.productName || o.numero}</p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="jour" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <h2 className="font-display font-semibold">Production d'aujourd'hui</h2>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
              <Printer className="w-4 h-4" /> Imprimer
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {ficheQ.isLoading ? <LoadingState /> :
               ficheQ.isError ? <ErrorState onRetry={ficheQ.refetch} /> :
               todayItems.length === 0 ? <EmptyState message="Rien à produire aujourd'hui" icon={ChefHat} /> : (
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50 text-xs text-muted-foreground">
                    <tr>
                      <th className="p-3 text-left">✓</th>
                      <th className="p-3 text-left">Produit</th>
                      <th className="p-3 text-left">Qté</th>
                      <th className="p-3 text-left">Client</th>
                      <th className="p-3 text-left">Personnalisation</th>
                      <th className="p-3 text-left">N°</th>
                    </tr>
                  </thead>
                  <tbody>
                  {todayItems.flatMap((ligne: any, i: number) => {
                    const key = `${ligne.commandeId}-${i}`;
                    const done = ligne.isFinished === true;
                    return (
                      <tr key={key} className="border-t border-border">
                        <td className="p-3">
                          <Checkbox
                            checked={done}
                            onCheckedChange={() =>
                              terminerMut.mutate(ligne.commandeId)
                            }
                          />
                        </td>
                        <td className={cn('p-3 font-medium',
                            done && 'line-through opacity-50')}>
                          {ligne.productName}
                        </td>
                        <td className="p-3">
                          {ligne.quantity}  
                        </td>
                        <td className="p-3">
                          {ligne.clientName} 
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {ligne.cakeMessage || '—'}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {ligne.noCommande}
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
