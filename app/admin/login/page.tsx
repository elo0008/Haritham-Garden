import type { Metadata } from "next";
import { signIn } from "./actions";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Admin Login — Haritham Garden",
};

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-[#FAF8F5] text-[#24211E] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo showTagline={false} />
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-stone-500 bg-stone-200/60 px-2.5 py-0.5 rounded-md">
            Admin Panel
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-stone-200/80 rounded-3xl p-8 shadow-xl">
          <form action={signIn} className="space-y-5">
            {/* Error banner */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-700">{decodeURIComponent(error)}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-stone-700 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-xl bg-stone-50 border border-stone-300 px-4 py-3
                           text-[#24211E] placeholder-stone-400 text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#C1662F] focus:border-transparent
                           transition"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-stone-700 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full rounded-xl bg-stone-50 border border-stone-300 px-4 py-3
                           text-[#24211E] placeholder-stone-400 text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#C1662F] focus:border-transparent
                           transition"
              />
            </div>

            {/* Submit Button (Min 48px height, Terracotta theme) */}
            <button
              type="submit"
              id="login-submit"
              className="w-full mt-2 min-h-[48px] rounded-xl bg-[#C1662F] hover:bg-[#A85524] active:bg-[#92481e]
                         text-white font-semibold text-sm py-3 px-4 shadow-xs
                         focus:outline-none focus:ring-2 focus:ring-[#C1662F] focus:ring-offset-2
                         transition-colors"
            >
              Sign in to Dashboard
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
