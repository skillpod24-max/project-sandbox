import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Car, Fuel, Gauge, Calendar, Users, X, Check, Minus,
  CheckCircle, Phone, MessageCircle
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import CarLoader from "@/components/CarLoader";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";

const CompareVehicles = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [dealers, setDealers] = useState<Record<string, any>>({});

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

      // Fetch images
      const { data: imagesData } = await supabase
        .from("vehicle_images")
        .select("*")
        .in("vehicle_id", ids)
        .eq("is_primary", true);

      const imageMap: Record<string, string> = {};
      (imagesData || []).forEach(img => {
        imageMap[img.vehicle_id] = img.image_url;
      });

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
        image_url: imageMap[v.id]
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

  const specs = [
    { label: "Price", key: "selling_price", format: (v: any) => formatCurrency(v.selling_price) },
    { label: "Year", key: "manufacturing_year", format: (v: any) => v.manufacturing_year },
    { label: "Fuel Type", key: "fuel_type", format: (v: any) => v.fuel_type?.toUpperCase() },
    { label: "Transmission", key: "transmission", format: (v: any) => v.transmission?.toUpperCase() },
    { label: "Kilometers", key: "odometer_reading", format: (v: any) => v.odometer_reading ? `${(v.odometer_reading / 1000).toFixed(0)}K km` : "N/A" },
    { label: "Owners", key: "number_of_owners", format: (v: any) => `${v.number_of_owners || 1} Owner` },
    { label: "Condition", key: "condition", format: (v: any) => v.condition?.toUpperCase() },
    { label: "Color", key: "color", format: (v: any) => v.color || "N/A" },
    { label: "Mileage", key: "mileage", format: (v: any) => v.mileage ? `${v.mileage} km/l` : "N/A" },
    { label: "Seating", key: "seating_capacity", format: (v: any) => v.seating_capacity ? `${v.seating_capacity} Seats` : "N/A" },
  ];

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
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Compare Vehicles</h1>

        {/* Comparison Grid */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            {/* Vehicle Cards Header */}
            <thead>
              <tr>
                <th className="w-40 p-2"></th>
                {vehicles.map((vehicle) => (
                  <th key={vehicle.id} className="p-2 text-left">
                    <Card className="p-3 relative border-0 shadow-md rounded-xl">
                      <button
                        onClick={() => removeVehicle(vehicle.id)}
                        className="absolute top-2 right-2 h-6 w-6 rounded-full bg-slate-100 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 mb-3">
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
                      <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">
                        {vehicle.manufacturing_year} {vehicle.brand} {vehicle.model}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-1">{vehicle.variant}</p>
                      <p className="text-lg font-bold text-blue-600 mt-2">
                        {formatCurrency(vehicle.selling_price)}
                      </p>
                    </Card>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {specs.map((spec, i) => (
                <tr key={spec.key} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="p-3 text-sm font-medium text-slate-600">{spec.label}</td>
                  {vehicles.map((vehicle) => (
                    <td key={vehicle.id} className="p-3 text-sm text-slate-900 font-medium">
                      {spec.format(vehicle)}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Highlights */}
              <tr className="bg-white">
                <td className="p-3 text-sm font-medium text-slate-600">Highlights</td>
                {vehicles.map((vehicle) => (
                  <td key={vehicle.id} className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {(vehicle.public_highlights || []).slice(0, 3).map((h: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                          {h}
                        </Badge>
                      ))}
                      {(!vehicle.public_highlights || vehicle.public_highlights.length === 0) && (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Dealer */}
              <tr className="bg-slate-50">
                <td className="p-3 text-sm font-medium text-slate-600">Dealer</td>
                {vehicles.map((vehicle) => {
                  const dealer = dealers[vehicle.user_id];
                  return (
                    <td key={vehicle.id} className="p-3 text-sm text-slate-900">
                      {dealer?.dealer_name || "N/A"}
                    </td>
                  );
                })}
              </tr>

              {/* Actions */}
              <tr className="bg-white">
                <td className="p-3"></td>
                {vehicles.map((vehicle) => {
                  const dealer = dealers[vehicle.user_id];
                  return (
                    <td key={vehicle.id} className="p-3">
                      <div className="flex flex-col gap-2">
                        <Link to={`/marketplace/vehicle/${vehicle.id}`}>
                          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-sm">
                            View Details
                          </Button>
                        </Link>
                        {dealer?.whatsapp_number && (
                          <a
                            href={`https://wa.me/${dealer.whatsapp_number.replace(/\D/g, "")}?text=Hi, I'm interested in ${vehicle.brand} ${vehicle.model}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" className="w-full text-sm gap-1 border-green-300 text-green-600">
                              <MessageCircle className="h-4 w-4" />
                              WhatsApp
                            </Button>
                          </a>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <MarketplaceFooter />
    </div>
  );
};

export default CompareVehicles;
