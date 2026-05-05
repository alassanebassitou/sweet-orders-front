import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ClipboardList } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockCommandes, statutColors } from '@/lib/mockData';
import { formatFCFA, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const tabs = [
  { value: 'TOUTES', label: 'Toutes' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'LIVREE', label: 'Livrées' },
  { value: 'ANNULEE', label: 'Annulées' },
];

export default function ClientMesCommandes() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('TOUTES');

  const filtered = mockCommandes.filter((c) => {
    if (tab === 'TOUTES') return true;
    if (tab === 'EN_COURS') return !['LIVREE', 'ANNULEE'].includes(c.statut);
    return c.statut === tab;
  });

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <h1 className="font-display text-2xl md:text-3xl font-bold">Mes Commandes</h1>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-colors',
              tab === t.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:bg-secondary'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Vous n'avez pas encore de commandes</p>
          <Button onClick={() => navigate('/app/catalogue')} className="mt-4">Commander maintenant</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const st = statutColors[c.statut];
            const reste = c.montantTotal - c.paye;
            return (
              <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/app/commandes/${c.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{c.numero}</span>
                    <Badge variant="secondary" className={`${st?.bg} ${st?.text} text-[10px]`}>{st?.label}</Badge>
                  </div>
                  <p className="text-sm">{c.produits.map((p) => `${p.nom} ×${p.quantite}`).join(', ')}</p>
                  <p className="text-xs text-muted-foreground mt-1">📅 Livraison : {formatDate(c.dateLivraisonSouhaitee)}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <div>
                      <p className="font-bold text-sm">{formatFCFA(c.montantTotal)}</p>
                      {reste > 0 && <p className="text-xs text-destructive">Solde : {formatFCFA(reste)}</p>}
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs">Voir détail <ChevronRight className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
