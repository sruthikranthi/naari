/**
 * Service Worker registration and management
 */

export function registerServiceWorker() {
  if (typeof window === 'undefined') return;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        // First, unregister any existing service workers to clear old caches
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          // Unregister old service workers
          await registration.unregister();
        }

        // Clear all caches
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
        }

        // Wait a bit before registering new service worker
        await new Promise(resolve => setTimeout(resolve, 100));

        // Register new service worker
        const registration = await navigator.serviceWorker.register('/sw.js', {
          updateViaCache: 'none', // Always fetch fresh service worker
        });

        console.log('Service Worker registered:', registration.scope);

        // Force update immediately
        await registration.update();

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available, prompt user to reload
                if (confirm('A new version is available. Reload to update?')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    });
  }
}

export function unregisterServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  navigator.serviceWorker.ready.then((registration) => {
    registration.unregister();
  });
}

