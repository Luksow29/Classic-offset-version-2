import { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { X, Download, Smartphone, RefreshCw, WifiOff, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, isOnline, isUpdateAvailable, promptInstall, updateApp } = usePWA();
  const [showBanner, setShowBanner] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the banner before
    const dismissedTime = localStorage.getItem('pwa-banner-dismissed');
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setDismissed(true);
      }
    }
  }, []);

  useEffect(() => {
    if (isInstallable && !isInstalled && !dismissed) {
      // Show banner after a short delay
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, dismissed]);

  useEffect(() => {
    if (isUpdateAvailable) {
      setShowUpdateBanner(true);
    }
  }, [isUpdateAvailable]);

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };

  const handleUpdate = () => {
    updateApp();
    setShowUpdateBanner(false);
  };

  return (
    <>
      {/* Offline Indicator */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 text-center text-sm font-medium shadow-lg"
          >
            <div className="flex items-center justify-center gap-2">
              <WifiOff className="w-4 h-4" />
              <span>You're offline. Some features may be limited.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back Online Indicator */}
      <AnimatePresence>
        {isOnline && localStorage.getItem('was-offline') && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            onAnimationComplete={() => {
              setTimeout(() => localStorage.removeItem('was-offline'), 3000);
            }}
            className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 text-center text-sm font-medium shadow-lg"
          >
            <div className="flex items-center justify-center gap-2">
              <Wifi className="w-4 h-4" />
              <span>You're back online!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Install Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-[100] p-4 safe-area-inset-bottom"
          >
            <div className="max-w-lg mx-auto bg-gradient-to-r from-cyan-600 to-teal-600 rounded-2xl shadow-2xl shadow-cyan-500/30 p-4 backdrop-blur-xl border border-white/20">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm flex-shrink-0">
                  <Smartphone className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-lg">Install Customer Portal</h3>
                  <p className="text-cyan-100 text-sm mt-1">
                    Install our app for faster access, offline support, and push notifications!
                  </p>
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={handleInstall}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white text-cyan-700 font-semibold rounded-xl hover:bg-cyan-50 transition-all shadow-lg active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      Install Now
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="px-4 py-2.5 text-white/80 hover:text-white font-medium transition-colors"
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Available Banner */}
      <AnimatePresence>
        {showUpdateBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-[100] p-4 safe-area-inset-bottom"
          >
            <div className="max-w-lg mx-auto bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl shadow-2xl shadow-violet-500/30 p-4 backdrop-blur-xl border border-white/20">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm flex-shrink-0">
                  <RefreshCw className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white">Update Available</h3>
                  <p className="text-violet-100 text-sm">A new version is ready!</p>
                </div>
                <button
                  onClick={handleUpdate}
                  className="px-5 py-2.5 bg-white text-violet-700 font-semibold rounded-xl hover:bg-violet-50 transition-all shadow-lg active:scale-95"
                >
                  Update
                </button>
                <button
                  onClick={() => setShowUpdateBanner(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default PWAInstallPrompt;
