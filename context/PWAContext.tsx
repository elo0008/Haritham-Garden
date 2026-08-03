"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface PWAContextType {
  isStandalone: boolean;
  isIOS: boolean;
  canInstall: boolean;
  promptInstall: () => void;
  showIOSGuide: boolean;
  closeIOSGuide: () => void;
}

const PWAContext = createContext<PWAContextType>({
  isStandalone: false,
  isIOS: false,
  canInstall: false,
  promptInstall: () => {},
  showIOSGuide: false,
  closeIOSGuide: () => {},
});

export const usePWA = () => useContext(PWAContext);

export function PWAContextProvider({
  children,
  logoUrl,
}: {
  children: React.ReactNode;
  logoUrl?: string | null;
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check standalone display mode (installed app)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes("android-app://");
      setIsStandalone(isStandaloneMode);
    };

    // Check iOS platform
    const userAgent = window.navigator.userAgent || "";
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    checkStandalone();

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleMediaChange = (e: MediaQueryListEvent) => setIsStandalone(e.matches);
    try {
      mediaQuery.addEventListener("change", handleMediaChange);
    } catch {
      mediaQuery.addListener(handleMediaChange);
    }

    // Capture native beforeinstallprompt for supported browsers
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      try {
        mediaQuery.removeEventListener("change", handleMediaChange);
      } catch {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, []);

  const promptInstall = useCallback(() => {
    if (isStandalone) return;

    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(({ outcome }: { outcome: string }) => {
        console.log(`PWA install prompt outcome: ${outcome}`);
        setDeferredPrompt(null);
      });
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Fallback for browsers without beforeinstallprompt event support
      setShowIOSGuide(true);
    }
  }, [deferredPrompt, isIOS, isStandalone]);

  const closeIOSGuide = useCallback(() => {
    setShowIOSGuide(false);
  }, []);

  const canInstall = !isStandalone;

  return (
    <PWAContext.Provider
      value={{
        isStandalone,
        isIOS,
        canInstall,
        promptInstall,
        showIOSGuide,
        closeIOSGuide,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}
