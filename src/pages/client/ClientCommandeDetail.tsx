import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, RotateCw, Star, Edit, Save, Lock, Truck, Clock, CheckCircle2, CreditCard, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { commandeService, invoiceService } from '@/lib/services';
import { avisService } from '@/lib/avisService';
import { statutOrder } from '@/lib/constants';
import { formatFCFA, formatDate } from '@/lib/format';
import { LoadingState, ErrorState } from '@/components/common/StateViews';
import { useAuthStore } from '@/stores/authStore';
import { payWithKkiapay } from '@/lib/kkiapay';
import { SubmitReviewModal } from '@/components/client/SubmitReviewModal';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';


export default function ClientCommandeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateDate, setDuplicateDate] = useState(
    new Date(Date.now() + 86400000) // tomorrow
      .toISOString().split('T')[0]
  );

  const [reviewOpen, setReviewOpen] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editInstructions, setEditInstructions] = useState('');

  const { data: cmd, isLoading, isError, refetch } = useQuery({
    queryKey: ['commande', id],
    queryFn: () => commandeService.get(id!),
    enabled: !!id,
  });

  const mesAvisQ = useQuery({ queryKey: ['mes-avis'], queryFn: () => avisService.getMesAvis() });

  const balanceQ = useQuery({
    queryKey: ['commande-balance', id],
    queryFn: () => commandeService.balance(id!),
    enabled: !!id,
  });

  const invoicesQ = useQuery({
    queryKey: ['invoices', id],
    queryFn: () => invoiceService.getByCommande(id!),
    enabled: !!id,
  });
  const invoices = invoicesQ.data || [];



  const dupliquerMut = useMutation({
  mutationFn: (date: string) =>
    commandeService.dupliquer(id!, date),
  onSuccess: (data: any) => {
    toast.success('Commande dupliquée !');
    setShowDuplicateDialog(false);
    if (data?.id) navigate(`/app/commandes/${data.id}`);
    else navigate('/app/commandes');
  },
  onError: () =>
    toast.error('Erreur lors de la duplication'),
  });

  const editMut = useMutation({
    mutationFn: (payload: any) => commandeService.update(cmd!.id, payload),
    onSuccess: () => {
      toast.success('Commande modifiée');
      qc.invalidateQueries({ queryKey: ['commande', id] });
      qc.invalidateQueries({ queryKey: ['mes-commandes'] });
    },
    onError: () => toast.error('Impossible de modifier la commande'),
  });

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (isError || !cmd) return <div className="p-6"><ErrorState message="Commande introuvable" onRetry={refetch} /></div>;

  const currentStep = statutOrder.indexOf(cmd.status);
  const totalPaye = balanceQ.data?.totalPaye ?? cmd.totalPaye ?? cmd.paye ?? 0;
  const reste = balanceQ.data?.netProfit ?? ((cmd.totalAmount || 0) - totalPaye);

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

      {cmd.status === 'READY' && (
        <Card className="bg-purple-50 border-purple-200"><CardContent className="p-4 text-sm text-purple-800">🎉 Votre commande est prête !</CardContent></Card>
      )}
      {cmd.status === 'DELIVERED' && (() => {
        const productList: any[] = cmd.products || [];
        const mesAvis = mesAvisQ.data || [];
        const remaining = productList.filter(
          (p) => !mesAvis.some((a: any) => Number(a.productId ?? a.produitId) === Number(p.productId ?? p.id))
        );
        return (
          <Card className="bg-success/10 border-success/30">
            <CardContent className="p-4 space-y-3 text-sm">
              <p className="text-success"> Commande livrée. Merci pour votre confiance !</p>
              {remaining.length > 0 ? (
                <>
                  <p className="text-muted-foreground text-xs">Votre avis nous aide à nous améliorer.</p>
                  <Button onClick={() => setReviewOpen(true)} variant="outline" className="w-full gap-2">
                    <Star className="w-4 h-4 text-amber-500" /> Donner mon avis sur cette commande
                  </Button>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Avis envoyé ✓ Merci !</p>
              )}
            </CardContent>
          </Card>
        );
      })()}

      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-display font-semibold">Produits</h3>
          {(cmd.products || []).map((p: any, i: number) => (
            <div key={i} className="text-sm">
              <p className="font-medium">{p.productName} ×{p.quantity}</p>
              {p.cakeMessage && <p className="text-xs text-muted-foreground italic">Message : "{p.cakeMessage}"</p>}
              {p.customizationJson && (typeof p.customizationJson === 'string' ? p.customizationJson : p.customizationJson.length > 0) && (
                <p className="text-xs text-muted-foreground">Options : {typeof p.customizationJson === 'string' ? p.customizationJson : p.customizationJson.join(', ')}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-1 text-sm">
          <h3 className="font-display font-semibold mb-2">Livraison</h3>
          <p>📅 {formatDate(cmd.wishDeliveryDate)}</p>
          <p>🕐 {cmd.creneauHoraire}</p>
          <p>{cmd.deliveryMode === 'HOME_DELIVERY' ? `📍 ${cmd.deliveryAddress}` : '🏪 Retrait sur place'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-1 text-sm">
          <h3 className="font-display font-semibold mb-2">Paiement</h3>
          <div className="flex justify-between"><span>Montant total</span><span className="font-semibold">{formatFCFA(cmd.totalAmount || 0)}</span></div>
          <div className="flex justify-between text-success"><span>✓ Payé</span><span>{formatFCFA(totalPaye)}</span></div>
          {reste > 0 && (
            <>
              <div className="flex justify-between text-destructive"><span>⚠ Solde restant</span><span className="font-semibold">{formatFCFA(reste)}</span></div>
              <Button
                onClick={() => payWithKkiapay({
                  amount: reste,
                  commandeId: cmd.id,
                  clientInfo: {
                    telephone: user?.telephone,
                    name: user?.name || `${user?.prenom || ''} ${user?.nom || ''}`.trim(),
                    email: user?.email || '',
                  },
                })}
                className="w-full mt-3"
              >
                Payer le solde ({formatFCFA(reste)})
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {(() => {
        const fraisLivraison = cmd.fraisLivraison || 0;
        const fraisNonDefini = !!cmd.fraisLivraisonNonDefini && fraisLivraison === 0;
        const fraisDefiniNonPaye = fraisLivraison > 0 && cmd.fraisLivraisonPaye === false;
        const fraisPaye = fraisLivraison > 0 && cmd.fraisLivraisonPaye === true;
        return (
          <>
            {fraisDefiniNonPaye && (
              <Card className="border-2 border-primary/40 bg-primary/5">
                <CardContent className="p-4 space-y-3">
                  <p className="font-semibold text-sm flex items-center gap-2">
                    <Truck className="w-4 h-4 text-primary" /> Frais de livraison à régler
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Les frais pour votre quartier <strong className="text-foreground">{cmd.quartier}</strong> ont été définis :
                  </p>
                  <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                    <span className="text-sm">Frais de livraison</span>
                    <span className="font-bold text-primary text-lg">{formatFCFA(fraisLivraison)}</span>
                  </div>
                  <Button
                    className="w-full gap-2"
                    onClick={() => payWithKkiapay({
                      amount: fraisLivraison,
                      commandeId: cmd.id,
                      clientInfo: {
                        telephone: user?.telephone,
                        name: user?.name || `${user?.prenom || ''} ${user?.nom || ''}`.trim(),
                        email: user?.email || '',
                      },
                      onSuccess: () => {
                        toast.success('Frais de livraison payés !');
                        qc.invalidateQueries({ queryKey: ['commande', id] });
                      },
                    })}
                  >
                    <CreditCard className="w-4 h-4" /> Payer les frais ({formatFCFA(fraisLivraison)})
                  </Button>
                </CardContent>
              </Card>
            )}
            {fraisNonDefini && (
              <Card className="border border-amber-300 bg-amber-50">
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Frais de livraison en attente
                  </p>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Votre quartier <strong>{cmd.quartier}</strong> n'est pas encore répertorié.
                    Le service administratif vous contactera. Vous recevrez une notification et un email dès que les frais seront définis.
                  </p>
                </CardContent>
              </Card>
            )}
            {fraisPaye && (
              <div className="flex items-center gap-2 text-xs text-success p-2 bg-success/5 rounded-lg border border-success/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Frais de livraison payés ({formatFCFA(fraisLivraison)}) ✓
              </div>
            )}
          </>
        );
      })()}

      {(cmd.status === 'PENDING_CONFIRMATION' || cmd.status === 'DRAFT') ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-medium flex items-center gap-2">
              <Edit className="w-4 h-4 text-primary" />
              Modifier la commande
            </p>
            <p className="text-xs text-muted-foreground">
              Vous pouvez modifier votre commande tant qu'elle n'a pas été confirmée par la pâtissière.
            </p>
            <div>
              <Label className="text-xs">Date de livraison</Label>
              <Input
                type="date"
                defaultValue={cmd.wishDeliveryDate}
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                onChange={(e) => setEditDate(e.target.value)}
                className="mt-1"
              />
            </div>
            {cmd.deliveryMode === 'HOME_DELIVERY' && (
              <div>
                <Label className="text-xs">Adresse de livraison</Label>
                <Input
                  defaultValue={cmd.deliveryAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
            <div>
              <Label className="text-xs">Instructions spéciales</Label>
              <Textarea
                defaultValue={cmd.deliveryInstruction}
                onChange={(e) => setEditInstructions(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>
            <Button
              onClick={() => editMut.mutate({
                wishDeliveryDate: editDate || cmd.wishDeliveryDate,
                deliveryAddress: editAddress || cmd.deliveryAddress,
                deliveryInstruction: editInstructions || cmd.deliveryInstruction,
              })}
              disabled={editMut.isPending}
              className="w-full gap-2">
              <Save className="w-4 h-4" />
              {editMut.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        cmd.status !== 'DELIVERED' && cmd.status !== 'CANCELLED' && (
          <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
            La commande est confirmée — modifications non disponibles
          </p>
        )
      )}

      <Button
        variant="outline"
        onClick={() => setShowDuplicateDialog(true)}
        className="w-full gap-2">
        <RotateCw className="w-4 h-4" />
        Répéter cette commande
      </Button>

      {/* ── Duplicate dialog ── */}
      <Dialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Répéter la commande</DialogTitle>
            <DialogDescription>
              Les mêmes produits seront commandés.
              Choisissez la nouvelle date de livraison.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label htmlFor="duplicate-date" className="text-sm font-medium">
              Date de livraison souhaitée
            </label>
            <Input
              id="duplicate-date"
              type="date"
              value={duplicateDate}
              min={new Date(Date.now() + 86400000)
                .toISOString().split('T')[0]}
              onChange={(e) => setDuplicateDate(e.target.value)}
              className="mt-1"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDuplicateDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => dupliquerMut.mutate(duplicateDate)}
              disabled={dupliquerMut.isPending}>
              {dupliquerMut.isPending
                ? 'Duplication...'
                : 'Dupliquer la commande'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <SubmitReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        commandeId={Number(cmd.id)}
        products={(cmd.products || []).map((p: any) => ({
          productId: Number(p.productId ?? p.id),
          productName: p.productName || p.name,
          photoUrl: p.photoUrl,
        }))}
      />
    </div>
  );
}
