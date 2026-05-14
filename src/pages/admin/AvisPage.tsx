import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { avisService } from '@/lib/avisService';
import { AdminReviewRow } from '@/components/admin/AdminReviewRow';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/StateViews';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'visible' | 'hidden';
type Sort = 'recent' | 'note_asc' | 'note_desc';

export default function AvisPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('recent');

  const { data: avis = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-avis'],
    queryFn: () => avisService.getAll(),
  });

  const filtered = useMemo(() => {
    let list = [...(avis as any[])];
    if (filter !== 'all') {
      list = list.filter((a) => {
        const hidden = a.hidden ?? a.cache ?? a.isHidden ?? false;
        return filter === 'visible' ? !hidden : hidden;
      });
    }
    list.sort((a, b) => {
      if (sort === 'note_asc') return (a.note || 0) - (b.note || 0);
      if (sort === 'note_desc') return (b.note || 0) - (a.note || 0);
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
    return list;
  }, [avis, filter, sort]);

  const filterBtn = (f: Filter, label: string) => (
    <button
      onClick={() => setFilter(f)}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
        filter === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:bg-secondary'
      )}
    >{label}</button>
  );

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold">Avis clients</h1>
        <p className="text-muted-foreground text-sm">{(avis as any[]).length} avis au total</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {filterBtn('all', 'Tous')}
          {filterBtn('visible', 'Visibles')}
          {filterBtn('hidden', 'Masqués')}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="ml-auto text-xs rounded-md border border-border bg-card px-3 py-1.5"
        >
          <option value="recent">Plus récents</option>
          <option value="note_desc">Note ↓</option>
          <option value="note_asc">Note ↑</option>
        </select>
      </div>

      {isLoading ? <LoadingState /> :
       isError ? <ErrorState onRetry={refetch} /> :
       filtered.length === 0 ? <EmptyState message="Aucun avis" icon={Star} /> : (
        <div className="space-y-3">
          {filtered.map((a) => <AdminReviewRow key={a.id} avis={a} />)}
        </div>
      )}
    </div>
  );
}
