"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { createPlant, updatePlant, createTag } from "../actions";
import { TagPicker } from "@/components/TagPicker";
import type {
  Plant,
  Tag,
  PlantSunlight,
  PlantWatering,
  PlantAvailability,
  PlantWriteData,
} from "@/lib/types";

import { useAdminToast } from "@/components/AdminToast";
import { CustomDropdown } from "@/components/CustomDropdown";
import { InlineSpinner } from "@/components/Skeletons";

// ── Option Maps ───────────────────────────────────────────────────────────────

const SUNLIGHT_OPTIONS: { value: PlantSunlight; label: string }[] = [
  { value: "low", label: "Low Light" },
  { value: "medium", label: "Medium / Indirect" },
  { value: "full_sun", label: "Full Sun" },
];

const WATERING_OPTIONS: { value: PlantWatering; label: string }[] = [
  { value: "low", label: "Low Water" },
  { value: "medium", label: "Medium Water" },
  { value: "high", label: "High Water" },
];

const AVAILABILITY_OPTIONS: { value: PlantAvailability; label: string }[] = [
  { value: "available", label: "Available (In Stock)" },
  { value: "limited", label: "Limited Stock" },
  { value: "unavailable", label: "Unavailable (Out of Stock)" },
];

// ── Shared Input Styling ──────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-stone-100 " +
  "focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent " +
  "disabled:bg-stone-100 dark:disabled:bg-stone-900 disabled:text-stone-400 min-h-[44px]";

interface PlantFormProps {
  initialData?: Plant;
  /** All available tags from the database */
  allTags: Tag[];
  /** Tag IDs currently assigned to this plant (for edit mode) */
  initialTagIds?: string[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

type NewFile = { id: string; file: File; preview: string };

export function PlantForm({
  initialData,
  allTags: initialAllTags,
  initialTagIds,
  onSuccess,
  onCancel,
}: PlantFormProps) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Field State ──────────────────────────────────────────────────────────────
  const [name, setName] = useState(initialData?.name ?? "");
  const [localName, setLocalName] = useState(initialData?.local_name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [sunlight, setSunlight] = useState<PlantSunlight>(
    initialData?.sunlight ?? "medium"
  );
  const [watering, setWatering] = useState<PlantWatering>(
    initialData?.watering ?? "medium"
  );
  const [price, setPrice] = useState(
    initialData?.price != null ? String(initialData.price) : ""
  );
  const [salePrice, setSalePrice] = useState(
    initialData?.sale_price != null ? String(initialData.sale_price) : ""
  );
  const [availability, setAvailability] = useState<PlantAvailability>(
    initialData?.availability ?? "available"
  );
  const [shippable, setShippable] = useState(initialData?.shippable ?? true);

  // ── Tag State ────────────────────────────────────────────────────────────────
  const [allTags, setAllTags] = useState<Tag[]>(initialAllTags);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    initialTagIds ?? []
  );

  // ── Photo State ──────────────────────────────────────────────────────────────
  const [existingPhotos, setExistingPhotos] = useState<string[]>(
    initialData?.photos ?? []
  );
  const [removedPhotos, setRemovedPhotos] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<NewFile[]>([]);

  // ── UI State ─────────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);

  // Realtime active edit conflict protection
  useRealtimeSubscription<Plant>({
    table: "plants",
    filter: initialData ? `id=eq.${initialData.id}` : undefined,
    enabled: Boolean(initialData),
    onUpdate: (updatedPlant) => {
      if (updatedPlant.updated_at !== initialData?.updated_at) {
        setConflictError(
          "This plant record was updated in another session. Please refresh the page to load the latest changes before saving."
        );
      }
    },
  });

  // ── Photo Handlers ───────────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const items: NewFile[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewFiles((prev) => [...prev, ...items]);
    e.target.value = "";
  }

  function removeExistingPhoto(url: string) {
    setExistingPhotos((prev) => prev.filter((p) => p !== url));
    setRemovedPhotos((prev) => [...prev, url]);
  }

  function removeNewFile(id: string) {
    setNewFiles((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((f) => f.id !== id);
    });
  }

