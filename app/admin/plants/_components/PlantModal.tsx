"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Click backdrop to close */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 max-w-2xl w-full max-h-[90vh] bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-2xl overflow-y-auto flex flex-col p-6 sm:p-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800 mb-6 shrink-0">
          <div>
            <h2 className="font-heading font-bold text-xl sm:text-2xl text-stone-900 dark:text-stone-100">
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
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Embedded PlantForm */}
        <div className="flex-grow">
          <PlantForm
            initialData={initialData}
            allTags={allTags}
            initialTagIds={initialTagIds}
            onSuccess={onClose}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
