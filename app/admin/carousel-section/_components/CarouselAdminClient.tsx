"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  updateCarouselSectionSettings,
  createCarouselSlide,
  updateCarouselSlide,
  deleteCarouselSlide,
  reorderCarouselSlides,
} from "../actions";
import type { CarouselSectionSettings, CarouselSlide } from "@/lib/types";

const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-[#24211E] " +
  "focus:outline-none focus:ring-2 focus:ring-[#C1662F] focus:border-transparent " +
  "disabled:bg-stone-100 disabled:text-stone-400 min-h-[44px]";

interface Props {
  settings: CarouselSectionSettings;
  slides: CarouselSlide[];
}

export function CarouselAdminClient({ settings, slides }: Props) {
  const router = useRouter();
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
      router.refresh();
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  }

  // ── Handlers: Slide Add/Edit ───────────────────────────────────────────────

  function openAddModal() {
    setEditingSlide(null);
    setSlideTagLabel("");
    setSlideTitle("");
    setSlideDescription("");
    setSlideBgImage(null);
    setSlideActive(true);
    setErrorMsg(null);
    setActiveModal("add");
  }

  function openEditModal(slide: CarouselSlide) {
    setEditingSlide(slide);
    setSlideTagLabel(slide.tag_label ?? "");
    setSlideTitle(slide.title);
    setSlideDescription(slide.description);
    setSlideBgImage(slide.background_image ?? null);
    setSlideActive(slide.active);
    setErrorMsg(null);
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
    setErrorMsg(null);

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
      e.target.value = "";
    }
  }

  async function handleSaveSlide(e: React.FormEvent) {
    e.preventDefault();
    if (!slideTitle.trim() || !slideDescription.trim()) {
      setErrorMsg("Title and description are required.");
      return;
    }

    setSavingSlide(true);
    setErrorMsg(null);

    try {
      const slideData = {
        tag_label: slideTagLabel,
        title: slideTitle,
        description: slideDescription,
        background_image: slideBgImage,
        active: slideActive,
      };

      if (activeModal === "edit" && editingSlide) {
        await updateCarouselSlide(editingSlide.id, slideData);
      } else {
        await createCarouselSlide(slideData);
      }

      closeModal();
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save slide.");
    } finally {
      setSavingSlide(false);
    }
  }

  // ── Handlers: Delete ──────────────────────────────────────────────────────

  async function handleConfirmDelete() {
    if (!deletingSlide) return;
    setIsDeleting(true);
    setErrorMsg(null);

    try {
      await deleteCarouselSlide(deletingSlide.id);
      setDeletingSlide(null);
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to delete slide.");
    } finally {
      setIsDeleting(false);
    }
  }

  // ── Handlers: Reorder ─────────────────────────────────────────────────────

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
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to reorder slides.");
    }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Global Error Banner */}
      {errorMsg && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      {/* ── Section 1: Section Header & Toggle Settings ────────────────────── */}
      <form onSubmit={handleSaveSettings} className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-[#24211E]">Carousel Section Controls</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Control whether this section appears on the homepage and customize its header text.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-700">Section Enabled</span>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              disabled={savingSettings}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 min-w-[48px] ${
                enabled ? "bg-[#C1662F]" : "bg-stone-300"
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
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs text-emerald-700">
            Section settings saved successfully!
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Header Tag Pill <span className="font-normal text-stone-400">(optional, e.g. "OUR STORY")</span>
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
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Header Main Title <span className="font-normal text-stone-400">(optional)</span>
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
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Header Subtitle <span className="font-normal text-stone-400">(optional supporting text)</span>
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

        <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
          <span className="text-xs text-stone-400">
            Status: <strong className={enabled ? "text-emerald-700 font-semibold" : "text-stone-500 font-semibold"}>{enabled ? "Visible on homepage" : "Hidden (renders nothing)"}</strong>
          </span>
          <button
            type="submit"
            disabled={savingSettings}
            className="bg-[#C1662F] hover:bg-[#A85524] active:bg-[#92481e] text-white px-5 py-2.5 rounded-xl
                       text-xs font-semibold min-h-[44px] shadow-xs disabled:opacity-50 transition-colors"
          >
            {savingSettings ? "Saving Settings…" : "Save Section Settings"}
          </button>
        </div>
      </form>

      {/* ── Section 2: Slides List ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#24211E]">Carousel Slides ({slides.length})</h2>
            <p className="text-xs text-stone-500">
              Manage the individual slides displayed in the carousel.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="bg-[#C1662F] hover:bg-[#A85524] active:bg-[#92481e] text-white px-4 py-2.5
                       rounded-xl text-xs font-semibold shadow-xs min-h-[44px] flex items-center gap-1.5 transition-colors"
          >
            <span>+</span> Add New Slide
          </button>
        </div>

        {slides.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center bg-white text-stone-500 text-xs">
            No slides created yet. Click <strong>+ Add New Slide</strong> to add your first slide.
          </div>
        ) : (
          <div className="space-y-3">
            {slides.map((slide, idx) => (
              <div
                key={slide.id}
                className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-stone-200/80 shadow-2xs"
              >
                {/* Thumbnail / Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {slide.background_image ? (
                    <img
                      src={slide.background_image}
                      alt={slide.title}
                      className="w-14 h-14 object-cover rounded-xl border border-stone-200 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-stone-200/60 flex items-center justify-center text-xl shrink-0">
                      🖼️
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-sm text-[#24211E] truncate">
                        {slide.title}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          slide.active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-stone-200 text-stone-600"
                        }`}
                      >
                        {slide.active ? "Active" : "Hidden"}
                      </span>
                    </div>
                    {slide.tag_label && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C1662F] block">
                        {slide.tag_label}
                      </span>
                    )}
                    <p className="text-xs text-stone-500 truncate max-w-sm">
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
                      className="p-1 rounded hover:bg-stone-100 disabled:opacity-30 text-xs font-bold"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(idx, "down")}
                      disabled={idx === slides.length - 1}
                      className="p-1 rounded hover:bg-stone-100 disabled:opacity-30 text-xs font-bold"
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => openEditModal(slide)}
                    className="text-xs font-semibold text-stone-700 hover:text-[#C1662F] px-3 py-2 rounded-xl border border-stone-200 hover:border-stone-300 min-h-[38px] transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingSlide(slide)}
                    className="text-xs font-semibold text-red-600 hover:text-red-800 px-3 py-2 rounded-xl border border-red-200 hover:bg-red-50 min-h-[38px] transition-colors"
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
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={closeModal} />
          <form
            onSubmit={handleSaveSlide}
            className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4 text-[#24211E]"
          >
            <h3 className="text-lg font-bold text-[#24211E]">
              {activeModal === "edit" ? "Edit Slide" : "Add New Slide"}
            </h3>

            {/* Tag Label */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Slide Tag Label <span className="font-normal text-stone-400">(optional, e.g. "NURSERY HERITAGE")</span>
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
              <label className="block text-xs font-semibold text-stone-700 mb-1">
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
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Slide Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={slideDescription}
                onChange={(e) => setSlideDescription(e.target.value)}
                rows={3}
                placeholder="Slide description..."
                required
                disabled={savingSlide}
                className="w-full rounded-xl border border-stone-300 p-3 text-sm text-[#24211E] focus:outline-none focus:ring-2 focus:ring-[#C1662F] focus:border-transparent resize-none"
              />
            </div>

            {/* Background Image Upload */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Background Image <span className="font-normal text-stone-400">(optional)</span>
              </label>

              {slideBgImage && (
                <div className="relative mb-2 inline-block">
                  <img
                    src={slideBgImage}
                    alt="Preview"
                    className="h-20 w-auto rounded-xl border border-stone-200 object-cover"
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
                  className="text-xs font-semibold border border-stone-300 rounded-xl px-4 py-2.5 min-h-[44px] hover:bg-stone-50 transition-colors"
                >
                  {uploadingImage ? "Uploading…" : slideBgImage ? "Replace Image" : "+ Upload Image"}
                </button>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-semibold text-stone-700">Slide Active</span>
              <button
                type="button"
                onClick={() => setSlideActive(!slideActive)}
                disabled={savingSlide}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ${
                  slideActive ? "bg-[#C1662F]" : "bg-stone-300"
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
            <div className="flex gap-2 pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={closeModal}
                disabled={savingSlide}
                className="flex-1 min-h-[44px] rounded-xl border border-stone-300 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingSlide || uploadingImage}
                className="flex-1 min-h-[44px] rounded-xl bg-[#C1662F] hover:bg-[#A85524] active:bg-[#92481e] py-2.5 text-xs font-semibold text-white shadow-xs disabled:opacity-50"
              >
                {savingSlide ? "Saving..." : activeModal === "edit" ? "Update Slide" : "Add Slide"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Slide Delete Confirmation Modal ───────────────────────────────── */}
      {deletingSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setDeletingSlide(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl text-center text-[#24211E]">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 text-xl">
              ⚠️
            </div>
            <h3 className="text-base font-bold text-[#24211E] mb-1">
              Delete slide &quot;{deletingSlide.title}&quot;?
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              This will permanently delete this slide from the carousel.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeletingSlide(null)}
                disabled={isDeleting}
                className="flex-1 min-h-[44px] rounded-xl border border-stone-300 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 min-h-[44px] rounded-xl bg-red-600 hover:bg-red-700 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