  const [tagNote, setTagNote] = useState<string | null>(null);

  // ── Tag Creation Handler ─────────────────────────────────────────────────────

  async function handleCreateTag(tagName: string): Promise<Tag> {
    setTagNote(null);
    const res = await createTag(tagName);
    if (res.isExisting) {
      setTagNote(`Using existing tag '${res.tag.name}'`);
      setTimeout(() => setTagNote(null), 4000);
      if (!allTags.some((t) => t.id === res.tag.id)) {
        setAllTags((prev) => [...prev, res.tag]);
      }
    } else {
      setAllTags((prev) => [...prev, res.tag]);
    }
    return res.tag;
  }

  // ── Submit Form ──────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError("Plant name is required.");
      return;
    }
    if (selectedTagIds.length === 0) {
      setError("At least one tag is required.");
      return;
    }
    const parsedPrice = parseFloat(price);
    if (!price || isNaN(parsedPrice) || parsedPrice < 0) {
      setError("A valid regular price is required.");
      return;
    }

    let parsedSalePrice: number | null = null;
    if (salePrice.trim() !== "") {
      const pSale = parseFloat(salePrice);
      if (isNaN(pSale) || pSale < 0) {
        setError("Sale price must be a valid non-negative number.");
        return;
      }
      if (pSale >= parsedPrice) {
        setError("Sale price must be less than regular price.");
        return;
      }
      parsedSalePrice = pSale;
    }

    setSaving(true);

    try {
      // 1. Upload new files to Supabase Storage
      const supabase = createClient();
      const uploadedUrls: string[] = [];

      for (const item of newFiles) {
        const ext = item.file.name.split(".").pop() ?? "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;

        const { data: uploadData, error: uploadError } =
          await supabase.storage
            .from("plant-photos")
            .upload(path, item.file, { upsert: false });

        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

        const { data: urlData } = supabase.storage
          .from("plant-photos")
          .getPublicUrl(uploadData.path);

        uploadedUrls.push(urlData.publicUrl);
      }

      // 2. Build final photo list
      const photos = [...existingPhotos, ...uploadedUrls];

      // 3. Save plant write data
      const plantData: PlantWriteData = {
        name: name.trim(),
        local_name: localName.trim() || null,
        description: description.trim() || null,
        sunlight,
        watering,
        price: parsedPrice,
        sale_price: parsedSalePrice,
        availability,
        shippable,
        photos,
      };

      if (initialData) {
        await updatePlant(initialData.id, plantData, removedPhotos, selectedTagIds);
        showToast("Plant Updated", `'${name.trim()}' successfully updated`);
      } else {
        await createPlant(plantData, selectedTagIds);
        showToast("Plant Created", `'${name.trim()}' added to catalogue`);
      }

      router.refresh();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/admin?tab=plants");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Conflict error banner */}
      {conflictError && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-4 py-3 text-xs font-semibold text-amber-800 dark:text-amber-300">
          ⚠️ {conflictError}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* ── Row 1: Name + Local Name ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            Plant Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Red Anthurium"
            disabled={saving}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            Local Name{" "}
            <span className="font-normal text-stone-400 dark:text-stone-500">(optional)</span>
          </label>
          <input
            type="text"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            placeholder="e.g. Chuvappu Anthurium"
            disabled={saving}
            className={inputCls}
          />
        </div>
      </div>

      {/* ── Row 2: Tags ─────────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
          Tags <span className="text-red-500">*</span>
        </label>
        <TagPicker
          allTags={allTags}
          selectedTagIds={selectedTagIds}
          onChange={setSelectedTagIds}
          onCreateTag={handleCreateTag}
          disabled={saving}
          placeholder="Search or add tags…"
        />
        {tagNote && (
          <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 mt-1">
            ℹ️ {tagNote}
          </p>
        )}
      </div>

      {/* ── Row 3: Regular Price + Sale Price ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            Regular Price (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min={0}
            step={0.01}
            placeholder="e.g. 200"
            disabled={saving}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            Sale Price (₹){" "}
            <span className="font-normal text-stone-400 dark:text-stone-500">
              (optional — leave empty for no sale)
            </span>
          </label>
          <input
            type="number"
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
            min={0}
            step={0.01}
            placeholder="e.g. 150"
            disabled={saving}
            className={inputCls}
          />
        </div>
      </div>

      {/* ── Row 3: Sunlight + Watering ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            Sunlight Requirement
          </label>
          <CustomDropdown
            value={sunlight}
            options={SUNLIGHT_OPTIONS}
            onChange={(val) => setSunlight(val as PlantSunlight)}
            disabled={saving}
            className="w-full"
            buttonClassName="w-full"
            ariaLabel="Sunlight requirement"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            Watering Need
          </label>
          <CustomDropdown
            value={watering}
            options={WATERING_OPTIONS}
            onChange={(val) => setWatering(val as PlantWatering)}
            disabled={saving}
            className="w-full"
            buttonClassName="w-full"
            ariaLabel="Watering need"
          />
        </div>
      </div>

      {/* ── Row 4: Availability + Shippable ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            Initial Availability Status
          </label>
          <CustomDropdown
            value={availability}
            options={AVAILABILITY_OPTIONS}
            onChange={(val) => setAvailability(val as PlantAvailability)}
            disabled={saving}
            className="w-full"
            buttonClassName="w-full"
            ariaLabel="Initial availability status"
          />
        </div>
        <div className="flex items-center gap-2.5 pb-2.5 min-h-[44px]">
          <input
            id="shippable"
            type="checkbox"
            checked={shippable}
            onChange={(e) => setShippable(e.target.checked)}
            disabled={saving}
            className="w-4 h-4 rounded border-stone-300 text-terracotta focus:ring-terracotta cursor-pointer"
          />
          <label
            htmlFor="shippable"
            className="text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer"
          >
            Available for courier shipping
          </label>
        </div>
      </div>

      {/* ── Description ─────────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
          Short Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Brief nursery description of the plant…"
          disabled={saving}
          className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 p-3 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent resize-none"
        />
      </div>

      {/* ── Photos Section ──────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
          Plant Photos
        </label>

        {(existingPhotos.length > 0 || newFiles.length > 0) && (
          <div className="flex flex-wrap gap-3 mb-3">
            {existingPhotos.map((url) => (
              <div key={url} className="relative group">
                <img
                  src={url}
                  alt="Plant photo"
                  className="w-20 h-20 object-cover rounded-xl border border-stone-200 dark:border-stone-700"
                />
                <button
                  type="button"
                  onClick={() => removeExistingPhoto(url)}
                  className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center shadow transition-colors"
                  title="Remove photo"
                >
                  ×
                </button>
              </div>
            ))}
            {newFiles.map((item) => (
              <div key={item.id} className="relative group">
                <img
                  src={item.preview}
                  alt="New photo"
                  className="w-20 h-20 object-cover rounded-xl border-2 border-terracotta"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-terracotta text-white text-[10px] text-center font-bold rounded-b-xl py-0.5 uppercase">
                  New
                </div>
                <button
                  type="button"
                  onClick={() => removeNewFile(item.id)}
                  className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center shadow transition-colors"
                  title="Remove photo"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={saving}
          className="text-xs font-semibold border border-stone-300 dark:border-stone-700 rounded-xl px-4 py-2.5 min-h-[44px] hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-50 transition-colors text-stone-700 dark:text-stone-200"
        >
          + Upload Photos
        </button>
        <p className="mt-1.5 text-xs text-stone-400 dark:text-stone-500">
          Photos are uploaded to Supabase Storage when you save.
        </p>
      </div>

      {/* ── Action Buttons ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
        <button
          type="button"
          onClick={() => (onCancel ? onCancel() : router.back())}
          disabled={saving}
          className="text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white px-5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 min-h-[44px] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="bg-terracotta hover:bg-[#b04a25] text-white px-6 py-2.5 rounded-xl text-xs font-bold min-h-[44px] shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {saving ? (
            <>
              <InlineSpinner className="w-4 h-4 text-white" />
              <span>Saving Plant...</span>
            </>
          ) : (
            <span>{initialData ? "Update Plant" : "Save & Add Plant"}</span>
          )}
        </button>
      </div>
    </form>
  );
}
