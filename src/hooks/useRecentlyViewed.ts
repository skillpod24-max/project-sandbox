import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "vahanhub_recently_viewed";
const MAX_ITEMS = 10;

interface RecentlyViewedItem {
  id: string;
  viewedAt: number;
}

export const useRecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const items: RecentlyViewedItem[] = JSON.parse(stored);
        // Sort by most recent and extract IDs
        const sorted = items
          .sort((a, b) => b.viewedAt - a.viewedAt)
          .slice(0, MAX_ITEMS)
          .map(item => item.id);
        setRecentlyViewed(sorted);
      } catch {
        setRecentlyViewed([]);
      }
    }
  }, []);

  const addToRecentlyViewed = useCallback((vehicleId: string) => {
    setRecentlyViewed(prev => {
      // Remove if already exists
      const filtered = prev.filter(id => id !== vehicleId);
      // Add to front
      const updated = [vehicleId, ...filtered].slice(0, MAX_ITEMS);
      
      // Persist to localStorage
      const items: RecentlyViewedItem[] = updated.map(id => ({
        id,
        viewedAt: id === vehicleId ? Date.now() : Date.now() - updated.indexOf(id) * 1000
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      
      return updated;
    });
  }, []);

  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    recentlyViewed,
    addToRecentlyViewed,
    clearRecentlyViewed,
    recentlyViewedCount: recentlyViewed.length,
  };
};

export default useRecentlyViewed;
