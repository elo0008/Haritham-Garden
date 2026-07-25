"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateSiteSettings } from "../actions";
import type { SiteSettings } from "@/lib/types";

const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-[#24211E] " +
  "focus:outline-none focus:ring-2 focus:ring-[#C1662F] focus:border-transparent " +
  "disabled:bg-stone-100 disabled:text-stone-400 min-h-[44px]";

interface Props {
  settings: SiteSettings;
}

export function SettingsForm({ settings }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [businessName, setBusinessName] = useState(settings.business_name ?? "Haritham Garden");
  const [tagline, setTagline] = useState(settings.tagline ?? "Fresh plants & greens for your home");
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsapp_number ?? "919876543210");
  const [logoUrl, setLogoUrl] = useState<string | null>(settings.logo_url ?? null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ── Logo Image Upload ─────────────────────────────────────────────────────

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "png";
      const path = `logo/${crypto.randomUUID()}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("plant-photos")
        .upload(path, file, { upsert: false });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const { data: urlData } = supabase.storage
        .from("plant-photos")
        .getPublicUrl(uploadData.path);

      setLogoUrl(urlData.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logo upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  // ── Save Settings ─────────────────────────────────────────────────────────

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateSiteSettings({
        logo_url: logoUrl,
        business_name: businessName,
        tagline: tagline,
        whatsapp_number: whatsappNumber,
      });
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl bg-white border border-stone-200/80 rounded-2xl p-6 shadow-2xs">
      {/* Status Messages */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-700">
          Settings saved successfully!
        </div>
      )}

      {/* ── Logo Upload ───────────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
          Header Logo Image{" "}
          <span className="font-normal text-stone-400">(optional)</span>
        </label>
        <p className="text-xs text-stone-500 mb-3">
          If uploaded, this image will replace the default text wordmark in the header. If left empty, it safely falls back to text.
        </p>

        {logoUrl && (
          <div className="relative mb-3 inline-block">
            <img
              src={logoUrl}
              alt="Site Logo"
              className="h-14 w-auto rounded-xl border border-stone-200 object-contain p-1.5 bg-stone-50"
            />
            <button
              type="button"
              onClick={() => setLogoUrl(null)}
              className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600
                         text-white rounded-full text-xs flex items-center justify-center
                         shadow transition-colors"
              title="Remove logo image"
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
          onChange={handleLogoUpload}
        />
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={saving || uploading}
            className="text-xs font-semibold border border-stone-300 rounded-xl px-4 py-2.5 min-h-[44px]
                       hover:bg-stone-50 disabled:opacity-50 transition-colors"
          >
            {uploading ? "Uploading…" : logoUrl ? "Replace Logo Image" : "+ Upload Logo Image"}
          </button>
        </div>
      </div>

      {/* ── Business Name ─────────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
          Business Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="e.g. Haritham Garden"
          required
          disabled={saving}
          className={inputCls}
        />
      </div>

      {/* ── Tagline ───────────────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
          Tagline <span className="font-normal text-stone-400">(shown under name in header)</span>
        </label>
        <input
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="e.g. Fresh plants & greens for your home"
          disabled={saving}
          className={inputCls}
        />
      </div>

      {/* ── WhatsApp Number ───────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
          WhatsApp Order Number <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={whatsappNumber}
          onChange={(e) => setWhatsappNumber(e.target.value)}
          placeholder="e.g. 919876543210"
          required
          disabled={saving}
          className={inputCls}
        />
        <p className="mt-1.5 text-xs text-stone-500 leading-relaxed">
          <span className="font-semibold text-stone-700">Format note:</span> Include country code without any <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800">+</code> or spaces (e.g. <code className="bg-stone-100 px-1 py-0.5 rounded font-mono text-stone-800">919876543210</code> for India). Customer WhatsApp order messages will be sent to this number.
        </p>
      </div>

      {/* ── Submit ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-3 border-t border-stone-100">
        <button
          type="submit"
          disabled={saving}
          className="bg-[#C1662F] hover:bg-[#A85524] active:bg-[#92481e] text-white px-5 py-3 rounded-xl
                     text-xs font-semibold min-h-[44px] shadow-xs disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
        >
          {saving ? "Saving Settings…" : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
