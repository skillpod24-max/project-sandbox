import { memo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Heart, Fuel, Gauge, Building2, CheckCircle, MapPin, GitCompare, Shield, Calendar } from "lucide-react";
import { formatCurrency, formatIndianNumber } from "@/lib/formatters";

interface Props {
  vehicle: any;
  dealer: any;
  compact?: boolean;
  isInWishlist?: boolean;
  isInCompare?: boolean;
  onWishlistToggle?: (id: string) => void;
  onCompareToggle?: (id: string) => void;
}

const MarketplaceVehicleCard = memo(({ 
  vehicle, 
  dealer, 
  compact = false,
  isInWishlist = false,
  isInCompare = false,
  onWishlistToggle,
  onCompareToggle
}: Props) => {
  // Color mapping for Tailwind color names to hex
  const colorMap: Record<string, string> = {
    red: '#EF4444',
    orange: '#F97316', 
    amber: '#F59E0B',
    yellow: '#EAB308',
    lime: '#84CC16',
    green: '#22C55E',
    emerald: '#10B981',
    teal: '#14B8A6',
    cyan: '#06B6D4',
    sky: '#0EA5E9',
    blue: '#3B82F6',
    indigo: '#6366F1',
    violet: '#8B5CF6',
    purple: '#A855F7',
    fuchsia: '#D946EF',
    pink: '#EC4899',
    rose: '#F43F5E',
    slate: '#64748B',
    gray: '#6B7280',
    zinc: '#71717A',
    neutral: '#737373',
    stone: '#78716C',
  };

  // Get badge background color - use dealer's selected color or default emerald
  const getBadgeStyle = () => {
    if (vehicle.image_badge_color) {
      // Check if it's a Tailwind color name
      const color = colorMap[vehicle.image_badge_color.toLowerCase()];
      if (color) {
        return { backgroundColor: color };
      }
      // If it starts with #, use as-is
      if (vehicle.image_badge_color.startsWith('#')) {
        return { backgroundColor: vehicle.image_badge_color };
      }
      // Default fallback
      return { backgroundColor: colorMap[vehicle.image_badge_color] || '#10B981' };
    }
    return { backgroundColor: '#10B981' }; // Default emerald
  };

  const monthlyEmi = Math.round(vehicle.selling_price / 48);

  return (
    <Link to={`/marketplace/vehicle/${vehicle.id}`} className="group block">
      <Card className={`overflow-hidden border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-xl transition-all duration-300 bg-white ${compact ? 'rounded-xl' : 'rounded-2xl'}`}>
        {/* Image Container */}
        <div className={`relative ${compact ? 'aspect-[4/3]' : 'aspect-[4/3]'} bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden`}>
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
          
          {/* Wishlist Button */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onWishlistToggle?.(vehicle.id);
            }}
            className={`absolute top-3 right-3 h-9 w-9 rounded-full backdrop-blur flex items-center justify-center hover:scale-110 transition-all shadow-lg ${
              isInWishlist ? 'bg-red-500 text-white' : 'bg-white/95 hover:bg-white'
            }`}
          >
            <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : 'text-slate-400'}`} />
          </button>

          {/* Top Left Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 max-w-[70%]">
            {vehicle.image_badge_text && (
              <Badge 
                className="text-white border-0 shadow-lg text-xs px-2.5 py-1 font-medium truncate max-w-full"
                style={getBadgeStyle()}
                title={vehicle.image_badge_text}
              >
                {vehicle.image_badge_text.length > 15 ? `${vehicle.image_badge_text.slice(0, 15)}...` : vehicle.image_badge_text}
              </Badge>
            )}
          </div>
        </div>
        
        <CardContent className={`${compact ? 'p-3' : 'p-4'} space-y-3`}>
          {/* Category Tag */}
          {!compact && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs text-slate-500 border-slate-200 font-normal">
                {vehicle.vehicle_type === 'car' ? 'Car' : vehicle.vehicle_type === 'bike' ? 'Bike' : 'Commercial'}
              </Badge>
              {vehicle.condition === "new" && (
                <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">New</Badge>
              )}
            </div>
          )}

          {/* Title & Price Row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold text-slate-900 ${compact ? 'text-sm line-clamp-1' : 'text-base line-clamp-2'}`} title={`${vehicle.manufacturing_year} ${vehicle.brand} ${vehicle.model}`}>
                {vehicle.manufacturing_year} {vehicle.brand} {vehicle.model}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5" title={vehicle.variant}>{vehicle.variant}</p>
            </div>
            <div className="text-right shrink-0 min-w-[90px]">
              <p className={`font-bold text-blue-600 ${compact ? 'text-base' : 'text-lg'}`}>
                {formatCurrency(vehicle.selling_price)}
              </p>
              {!compact && (
                <p className="text-xs text-slate-400 whitespace-nowrap">+other charges</p>
              )}
            </div>
          </div>
          
          {/* Specs Row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5 text-slate-400" />
              {vehicle.odometer_reading ? `${formatIndianNumber(vehicle.odometer_reading)} km` : 'N/A'}
            </span>
            <span className="flex items-center gap-1 capitalize">
              {vehicle.fuel_type}
            </span>
            <span className="flex items-center gap-1 capitalize">
              {vehicle.transmission}
            </span>
            {!compact && vehicle.registration_number && (
              <span className="flex items-center gap-1 uppercase">
                {vehicle.registration_number.slice(0, 4)}
              </span>
            )}
          </div>

          {/* EMI Info */}
          {!compact && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs">
                <Shield className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-slate-500">EMI</span>
                <span className="font-semibold text-slate-900">₹{formatIndianNumber(monthlyEmi)}/m*</span>
              </div>
              {!compact && onCompareToggle && (
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onCompareToggle?.(vehicle.id);
                  }}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${
                    isInCompare ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <GitCompare className="h-3.5 w-3.5" />
                  {isInCompare ? 'Added' : 'Compare'}
                </button>
              )}
            </div>
          )}

          {/* Dealer Info */}
          {dealer && !compact && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
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
                <span className="text-xs text-slate-600 font-medium line-clamp-1 max-w-[100px]">
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

          {/* Action Buttons - Cars24 Style */}
          {!compact && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button className="flex items-center justify-center gap-1 py-2.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors">
                Free Test Drive
              </button>
              <button className="flex items-center justify-center gap-1 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors">
                View Details
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
});

MarketplaceVehicleCard.displayName = "MarketplaceVehicleCard";

export default MarketplaceVehicleCard;
