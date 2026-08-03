"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Download, X, Share, PlusSquare, Smartphone, Leaf } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PWAContextType {
  isStandalone: boolean;
  isIOS: boolean;
  canInstall: boolean;
  triggerInstall: () => void;
}

const PWAContext = createContext<PWAContextType>({
  isStandalone: false,
  isIOS: false,
  canInstall: false,
  triggerInstall: () => {},
});

interface PWAProviderProps {
  children: React.ReactNode;
  logoUrl?: string | null;
}

export function PWAProvider({ children, logoUrl }: PWAProviderProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallHint, setShowInstallHint] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker in customer browser environment
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("PWA Service Worker registered:", reg.scope))
        .catch((err) => console.error("PWA Service Worker registration failed:", err));
    }

    // 2. Standalone Mode & iOS Detection
    if (typeof window !== "undefined") {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as any).standalone === true ||
        document.referrer.includes("android-app://");
      setIsStandalone(isStandaloneMode);

      const ua = window.navigator.userAgent;
      const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
      setIsIOS(isIosDevice);
    }

    // 3. Listen to native beforeinstallprompt for optional subtle non-pushy hint
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      if (typeof window !== "undefined") {
        const isDismissed = localStorage.getItem("haritham_pwa_hint_dismissed");
        if (!isDismissed) {
          setShowInstallHint(true);
        }
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const triggerInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`PWA install prompt outcome: ${outcome}`);
      setDeferredPrompt(null);
      setShowInstallHint(false);
      if (typeof window !== "undefined") {
        localStorage.setItem("haritham_pwa_hint_dismissed", "true");
      }
    } else if (isIOS || !deferredPrompt) {
      setShowIOSModal(true);
    }
  };

  const handleDismissHint = () => {
    setShowInstallHint(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("haritham_pwa_hint_dismissed", "true");
    }
  };

  const renderIcon = (sizeClass = "w-9 h-9") => {
    if (logoUrl) {
      return (
        <div className={`${sizeClass} rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shrink-0`}>
          <img src={logoUrl} alt="Haritham Garden" className="w-full h-full object-cover" />
        </div>
      );
    }
    return (
      <div className={`${sizeClass} rounded-xl bg-botanical-600 text-white flex items-center justify-center shrink-0 shadow-xs`}>
        <Leaf className="w-5 h-5" />
      </div>
    );
  };

  return (
    <PWAContext.Provider
      value={{
        isStandalone,
        isIOS,
        canInstall: !isStandalone,
        triggerInstall,
      }}
    >
      {children}

      {/* ── One-Time Dismissible Install Hint (Kept 100% as-is) ──────────── */}
      <AnimatePresence>
        {showInstallHint && !isStandalone && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 bg-stone-900/95 dark:bg-stone-800/95 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl backdrop-blur-md border border-stone-700/80 flex items-center justify-between gap-3 text-xs font-sans"
          >
            <div className="flex items-center gap-3 min-w-0">
              {renderIcon("w-9 h-9")}
              <div className="min-w-0">
                <p className="font-bold text-sm text-stone-100 truncate">Install App</p>
                <p className="text-stone-300 text-[11px] truncate">Add Haritham Garden to home screen</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={triggerInstall}
                className="bg-botanical-600 hover:bg-botanical-500 text-white font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shadow-xs text-xs cursor-pointer active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
              <button
                type="button"
                onClick={handleDismissHint}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                aria-label="Dismiss app install hint"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── iOS / Manual Install Instructional Modal ─────────────────── */}
      <AnimatePresence>
        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 max-w-sm w-full p-6 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 relative space-y-4 font-sans"
            >
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                {renderIcon("w-11 h-11")}
                <div>
                  <h3 className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100 leading-tight">
                    Install Haritham Garden
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Add to your Home Screen for instant access.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-1 text-xs">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60">
                  <div className="w-6 h-6 rounded-xl bg-botanical-600 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-stone-800 dark:text-stone-200">
                      Tap the Share button
                    </p>
                    <p className="text-stone-500 dark:text-stone-400 mt-0.5 flex items-center gap-1">
                      Look for <Share className="w-3.5 h-3.5 inline text-botanical-600 shrink-0" /> in Safari's toolbar.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60">
                  <div className="w-6 h-6 rounded-xl bg-botanical-600 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-stone-800 dark:text-stone-200">
                      Select "Add to Home Screen"
                    </p>
                    <p className="text-stone-500 dark:text-stone-400 mt-0.5 flex items-center gap-1">
                      Scroll down and tap <PlusSquare className="w-3.5 h-3.5 inline text-botanical-600 shrink-0" /> <strong>Add to Home Screen</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="w-full bg-botanical-800 dark:bg-botanical-600 hover:bg-botanical-900 text-white font-semibold py-3 rounded-2xl text-xs transition-all shadow-xs cursor-pointer"
              >
                Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PWAContext.Provider>
  );
}

export function usePWA() {
  return useContext(PWAContext);
}
