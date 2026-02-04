import { memo } from "react";
import { Link } from "react-router-dom";
import { Building2, ChevronRight, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatIndianNumber } from "@/lib/formatters";

interface DealerVehiclesSectionProps {
  vehicles: any[];
  dealer: any;
  currentVehicleId: string;
  title?: string;
}

const DealerVehiclesSection = memo(({ vehicles, dealer, currentVehicleId, title = "More from this Dealer" }: DealerVehiclesSectionProps) => {
  // Filter out current vehicle
  const otherVehicles = vehicles.filter(v => v.id !== currentVehicleId).slice(0, 6);
  
  if (otherVehicles.length === 0) return null;

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {dealer?.shop_logo_url ? (
            <img 
              src={dealer.shop_logo_url} 
              alt={dealer.dealer_name} 
              className="h-10 w-10 rounded-xl object-cover border border-slate-200"
            />
          ) : (
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">{dealer?.dealer_name || "Dealer"}</p>
          </div>
        </div>
        {dealer?.public_page_id && (
          <Link to={`/marketplace/dealer/${dealer.public_page_id}`}>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1">
              View All <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {otherVehicles.map((vehicle) => (
          <Link 
            key={vehicle.id} 
            to={`/marketplace/vehicle/${vehicle.id}`}
            className="shrink-0 w-52 group"
          >
            <Card className="overflow-hidden border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all rounded-xl">
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
                    <Car className="h-8 w-8 text-slate-300" />
                  </div>
                )}
                {vehicle.condition === "new" && (
                  <Badge className="absolute top-2 left-2 bg-emerald-500/90 text-white text-[10px] border-0">
                    New
                  </Badge>
                )}
              </div>
              <CardContent className="p-3">
                <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                  {vehicle.manufacturing_year} {vehicle.brand} {vehicle.model}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                  {vehicle.variant || `${vehicle.fuel_type} • ${vehicle.transmission}`}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm font-bold text-blue-600">
                    {formatCurrency(vehicle.selling_price)}
                  </p>
                  <span className="text-[10px] text-slate-400">
                    {vehicle.odometer_reading ? `${formatIndianNumber(vehicle.odometer_reading)} km` : ''}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
});

DealerVehiclesSection.displayName = "DealerVehiclesSection";

export default DealerVehiclesSection;
