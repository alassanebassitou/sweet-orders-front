import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Eye, EyeOff, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ui/StarRating';
import { relativeTime, shortenName } from '@/lib/relativeTime';
import { avisService } from '@/lib/avisService';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

export function AdminReviewRow({ avis }: { avis: any }) {
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const hidden = !avis.isVisible;
  const initial = (avis.clientName || '?').trim().charAt(0).toUpperCase();

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-avis'] });

  const hideMut = useMutation({
    mutationFn: () => avisService.hide(avis.id),
    onSuccess: () => { invalidate(); toast.success('Avis masqué'); },
    onError: () => toast.error('Erreur'),
  });
  const restoreMut = useMutation({
    mutationFn: () => avisService.restore(avis.id),
    onSuccess: () => { invalidate(); toast.success('Avis restauré'); },
    onError: () => toast.error('Erreur'),
  });
  const deleteMut = useMutation({
    mutationFn: () => avisService.delete(avis.id),
    onSuccess: () => { invalidate(); toast.success('Avis supprimé'); setConfirmOpen(false); },
    onError: () => toast.error('Erreur'),
  });

  return (
    <>
      <div className={cn('p-4 border border-border rounded-lg space-y-3', hidden && 'bg-muted/40 opacity-70')}>
        <div className="flex items-start gap-3">
          {avis.clientPhotoUrl ? (
            <img src={avis.clientPhotoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-sm font-semibold text-primary">
              {initial}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{shortenName(avis.clientName)}</span>
              <span className="text-xs text-muted-foreground">— {avis.productName || `Produit #${avis.productId}`}</span>
              {hidden && <Badge variant="secondary" className="text-[10px]">MASQUÉ</Badge>}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <StarRating value={avis.note || 0} size="sm" />
              <span className="text-xs text-muted-foreground">{relativeTime(avis.createdAt)}</span>
            </div>
            {avis.comment && <p className="text-sm mt-2 text-foreground/90">{avis.comment}</p>}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {hidden ? (
            <Button
              size="sm"
              onClick={() => restoreMut.mutate()}
              disabled={restoreMut.isPending}
              className="gap-1.5 bg-green-100 text-green-700 hover:bg-green-200 border border-green-300"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restaurer
            </Button>
          ) : (
            <>
              <Badge variant="outline" className="gap-1 text-green-700 border-green-300 bg-green-50">
                <Eye className="w-3 h-3" /> Visible
              </Badge>
              <Button
                size="sm"
                onClick={() => hideMut.mutate()}
                disabled={hideMut.isPending}
                className="gap-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-300"
              >
                <EyeOff className="w-3.5 h-3.5" /> Masquer
              </Button>
            </>
          )}
          <Button
            size="sm"
            onClick={() => setConfirmOpen(true)}
            className="gap-1.5 bg-red-100 text-red-700 hover:bg-red-200 border border-red-300"
          >
            <Trash2 className="w-3.5 h-3.5" /> Supprimer
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet avis ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est définitive.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMut.mutate()} className="bg-destructive hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default AdminReviewRow;
