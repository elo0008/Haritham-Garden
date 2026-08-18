"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateSiteSettings } from "../actions";
import type { SiteSettings } from "@/lib/types";
import { useAdminToast } from "@/components/AdminToast";
import { InlineSpinner } from "@/components/Skeletons";

const inputCls =
  "w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-stone-100 " +
  "focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent " +
  "disabled:bg-stone-100 dark:disabled:bg-stone-900 disabled:text-stone-400 min-h-[44px]";

interface Props {
  settings: SiteSettings;
}

export function SettingsForm({ settings }: Props) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Branding fields
  const [businessName, setBusinessName] = useState(settings.business_name ?? "Haritham Garden");
  const [tagline, setTagline] = useState(settings.tagline ?? "Fresh plants & greens for your home");
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsapp_number ?? "919876543210");
  const [logoUrl, setLogoUrl] = useState<string | null>(settings.logo_url ?? null);

  // Shop Info / Footer fields
  const [locationText, setLocationText] = useState(settings.location_text ?? "");
  const [serviceAreaText, setServiceAreaText] = useState(settings.service_area_text ?? "");
  const [instagramUrl, setInstagramUrl] = useState(settings.instagram_url ?? "");
  const [contactPhone, setContactPhone] = useState(settings.contact_phone ?? "");
  const [secondarySocialLabel, setSecondarySocialLabel] = useState(settings.secondary_social_label ?? "");
  const [secondarySocialUrl, setSecondarySocialUrl] = useState(settings.secondary_social_url ?? "");

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
        location_text: locationText,
        service_area_text: serviceAreaText,
        instagram_url: instagramUrl,
        contact_phone: contactPhone,
        secondary_social_label: secondarySocialLabel,
        secondary_social_url: secondarySocialUrl,
      });
      setSuccess(true);
      showToast("Settings Saved", "Storefront settings updated successfully");
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xs">
      {/* Status Messages */}
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-xs text-emerald-700 dark:text-emerald-300">
          Settings saved successfully!
        </div>
      )}

      {/* ── Section 1: Header & Branding ──────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-4 pb-2 border-b border-stone-100 dark:border-stone-800">
          Branding & Header
        </h2>

        <div className="space-y-5">
          {/* Logo Upload */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Header Logo Image{" "}
              <span className="font-normal text-stone-400 dark:text-stone-500">(optional)</span>
            </label>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
              If uploaded, this image will replace the default text wordmark in the header. If left empty, it safely falls back to text.
            </p>

            {logoUrl && (
              <div className="relative mb-3 inline-block">
                <img
                  src={logoUrl}
                  alt="Site Logo"
                  className="h-14 w-auto rounded-xl border border-stone-200 dark:border-stone-700 object-contain p-1.5 bg-stone-50 dark:bg-stone-800"
                />
                <button
                  type="button"
                  onClick={() => setLogoUrl(null)}
                  className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center shadow transition-colors"
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
                className="text-xs font-semibold border border-stone-300 dark:border-stone-700 rounded-xl px-4 py-2.5 min-h-[44px] hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-stone-700 dark:text-stone-200 disabled:opacity-50 flex items-center gap-1.5"
              >
                {uploading ? (
                  <>
                    <InlineSpinner className="w-3.5 h-3.5 text-stone-700 dark:text-stone-200" />
                    <span>Uploading…</span>
                  </>
                ) : logoUrl ? (
                  "Replace Logo Image"
                ) : (
                  "+ Upload Logo Image"
                )}
              </button>
            </div>
          </div>

          {/* Business Name */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
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

          {/* Tagline */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Tagline <span className="font-normal text-stone-400 dark:text-stone-500">(shown under name in header)</span>
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

          {/* WhatsApp Number */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
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
            <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              <span className="font-semibold text-stone-700 dark:text-stone-300">Format note:</span> Include country code without any <code className="bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded text-stone-800 dark:text-stone-200">+</code> or spaces (e.g. <code className="bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded font-mono text-stone-800 dark:text-stone-200">919876543210</code> for India). Customer WhatsApp order messages will be sent to this number.
            </p>
          </div>
        </div>
      </div>

      {/* ── Section 2: Shop Info & Footer ─────────────────────────────────── */}
      <div className="pt-4">
        <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-4 pb-2 border-b border-stone-100 dark:border-stone-800">
          Shop Info & Footer
        </h2>

        <div className="space-y-4">
          {/* Location Text */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Location / Town <span className="font-normal text-stone-400 dark:text-stone-500">(optional)</span>
            </label>
            <input
              type="text"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              placeholder="e.g. Based in Thrissur, Kerala"
              disabled={saving}
              className={inputCls}
            />
          </div>

          {/* Service Area / Shipping Text */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Service Area / Delivery Info <span className="font-normal text-stone-400 dark:text-stone-500">(optional)</span>
            </label>
            <input
              type="text"
              value={serviceAreaText}
              onChange={(e) => setServiceAreaText(e.target.value)}
              placeholder="e.g. Delivering across Kerala via DTDC & speed post"
              disabled={saving}
              className={inputCls}
            />
          </div>

          {/* Instagram URL */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Instagram Profile URL <span className="font-normal text-stone-400 dark:text-stone-500">(optional)</span>
            </label>
            <input
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="e.g. https://instagram.com/harithamgarden"
              disabled={saving}
              className={inputCls}
            />
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Contact Phone / Call Number <span className="font-normal text-stone-400 dark:text-stone-500">(optional, if different from WhatsApp)</span>
            </label>
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              disabled={saving}
              className={inputCls}
            />
          </div>

          {/* Secondary Social Link Label */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Secondary Social / Channel Label <span className="font-normal text-stone-400 dark:text-stone-500">(optional, e.g. "Watch Care Guides")</span>
            </label>
            <input
              type="text"
              value={secondarySocialLabel}
              onChange={(e) => setSecondarySocialLabel(e.target.value)}
              placeholder="e.g. Follow on Facebook or Watch on YouTube"
              disabled={saving}
              className={inputCls}
            />
          </div>

          {/* Secondary Social Link URL */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Secondary Social / Channel URL <span className="font-normal text-stone-400 dark:text-stone-500">(optional)</span>
            </label>
            <input
              type="url"
              value={secondarySocialUrl}
              onChange={(e) => setSecondarySocialUrl(e.target.value)}
              placeholder="e.g. https://youtube.com/@harithamgarden"
              disabled={saving}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* ── Submit ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
        <button
          type="submit"
          disabled={saving}
          className="bg-terracotta hover:bg-[#b04a25] text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md disabled:opacity-50 transition-all min-h-[44px] flex items-center gap-2"
        >
          {saving ? (
            <>
              <InlineSpinner className="w-4 h-4 text-white" />
              <span>Saving Settings…</span>
            </>
          ) : (
            <span>Save Settings</span>
          )}
        </button>
      </div>
    </form>
  );
}
