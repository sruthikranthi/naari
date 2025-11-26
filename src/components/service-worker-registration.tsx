'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/service-worker';

/**
 * Component to register service worker on mount
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}

