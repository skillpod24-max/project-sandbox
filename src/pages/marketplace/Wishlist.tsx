import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Car, Heart, Trash2, ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import useWishlist from "@/hooks/useWishlist";
import { MarketplaceSkeleton } from "@/components/marketplace/ShimmerSkeleton";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";

const Wishlist = () => {
  const navigate = useNavigate();
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehicleImages, setVehicleImages] = useState<Record<string, string>>({});

  useEffect(() => {
    if (wishlist.length > 0) {
      fetchWishlistVehicles();
    } else {
      setLoading(false);
    }
  }, [wishlist]);

  const fetchWishlistVehicles = async () => {
    try {
      const { data: vehiclesData } = await supabase
        .from("vehicles")
        .select("*")
        .in("id", wishlist)
        .eq("is_public", true);

      setVehicles(vehiclesData || []);

      // Fetch images - get all images for each vehicle, not just primary
      if (vehiclesData && vehiclesData.length > 0) {
        const vehicleIds = vehiclesData.map(v => v.id);
        const { data: imagesData } = await supabase
          .from("vehicle_images")
          .select("*")
          .in("vehicle_id", vehicleIds);

        const imageMap: Record<string, string> = {};
        (imagesData || []).forEach(img => {
          // Prefer primary, but use first available if no primary
          if (!imageMap[img.vehicle_id] || img.is_primary) {
            imageMap[img.vehicle_id] = img.image_url;
          }
        });
        setVehicleImages(imageMap);
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => wishlist.includes(v.id));
  }, [vehicles, wishlist]);

  if (loading) {
    return <MarketplaceSkeleton />;
  }

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
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Car className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-slate-900">VahanHub</span>
          </Link>
          <div className="w-16" />
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
              <Heart className="h-6 w-6 text-red-500 fill-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Wishlist</h1>
              <p className="text-slate-500 text-sm">{filteredVehicles.length} saved vehicles</p>
            </div>
          </div>
          {filteredVehicles.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
              onClick={clearWishlist}
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>

        {/* Wishlist Content */}
        {filteredVehicles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVehicles.map((vehicle) => (
              <Card key={vehicle.id} className="overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all rounded-2xl group">
                <div className="relative aspect-[4/3] bg-slate-100">
                  {vehicleImages[vehicle.id] ? (
                    <img
                      src={vehicleImages[vehicle.id]}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="h-16 w-16 text-slate-300" />
                    </div>
                  )}
                  
                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeFromWishlist(vehicle.id);
                    }}
                    className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-red-50 transition-colors"
                  >
                    <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                  </button>
                </div>
                
                <CardContent className="p-4">
                  <h3 className="font-semibold text-slate-900 text-lg line-clamp-1">
                    {vehicle.manufacturing_year} {vehicle.brand} {vehicle.model}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">{vehicle.variant}</p>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                    <span className="capitalize">{vehicle.fuel_type}</span>
                    <span>•</span>
                    <span className="capitalize">{vehicle.transmission}</span>
                    {vehicle.odometer_reading && (
                      <>
                        <span>•</span>
                        <span>{(vehicle.odometer_reading / 1000).toFixed(0)}K km</span>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <span className="text-xl font-bold text-blue-600">
                        {formatCurrency(vehicle.selling_price)}
                      </span>
                      {vehicle.strikeout_price && vehicle.strikeout_price > vehicle.selling_price && (
                        <span className="text-sm text-slate-400 line-through ml-2">
                          {formatCurrency(vehicle.strikeout_price)}
                        </span>
                      )}
                    </div>
                    <Link to={`/marketplace/vehicle/${vehicle.id}`}>
                      <Button size="sm" className="rounded-lg">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center border-0 shadow-sm rounded-2xl">
            <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Heart className="h-10 w-10 text-slate-300" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Your wishlist is empty</h2>
            <p className="text-slate-500 mb-6">Start exploring and save vehicles you love</p>
            <Link to="/">
              <Button className="gap-2">
                <ShoppingBag className="h-4 w-4" />
                Browse Vehicles
              </Button>
            </Link>
          </Card>
        )}
      </div>

      <MarketplaceFooter />
    </div>
  );
};

export default Wishlist;
