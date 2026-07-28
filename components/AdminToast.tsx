"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface AdminToastInfo {
  id: string;
  title: string;
  message?: string;
}

interface AdminToastContextType {
  showToast: (title: string, message?: string) => void;
}

const AdminToastContext = createContext<AdminToastContextType | undefined>(undefined);

export function useAdminToast() {
  const context = useContext(AdminToastContext);
  if (!context) {
    // Fallback noop function if invoked outside provider
    return { showToast: (_title: string, _message?: string) => {} };
  }
  return context;
}

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<AdminToastInfo | null>(null);

  const showToast = useCallback((title: string, message?: string) => {
    setToast({
      id: Date.now().toString() + Math.random().toString().slice(2, 6),
      title,
      message,
    });
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  useEffect(() => {
    if (!toast) return;

    // Auto-dismiss after 3.5 seconds
    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [toast?.id]);

  return (
    <AdminToastContext.Provider value={{ showToast }}>
      {children}
      <AnimatePresence>
        {toast && (
          <div className="fixed top-20 right-4 sm:right-6 z-50 pointer-events-none">
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="pointer-events-auto bg-stone-900 dark:bg-stone-800 text-stone-100 border border-stone-800 dark:border-stone-700 shadow-2xl rounded-2xl p-4 flex items-center gap-3.5 max-w-xs sm:max-w-sm"
            >
              {/* Botanical Green Icon Badge */}
              <div className="w-10 h-10 rounded-xl bg-botanical-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>

              {/* Toast Message Text */}
              <div className="overflow-hidden min-w-0 flex-1">
                <span className="font-heading font-bold text-sm text-stone-100 block leading-tight">
                  {toast.title}
                </span>
                {toast.message && (
                  <span className="text-xs text-stone-300 dark:text-stone-400 font-medium block mt-0.5 truncate">
                    {toast.message}
                  </span>
                )}
              </div>

              {/* Manual Close Button */}
              <button
                type="button"
                onClick={dismissToast}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 dark:hover:bg-stone-700 transition-colors ml-auto shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-90"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminToastContext.Provider>
  );
}
