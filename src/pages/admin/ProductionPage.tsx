import { useState } from 'react';
import { Printer, ChefHat } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { mockCommandes } from '@/lib/mockData';
import { cn } from '@/lib/utils';

const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function getWeekDates() {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

export default function ProductionPage() {
  const week = getWeekDates();
  const [done, setDone] = useState<Record<string, boolean>>({});
  const today = new Date().toISOString().split('T')[0];

  // Use first 5 mock orders distributed across week
  const ordersByDay: Record<string, typeof mockCommandes> = {};
  week.forEach((d, i) => {
    ordersByDay[d] = mockCommandes.filter((_, idx) => idx % 7 === i);
  });

  const todayOrders = mockCommandes.slice(0, 4);

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
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
          <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
            {week.map((d, i) => {
              const orders = ordersByDay[d];
              const overload = orders.length > 5;
              return (
                <Card key={d} className={cn('shadow-sm', overload && 'border-warning bg-warning/5', d === today && 'ring-2 ring-primary')}>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">{days[i]}</p>
                    <p className="font-display text-lg font-bold">{new Date(d).getDate()}</p>
                    <p className="text-xs mt-2 font-semibold text-primary">{orders.length} cake(s)</p>
                    <div className="mt-2 space-y-1">
                      {orders.slice(0, 3).map((o) => (
                        <p key={o.id} className="text-[10px] text-muted-foreground truncate">{o.produits[0].nom}</p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
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
              {todayOrders.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <ChefHat className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>Rien à produire aujourd'hui</p>
                </div>
              ) : (
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
                    {todayOrders.flatMap((o) =>
                      o.produits.map((p, i) => {
                        const key = `${o.id}-${i}`;
                        return (
                          <tr key={key} className="border-t border-border">
                            <td className="p-3">
                              <Checkbox checked={!!done[key]} onCheckedChange={(v) => setDone((s) => ({ ...s, [key]: !!v }))} />
                            </td>
                            <td className={cn('p-3 font-medium', done[key] && 'line-through opacity-50')}>{p.nom}</td>
                            <td className="p-3">{p.quantite}</td>
                            <td className="p-3">{o.clientNom}</td>
                            <td className="p-3 text-xs text-muted-foreground">{p.messageGateau || '—'}</td>
                            <td className="p-3 text-xs text-muted-foreground">{o.numero}</td>
                          </tr>
                        );
                      })
                    )}
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
