"use client";

interface FloatingLeavesProps {
  className?: string;
}

export function FloatingLeaves({ className = "" }: FloatingLeavesProps) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${className}`}
      aria-hidden="true"
    >
      <style jsx>{`
        @keyframes floatLeafRise {
          0% {
            transform: translate3d(0, 105%, 0) rotate(0deg) scale(0.9);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translate3d(24px, -10%, 0) rotate(360deg) scale(1.1);
            opacity: 0;
          }
        }
        .floating-leaf-item {
          position: absolute;
          border-radius: 0% 100% 0% 100% / 0% 100% 0% 100%;
          animation: floatLeafRise linear infinite;
          will-change: transform, opacity;
          pointer-events: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .floating-leaf-item {
            animation: none !important;
            display: none !important;
          }
        }
      `}</style>
      <div
        className="floating-leaf-item w-12 h-12 bg-botanical-600/28 dark:bg-botanical-500/14 left-[8%]"
        style={{ animationDuration: "28s", animationDelay: "0s" }}
      />
      <div
        className="floating-leaf-item w-16 h-16 bg-botanical-800/26 dark:bg-botanical-400/13 left-[22%]"
        style={{ animationDuration: "34s", animationDelay: "-8s" }}
      />
      <div
        className="floating-leaf-item w-10 h-10 bg-terracotta/28 dark:bg-terracotta/14 left-[42%]"
        style={{ animationDuration: "24s", animationDelay: "-4s" }}
      />
      <div
        className="floating-leaf-item w-14 h-14 bg-botanical-700/27 dark:bg-botanical-500/13 left-[60%]"
        style={{ animationDuration: "32s", animationDelay: "-14s" }}
      />
      <div
        className="floating-leaf-item w-18 h-18 bg-botanical-900/24 dark:bg-botanical-300/12 left-[78%]"
        style={{ animationDuration: "36s", animationDelay: "-2s" }}
      />
      <div
        className="floating-leaf-item w-11 h-11 bg-terracotta/26 dark:bg-terracotta/13 left-[90%]"
        style={{ animationDuration: "26s", animationDelay: "-10s" }}
      />
    </div>
  );
}
