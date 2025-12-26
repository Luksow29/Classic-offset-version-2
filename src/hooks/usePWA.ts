// src/hooks/usePWA.ts
import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  needsUpdate: boolean;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: navigator.onLine,
    needsUpdate: false,
  });
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    
    setState(prev => ({ ...prev, isInstalled: isStandalone }));

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setState(prev => ({ ...prev, isInstallable: true }));
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setState(prev => ({ ...prev, isInstallable: false, isInstalled: true }));
    };

    // Listen for online/offline
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for service worker updates
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Check for updates periodically
      const updateInterval = setInterval(() => {
        navigator.serviceWorker.ready.then((registration) => {
          registration.update();
        });
      }, 60 * 60 * 1000); // Check every hour

      navigator.serviceWorker.ready.then((registration) => {
        // Check if there's already a waiting worker on load
        if (registration.waiting) {
            setState(prev => ({ ...prev, needsUpdate: true }));
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setState(prev => ({ ...prev, needsUpdate: true }));
              }
            });
          }
        });
      });

      // Handle controller change (reload when new SW takes over)
      const handleControllerChange = () => {
        if (!refreshing) {
             console.log('Controller changed, new SW active, reloading...');
             window.location.reload();
             refreshing = true;
        }
      };
      
      let refreshing = false; // Prevent double-reload if multiple events fire
      
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      return () => {
        clearInterval(updateInterval);
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setState(prev => ({ ...prev, isInstallable: false }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error installing PWA:', error);
      return false;
    }
  }, [deferredPrompt]);


  const updateApp = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.waiting) {
          // Send skip waiting message
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else {
             // Fallback: simple reload if we think we need an update but no waiting worker
             window.location.reload();
        }
      });
    }
  }, []);

  return {
    ...state,
    installApp,
    updateApp,
  };
}

export default usePWA;
