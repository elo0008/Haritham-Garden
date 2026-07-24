import Link from "next/link";

interface LogoProps {
  className?: string;
  showTagline?: boolean;
  href?: string;
}

export function Logo({ className = "", showTagline = true, href }: LogoProps) {
  const content = (
    <div className={`flex flex-col ${className}`}>
      {/* 
        =======================================================================
        FUTURE LOGO IMAGE ASSET PLACEHOLDER
        Replace or wrap the text below with <Image src="/logo.svg" alt="Haritham Garden" />
        =======================================================================
      */}
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#C1662F]/10 text-base text-[#C1662F]">
          🌿
        </span>
        <span className="text-xl font-bold tracking-tight text-[#24211E] sm:text-2xl font-sans">
          Haritham Garden
        </span>
      </div>
      {showTagline && (
        <span className="text-xs text-stone-500 font-normal mt-0.5 sm:text-sm">
          Fresh plants & greens for your home
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
