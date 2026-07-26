import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Admin — Haritham Garden",
  description: "Admin dashboard for Haritham Garden",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-stone-950 text-[#24211E] dark:text-stone-100 font-sans antialiased">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 border-b border-stone-200/70 dark:border-stone-800 bg-[#FAF8F5]/90 dark:bg-stone-900/90 backdrop-blur-md px-4 py-3 sm:px-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Logo showTagline={false} />
          </Link>
          <span className="text-stone-300 dark:text-stone-700 select-none">·</span>
          <span className="text-xs font-bold uppercase tracking-wider bg-terracotta/10 text-terracotta border border-terracotta/20 px-2 py-0.5 rounded-md">
            Admin
          </span>
        </div>

        {user && (
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Quick Navigation Links */}
            <nav className="flex items-center gap-1 sm:gap-1.5 text-xs font-semibold">
              <Link
                href="/admin"
                className="px-2.5 py-1.5 rounded-xl text-stone-600 dark:text-stone-300 hover:text-botanical-800 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
              >
                Overview
              </Link>
              <Link
                href="/admin/plants"
                className="px-2.5 py-1.5 rounded-xl text-stone-600 dark:text-stone-300 hover:text-botanical-800 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
              >
                Catalogue
              </Link>
              <Link
                href="/admin/orders"
                className="px-2.5 py-1.5 rounded-xl text-stone-600 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
              >
                Orders
              </Link>
              <Link
                href="/admin/sales"
                className="px-2.5 py-1.5 rounded-xl text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors font-bold"
              >
                Sales
              </Link>
              <Link
                href="/admin/hero-banner"
                className="px-2.5 py-1.5 rounded-xl text-stone-600 dark:text-stone-300 hover:text-terracotta hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors hidden md:inline-block"
              >
                CMS
              </Link>
              <Link
                href="/admin/settings"
                className="px-2.5 py-1.5 rounded-xl text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors hidden sm:inline-block"
              >
                Settings
              </Link>
            </nav>

            <div className="h-4 w-[1px] bg-stone-300 dark:bg-stone-700 hidden sm:block" />

            {/* Logout */}
            <form action={signOut}>
              <button
                type="submit"
                id="admin-logout"
                className="text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-red-700 dark:hover:text-red-400
                           border border-stone-300 dark:border-stone-700 hover:border-red-300 rounded-xl
                           px-3 py-1.5 min-h-[36px] transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
