import { useState, useMemo, useCallback, memo, useEffect } from "react";
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
import { formatCurrency, formatIndianNumber } from "@/lib/formatters";
import { MarketplaceSkeleton } from "@/components/marketplace/ShimmerSkeleton";
import MarketplaceVehicleCard from "@/components/marketplace/MarketplaceVehicleCard";
import MarketplaceDealerCard from "@/components/marketplace/MarketplaceDealerCard";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import MarketplaceFilters from "@/components/marketplace/MarketplaceFilters";
import CompareBar from "@/components/marketplace/CompareBar";
import LiveSearchSuggestions from "@/components/marketplace/LiveSearchSuggestions";
import AutoShowroomHero from "@/components/marketplace/AutoShowroomHero";
import HeroCarousel from "@/components/marketplace/HeroCarousel";
import LocationSelector, { MAJOR_CITIES, getDistanceKm, findNearestMajorCity } from "@/components/marketplace/LocationSelector";
import HighDemandCard from "@/components/marketplace/HighDemandCard";
import RecentlyViewedSection from "@/components/marketplace/RecentlyViewedSection";
import OffersDealsSection from "@/components/marketplace/OffersDealsSection";
import useWishlist from "@/hooks/useWishlist";
import useComparison from "@/hooks/useComparison";
import useRecentlyViewed from "@/hooks/useRecentlyViewed";
import MarketplacePopup from "@/components/marketplace/MarketplacePopup";
import FloatingCTA from "@/components/marketplace/FloatingCTA";
import MarketplaceEMICalculator from "@/components/marketplace/MarketplaceEMICalculator";
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

// Fetch marketplace data function - all queries in parallel
const fetchMarketplaceData = async () => {
  // Step 1: Fetch dealers first (needed for subsequent queries)
  const { data: dealersData } = await supabase
    .from("settings")
    .select("id,user_id,dealer_name,dealer_address,dealer_phone,dealer_email,shop_logo_url,shop_tagline,whatsapp_number,public_page_id,marketplace_enabled,marketplace_description,marketplace_featured,marketplace_badge,marketplace_working_hours,marketplace_status,marketplace_tagline,google_reviews_rating,google_reviews_count,dealer_tag,gmap_link,show_testimonials,show_ratings,show_vehicles_sold,public_page_theme")
    .eq("public_page_enabled", true)
    .eq("marketplace_enabled", true);

  const dealers = dealersData || [];
  const dealerIds = dealers.map(d => d.user_id);

  if (dealerIds.length === 0) {
    return { dealers, vehicles: [], testimonials: [], salesCount: {} };
  }

  // Step 2: All remaining queries in parallel
  const [vehiclesRes, testimonialsRes, salesRes] = await Promise.all([
    supabase
      .from("vehicles")
      .select("id,user_id,vehicle_type,condition,brand,model,variant,manufacturing_year,color,fuel_type,transmission,registration_number,odometer_reading,selling_price,status,is_public,public_page_id,public_description,public_highlights,public_features,tyre_condition,insurance_expiry,number_of_owners,mileage,seating_capacity,boot_space,image_badge_text,image_badge_color,marketplace_status,strikeout_price")
      .in("user_id", dealerIds)
      .eq("status", "in_stock")
      .in("marketplace_status", ["approved", "featured"]),
    supabase
      .from("dealer_testimonials")
      .select("user_id,rating,customer_name,review")
      .in("user_id", dealerIds)
      .eq("is_verified", true)
      .order("rating", { ascending: false })
      .limit(10),
    supabase
      .from("sales")
      .select("user_id")
      .in("user_id", dealerIds)
      .eq("status", "completed"),
  ]);

  const vehiclesData = vehiclesRes.data || [];
  const vehicleIds = vehiclesData.map(v => v.id);

  // Step 3: Fetch images only for the vehicles we have
  let imageMap: Record<string, string> = {};
  if (vehicleIds.length > 0) {
    const { data: imagesData } = await supabase
      .from("vehicle_images")
      .select("vehicle_id,image_url,is_primary")
      .in("vehicle_id", vehicleIds);

    (imagesData || []).forEach(img => {
      if (!imageMap[img.vehicle_id] || img.is_primary) {
        imageMap[img.vehicle_id] = img.image_url;
      }
    });
  }

  const vehicles = vehiclesData.map(v => ({
    ...v,
    image_url: imageMap[v.id]
  }));

  const salesCount: Record<string, number> = {};
  (salesRes.data || []).forEach(s => {
    salesCount[s.user_id] = (salesCount[s.user_id] || 0) + 1;
  });

  return { dealers, vehicles, testimonials: testimonialsRes.data || [], salesCount };
};

