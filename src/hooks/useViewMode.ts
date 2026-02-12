import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;

export function useViewMode(storageKey: string = "view-mode") {
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    // Default to grid on mobile, list on desktop
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`${storageKey}-view`);
      if (saved === "grid" || saved === "list") return saved;
      return window.innerWidth < MOBILE_BREAKPOINT ? "grid" : "list";
    }
    return "grid";
  });

  useEffect(() => {
    localStorage.setItem(`${storageKey}-view`, viewMode);
  }, [viewMode, storageKey]);

  return { viewMode, setViewMode };
}
