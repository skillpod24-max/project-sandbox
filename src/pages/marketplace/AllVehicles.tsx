import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Car, MapPin, Search, SlidersHorizontal, Sparkles, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
      const { data: dealers } = await supabase
        .from("settings")
        .select("*")
        .eq("public_page_enabled", true)
        .eq("marketplace_enabled", true);

      const dealerIds = (dealers || []).map(d => d.user_id);

      const { data: vehicles } = await supabase
        .from("vehicles")
        .select("*")
        .in("user_id", dealerIds)
        .eq("is_public", true)
        .eq("status", "in_stock");

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

  const availableCities = useMemo(() => {
    const cities = dealers
      .map(d => {
        const parts = (d.dealer_address || "").split(",");
        return parts.length >= 2 ? parts[parts.length - 2]?.trim() : null;
      })
      .filter(Boolean);
    return [...new Set(cities)] as string[];
  }, [dealers]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (cityFilter !== "all") count++;
    if (vehicleType !== "all") count++;
    if (fuelType !== "all") count++;
    if (priceRange !== "all") count++;
    return count;
  }, [cityFilter, vehicleType, fuelType, priceRange]);

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
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </div>
            </Link>
            <div className="flex-1">
              <h1 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                All Vehicles
              </h1>
              <p className="text-xs text-muted-foreground">{filteredVehicles.length} vehicles available</p>
            </div>
            
            {/* Mobile Filter Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden gap-2 rounded-xl relative">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
                <SheetHeader className="pb-4 border-b border-border">
                  <SheetTitle className="flex items-center justify-between">
                    <span>Filters</span>
                    {activeFiltersCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="text-primary">
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Clear All
                      </Button>
                    )}
                  </SheetTitle>
                </SheetHeader>
                <div className="space-y-5 mt-6 overflow-y-auto">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">City</label>
                    <Select value={cityFilter} onValueChange={setCityFilter}>
                      <SelectTrigger className="rounded-xl h-12"><SelectValue placeholder="All Cities" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Cities</SelectItem>
                        {availableCities.map(city => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Vehicle Type</label>
                    <Select value={vehicleType} onValueChange={setVehicleType}>
                      <SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="car">Cars</SelectItem>
                        <SelectItem value="bike">Bikes</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Fuel Type</label>
                    <Select value={fuelType} onValueChange={setFuelType}>
                      <SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Fuel</SelectItem>
                        <SelectItem value="petrol">Petrol</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="electric">Electric</SelectItem>
                        <SelectItem value="cng">CNG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Budget</label>
                    <Select value={priceRange} onValueChange={setPriceRange}>
                      <SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Budget</SelectItem>
                        <SelectItem value="0-300000">Under ₹3 Lakh</SelectItem>
                        <SelectItem value="300000-500000">₹3-5 Lakh</SelectItem>
                        <SelectItem value="500000-1000000">₹5-10 Lakh</SelectItem>
                        <SelectItem value="1000000-99999999">Above ₹10 Lakh</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Search & Desktop Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by brand, model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 h-12 rounded-xl border-border bg-muted/30 focus:bg-background transition-colors"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44 h-12 rounded-xl">
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
          <div className="hidden md:flex gap-2 flex-wrap items-center">
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-40 rounded-xl">
                <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
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
              <SelectTrigger className="w-32 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="car">Cars</SelectItem>
                <SelectItem value="bike">Bikes</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
            <Select value={fuelType} onValueChange={setFuelType}>
              <SelectTrigger className="w-28 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fuel</SelectItem>
                <SelectItem value="petrol">Petrol</SelectItem>
                <SelectItem value="diesel">Diesel</SelectItem>
                <SelectItem value="electric">Electric</SelectItem>
                <SelectItem value="cng">CNG</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="w-40 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Budget</SelectItem>
                <SelectItem value="0-300000">Under ₹3 Lakh</SelectItem>
                <SelectItem value="300000-500000">₹3-5 Lakh</SelectItem>
                <SelectItem value="500000-1000000">₹5-10 Lakh</SelectItem>
                <SelectItem value="1000000-99999999">Above ₹10 Lakh</SelectItem>
              </SelectContent>
            </Select>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-primary gap-1">
                <RefreshCw className="h-4 w-4" />
                Clear ({activeFiltersCount})
              </Button>
            )}
          </div>

          {/* Active Filter Pills */}
          {activeFiltersCount > 0 && (
            <div className="flex gap-2 flex-wrap">
              {cityFilter !== "all" && (
                <Badge variant="secondary" className="rounded-full pl-3 pr-2 py-1 gap-1">
                  {cityFilter}
                  <button onClick={() => setCityFilter("all")} className="ml-1 hover:bg-muted rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {vehicleType !== "all" && (
                <Badge variant="secondary" className="rounded-full pl-3 pr-2 py-1 gap-1 capitalize">
                  {vehicleType}
                  <button onClick={() => setVehicleType("all")} className="ml-1 hover:bg-muted rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {fuelType !== "all" && (
                <Badge variant="secondary" className="rounded-full pl-3 pr-2 py-1 gap-1 capitalize">
                  {fuelType}
                  <button onClick={() => setFuelType("all")} className="ml-1 hover:bg-muted rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {priceRange !== "all" && (
                <Badge variant="secondary" className="rounded-full pl-3 pr-2 py-1 gap-1">
                  {priceRange === "0-300000" ? "Under ₹3L" : priceRange === "300000-500000" ? "₹3-5L" : priceRange === "500000-1000000" ? "₹5-10L" : "₹10L+"}
                  <button onClick={() => setPriceRange("all")} className="ml-1 hover:bg-muted rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Vehicles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredVehicles.map((vehicle, index) => (
            <div 
              key={vehicle.id} 
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <MarketplaceVehicleCard
                vehicle={vehicle}
                dealer={getDealerForVehicle(vehicle.user_id)}
                isInWishlist={isInWishlist(vehicle.id)}
                isInCompare={isInCompare(vehicle.id)}
                onWishlistToggle={toggleWishlist}
                onCompareToggle={toggleCompare}
              />
            </div>
          ))}
        </div>

        {/* Enhanced Empty State */}
        {filteredVehicles.length === 0 && (
          <div className="text-center py-20">
            <div className="h-24 w-24 rounded-full bg-muted/50 mx-auto flex items-center justify-center mb-6">
              <Car className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No vehicles found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              We couldn't find any vehicles matching your criteria. Try adjusting your filters.
            </p>
            <Button onClick={clearFilters} variant="outline" className="rounded-xl gap-2">
              <RefreshCw className="h-4 w-4" />
              Clear All Filters
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