"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { Leaf, MapPin, Phone, Truck, ExternalLink } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { FloatingLeaves } from "./FloatingLeaves";
import { InstallPWAButton } from "./InstallPWAButton";

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

interface FooterCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}

function FooterCard({ icon, label, value, href }: FooterCardProps) {
  const valueRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const el = valueRef.current;
    if (!el) return;

    const checkTruncation = () => {
      setIsTruncated(el.scrollWidth > el.clientWidth);
    };

    checkTruncation();
    const observer = new ResizeObserver(checkTruncation);
    observer.observe(el);

    return () => observer.disconnect();
  }, [value]);

  const cardContent = (
    <>
      <div className="w-11 h-11 rounded-xl bg-botanical-100 dark:bg-stone-800 text-botanical-800 dark:text-botanical-100 flex items-center justify-center group-hover:bg-botanical-800 dark:group-hover:bg-botanical-600 group-hover:text-white transition-colors shrink-0">
        {icon}
      </div>
      <div className="overflow-hidden min-w-0 flex-1">
        <span className="text-xs text-stone-500 dark:text-stone-400 font-semibold uppercase tracking-wider block">
          {label}
        </span>
        <span
          ref={valueRef}
          className="font-heading font-bold text-sm text-stone-900 dark:text-stone-100 truncate block mt-0.5"
        >
          {value}
        </span>
      </div>

      {/* Floating Tooltip Popover (Positioned cleanly above the entire card) */}
      {isTruncated && showTooltip && (
        <div className="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 z-50 bg-stone-900 dark:bg-stone-800 text-white dark:text-stone-100 border border-stone-700 dark:border-stone-700 text-xs font-semibold px-3.5 py-2 rounded-xl shadow-2xl max-w-[280px] break-words text-center pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95">
          {value}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-900 dark:border-t-stone-800" />
        </div>
      )}
    </>
  );

  const containerCls =
    "relative flex items-center gap-3.5 p-4 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 hover:border-botanical-600 dark:hover:border-botanical-600 hover:shadow-md transition-all group w-full sm:w-[260px] lg:w-[280px] shrink-0";

  const handleMouseEnter = () => {
    if (isTruncated) setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const handleClick = () => {
    if (isTruncated) {
      setShowTooltip((prev) => !prev);
    }
  };

  if (href) {
    return (
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        className={containerCls}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {cardContent}
      </a>
    );
  }

  return (
    <div
      className={containerCls}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {cardContent}
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

  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.footer
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="bg-white dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 py-10 mt-auto transition-colors duration-300 relative overflow-hidden"
    >
      <FloatingLeaves />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* ── Top Row of Info Cards (Centered Flex Wrap) ───────────────── */}
        {showCards && (
          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* Card 1: Visit Nursery */}
            {locationText && (
              <FooterCard
                icon={<MapPin className="w-5 h-5" />}
                label="Visit Nursery"
                value={locationText}
              />
            )}

            {/* Card 2: Call Us */}
            {contactPhone && (
              <FooterCard
                icon={<Phone className="w-5 h-5" />}
                label="Call Us"
                value={contactPhone}
                href={`tel:${contactPhone}`}
              />
            )}

            {/* Card 3: Delivery */}
            {serviceAreaText && (
              <FooterCard
                icon={<Truck className="w-5 h-5" />}
                label="Delivery"
                value={serviceAreaText}
              />
            )}

            {/* Card 4: Follow on Instagram */}
            {instagramUrl && (
              <FooterCard
                icon={
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                }
                label="Follow on Instagram"
                value={formatInstagramHandle(instagramUrl)}
                href={instagramUrl}
              />
            )}

            {/* Card 5: Secondary Social */}
            {secondaryLabel && secondaryUrl && (
              <FooterCard
                icon={<ExternalLink className="w-5 h-5" />}
                label={secondaryLabel}
                value="Visit Channel →"
                href={secondaryUrl}
              />
            )}
          </div>
        )}

        {/* ── Footer Bottom Bar ───────────────────────────────────────── */}
        <div className="pt-6 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-botanical-600 dark:text-botanical-100 shrink-0" />
            <span className="font-heading font-bold text-stone-800 dark:text-stone-200 text-sm">
              {businessName}
            </span>
            <span className="text-stone-400 dark:text-stone-600">·</span>
            <span>© {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="hover:text-botanical-800 dark:hover:text-botanical-100 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-botanical-800 dark:hover:text-botanical-100 transition-colors"
            >
              Terms of Service
            </Link>
            <InstallPWAButton />
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
