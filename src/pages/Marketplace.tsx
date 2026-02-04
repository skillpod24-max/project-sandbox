import { useState, useMemo, useCallback, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, MapPin, Car, Bike, Truck, Star, CheckCircle, Shield, 
  CreditCard, ChevronRight, Building2, ArrowRight, Heart, Sparkles,
  Menu, X, Play, Award, Users, Clock, TrendingUp, Calculator, GitCompare,
  DollarSign, Tag, Phone, Zap, FileCheck, Headphones, RefreshCw, ThumbsUp,
  ShieldCheck, BadgePercent
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { MarketplaceSkeleton } from "@/components/marketplace/ShimmerSkeleton";
import MarketplaceVehicleCard from "@/components/marketplace/MarketplaceVehicleCard";
import MarketplaceDealerCard from "@/components/marketplace/MarketplaceDealerCard";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import MarketplaceFilters from "@/components/marketplace/MarketplaceFilters";
import CompareBar from "@/components/marketplace/CompareBar";
import LiveSearchSuggestions from "@/components/marketplace/LiveSearchSuggestions";
import AutoShowroomHero from "@/components/marketplace/AutoShowroomHero";
import HeroCarousel from "@/components/marketplace/HeroCarousel";
import LocationSelector from "@/components/marketplace/LocationSelector";
import HighDemandCard from "@/components/marketplace/HighDemandCard";
import useWishlist from "@/hooks/useWishlist";
import useComparison from "@/hooks/useComparison";
import MarketplacePopup from "@/components/marketplace/MarketplacePopup";
import FloatingCTA from "@/components/marketplace/FloatingCTA";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Quick category pills
const CategoryPill = memo(({ icon: Icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all whitespace-nowrap ${
      active 
        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25' 
        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-blue-200'
    }`}
  >
    <Icon className="h-4 w-4" />
    <span className="text-sm font-medium">{label}</span>
  </button>
));
CategoryPill.displayName = "CategoryPill";

// Body type pills for cars
const BodyTypePill = memo(({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
      active 
        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' 
        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-2 border-transparent'
    }`}
  >
    {label}
  </button>
));
BodyTypePill.displayName = "BodyTypePill";

// Fetch marketplace data function
const fetchMarketplaceData = async () => {
  // Fetch dealers with marketplace enabled
  const { data: dealersData } = await supabase
    .from("settings")
    .select("*")
    .eq("public_page_enabled", true)
    .eq("marketplace_enabled", true);

  const dealers = dealersData || [];
  const dealerIds = dealers.map(d => d.user_id);

  let vehicles: any[] = [];
  let testimonials: any[] = [];
  let salesCount: Record<string, number> = {};

  if (dealerIds.length > 0) {
    // Fetch vehicles from marketplace-enabled dealers
    const { data: vehiclesData } = await supabase
      .from("vehicles")
      .select("*")
      .eq("is_public", true)
      .in("user_id", dealerIds)
      .eq("status", "in_stock");

    // Fetch ALL images for vehicles (not just primary)
    const vehicleIds = (vehiclesData || []).map(v => v.id);
    const { data: imagesData } = await supabase
      .from("vehicle_images")
      .select("*")
      .in("vehicle_id", vehicleIds);

    // Create image map - prefer primary, otherwise use first available
    const imageMap: Record<string, string> = {};
    (imagesData || []).forEach(img => {
      if (!imageMap[img.vehicle_id] || img.is_primary) {
        imageMap[img.vehicle_id] = img.image_url;
      }
    });

    vehicles = (vehiclesData || []).map(v => ({
      ...v,
      image_url: imageMap[v.id]
    }));

    // Fetch testimonials
    const { data: testimonialsData } = await supabase
      .from("dealer_testimonials")
      .select("*")
      .in("user_id", dealerIds)
      .eq("is_verified", true)
      .order("rating", { ascending: false })
      .limit(10);

    testimonials = testimonialsData || [];

    // Fetch sales count per dealer
    const { data: salesData } = await supabase
      .from("sales")
      .select("user_id")
      .in("user_id", dealerIds)
      .eq("status", "completed");

    (salesData || []).forEach(s => {
      salesCount[s.user_id] = (salesCount[s.user_id] || 0) + 1;
    });
  }

  return { dealers, vehicles, testimonials, salesCount };
};

const Marketplace = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAllVehicles, setShowAllVehicles] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Wishlist and comparison hooks
  const { isInWishlist, toggleWishlist, wishlistCount } = useWishlist();
  const { compareList, isInCompare, toggleCompare, removeFromCompare, clearCompare } = useComparison();

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [vehicleType, setVehicleType] = useState<string>("car");
  const [bodyType, setBodyType] = useState<string>("all");
  const [fuelType, setFuelType] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");

  // Body types for cars
  const carBodyTypes = ["All", "Sedan", "Hatchback", "SUV", "MUV", "Luxury", "Compact SUV"];

  // Use React Query for data fetching with caching
  const { data, isLoading: loading } = useQuery({
    queryKey: ['marketplace-data'],
    queryFn: fetchMarketplaceData,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    gcTime: 1000 * 60 * 10, // 10 minutes garbage collection
  });

  const vehicles = data?.vehicles || [];
  const dealers = data?.dealers || [];
  const testimonials = data?.testimonials || [];
  const salesCount = data?.salesCount || {};

  // Get unique cities from dealers
  const availableCities = useMemo(() => {
    const cities = dealers
      .map(d => {
        const parts = (d.dealer_address || "").split(",");
        return parts.length >= 2 ? parts[parts.length - 2]?.trim() : null;
      })
      .filter(Boolean);
    return [...new Set(cities)];
  }, [dealers]);

  const getDealerForVehicle = useCallback((userId: string) => {
    return dealers.find(d => d.user_id === userId);
  }, [dealers]);

  const getDealerRating = useCallback((userId: string) => {
    const dealerTestimonials = testimonials.filter(t => t.user_id === userId);
    if (dealerTestimonials.length === 0) return 4.5;
    return dealerTestimonials.reduce((sum, t) => sum + t.rating, 0) / dealerTestimonials.length;
  }, [testimonials]);

  const getDealerVehicleCount = useCallback((userId: string) => {
    return vehicles.filter(v => v.user_id === userId).length;
  }, [vehicles]);

  const getDealerCity = useCallback((userId: string) => {
    const dealer = dealers.find(d => d.user_id === userId);
    if (!dealer?.dealer_address) return null;
    const parts = dealer.dealer_address.split(",");
    return parts.length >= 2 ? parts[parts.length - 2]?.trim() : null;
  }, [dealers]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchesSearch = !searchTerm || 
        `${v.brand} ${v.model} ${v.variant || ""}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = vehicleType === "all" || v.vehicle_type === vehicleType;
      const matchesFuel = fuelType === "all" || v.fuel_type === fuelType;
      
      // City filter
      const matchesCity = cityFilter === "all" || getDealerCity(v.user_id) === cityFilter;
      
      // Body type matching for cars
      let matchesBody = true;
      if (vehicleType === "car" && bodyType !== "all") {
        const variant = (v.variant || "").toLowerCase();
        const model = (v.model || "").toLowerCase();
        const combined = `${variant} ${model}`;
        
        switch (bodyType.toLowerCase()) {
          case "sedan":
            matchesBody = combined.includes("sedan") || ["city", "verna", "ciaz", "amaze", "dzire", "slavia", "virtus"].some(m => model.includes(m));
            break;
          case "hatchback":
            matchesBody = combined.includes("hatchback") || ["i20", "swift", "baleno", "polo", "jazz", "altroz", "glanza", "tiago"].some(m => model.includes(m));
            break;
          case "suv":
            matchesBody = combined.includes("suv") || ["creta", "seltos", "harrier", "safari", "xuv", "scorpio", "fortuner", "endeavour"].some(m => model.includes(m));
            break;
          case "muv":
            matchesBody = combined.includes("muv") || ["innova", "ertiga", "carens", "marazzo", "xl6"].some(m => model.includes(m));
            break;
          case "compact suv":
            matchesBody = ["venue", "sonet", "nexon", "brezza", "punch", "magnite", "kiger", "exter"].some(m => model.includes(m));
            break;
          case "luxury":
            matchesBody = ["bmw", "mercedes", "audi", "lexus", "volvo", "jaguar", "land rover", "porsche"].some(b => (v.brand || "").toLowerCase().includes(b));
            break;
        }
      }
      
      let matchesPrice = true;
      if (priceRange !== "all") {
        const [min, max] = priceRange.split("-").map(Number);
        matchesPrice = v.selling_price >= min && (!max || v.selling_price <= max);
      }
      
      return matchesSearch && matchesType && matchesFuel && matchesPrice && matchesBody && matchesCity;
    });
  }, [vehicles, searchTerm, vehicleType, fuelType, priceRange, bodyType, cityFilter, getDealerCity]);

  // Featured dealers (admin controlled - show only 4-5)
  const topDealers = useMemo(() => {
    return dealers
      .map(d => ({
        ...d,
        rating: getDealerRating(d.user_id),
        vehicleCount: getDealerVehicleCount(d.user_id)
      }))
      .sort((a, b) => {
        // Featured first
        if (a.marketplace_featured && !b.marketplace_featured) return -1;
        if (!a.marketplace_featured && b.marketplace_featured) return 1;
        return b.rating - a.rating;
      })
      .slice(0, 5); // Show only 4-5 dealers
  }, [dealers, getDealerRating, getDealerVehicleCount]);

  // High demand vehicles (show only 4)
  const highDemandVehicles = useMemo(() => {
    // Sort by featured/marketplace_status first, then by price
    return [...vehicles]
      .sort((a, b) => {
        if (a.marketplace_status === 'featured' && b.marketplace_status !== 'featured') return -1;
        if (a.marketplace_status !== 'featured' && b.marketplace_status === 'featured') return 1;
        return (b.selling_price || 0) - (a.selling_price || 0);
      })
      .slice(0, 4); // Show only 3-4 vehicles
  }, [vehicles]);

  // Get compare vehicles data
  const compareVehicles = useMemo(() => {
    return vehicles.filter(v => compareList.includes(v.id));
  }, [vehicles, compareList]);

  // Limit vehicles shown initially - admin controlled (default 6)
  const vehiclesPerPage = 6;
  const displayedVehicles = showAllVehicles ? filteredVehicles : filteredVehicles.slice(0, vehiclesPerPage);

  if (loading) {
    return <MarketplaceSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation - Blue Theme */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Car className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-slate-900">VahanHub</span>
              </div>
            </Link>

            {/* Location Selector */}
            <LocationSelector
              selectedCity={cityFilter}
              onCityChange={setCityFilter}
              availableCities={availableCities}
            />

            {/* Desktop Search with Live Suggestions */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search vehicles, dealers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  className="pl-12 pr-4 h-11 rounded-full bg-muted border-0 focus-visible:ring-2 focus-visible:ring-primary"
                />
                <LiveSearchSuggestions 
                  vehicles={vehicles}
                  dealers={dealers}
                  searchTerm={searchTerm}
                  onSelect={(term) => { setSearchTerm(term); setSearchFocused(false); }}
                  onClose={() => setSearchFocused(false)}
                  visible={searchFocused}
                />
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-4">
              <a href="#vehicles" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Buy Vehicle
              </a>
              <Link 
                to="/sell-vehicle"
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1"
              >
                <DollarSign className="h-4 w-4" />
                Sell Vehicle
              </Link>
              <a href="#dealers" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Dealers
              </a>
              {wishlistCount > 0 && (
                <Link 
                  to="/marketplace/wishlist" 
                  className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-red-500"
                >
                  <Heart className="h-4 w-4" />
                  <span>{wishlistCount}</span>
                </Link>
              )}
            </nav>

            {/* Mobile menu toggle */}
            <button 
              className="md:hidden p-2 hover:bg-slate-100 rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-100 animate-fade-in">
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-11 rounded-full bg-slate-100 border-0"
                />
              </div>
              <div className="flex flex-col gap-2">
                <a href="#vehicles" className="py-2 text-slate-600 hover:text-blue-600">Buy Vehicle</a>
                <a href="#dealers" className="py-2 text-slate-600 hover:text-blue-600">Dealers</a>
                <Link to="/auth" className="py-2 text-slate-600 hover:text-blue-600">Login</Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section - Animated Carousel with Multiple Banners */}
      <section className="relative h-[280px] md:h-[400px] overflow-hidden">
        <HeroCarousel />
      </section>

      {/* Category Pills - Compact on Mobile */}
      <section className="sticky top-16 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="container mx-auto px-4 py-2 md:py-3">
          {/* Main category pills - smaller on mobile */}
          <div className="flex gap-2 md:gap-3 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => { setVehicleType("car"); setBodyType("all"); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 md:px-5 md:py-2.5 rounded-full transition-all whitespace-nowrap text-xs md:text-sm ${
                vehicleType === "car" 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25' 
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Car className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="font-medium">Cars</span>
            </button>
            <button
              onClick={() => { setVehicleType("bike"); setBodyType("all"); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 md:px-5 md:py-2.5 rounded-full transition-all whitespace-nowrap text-xs md:text-sm ${
                vehicleType === "bike" 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25' 
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Bike className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="font-medium">Bikes</span>
            </button>
            <button
              onClick={() => { setVehicleType("commercial"); setBodyType("all"); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 md:px-5 md:py-2.5 rounded-full transition-all whitespace-nowrap text-xs md:text-sm ${
                vehicleType === "commercial" 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25' 
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Truck className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="font-medium">Commercial</span>
            </button>
          </div>

          {/* Body Type Filter for Cars - Compact on mobile */}
          {vehicleType === "car" && (
            <div className="flex gap-1.5 md:gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
              {carBodyTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setBodyType(type.toLowerCase())}
                  className={`px-2.5 py-1 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                    bodyType === type.toLowerCase() 
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-2 border-transparent'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Top Dealers Section */}
      <section id="dealers" className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
              Top Rated Dealers
            </h2>
            <p className="text-slate-500 text-sm mt-1">Verified & trusted dealers with best ratings</p>
          </div>
          <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1">
            View All <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
          {topDealers.map((dealer) => (
            <MarketplaceDealerCard
              key={dealer.id}
              dealer={dealer}
              vehicleCount={dealer.vehicleCount}
              rating={dealer.rating}
            />
          ))}
          {topDealers.length === 0 && (
            <p className="text-slate-500 py-8 w-full text-center">
              No dealers available on marketplace yet
            </p>
          )}
        </div>
      </section>

      {/* Vehicles in High Demand - 2 per row on mobile, 4 on desktop */}
      <section className="bg-gradient-to-b from-orange-50 to-white py-8 md:py-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <h2 className="text-lg md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                High Demand
              </h2>
              <p className="text-slate-500 text-xs md:text-sm mt-0.5">Most viewed this week</p>
            </div>
            <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 gap-1 text-xs md:text-sm">
              View All <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </div>

          {/* 2 columns on mobile, 4 on desktop - Compact cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {highDemandVehicles.map((vehicle) => (
              <HighDemandCard
                key={vehicle.id}
                vehicle={vehicle}
                dealer={getDealerForVehicle(vehicle.user_id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Cars24-Style Features Strip */}
      <section className="bg-white border-y border-slate-100 py-4 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex gap-6 md:gap-12 overflow-x-auto scrollbar-hide items-center justify-start md:justify-center">
            {[
              { icon: ShieldCheck, text: "150+ Point Inspection", color: "text-blue-600" },
              { icon: RefreshCw, text: "7-Day Return Policy", color: "text-emerald-600" },
              { icon: FileCheck, text: "Fixed Price", color: "text-purple-600" },
              { icon: Headphones, text: "24/7 Support", color: "text-orange-600" },
              { icon: BadgePercent, text: "Best Price Guarantee", color: "text-pink-600" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 shrink-0">
                <item.icon className={`h-5 w-5 ${item.color}`} />
                <span className="text-sm font-medium text-slate-700 whitespace-nowrap">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EMI & Finance Banner */}
      <section className="container mx-auto px-4 py-6">
        <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 border-0 rounded-2xl overflow-hidden">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-white">
              <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Calculator className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Get Easy Finance</h3>
                <p className="text-emerald-100 text-sm">EMI starting from ₹4,999/month • Instant approval</p>
              </div>
            </div>
            <Button className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-full px-6">
              Calculate EMI
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* All Vehicles Section - No Sidebar Filter */}
      <section id="vehicles" className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Browse All {vehicleType === "car" ? "Cars" : vehicleType === "bike" ? "Bikes" : "Vehicles"}
            </h2>
            <p className="text-slate-500 text-sm mt-1">{filteredVehicles.length} vehicles available</p>
          </div>
          
          {/* Inline Filters */}
          <div className="hidden md:flex gap-2">
            {/* City Filter */}
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-36 border-slate-200 rounded-lg">
                <MapPin className="h-4 w-4 mr-1 text-slate-400" />
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {availableCities.map((city) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={fuelType} onValueChange={setFuelType}>
              <SelectTrigger className="w-32 border-slate-200 rounded-lg">
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
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="w-40 border-slate-200 rounded-lg">
                <SelectValue placeholder="Budget" />
              </SelectTrigger>
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

        {/* Vehicle Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {displayedVehicles.map((vehicle) => (
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
          {filteredVehicles.length === 0 && (
            <div className="col-span-full text-center py-16 text-slate-500">
              <Car className="h-20 w-20 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium">No vehicles found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          )}
        </div>

        {/* Load More Button */}
        {filteredVehicles.length > vehiclesPerPage && !showAllVehicles && (
          <div className="text-center mt-8">
            <Button 
              size="lg"
              variant="outline"
              className="rounded-full px-8 border-blue-300 text-blue-600 hover:bg-blue-50"
              onClick={() => setShowAllVehicles(true)}
            >
              View All {filteredVehicles.length} Vehicles
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </section>

      {/* Dealer CTA Section */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 py-16">
        <div className="container mx-auto px-4 text-center text-white">
          <div className="max-w-2xl mx-auto">
            <div className="h-16 w-16 rounded-2xl bg-blue-500/20 backdrop-blur flex items-center justify-center mx-auto mb-6">
              <Building2 className="h-8 w-8 text-blue-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Are You a Dealer?</h2>
            <p className="text-lg opacity-80 mb-8">
              Join 500+ dealers already growing their business with VahanHub
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg rounded-full px-8"
                onClick={() => navigate("/auth")}
              >
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-full px-8">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Value Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Why Choose VahanHub?</h2>
          <p className="text-slate-500">India's fastest growing vehicle marketplace</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { icon: CheckCircle, label: "100% Verified", desc: "Every dealer verified", color: "text-emerald-600 bg-emerald-50" },
            { icon: Shield, label: "Safe Transactions", desc: "Secure payments", color: "text-blue-600 bg-blue-50" },
            { icon: CreditCard, label: "Easy EMI", desc: "Flexible finance", color: "text-purple-600 bg-purple-50" },
            { icon: Award, label: "Best Price", desc: "Guaranteed savings", color: "text-amber-600 bg-amber-50" },
          ].map((item, i) => (
            <Card key={i} className="text-center p-6 border-0 shadow-sm rounded-2xl bg-white hover:shadow-lg transition-shadow group">
              <div className={`h-14 w-14 rounded-xl ${item.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                <item.icon className="h-7 w-7" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{item.label}</h3>
              <p className="text-sm text-slate-500">{item.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Compare Bar */}
      <CompareBar
        vehicles={compareVehicles}
        onRemove={removeFromCompare}
        onClear={clearCompare}
      />


      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 safe-area-inset-bottom">
        <div className="grid grid-cols-4 gap-1 p-2">
          <button 
            onClick={() => document.getElementById('vehicles')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex flex-col items-center py-2 text-muted-foreground hover:text-primary"
          >
            <Car className="h-5 w-5" />
            <span className="text-xs mt-1">Buy</span>
          </button>
          <Link
            to="/sell-vehicle"
            className="flex flex-col items-center py-2 text-emerald-600"
          >
            <Tag className="h-5 w-5" />
            <span className="text-xs mt-1">Sell</span>
          </Link>
          <button 
            onClick={() => document.getElementById('dealers')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex flex-col items-center py-2 text-muted-foreground hover:text-primary"
          >
            <Building2 className="h-5 w-5" />
            <span className="text-xs mt-1">Dealers</span>
          </button>
          <button 
            onClick={() => navigate("/auth")}
            className="flex flex-col items-center py-2 text-muted-foreground hover:text-primary"
          >
            <Users className="h-5 w-5" />
            <span className="text-xs mt-1">Login</span>
          </button>
        </div>
      </div>

      {/* Marketing Popup */}
      <MarketplacePopup />
      
      {/* Floating CTA */}
      <FloatingCTA />

      {/* Footer */}
      <MarketplaceFooter />
    </div>
  );
};

export default Marketplace;
