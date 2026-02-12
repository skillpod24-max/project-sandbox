import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Car, MapPin, Search, Sparkles, X, RefreshCw, SlidersHorizontal, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { MarketplaceSkeleton } from "@/components/marketplace/ShimmerSkeleton";
import MarketplaceVehicleCard from "@/components/marketplace/MarketplaceVehicleCard";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import useWishlist from "@/hooks/useWishlist";
import useComparison from "@/hooks/useComparison";
import CompareBar from "@/components/marketplace/CompareBar";

const AllVehicles = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [vehicleType, setVehicleType] = useState("all");
  const [fuelType, setFuelType] = useState("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([50000, 7500000]);
  const [sortBy, setSortBy] = useState("newest");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [transmissionFilter, setTransmissionFilter] = useState("all");

  const { isInWishlist, toggleWishlist } = useWishlist();
  const { compareList, isInCompare, toggleCompare, removeFromCompare, clearCompare } = useComparison();

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
    const parts = dealer.dealer_address.split(",").map((s: string) => s.trim()).filter(Boolean);
    if (parts.length >= 3) return parts[parts.length - 3];
    if (parts.length >= 2) return parts[parts.length - 2];
    return parts[0] || null;
  }, [dealers]);

  const availableCities = useMemo(() => {
    const cities = dealers
      .map(d => {
        const parts = (d.dealer_address || "").split(",").map((s: string) => s.trim()).filter(Boolean);
        if (parts.length >= 3) return parts[parts.length - 3];
        if (parts.length >= 2) return parts[parts.length - 2];
        return null;
      })
      .filter(Boolean);
    return [...new Set(cities)] as string[];
  }, [dealers]);

  // Get unique brands with counts
  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    vehicles.forEach(v => {
      counts[v.brand] = (counts[v.brand] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [vehicles]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (cityFilter !== "all") count++;
    if (vehicleType !== "all") count++;
    if (fuelType !== "all") count++;
    if (transmissionFilter !== "all") count++;
    if (priceRange[0] !== 50000 || priceRange[1] !== 7500000) count++;
    if (selectedBrands.length > 0) count++;
    return count;
  }, [cityFilter, vehicleType, fuelType, priceRange, selectedBrands, transmissionFilter]);

  const filteredVehicles = useMemo(() => {
    let result = vehicles.filter(v => {
      const matchesSearch = !searchTerm ||
        `${v.brand} ${v.model} ${v.variant || ""}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = vehicleType === "all" || v.vehicle_type === vehicleType;
      const matchesFuel = fuelType === "all" || v.fuel_type === fuelType;
      const matchesCity = cityFilter === "all" || getDealerCity(v.user_id) === cityFilter;
      const matchesPrice = v.selling_price >= priceRange[0] && v.selling_price <= priceRange[1];
      const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(v.brand);
      const matchesTransmission = transmissionFilter === "all" || v.transmission === transmissionFilter;

      return matchesSearch && matchesType && matchesFuel && matchesPrice && matchesCity && matchesBrand && matchesTransmission;
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
  }, [vehicles, searchTerm, vehicleType, fuelType, priceRange, cityFilter, sortBy, getDealerCity, selectedBrands, transmissionFilter]);

  const compareVehicles = useMemo(() => {
    return vehicles.filter(v => compareList.includes(v.id));
  }, [vehicles, compareList]);

  const clearFilters = () => {
    setSearchTerm("");
    setCityFilter("all");
    setVehicleType("all");
    setFuelType("all");
    setPriceRange([50000, 7500000]);
    setSortBy("newest");
    setSelectedBrands([]);
    setTransmissionFilter("all");
  };

  const formatBudget = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(val % 100000 === 0 ? 0 : 1)}L`;
    return `₹${(val / 1000).toFixed(0)}K`;
  };

  if (isLoading) return <MarketplaceSkeleton />;

  // Sidebar filter panel component
  const FilterPanel = ({ className = "" }: { className?: string }) => (
    <div className={`space-y-6 ${className}`}>
      {/* Budget Range Slider */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">Budget</h3>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-600">{formatBudget(priceRange[0])}</span>
          <span className="text-sm font-medium text-blue-600">{formatBudget(priceRange[1])}</span>
        </div>
        <Slider
          value={priceRange}
          onValueChange={(val) => setPriceRange(val as [number, number])}
          min={50000}
          max={7500000}
          step={50000}
          className="my-4"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Minimum</span>
          <span>Maximum</span>
        </div>
      </div>

      {/* Make & Model Search */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">Make & Model</h3>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search a brand or model"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 rounded-lg border-border"
          />
        </div>
        {/* Brand Checkboxes */}
        <div className="space-y-2 max-h-48 overflow-y-auto smooth-scroll">
          {brandCounts.map(([brand, count]) => (
            <label key={brand} className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-lg px-2 py-1.5 transition-colors">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedBrands.includes(brand)}
                  onCheckedChange={() => toggleBrand(brand)}
                />
                <span className="text-sm text-foreground">{brand}</span>
              </div>
              <span className="text-xs text-muted-foreground">({count})</span>
            </label>
          ))}
        </div>
      </div>

      {/* Vehicle Type */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">Vehicle Type</h3>
        <Select value={vehicleType} onValueChange={setVehicleType}>
          <SelectTrigger className="rounded-lg h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="car">Cars</SelectItem>
            <SelectItem value="bike">Bikes</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Fuel Type */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">Fuel Type</h3>
        <Select value={fuelType} onValueChange={setFuelType}>
          <SelectTrigger className="rounded-lg h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fuel</SelectItem>
            <SelectItem value="petrol">Petrol</SelectItem>
            <SelectItem value="diesel">Diesel</SelectItem>
            <SelectItem value="electric">Electric</SelectItem>
            <SelectItem value="cng">CNG</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transmission */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">Transmission</h3>
        <Select value={transmissionFilter} onValueChange={setTransmissionFilter}>
          <SelectTrigger className="rounded-lg h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="automatic">Automatic</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* City */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">Location</h3>
        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="rounded-lg h-10">
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
      </div>

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <Button variant="outline" onClick={clearFilters} className="w-full gap-2 rounded-lg">
          <RefreshCw className="h-4 w-4" />
          Clear All Filters ({activeFiltersCount})
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4">
          <div className="h-14 flex items-center gap-3">
            <Link to="/" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
              <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
                <ArrowLeft className="h-5 w-5" />
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600 shrink-0" />
                <span className="truncate">All Vehicles</span>
              </h1>
              <p className="text-xs text-muted-foreground">{filteredVehicles.length} vehicles available</p>
            </div>

            {/* Sort dropdown - hidden on small mobile */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-28 md:w-40 h-9 rounded-lg text-sm shrink-0">
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
        </div>

        {/* Mobile horizontal filter chips */}
        <div className="lg:hidden overflow-x-auto scrollbar-invisible border-t border-border">
          <div className="flex items-center gap-2 px-4 py-2 min-w-max">
            <Select value={fuelType} onValueChange={setFuelType}>
              <SelectTrigger className="h-8 text-xs rounded-full border-border w-auto min-w-[80px]">
                <SelectValue placeholder="Fuel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fuel</SelectItem>
                <SelectItem value="petrol">Petrol</SelectItem>
                <SelectItem value="diesel">Diesel</SelectItem>
                <SelectItem value="electric">Electric</SelectItem>
                <SelectItem value="cng">CNG</SelectItem>
              </SelectContent>
            </Select>
            <Select value={transmissionFilter} onValueChange={setTransmissionFilter}>
              <SelectTrigger className="h-8 text-xs rounded-full border-border w-auto min-w-[100px]">
                <SelectValue placeholder="Transmission" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="automatic">Automatic</SelectItem>
              </SelectContent>
            </Select>
            <Select value={vehicleType} onValueChange={setVehicleType}>
              <SelectTrigger className="h-8 text-xs rounded-full border-border w-auto min-w-[80px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="car">Cars</SelectItem>
                <SelectItem value="bike">Bikes</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="h-8 text-xs rounded-full border-border w-auto min-w-[90px]">
                <MapPin className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {availableCities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs rounded-full text-destructive shrink-0">
                <X className="h-3 w-3 mr-1" /> Clear
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - Sidebar + Grid Layout */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar Filters - Desktop Only */}
          <aside className="hidden lg:block w-[280px] shrink-0">
            <div className="sticky top-20 bg-card rounded-2xl border border-border p-5 shadow-sm max-h-[calc(100vh-100px)] overflow-y-auto smooth-scroll">
              <FilterPanel />
            </div>
          </aside>

          {/* Right Content Grid */}
          <div className="flex-1 min-w-0">
            {/* Active Filter Pills */}
            {activeFiltersCount > 0 && (
              <div className="flex gap-2 flex-wrap mb-4">
                {cityFilter !== "all" && (
                  <Badge variant="secondary" className="rounded-full pl-3 pr-2 py-1 gap-1">
                    {cityFilter}
                    <button onClick={() => setCityFilter("all")} className="ml-1 hover:bg-muted rounded-full p-0.5"><X className="h-3 w-3" /></button>
                  </Badge>
                )}
                {vehicleType !== "all" && (
                  <Badge variant="secondary" className="rounded-full pl-3 pr-2 py-1 gap-1 capitalize">
                    {vehicleType}
                    <button onClick={() => setVehicleType("all")} className="ml-1 hover:bg-muted rounded-full p-0.5"><X className="h-3 w-3" /></button>
                  </Badge>
                )}
                {fuelType !== "all" && (
                  <Badge variant="secondary" className="rounded-full pl-3 pr-2 py-1 gap-1 capitalize">
                    {fuelType}
                    <button onClick={() => setFuelType("all")} className="ml-1 hover:bg-muted rounded-full p-0.5"><X className="h-3 w-3" /></button>
                  </Badge>
                )}
                {transmissionFilter !== "all" && (
                  <Badge variant="secondary" className="rounded-full pl-3 pr-2 py-1 gap-1 capitalize">
                    {transmissionFilter}
                    <button onClick={() => setTransmissionFilter("all")} className="ml-1 hover:bg-muted rounded-full p-0.5"><X className="h-3 w-3" /></button>
                  </Badge>
                )}
                {selectedBrands.length > 0 && selectedBrands.map(brand => (
                  <Badge key={brand} variant="secondary" className="rounded-full pl-3 pr-2 py-1 gap-1">
                    {brand}
                    <button onClick={() => toggleBrand(brand)} className="ml-1 hover:bg-muted rounded-full p-0.5"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
                {(priceRange[0] !== 50000 || priceRange[1] !== 7500000) && (
                  <Badge variant="secondary" className="rounded-full pl-3 pr-2 py-1 gap-1">
                    {formatBudget(priceRange[0])} - {formatBudget(priceRange[1])}
                    <button onClick={() => setPriceRange([50000, 7500000])} className="ml-1 hover:bg-muted rounded-full p-0.5"><X className="h-3 w-3" /></button>
                  </Badge>
                )}
              </div>
            )}

            {/* Vehicle Grid - 3 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredVehicles.map((vehicle, index) => (
                <div
                  key={vehicle.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
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

            {/* Empty State */}
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
        </div>
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
