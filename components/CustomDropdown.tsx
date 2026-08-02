"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";

export interface CustomDropdownOption<T extends string | number> {
  value: T;
  label: string;
  badgeBg?: string;
  badgeText?: string;
  icon?: ReactNode;
}

interface CustomDropdownProps<T extends string | number> {
  value: T;
  options: CustomDropdownOption<T>[];
  onChange: (newValue: T) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  align?: "left" | "right" | "auto";
  renderTriggerContent?: (selectedOption?: CustomDropdownOption<T>) => ReactNode;
  ariaLabel?: string;
}

export function CustomDropdown<T extends string | number>({
  value,
  options,
  onChange,
  disabled = false,
  placeholder = "Select...",
  className = "",
  buttonClassName = "",
  menuClassName = "",
  align = "auto",
  renderTriggerContent,
  ariaLabel = "Select option",
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(options.findIndex((o) => o.value === value));
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + options.length) % options.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < options.length) {
        onChange(options[focusedIndex].value);
        setIsOpen(false);
      }
    }
  };

  const getAlignClass = () => {
    if (align === "left") return "left-0";
    if (align === "right") return "right-0";
    return "left-0 sm:left-auto sm:right-0";
  };

  return (
    <div className={`relative inline-flex items-center ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setIsOpen((prev) => !prev);
          setFocusedIndex(options.findIndex((o) => o.value === value));
        }}
        onKeyDown={handleKeyDown}
        className={`px-3.5 py-2.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-100 font-semibold text-xs sm:text-sm hover:border-botanical-600 dark:hover:border-botanical-600 active:scale-95 transition-all shadow-2xs flex items-center justify-between gap-2 min-h-[40px] disabled:opacity-60 disabled:cursor-not-allowed ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
      >
        {renderTriggerContent ? (
          renderTriggerContent(selectedOption)
        ) : (
          <span className="flex items-center gap-2 truncate">
            {selectedOption?.icon}
            {selectedOption?.badgeBg ? (
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${selectedOption.badgeBg} ${
                  selectedOption.badgeText || "text-stone-900 dark:text-stone-100"
                }`}
              >
                {selectedOption.label}
              </span>
            ) : (
              <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
            )}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-stone-500 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute top-full mt-2 z-50 min-w-[190px] w-max max-w-[calc(100vw-32px)] py-1.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-2xl overflow-hidden text-stone-900 dark:text-stone-100 font-sans ${getAlignClass()} ${menuClassName}`}
            role="listbox"
            aria-label={ariaLabel}
          >
            {options.map((opt, idx) => {
              const isSelected = value === opt.value;
              const isFocused = focusedIndex === idx;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setFocusedIndex(idx)}
                  className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-between transition-colors ${
                    isSelected
                      ? "bg-botanical-50 dark:bg-stone-800 text-botanical-800 dark:text-botanical-100 font-bold"
                      : isFocused
                      ? "bg-stone-100 dark:bg-stone-800/60 text-stone-900 dark:text-stone-100"
                      : "text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/40"
                  }`}
                >
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    {opt.icon}
                    {opt.badgeBg ? (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${opt.badgeBg} ${
                          opt.badgeText || "text-stone-900 dark:text-stone-100"
                        }`}
                      >
                        {opt.label}
                      </span>
                    ) : (
                      <span className="whitespace-nowrap">{opt.label}</span>
                    )}
                  </span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-botanical-600 dark:text-botanical-400 shrink-0 ml-3" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
