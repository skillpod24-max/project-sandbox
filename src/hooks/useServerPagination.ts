import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useEffect, useCallback } from "react";

interface ServerPaginationOptions<T> {
  queryKey: unknown[];
  fetchFn: (range: { from: number; to: number }) => Promise<T[]>;
  pageSize?: number;
  enabled?: boolean;
  staleTime?: number;
}

/**
 * Server-side pagination hook using useInfiniteQuery + IntersectionObserver.
 * Fetches data in pages from the DB using range(from, to).
 */
export function useServerPagination<T>({
  queryKey,
  fetchFn,
  pageSize = 30,
  enabled = true,
  staleTime = 2 * 60 * 1000,
}: ServerPaginationOptions<T>) {
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * pageSize;
      const to = from + pageSize - 1;
      const data = await fetchFn({ from, to });
      return data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < pageSize) return undefined;
      return allPages.length;
    },
    enabled,
    staleTime,
  });

  const { hasNextPage, fetchNextPage, isFetchingNextPage } = query;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // IntersectionObserver to trigger loadMore
  useEffect(() => {
    const node = loaderRef.current;
    if (!node || !hasNextPage) return;

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
  }, [hasNextPage, loadMore]);

  const items = query.data?.pages.flat() ?? [];

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return {
    items,
    isLoading: query.isLoading,
    hasMore: !!hasNextPage,
    loaderRef,
    isFetchingNextPage,
    refetch: query.refetch,
    invalidate,
  };
}
