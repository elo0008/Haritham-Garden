"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crosshair, Check, X, Smartphone, Tablet, Monitor } from "lucide-react";

export interface BreakpointGuide {
  label: string;
  aspectRatio: number;
  icon?: "mobile" | "tablet" | "desktop";
}

export interface FocalPointPickerProps {
  isOpen: boolean;
  imageUrl: string;
  initialX?: number | null;
  initialY?: number | null;
  guides?: BreakpointGuide[];
  title?: string;
  onSave: (x: number, y: number) => void;
  onCancel: () => void;
}

const DEFAULT_GUIDES: BreakpointGuide[] = [
  { label: "Mobile", aspectRatio: 9 / 16, icon: "mobile" },
  { label: "Tablet", aspectRatio: 4 / 3, icon: "tablet" },
  { label: "Desktop", aspectRatio: 16 / 9, icon: "desktop" },
];

export function FocalPointPicker({
  isOpen,
  imageUrl,
  initialX = 50,
  initialY = 50,
  guides = DEFAULT_GUIDES,
  title = "Adjust Image Focal Point",
  onSave,
  onCancel,
}: FocalPointPickerProps) {
  const [focalX, setFocalX] = useState<number>(initialX ?? 50);
  const [focalY, setFocalY] = useState<number>(initialY ?? 50);
  const [isDragging, setIsDragging] = useState(false);
  const [visibleGuides, setVisibleGuides] = useState<Record<number, boolean>>(() => {
    const map: Record<number, boolean> = {};
    guides.forEach((_, idx) => {
      map[idx] = true;
    });
    return map;
  });

  const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync initial values when modal opens
  useEffect(() => {
    if (isOpen) {
      setFocalX(initialX ?? 50);
      setFocalY(initialY ?? 50);
      const map: Record<number, boolean> = {};
      guides.forEach((_, idx) => {
        map[idx] = true;
      });
      setVisibleGuides(map);
    }
  }, [isOpen, initialX, initialY, guides]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgDimensions({
      width: img.naturalWidth || img.clientWidth,
      height: img.naturalHeight || img.clientHeight,
    });
  };

  const updateFocalPointFromPointer = useCallback((clientX: number, clientY: number) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const relX = clientX - rect.left;
    const relY = clientY - rect.top;

    const pctX = Math.max(0, Math.min(100, Math.round((relX / rect.width) * 100)));
    const pctY = Math.max(0, Math.min(100, Math.round((relY / rect.height) * 100)));

    setFocalX(pctX);
    setFocalY(pctY);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFocalPointFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    updateFocalPointFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore pointer release errors
      }
    }
  };

  const toggleGuide = (index: number) => {
    setVisibleGuides((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  if (!isOpen) return null;

  // Curated color themes for crop breakpoint outlines
  const guideColors = [
    { border: "border-amber-400", bg: "bg-amber-400/20 dark:bg-amber-400/30", text: "text-amber-300" },
    { border: "border-sky-400", bg: "bg-sky-400/20 dark:bg-sky-400/30", text: "text-sky-300" },
    { border: "border-emerald-400", bg: "bg-emerald-400/20 dark:bg-emerald-400/30", text: "text-emerald-300" },
    { border: "border-purple-400", bg: "bg-purple-400/20 dark:bg-purple-400/30", text: "text-purple-300" },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-stone-950/80 backdrop-blur-md"
          onClick={onCancel}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          className="relative z-10 w-full max-w-3xl bg-stone-900 text-stone-100 rounded-3xl shadow-2xl border border-stone-800 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-base text-stone-100 flex items-center gap-2">
                <Crosshair className="w-5 h-5 text-terracotta" />
                {title}
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Click or drag the crosshair to set where the cropped image should focus across viewports.
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="p-2 text-stone-400 hover:text-stone-100 rounded-full hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Guide Toggle Legend Bar */}
          {guides.length > 0 && (
            <div className="px-6 py-2.5 bg-stone-950/60 border-b border-stone-800/80 flex items-center justify-between gap-3 flex-wrap text-xs">
              <span className="font-semibold text-stone-400">Crop Guides:</span>
              <div className="flex items-center gap-2 flex-wrap">
                {guides.map((guide, idx) => {
                  const active = visibleGuides[idx] !== false;
                  const color = guideColors[idx % guideColors.length];
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleGuide(idx)}
                      className={`px-3 py-1 rounded-lg border font-semibold flex items-center gap-1.5 transition-all text-xs ${
                        active
                          ? `${color.border} ${color.bg} text-white shadow-xs`
                          : "border-stone-700 text-stone-500 line-through opacity-50 bg-stone-900"
                      }`}
                    >
                      {guide.icon === "mobile" && <Smartphone className="w-3.5 h-3.5" />}
                      {guide.icon === "tablet" && <Tablet className="w-3.5 h-3.5" />}
                      {guide.icon === "desktop" && <Monitor className="w-3.5 h-3.5" />}
                      <span>{guide.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main Workspace (Full Image Canvas) */}
          <div className="p-6 overflow-auto flex-grow flex flex-col items-center justify-center bg-stone-950 relative min-h-[300px]">
            <div
              ref={containerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="relative inline-block select-none cursor-crosshair touch-none max-h-[55vh]"
            >
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Focal point preview"
                onLoad={handleImageLoad}
                className="max-h-[55vh] max-w-full object-contain pointer-events-none rounded-lg shadow-xl"
              />

              {/* Render Crop Aspect Ratio Guide Rectangles */}
              {imgDimensions &&
                guides.map((guide, idx) => {
                  if (visibleGuides[idx] === false) return null;
                  const imgAspect = imgDimensions.width / imgDimensions.height;
                  const cropAspect = guide.aspectRatio;

                  let wNorm = 1.0;
                  let hNorm = 1.0;

                  if (cropAspect >= imgAspect) {
                    wNorm = 1.0;
                    hNorm = imgAspect / cropAspect;
                  } else {
                    hNorm = 1.0;
                    wNorm = cropAspect / imgAspect;
                  }

                  const cropW = wNorm * 100;
                  const cropH = hNorm * 100;

                  // Clamp crop box within image bounds based on current focal point
                  const centerX = Math.max(cropW / 2, Math.min(100 - cropW / 2, focalX));
                  const centerY = Math.max(cropH / 2, Math.min(100 - cropH / 2, focalY));

                  const left = centerX - cropW / 2;
                  const top = centerY - cropH / 2;

                  const color = guideColors[idx % guideColors.length];

                  return (
                    <div
                      key={idx}
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        width: `${cropW}%`,
                        height: `${cropH}%`,
                      }}
                      className={`absolute pointer-events-none border-2 border-dashed ${color.border} rounded-sm shadow-md transition-all duration-75`}
                    >
                      <span
                        className={`absolute top-1 left-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${color.bg} text-white backdrop-blur-xs`}
                      >
                        {guide.label}
                      </span>
                    </div>
                  );
                })}

              {/* Focal Point Crosshair Target Ring */}
              <div
                style={{
                  left: `${focalX}%`,
                  top: `${focalY}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
              >
                {/* Pulse Ring */}
                <div className="w-8 h-8 rounded-full border-2 border-white shadow-[0_0_12px_rgba(0,0,0,0.9)] flex items-center justify-center bg-terracotta/60 animate-pulse">
                  <div className="w-2.5 h-2.5 rounded-full bg-white shadow-md" />
                </div>
                {/* Crosshair Lines */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-0.5 bg-white/90 shadow-md pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-14 w-0.5 bg-white/90 shadow-md pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="px-6 py-4 bg-stone-900 border-t border-stone-800 flex items-center justify-between gap-4">
            <div className="text-xs font-mono font-semibold text-stone-400">
              Focal Point: <span className="text-terracotta font-bold">X: {focalX}%</span>, <span className="text-terracotta font-bold">Y: {focalY}%</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-stone-700 text-stone-300 hover:bg-stone-800 min-h-[40px] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onSave(focalX, focalY)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-terracotta hover:bg-[#b04a25] text-white shadow-md min-h-[40px] flex items-center gap-1.5 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Save Focal Point</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
