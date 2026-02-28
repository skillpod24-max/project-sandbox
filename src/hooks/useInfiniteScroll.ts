import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook for progressive display of items with infinite scroll.
 * Takes a full array and returns a slice that grows as user scrolls.
 */
export function useInfiniteScroll<T>(
  items: T[],
  batchSize: number = 30
) {
  const [displayCount, setDisplayCount] = useState(batchSize);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // Reset display count when items change (e.g. filter applied)
  useEffect(() => {
    setDisplayCount(batchSize);
  }, [items.length, batchSize]);

  const displayedItems = items.slice(0, displayCount);
  const hasMore = displayCount < items.length;

  const loadMore = useCallback(() => {
    setDisplayCount((prev) => Math.min(prev + batchSize, items.length));
  }, [batchSize, items.length]);

  // IntersectionObserver to trigger loadMore
  useEffect(() => {
    const node = loaderRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return { displayedItems, hasMore, loaderRef };
}
