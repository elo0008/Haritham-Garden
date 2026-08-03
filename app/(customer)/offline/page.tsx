import Link from "next/link";
import { Leaf, RefreshCw } from "lucide-react";

export const metadata = {
  title: "Offline | Haritham Garden",
  description: "You're offline — check your internet connection.",
};

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 px-4 py-16">
      <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-3xl p-8 text-center shadow-xl border border-stone-200/80 dark:border-stone-800">
        <div className="w-16 h-16 rounded-2xl bg-botanical-800 dark:bg-botanical-600 text-white flex items-center justify-center mx-auto mb-6 shadow-md">
          <Leaf className="w-8 h-8" />
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 mb-3">
          You're Offline
        </h1>
        <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed mb-8">
          Check your internet connection to continue browsing nursery-fresh plants from Haritham Garden.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 bg-botanical-800 dark:bg-botanical-600 hover:bg-botanical-900 text-white font-semibold text-sm px-6 py-3 rounded-full transition-all shadow-md active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Connection</span>
        </Link>
      </div>
    </main>
  );
}
