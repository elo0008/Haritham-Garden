"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800" />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-2.5 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:border-botanical-600 dark:hover:border-botanical-600 transition-all shadow-2xs flex items-center justify-center min-h-[44px] min-w-[44px]"
      title="Toggle Light / Dark Mode"
      aria-label="Toggle Light / Dark Mode"
    >
      {isDark ? (
        <Moon className="w-5 h-5 text-stone-200" />
      ) : (
        <Sun className="w-5 h-5 text-amber-600" />
      )}
    </button>
  );
}
