import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

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
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">🌿</span>
          <span className="text-sm font-semibold text-gray-800">
            Haritham Garden
          </span>
          <span className="text-gray-300 select-none">·</span>
          <span className="text-sm text-gray-500">Admin</span>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400 hidden sm:block">
              {user.email}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                id="admin-logout"
                className="text-xs font-medium text-gray-500 hover:text-red-600
                           border border-gray-200 hover:border-red-200 rounded-lg
                           px-3 py-1.5 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        )}
      </header>

      <main className="p-6">{children}</main>
    </div>
  );
}
