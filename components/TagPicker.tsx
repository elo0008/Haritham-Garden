"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Tag } from "@/lib/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TagPickerProps {
  /** All available tags (fetched from DB) */
  allTags: Tag[];
  /** Currently selected tag IDs */
  selectedTagIds: string[];
  /** Callback when selection changes */
  onChange: (tagIds: string[]) => void;
  /** Callback to create a new tag — returns the created Tag */
  onCreateTag?: (name: string) => Promise<Tag>;
  /** Disabled state */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TagPicker({
  allTags,
  selectedTagIds,
  onChange,
  onCreateTag,
  disabled = false,
  placeholder = "Search or add tags…",
}: TagPickerProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Derived ───────────────────────────────────────────────────────────────

  const selectedTags = allTags.filter((t) => selectedTagIds.includes(t.id));

  const filteredTags = allTags.filter((t) => {
    if (selectedTagIds.includes(t.id)) return false;
    if (!query.trim()) return true;
    return t.name.toLowerCase().includes(query.trim().toLowerCase());
  });

  const trimmedQuery = query.trim();
  const exactMatch = allTags.some(
    (t) => t.name.toLowerCase() === trimmedQuery.toLowerCase()
  );
  const showCreateOption =
    trimmedQuery.length > 0 && !exactMatch && onCreateTag;

  // ── Click outside to close ────────────────────────────────────────────────

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const addTag = useCallback(
    (tagId: string) => {
      if (!selectedTagIds.includes(tagId)) {
        onChange([...selectedTagIds, tagId]);
      }
      setQuery("");
    },
    [selectedTagIds, onChange]
  );

  const removeTag = useCallback(
    (tagId: string) => {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    },
    [selectedTagIds, onChange]
  );

  const handleCreateTag = useCallback(async () => {
    if (!onCreateTag || !trimmedQuery || creating) return;
    setCreating(true);
    try {
      const newTag = await onCreateTag(trimmedQuery);
      addTag(newTag.id);
    } catch (err) {
      console.error("Failed to create tag:", err);
    } finally {
      setCreating(false);
    }
  }, [onCreateTag, trimmedQuery, creating, addTag]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && query === "" && selectedTagIds.length > 0) {
      // Remove last selected tag on backspace when input is empty
      removeTag(selectedTagIds[selectedTagIds.length - 1]);
    }
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (showCreateOption && filteredTags.length === 0) {
        handleCreateTag();
      } else if (filteredTags.length > 0) {
        addTag(filteredTags[0].id);
      } else if (showCreateOption) {
        handleCreateTag();
      }
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className="relative">
      {/* Input area with selected chips */}
      <div
        className={`flex flex-wrap items-center gap-1.5 min-h-[44px] rounded-xl border bg-white px-3 py-2
                    transition-colors cursor-text
                    ${isOpen ? "border-[#C1662F] ring-2 ring-[#C1662F]" : "border-stone-300"}
                    ${disabled ? "bg-stone-100 cursor-not-allowed" : ""}`}
        onClick={() => {
          if (!disabled) {
            inputRef.current?.focus();
            setIsOpen(true);
          }
        }}
      >
        {/* Selected tag chips */}
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 rounded-lg bg-stone-100 border border-stone-200
                       px-2 py-1 text-xs font-semibold text-[#24211E] whitespace-nowrap"
          >
            {tag.name}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag.id);
                }}
                className="ml-0.5 text-stone-400 hover:text-red-500 transition-colors
                           w-4 h-4 flex items-center justify-center rounded-full
                           hover:bg-red-50"
                aria-label={`Remove ${tag.name}`}
              >
                ×
              </button>
            )}
          </span>
        ))}

        {/* Search input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={selectedTags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] border-none outline-none bg-transparent text-sm
                     text-[#24211E] placeholder:text-stone-400 disabled:cursor-not-allowed py-0.5"
        />
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (filteredTags.length > 0 || showCreateOption) && (
        <div
          className="absolute z-30 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-stone-200
                     bg-white shadow-lg py-1"
        >
          {filteredTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => {
                addTag(tag.id);
                inputRef.current?.focus();
              }}
              className="w-full text-left px-3 py-2.5 text-sm text-[#24211E] hover:bg-stone-50
                         transition-colors flex items-center gap-2 min-h-[40px]"
            >
              <span className="w-2 h-2 rounded-full bg-stone-300 flex-shrink-0" />
              {tag.name}
            </button>
          ))}

          {showCreateOption && (
            <button
              type="button"
              onClick={() => {
                handleCreateTag();
                inputRef.current?.focus();
              }}
              disabled={creating}
              className="w-full text-left px-3 py-2.5 text-sm text-[#C1662F] hover:bg-orange-50
                         transition-colors flex items-center gap-2 min-h-[40px] font-semibold
                         border-t border-stone-100 disabled:opacity-50"
            >
              <span className="text-base leading-none">+</span>
              {creating
                ? "Creating…"
                : `Add new tag: "${trimmedQuery}"`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
