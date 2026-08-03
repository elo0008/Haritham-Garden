"use client";

import { useState, useEffect } from "react";
import { Download, X, Smartphone, Share, PlusSquare, Leaf } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PWAContextProvider, usePWA } from "@/context/PWAContext";

interface PWAProviderProps {
  children: React.ReactNode;
  logoUrl?: string | null;
}

function PWAInstallUI({ logoUrl }: { logoUrl?: string | null }) {
  const { showIOSGuide, closeIOSGuide, promptInstall } = usePWA();
  const [showInstallHint, setShowInstallHint] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 1. Register Service Worker in customer browser environment
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("PWA Service Worker registered:", reg.scope);
        })
        .catch((err) => {
          console.error("PWA Service Worker registration failed:", err);
        });
    }

    // 2. Listen to native beforeinstallprompt for optional subtle non-pushy hint
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Check if user has already dismissed the hint
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

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`PWA install prompt outcome: ${outcome}`);
      setDeferredPrompt(null);
    } else {
      promptInstall();
    }
    setShowInstallHint(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("haritham_pwa_hint_dismissed", "true");
    }
  };

  const handleDismiss = () => {
    setShowInstallHint(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("haritham_pwa_hint_dismissed", "true");
    }
  };

  return (
    <>
      {/* ── One-Time Dismissible Install Hint (Unchanged logic, powered by logoUrl) ── */}
      <AnimatePresence>
        {showInstallHint && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 bg-stone-900/95 dark:bg-stone-800/95 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl backdrop-blur-md border border-stone-700/80 flex items-center justify-between gap-3 text-xs font-sans"
          >
            <div className="flex items-center gap-3 min-w-0">
              {logoUrl ? (
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-white shrink-0 border border-stone-700">
                  <img src={logoUrl} alt="Haritham Garden" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-botanical-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Smartphone className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-sm text-stone-100 truncate">Install App</p>
                <p className="text-stone-300 text-[11px] truncate">Add Haritham Garden to home screen</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="bg-botanical-600 hover:bg-botanical-500 text-white font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shadow-xs text-xs cursor-pointer active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                aria-label="Dismiss app install hint"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── iOS / Manual Installation Instructions Modal ── */}
      <AnimatePresence>
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 relative overflow-hidden"
            >
              <button
                type="button"
                onClick={closeIOSGuide}
                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3.5 mb-4">
                {logoUrl ? (
                  <div className="w-11 h-11 rounded-2xl overflow-hidden bg-white shrink-0 border border-stone-200 dark:border-stone-800 shadow-xs">
                    <img src={logoUrl} alt="Haritham Garden" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-2xl bg-botanical-100 dark:bg-stone-800 text-botanical-800 dark:text-botanical-100 flex items-center justify-center shrink-0 shadow-xs">
                    <Leaf className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h3 className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100">
                    Install Haritham App
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Add to home screen for quick access
                  </p>
                </div>
              </div>

              <div className="space-y-3.5 my-5 text-sm text-stone-600 dark:text-stone-300">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                  <span className="w-6 h-6 rounded-full bg-botanical-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <p className="leading-snug text-xs sm:text-sm">
                    Tap the <strong className="text-stone-900 dark:text-stone-100 inline-flex items-center gap-1">Share <Share className="w-3.5 h-3.5 text-botanical-600 dark:text-botanical-400 inline" /></strong> button in your browser toolbar.
                  </p>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                  <span className="w-6 h-6 rounded-full bg-botanical-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <p className="leading-snug text-xs sm:text-sm">
                    Scroll down and select <strong className="text-stone-900 dark:text-stone-100 inline-flex items-center gap-1">Add to Home Screen <PlusSquare className="w-3.5 h-3.5 text-botanical-600 dark:text-botanical-400 inline" /></strong>.
                  </p>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                  <span className="w-6 h-6 rounded-full bg-botanical-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <p className="leading-snug text-xs sm:text-sm">
                    Tap <strong className="text-stone-900 dark:text-stone-100">Add</strong> in the top right corner.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeIOSGuide}
                className="w-full bg-botanical-800 hover:bg-botanical-700 dark:bg-botanical-600 dark:hover:bg-botanical-500 text-white font-bold py-3 rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer text-sm"
              >
                Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export function PWAProvider({ children, logoUrl }: PWAProviderProps) {
  return (
    <PWAContextProvider logoUrl={logoUrl}>
      {children}
      <PWAInstallUI logoUrl={logoUrl} />
    </PWAContextProvider>
  );
}
