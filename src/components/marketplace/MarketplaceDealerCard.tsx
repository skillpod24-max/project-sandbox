import { memo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Star, ShieldCheck, Sparkles, MapPin, Car, ArrowRight } from "lucide-react";

interface Props {
  dealer: any;
  vehicleCount: number;
  rating: number;
}

const MarketplaceDealerCard = memo(({ dealer, vehicleCount, rating }: Props) => {
  const getLocation = () => {
    const parts = (dealer.dealer_address || "").split(",").map((p: string) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const city = parts[parts.length - 2];
      const state = parts[parts.length - 1];
      return `${city}, ${state}`;
    }
    return parts[parts.length - 1] || "India";
  };

  return (
    <Link to={`/marketplace/dealer/${dealer.user_id}`} className="block">
      <Card className="p-5 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 shadow-md bg-card hover:bg-blue-50 rounded-2xl min-w-[300px] md:min-w-[340px] group overflow-hidden relative">
        {/* Decorative gradient background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 via-transparent to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
        
        <div className="flex items-start gap-4 relative">
          {/* Logo with ring animation on hover */}
          <div className="relative shrink-0">
            {dealer.shop_logo_url ? (
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-primary/60 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300 scale-110" />
                <img 
                  src={dealer.shop_logo_url} 
                  alt={dealer.dealer_name} 
                  className="h-16 w-16 rounded-2xl object-cover border-2 border-border group-hover:border-primary/50 transition-all duration-300 shadow-md relative z-10" 
                />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg group-hover:shadow-primary/30 transition-shadow duration-300">
                <Building2 className="h-7 w-7 text-primary-foreground" />
              </div>
            )}
            {dealer.marketplace_featured && (
              <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg animate-pulse-glow">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {dealer.dealer_name}
              </h3>
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
            </div>
            
            {/* Location */}
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              {getLocation()}
            </p>
            
            {/* Stats Row */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-lg">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span className="font-semibold text-xs">{rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
                <Car className="h-3.5 w-3.5" />
                <span className="font-medium">{vehicleCount}</span>
                <span>vehicles</span>
              </div>
            </div>
            
            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {dealer.marketplace_badge && (
                <Badge variant="outline" className="text-primary border-primary/30 text-xs py-0.5 rounded-md">
                  {dealer.marketplace_badge}
                </Badge>
              )}
              {dealer.marketplace_featured && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs py-0.5">
                  Featured
                </Badge>
              )}
            </div>
          </div>

          {/* Arrow indicator on hover */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <ArrowRight className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
});

MarketplaceDealerCard.displayName = "MarketplaceDealerCard";

export default MarketplaceDealerCard;
