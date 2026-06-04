import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ClipboardList } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { commandeService } from '@/lib/services';
import { statutColors } from '@/lib/constants';
import { formatFCFA, formatDate } from '@/lib/format';
import { LoadingState, ErrorState } from '@/components/common/StateViews';
import { cn } from '@/lib/utils';

const tabs = [
  { value: 'ALL', label: 'Toutes' },
  { value: 'IN_PRODUCTION', label: 'En cours' },
  { value: 'DELIVERED', label: 'Livrées' },
  { value: 'CANCELLED', label: 'Annulées' },
];

export default function ClientMesCommandes() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('ALL');
  const { data: commandes = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['mes-commandes'],
    queryFn: commandeService.mesCommandes,
  });

  const filtered = (commandes as any[]).filter((c) => {
    if (tab === 'ALL') return true;
    if (tab === 'IN_PRODUCTION') return !['DELIVERED', 'CANCELLED'].includes(c.status);
    return c.status === tab;
  });

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <h1 className="font-display text-2xl md:text-3xl font-bold">Mes Commandes</h1>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((t) => (
          <button key={t.value} onClick={() => setTab(t.value)} className={cn(
            'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-colors',
            tab === t.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:bg-secondary'
          )}>{t.label}</button>
        ))}
      </div>

      {isLoading ? <LoadingState /> :
       isError ? <ErrorState onRetry={refetch} /> :
       filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucune commande</p>
          <Button onClick={() => navigate('/app/catalogue')} className="mt-4">Commander maintenant</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c: any) => {
            const st = statutColors[c.status];
            const paye = c.totalPaye ?? c.paye ?? 0;
            const reste = (c.totalAmount || 0) - paye;
            return (
              <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/app/commandes/${c.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{c.numero}</span>
                    <Badge variant="secondary" className={`${st?.bg} ${st?.text} text-[10px]`}>{st?.label}</Badge>
                  </div>
                  <p className="text-sm">{(c.products || []).map((p: any) => `${p.productName} ×${p.quantity}`).join(', ')}</p>
                  <p className="text-xs text-muted-foreground mt-1">📅 Livraison : {formatDate(c.wishDeliveryDate)}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <div>
                      <p className="font-bold text-sm">{formatFCFA(c.totalAmount || 0)}</p>
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
