"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PlantForm } from "./PlantForm";
import type { Plant, Tag } from "@/lib/types";

interface PlantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Plant;
  allTags: Tag[];
  initialTagIds?: string[];
}

export function PlantModal({
  isOpen,
  onClose,
  initialData,
  allTags,
  initialTagIds,
}: PlantModalProps) {
  // ESC key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          {/* Click backdrop to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Dialog Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative z-10 max-w-2xl w-full max-h-[90vh] bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-2xl overflow-y-auto flex flex-col p-4 sm:p-8 max-w-[calc(100vw-1.5rem)] min-w-0"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800 mb-6 shrink-0 min-w-0">
              <div className="min-w-0 flex-1 pr-2">
                <h2 className="font-heading font-bold text-lg sm:text-2xl text-stone-900 dark:text-stone-100 truncate min-w-0">
                  {initialData ? `Edit Plant — ${initialData.name}` : "Add New Plant"}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  {initialData
                    ? "Update plant pricing, availability status, tags, and nursery details."
                    : "Add a new nursery plant to your online catalogue with tags and photos."}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center justify-center transition-colors shrink-0"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <PlantForm
              initialData={initialData}
              allTags={allTags}
              initialTagIds={initialTagIds}
              onSuccess={onClose}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
