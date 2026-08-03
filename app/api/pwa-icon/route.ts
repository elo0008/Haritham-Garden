import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sizeParam = parseInt(searchParams.get("size") || "512", 10);
  const isMaskable = searchParams.get("maskable") === "1";
  const iconSize = isNaN(sizeParam) || sizeParam <= 0 ? 512 : Math.min(sizeParam, 1024);

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: settings } = await supabase
        .from("site_settings")
        .select("logo_url")
        .limit(1)
        .maybeSingle();

      if (settings?.logo_url?.trim()) {
        const logoUrl = settings.logo_url.trim();
        const response = await fetch(logoUrl, { cache: "no-store" });

        if (response.ok) {
          const imageBuffer = Buffer.from(await response.arrayBuffer());

          // Calculate inner logo size with safe margin
          const paddingRatio = isMaskable ? 0.22 : 0.05;
          const innerSize = Math.round(iconSize * (1 - paddingRatio * 2));

          // Resize admin logo to fit centered inside canvas
          const resizedLogo = await sharp(imageBuffer)
            .resize(innerSize, innerSize, {
              fit: "contain",
              background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .toBuffer();

          // Background: transparent for standard favicons/icons, solid botanical green for Android maskable PWA
          const bgConfig = isMaskable
            ? { r: 28, g: 56, b: 43, alpha: 1 } // #1c382b solid background for Android maskable icons
            : { r: 0, g: 0, b: 0, alpha: 0 };   // Fully transparent background for tab favicons & standard icons

          const finalIcon = await sharp({
            create: {
              width: iconSize,
              height: iconSize,
              channels: 4,
              background: bgConfig,
            },
          })
            .composite([
              {
                input: resizedLogo,
                gravity: "center",
              },
            ])
            .png()
            .toBuffer();

          return new NextResponse(new Uint8Array(finalIcon), {
            headers: {
              "Content-Type": "image/png",
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "Pragma": "no-cache",
              "Expires": "0",
            },
          });
        }
      }
    }
  } catch (err) {
    console.error("Error generating dynamic PWA icon:", err);
  }

  // Pure SVG in-memory dynamic fallback when site_settings logo_url is missing
  const defaultLeafSvg = `
  <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${isMaskable ? '<rect width="512" height="512" fill="#1c382b"/>' : ''}
    <g transform="translate(51.2, 51.2) scale(0.8)">
      <path d="M 256 112 C 340 140, 380 230, 360 320 C 340 370, 290 392, 256 392 C 222 392, 172 370, 152 320 C 132 230, 172 140, 256 112 Z" fill="#2d4a3e"/>
      <path d="M 256 112 C 256 220, 256 340, 256 416" stroke="#ffffff" stroke-width="14" stroke-linecap="round"/>
      <path d="M 256 210 Q 300 180, 330 170" stroke="#ffffff" stroke-width="10" stroke-linecap="round"/>
      <path d="M 256 260 Q 200 230, 170 220" stroke="#ffffff" stroke-width="10" stroke-linecap="round"/>
      <circle cx="360" cy="150" r="28" fill="#e07a5f"/>
    </g>
  </svg>`;

  const fallbackBuffer = await sharp(Buffer.from(defaultLeafSvg)).png().toBuffer();

  return new NextResponse(new Uint8Array(fallbackBuffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
