"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createPlant, updatePlant } from "../actions";
import type {
  Plant,
  PlantCategory,
  PlantSunlight,
  PlantWatering,
  PlantAvailability,
  PlantWriteData,
} from "@/lib/types";

// ── Label maps ────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS: { value: PlantCategory; label: string }[] = [
  { value: "indoor", label: "Indoor" },
  { value: "outdoor", label: "Outdoor" },
  { value: "flowering", label: "Flowering" },
  { value: "fruit", label: "Fruit" },
  { value: "other", label: "Other" },
];

const SUNLIGHT_OPTIONS: { value: PlantSunlight; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "full_sun", label: "Full Sun" },
];

const WATERING_OPTIONS: { value: PlantWatering; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const AVAILABILITY_OPTIONS: { value: PlantAvailability; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "limited", label: "Limited" },
  { value: "unavailable", label: "Unavailable" },
];

// ── Shared input class ────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent " +
  "disabled:bg-gray-50 disabled:text-gray-500";

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  initialData?: Plant;
}

type NewFile = { id: string; file: File; preview: string };

export function PlantForm({ initialData }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Field state ──────────────────────────────────────────────────────────────
  const [name, setName] = useState(initialData?.name ?? "");
  const [localName, setLocalName] = useState(initialData?.local_name ?? "");
  const [category, setCategory] = useState<PlantCategory | "">(
    initialData?.category ?? ""
  );
  const [description, setDescription] = useState(
    initialData?.description ?? ""
  );
  const [sunlight, setSunlight] = useState<PlantSunlight>(
    initialData?.sunlight ?? "medium"
  );
  const [watering, setWatering] = useState<PlantWatering>(
    initialData?.watering ?? "medium"
  );
  const [price, setPrice] = useState(
    initialData?.price != null ? String(initialData.price) : ""
  );
  const [availability, setAvailability] = useState<PlantAvailability>(
    initialData?.availability ?? "available"
  );
  const [shippable, setShippable] = useState(initialData?.shippable ?? true);

  // ── Photo state ──────────────────────────────────────────────────────────────
  const [existingPhotos, setExistingPhotos] = useState<string[]>(
    initialData?.photos ?? []
  );
  const [removedPhotos, setRemovedPhotos] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<NewFile[]>([]);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Photo handlers ───────────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const items: NewFile[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewFiles((prev) => [...prev, ...items]);
    e.target.value = ""; // reset so same file can be re-selected
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

  // ── Submit ───────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) { setError("Plant name is required."); return; }
    if (!category) { setError("Category is required."); return; }
    const parsedPrice = parseFloat(price);
    if (!price || isNaN(parsedPrice) || parsedPrice < 0) {
      setError("A valid price is required.");
      return;
    }

    setSaving(true);

    try {
      // 1. Upload new photos client-side using the browser Supabase client
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

      // 3. Call server action
      const plantData: PlantWriteData = {
        name: name.trim(),
        local_name: localName.trim() || null,
        category: category as PlantCategory,
        description: description.trim() || null,
        sunlight,
        watering,
        price: parsedPrice,
        availability,
        shippable,
        photos,
      };

      if (initialData) {
        await updatePlant(initialData.id, plantData, removedPhotos);
      } else {
        await createPlant(plantData);
      }

      router.push("/admin/plants");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Error banner */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Row 1: Name + Local Name ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Snake Plant"
            disabled={saving}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Local Name{" "}
            <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            placeholder="e.g. Muthukamini"
            disabled={saving}
            className={inputCls}
          />
        </div>
      </div>

      {/* ── Row 2: Category + Price ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as PlantCategory)}
            disabled={saving}
            className={inputCls}
          >
            <option value="" disabled>
              Select category…
            </option>
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min={0}
            step={0.01}
            placeholder="0"
            disabled={saving}
            className={inputCls}
          />
        </div>
      </div>

      {/* ── Row 3: Sunlight + Watering ───────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sunlight
          </label>
          <select
            value={sunlight}
            onChange={(e) => setSunlight(e.target.value as PlantSunlight)}
            disabled={saving}
            className={inputCls}
          >
            {SUNLIGHT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Watering
          </label>
          <select
            value={watering}
            onChange={(e) => setWatering(e.target.value as PlantWatering)}
            disabled={saving}
            className={inputCls}
          >
            {WATERING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Row 4: Availability + Shippable ─────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Availability
          </label>
          <select
            value={availability}
            onChange={(e) =>
              setAvailability(e.target.value as PlantAvailability)
            }
            disabled={saving}
            className={inputCls}
          >
            {AVAILABILITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 pb-2">
          <input
            id="shippable"
            type="checkbox"
            checked={shippable}
            onChange={(e) => setShippable(e.target.checked)}
            disabled={saving}
            className="w-4 h-4 rounded border-gray-300 text-green-600
                       focus:ring-green-500 cursor-pointer"
          />
          <label
            htmlFor="shippable"
            className="text-sm font-medium text-gray-700 cursor-pointer"
          >
            Available for shipping
          </label>
        </div>
      </div>

      {/* ── Description ─────────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description{" "}
          <span className="font-normal text-gray-400">(1–2 sentences)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Brief description of the plant…"
          disabled={saving}
          className={inputCls + " resize-none"}
        />
      </div>

      {/* ── Photos ──────────────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Photos
        </label>

        {/* Preview grid */}
        {(existingPhotos.length > 0 || newFiles.length > 0) && (
          <div className="flex flex-wrap gap-3 mb-3">
            {existingPhotos.map((url) => (
              <div key={url} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removeExistingPhoto(url)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600
                             text-white rounded-full text-xs flex items-center justify-center
                             shadow transition-colors"
                  title="Remove photo"
                >
                  ×
                </button>
              </div>
            ))}
            {newFiles.map((item) => (
              <div key={item.id} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.preview}
                  alt=""
                  className="w-20 h-20 object-cover rounded-lg border border-blue-200"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-blue-500/70 text-white
                                text-[10px] text-center rounded-b-lg py-0.5">
                  new
                </div>
                <button
                  type="button"
                  onClick={() => removeNewFile(item.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600
                             text-white rounded-full text-xs flex items-center justify-center
                             shadow transition-colors"
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
          className="text-sm border border-gray-300 rounded-lg px-3 py-2
                     hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          + Add Photos
        </button>
        <p className="mt-1.5 text-xs text-gray-400">
          Photos are uploaded on save. New photos are marked in blue.
        </p>
      </div>

      {/* ── Slug note ────────────────────────────────────────────────────── */}
      <p className="text-xs text-gray-400">
        The URL slug is auto-generated from the plant name when you save.
      </p>

      {/* ── Submit / Cancel ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg
                     text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
        >
          {saving
            ? "Saving…"
            : initialData
            ? "Update Plant"
            : "Add Plant"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={saving}
          className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
