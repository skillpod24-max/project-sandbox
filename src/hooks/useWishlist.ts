import { useState, useEffect, useCallback } from "react";

const WISHLIST_KEY = "vahanhub_wishlist";

export const useWishlist = () => {
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(WISHLIST_KEY);
    if (stored) {
      try {
        setWishlist(JSON.parse(stored));
      } catch {
        setWishlist([]);
      }
    }
  }, []);

  // Save to localStorage whenever wishlist changes
  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

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
