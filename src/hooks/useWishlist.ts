import { useState, useEffect, useCallback } from "react";

const WISHLIST_KEY = "vahanhub_wishlist";

// Get initial wishlist from localStorage
const getInitialWishlist = (): string[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(WISHLIST_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Ensure it's a valid array of strings
      if (Array.isArray(parsed)) {
        return parsed.filter(id => typeof id === 'string' && id.length > 0);
      }
    } catch {
      // Invalid JSON, clear it
      localStorage.removeItem(WISHLIST_KEY);
    }
  }
  return [];
};

export const useWishlist = () => {
  const [wishlist, setWishlist] = useState<string[]>(getInitialWishlist);
  const [isInitialized, setIsInitialized] = useState(false);

  // Mark as initialized after first mount
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Save to localStorage whenever wishlist changes (after initialization)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    }
  }, [wishlist, isInitialized]);

  const addToWishlist = useCallback((vehicleId: string) => {
    setWishlist(prev => {
      if (prev.includes(vehicleId)) return prev;
      return [...prev, vehicleId];
    });
  }, []);

  const removeFromWishlist = useCallback((vehicleId: string) => {
    setWishlist(prev => prev.filter(id => id !== vehicleId));
  }, []);

  const toggleWishlist = useCallback((vehicleId: string) => {
    setWishlist(prev => {
      if (prev.includes(vehicleId)) {
        return prev.filter(id => id !== vehicleId);
      }
      return [...prev, vehicleId];
    });
  }, []);

  const isInWishlist = useCallback((vehicleId: string) => {
    return wishlist.includes(vehicleId);
  }, [wishlist]);

  const clearWishlist = useCallback(() => {
    setWishlist([]);
  }, []);

  return {
    wishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
    wishlistCount: wishlist.length,
  };
};

export default useWishlist;
