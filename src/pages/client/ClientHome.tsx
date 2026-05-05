import { useNavigate } from 'react-router-dom';
import { CakeSlice, ClipboardList, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { mockCommandes, mockProduits, statutColors } from '@/lib/mockData';
import { formatFCFA, formatDate } from '@/lib/format';

export default function ClientHome() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  // Mock: only show "client-1" orders, fall back to all for demo richness
  const activeOrders = mockCommandes.filter((c) => !['LIVREE', 'ANNULEE'].includes(c.statut)).slice(0, 3);

  return (
    <div className="p-4 md:p-6 space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">
          Bonjour {user?.prenom || user?.nom} 👋
        </h1>
        <p className="text-muted-foreground">Que souhaitez-vous commander aujourd'hui&nbsp;?</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/app/catalogue')}
          className="group p-6 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-border text-left hover:shadow-md transition-all"
        >
          <CakeSlice className="w-8 h-8 text-primary mb-3" />
          <h3 className="font-display text-lg font-semibold mb-1">Commander</h3>
          <p className="text-sm text-muted-foreground">Parcourir le catalogue</p>
        </button>
        <button
          onClick={() => navigate('/app/commandes')}
          className="group p-6 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border border-border text-left hover:shadow-md transition-all"
        >
          <ClipboardList className="w-8 h-8 text-accent mb-3" />
          <h3 className="font-display text-lg font-semibold mb-1">Mes commandes</h3>
          <p className="text-sm text-muted-foreground">Suivre l'état de mes commandes</p>
        </button>
      </div>

      <section>
        <h2 className="font-display text-xl font-semibold mb-3">Commandes en cours</h2>
        {activeOrders.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">
            <p>Aucune commande en cours</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {activeOrders.map((c) => {
              const st = statutColors[c.statut];
              return (
                <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/app/commandes/${c.id}`)}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{c.numero}</span>
                        <Badge variant="secondary" className={`${st?.bg} ${st?.text} text-[10px]`}>{st?.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">📅 {formatDate(c.dateLivraisonSouhaitee)}</p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="font-semibold text-sm">{formatFCFA(c.montantTotal)}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl font-semibold">À découvrir</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/catalogue')}>
            Tout voir <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {mockProduits.slice(0, 3).map((p) => (
            <Card key={p.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/app/catalogue/${p.id}`)}>
              <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <CakeSlice className="w-10 h-10 text-primary/60" />
              </div>
              <CardContent className="p-3">
                <h3 className="font-medium text-sm">{p.nom}</h3>
                <p className="text-xs text-primary font-semibold mt-1">{formatFCFA(p.prixBase)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
