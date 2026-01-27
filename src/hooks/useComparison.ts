import { useState, useCallback } from "react";

const MAX_COMPARE_ITEMS = 3;

export const useComparison = () => {
  const [compareList, setCompareList] = useState<string[]>([]);

  const addToCompare = useCallback((vehicleId: string) => {
    setCompareList(prev => {
      if (prev.includes(vehicleId)) return prev;
      if (prev.length >= MAX_COMPARE_ITEMS) {
        // Remove first item to add new one
        return [...prev.slice(1), vehicleId];
      }
      return [...prev, vehicleId];
    });
  }, []);

  const removeFromCompare = useCallback((vehicleId: string) => {
    setCompareList(prev => prev.filter(id => id !== vehicleId));
  }, []);

  const toggleCompare = useCallback((vehicleId: string) => {
    setCompareList(prev => {
      if (prev.includes(vehicleId)) {
        return prev.filter(id => id !== vehicleId);
      }
      if (prev.length >= MAX_COMPARE_ITEMS) {
        return [...prev.slice(1), vehicleId];
      }
      return [...prev, vehicleId];
    });
  }, []);

  const isInCompare = useCallback((vehicleId: string) => {
    return compareList.includes(vehicleId);
  }, [compareList]);

  const clearCompare = useCallback(() => {
    setCompareList([]);
  }, []);

  const canAddMore = compareList.length < MAX_COMPARE_ITEMS;

  return {
    compareList,
    addToCompare,
    removeFromCompare,
    toggleCompare,
    isInCompare,
    clearCompare,
    compareCount: compareList.length,
    canAddMore,
    maxItems: MAX_COMPARE_ITEMS,
  };
};

export default useComparison;
