import { memo, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { BadgePercent, ChevronRight, Flame, Tag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatIndianNumber } from "@/lib/formatters";

interface OffersDealsSectionProps {
  vehicles: any[];
  getDealerForVehicle: (userId: string) => any;
}

type DiscountFilter = "all" | "10" | "20" | "30";

const OffersDealsSection = memo(({ vehicles, getDealerForVehicle }: OffersDealsSectionProps) => {
  const [discountFilter, setDiscountFilter] = useState<DiscountFilter>("all");

  // Calculate vehicles with discounts (strikeout_price > selling_price)
  const dealsVehicles = useMemo(() => {
    return vehicles
      .filter(v => v.strikeout_price && v.strikeout_price > v.selling_price)
      .map(v => ({
        ...v,
        discountPercent: Math.round(((v.strikeout_price - v.selling_price) / v.strikeout_price) * 100),
        savings: v.strikeout_price - v.selling_price,
      }))
      .filter(v => {
        if (discountFilter === "all") return true;
        const minDiscount = parseInt(discountFilter);
        return v.discountPercent >= minDiscount;
      })
      .sort((a, b) => b.discountPercent - a.discountPercent)
      .slice(0, 6);
  }, [vehicles, discountFilter]);

  if (dealsVehicles.length === 0 && discountFilter === "all") return null;

  const discountFilters: { value: DiscountFilter; label: string }[] = [
    { value: "all", label: "All Deals" },
    { value: "10", label: "10%+ Off" },
    { value: "20", label: "20%+ Off" },
    { value: "30", label: "30%+ Off" },
  ];

  return (
    <section className="bg-gradient-to-br from-orange-50 to-red-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Hot Deals & Offers</h2>
              <p className="text-sm text-slate-500">Limited time discounts</p>
            </div>
          </div>
          <Link to="/marketplace?deals=true">
            <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-100 gap-1">
              View All <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Discount Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {discountFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setDiscountFilter(filter.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                discountFilter === filter.value
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-orange-200"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Deals Grid */}
        {dealsVehicles.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {dealsVehicles.map((vehicle) => {
              const dealer = getDealerForVehicle(vehicle.user_id);
              return (
                <Link 
                  key={vehicle.id} 
                  to={`/marketplace/vehicle/${vehicle.id}`}
                  className="group"
                >
                  <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all rounded-xl bg-white">
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
                      {/* Discount badge */}
                      <Badge className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 text-xs font-bold px-2 py-1 shadow-lg">
                        <BadgePercent className="h-3 w-3 mr-1" />
                        {vehicle.discountPercent}% OFF
                      </Badge>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                        {vehicle.manufacturing_year} {vehicle.brand}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-1">{vehicle.model}</p>
                      <div className="mt-2">
                        <p className="text-xs text-slate-400 line-through">
                          {formatCurrency(vehicle.strikeout_price)}
                        </p>
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-bold text-green-600">
                            {formatCurrency(vehicle.selling_price)}
                          </p>
                        </div>
                        <p className="text-[10px] text-orange-600 font-medium mt-0.5">
                          Save {formatCurrency(vehicle.savings)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card className="p-8 text-center border-0 bg-white/50">
            <Tag className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No deals with {discountFilter}%+ discount found</p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setDiscountFilter("all")}
              className="mt-2 text-orange-600"
            >
              View All Deals
            </Button>
          </Card>
        )}
      </div>
    </section>
  );
});

OffersDealsSection.displayName = "OffersDealsSection";

export default OffersDealsSection;
