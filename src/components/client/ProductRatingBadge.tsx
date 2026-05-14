import { useQuery } from '@tanstack/react-query';
import { avisService } from '@/lib/avisService';
import { StarRating } from '@/components/ui/StarRating';

export function ProductRatingBadge({ produitId }: { produitId: number | string }) {
  const { data } = useQuery({
    queryKey: ['produit-avis', produitId],
    queryFn: () => avisService.getProduitAvis(Number(produitId)),
    staleTime: 5 * 60 * 1000,
  });
  const total = data?.totalReview ?? data?.totalAvis ?? 0;
  const moyenne = data?.moyenneNote ?? 0;

  if (total === 0) {
    return <span className="text-[10px] text-muted-foreground">Pas encore d'avis</span>;
  }
  return (
    <div className="flex items-center gap-1 text-[10px]">
      <StarRating value={moyenne} size="sm" />
      <span className="text-muted-foreground">{moyenne.toFixed(1)} ({total})</span>
    </div>
  );
}

export default ProductRatingBadge;
