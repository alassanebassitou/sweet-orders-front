import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Check, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { commandeService } from '@/lib/services';
import { statutOrder } from '@/lib/constants';
import { formatFCFA, formatDate } from '@/lib/format';
import { LoadingState, ErrorState } from '@/components/common/StateViews';
import { cn } from '@/lib/utils';

export default function ClientCommandeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: cmd, isLoading, isError, refetch } = useQuery({
    queryKey: ['commande', id],
    queryFn: () => commandeService.get(id!),
    enabled: !!id,
  });

  const balanceQ = useQuery({
    queryKey: ['commande-balance', id],
    queryFn: () => commandeService.balance(id!),
    enabled: !!id,
  });

  const dupliquerMut = useMutation({
    mutationFn: () => commandeService.dupliquer(id!),
    onSuccess: (data: any) => {
      toast.success('Commande dupliquée');
      if (data?.id) navigate(`/app/commandes/${data.id}`); else navigate('/app/commandes');
    },
    onError: () => toast.error('Erreur lors de la duplication'),
  });

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (isError || !cmd) return <div className="p-6"><ErrorState message="Commande introuvable" onRetry={refetch} /></div>;

  const currentStep = statutOrder.indexOf(cmd.statut);
  const totalPaye = balanceQ.data?.totalPaye ?? cmd.totalPaye ?? cmd.paye ?? 0;
  const reste = balanceQ.data?.soldeRestant ?? ((cmd.montantTotal || 0) - totalPaye);

  return (
    <div className="p-4 md:p-6 space-y-5 animate-fade-in">
      <button onClick={() => navigate('/app/commandes')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      <div>
        <h1 className="font-display text-2xl font-bold">Commande {cmd.numero}</h1>
        <p className="text-muted-foreground text-sm">Passée le {formatDate(cmd.createdAt || cmd.dateCommande)}</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-1 overflow-x-auto">
            {['Reçue', 'Confirmée', 'En production', 'Prête', 'Livrée'].map((label, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              return (
                <div key={label} className="flex items-center gap-1 flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                      done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                      active && 'ring-4 ring-primary/20'
                    )}>
                      {done ? <Check className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className="text-[10px] mt-1 whitespace-nowrap">{label}</span>
                  </div>
                  {i < 4 && <div className={cn('h-px w-6', i < currentStep ? 'bg-primary' : 'bg-border')} />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {cmd.statut === 'PRETE' && (
        <Card className="bg-purple-50 border-purple-200"><CardContent className="p-4 text-sm text-purple-800">🎉 Votre commande est prête !</CardContent></Card>
      )}
      {cmd.statut === 'LIVREE' && (
        <Card className="bg-success/10 border-success/30"><CardContent className="p-4 text-sm text-success">✅ Commande livrée. Merci pour votre confiance !</CardContent></Card>
      )}

      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-display font-semibold">Produits</h3>
          {(cmd.produits || []).map((p: any, i: number) => (
            <div key={i} className="text-sm">
              <p className="font-medium">{p.nom} ×{p.quantite}</p>
              {p.messageGateau && <p className="text-xs text-muted-foreground italic">Message : "{p.messageGateau}"</p>}
              {p.personnalisations && (typeof p.personnalisations === 'string' ? p.personnalisations : p.personnalisations.length > 0) && (
                <p className="text-xs text-muted-foreground">Options : {typeof p.personnalisations === 'string' ? p.personnalisations : p.personnalisations.join(', ')}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-1 text-sm">
          <h3 className="font-display font-semibold mb-2">Livraison</h3>
          <p>📅 {formatDate(cmd.dateLivraisonSouhaitee)}</p>
          <p>🕐 {cmd.creneauHoraire}</p>
          <p>{cmd.modeLivraison === 'LIVRAISON_DOMICILE' ? `📍 ${cmd.adresseLivraison}` : '🏪 Retrait sur place'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-1 text-sm">
          <h3 className="font-display font-semibold mb-2">Paiement</h3>
          <div className="flex justify-between"><span>Montant total</span><span className="font-semibold">{formatFCFA(cmd.montantTotal || 0)}</span></div>
          <div className="flex justify-between text-success"><span>✓ Payé</span><span>{formatFCFA(totalPaye)}</span></div>
          {reste > 0 && (
            <>
              <div className="flex justify-between text-destructive"><span>⚠ Solde restant</span><span className="font-semibold">{formatFCFA(reste)}</span></div>
              <Button onClick={() => toast.info('Intégration Kkiapay à venir')} className="w-full mt-3">Payer le solde</Button>
            </>
          )}
        </CardContent>
      </Card>

      <Button variant="outline" onClick={() => dupliquerMut.mutate()} disabled={dupliquerMut.isPending} className="w-full gap-2">
        <RotateCw className="w-4 h-4" /> Répéter cette commande
      </Button>
    </div>
  );
}
