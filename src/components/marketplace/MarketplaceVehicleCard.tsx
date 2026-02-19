import { memo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Heart, Gauge, Building2, CheckCircle, MapPin, GitCompare, Shield, Sparkles, TrendingUp } from "lucide-react";
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

// Color mapping for Tailwind color names to hex
const colorMap: Record<string, string> = {
  red: '#EF4444', orange: '#F97316', amber: '#F59E0B', yellow: '#EAB308',
  lime: '#84CC16', green: '#22C55E', emerald: '#10B981', teal: '#14B8A6',
  cyan: '#06B6D4', sky: '#0EA5E9', blue: '#3B82F6', indigo: '#6366F1',
  violet: '#8B5CF6', purple: '#A855F7', fuchsia: '#D946EF', pink: '#EC4899',
  rose: '#F43F5E', slate: '#64748B', gray: '#6B7280', zinc: '#71717A',
  neutral: '#737373', stone: '#78716C',
};

const MarketplaceVehicleCard = memo(({ 
  vehicle, 
  dealer, 
  compact = false,
  isInWishlist = false,
  isInCompare = false,
  onWishlistToggle,
  onCompareToggle
}: Props) => {
  const getBadgeStyle = () => {
    if (vehicle.image_badge_color) {
      const color = colorMap[vehicle.image_badge_color.toLowerCase()];
      if (color) return { backgroundColor: color };
      if (vehicle.image_badge_color.startsWith('#')) return { backgroundColor: vehicle.image_badge_color };
      return { backgroundColor: colorMap[vehicle.image_badge_color] || '#10B981' };
    }
    return { backgroundColor: '#10B981' };
  };

  const monthlyEmi = Math.round(vehicle.selling_price / 48);
  const hasDiscount = vehicle.strikeout_price && vehicle.strikeout_price > vehicle.selling_price;
  const discountPercent = hasDiscount 
    ? Math.round(((vehicle.strikeout_price - vehicle.selling_price) / vehicle.strikeout_price) * 100)
    : 0;

  return (
    <Link to={`/marketplace/vehicle/${vehicle.id}`} className="group block">
      <Card className={`overflow-hidden border-0 shadow-sm md:hover:shadow-xl transition-all duration-500 bg-card md:group-hover:-translate-y-1 ${compact ? 'rounded-xl' : 'rounded-2xl'}`}>
        {/* Image Container with Gradient Overlay */}
        <div className={`relative ${compact ? 'aspect-[4/3]' : 'aspect-[16/10]'} bg-gradient-to-br from-muted to-muted/50 overflow-hidden`}>
          {vehicle.image_url ? (
            <>
              <img
                src={vehicle.image_url}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="w-full h-full object-cover md:group-hover:scale-110 transition-transform duration-700 ease-out"
                loading="lazy"
              />
              {/* Gradient overlay for better text visibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 md:group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/30">
              <Car className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
          
          {/* Wishlist Button with Animation */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onWishlistToggle?.(vehicle.id);
            }}
            className={`absolute top-3 right-3 h-9 w-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-110 active:scale-95 ${
              isInWishlist 
                ? 'bg-red-500 text-white shadow-red-500/30' 
                : 'bg-white/90 hover:bg-white text-muted-foreground hover:text-red-500'
            }`}
          >
            <Heart className={`h-4 w-4 transition-transform duration-300 ${isInWishlist ? 'fill-current scale-110' : ''}`} />
          </button>

          {/* Top Left Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 max-w-[70%]">
            {vehicle.image_badge_text && (
              <Badge 
                className="text-white border-0 shadow-lg text-xs px-2.5 py-1 font-medium truncate max-w-full backdrop-blur-sm"
                style={getBadgeStyle()}
                title={vehicle.image_badge_text}
              >
                {vehicle.image_badge_text.length > 15 ? `${vehicle.image_badge_text.slice(0, 15)}...` : vehicle.image_badge_text}
              </Badge>
            )}
            {hasDiscount && (
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg text-xs px-2.5 py-1 font-semibold">
                <TrendingUp className="h-3 w-3 mr-1" />
                {discountPercent}% OFF
              </Badge>
            )}
          </div>

          {/* Bottom Gradient Info Bar - Shows on Hover */}
          {!compact && (
            <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full md:group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center gap-3 text-xs text-white/90">
                <span className="flex items-center gap-1">
                  <Gauge className="h-3.5 w-3.5" />
                  {vehicle.odometer_reading ? `${formatIndianNumber(vehicle.odometer_reading)} km` : 'N/A'}
                </span>
                <span className="capitalize">{vehicle.fuel_type}</span>
                <span className="capitalize">{vehicle.transmission}</span>
              </div>
            </div>
          )}
        </div>
        
        <CardContent className={`${compact ? 'p-3' : 'p-4'} space-y-3`}>
          {/* Category Tags */}
          {!compact && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs text-muted-foreground border-border font-normal rounded-md">
                {vehicle.vehicle_type === 'car' ? 'Car' : vehicle.vehicle_type === 'bike' ? 'Bike' : 'Commercial'}
              </Badge>
              {vehicle.condition === "new" && (
                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  New
                </Badge>
              )}
            </div>
          )}

          {/* Title & Price Row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold text-foreground group-hover:text-primary transition-colors ${compact ? 'text-sm line-clamp-1' : 'text-base line-clamp-2'}`} title={`${vehicle.manufacturing_year} ${vehicle.brand} ${vehicle.model}`}>
                {vehicle.manufacturing_year} {vehicle.brand} {vehicle.model}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5" title={vehicle.variant}>{vehicle.variant}</p>
            </div>
            <div className="text-right shrink-0 min-w-[90px]">
              {hasDiscount && (
                <p className="text-xs text-muted-foreground line-through">
                  {formatCurrency(vehicle.strikeout_price)}
                </p>
              )}
              <p className={`font-bold text-blue-600 ${compact ? 'text-base' : 'text-lg'}`}>
                {formatCurrency(vehicle.selling_price)}
              </p>
              {!compact && (
                <p className="text-xs text-muted-foreground whitespace-nowrap">+other charges</p>
              )}
            </div>
          </div>
          
          {/* Specs Row - Mobile Visible */}
          {compact && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Gauge className="h-3.5 w-3.5" />
                {vehicle.odometer_reading ? `${formatIndianNumber(vehicle.odometer_reading)} km` : 'N/A'}
              </span>
              <span className="capitalize">{vehicle.fuel_type}</span>
              <span className="capitalize">{vehicle.transmission}</span>
            </div>
          )}

          {/* EMI Info with Compare Button */}
          {!compact && (
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-2 text-xs">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <span className="text-muted-foreground">EMI from </span>
                  <span className="font-semibold text-foreground">₹{formatIndianNumber(monthlyEmi)}/m</span>
                </div>
              </div>
              {onCompareToggle && (
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onCompareToggle?.(vehicle.id);
                  }}
                  className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-all duration-300 ${
                    isInCompare 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                {dealer.shop_logo_url ? (
                  <img 
                    src={dealer.shop_logo_url} 
                    alt={dealer.dealer_name} 
                    className="h-7 w-7 rounded-full object-cover ring-2 ring-border" 
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-border">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <span className="text-xs text-foreground font-medium line-clamp-1 max-w-[100px]">
                  {dealer.dealer_name}
                </span>
                <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {(() => {
                  const parts = (dealer.dealer_address || "").split(",").map((s: string) => s.trim()).filter(Boolean);
                  // Extract city: skip last part (pincode/state), take the one before
                  if (parts.length >= 2) return parts[parts.length - 2];
                  return parts[0] || "India";
                })()}
              </span>
            </div>
          )}

          {/* Action Buttons - Enhanced */}
          {!compact && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button className="flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition-all duration-300 active:scale-[0.98]">
                Free Test Drive
              </button>
              <button className="flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.98]">
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
