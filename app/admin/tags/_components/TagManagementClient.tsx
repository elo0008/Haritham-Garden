"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TagWithUsage } from "../actions";
import {
  createTagStandalone,
  renameTagAction,
  deleteTagAction,
  reorderTagsAction,
} from "../actions";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import { useAdminToast } from "@/components/AdminToast";
import {
  Tag as TagIcon,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  AlertTriangle,
  GripVertical,
} from "lucide-react";
import { InlineSpinner } from "@/components/Skeletons";

interface TagManagementClientProps {
  initialTags: TagWithUsage[];
}

interface TagRowItemProps {
  tag: TagWithUsage;
  isEditing: boolean;
  editName: string;
  renameError: string | null;
  isPending: boolean;
  onStartRename: (tag: TagWithUsage) => void;
  onCancelRename: () => void;
  onSaveRename: (id: string) => void;
  onSetEditName: (name: string) => void;
  onSetDeletingTag: (tag: TagWithUsage) => void;
}

function TagRowItem({
  tag,
  isEditing,
  editName,
  renameError,
  isPending,
  onStartRename,
  onCancelRename,
  onSaveRename,
  onSetEditName,
  onSetDeletingTag,
}: TagRowItemProps) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      key={tag.id}
      value={tag}
      dragControls={dragControls}
      dragListener={false}
      className="p-4 sm:px-6 flex items-center justify-between gap-4 bg-white dark:bg-stone-900 hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors select-none"
    >
      {/* Drag Handle Grip Icon */}
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="p-1.5 cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 touch-none shrink-0"
        title="Drag to reorder"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      {/* Tag Information / Edit Mode */}
      <div className="flex-grow min-w-0">
        {isEditing ? (
          <div className="space-y-1.5">
            {renameError && (
              <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                {renameError}
              </p>
            )}
            <div className="flex items-center gap-2 max-w-sm">
              <input
                type="text"
                value={editName}
                onChange={(e) => onSetEditName(e.target.value)}
                className="flex-grow px-3 py-1.5 rounded-xl border border-terracotta bg-white dark:bg-stone-900 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={() => onSaveRename(tag.id)}
                disabled={isPending}
                className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center min-w-[28px] min-h-[28px]"
                title="Save"
              >
                {isPending ? (
                  <InlineSpinner className="w-4 h-4 text-white" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={onCancelRename}
                className="p-1.5 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-300"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="font-heading font-bold text-base text-stone-900 dark:text-stone-100 truncate">
              {tag.name}
            </span>
            <span className="text-[11px] font-mono text-stone-400 dark:text-stone-500 hidden sm:inline">
              ({tag.slug})
            </span>
          </div>
        )}
      </div>

      {/* Usage Badge & Actions */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Live Usage Count Badge */}
        <span
          className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
            tag.usage_count > 0
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              : "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700"
          }`}
        >
          {tag.usage_count} {tag.usage_count === 1 ? "plant" : "plants"}
        </span>

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onStartRename(tag)}
              className="p-2 text-stone-400 hover:text-botanical-800 dark:hover:text-botanical-100 transition-colors"
              title="Rename tag"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onSetDeletingTag(tag)}
              className="p-2 text-stone-400 hover:text-rose-600 transition-colors"
              title="Delete tag"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </Reorder.Item>
  );
}

export function TagManagementClient({ initialTags }: TagManagementClientProps) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const [tags, setTags] = useState<TagWithUsage[]>(initialTags);
  const [isPending, startTransition] = useTransition();

  // Sync state if initialTags prop changes (e.g. from server component revalidation)
  useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);

  // Create Tag state
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  // Inline Rename state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);

  // Delete Modal state
  const [deletingTag, setDeletingTag] = useState<TagWithUsage | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!newTagName.trim()) {
      setCreateError("Tag name cannot be empty.");
      return;
    }

    startTransition(async () => {
      const res = await createTagStandalone(newTagName);
      if (!res.success) {
        setCreateError(res.error || "Failed to create tag.");
      } else {
        if (res.tag) {
          const newTagItem: TagWithUsage = {
            ...res.tag,
            position: res.tag.position ?? (tags.length + 1),
            usage_count: 0,
          };
          setTags((prev) => [...prev, newTagItem]);
        }
        showToast("Tag Created", `Created category tag '${res.tag?.name || newTagName}'`);
        setNewTagName("");
        setIsCreating(false);
        router.refresh();
      }
    });
  };

  const startRename = (tag: TagWithUsage) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setRenameError(null);
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditName("");
    setRenameError(null);
  };

  const handleSaveRename = (id: string) => {
    setRenameError(null);
    const trimmed = editName.trim();
    if (!trimmed) {
      setRenameError("Tag name cannot be empty.");
      return;
    }

    startTransition(async () => {
      try {
        await renameTagAction(id, trimmed);
        setTags((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, name: trimmed, slug: trimmed.toLowerCase().replace(/\s+/g, "-") } : t
          )
        );
        showToast("Tag Renamed", `Tag renamed to '${trimmed}'`);
        setEditingId(null);
        setEditName("");
        router.refresh();
      } catch (err) {
        setRenameError(err instanceof Error ? err.message : "Failed to rename tag.");
      }
    });
  };

  const handleConfirmDelete = () => {
    if (!deletingTag) return;
    const deletedId = deletingTag.id;
    setDeleteError(null);

    startTransition(async () => {
      try {
        await deleteTagAction(deletedId);
        setTags((prev) => prev.filter((t) => t.id !== deletedId));
        showToast("Tag Deleted", `Tag '${deletingTag.name}' removed`);
        setDeletingTag(null);
        router.refresh();
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : "Failed to delete tag.");
      }
    });
  };

  const handleReorder = (newTags: TagWithUsage[]) => {
    setTags(newTags);

    const reordered = newTags.map((t, idx) => ({
      id: t.id,
      position: idx + 1,
    }));

    startTransition(async () => {
      await reorderTagsAction(reordered);
      showToast("Tag Order Saved", "Updated tag display positions");
      router.refresh();
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h1 className="font-heading font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
            <TagIcon className="w-6 h-6 text-botanical-800 dark:text-botanical-100" />
            Tag Management
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Drag and drop tags using the grip handle to reorder them across the app.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsCreating(true);
            setCreateError(null);
          }}
          className="px-4 py-2.5 bg-botanical-800 dark:bg-botanical-600 hover:bg-botanical-900 text-white rounded-2xl font-semibold text-xs flex items-center gap-2 shadow-sm active:scale-95 transition-all min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Tag</span>
        </button>
      </div>

      {/* Create Tag Form Drawer / Card */}
      {isCreating && (
        <form
          onSubmit={handleCreateTag}
          className="p-5 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-3 animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Add New Category Tag
            </h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {createError && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300">
              {createError}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="e.g. Anthurium, Rare Exotic, Shade Loving"
              className="flex-grow px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-terracotta"
              autoFocus
            />
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-2xs transition-all active:scale-95 disabled:opacity-50 min-h-[38px] flex items-center justify-center gap-1.5"
            >
              {isPending ? (
                <>
                  <InlineSpinner className="w-3.5 h-3.5 text-white" />
                  <span>Saving…</span>
                </>
              ) : (
                "Save Tag"
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3.5 py-2 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl font-semibold text-xs hover:bg-stone-300 min-h-[38px]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Tags List with Drag-and-Drop Reordering */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-2xs overflow-hidden">
        {tags.length === 0 ? (
          <div className="p-12 text-center text-stone-400 space-y-2">
            <TagIcon className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-700" />
            <p className="text-sm font-semibold">No tags found in database.</p>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={tags}
            onReorder={handleReorder}
            className="divide-y divide-stone-100 dark:divide-stone-800"
          >
            {tags.map((tag) => (
              <TagRowItem
                key={tag.id}
                tag={tag}
                isEditing={editingId === tag.id}
                editName={editName}
                renameError={renameError}
                isPending={isPending}
                onStartRename={startRename}
                onCancelRename={cancelRename}
                onSaveRename={handleSaveRename}
                onSetEditName={setEditName}
                onSetDeletingTag={setDeletingTag}
              />
            ))}
          </Reorder.Group>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingTag && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs"
              onClick={() => setDeletingTag(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative z-10 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl w-full max-w-md p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto min-w-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100">
                    Delete Tag '{deletingTag.name}'?
                  </h3>
                  <span className="text-xs text-stone-400">This action cannot be undone.</span>
                </div>
              </div>

              {deleteError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-xs font-semibold text-rose-700 dark:text-rose-300">
                  {deleteError}
                </div>
              )}

              {/* Warning Message based on plant usage count */}
              {deletingTag.usage_count > 0 ? (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-normal">
                  ⚠️ <strong>Warning:</strong> This tag is used by{" "}
                  <strong>
                    {deletingTag.usage_count} {deletingTag.usage_count === 1 ? "plant" : "plants"}
                  </strong>
                  . Deleting it will remove the tag from those plants, but the plants themselves will not be deleted.
                </div>
              ) : (
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  This tag is currently not assigned to any plants. Are you sure you want to permanently delete it?
                </p>
              )}

              <div className="flex items-center gap-2 justify-end pt-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setDeletingTag(null)}
                  disabled={isPending}
                  className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 rounded-xl font-semibold text-xs hover:bg-stone-200 min-h-[38px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isPending}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 min-h-[38px] disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isPending ? (
                    <>
                      <InlineSpinner className="w-3.5 h-3.5 text-white" />
                      <span>Deleting…</span>
                    </>
                  ) : (
                    <span>Confirm Delete</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
