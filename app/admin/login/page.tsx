import type { Metadata } from "next";
import { signIn } from "./actions";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/server";
import type { SiteSettings } from "@/lib/types";
import { Mail, Lock, ShieldCheck, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Login — Haritham Garden",
};

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;
  const supabase = await createClient();

  let siteSettings: SiteSettings | undefined = undefined;
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (data) {
      siteSettings = data as SiteSettings;
    }
  } catch (err) {
    console.error("Site settings fetch notice:", err);
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col justify-between relative overflow-hidden transition-colors duration-300 font-sans">
      {/* ── CSS Keyframe Animation for Floating Background Leaves (Page Scoped) ── */}
      <style>{`
        @keyframes floatLeafRise {
          0% {
            transform: translate3d(0, 110vh, 0) rotate(0deg) scale(0.9);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translate3d(24px, -15vh, 0) rotate(360deg) scale(1.1);
            opacity: 0;
          }
        }
        .admin-leaf-shape {
          position: absolute;
          border-radius: 0% 100% 0% 100% / 0% 100% 0% 100%;
          animation: floatLeafRise linear infinite;
          will-change: transform, opacity;
          pointer-events: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .admin-leaf-shape {
            animation: none !important;
            display: none !important;
          }
        }
      `}</style>

      {/* ── Ambient Floating Leaf Shapes (7 Pure CSS shapes, low opacity) ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="admin-leaf-shape w-12 h-12 bg-botanical-600/15 dark:bg-botanical-500/7 left-[10%]"
          style={{ animationDuration: "28s", animationDelay: "0s" }}
        />
        <div
          className="admin-leaf-shape w-16 h-16 bg-botanical-800/12 dark:bg-botanical-400/6 left-[25%]"
          style={{ animationDuration: "34s", animationDelay: "-8s" }}
        />
        <div
          className="admin-leaf-shape w-10 h-10 bg-terracotta/15 dark:bg-terracotta/8 left-[45%]"
          style={{ animationDuration: "24s", animationDelay: "-4s" }}
        />
        <div
          className="admin-leaf-shape w-14 h-14 bg-botanical-700/14 dark:bg-botanical-500/6 left-[62%]"
          style={{ animationDuration: "32s", animationDelay: "-14s" }}
        />
        <div
          className="admin-leaf-shape w-18 h-18 bg-botanical-900/10 dark:bg-botanical-300/6 left-[80%]"
          style={{ animationDuration: "36s", animationDelay: "-2s" }}
        />
        <div
          className="admin-leaf-shape w-11 h-11 bg-terracotta/14 dark:bg-terracotta/7 left-[92%]"
          style={{ animationDuration: "26s", animationDelay: "-10s" }}
        />
        <div
          className="admin-leaf-shape w-13 h-13 bg-botanical-600/12 dark:bg-botanical-400/5 left-[35%]"
          style={{ animationDuration: "30s", animationDelay: "-18s" }}
        />
      </div>

      {/* ── Top Navbar Header ── */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex items-center justify-between">
        <Logo
          showTagline={false}
          businessName={siteSettings?.business_name}
          logoUrl={siteSettings?.logo_url}
          href="/"
        />
        <ThemeToggle />
      </header>

      {/* ── Main Centered Glassmorphism Card Container ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 w-full max-w-md mx-auto">
        <div className="w-full backdrop-blur-md bg-white/75 dark:bg-stone-900/75 border border-stone-200/80 dark:border-stone-800/80 shadow-2xl rounded-3xl p-6 sm:p-10 text-stone-900 dark:text-stone-100 transition-all">
          {/* Header Pill & Heading */}
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-botanical-50 dark:bg-stone-800 text-botanical-800 dark:text-botanical-100 border border-botanical-200 dark:border-stone-700 mb-3 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-botanical-600 dark:text-botanical-400" />
              ADMIN PANEL
            </span>
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
              Sign in to manage Haritham Garden store orders and catalog.
            </p>
          </div>

          {/* Form */}
          <form action={signIn} className="space-y-4">
            {/* Error Banner */}
            {error && (
              <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 p-3.5 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <span>⚠️ {decodeURIComponent(error)}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="admin@harithamgarden.com"
                  className="w-full rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 pl-10 pr-4 py-3 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent transition-all min-h-[44px]"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 pl-10 pr-4 py-3 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent transition-all min-h-[44px]"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="login-submit"
              className="w-full mt-2 min-h-[48px] rounded-xl bg-terracotta hover:bg-[#b04a25] active:scale-98 text-white font-bold text-sm py-3 px-4 shadow-md focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-2 transition-all flex items-center justify-center gap-2"
            >
              <span>Sign in to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>

      {/* Footer copyright note */}
      <footer className="relative z-10 py-4 text-center text-xs text-stone-400 dark:text-stone-500">
        © {new Date().getFullYear()} {siteSettings?.business_name || "Haritham Garden"}. Admin Console.
      </footer>
    </div>
  );
}
