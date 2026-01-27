import { memo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Heart, Fuel, Gauge, Building2, CheckCircle, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface Props {
  vehicle: any;
  dealer: any;
  compact?: boolean;
}

const MarketplaceVehicleCard = memo(({ vehicle, dealer, compact = false }: Props) => (
  <Link to={`/marketplace/vehicle/${vehicle.id}`} className="group block">
    <Card className={`overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white ${compact ? 'rounded-xl' : 'rounded-2xl'}`}>
      <div className={`relative ${compact ? 'aspect-[4/3]' : 'aspect-[16/10]'} bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden`}>
        {vehicle.image_url ? (
          <img
            src={vehicle.image_url}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <Car className="h-16 w-16 text-slate-300" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {vehicle.image_badge_text && (
            <Badge className="bg-orange-500 text-white border-0 shadow-lg text-xs px-2 py-1">
              {vehicle.image_badge_text}
            </Badge>
          )}
          {vehicle.condition === "new" && (
            <Badge className="bg-emerald-500 text-white border-0 shadow text-xs px-2 py-1">New</Badge>
          )}
        </div>
        
        {/* Favorite Button */}
        <button className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/95 backdrop-blur flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow-lg">
          <Heart className="h-4 w-4 text-slate-400 hover:text-red-500 transition-colors" />
        </button>

        {/* Price Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 pt-12">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {formatCurrency(vehicle.selling_price)}
            </span>
            {vehicle.strikeout_price && vehicle.strikeout_price > vehicle.selling_price && (
              <span className="text-sm text-white/70 line-through">
                {formatCurrency(vehicle.strikeout_price)}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <CardContent className={`${compact ? 'p-3' : 'p-4'} space-y-3`}>
        {/* Title */}
        <div>
          <h3 className={`font-semibold text-slate-900 line-clamp-1 ${compact ? 'text-sm' : 'text-base'}`}>
            {vehicle.manufacturing_year} {vehicle.brand} {vehicle.model}
          </h3>
          <p className="text-sm text-slate-500 line-clamp-1">{vehicle.variant}</p>
        </div>
        
        {/* Specs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
          <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full">
            <Gauge className="h-3 w-3" />
            {vehicle.odometer_reading ? `${(vehicle.odometer_reading / 1000).toFixed(0)}K` : 'N/A'}
          </span>
          <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full">
            <Fuel className="h-3 w-3" />
            {vehicle.fuel_type}
          </span>
          <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full">
            {vehicle.transmission}
          </span>
        </div>

        {/* Dealer Info */}
        {dealer && !compact && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {dealer.shop_logo_url ? (
                <img 
                  src={dealer.shop_logo_url} 
                  alt={dealer.dealer_name} 
                  className="h-6 w-6 rounded-full object-cover" 
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <Building2 className="h-3 w-3 text-blue-600" />
                </div>
              )}
              <span className="text-xs text-slate-600 font-medium line-clamp-1 max-w-[120px]">
                {dealer.dealer_name}
              </span>
              <CheckCircle className="h-3 w-3 text-blue-500 shrink-0" />
            </div>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {dealer.dealer_address?.split(",").slice(-2, -1).join("").trim() || "India"}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  </Link>
));

MarketplaceVehicleCard.displayName = "MarketplaceVehicleCard";

export default MarketplaceVehicleCard;
