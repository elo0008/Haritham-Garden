"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  updateCarouselSectionSettings,
  createCarouselSlide,
  updateCarouselSlide,
  deleteCarouselSlide,
  reorderCarouselSlides,
} from "../actions";
import type { CarouselSectionSettings, CarouselSlide } from "@/lib/types";
import { useAdminToast } from "@/components/AdminToast";

const inputCls =
  "w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-stone-100 " +
  "focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent " +
  "disabled:bg-stone-100 dark:disabled:bg-stone-900 disabled:text-stone-400 min-h-[44px]";

interface Props {
  settings: CarouselSectionSettings;
  slides: CarouselSlide[];
}

export function CarouselAdminClient({ settings, slides }: Props) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Section Settings State ────────────────────────────────────────────────
  const [enabled, setEnabled] = useState(settings.enabled);
  const [headerTag, setHeaderTag] = useState(settings.header_tag ?? "");
  const [headerTitle, setHeaderTitle] = useState(settings.header_title ?? "");
  const [headerSubtitle, setHeaderSubtitle] = useState(settings.header_subtitle ?? "");

  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // ── Slide Modal State (Add or Edit) ───────────────────────────────────────
  const [activeModal, setActiveModal] = useState<"add" | "edit" | null>(null);
  const [editingSlide, setEditingSlide] = useState<CarouselSlide | null>(null);

  const [slideTagLabel, setSlideTagLabel] = useState("");
  const [slideTitle, setSlideTitle] = useState("");
  const [slideDescription, setSlideDescription] = useState("");
  const [slideBgImage, setSlideBgImage] = useState<string | null>(null);
  const [slideActive, setSlideActive] = useState(true);

  const [savingSlide, setSavingSlide] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // ── Delete Confirmation Modal State ───────────────────────────────────────
  const [deletingSlide, setDeletingSlide] = useState<CarouselSlide | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Error Banner ──────────────────────────────────────────────────────────
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Handlers: Section Settings ────────────────────────────────────────────

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    setErrorMsg(null);
    setSettingsSuccess(false);

    try {
      await updateCarouselSectionSettings({
        enabled,
        header_tag: headerTag,
        header_title: headerTitle,
        header_subtitle: headerSubtitle,
      });
      setSettingsSuccess(true);
      showToast("Carousel Settings Saved", "Carousel section settings updated successfully");
      router.refresh();
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  }

  // ── Handlers: Slide Add/Edit Modal ────────────────────────────────────────

  function openAddModal() {
    setEditingSlide(null);
    setSlideTagLabel("");
    setSlideTitle("");
    setSlideDescription("");
    setSlideBgImage(null);
    setSlideActive(true);
    setActiveModal("add");
  }

  function openEditModal(slide: CarouselSlide) {
    setEditingSlide(slide);
    setSlideTagLabel(slide.tag_label ?? "");
    setSlideTitle(slide.title);
    setSlideDescription(slide.description);
    setSlideBgImage(slide.background_image ?? null);
    setSlideActive(slide.active);
    setActiveModal("edit");
  }

  function closeModal() {
    setActiveModal(null);
    setEditingSlide(null);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `carousel/${crypto.randomUUID()}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("plant-photos")
        .upload(path, file, { upsert: false });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const { data: urlData } = supabase.storage
        .from("plant-photos")
        .getPublicUrl(uploadData.path);

      setSlideBgImage(urlData.publicUrl);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSaveSlide(e: React.FormEvent) {
    e.preventDefault();
    if (!slideTitle.trim() || !slideDescription.trim()) return;

    setSavingSlide(true);
    setErrorMsg(null);

    try {
      if (activeModal === "edit" && editingSlide) {
        await updateCarouselSlide(editingSlide.id, {
          tag_label: slideTagLabel.trim() || null,
          title: slideTitle.trim(),
          description: slideDescription.trim(),
          background_image: slideBgImage,
          active: slideActive,
        });
        showToast("Carousel Slide Updated", `'${slideTitle.trim()}' updated successfully`);
      } else {
        await createCarouselSlide({
          tag_label: slideTagLabel.trim() || null,
          title: slideTitle.trim(),
          description: slideDescription.trim(),
          background_image: slideBgImage,
          active: slideActive,
        });
        showToast("Carousel Slide Created", `'${slideTitle.trim()}' created successfully`);
      }

      closeModal();
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save slide.");
    } finally {
      setSavingSlide(false);
    }
  }

  // ── Handlers: Delete Slide ────────────────────────────────────────────────

  async function handleConfirmDelete() {
    if (!deletingSlide) return;
    setIsDeleting(true);
    setErrorMsg(null);

    try {
      await deleteCarouselSlide(deletingSlide.id);
      showToast("Slide Deleted", `'${deletingSlide.title}' removed from carousel`);
      setDeletingSlide(null);
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to delete slide.");
    } finally {
      setIsDeleting(false);
    }
  }

  // ── Handlers: Reorder Slides ──────────────────────────────────────────────

  async function handleMove(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const newSlides = [...slides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIndex];
    newSlides[targetIndex] = temp;

    const reordered = newSlides.map((s, idx) => ({
      id: s.id,
      display_order: idx + 1,
    }));

    try {
      await reorderCarouselSlides(reordered);
      showToast("Slide Order Saved", "Updated slide display sequence");
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to reorder slides.");
    }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Global Error Banner */}
      {errorMsg && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3 text-xs text-red-700 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      {/* ── Section 1: Section Header & Toggle Settings ────────────────────── */}
      <form onSubmit={handleSaveSettings} className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Carousel Section Controls
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Control whether this section appears on the homepage and customize its header text.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Section Enabled
            </span>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              disabled={savingSettings}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 min-w-[48px] ${
                enabled ? "bg-terracotta" : "bg-stone-300 dark:bg-stone-700"
              }`}
              role="switch"
              aria-checked={enabled}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform duration-200 ${
                  enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {settingsSuccess && (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-4 py-2.5 text-xs text-emerald-700 dark:text-emerald-300">
            Section settings saved successfully!
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Header Tag Pill <span className="font-normal text-stone-400 dark:text-stone-500">(optional, e.g. "OUR STORY")</span>
            </label>
            <input
              type="text"
              value={headerTag}
              onChange={(e) => setHeaderTag(e.target.value)}
              placeholder="e.g. OUR STORY"
              disabled={savingSettings}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Header Main Title <span className="font-normal text-stone-400 dark:text-stone-500">(optional)</span>
            </label>
            <input
              type="text"
              value={headerTitle}
              onChange={(e) => setHeaderTitle(e.target.value)}
              placeholder="e.g. Rooted in Passion, Grown with Care."
              disabled={savingSettings}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Header Subtitle <span className="font-normal text-stone-400 dark:text-stone-500">(optional supporting text)</span>
            </label>
            <input
              type="text"
              value={headerSubtitle}
              onChange={(e) => setHeaderSubtitle(e.target.value)}
              placeholder="e.g. Learn how Haritham Garden brings natural greens to your living space."
              disabled={savingSettings}
              className={inputCls}
            />
          </div>
        </div>

        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <span className="text-xs text-stone-400 dark:text-stone-500">
            Status: <strong className={enabled ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-stone-500 font-semibold"}>{enabled ? "Visible on homepage" : "Hidden (renders nothing)"}</strong>
          </span>
          <button
            type="submit"
            disabled={savingSettings}
            className="bg-terracotta hover:bg-[#b04a25] text-white px-5 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] shadow-md disabled:opacity-50 transition-all"
          >
            {savingSettings ? "Saving Settings…" : "Save Section Settings"}
          </button>
        </div>
      </form>

      {/* ── Section 2: Slides List ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Carousel Slides ({slides.length})
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Manage the individual slides displayed in the carousel.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="bg-terracotta hover:bg-[#b04a25] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md min-h-[44px] flex items-center gap-1.5 transition-all"
          >
            <span>+</span> Add New Slide
          </button>
        </div>

        {slides.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 p-8 text-center bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 text-xs">
            No slides created yet. Click <strong>+ Add New Slide</strong> to add your first slide.
          </div>
        ) : (
          <div className="space-y-3">
            {slides.map((slide, idx) => (
              <div
                key={slide.id}
                className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xs"
              >
                {/* Thumbnail / Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {slide.background_image ? (
                    <img
                      src={slide.background_image}
                      alt={slide.title}
                      className="w-14 h-14 object-cover rounded-xl border border-stone-200 dark:border-stone-700 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-stone-200/60 dark:bg-stone-800 flex items-center justify-center text-xl shrink-0">
                      🖼️
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-sm text-stone-900 dark:text-stone-100 truncate">
                        {slide.title}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          slide.active
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400"
                        }`}
                      >
                        {slide.active ? "Active" : "Hidden"}
                      </span>
                    </div>
                    {slide.tag_label && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta block">
                        {slide.tag_label}
                      </span>
                    )}
                    <p className="text-xs text-stone-500 dark:text-stone-400 truncate max-w-sm">
                      {slide.description}
                    </p>
                  </div>
                </div>

                {/* Actions: Reorder & Edit / Delete */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => handleMove(idx, "up")}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 disabled:opacity-30 text-xs font-bold"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(idx, "down")}
                      disabled={idx === slides.length - 1}
                      className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 disabled:opacity-30 text-xs font-bold"
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => openEditModal(slide)}
                    className="text-xs font-semibold text-stone-700 dark:text-stone-200 hover:text-terracotta px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-stone-300 min-h-[38px] transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingSlide(slide)}
                    className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-800 border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/40 px-3 py-2 rounded-xl min-h-[38px] transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Slide Add / Edit Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs"
              onClick={closeModal}
            />
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onSubmit={handleSaveSlide}
              className="relative z-10 w-full max-w-lg rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-4 sm:p-8 shadow-xl space-y-4 text-stone-900 dark:text-stone-100 max-h-[90vh] overflow-y-auto max-w-[calc(100vw-1.5rem)] min-w-0"
            >
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                {activeModal === "edit" ? "Edit Slide" : "Add New Slide"}
              </h3>

              {/* Tag Label */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Slide Tag Label <span className="font-normal text-stone-400 dark:text-stone-500">(optional, e.g. "NURSERY HERITAGE")</span>
                </label>
                <input
                  type="text"
                  value={slideTagLabel}
                  onChange={(e) => setSlideTagLabel(e.target.value)}
                  placeholder="e.g. NURSERY HERITAGE"
                  disabled={savingSlide}
                  className={inputCls}
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Slide Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={slideTitle}
                  onChange={(e) => setSlideTitle(e.target.value)}
                  placeholder="Slide title..."
                  required
                  disabled={savingSlide}
                  className={inputCls}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Slide Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={slideDescription}
                  onChange={(e) => setSlideDescription(e.target.value)}
                  rows={3}
                  placeholder="Slide description..."
                  required
                  disabled={savingSlide}
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 p-3 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent resize-none"
                />
              </div>

              {/* Background Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Background Image <span className="font-normal text-stone-400 dark:text-stone-500">(optional)</span>
                </label>

                {slideBgImage && (
                  <div className="relative mb-2 inline-block">
                    <img
                      src={slideBgImage}
                      alt="Preview"
                      className="h-20 w-auto rounded-xl border border-stone-200 dark:border-stone-700 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setSlideBgImage(null)}
                      className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center shadow"
                    >
                      ×
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={savingSlide || uploadingImage}
                    className="text-xs font-semibold border border-stone-300 dark:border-stone-700 rounded-xl px-4 py-2.5 min-h-[44px] hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-stone-700 dark:text-stone-200"
                  >
                    {uploadingImage ? "Uploading…" : slideBgImage ? "Replace Image" : "+ Upload Image"}
                  </button>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">Slide Active</span>
                <button
                  type="button"
                  onClick={() => setSlideActive(!slideActive)}
                  disabled={savingSlide}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ${
                    slideActive ? "bg-terracotta" : "bg-stone-300 dark:bg-stone-700"
                  }`}
                  role="switch"
                  aria-checked={slideActive}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform duration-200 ${
                      slideActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-2 pt-4 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={savingSlide}
                  className="flex-1 min-h-[44px] rounded-xl border border-stone-300 dark:border-stone-700 py-2.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSlide || uploadingImage}
                  className="flex-1 min-h-[44px] rounded-xl bg-terracotta hover:bg-[#b04a25] py-2.5 text-xs font-semibold text-white shadow-md disabled:opacity-50"
                >
                  {savingSlide ? "Saving..." : activeModal === "edit" ? "Update Slide" : "Add Slide"}
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* ── Slide Delete Confirmation Modal ───────────────────────────────── */}
      <AnimatePresence>
        {deletingSlide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs"
              onClick={() => setDeletingSlide(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative z-10 w-full max-w-sm rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-6 shadow-xl text-center text-stone-900 dark:text-stone-100"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-xl">
                ⚠️
              </div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-1">
                Delete slide &quot;{deletingSlide.title}&quot;?
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">
                This will permanently delete this slide from the carousel.
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeletingSlide(null)}
                  disabled={isDeleting}
                  className="flex-1 min-h-[44px] rounded-xl border border-stone-300 dark:border-stone-700 py-2.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 min-h-[44px] rounded-xl bg-red-600 hover:bg-red-700 py-2.5 text-xs font-semibold text-white disabled:opacity-50 shadow-md"
                >
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
