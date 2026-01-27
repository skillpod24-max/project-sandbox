import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, MapPin, Car, Bike, Truck, Star, CheckCircle, Shield, FileText,
  CreditCard, Phone, MessageCircle, ChevronRight, Users, Award, Clock,
  Building2, ArrowRight, Fuel, Gauge, Calendar, Heart, Sparkles, Zap,
  TrendingUp, Menu, X
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import CarLoader from "@/components/CarLoader";

// Memoized Marketplace Vehicle Card - Different from public vehicle card
const MarketplaceVehicleCard = memo(({ vehicle, dealer }: { vehicle: any; dealer: any }) => (
  <Link to={`/marketplace/vehicle/${vehicle.id}`} className="group block">
    <Card className="overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white rounded-2xl">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden">
        {vehicle.image_url ? (
          <img
            src={vehicle.image_url}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car className="h-16 w-16 text-slate-300" />
          </div>
        )}
        {vehicle.image_badge_text && (
          <Badge className="absolute top-3 left-3 bg-blue-600 text-white border-0 shadow-lg">
            {vehicle.image_badge_text}
          </Badge>
        )}
        <button className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white transition-colors shadow-md">
          <Heart className="h-4 w-4 text-slate-400 hover:text-red-500" />
        </button>
        {vehicle.condition === "new" && (
          <Badge className="absolute bottom-3 left-3 bg-emerald-500 text-white border-0">New</Badge>
        )}
      </div>
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-slate-900 line-clamp-1 text-base">
            {vehicle.manufacturing_year} {vehicle.brand} {vehicle.model}
          </h3>
          <p className="text-sm text-slate-500">{vehicle.variant}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full">
            <Gauge className="h-3 w-3" />
            {vehicle.odometer_reading ? `${(vehicle.odometer_reading / 1000).toFixed(0)}K km` : 'N/A'}
          </span>
          <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full">
            <Fuel className="h-3 w-3" />
            {vehicle.fuel_type}
          </span>
          <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full">
            {vehicle.transmission}
          </span>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-blue-600">
              {formatCurrency(vehicle.selling_price)}
            </span>
            {vehicle.strikeout_price && vehicle.strikeout_price > vehicle.selling_price && (
              <span className="text-sm text-slate-400 line-through">
                {formatCurrency(vehicle.strikeout_price)}
              </span>
            )}
          </div>
          {dealer && (
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {dealer.dealer_name}
              <CheckCircle className="h-3 w-3 text-blue-500 ml-1" />
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  </Link>
));
MarketplaceVehicleCard.displayName = "MarketplaceVehicleCard";

// Memoized Marketplace Dealer Card - Different from public dealer card
const MarketplaceDealerCard = memo(({ dealer, vehicleCount, rating }: { dealer: any; vehicleCount: number; rating: number }) => (
  <Link to={`/marketplace/dealer/${dealer.user_id}`} className="block">
    <Card className="p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-white rounded-2xl min-w-[280px] md:min-w-[320px]">
      <div className="flex items-center gap-4">
        {dealer.shop_logo_url ? (
          <img 
            src={dealer.shop_logo_url} 
            alt={dealer.dealer_name} 
            className="h-16 w-16 rounded-xl object-cover border-2 border-blue-100 shadow-sm" 
          />
        ) : (
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
            <Building2 className="h-7 w-7 text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 truncate">{dealer.dealer_name}</h3>
            <CheckCircle className="h-4 w-4 text-blue-500 shrink-0" />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              <span className="font-medium">{rating.toFixed(1)}</span>
            </div>
            <span className="text-slate-300">•</span>
            <span>{vehicleCount} Vehicles</span>
          </div>
          <div className="flex gap-2 mt-2">
            {dealer.marketplace_badge && (
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                {dealer.marketplace_badge}
              </Badge>
            )}
            {dealer.marketplace_featured && (
              <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                <Sparkles className="h-3 w-3 mr-1" /> Featured
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  </Link>
));
MarketplaceDealerCard.displayName = "MarketplaceDealerCard";

// Quick category pills
const CategoryPill = memo(({ icon: Icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl transition-all ${
      active 
        ? 'bg-blue-600 text-white shadow-lg' 
        : 'bg-white text-slate-600 hover:bg-blue-50 border border-slate-200'
    }`}
  >
    <Icon className="h-5 w-5" />
    <span className="text-xs font-medium">{label}</span>
  </button>
));
CategoryPill.displayName = "CategoryPill";

const Marketplace = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [dealers, setDealers] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [salesCount, setSalesCount] = useState<Record<string, number>>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [vehicleType, setVehicleType] = useState<string>("all");
  const [fuelType, setFuelType] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [location, setLocation] = useState("");

  // Banner slides
  const [currentSlide, setCurrentSlide] = useState(0);
  const banners = [
    {
      title: "Buy Verified Used Cars & Bikes",
      subtitle: "From Trusted Dealers Near You",
      cta: "Explore Vehicles",
      gradient: "from-blue-600 via-blue-700 to-indigo-800"
    },
    {
      title: "Dealers Get More Leads",
      subtitle: "Powered by VahanHub Smart Dealer System",
      cta: "List Your Dealership",
      gradient: "from-blue-700 via-indigo-700 to-purple-800"
    },
    {
      title: "EMI | Documentation | Trusted Dealers",
      subtitle: "All in One Place",
      cta: "Check EMI Options",
      gradient: "from-indigo-600 via-blue-700 to-blue-800"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch dealers with marketplace enabled
      const { data: dealersData } = await supabase
        .from("settings")
        .select("*")
        .eq("public_page_enabled", true)
        .eq("marketplace_enabled", true);

      setDealers(dealersData || []);
      const dealerIds = (dealersData || []).map(d => d.user_id);

      if (dealerIds.length > 0) {
        // Fetch vehicles from marketplace-enabled dealers
        const { data: vehiclesData } = await supabase
          .from("vehicles")
          .select("*")
          .eq("is_public", true)
          .in("user_id", dealerIds)
          .eq("status", "in_stock");

        // Fetch images for vehicles
        const vehicleIds = (vehiclesData || []).map(v => v.id);
        const { data: imagesData } = await supabase
          .from("vehicle_images")
          .select("*")
          .in("vehicle_id", vehicleIds)
          .eq("is_primary", true);

        const imageMap = (imagesData || []).reduce((acc: any, img) => {
          acc[img.vehicle_id] = img.image_url;
          return acc;
        }, {});

        setVehicles((vehiclesData || []).map(v => ({
          ...v,
          image_url: imageMap[v.id]
        })));

        // Fetch testimonials
        const { data: testimonialsData } = await supabase
          .from("dealer_testimonials")
          .select("*")
          .in("user_id", dealerIds)
          .eq("is_verified", true)
          .order("rating", { ascending: false })
          .limit(10);

        setTestimonials(testimonialsData || []);

        // Fetch sales count per dealer
        const { data: salesData } = await supabase
          .from("sales")
          .select("user_id")
          .in("user_id", dealerIds)
          .eq("status", "completed");

        const counts: Record<string, number> = {};
        (salesData || []).forEach(s => {
          counts[s.user_id] = (counts[s.user_id] || 0) + 1;
        });
        setSalesCount(counts);
      }
    } catch (error) {
      console.error("Error fetching marketplace data:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchesSearch = !searchTerm || 
        `${v.brand} ${v.model} ${v.variant || ""}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = vehicleType === "all" || v.vehicle_type === vehicleType;
      const matchesFuel = fuelType === "all" || v.fuel_type === fuelType;
      
      let matchesPrice = true;
      if (priceRange !== "all") {
        const [min, max] = priceRange.split("-").map(Number);
        matchesPrice = v.selling_price >= min && (!max || v.selling_price <= max);
      }
      
      return matchesSearch && matchesType && matchesFuel && matchesPrice;
    });
  }, [vehicles, searchTerm, vehicleType, fuelType, priceRange]);

  const topDealers = useMemo(() => {
    return dealers
      .map(d => ({
        ...d,
        rating: getDealerRating(d.user_id),
        vehicleCount: getDealerVehicleCount(d.user_id)
      }))
      .sort((a, b) => {
        // Featured dealers first
        if (a.marketplace_featured && !b.marketplace_featured) return -1;
        if (!a.marketplace_featured && b.marketplace_featured) return 1;
        return b.rating - a.rating;
      })
      .slice(0, 10);
  }, [dealers, getDealerRating, getDealerVehicleCount]);

  const highDemandVehicles = useMemo(() => {
    return [...vehicles]
      .sort((a, b) => (b.selling_price || 0) - (a.selling_price || 0))
      .slice(0, 8);
  }, [vehicles]);

  if (loading) {
    return <CarLoader />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation - Blue & White theme */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">VahanHub</span>
            </Link>

            {/* Desktop Search */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Search cars, bikes, or dealers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 h-11 rounded-full bg-slate-100 border-0 focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <a href="#vehicles" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                Buy Vehicles
              </a>
              <a href="#dealers" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                Dealers
              </a>
              <Button 
                variant="outline" 
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
                onClick={() => navigate("/auth")}
              >
                List Your Vehicles
              </Button>
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
                <a href="#vehicles" className="py-2 text-slate-600 hover:text-blue-600">Buy Vehicles</a>
                <a href="#dealers" className="py-2 text-slate-600 hover:text-blue-600">Dealers</a>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section with Banner Slider */}
      <section className="relative overflow-hidden">
        <div className={`bg-gradient-to-r ${banners[currentSlide].gradient} py-12 md:py-20 transition-all duration-700`}>
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left text-white max-w-xl">
                <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                  {banners[currentSlide].title}
                </h1>
                <p className="text-lg md:text-xl opacity-90 mb-6">
                  {banners[currentSlide].subtitle}
                </p>
                <Button size="lg" className="bg-white text-blue-600 hover:bg-slate-100 shadow-lg gap-2">
                  {banners[currentSlide].cta}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="w-80 h-48 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    <Car className="h-24 w-24 text-white/60" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Banner Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-2 rounded-full transition-all ${
                i === currentSlide ? "w-8 bg-white" : "w-2 bg-white/50"
              }`}
            />
          ))}
        </div>
      </section>

      {/* Quick Search Bar */}
      <section className="container mx-auto px-4 -mt-6 relative z-10">
        <Card className="p-4 md:p-6 shadow-xl border-0 rounded-2xl bg-white">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="col-span-2 md:col-span-1">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10 border-slate-200"
                />
              </div>
            </div>
            <Select value={vehicleType} onValueChange={setVehicleType}>
              <SelectTrigger className="border-slate-200">
                <SelectValue placeholder="Vehicle Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="car">Cars</SelectItem>
                <SelectItem value="bike">Bikes</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Brand"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-slate-200"
            />
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="border-slate-200">
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
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Search className="h-4 w-4" /> Search
            </Button>
          </div>
        </Card>
      </section>

      {/* Category Pills - Mobile */}
      <section className="container mx-auto px-4 py-6">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <CategoryPill 
            icon={Car} 
            label="All" 
            active={vehicleType === "all"} 
            onClick={() => setVehicleType("all")} 
          />
          <CategoryPill 
            icon={Car} 
            label="Buy Car" 
            active={vehicleType === "car"} 
            onClick={() => setVehicleType("car")} 
          />
          <CategoryPill 
            icon={Bike} 
            label="Buy Bike" 
            active={vehicleType === "bike"} 
            onClick={() => setVehicleType("bike")} 
          />
          <CategoryPill 
            icon={Truck} 
            label="Commercial" 
            active={vehicleType === "commercial"} 
            onClick={() => setVehicleType("commercial")} 
          />
          <CategoryPill 
            icon={CreditCard} 
            label="Loans" 
            active={false} 
            onClick={() => {}} 
          />
        </div>
      </section>

      {/* Top Dealers Section */}
      <section id="dealers" className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">⭐ Top Dealers</h2>
            <p className="text-slate-500">Verified & trusted dealers</p>
          </div>
          <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1">
            View All <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
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

      {/* Vehicles in High Demand */}
      <section className="bg-white py-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">🔥 Vehicles in High Demand</h2>
              <p className="text-slate-500">Popular picks from top dealers</p>
            </div>
            <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1">
              View All <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {highDemandVehicles.map((vehicle) => (
              <MarketplaceVehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                dealer={getDealerForVehicle(vehicle.user_id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* All Vehicles Section */}
      <section id="vehicles" className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters Sidebar (Desktop) */}
          <aside className="hidden md:block w-64 shrink-0 space-y-4">
            <Card className="p-5 space-y-5 border-0 shadow-sm rounded-2xl bg-white">
              <h3 className="font-semibold text-slate-900">Filters</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Vehicle Type</label>
                <Select value={vehicleType} onValueChange={setVehicleType}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="car">Cars</SelectItem>
                    <SelectItem value="bike">Bikes</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Fuel Type</label>
                <Select value={fuelType} onValueChange={setFuelType}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="petrol">Petrol</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="electric">Electric</SelectItem>
                    <SelectItem value="cng">CNG</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Price Range</label>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue />
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
            </Card>
          </aside>

          {/* Vehicle Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">All Vehicles ({filteredVehicles.length})</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredVehicles.map((vehicle) => (
                <MarketplaceVehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  dealer={getDealerForVehicle(vehicle.user_id)}
                />
              ))}
              {filteredVehicles.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-500">
                  <Car className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                  <p>No vehicles found matching your criteria</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Dealer CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 py-16">
        <div className="container mx-auto px-4 text-center text-white">
          <div className="max-w-2xl mx-auto">
            <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-6">
              <Building2 className="h-8 w-8" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Are You a Vehicle Dealer?</h2>
            <p className="text-lg opacity-90 mb-8">
              Get More Leads. Close Faster. Manage Everything with VahanHub's Smart Dealer System.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-slate-100 shadow-lg">
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
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
          <p className="text-slate-500">India's most trusted vehicle marketplace</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: CheckCircle, label: "Verified Dealers", desc: "All dealers are verified", color: "text-blue-600 bg-blue-50" },
            { icon: Shield, label: "Transparent Pricing", desc: "No hidden charges", color: "text-emerald-600 bg-emerald-50" },
            { icon: CreditCard, label: "EMI Support", desc: "Easy financing options", color: "text-purple-600 bg-purple-50" },
            { icon: FileText, label: "Secure Enquiries", desc: "Your data is protected", color: "text-amber-600 bg-amber-50" },
          ].map((item, i) => (
            <Card key={i} className="text-center p-6 border-0 shadow-sm rounded-2xl bg-white hover:shadow-md transition-shadow">
              <div className={`h-14 w-14 rounded-xl ${item.color} flex items-center justify-center mx-auto mb-4`}>
                <item.icon className="h-7 w-7" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{item.label}</h3>
              <p className="text-sm text-slate-500">{item.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
                  <Car className="h-6 w-6" />
                </div>
                <span className="text-xl font-bold">VahanHub</span>
              </div>
              <p className="text-sm text-slate-400">
                Where Dealers Manage Better & Buyers Choose Smarter
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Buyers</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#vehicles" className="hover:text-white transition-colors">Browse Vehicles</a></li>
                <li><a href="#dealers" className="hover:text-white transition-colors">Find Dealers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">EMI Calculator</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Dealers</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/auth" className="hover:text-white transition-colors">Dealer Login</Link></li>
                <li><Link to="/auth" className="hover:text-white transition-colors">List Your Dealership</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Support</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-400">
            © {new Date().getFullYear()} VahanHub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Marketplace;
