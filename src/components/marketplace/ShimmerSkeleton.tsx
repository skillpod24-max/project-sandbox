import { cn } from "@/lib/utils";

interface ShimmerSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circular" | "text" | "image";
  width?: string | number;
  height?: string | number;
}

const ShimmerSkeleton = ({ 
  className, 
  variant = "default",
  width,
  height,
  style,
  ...props 
}: ShimmerSkeletonProps) => {
  const variantClasses = {
    default: "rounded-lg",
    circular: "rounded-full",
    text: "rounded h-4",
    image: "rounded-xl aspect-video",
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden bg-slate-200",
        variantClasses[variant],
        className
      )}
      style={{ 
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        ...style 
      }}
      {...props}
    >
      <div className="shimmer-effect absolute inset-0" />
    </div>
  );
};

// Vehicle Page Skeleton
export const VehiclePageSkeleton = () => (
  <div className="min-h-screen bg-slate-50">
    {/* Header Skeleton */}
    <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <ShimmerSkeleton width={80} height={32} />
        <div className="flex items-center gap-2">
          <ShimmerSkeleton width={100} height={32} />
        </div>
        <div className="flex items-center gap-2">
          <ShimmerSkeleton variant="circular" width={32} height={32} />
          <ShimmerSkeleton variant="circular" width={32} height={32} />
        </div>
      </div>
    </header>

    <div className="container mx-auto px-4 py-4 lg:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Image Gallery Skeleton */}
          <div className="rounded-2xl overflow-hidden bg-white shadow-lg">
            <ShimmerSkeleton className="aspect-[16/9]" />
            <div className="flex gap-2 p-4">
              {[...Array(5)].map((_, i) => (
                <ShimmerSkeleton key={i} className="w-20 h-14 rounded-lg shrink-0" />
              ))}
            </div>
          </div>

          {/* Mobile Title Skeleton */}
          <div className="lg:hidden bg-white rounded-2xl p-5 shadow-sm">
            <ShimmerSkeleton variant="text" className="h-6 w-3/4 mb-2" />
            <ShimmerSkeleton variant="text" className="h-4 w-1/2 mb-4" />
            <ShimmerSkeleton variant="text" className="h-8 w-1/3" />
          </div>

          {/* Dealer Badge Skeleton */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <ShimmerSkeleton variant="circular" width={56} height={56} />
              <div className="flex-1">
                <ShimmerSkeleton variant="text" className="h-5 w-1/2 mb-2" />
                <ShimmerSkeleton variant="text" className="h-4 w-1/3" />
              </div>
            </div>
          </div>

          {/* Specs Grid Skeleton */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-3 shadow-sm">
                <ShimmerSkeleton variant="text" className="h-3 w-full mb-2" />
                <ShimmerSkeleton variant="text" className="h-5 w-2/3 mx-auto" />
              </div>
            ))}
          </div>

          {/* Overview Section Skeleton */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <ShimmerSkeleton variant="text" className="h-6 w-40 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <ShimmerSkeleton variant="text" className="h-4 w-1/3" />
                  <ShimmerSkeleton variant="text" className="h-4 w-1/3" />
                </div>
              ))}
            </div>
          </div>

          {/* Features Skeleton */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <ShimmerSkeleton variant="text" className="h-6 w-32 mb-4" />
            <div className="flex flex-wrap gap-2">
              {[...Array(8)].map((_, i) => (
                <ShimmerSkeleton key={i} className="h-8 w-24 rounded-full" />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Desktop */}
        <div className="hidden lg:block space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-lg">
            <ShimmerSkeleton variant="text" className="h-6 w-3/4 mb-2" />
            <ShimmerSkeleton variant="text" className="h-4 w-1/2 mb-6" />
            <ShimmerSkeleton variant="text" className="h-10 w-2/3 mb-6" />
            <ShimmerSkeleton className="h-12 w-full rounded-xl mb-6" />
            
            <ShimmerSkeleton variant="text" className="h-5 w-1/2 mb-2" />
            <ShimmerSkeleton variant="text" className="h-4 w-2/3 mb-4" />
            
            {[...Array(4)].map((_, i) => (
              <ShimmerSkeleton key={i} className="h-12 w-full rounded-xl mb-3" />
            ))}
            
            <ShimmerSkeleton className="h-12 w-full rounded-xl" />
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 mb-3 last:mb-0">
                <ShimmerSkeleton variant="circular" width={32} height={32} />
                <ShimmerSkeleton variant="text" className="h-4 w-40" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Mobile Sticky CTA Skeleton */}
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 lg:hidden">
      <div className="flex gap-2">
        <ShimmerSkeleton className="h-12 w-12 rounded-xl" />
        <ShimmerSkeleton className="h-12 flex-1 rounded-xl" />
        <ShimmerSkeleton className="h-12 flex-1 rounded-xl" />
      </div>
    </div>
  </div>
);

// Marketplace Landing Skeleton
export const MarketplaceSkeleton = () => (
  <div className="min-h-screen bg-slate-50">
    {/* Header Skeleton */}
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <ShimmerSkeleton width={120} height={40} />
        <ShimmerSkeleton className="hidden md:block w-64 h-11 rounded-full" />
        <div className="flex items-center gap-4">
          <ShimmerSkeleton variant="text" className="hidden md:block h-4 w-20" />
          <ShimmerSkeleton variant="text" className="hidden md:block h-4 w-16" />
          <ShimmerSkeleton className="h-10 w-20 rounded-lg" />
        </div>
      </div>
    </header>

    {/* Hero Skeleton */}
    <section className="bg-gradient-to-r from-slate-200 to-slate-300 py-10 md:py-16">
      <div className="container mx-auto px-4 text-center">
        <ShimmerSkeleton className="h-16 w-16 mx-auto rounded-xl mb-4" />
        <ShimmerSkeleton variant="text" className="h-10 w-2/3 mx-auto mb-4" />
        <ShimmerSkeleton variant="text" className="h-6 w-1/2 mx-auto mb-6" />
        <ShimmerSkeleton className="h-12 w-40 mx-auto rounded-full" />
      </div>
    </section>

    {/* Category Pills Skeleton */}
    <div className="container mx-auto px-4 py-6">
      <div className="flex gap-3 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <ShimmerSkeleton key={i} className="h-10 w-28 rounded-full shrink-0" />
        ))}
      </div>
    </div>

    {/* Vehicle Grid Skeleton */}
    <div className="container mx-auto px-4 py-6">
      <ShimmerSkeleton variant="text" className="h-8 w-48 mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <ShimmerSkeleton className="aspect-[4/3]" />
            <div className="p-4">
              <ShimmerSkeleton variant="text" className="h-5 w-3/4 mb-2" />
              <ShimmerSkeleton variant="text" className="h-4 w-1/2 mb-3" />
              <div className="flex gap-2 mb-3">
                <ShimmerSkeleton className="h-6 w-16 rounded" />
                <ShimmerSkeleton className="h-6 w-16 rounded" />
                <ShimmerSkeleton className="h-6 w-16 rounded" />
              </div>
              <ShimmerSkeleton variant="text" className="h-6 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Dealer Page Skeleton
