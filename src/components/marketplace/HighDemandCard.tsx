import { memo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Fuel, Gauge, TrendingUp, Eye } from "lucide-react";
import { formatCurrency, formatIndianNumber } from "@/lib/formatters";

interface HighDemandCardProps {
  vehicle: {
    id: string;
    brand: string;
    model: string;
    variant?: string;
    manufacturing_year: number;
    fuel_type: string;
    odometer_reading?: number;
    selling_price: number;
    image_url?: string;
  };
  dealer?: {
    dealer_name?: string;
    dealer_address?: string;
  };
}

const HighDemandCard = memo(({ vehicle, dealer }: HighDemandCardProps) => {
  // Extract city from dealer address
  const getCity = () => {
    if (!dealer?.dealer_address) return null;
    const parts = dealer.dealer_address.split(",");
    return parts.length >= 2 ? parts[parts.length - 2]?.trim() : null;
  };

  return (
    <Link to={`/marketplace/vehicle/${vehicle.id}`}>
      <Card className="group relative bg-white border-0 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
        {/* Hot Badge */}
        <div className="absolute top-2 left-2 z-10">
          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] px-2 py-0.5 gap-1 shadow-lg">
            <TrendingUp className="h-3 w-3" />
            Hot
          </Badge>
        </div>

        {/* Image - Compact aspect ratio */}
        <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
          {vehicle.image_url ? (
            <img
              src={vehicle.image_url}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Car className="h-10 w-10 text-slate-300" />
            </div>
          )}
        </div>

        {/* Content - Minimal info for quick lookup */}
        <div className="p-3 space-y-1.5">
          {/* Title - Single line */}
          <h3 className="font-semibold text-slate-900 text-sm leading-tight line-clamp-1">
            {vehicle.manufacturing_year} {vehicle.brand} {vehicle.model}
          </h3>

          {/* Quick specs - Inline */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-0.5">
              <Fuel className="h-3 w-3" />
              {vehicle.fuel_type?.charAt(0).toUpperCase() + vehicle.fuel_type?.slice(1)}
            </span>
            {vehicle.odometer_reading && (
              <>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-0.5">
                  <Gauge className="h-3 w-3" />
                  {formatIndianNumber(vehicle.odometer_reading)} km
                </span>
              </>
            )}
          </div>

          {/* Price - Bold and prominent */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-base font-bold text-blue-600">
              {formatCurrency(vehicle.selling_price)}
            </span>
            {getCity() && (
              <span className="text-[10px] text-slate-400 truncate max-w-[80px]">
                {getCity()}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
});

HighDemandCard.displayName = "HighDemandCard";

export default HighDemandCard;
