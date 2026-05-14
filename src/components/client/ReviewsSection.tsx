import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { avisService } from '@/lib/avisService';
import { StarRating } from '@/components/ui/StarRating';
import { ReviewCard } from './ReviewCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface ReviewsSectionProps {
  produitId: number | string;
}

export function ReviewsSection({ produitId }: ReviewsSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['produit-avis', produitId],
    queryFn: () => avisService.getProduitAvis(Number(produitId)),
  });

  if (isLoading) {
    return <div className="space-y-2"><Skeleton className="h-20 w-full" /><Skeleton className="h-16 w-full" /></div>;
  }

  const total = data?.totalReview ?? data?.totalAvis ?? 0;
  const moyenne = data?.moyenneNote ?? 0;
  const distribution: Record<string, number> = data?.distribution || {};
  const avis: any[] = data?.avis || [];
  const displayed = showAll ? avis : avis.slice(0, 3);

  return (
    <section className="space-y-4">
      <h2 className="font-display font-semibold flex items-center gap-2">
        <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Avis clients
      </h2>

      {total === 0 ? (
        <div className="text-center py-8 border border-dashed border-border rounded-lg">
          <p className="text-sm text-muted-foreground">Aucun avis pour ce produit.</p>
          <p className="text-xs text-muted-foreground mt-1">Soyez le premier à laisser un avis !</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 p-4 bg-secondary/40 rounded-lg">
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-primary">{moyenne.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">/ 5</p>
            </div>
            <div className="flex-1 space-y-1">
              <StarRating value={moyenne} size="md" />
              <p className="text-xs text-muted-foreground">Basé sur {total} avis</p>
            </div>
          </div>

          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution[String(star)] || 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-6 text-muted-foreground">{star} ★</span>
                  <div className="flex-1 h-2 bg-muted rounded overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-12 text-right text-muted-foreground">{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>

          <div className="divide-y divide-border">
            {displayed.map((a: any) => <ReviewCard key={a.id} avis={a} />)}
          </div>

          {avis.length > 3 && !showAll && (
            <Button variant="outline" size="sm" onClick={() => setShowAll(true)} className="w-full">
              Voir plus d'avis ({avis.length - 3})
            </Button>
          )}
        </>
      )}
    </section>
  );
}

export default ReviewsSection;
