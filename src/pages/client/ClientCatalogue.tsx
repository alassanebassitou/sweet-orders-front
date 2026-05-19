import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CakeSlice } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { productService, categoryService } from '@/lib/services';
import { ProductRatingBadge } from '@/components/client/ProductRatingBadge';
import { formatFCFA } from '@/lib/format';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/StateViews';
import { cn } from '@/lib/utils';

export default function ClientCatalogue() {
  const navigate = useNavigate();
  const [cat, setCat] = useState('all');
  const { data: products = [], isLoading, isError, refetch } = useQuery({ queryKey: ['products'], queryFn: productService.list });
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const filtered = (products as any[])
    .filter((p) => p.isActif !== false)
    .filter((p) =>
      cat === 'all' /* ||
      p.categoryId?.toString() === cat 
      || p.categorie === cat  */
      || p.category === cat
    );

    console.log("Products: ", products);
    console.log("Categories: ", categories);
    console.log("Filtered: ", filtered);

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Notre Catalogue</h1>
        <p className="text-muted-foreground text-sm">Choisissez votre douceur</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        <button
          onClick={() => setCat('all')}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-colors',
            cat === 'all'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card border-border text-muted-foreground hover:bg-secondary'
          )}
        >
          Tous
        </button>
        {(categories as any[]).map((c) => {
          const value = c.name;
          const active = cat === value;
          return (
            <button
              key={c.id}
              onClick={() => setCat(value)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-colors flex items-center gap-2',
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border text-muted-foreground hover:bg-secondary'
              )}
            >
              {c.photoUrl && (
                <img src={c.photoUrl} alt={c.name} className="w-4 h-4 rounded-full object-cover" />
              )}
              {c.name}
            </button>
          );
        })}
      </div>

      {isLoading ? <LoadingState /> :
       isError ? <ErrorState onRetry={refetch} /> :
       filtered.length === 0 ? <EmptyState message="Aucun produit" icon={CakeSlice} /> : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {filtered.map((p: any) => (
            <Card key={p.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/app/catalogue/${p.id}`)}>
              <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                {p.photoUrl ? <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" /> : <CakeSlice className="w-12 h-12 text-primary/60" />}
              </div>
              <CardContent className="p-3 space-y-1">
                <h3 className="font-medium text-sm">{p.name}</h3>
                <ProductRatingBadge produitId={p.id} />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-semibold text-primary">{formatFCFA(p.basePrice)}</span>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">Voir</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
