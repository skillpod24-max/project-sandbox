import { memo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Star, CheckCircle, Sparkles, MapPin, Car } from "lucide-react";

interface Props {
  dealer: any;
  vehicleCount: number;
  rating: number;
}

const MarketplaceDealerCard = memo(({ dealer, vehicleCount, rating }: Props) => (
  <Link to={`/marketplace/dealer/${dealer.user_id}`} className="block">
    <Card className="p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-white rounded-2xl min-w-[300px] md:min-w-[340px] group">
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="relative shrink-0">
          {dealer.shop_logo_url ? (
            <img 
              src={dealer.shop_logo_url} 
              alt={dealer.dealer_name} 
              className="h-16 w-16 rounded-xl object-cover border-2 border-slate-100 group-hover:border-blue-200 transition-colors shadow-sm" 
            />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Building2 className="h-7 w-7 text-white" />
            </div>
          )}
          {dealer.marketplace_featured && (
            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-400 flex items-center justify-center shadow">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 truncate">{dealer.dealer_name}</h3>
            <CheckCircle className="h-4 w-4 text-blue-500 shrink-0" />
          </div>
          
          {/* Location - City and State */}
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3" />
            {(() => {
              const parts = (dealer.dealer_address || "").split(",").map((p: string) => p.trim()).filter(Boolean);
              if (parts.length >= 2) {
                const city = parts[parts.length - 2];
                const state = parts[parts.length - 1];
                return `${city}, ${state}`;
              }
              return parts[parts.length - 1] || "India";
            })()}
          </p>
          
          {/* Stats */}
          <div className="flex items-center gap-3 text-sm text-slate-600 mt-2">
            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              <span className="font-medium text-xs">{rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Car className="h-3 w-3" />
              <span>{vehicleCount} vehicles</span>
            </div>
          </div>
          
          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {dealer.marketplace_badge && (
              <Badge className="bg-blue-50 text-blue-700 border-blue-100 text-xs py-0.5">
                {dealer.marketplace_badge}
              </Badge>
            )}
            {dealer.marketplace_featured && (
              <Badge className="bg-amber-50 text-amber-700 border-amber-100 text-xs py-0.5">
                Featured
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  </Link>
));

MarketplaceDealerCard.displayName = "MarketplaceDealerCard";

export default MarketplaceDealerCard;
