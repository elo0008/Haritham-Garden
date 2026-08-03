"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if running in standalone mode (already installed & opened from home screen)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    // Capture beforeinstallprompt event for Android / Chrome / Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  // Hide button entirely if app is already running in standalone PWA mode
  if (isStandalone) {
    return null;
  }

  const handleClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        console.log("PWA installed via persistent footer button");
      }
      setDeferredPrompt(null);
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="hover:text-botanical-800 dark:hover:text-botanical-100 transition-colors flex items-center gap-1 cursor-pointer text-xs"
        title="Install Haritham Garden App"
      >
        <Download className="w-3.5 h-3.5 text-botanical-600 dark:text-botanical-400" />
        <span>Install App</span>
      </button>

      {/* Instructional Modal for iOS or browsers without native prompt */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-stone-200 dark:border-stone-800 text-center relative"
            >
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 rounded-lg"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-botanical-100 dark:bg-stone-800 text-botanical-800 dark:text-botanical-100 flex items-center justify-center mx-auto mb-4">
                <Download className="w-6 h-6" />
              </div>

              <h3 className="font-heading text-lg font-bold mb-2">Install Haritham App</h3>

              {isIOS ? (
                <div className="text-xs text-stone-600 dark:text-stone-400 space-y-2 text-left bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 mb-5">
                  <p className="font-semibold text-stone-800 dark:text-stone-200">To install on iPhone or iPad:</p>
                  <ol className="list-decimal pl-4 space-y-1.5">
                    <li>Tap the <strong>Share</strong> icon in Safari's toolbar.</li>
                    <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                    <li>Tap <strong>Add</strong> in the top-right corner.</li>
                  </ol>
                </div>
              ) : (
                <p className="text-xs text-stone-600 dark:text-stone-400 mb-5">
                  To install Haritham Garden on your device, open your browser's options menu and select <strong>Add to Home Screen</strong> or <strong>Install App</strong>.
                </p>
              )}

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full bg-botanical-800 dark:bg-botanical-600 text-white font-semibold py-2.5 rounded-full text-xs hover:bg-botanical-900 active:scale-95 transition-all cursor-pointer shadow-sm"
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
