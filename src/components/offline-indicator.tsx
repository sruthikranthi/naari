'use client';

import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

/**
 * Offline indicator component
 * Shows when the user is offline and hides when back online
 */
export function OfflineIndicator() {
  // Use lazy initializer to avoid SSR issues and setState in effect
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Show a brief "back online" message
      setWasOffline(true);
      setTimeout(() => setWasOffline(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !wasOffline) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed top-16 left-1/2 -translate-x-1/2 z-50 transition-all duration-300',
        isOnline ? 'translate-y-0 opacity-100' : 'translate-y-0 opacity-100'
      )}
      role="alert"
      aria-live="polite"
    >
      <Alert
        variant={isOnline ? 'default' : 'destructive'}
        className={cn(
          'min-w-[300px] shadow-lg',
          isOnline && 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
        )}
      >
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                You&apos;re back online
              </AlertDescription>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                You&apos;re offline. Some features may not be available.
              </AlertDescription>
            </>
          )}
        </div>
      </Alert>
    </div>
  );
}

