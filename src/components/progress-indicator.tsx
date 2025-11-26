'use client';

import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  isLoading: boolean;
  progress?: number; // 0-100
  message?: string;
  className?: string;
}

/**
 * Progress indicator component
 * Shows loading spinner or progress bar
 */
export function ProgressIndicator({
  isLoading,
  progress,
  message,
  className,
}: ProgressIndicatorProps) {
  if (!isLoading) return null;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 p-4',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={message || 'Loading'}
    >
      {progress !== undefined ? (
        <>
          <Progress value={progress} className="w-full max-w-xs" />
          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
          {progress < 100 && (
            <p className="text-xs text-muted-foreground">{progress}%</p>
          )}
        </>
      ) : (
        <>
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
        </>
      )}
    </div>
  );
}

