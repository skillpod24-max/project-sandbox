import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Car, MapPin, Search, Filter, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MarketplaceSkeleton } from "@/components/marketplace/ShimmerSkeleton";
import MarketplaceVehicleCard from "@/components/marketplace/MarketplaceVehicleCard";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import useWishlist from "@/hooks/useWishlist";
import useComparison from "@/hooks/useComparison";
import CompareBar from "@/components/marketplace/CompareBar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const AllVehicles = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [vehicleType, setVehicleType] = useState("all");
  const [fuelType, setFuelType] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const { isInWishlist, toggleWishlist } = useWishlist();
  const { compareList, isInCompare, toggleCompare, removeFromCompare, clearCompare } = useComparison();

  // Fetch all marketplace vehicles
  const { data, isLoading } = useQuery({
    queryKey: ['all-vehicles'],
    queryFn: async () => {
      // First get marketplace-enabled dealers
      const { data: dealers } = await supabase
        .from("settings")
        .select("*")
        .eq("public_page_enabled", true)
        .eq("marketplace_enabled", true);

      const dealerIds = (dealers || []).map(d => d.user_id);

      // Fetch vehicles from these dealers
      const { data: vehicles } = await supabase
        .from("vehicles")
        .select("*")
        .in("user_id", dealerIds)
        .eq("is_public", true)
        .eq("status", "in_stock");

      // Fetch images
      const vehicleIds = (vehicles || []).map(v => v.id);
      const { data: images } = await supabase
        .from("vehicle_images")
        .select("*")
        .in("vehicle_id", vehicleIds);

      const imageMap: Record<string, string> = {};
      (images || []).forEach(img => {
        if (!imageMap[img.vehicle_id] || img.is_primary) {
          imageMap[img.vehicle_id] = img.image_url;
        }
      });

      return {
        vehicles: (vehicles || []).map(v => ({
          ...v,
          image_url: imageMap[v.id]
        })),
        dealers: dealers || []
      };
    },
    staleTime: 1000 * 60 * 5
  });

  const vehicles = data?.vehicles || [];
  const dealers = data?.dealers || [];

  const getDealerForVehicle = useCallback((userId: string) => {
    return dealers.find(d => d.user_id === userId);
  }, [dealers]);

  const getDealerCity = useCallback((userId: string) => {
    const dealer = dealers.find(d => d.user_id === userId);
    if (!dealer?.dealer_address) return null;
    const parts = dealer.dealer_address.split(",");
    return parts.length >= 2 ? parts[parts.length - 2]?.trim() : null;
  }, [dealers]);

  // Get cities from dealers
  const availableCities = useMemo(() => {
    const cities = dealers
      .map(d => {
        const parts = (d.dealer_address || "").split(",");
        return parts.length >= 2 ? parts[parts.length - 2]?.trim() : null;
      })
      .filter(Boolean);
    return [...new Set(cities)] as string[];
  }, [dealers]);

  const filteredVehicles = useMemo(() => {
    let result = vehicles.filter(v => {
      const matchesSearch = !searchTerm || 
        `${v.brand} ${v.model} ${v.variant || ""}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = vehicleType === "all" || v.vehicle_type === vehicleType;
      const matchesFuel = fuelType === "all" || v.fuel_type === fuelType;
      const matchesCity = cityFilter === "all" || getDealerCity(v.user_id) === cityFilter;
      
      let matchesPrice = true;
      if (priceRange !== "all") {
        const [min, max] = priceRange.split("-").map(Number);
        matchesPrice = v.selling_price >= min && (!max || v.selling_price <= max);
      }
      
      return matchesSearch && matchesType && matchesFuel && matchesPrice && matchesCity;
    });

    // Sort
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.selling_price - b.selling_price);
        break;
      case "price-high":
        result.sort((a, b) => b.selling_price - a.selling_price);
        break;
      case "year-new":
        result.sort((a, b) => b.manufacturing_year - a.manufacturing_year);
        break;
      case "km-low":
        result.sort((a, b) => (a.odometer_reading || 0) - (b.odometer_reading || 0));
        break;
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [vehicles, searchTerm, vehicleType, fuelType, priceRange, cityFilter, sortBy, getDealerCity]);

  const compareVehicles = useMemo(() => {
    return vehicles.filter(v => compareList.includes(v.id));
  }, [vehicles, compareList]);

  const clearFilters = () => {
    setSearchTerm("");
    setCityFilter("all");
    setVehicleType("all");
    setFuelType("all");
    setPriceRange("all");
    setSortBy("newest");
  };

  if (isLoading) return <MarketplaceSkeleton />;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-foreground">All Vehicles</h1>
            <p className="text-xs text-muted-foreground">{filteredVehicles.length} vehicles</p>
          </div>
          
          {/* Mobile Filter Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">City</label>
                  <Select value={cityFilter} onValueChange={setCityFilter}>
                    <SelectTrigger><SelectValue placeholder="All Cities" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cities</SelectItem>
                      {availableCities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Vehicle Type</label>
                  <Select value={vehicleType} onValueChange={setVehicleType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="car">Cars</SelectItem>
                      <SelectItem value="bike">Bikes</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Fuel Type</label>
                  <Select value={fuelType} onValueChange={setFuelType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Fuel</SelectItem>
                      <SelectItem value="petrol">Petrol</SelectItem>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="electric">Electric</SelectItem>
                      <SelectItem value="cng">CNG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Budget</label>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Budget</SelectItem>
                      <SelectItem value="0-300000">Under ₹3 Lakh</SelectItem>
                      <SelectItem value="300000-500000">₹3-5 Lakh</SelectItem>
                      <SelectItem value="500000-1000000">₹5-10 Lakh</SelectItem>
                      <SelectItem value="1000000-99999999">Above ₹10 Lakh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={clearFilters} variant="outline" className="w-full">
                  Clear All Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Search & Desktop Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="year-new">Year: Newest</SelectItem>
                <SelectItem value="km-low">KM: Lowest</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Desktop Filters */}
          <div className="hidden md:flex gap-2 flex-wrap">
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-36">
                <MapPin className="h-4 w-4 mr-1" />
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {availableCities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={vehicleType} onValueChange={setVehicleType}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="car">Cars</SelectItem>
                <SelectItem value="bike">Bikes</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
            <Select value={fuelType} onValueChange={setFuelType}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fuel</SelectItem>
                <SelectItem value="petrol">Petrol</SelectItem>
                <SelectItem value="diesel">Diesel</SelectItem>
                <SelectItem value="electric">Electric</SelectItem>
                <SelectItem value="cng">CNG</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Budget</SelectItem>
                <SelectItem value="0-300000">Under ₹3 Lakh</SelectItem>
                <SelectItem value="300000-500000">₹3-5 Lakh</SelectItem>
                <SelectItem value="500000-1000000">₹5-10 Lakh</SelectItem>
                <SelectItem value="1000000-99999999">Above ₹10 Lakh</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </div>

        {/* Vehicles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map(vehicle => (
            <MarketplaceVehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              dealer={getDealerForVehicle(vehicle.user_id)}
              isInWishlist={isInWishlist(vehicle.id)}
              isInCompare={isInCompare(vehicle.id)}
              onWishlistToggle={toggleWishlist}
              onCompareToggle={toggleCompare}
            />
          ))}
        </div>

        {filteredVehicles.length === 0 && (
          <div className="text-center py-16">
            <Car className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-foreground">No vehicles found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
            <Button onClick={clearFilters} variant="outline" className="mt-4">
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      <CompareBar
        vehicles={compareVehicles}
        onRemove={removeFromCompare}
        onClear={clearCompare}
      />

      <MarketplaceFooter />
    </div>
  );
};

export default AllVehicles;
