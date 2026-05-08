import { Bell, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { notificationService } from '@/lib/services';
import { cn } from '@/lib/utils';

export default function NotificationBell() {
  const qc = useQueryClient();

  const { data: countData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: notificationService.count,
    refetchInterval: 30000,
  });

  const { data: list = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.list,
  });

  const markRead = useMutation({
    mutationFn: (id: string | number) => notificationService.marquerLue(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notif-count'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAll = useMutation({
    mutationFn: () => notificationService.marquerToutesLues(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notif-count'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unread = countData?.nonLues ?? 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-secondary" aria-label="Notifications">
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <p className="font-display font-semibold text-sm">Notifications</p>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={() => markAll.mutate()} className="h-7 text-xs gap-1">
              <Check className="w-3 h-3" /> Tout marquer lu
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {list.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-8">Aucune notification</p>
          ) : (
            list.map((n: any) => (
              <button
                key={n.id}
                onClick={() => !n.lue && markRead.mutate(n.id)}
                className={cn(
                  'w-full text-left p-3 border-b border-border last:border-0 hover:bg-secondary/50',
                  !n.lue && 'bg-primary/5'
                )}
              >
                <p className="text-sm">{n.message || n.titre}</p>
                {n.dateCreation && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">{n.dateCreation}</p>
                )}
              </button>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
