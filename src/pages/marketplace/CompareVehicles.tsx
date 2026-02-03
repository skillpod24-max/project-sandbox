import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Car, Fuel, Gauge, Calendar, Users, X, Check, Minus,
  CheckCircle, Phone, MessageCircle, Shield, Zap, Battery, Settings,
  FileText, MapPin, Building2
} from "lucide-react";
import { formatCurrency, formatIndianNumber } from "@/lib/formatters";
import CarLoader from "@/components/CarLoader";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";

const CompareVehicles = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [dealers, setDealers] = useState<Record<string, any>>({});
  const [vehicleImages, setVehicleImages] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const ids = searchParams.get("ids")?.split(",").filter(Boolean) || [];
    if (ids.length >= 2) {
      fetchVehicles(ids);
    } else {
      navigate("/");
    }
  }, [searchParams, navigate]);

  const fetchVehicles = async (ids: string[]) => {
    try {
      const { data: vehiclesData } = await supabase
        .from("vehicles")
        .select("*")
        .in("id", ids)
        .eq("is_public", true);

      if (!vehiclesData || vehiclesData.length < 2) {
        navigate("/");
        return;
      }

      // Fetch ALL images for each vehicle
      const { data: imagesData } = await supabase
        .from("vehicle_images")
        .select("*")
        .in("vehicle_id", ids)
        .order("is_primary", { ascending: false });

      const imageMap: Record<string, string[]> = {};
      const primaryImageMap: Record<string, string> = {};
      (imagesData || []).forEach(img => {
        if (!imageMap[img.vehicle_id]) imageMap[img.vehicle_id] = [];
        imageMap[img.vehicle_id].push(img.image_url);
        if (img.is_primary || !primaryImageMap[img.vehicle_id]) {
          primaryImageMap[img.vehicle_id] = img.image_url;
        }
      });
      setVehicleImages(imageMap);

      // Fetch dealers
      const userIds = [...new Set(vehiclesData.map(v => v.user_id))];
      const { data: dealersData } = await supabase
        .from("settings")
        .select("*")
        .in("user_id", userIds);

      const dealerMap: Record<string, any> = {};
      (dealersData || []).forEach(d => {
        dealerMap[d.user_id] = d;
      });

      setVehicles(vehiclesData.map(v => ({
        ...v,
        image_url: primaryImageMap[v.id] || imageMap[v.id]?.[0]
      })));
      setDealers(dealerMap);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeVehicle = (id: string) => {
    const remaining = vehicles.filter(v => v.id !== id);
    if (remaining.length < 2) {
      navigate("/");
    } else {
      const newIds = remaining.map(v => v.id).join(",");
      navigate(`/marketplace/compare?ids=${newIds}`);
    }
  };

  if (loading) {
    return <CarLoader />;
  }

  // Comprehensive specs grouped by category
  const specCategories = [
    {
      title: "Price & Value",
      icon: Shield,
      specs: [
        { label: "Price", format: (v: any) => formatCurrency(v.selling_price), highlight: true },
        { label: "Original Price", format: (v: any) => v.strikeout_price ? formatCurrency(v.strikeout_price) : "-" },
        { label: "EMI (48 months)", format: (v: any) => `₹${formatIndianNumber(Math.round(v.selling_price / 48))}/mo` },
      ]
    },
    {
      title: "Basic Info",
      icon: Car,
      specs: [
        { label: "Year", format: (v: any) => v.manufacturing_year },
        { label: "Fuel Type", format: (v: any) => v.fuel_type?.toUpperCase() },
        { label: "Transmission", format: (v: any) => v.transmission?.toUpperCase() },
        { label: "Condition", format: (v: any) => v.condition?.toUpperCase() },
        { label: "Color", format: (v: any) => v.color || "-" },
      ]
    },
    {
      title: "Performance",
      icon: Zap,
      specs: [
        { label: "Kilometers", format: (v: any) => v.odometer_reading ? `${formatIndianNumber(v.odometer_reading)} km` : "-" },
        { label: "Mileage", format: (v: any) => v.mileage ? `${v.mileage} km/l` : "-" },
        { label: "Seating", format: (v: any) => v.seating_capacity ? `${v.seating_capacity} Seats` : "-" },
        { label: "Boot Space", format: (v: any) => v.boot_space || "-" },
      ]
    },
    {
      title: "Health & Condition",
      icon: Battery,
      specs: [
        { label: "Owners", format: (v: any) => `${v.number_of_owners || 1} Owner(s)` },
        { label: "Tyre Condition", format: (v: any) => v.tyre_condition || "-" },
        { label: "Battery Health", format: (v: any) => v.battery_health || "-" },
        { label: "Service History", format: (v: any) => v.service_history || "-" },
      ]
    },
    {
      title: "Documents & Compliance",
      icon: FileText,
      specs: [
        { label: "Insurance Valid", format: (v: any) => v.insurance_expiry ? new Date(v.insurance_expiry).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : "-" },
        { label: "PUC Valid", format: (v: any) => v.puc_expiry ? new Date(v.puc_expiry).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : "-" },
        { label: "Fitness Valid", format: (v: any) => v.fitness_expiry ? new Date(v.fitness_expiry).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : "-" },
        { label: "Road Tax Valid", format: (v: any) => v.road_tax_expiry ? new Date(v.road_tax_expiry).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : "-" },
        { label: "Hypothecation", format: (v: any) => v.hypothecation || "None" },
      ]
    },
  ];

  const getBestValue = (vehicles: any[], getValue: (v: any) => number, lower = true) => {
    const values = vehicles.map(v => getValue(v)).filter(v => !isNaN(v) && v > 0);
    if (values.length === 0) return null;
    return lower ? Math.min(...values) : Math.max(...values);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Car className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-slate-900">VahanHub</span>
          </Link>
          <div className="w-20" />
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Compare Vehicles</h1>
          <Badge variant="outline" className="text-sm">
            {vehicles.length} vehicles
          </Badge>
        </div>

        {/* Vehicle Cards - Sticky on desktop */}
        <div className="sticky top-14 z-40 bg-slate-50 pb-4 -mx-4 px-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${vehicles.length}, minmax(160px, 1fr))` }}>
            {vehicles.map((vehicle) => {
              const dealer = dealers[vehicle.user_id];
              return (
                <Card key={vehicle.id} className="relative border-0 shadow-lg rounded-xl overflow-hidden">
                  <button
                    onClick={() => removeVehicle(vehicle.id)}
                    className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full bg-white/90 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors shadow-sm"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  
                  <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                    {vehicle.image_url ? (
                      <img
                        src={vehicle.image_url}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="h-12 w-12 text-slate-300" />
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">
                      {vehicle.manufacturing_year} {vehicle.brand} {vehicle.model}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{vehicle.variant}</p>
                    <p className="text-lg font-bold text-blue-600 mt-1">
                      {formatCurrency(vehicle.selling_price)}
                    </p>
                    
                    {/* Dealer badge */}
                    {dealer && (
                      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100">
                        {dealer.shop_logo_url ? (
                          <img src={dealer.shop_logo_url} alt="" className="h-4 w-4 rounded-full object-cover" />
                        ) : (
                          <Building2 className="h-4 w-4 text-slate-400" />
                        )}
                        <span className="text-xs text-slate-500 truncate">{dealer.dealer_name}</span>
                        <CheckCircle className="h-3 w-3 text-blue-500 shrink-0" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="space-y-4 mt-4">
          {specCategories.map((category) => (
            <Card key={category.title} className="border-0 shadow-sm rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-3 flex items-center gap-2">
                <category.icon className="h-4 w-4 text-slate-600" />
                <h3 className="font-semibold text-slate-900 text-sm">{category.title}</h3>
              </div>
              <CardContent className="p-0">
                {category.specs.map((spec, i) => {
                  // Determine best value for price (lowest)
                  const isBestPrice = spec.label === "Price";
                  const bestPrice = isBestPrice ? getBestValue(vehicles, v => v.selling_price, true) : null;
                  
                  return (
                    <div key={spec.label} className={`grid items-center px-4 py-3 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                         style={{ gridTemplateColumns: `120px repeat(${vehicles.length}, 1fr)` }}>
                      <span className="text-sm font-medium text-slate-600">{spec.label}</span>
                      {vehicles.map((vehicle) => {
                        const value = spec.format(vehicle);
                        const isLowestPrice = isBestPrice && vehicle.selling_price === bestPrice;
                        
                        return (
                          <div key={vehicle.id} className={`text-sm font-medium text-center ${
                            spec.highlight ? 'text-blue-600 font-bold' : 'text-slate-900'
                          } ${isLowestPrice ? 'relative' : ''}`}>
                            {value}
                            {isLowestPrice && (
                              <Badge className="ml-1 bg-green-100 text-green-700 text-xs px-1.5 py-0">Best</Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}

          {/* Highlights Comparison */}
          <Card className="border-0 shadow-sm rounded-xl overflow-hidden">
            <div className="bg-emerald-50 px-4 py-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <h3 className="font-semibold text-slate-900 text-sm">Highlights</h3>
            </div>
            <CardContent className="p-4">
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${vehicles.length}, 1fr)` }}>
                {vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="space-y-2">
                    {(vehicle.public_highlights || []).map((h: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span className="text-slate-700">{h}</span>
                      </div>
                    ))}
                    {(!vehicle.public_highlights || vehicle.public_highlights.length === 0) && (
                      <span className="text-sm text-slate-400">No highlights listed</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid gap-4 pb-8" style={{ gridTemplateColumns: `repeat(${vehicles.length}, 1fr)` }}>
            {vehicles.map((vehicle) => {
              const dealer = dealers[vehicle.user_id];
              return (
                <div key={vehicle.id} className="space-y-2">
                  <Link to={`/marketplace/vehicle/${vehicle.id}`} className="block">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      View Details
                    </Button>
                  </Link>
                  {dealer?.whatsapp_number && (
                    <a
                      href={`https://wa.me/${dealer.whatsapp_number.replace(/\D/g, "")}?text=Hi, I'm interested in ${vehicle.brand} ${vehicle.model}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button variant="outline" className="w-full gap-1 border-green-300 text-green-600 hover:bg-green-50">
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp
                      </Button>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <MarketplaceFooter />
    </div>
  );
};

export default CompareVehicles;