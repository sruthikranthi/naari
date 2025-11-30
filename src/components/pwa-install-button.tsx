'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if running as standalone (iOS)
    if ((window.navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      toast({
        title: 'App Installed!',
        description: 'Naarimani has been installed successfully.',
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if service worker is registered (required for PWA)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (!registration) {
          // Service worker not registered, app might not be installable
          console.log('Service worker not registered');
        }
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback for iOS or browsers that don't support beforeinstallprompt
      toast({
        title: 'Install Instructions',
        description: 'To install: On iOS, tap Share → Add to Home Screen. On Android, use the browser menu → Install app.',
        variant: 'default',
      });
      return;
    }

    setIsInstalling(true);

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        toast({
          title: 'Installing...',
          description: 'Please wait while we install Naarimani.',
        });
      } else {
        toast({
          title: 'Install Cancelled',
          description: 'You can install Naarimani anytime from your browser menu.',
          variant: 'default',
        });
      }

      // Clear the deferred prompt
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('Error showing install prompt:', error);
      toast({
        title: 'Install Error',
        description: 'Failed to show install prompt. Please try using your browser menu.',
        variant: 'destructive',
      });
    } finally {
      setIsInstalling(false);
    }
  };

  // Don't show button if already installed
  if (isInstalled) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="gap-2"
      >
        <Check className="h-4 w-4" />
        Installed
      </Button>
    );
  }

  // Show install button if installable
  if (isInstallable) {
    return (
      <Button
        onClick={handleInstallClick}
        disabled={isInstalling}
        size="sm"
        className="gap-2"
      >
        {isInstalling ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Installing...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Install App
          </>
        )}
      </Button>
    );
  }

  // Show manual install instructions button for iOS/other browsers
  return (
    <Button
      onClick={handleInstallClick}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Install App
    </Button>
  );
}

