import Link from "next/link";

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
    <div className={`flex flex-col ${className}`}>
      {logoUrl ? (
        <div className="flex items-center gap-2">
          <img
            src={logoUrl}
            alt={businessName}
            className="h-8 sm:h-9 w-auto object-contain"
          />
          <span className="text-xl font-bold tracking-tight text-[#24211E] sm:text-2xl font-sans">
            {businessName}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#C1662F]/10 text-base text-[#C1662F]">
            🌿
          </span>
          <span className="text-xl font-bold tracking-tight text-[#24211E] sm:text-2xl font-sans">
            {businessName}
          </span>
        </div>
      )}
      {showTagline && tagline && (
        <span className="text-xs text-stone-500 font-normal mt-0.5 sm:text-sm">
          {tagline}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
