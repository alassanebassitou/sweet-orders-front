import { StarRating } from '@/components/ui/StarRating';
import { relativeTime, shortenName } from '@/lib/relativeTime';
import { cn } from '@/lib/utils';

interface ReviewCardProps {
  avis: any;
  muted?: boolean;
}

export function ReviewCard({ avis, muted }: ReviewCardProps) {
  const name = shortenName(avis.clientName);
  const initial = (avis.clientName || '?').trim().charAt(0).toUpperCase();
  return (
    <div className={cn('flex gap-3 py-3', muted && 'opacity-60')}>
      {avis.clientPhotoUrl ? (
        <img src={avis.clientPhotoUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
          {initial}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{name}</span>
          <StarRating value={avis.note || 0} size="sm" />
        </div>
        <p className="text-xs text-muted-foreground">{relativeTime(avis.createdAt)}</p>
        {avis.comment && <p className="text-sm mt-1 text-foreground/90">{avis.comment}</p>}
      </div>
    </div>
  );
}

export default ReviewCard;
