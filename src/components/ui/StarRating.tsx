import { useState } from 'react';
import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange?: (v: number) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-3.5 h-3.5',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
};

export function StarRating({ value, onChange, size = 'md', className }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const interactive = !!onChange;
  const display = interactive ? (hover || value) : value;
  const sz = sizeClasses[size];

  if (interactive) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange!(i)}
            className="transition-transform hover:scale-110"
            aria-label={`Noter ${i} étoile${i > 1 ? 's' : ''}`}
          >
            <Star
              className={cn(sz, i <= display ? 'fill-amber-500 text-amber-500' : 'fill-none text-muted-foreground')}
            />
          </button>
        ))}
      </div>
    );
  }

  // Read-only with half star support
  const full = Math.floor(display);
  const hasHalf = display - full >= 0.25 && display - full < 0.75;
  const fullCount = display - full >= 0.75 ? full + 1 : full;

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {[0, 1, 2, 3, 4].map((i) => {
        if (i < fullCount) return <Star key={i} className={cn(sz, 'fill-amber-500 text-amber-500')} />;
        if (i === fullCount && hasHalf) return <StarHalf key={i} className={cn(sz, 'fill-amber-500 text-amber-500')} />;
        return <Star key={i} className={cn(sz, 'fill-none text-muted-foreground/40')} />;
      })}
    </div>
  );
}

export default StarRating;
