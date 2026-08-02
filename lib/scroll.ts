export function scrollToTarget(targetId: string, maxAttempts = 30, intervalMs = 100) {
  if (typeof window === "undefined") return;

  if (targetId === "top") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const attemptScroll = (): boolean => {
    const el = document.getElementById(targetId);
    if (el) {
      const isMobile = window.innerWidth < 640;
      const headerHeight = isMobile ? 64 : 80;
      const offset = el.getBoundingClientRect().top + window.pageYOffset - (headerHeight + 20);
      window.scrollTo({ top: offset, behavior: "smooth" });
      return true;
    }
    return false;
  };

  // Immediate attempt
  if (attemptScroll()) return;

  // Poll until element is present in DOM after route navigation / page mount
  let attempts = 0;
  const interval = setInterval(() => {
    attempts++;
    if (attemptScroll() || attempts >= maxAttempts) {
      clearInterval(interval);
    }
  }, intervalMs);
}
