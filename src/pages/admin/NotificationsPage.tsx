import { Bell, Check, CheckCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/lib/services';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/StateViews';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data: notifs = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.list,
  });

  console.log('Notifications:', notifs);

  const lireMut = useMutation({
    mutationFn: (id: any) => notificationService.marquerLue(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const lireAllMut = useMutation({
    mutationFn: () => notificationService.marquerToutesLues(),
    onSuccess: () => { toast.success('Toutes les notifications marquées comme lues'); qc.invalidateQueries({ queryKey: ['notifications'] }); },
  });

  return (
    <div className="p-4 md:p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground text-sm">Centre de notifications</p>
        </div>
        {notifs.length > 0 && (
          <Button variant="outline" size="sm" className="gap-2" onClick={() => lireAllMut.mutate()}>
            <CheckCheck className="w-4 h-4" /> Tout lire
          </Button>
        )}
      </div>

      {isLoading ? <LoadingState /> :
       isError ? <ErrorState onRetry={refetch} /> :
       notifs.length === 0 ? <EmptyState message="Aucune notification" icon={Bell} /> : (
        <div className="space-y-2">
          {notifs.map((n: any) => (
            <Card key={n.id} className={cn(!n.isRead && 'border-primary/40 bg-primary/5')}>
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{n.type} — {new Date(n.createdAt).toLocaleString('fr-FR')}</p>
                </div>
                {!n.isRead && (
                  <Button size="icon" variant="ghost" onClick={() => lireMut.mutate(n.id)}>
                    <Check className="w-4 h-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
