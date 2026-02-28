import { Loader2 } from "lucide-react";
import React from "react";

interface ScrollLoaderProps {
  loaderRef: React.RefObject<HTMLDivElement>;
  hasMore: boolean;
}

const ScrollLoader = React.forwardRef<HTMLDivElement, Omit<ScrollLoaderProps, 'loaderRef'>>(
  ({ hasMore }, ref) => {
    if (!hasMore) return null;
    return (
      <div ref={ref} className="flex items-center justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
);

ScrollLoader.displayName = "ScrollLoader";

export default ScrollLoader;
