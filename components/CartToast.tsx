"use client";

import { useEffect } from "react";
import { ShoppingBag, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface ToastInfo {
  id: string;
  plantId: string;
  plantName: string;
  qty: number;
}

interface CartToastProps {
  toast: ToastInfo | null;
  onDismiss: () => void;
}

export function CartToast({ toast, onDismiss }: CartToastProps) {
  useEffect(() => {
    if (!toast) return;

    // Auto-dismiss timer (3.5 seconds)
    const timer = setTimeout(() => {
      onDismiss();
    }, 3500);

    return () => clearTimeout(timer);
  }, [toast?.id, onDismiss]);

  return (
    <AnimatePresence>
      {toast && (
        <div className="fixed top-6 right-6 z-50 pointer-events-none">
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="pointer-events-auto bg-stone-900 dark:bg-stone-800 text-stone-100 border border-stone-800 dark:border-stone-700 shadow-2xl rounded-2xl p-4 flex items-center gap-3.5 max-w-xs sm:max-w-sm"
          >
            {/* Bag Icon in Terracotta Rounded Square */}
            <div className="w-10 h-10 rounded-xl bg-terracotta text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>

            {/* Content Text */}
            <div className="overflow-hidden min-w-0 flex-1">
              <span className="font-heading font-bold text-sm text-stone-100 block leading-tight">
                Added to your bag!
              </span>
              <span className="text-xs text-stone-300 dark:text-stone-400 font-medium block mt-0.5 truncate">
                {toast.qty}x {toast.plantName}
              </span>
            </div>

            {/* Manual Dismiss X Button */}
            <button
              type="button"
              onClick={onDismiss}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 dark:hover:bg-stone-700 transition-colors ml-auto shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-90"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
