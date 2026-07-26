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
    <div className={`flex items-center gap-3 group ${className}`}>
      {logoUrl ? (
        <div className="w-11 h-11 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-center overflow-hidden shrink-0">
          <img
            src={logoUrl}
            alt={businessName}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-11 h-11 rounded-xl bg-botanical-100 dark:bg-stone-900 text-botanical-800 dark:text-botanical-100 flex items-center justify-center group-hover:bg-botanical-800 dark:group-hover:bg-botanical-600 group-hover:text-white transition-colors duration-300 shadow-2xs border border-transparent dark:border-stone-800 shrink-0">
          <Leaf className="w-6 h-6" />
        </div>
      )}
      <div>
        <span className="font-heading font-bold text-xl tracking-tight text-botanical-900 dark:text-botanical-100 block leading-none">
          {businessName}
        </span>
        {showTagline && tagline && (
          <span className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-1 block">
            {tagline}
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {content}
      </Link>
    );
  }

  return content;
}
