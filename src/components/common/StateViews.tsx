import { AlertCircle, Inbox, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LoadingState({ label = 'Chargement...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertCircle className="w-10 h-10 text-destructive mb-3" />
      <p className="text-sm text-muted-foreground mb-3">{message || 'Une erreur est survenue.'}</p>
      {onRetry && <Button size="sm" variant="outline" onClick={onRetry}>Réessayer</Button>}
    </div>
  );
}

export function EmptyState({
  message,
  title,
  description,
  icon: Icon = Inbox,
  action,
}: {
  message?: string;
  title?: string;
  description?: string;
  icon?: any;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
      <Icon className="w-10 h-10 mb-3 opacity-30" />
      {title && <p className="text-base font-medium text-foreground mb-1">{title}</p>}
      <p className="text-sm">{description || message || 'Aucune donnée'}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
