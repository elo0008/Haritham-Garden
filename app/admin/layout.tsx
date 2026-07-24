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
    <div className="min-h-screen bg-[#FAF8F5] text-[#24211E]">
      <header className="border-b border-stone-200/70 bg-[#FAF8F5]/90 backdrop-blur-md px-4 py-3 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Logo showTagline={false} />
          </Link>
          <span className="text-stone-300 select-none">·</span>
          <span className="text-xs font-semibold uppercase tracking-wider bg-stone-200/70 text-stone-700 px-2 py-0.5 rounded-md">
            Admin
          </span>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-500 hidden sm:block">
              {user.email}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                id="admin-logout"
                className="text-xs font-medium text-stone-600 hover:text-red-700
                           border border-stone-300 hover:border-red-300 rounded-xl
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