const Marketplace = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAllVehicles, setShowAllVehicles] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Wishlist, comparison, and recently viewed hooks
  const { isInWishlist, toggleWishlist, wishlistCount } = useWishlist();
  const { compareList, isInCompare, toggleCompare, removeFromCompare, clearCompare } = useComparison();
  const { recentlyViewed, clearRecentlyViewed } = useRecentlyViewed();
  const [showEMICalculator, setShowEMICalculator] = useState(false);
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [vehicleType, setVehicleType] = useState<string>("car");
  const [bodyType, setBodyType] = useState<string>("all");
  const [fuelType, setFuelType] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Body types for cars
  const carBodyTypes = ["All", "Sedan", "Hatchback", "SUV", "MUV", "Luxury", "Compact SUV"];

  // Use React Query for data fetching with caching
  const { data, isLoading: loading } = useQuery({
    queryKey: ['marketplace-data'],
    queryFn: fetchMarketplaceData,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: false,
  });

  const vehicles = data?.vehicles || [];
  const dealers = data?.dealers || [];
  const testimonials = data?.testimonials || [];
  const salesCount = data?.salesCount || {};

  // Use major cities only for the dropdown
  const availableCities = useMemo(() => {
    return MAJOR_CITIES.map(c => c.name);
  }, []);

  // Map dealer address to nearest major city for filtering
  const getDealerMajorCity = useCallback((userId: string) => {
    const dealer = dealers.find(d => d.user_id === userId);
    if (!dealer?.dealer_address) return null;
    const parts = dealer.dealer_address.split(",").map((s: string) => s.trim()).filter(Boolean);
    const dealerCity = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
    if (!dealerCity) return null;
    // Match to nearest major city
    const match = MAJOR_CITIES.find(c => 
      c.name.toLowerCase() === dealerCity.toLowerCase() ||
      dealerCity.toLowerCase().includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(dealerCity.toLowerCase())
    );
    return match?.name || null;
  }, [dealers]);

  const getDealerForVehicle = useCallback((userId: string) => {
    return dealers.find(d => d.user_id === userId);
  }, [dealers]);

  const getDealerRating = useCallback((userId: string) => {
    const dealerTestimonials = testimonials.filter(t => t.user_id === userId);
    if (dealerTestimonials.length === 0) return 0;
    return dealerTestimonials.reduce((sum, t) => sum + t.rating, 0) / dealerTestimonials.length;
  }, [testimonials]);

  const getDealerVehicleCount = useCallback((userId: string) => {
    return vehicles.filter(v => v.user_id === userId).length;
  }, [vehicles]);



  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchesSearch = !searchTerm || 
        `${v.brand} ${v.model} ${v.variant || ""}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = vehicleType === "all" || v.vehicle_type === vehicleType;
      const matchesFuel = fuelType === "all" || v.fuel_type === fuelType;
      
      // City filter - match within 100km radius
      let matchesCity = true;
      if (cityFilter !== "all") {
        const selectedMajor = MAJOR_CITIES.find(c => c.name === cityFilter);
        const dealerMajor = getDealerMajorCity(v.user_id);
        if (selectedMajor && dealerMajor) {
          const dealerCoords = MAJOR_CITIES.find(c => c.name === dealerMajor);
          if (dealerCoords) {
            matchesCity = getDistanceKm(selectedMajor.lat, selectedMajor.lng, dealerCoords.lat, dealerCoords.lng) <= 100;
          } else {
            matchesCity = false;
          }
        } else {
          matchesCity = false;
        }
      }
      
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
  }, [vehicles, searchTerm, vehicleType, fuelType, priceRange, bodyType, cityFilter, getDealerMajorCity]);

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

  // Featured vehicles - only marketplace_status=featured, max 6 (2 per row, 3 rows)
  const featuredVehicles = useMemo(() => {
    return [...vehicles]
      .filter(v => v.marketplace_status === 'featured')
      .slice(0, 6);
  }, [vehicles]);

  // High demand vehicles (show only 4) - non-featured popular ones
  const highDemandVehicles = useMemo(() => {
    return [...vehicles]
      .filter(v => v.marketplace_status !== 'featured')
      .sort((a, b) => (b.selling_price || 0) - (a.selling_price || 0))
      .slice(0, 4);
  }, [vehicles]);

  // Get compare vehicles data
  const compareVehicles = useMemo(() => {
    return vehicles.filter(v => compareList.includes(v.id));
  }, [vehicles, compareList]);

  // Get recently viewed vehicles data
  const recentlyViewedVehicles = useMemo(() => {
    return recentlyViewed
      .map(id => vehicles.find(v => v.id === id))
      .filter(Boolean);
  }, [recentlyViewed, vehicles]);

  // Limit vehicles shown initially - admin controlled (default 6)
  const vehiclesPerPage = 6;
  const displayedVehicles = showAllVehicles ? filteredVehicles : filteredVehicles.slice(0, vehiclesPerPage);

  // Brand logos data
  const popularBrands = useMemo(() => [
    { name: "Maruti Suzuki", logo: "https://www.carlogos.org/car-logos/maruti-suzuki-logo.png" },
    { name: "Hyundai", logo: "https://www.carlogos.org/car-logos/hyundai-logo.png" },
    { name: "Tata", logo: "https://www.carlogos.org/car-logos/tata-logo.png" },
    { name: "Mahindra", logo: "https://www.carlogos.org/car-logos/mahindra-logo.png" },
    { name: "Kia", logo: "https://www.carlogos.org/car-logos/kia-logo.png" },
    { name: "Toyota", logo: "https://www.carlogos.org/car-logos/toyota-logo.png" },
    { name: "Honda", logo: "https://www.carlogos.org/car-logos/honda-logo.png" },
    { name: "BMW", logo: "https://www.carlogos.org/car-logos/bmw-logo.png" },
    { name: "Mercedes-Benz", logo: "https://www.carlogos.org/car-logos/mercedes-benz-logo.png" },
    { name: "Audi", logo: "https://www.carlogos.org/car-logos/audi-logo.png" },
    { name: "Volkswagen", logo: "https://www.carlogos.org/car-logos/volkswagen-logo.png" },
    { name: "Skoda", logo: "https://www.carlogos.org/car-logos/skoda-logo.png" },
  ], []);

  if (loading) {
    return <MarketplaceSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 overflow-x-hidden">
      {/* ───── HEADER ───── */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-3 md:px-4">
          <div className="h-14 md:h-16 flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Car className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <span className="text-lg md:text-xl font-bold text-foreground hidden sm:inline tracking-tight">VahanHub</span>
            </Link>

            <div className="shrink-0">
              <LocationSelector
                selectedCity={cityFilter}
                onCityChange={setCityFilter}
                availableCities={availableCities}
                onLocationDetected={(lat, lng, city) => { setUserCoords({ lat, lng }); setCityFilter(city); }}
              />
            </div>

            {/* Desktop Search */}
            <div className="hidden md:flex flex-1 max-w-xl mx-6">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search by brand, model or dealer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && searchTerm.trim()) { navigate(`/marketplace/vehicles?search=${encodeURIComponent(searchTerm.trim())}`); setSearchFocused(false); } }}
                  className="pl-12 pr-4 h-11 rounded-full bg-muted border-0 focus-visible:ring-2 focus-visible:ring-blue-500"
                />
                <LiveSearchSuggestions vehicles={vehicles} dealers={dealers} searchTerm={searchTerm} onSelect={(term) => { setSearchTerm(term); setSearchFocused(false); }} onClose={() => setSearchFocused(false)} visible={searchFocused} />
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-4">
              <a href="#vehicles" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Buy</a>
              <Link to="/sell-vehicle" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1">
                <DollarSign className="h-4 w-4" /> Sell
              </Link>
              <a href="#dealers" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Dealers</a>
              {wishlistCount > 0 && (
                <Link to="/marketplace/wishlist" className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-red-500">
                  <Heart className="h-4 w-4" /><span>{wishlistCount}</span>
                </Link>
              )}
              <Link to="/auth">
                <Button size="sm" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-5">Login</Button>
              </Link>
            </nav>

            {/* Mobile Actions */}
            <div className="flex items-center gap-2 md:hidden">
              {wishlistCount > 0 && (
                <Link to="/marketplace/wishlist" className="relative p-2 rounded-full bg-muted/50">
                  <Heart className="h-5 w-5 text-muted-foreground" />
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-medium">{wishlistCount}</span>
                </Link>
              )}
              <button className="p-2 rounded-full bg-muted/50" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cars, bikes, dealers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onKeyDown={(e) => { if (e.key === 'Enter' && searchTerm.trim()) { navigate(`/marketplace/vehicles?search=${encodeURIComponent(searchTerm.trim())}`); setSearchFocused(false); } }}
                className="pl-10 pr-4 h-10 rounded-xl bg-muted border-0 text-sm"
              />
              <LiveSearchSuggestions vehicles={vehicles} dealers={dealers} searchTerm={searchTerm} onSelect={(term) => { setSearchTerm(term); setSearchFocused(false); }} onClose={() => setSearchFocused(false)} visible={searchFocused} />
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-3 border-t border-border animate-fade-in">
              <div className="flex flex-col gap-1">
                <a href="#vehicles" className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-muted text-foreground"><Car className="h-5 w-5 text-blue-600" /><span className="font-medium">Buy Vehicle</span></a>
                <Link to="/sell-vehicle" className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-muted text-emerald-600"><DollarSign className="h-5 w-5" /><span className="font-medium">Sell Your Vehicle</span></Link>
                <a href="#dealers" className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-muted text-foreground"><Building2 className="h-5 w-5 text-muted-foreground" /><span className="font-medium">Browse Dealers</span></a>
                <Link to="/auth" className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-muted text-foreground"><Users className="h-5 w-5 text-muted-foreground" /><span className="font-medium">Login / Register</span></Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ───── HERO SECTION ───── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-400 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="container mx-auto px-4 py-10 md:py-20 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white/90 text-xs md:text-sm font-medium px-4 py-2 rounded-full mb-6 border border-white/10">
              <Zap className="h-4 w-4 text-yellow-400" />
              India's Trusted Pre-Owned Vehicle Marketplace
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 leading-tight tracking-tight">
              Find Your <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">Dream Car</span>
            </h1>
            <p className="text-white/60 text-sm md:text-lg mb-8 max-w-xl mx-auto">
              Browse {vehicles.length}+ verified vehicles from {dealers.length}+ trusted dealers. Transparent pricing. Easy EMI.
            </p>

            {/* Hero Stats */}
            <div className="grid grid-cols-3 gap-3 md:gap-6 max-w-lg mx-auto mb-8">
              {[
                { value: `${vehicles.length}+`, label: "Vehicles" },
                { value: `${dealers.length}+`, label: "Dealers" },
                { value: "4.8★", label: "Rating" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-xl md:text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-white/50 text-xs md:text-sm">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Hero CTA */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 px-8 h-12 text-base"
                onClick={() => document.getElementById('vehicles')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Search className="h-5 w-5 mr-2" /> Browse Vehicles
              </Button>
              <Link to="/sell-vehicle">
                <Button size="lg" variant="outline" className="rounded-full border-white/20 text-white bg-white/5 hover:bg-white/10 px-8 h-12 text-base w-full sm:w-auto">
                  <DollarSign className="h-5 w-5 mr-2" /> Sell Your Car
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───── EXPLORE BY BRAND ───── */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg md:text-2xl font-bold text-foreground">Explore by Brand</h2>
            <p className="text-muted-foreground text-xs md:text-sm mt-0.5">Popular brands on VahanHub</p>
          </div>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-3 md:gap-4">
          {popularBrands.map((brand) => (
            <button
              key={brand.name}
              onClick={() => { setSearchTerm(brand.name); document.getElementById('vehicles')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="group flex flex-col items-center gap-2 p-3 md:p-4 rounded-2xl bg-card border border-border hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-300">
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="w-7 h-7 md:w-9 md:h-9 object-contain"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <span className="text-[10px] md:text-xs font-medium text-muted-foreground group-hover:text-foreground truncate w-full text-center transition-colors">{brand.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ───── CATEGORY PILLS (Sticky) ───── */}
      <section className="sticky top-14 md:top-16 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-2.5 md:py-3">
          <div className="flex gap-2 md:gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { type: "car", icon: Car, label: "Cars" },
              { type: "bike", icon: Bike, label: "Bikes" },
              { type: "commercial", icon: Truck, label: "Commercial" },
            ].map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                onClick={() => { setVehicleType(type); setBodyType("all"); }}
                className={`flex items-center gap-1.5 px-4 py-2 md:px-5 md:py-2.5 rounded-full transition-all whitespace-nowrap text-xs md:text-sm font-medium ${
                  vehicleType === type
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
          {vehicleType === "car" && (
            <div className="flex gap-1.5 md:gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
              {carBodyTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setBodyType(type.toLowerCase())}
                  className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                    bodyType === type.toLowerCase()
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-transparent'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ───── FEATURED VEHICLES ───── */}
      {featuredVehicles.length > 0 && (
        <section className="container mx-auto px-3 md:px-4 py-6 md:py-10">
          <div className="flex items-center justify-between mb-5 md:mb-6">
            <div>
              <h2 className="text-lg md:text-2xl font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-amber-500" />
                Featured Vehicles
              </h2>
              <p className="text-muted-foreground text-xs md:text-sm mt-0.5">Handpicked premium picks</p>
            </div>
            <Link to="/marketplace/vehicles">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 gap-1 text-xs md:text-sm">
                View All <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </Link>
          </div>

          {/* Desktop grid */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredVehicles.map((vehicle) => (
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

          {/* Mobile: compact 2-col */}
          <div className="grid grid-cols-2 gap-2.5 md:hidden">
            {featuredVehicles.map((vehicle) => {
              const dealer = getDealerForVehicle(vehicle.user_id);
              const hasDiscount = vehicle.strikeout_price && vehicle.strikeout_price > vehicle.selling_price;
              return (
                <Link key={vehicle.id} to={`/marketplace/vehicle/${vehicle.id}`} className="group block">
                  <Card className="overflow-hidden border-0 shadow-sm rounded-2xl bg-card">
                    <div className="aspect-[4/3] bg-muted overflow-hidden relative">
                      {vehicle.image_url ? (
                        <img src={vehicle.image_url} alt={`${vehicle.brand} ${vehicle.model}`} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Car className="h-8 w-8 text-muted-foreground/30" /></div>
                      )}
                      {vehicle.image_badge_text && (
                        <Badge className="absolute top-1.5 left-1.5 bg-emerald-600 text-white border-0 text-[10px] px-1.5 py-0.5">
                          {vehicle.image_badge_text.length > 12 ? `${vehicle.image_badge_text.slice(0, 12)}…` : vehicle.image_badge_text}
                        </Badge>
                      )}
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(vehicle.id); }}
                        className={`absolute top-1.5 right-1.5 h-7 w-7 rounded-full backdrop-blur-md flex items-center justify-center ${isInWishlist(vehicle.id) ? 'bg-red-500 text-white' : 'bg-white/80 text-muted-foreground'}`}
                      >
                        <Heart className={`h-3.5 w-3.5 ${isInWishlist(vehicle.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    <div className="p-2.5 space-y-1">
                      <h3 className="font-semibold text-foreground text-xs leading-tight line-clamp-1">
                        {vehicle.manufacturing_year} {vehicle.brand} {vehicle.model}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="capitalize">{vehicle.fuel_type}</span>
                        <span>·</span>
                        <span>{vehicle.odometer_reading ? `${formatIndianNumber(vehicle.odometer_reading)} km` : vehicle.transmission}</span>
                      </div>
                      <div>
                        {hasDiscount && <span className="text-[10px] text-muted-foreground line-through block">{formatCurrency(vehicle.strikeout_price)}</span>}
                        <span className="text-sm font-bold text-blue-600">{formatCurrency(vehicle.selling_price)}</span>
                      </div>
                      {dealer && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground pt-0.5">
                          <MapPin className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">{(() => { const p = (dealer.dealer_address || "").split(",").map((s: string) => s.trim()).filter(Boolean); return p.length >= 2 ? p[p.length - 2] : p[0] || ""; })()}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ───── TOP DEALERS ───── */}
      <section id="dealers" className="bg-muted/30 py-6 md:py-10">
        <div className="container mx-auto px-3 md:px-4">
          <div className="flex items-center justify-between mb-5 md:mb-6">
            <div>
              <h2 className="text-lg md:text-2xl font-bold text-foreground flex items-center gap-2">
                <Star className="h-5 w-5 md:h-6 md:w-6 text-amber-500 fill-amber-500" />
                Top Rated Dealers
              </h2>
              <p className="text-muted-foreground text-xs md:text-sm mt-0.5">Verified & trusted partners</p>
            </div>
            <Link to="/marketplace/dealers">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 gap-1 text-xs md:text-sm">
                All Dealers <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
            {topDealers.map((dealer) => (
              <MarketplaceDealerCard key={dealer.id} dealer={dealer} vehicleCount={dealer.vehicleCount} rating={dealer.rating} />
            ))}
            {topDealers.length === 0 && (
              <p className="text-muted-foreground py-8 w-full text-center">No dealers available on marketplace yet</p>
            )}
          </div>
        </div>
      </section>

      {/* ───── HIGH DEMAND ───── */}
      {highDemandVehicles.length > 0 && (
        <section className="container mx-auto px-3 md:px-4 py-6 md:py-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base md:text-2xl font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                High Demand
              </h2>
              <p className="text-muted-foreground text-xs mt-0.5">Most viewed this week</p>
            </div>
            <Link to="/marketplace/vehicles">
              <Button variant="ghost" size="sm" className="text-orange-600 gap-1 text-xs h-8 px-2">View All <ChevronRight className="h-3 w-3" /></Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-4">
            {highDemandVehicles.map((vehicle) => (
              <HighDemandCard key={vehicle.id} vehicle={vehicle} dealer={getDealerForVehicle(vehicle.user_id)} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Viewed */}
      <RecentlyViewedSection vehicles={recentlyViewedVehicles} onClear={clearRecentlyViewed} />

      {/* ───── TRUST STRIP ───── */}
      <section className="bg-card border-y border-border py-4 overflow-hidden">
        <div className="container mx-auto px-3 md:px-4">
          <div className="flex gap-6 md:gap-12 overflow-x-auto scrollbar-hide items-center justify-start md:justify-center">
            {[
              { icon: ShieldCheck, text: "150+ Point Inspection", color: "text-blue-600" },
              { icon: RefreshCw, text: "7-Day Return Policy", color: "text-emerald-600" },
              { icon: FileCheck, text: "Fixed Transparent Price", color: "text-purple-600" },
              { icon: Headphones, text: "Dedicated Support", color: "text-orange-600" },
              { icon: BadgePercent, text: "Best Price Guarantee", color: "text-pink-600" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 shrink-0">
                <div className={`h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0`}>
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <span className="text-xs md:text-sm font-medium text-foreground whitespace-nowrap">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── EMI BANNER ───── */}
      <section className="container mx-auto px-4 py-8 md:py-10">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 md:p-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4 text-white">
              <div className="h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                <Calculator className="h-7 w-7 md:h-8 md:w-8" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold">Easy Vehicle Finance</h3>
                <p className="text-emerald-100 text-sm md:text-base">EMI starting ₹4,999/month • Instant approval • 100% online</p>
              </div>
            </div>
            <Button className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-full px-8 h-12 font-semibold shadow-lg" onClick={() => setShowEMICalculator(true)}>
              Calculate EMI <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ───── ALL VEHICLES ───── */}
      <section id="vehicles" className="container mx-auto px-4 py-8 md:py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">
              Browse All {vehicleType === "car" ? "Cars" : vehicleType === "bike" ? "Bikes" : "Vehicles"}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">{filteredVehicles.length} vehicles available</p>
          </div>
          <div className="hidden md:flex gap-2">
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-36 rounded-lg"><MapPin className="h-4 w-4 mr-1 text-muted-foreground" /><SelectValue placeholder="City" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {availableCities.map((city) => (<SelectItem key={city} value={city}>{city}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={fuelType} onValueChange={setFuelType}>
              <SelectTrigger className="w-32 rounded-lg"><SelectValue placeholder="Fuel" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fuel</SelectItem>
                <SelectItem value="petrol">Petrol</SelectItem>
                <SelectItem value="diesel">Diesel</SelectItem>
                <SelectItem value="electric">Electric</SelectItem>
                <SelectItem value="cng">CNG</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="w-40 rounded-lg"><SelectValue placeholder="Budget" /></SelectTrigger>
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
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <Car className="h-20 w-20 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-lg font-medium">No vehicles found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          )}
        </div>

        {filteredVehicles.length > vehiclesPerPage && !showAllVehicles && (
          <div className="text-center mt-8">
            <Button size="lg" variant="outline" className="rounded-full px-8 border-blue-200 text-blue-600 hover:bg-blue-50" onClick={() => setShowAllVehicles(true)}>
              View All {filteredVehicles.length} Vehicles <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </section>

      {/* ───── WHY VAHANHUB + DEALER CTA ───── */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 py-16 md:py-20">
        <div className="container mx-auto px-4">
          {/* USP Cards */}
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Why Choose VahanHub?</h2>
            <p className="text-white/50 text-sm md:text-base">India's fastest growing vehicle marketplace</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 mb-16">
            {[
              { icon: CheckCircle, label: "100% Verified", desc: "Every dealer verified", gradient: "from-emerald-500 to-green-600" },
              { icon: Shield, label: "Safe Transactions", desc: "Secure payments", gradient: "from-blue-500 to-indigo-600" },
              { icon: CreditCard, label: "Easy EMI", desc: "Flexible finance", gradient: "from-purple-500 to-violet-600" },
              { icon: Award, label: "Best Price", desc: "Guaranteed savings", gradient: "from-amber-500 to-orange-600" },
            ].map((item, i) => (
              <div key={i} className="group text-center p-5 md:p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
                <div className={`h-12 w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className="h-6 w-6 md:h-7 md:w-7 text-white" />
                </div>
                <h3 className="font-semibold text-white text-sm md:text-base mb-1">{item.label}</h3>
                <p className="text-xs text-white/50">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Dealer CTA */}
          <div className="max-w-2xl mx-auto text-center">
            <div className="h-16 w-16 rounded-2xl bg-blue-500/20 backdrop-blur flex items-center justify-center mx-auto mb-6">
              <Building2 className="h-8 w-8 text-blue-400" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Are You a Dealer?</h2>
            <p className="text-white/60 mb-8 text-sm md:text-base">
              Join {dealers.length}+ dealers already growing their business with VahanHub. Free tools, more leads, zero commission.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 shadow-lg shadow-blue-600/30" onClick={() => navigate("/auth")}>
                Start Free Trial
              </Button>
              <Link to="/how-it-works">
                <Button size="lg" variant="outline" className="border-white/20 text-white bg-white/5 hover:bg-white/10 rounded-full px-8 w-full sm:w-auto">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───── COMPARE BAR ───── */}
      <CompareBar vehicles={compareVehicles} onRemove={removeFromCompare} onClear={clearCompare} />

      {/* ───── MOBILE BOTTOM NAV ───── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border z-50">
        <div className="grid grid-cols-3 h-16">
          <button onClick={() => document.getElementById('vehicles')?.scrollIntoView({ behavior: 'smooth' })} className="flex flex-col items-center justify-center gap-0.5 text-blue-600">
            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center"><Car className="h-4 w-4" /></div>
            <span className="text-[10px] font-medium">Buy</span>
          </button>
          <Link to="/sell-vehicle" className="flex flex-col items-center justify-center gap-0.5 text-emerald-600">
            <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center"><Tag className="h-4 w-4" /></div>
            <span className="text-[10px] font-medium">Sell</span>
          </Link>
          <Link to="/marketplace/wishlist" className="flex flex-col items-center justify-center gap-0.5 text-muted-foreground">
            <div className="relative h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <Heart className="h-4 w-4" />
              {wishlistCount > 0 && (<span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">{wishlistCount}</span>)}
            </div>
            <span className="text-[10px] font-medium">Wishlist</span>
          </Link>
        </div>
      </div>

      {/* Popups & Overlays */}
      <MarketplacePopup />
      <FloatingCTA />
      <MarketplaceEMICalculator open={showEMICalculator} onOpenChange={setShowEMICalculator} />
      <MarketplaceFooter />
    </div>
  );
};

export default Marketplace;