export const DealerPageSkeleton = () => (
  <div className="min-h-screen bg-slate-50">
    {/* Header */}
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <ShimmerSkeleton width={80} height={32} />
        <ShimmerSkeleton width={100} height={32} />
        <ShimmerSkeleton width={40} height={32} />
      </div>
    </header>

    {/* Hero */}
    <div className="bg-gradient-to-r from-slate-200 to-slate-300 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <ShimmerSkeleton className="h-24 w-24 rounded-2xl" />
          <div className="flex-1 text-center md:text-left">
            <ShimmerSkeleton variant="text" className="h-8 w-64 mb-2 mx-auto md:mx-0" />
            <ShimmerSkeleton variant="text" className="h-4 w-48 mb-3 mx-auto md:mx-0" />
            <div className="flex gap-4 justify-center md:justify-start">
              <ShimmerSkeleton variant="text" className="h-4 w-20" />
              <ShimmerSkeleton variant="text" className="h-4 w-20" />
            </div>
          </div>
          <div className="flex gap-2">
            <ShimmerSkeleton className="h-10 w-24 rounded-lg" />
            <ShimmerSkeleton className="h-10 w-28 rounded-lg" />
          </div>
        </div>
      </div>
    </div>

    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Info Cards */}
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <ShimmerSkeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>

          {/* Vehicles */}
          <ShimmerSkeleton variant="text" className="h-6 w-40 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ShimmerSkeleton key={i} className="h-56 rounded-2xl" />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <ShimmerSkeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    </div>
  </div>
);

// Sell Vehicle Page Skeleton
export const SellVehicleSkeleton = () => (
  <div className="min-h-screen bg-slate-50">
    {/* Header */}
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <ShimmerSkeleton width={120} height={40} />
        <ShimmerSkeleton className="h-10 w-40 rounded-lg" />
      </div>
    </header>

    {/* Hero */}
    <div className="bg-gradient-to-r from-slate-200 to-slate-300 py-16 md:py-24">
      <div className="container mx-auto px-4 text-center">
        <ShimmerSkeleton className="h-8 w-48 mx-auto rounded-full mb-6" />
        <ShimmerSkeleton variant="text" className="h-12 w-2/3 mx-auto mb-4" />
        <ShimmerSkeleton variant="text" className="h-6 w-1/2 mx-auto mb-8" />
        <ShimmerSkeleton className="h-14 w-48 mx-auto rounded-full" />
      </div>
    </div>

    {/* Steps */}
    <div className="container mx-auto px-4 py-16">
      <ShimmerSkeleton variant="text" className="h-10 w-48 mx-auto mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="text-center">
            <ShimmerSkeleton className="h-20 w-20 rounded-2xl mx-auto mb-4" />
            <ShimmerSkeleton variant="text" className="h-5 w-3/4 mx-auto mb-2" />
            <ShimmerSkeleton variant="text" className="h-4 w-full mx-auto" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default ShimmerSkeleton;
