import { memo } from "react";
import { Link } from "react-router-dom";
import { Clock, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatIndianNumber } from "@/lib/formatters";

interface RecentlyViewedSectionProps {
  vehicles: any[];
  onClear: () => void;
}

const RecentlyViewedSection = memo(({ vehicles, onClear }: RecentlyViewedSectionProps) => {
  if (vehicles.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <Clock className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recently Viewed</h2>
            <p className="text-xs text-slate-500">Continue where you left off</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClear}
          className="text-slate-400 hover:text-slate-600 gap-1"
        >
          <X className="h-3 w-3" />
          Clear
        </Button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {vehicles.slice(0, 6).map((vehicle) => (
          <Link 
            key={vehicle.id} 
            to={`/marketplace/vehicle/${vehicle.id}`}
            className="shrink-0 w-48 group"
          >
            <Card className="overflow-hidden border border-slate-200 hover:border-purple-200 hover:shadow-md transition-all rounded-xl">
              <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                {vehicle.image_url ? (
                  <img
                    src={vehicle.image_url}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    No Image
                  </div>
                )}
                <Badge className="absolute top-2 left-2 bg-purple-500/90 text-white text-[10px] border-0">
                  Viewed
                </Badge>
              </div>
              <CardContent className="p-3">
                <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                  {vehicle.manufacturing_year} {vehicle.brand} {vehicle.model}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {vehicle.odometer_reading ? `${formatIndianNumber(vehicle.odometer_reading)} km` : 'N/A'} • {vehicle.fuel_type}
                </p>
                <p className="text-sm font-bold text-blue-600 mt-1">
                  {formatCurrency(vehicle.selling_price)}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
});

RecentlyViewedSection.displayName = "RecentlyViewedSection";

export default RecentlyViewedSection;
