import Link from "next/link";
import { Leaf } from "lucide-react";

interface LogoProps {
  className?: string;
  showTagline?: boolean;
  href?: string;
  businessName?: string;
  tagline?: string;
  logoUrl?: string | null;
}

export function Logo({
  className = "",
  showTagline = true,
  href,
  businessName = "Haritham Garden",
  tagline = "Fresh plants & greens for your home",
  logoUrl,
}: LogoProps) {
  const content = (
    <div className={`flex items-center gap-2.5 sm:gap-3 group min-w-0 ${className}`}>
      {logoUrl ? (
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-center overflow-hidden shrink-0">
          <img
            src={logoUrl}
            alt={businessName}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-botanical-100 dark:bg-stone-900 text-botanical-800 dark:text-botanical-100 flex items-center justify-center group-hover:bg-botanical-800 dark:group-hover:bg-botanical-600 group-hover:text-white transition-colors duration-300 shadow-2xs border border-transparent dark:border-stone-800 shrink-0">
          <Leaf className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      )}
      <div className="min-w-0 flex-1 overflow-hidden">
        <span className="font-heading font-bold text-base sm:text-xl tracking-tight text-botanical-900 dark:text-botanical-100 block leading-tight truncate whitespace-nowrap">
          {businessName}
        </span>
        {showTagline && tagline && (
          <span className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 font-medium mt-0.5 block truncate whitespace-nowrap">
            {tagline}
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex min-w-0 max-w-full">
        {content}
      </Link>
    );
  }

  return content;
}
