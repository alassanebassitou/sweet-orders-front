import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CakeSlice } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StarRating } from '@/components/ui/StarRating';
import { avisService } from '@/lib/avisService';

interface ProductLine {
  productId: number;
  productName: string;
  photoUrl?: string;
}

interface SubmitReviewModalProps {
  open: boolean;
  onClose: () => void;
  commandeId: number;
  products: ProductLine[];
  onSubmitted?: () => void;
}

export function SubmitReviewModal({ open, onClose, commandeId, products, onSubmitted }: SubmitReviewModalProps) {
  const qc = useQueryClient();
  const initial = useMemo(
    () => products.map((p) => ({ productId: p.productId, note: 0, comment: '' })),
    [products]
  );
  const [reviews, setReviews] = useState(initial);

  const update = (i: number, patch: Partial<typeof initial[number]>) =>
    setReviews((r) => r.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  const submitMut = useMutation({
    mutationFn: async () => {
      for (const r of reviews) {
        if (r.note === 0) continue;
        await avisService.submit({
          productId: r.productId,
          commandeId,
          note: r.note,
          comment: r.comment || undefined,
        });
      }
    },
    onSuccess: () => {
      toast.success('Merci pour votre avis ! 🌟');
      qc.invalidateQueries({ queryKey: ['mes-avis'] });
      reviews.forEach((r) => qc.invalidateQueries({ queryKey: ['produit-avis', r.productId] }));
      onSubmitted?.();
      onClose();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || '';
      if (/already|deja|déjà/i.test(msg)) toast.error('Vous avez déjà noté ce produit');
      else if (/purchas|achet|reçu/i.test(msg)) toast.error('Vous ne pouvez noter que les produits reçus');
      else toast.error("Erreur lors de l'envoi de votre avis");
    },
  });

  const handleSubmit = () => {
    if (reviews.every((r) => r.note === 0)) {
      toast.error('Veuillez attribuer une note à au moins un produit');
      return;
    }
    if (reviews.some((r) => r.note === 0)) {
      toast.error('Veuillez noter chaque produit');
      return;
    }
    submitMut.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Votre avis</DialogTitle></DialogHeader>
        <div className="space-y-5">
          {products.map((p, i) => (
            <div key={p.productId} className="space-y-3 pb-4 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                {p.photoUrl ? (
                  <img src={p.photoUrl} alt={p.productName} className="w-14 h-14 rounded-lg object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-primary/15 flex items-center justify-center">
                    <CakeSlice className="w-6 h-6 text-primary" />
                  </div>
                )}
                <p className="font-medium">{p.productName}</p>
              </div>
              <div>
                <Label className="text-xs">Votre note *</Label>
                <div className="mt-1.5">
                  <StarRating value={reviews[i]?.note || 0} onChange={(v) => update(i, { note: v })} size="lg" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Votre commentaire (optionnel)</Label>
                <Textarea
                  rows={4}
                  maxLength={500}
                  placeholder="Décrivez votre expérience..."
                  value={reviews[i]?.comment || ''}
                  onChange={(e) => update(i, { comment: e.target.value })}
                  className="mt-1"
                />
                <p className="text-[10px] text-muted-foreground mt-1 text-right">
                  {reviews[i]?.comment?.length || 0}/500
                </p>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitMut.isPending}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={submitMut.isPending}>
            {submitMut.isPending ? 'Envoi...' : 'Envoyer mon avis'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SubmitReviewModal;
