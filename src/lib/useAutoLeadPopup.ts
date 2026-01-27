import { useEffect, useState } from "react";

interface AutoLeadPopupOptions {
  enabled: boolean;
  scrollPercent: number;
  onceKey: string;
}

export function useAutoLeadPopup({
  enabled,
  scrollPercent,
  onceKey,
}: AutoLeadPopupOptions) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // ❗ Session-based lock
    if (sessionStorage.getItem(onceKey) === "done") {
      setDismissed(true);
      return;
    }

    const onScroll = () => {
      if (dismissed || open) return;

      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const percent = (scrollTop / docHeight) * 100;

      if (percent >= scrollPercent) {
        setOpen(true);
        sessionStorage.setItem(onceKey, "done"); // 🔒 lock for session
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [enabled, scrollPercent, onceKey, dismissed, open]);

  const close = () => {
    setOpen(false);
    setDismissed(true);
    sessionStorage.setItem(onceKey, "done"); // 🔒 ensure no reopen
  };

  return { open, setOpen: close };
}
