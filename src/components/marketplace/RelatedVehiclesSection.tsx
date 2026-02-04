import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ChevronRight, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatIndianNumber } from "@/lib/formatters";

interface RelatedVehiclesSectionProps {
  currentVehicle: any;
  allVehicles: any[];
  getDealerForVehicle: (userId: string) => any;
}

const RelatedVehiclesSection = memo(({ currentVehicle, allVehicles, getDealerForVehicle }: RelatedVehiclesSectionProps) => {
  const relatedVehicles = useMemo(() => {
    // Score vehicles based on similarity
    const scored = allVehicles
      .filter(v => v.id !== currentVehicle.id)
      .map(v => {
        let score = 0;
        
        // Same brand (+3)
        if (v.brand?.toLowerCase() === currentVehicle.brand?.toLowerCase()) score += 3;
        
        // Same vehicle type (+2)
        if (v.vehicle_type === currentVehicle.vehicle_type) score += 2;
        
        // Same fuel type (+2)
        if (v.fuel_type === currentVehicle.fuel_type) score += 2;
        
        // Similar price range (within 20%) (+2)
        const priceDiff = Math.abs(v.selling_price - currentVehicle.selling_price) / currentVehicle.selling_price;
        if (priceDiff < 0.2) score += 2;
        else if (priceDiff < 0.4) score += 1;
        
        // Same transmission (+1)
        if (v.transmission === currentVehicle.transmission) score += 1;
        
        // Similar year (within 2 years) (+1)
        const yearDiff = Math.abs(v.manufacturing_year - currentVehicle.manufacturing_year);
        if (yearDiff <= 2) score += 1;
        
        return { ...v, score };
      })
      .filter(v => v.score >= 2) // Only show if at least somewhat related
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
    
    return scored;
  }, [currentVehicle, allVehicles]);

  if (relatedVehicles.length === 0) return null;

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Similar Vehicles</h2>
            <p className="text-sm text-slate-500">Based on your interest</p>
          </div>
        </div>
        <Link to={`/marketplace?type=${currentVehicle.vehicle_type}&fuel=${currentVehicle.fuel_type}`}>
          <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 gap-1">
            View More <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {relatedVehicles.slice(0, 4).map((vehicle) => {
          const dealer = getDealerForVehicle(vehicle.user_id);
          return (
            <Link 
              key={vehicle.id} 
              to={`/marketplace/vehicle/${vehicle.id}`}
              className="group"
            >
              <Card className="overflow-hidden border border-slate-200 hover:border-purple-200 hover:shadow-lg transition-all rounded-xl">
                <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                  {vehicle.image_url ? (
                    <img
                      src={vehicle.image_url}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="h-10 w-10 text-slate-300" />
                    </div>
                  )}
                  {vehicle.brand?.toLowerCase() === currentVehicle.brand?.toLowerCase() && (
                    <Badge className="absolute top-2 left-2 bg-purple-500/90 text-white text-[10px] border-0">
                      Same Brand
                    </Badge>
                  )}
                  {vehicle.strikeout_price && vehicle.strikeout_price > vehicle.selling_price && (
                    <Badge className="absolute top-2 right-2 bg-red-500/90 text-white text-[10px] border-0">
                      Deal
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                    {vehicle.manufacturing_year} {vehicle.brand} {vehicle.model}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <span>{vehicle.odometer_reading ? `${formatIndianNumber(vehicle.odometer_reading)} km` : 'N/A'}</span>
                    <span>•</span>
                    <span className="capitalize">{vehicle.fuel_type}</span>
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm font-bold text-blue-600">
                      {formatCurrency(vehicle.selling_price)}
                    </p>
                    {dealer?.dealer_name && (
                      <span className="text-[10px] text-slate-400 truncate max-w-[60px]">
                        {dealer.dealer_name.split(' ')[0]}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
});

RelatedVehiclesSection.displayName = "RelatedVehiclesSection";

export default RelatedVehiclesSection;
