import { memo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Fuel, Gauge, TrendingUp, Flame, Heart } from "lucide-react";
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
    strikeout_price?: number;
    image_url?: string;
  };
  dealer?: {
    dealer_name?: string;
    dealer_address?: string;
  };
}

const HighDemandCard = memo(({ vehicle, dealer }: HighDemandCardProps) => {
  const getCity = () => {
    if (!dealer?.dealer_address) return null;
    const parts = dealer.dealer_address.split(",").map((s: string) => s.trim()).filter(Boolean);
    if (parts.length >= 2) return parts[parts.length - 2];
    return parts[0] || null;
  };

  const hasDiscount = vehicle.strikeout_price && vehicle.strikeout_price > vehicle.selling_price;

  return (
    <Link to={`/marketplace/vehicle/${vehicle.id}`}>
      <Card className="group relative bg-card border-0 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
        {/* Animated Hot Badge */}
        <div className="absolute top-2 left-2 z-10">
          <Badge className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white text-[10px] px-2.5 py-1 gap-1 shadow-lg animate-pulse-glow border-0">
            <Flame className="h-3 w-3" />
            Hot
          </Badge>
        </div>

        {/* Wishlist Button */}
        <button className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-background hover:scale-110 shadow-sm">
          <Heart className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500 transition-colors" />
        </button>

        {/* Image with gradient overlay */}
        <div className="aspect-[4/3] bg-muted overflow-hidden relative">
          {vehicle.image_url ? (
            <>
              <img
                src={vehicle.image_url}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <Car className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          {/* Title */}
          <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors">
            {vehicle.manufacturing_year} {vehicle.brand} {vehicle.model}
          </h3>

          {/* Quick specs */}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-0.5 bg-muted px-1.5 py-0.5 rounded">
              <Fuel className="h-3 w-3" />
              {vehicle.fuel_type?.charAt(0).toUpperCase() + vehicle.fuel_type?.slice(1)}
            </span>
            {vehicle.odometer_reading && (
              <span className="flex items-center gap-0.5 bg-muted px-1.5 py-0.5 rounded">
                <Gauge className="h-3 w-3" />
                {formatIndianNumber(vehicle.odometer_reading)} km
              </span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center justify-between pt-1">
            <div>
              {hasDiscount && (
                <span className="text-[10px] text-muted-foreground line-through block">
                  {formatCurrency(vehicle.strikeout_price)}
                </span>
              )}
              <span className="text-base font-bold text-primary">
                {formatCurrency(vehicle.selling_price)}
              </span>
            </div>
            {getCity() && (
              <span className="text-[10px] text-muted-foreground truncate max-w-[70px] bg-muted px-1.5 py-0.5 rounded">
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
