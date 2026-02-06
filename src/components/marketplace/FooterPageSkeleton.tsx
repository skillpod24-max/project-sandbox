import { Skeleton } from "@/components/ui/skeleton";

const FooterPageSkeleton = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="w-24 h-5" />
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Hero Skeleton */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Skeleton className="h-10 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-full max-w-lg mx-auto" />
        </div>

        {/* Content Skeleton */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>

        {/* Stats Skeleton */}
        <Skeleton className="h-48 rounded-3xl mb-16" />

        {/* CTA Skeleton */}
        <div className="text-center">
          <Skeleton className="h-8 w-64 mx-auto mb-4" />
          <div className="flex justify-center gap-4">
            <Skeleton className="h-12 w-32 rounded-lg" />
            <Skeleton className="h-12 w-32 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FooterPageSkeleton;
