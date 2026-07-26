"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { Leaf, MapPin, Phone, Truck, ExternalLink } from "lucide-react";

interface FooterProps {
  settings?: SiteSettings;
}

function formatInstagramHandle(url: string): string {
  try {
    const cleaned = url.trim().replace(/\/$/, "");
    const parts = cleaned.split("/");
    const handle = parts[parts.length - 1];
    if (handle && !handle.includes(".")) {
      return `@${handle.replace(/^@/, "")}`;
    }
  } catch {}
  return "@harithamgarden";
}

function TruncatedFooterValue({ text, className = "" }: { text: string; className?: string }) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const checkTruncation = () => {
      setIsTruncated(el.scrollWidth > el.clientWidth);
    };

    checkTruncation();
    const observer = new ResizeObserver(checkTruncation);
    observer.observe(el);

    return () => observer.disconnect();
  }, [text]);

  return (
    <div
      className="relative min-w-0 flex-1"
      onMouseEnter={() => isTruncated && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={(e) => {
        if (isTruncated) {
          setShowTooltip((prev) => !prev);
        }
      }}
    >
      <span ref={textRef} className={`truncate block ${className}`}>
        {text}
      </span>

      {isTruncated && showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 bg-stone-900 border border-stone-700 text-stone-100 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-2xl max-w-[280px] break-words text-center pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-900" />
        </div>
      )}
    </div>
  );
}

export function Footer({ settings }: FooterProps) {
  const businessName = settings?.business_name || "Haritham Garden";
  const locationText = settings?.location_text?.trim();
  const contactPhone = settings?.contact_phone?.trim();
  const serviceAreaText = settings?.service_area_text?.trim();
  const instagramUrl = settings?.instagram_url?.trim();
  const secondaryLabel = settings?.secondary_social_label?.trim();
  const secondaryUrl = settings?.secondary_social_url?.trim();

  const showCards =
    Boolean(locationText) ||
    Boolean(contactPhone) ||
    Boolean(serviceAreaText) ||
    Boolean(instagramUrl) ||
    (Boolean(secondaryLabel) && Boolean(secondaryUrl));

  const cardBaseCls =
    "flex items-center gap-3.5 p-4 rounded-2xl bg-stone-900 border border-stone-800 hover:border-botanical-600 transition-all group w-full sm:w-[260px] lg:w-[280px] shrink-0";

  return (
    <footer className="bg-stone-950 border-t border-stone-800 text-stone-400 py-10 mt-auto transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* ── Top Row of Info Cards (Center-aligned Flex Wrap) ─────────── */}
        {showCards && (
          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* Card 1: Visit Nursery */}
            {locationText && (
              <div className={cardBaseCls}>
                <div className="w-11 h-11 rounded-xl bg-stone-800 text-botanical-100 flex items-center justify-center group-hover:bg-botanical-600 group-hover:text-white transition-colors shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="overflow-hidden min-w-0 flex-1">
                  <span className="text-xs text-stone-400 font-semibold uppercase tracking-wider block">
                    Visit Nursery
                  </span>
                  <TruncatedFooterValue
                    text={locationText}
                    className="font-heading font-bold text-sm text-stone-100"
                  />
                </div>
              </div>
            )}

            {/* Card 2: Call Us */}
            {contactPhone && (
              <a href={`tel:${contactPhone}`} className={cardBaseCls}>
                <div className="w-11 h-11 rounded-xl bg-stone-800 text-botanical-100 flex items-center justify-center group-hover:bg-botanical-600 group-hover:text-white transition-colors shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="overflow-hidden min-w-0 flex-1">
                  <span className="text-xs text-stone-400 font-semibold uppercase tracking-wider block">
                    Call Us
                  </span>
                  <TruncatedFooterValue
                    text={contactPhone}
                    className="font-heading font-bold text-sm text-stone-100"
                  />
                </div>
              </a>
            )}

            {/* Card 3: Delivery */}
            {serviceAreaText && (
              <div className={cardBaseCls}>
                <div className="w-11 h-11 rounded-xl bg-stone-800 text-botanical-100 flex items-center justify-center group-hover:bg-botanical-600 group-hover:text-white transition-colors shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div className="overflow-hidden min-w-0 flex-1">
                  <span className="text-xs text-stone-400 font-semibold uppercase tracking-wider block">
                    Delivery
                  </span>
                  <TruncatedFooterValue
                    text={serviceAreaText}
                    className="font-heading font-bold text-sm text-stone-100"
                  />
                </div>
              </div>
            )}

            {/* Card 4: Follow on Instagram */}
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cardBaseCls}
              >
                <div className="w-11 h-11 rounded-xl bg-stone-800 text-botanical-100 flex items-center justify-center group-hover:bg-botanical-600 group-hover:text-white transition-colors shrink-0">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <div className="overflow-hidden min-w-0 flex-1">
                  <span className="text-xs text-stone-400 font-semibold uppercase tracking-wider block">
                    Follow on Instagram
                  </span>
                  <TruncatedFooterValue
                    text={formatInstagramHandle(instagramUrl)}
                    className="font-heading font-bold text-sm text-stone-100"
                  />
                </div>
              </a>
            )}

            {/* Card 5: Secondary Social */}
            {secondaryLabel && secondaryUrl && (
              <a
                href={secondaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cardBaseCls}
              >
                <div className="w-11 h-11 rounded-xl bg-stone-800 text-botanical-100 flex items-center justify-center group-hover:bg-botanical-600 group-hover:text-white transition-colors shrink-0">
                  <ExternalLink className="w-5 h-5" />
                </div>
                <div className="overflow-hidden min-w-0 flex-1">
                  <span className="text-xs text-stone-400 font-semibold uppercase tracking-wider block truncate">
                    {secondaryLabel}
                  </span>
                  <TruncatedFooterValue
                    text="Visit Channel →"
                    className="font-heading font-bold text-sm text-stone-100"
                  />
                </div>
              </a>
            )}
          </div>
        )}

        {/* ── Footer Bottom Bar ───────────────────────────────────────── */}
        <div className="pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-botanical-600 shrink-0" />
            <span className="font-heading font-bold text-stone-200 text-sm">
              {businessName}
            </span>
            <span className="text-stone-600">·</span>
            <span>© {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="hover:text-botanical-100 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-botanical-100 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
