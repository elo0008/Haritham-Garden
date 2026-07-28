"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateHeroBanner } from "../actions";
import type { HeroBanner } from "@/lib/types";
import { useAdminToast } from "@/components/AdminToast";

const inputCls =
  "w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-stone-100 " +
  "focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent " +
  "disabled:bg-stone-100 dark:disabled:bg-stone-900 disabled:text-stone-400 min-h-[44px]";

interface Props {
  banner: HeroBanner;
}

export function HeroBannerForm({ banner }: Props) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tagLabel, setTagLabel] = useState(banner.tag_label ?? "");
  const [title, setTitle] = useState(banner.title ?? "");
  const [description, setDescription] = useState(banner.description ?? "");
  const [backgroundImage, setBackgroundImage] = useState(banner.background_image ?? "");
  const [active, setActive] = useState(banner.active);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ── Image upload ──────────────────────────────────────────────────────────

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `hero/${crypto.randomUUID()}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("plant-photos")
        .upload(path, file, { upsert: false });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const { data: urlData } = supabase.storage
        .from("plant-photos")
        .getPublicUrl(uploadData.path);

      setBackgroundImage(urlData.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      await updateHeroBanner({
        tag_label: tagLabel.trim() || null,
        title: title.trim() || null,
        description: description.trim() || null,
        background_image: backgroundImage.trim() || null,
        active,
      });

      setSuccess(true);
      showToast("Hero Banner Updated", "Hero banner settings saved successfully");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save banner.");
    } finally {
      setSaving(false);
    }
  }

  const hasContent = tagLabel || title || description || backgroundImage;

  return (
    <div className="space-y-6">
      {/* ── Live Preview ──────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
          Live Banner Preview
        </h2>
        <div
          className="relative overflow-hidden rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-2xs bg-stone-900"
          style={{ minHeight: 200 }}
        >
          {/* Background */}
          {backgroundImage ? (
            <img
              src={backgroundImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-stone-800 to-stone-900" />
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-end h-full p-6 sm:p-8" style={{ minHeight: 200 }}>
            {tagLabel && (
              <span className="self-start mb-2 rounded-full bg-terracotta px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                {tagLabel}
              </span>
            )}
            {title ? (
              <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-1">
                {title}
              </h2>
            ) : (
              <h2 className="text-2xl sm:text-3xl font-bold text-white/40 leading-tight mb-1 italic">
                Banner Title
              </h2>
            )}
            {description && (
              <p className="text-sm text-white/80 max-w-md leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* Active/Inactive badge */}
          <div className="absolute top-3 right-3 z-10">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                active
                  ? "bg-emerald-500 text-white"
                  : "bg-stone-600/80 text-stone-300"
              }`}
            >
              {active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {!hasContent && (
          <p className="mt-2 text-xs text-stone-400 dark:text-stone-500 italic">
            Fill in the fields below to see a live preview.
          </p>
        )}
      </div>

      {/* ── Form ──────────────────────────────────────────────────────────── */}
      <form onSubmit={handleSave} className="space-y-5 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xs">
        {/* Status messages */}
        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-xs text-emerald-700 dark:text-emerald-300">
            Banner saved successfully!
          </div>
        )}

        {/* Active toggle */}
        <div className="flex items-center justify-between py-2 px-1">
          <div>
            <div className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Show on homepage
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              {active
                ? "Banner is visible to customers"
                : "Banner is hidden from the homepage"}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActive(!active)}
            disabled={saving}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 min-w-[48px] ${
              active ? "bg-terracotta" : "bg-stone-300 dark:bg-stone-700"
            }`}
            role="switch"
            aria-checked={active}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform duration-200 ${
                active ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Tag Label */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            Tag Label{" "}
            <span className="font-normal text-stone-400 dark:text-stone-500">(small pill above title)</span>
          </label>
          <input
            type="text"
            value={tagLabel}
            onChange={(e) => setTagLabel(e.target.value)}
            placeholder="e.g. NEW ARRIVAL SEASON"
            disabled={saving}
            className={inputCls}
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Fresh Monsoon Plants"
            disabled={saving}
            className={inputCls}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            Description{" "}
            <span className="font-normal text-stone-400 dark:text-stone-500">(1–2 lines)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Supporting text that appears below the title…"
            disabled={saving}
            className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 p-3 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent resize-none"
          />
        </div>

        {/* Background Image URL / Upload */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            Background Image URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={backgroundImage}
              onChange={(e) => setBackgroundImage(e.target.value)}
              placeholder="https://images.unsplash.com/…"
              disabled={saving || uploading}
              className={inputCls}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving || uploading}
              className="border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold px-4 rounded-xl shrink-0 disabled:opacity-50 transition-colors min-h-[44px]"
            >
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-stone-400 dark:text-stone-500">
            Enter an image URL or upload a file directly to Supabase storage.
          </p>
        </div>

        {/* Save button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving || uploading}
            className="bg-terracotta hover:bg-[#b04a25] text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md disabled:opacity-50 transition-all min-h-[44px]"
          >
            {saving ? "Saving…" : "Save Hero Banner"}
          </button>
        </div>
      </form>
    </div>
  );
}
