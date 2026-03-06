import { useState, useMemo, useCallback, useEffect, lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import marutiLogo from "@/assets/brands/maruti-suzuki.png";
import mahindraLogo from "@/assets/brands/mahindra.png";
import hondaLogo from "@/assets/brands/honda.png";
import hyundaiLogo from "@/assets/brands/hyundai.png";
import skodaLogo from "@/assets/brands/skoda.png";
import { Input } from "@/components/ui/input";
import {
  Search, Car, Star, CheckCircle, Shield,
  ChevronRight, Building2, ArrowRight, Heart,
  Calculator, DollarSign, Wrench, Scale, Banknote,
  ShieldCheck, RefreshCw, FileCheck, Headphones, BadgePercent,
  Tag, MapPin, Navigation, Loader2, Store
} from "lucide-react";
import LocationSelector, { MAJOR_CITIES } from "@/components/marketplace/LocationSelector";
import useWishlist from "@/hooks/useWishlist";

// Lazy load heavy / below-fold components
const MarketplaceFooter = lazy(() => import("@/components/marketplace/MarketplaceFooter"));
const MarketplacePopup = lazy(() => import("@/components/marketplace/MarketplacePopup"));
const MarketplaceEMICalculator = lazy(() => import("@/components/marketplace/MarketplaceEMICalculator"));

const serviceCategories = [
  { icon: Car, label: "Buy Used Car", href: "/marketplace/vehicles", color: "text-blue-600", bg: "bg-blue-50", active: true },
  { icon: DollarSign, label: "Sell Car", href: "/sell-vehicle", color: "text-emerald-600", bg: "bg-emerald-50" },
  { icon: Scale, label: "Car Valuation", href: "/sell-vehicle", color: "text-purple-600", bg: "bg-purple-50" },
  { icon: Banknote, label: "Car Loan", href: "#finance", color: "text-amber-600", bg: "bg-amber-50" },
  { icon: Shield, label: "Insurance", href: "#", color: "text-rose-600", bg: "bg-rose-50" },
  { icon: Wrench, label: "Car Services", href: "#", color: "text-cyan-600", bg: "bg-cyan-50" },
];

const popularBrands = [
  { name: "Maruti Suzuki", logo: marutiLogo },
  { name: "Mahindra", logo: mahindraLogo },
  { name: "Honda", logo: hondaLogo },
  { name: "Hyundai", logo: hyundaiLogo },
  { name: "Skoda", logo: skodaLogo },
];

const categoryTabs = [
  { id: "body", label: "Body Type" },
  { id: "budget", label: "Car Budget" },
  { id: "fuel", label: "Fuel Type" },
];

const bodyTypes = [
  { label: "SUV", icon: "🚙" },
  { label: "Hatchback", icon: "🚗" },
  { label: "Sedan", icon: "🏎️" },
  { label: "MUV", icon: "🚐" },
  { label: "Luxury", icon: "✨" },
  { label: "Compact SUV", icon: "🛻" },
];

const budgetRanges = [
  { label: "Under ₹3 Lakh", value: "0-300000", icon: "💰" },
  { label: "₹3-5 Lakh", value: "300000-500000", icon: "💵" },
  { label: "₹5-8 Lakh", value: "500000-800000", icon: "💎" },
  { label: "₹8-12 Lakh", value: "800000-1200000", icon: "🏆" },
  { label: "₹12-20 Lakh", value: "1200000-2000000", icon: "👑" },
  { label: "Above ₹20 Lakh", value: "2000000-99999999", icon: "🌟" },
];

const fuelTypes = [
  { label: "Petrol", value: "petrol", icon: "⛽" },
  { label: "Diesel", value: "diesel", icon: "🛢️" },
  { label: "CNG", value: "cng", icon: "🔋" },
  { label: "Electric", value: "electric", icon: "⚡" },
];

const promoCards = [
  {
    tag: "BUY",
    title: "Drive home your dream car",
    features: ["300 quality checks", "30-day return", "Finance it your way"],
    cta: "View all cars",
    href: "/marketplace/vehicles",
    gradient: "from-blue-600 to-blue-800",
  },
  {
    tag: "SELL",
    title: "Sell your car at the best price",
    features: ["Free valuation", "Instant offer", "Hassle-free process"],
    cta: "Get free quote",
    href: "/sell-vehicle",
    gradient: "from-emerald-600 to-teal-800",
  },
  {
    tag: "FINANCE",
    title: "Make your dreams real with easy EMI",
    features: ["Low interest rates", "Quick disbursal", "Get upto ₹10 Lakhs"],
    cta: "Apply now",
    href: "#finance",
    gradient: "from-indigo-600 to-violet-800",
  },
];

const happyStories = [
  { name: "Rajesh K.", city: "Mumbai", review: "Exchanged my car seamlessly, amazing experience! The team was very professional and guided me through the entire process.", avatar: "R", rating: 5 },
  { name: "Priya S.", city: "Delhi", review: "Smooth buying process, got my dream car within a week! Highly recommend VahanHub to everyone.", avatar: "P", rating: 5 },
  { name: "Suresh M.", city: "Bangalore", review: "Best price for my old car, instant payment received. No hidden charges at all. Great platform!", avatar: "S", rating: 4 },
];

const Marketplace = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [activeCategoryTab, setActiveCategoryTab] = useState("body");
  const [showEMICalculator, setShowEMICalculator] = useState(false);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const { wishlistCount } = useWishlist();

  const availableCities = useMemo(() => MAJOR_CITIES.map(c => c.name), []);

  // Show location popup after 4 seconds
  useEffect(() => {
    const alreadySet = sessionStorage.getItem("marketplace_location_set");
    if (alreadySet) return;
    const timer = setTimeout(() => setShowLocationPopup(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      const params = new URLSearchParams();
      params.set("search", searchTerm.trim());
      if (cityFilter && cityFilter !== "all") params.set("city", cityFilter);
      navigate(`/marketplace/vehicles?${params.toString()}`);
    }
  };

  const handleBrandClick = (brandName: string) => {
    const params = new URLSearchParams();
    params.set("search", brandName);
    if (cityFilter && cityFilter !== "all") params.set("city", cityFilter);
    navigate(`/marketplace/vehicles?${params.toString()}`);
  };

  const handleCategoryClick = (type: string, value: string) => {
    const params = new URLSearchParams();
    if (type === "body") params.set("body", value);
    if (type === "budget") params.set("budget", value);
    if (type === "fuel") params.set("fuel", value);
    if (cityFilter && cityFilter !== "all") params.set("city", cityFilter);
    navigate(`/marketplace/vehicles?${params.toString()}`);
  };

  const handleLocationAllow = () => {
    if (!navigator.geolocation) {
      setShowLocationPopup(false);
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          const nearestMajor = MAJOR_CITIES.reduce((best, c) => {
            const R = 6371;
            const dLat = ((c.lat - latitude) * Math.PI) / 180;
            const dLng = ((c.lng - longitude) * Math.PI) / 180;
            const a = Math.sin(dLat / 2) ** 2 + Math.cos((latitude * Math.PI) / 180) * Math.cos((c.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
            const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return dist < best.dist ? { city: c, dist } : best;
          }, { city: MAJOR_CITIES[0], dist: Infinity });
          setCityFilter(nearestMajor.city.name);
          sessionStorage.setItem("marketplace_location_set", "true");
        } catch {}
        setDetectingLocation(false);
        setShowLocationPopup(false);
      },
      () => {
        setDetectingLocation(false);
        setShowLocationPopup(false);
      },
      { timeout: 10000 }
    );
  };

  const handleLocationSkip = () => {
    setShowLocationPopup(false);
    sessionStorage.setItem("marketplace_location_set", "true");
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 overflow-x-hidden">
      {/* ───── LOCATION POPUP ───── */}
      {showLocationPopup && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[200] animate-fade-in" onClick={handleLocationSkip} />
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-card rounded-3xl shadow-2xl border border-border max-w-sm w-full p-6 md:p-8 text-center">
              <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-5">
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Enable Location</h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Allow location access to find the best cars near you. We'll show vehicles available in your city.
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleLocationAllow}
                  disabled={detectingLocation}
                  className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-600/20"
                >
                  {detectingLocation ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Detecting...</>
                  ) : (
                    <><Navigation className="h-4 w-4 mr-2" /> Allow Location</>
                  )}
                </Button>
                <button
                  onClick={handleLocationSkip}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ───── HEADER ───── */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-3 md:px-4">
          <div className="h-14 md:h-16 flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Car className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <span className="text-lg md:text-xl font-bold text-foreground tracking-tight">VahanHub</span>
            </Link>

            <div className="shrink-0">
              <LocationSelector
                selectedCity={cityFilter}
                onCityChange={setCityFilter}
                availableCities={availableCities}
                onLocationDetected={(lat, lng, city) => setCityFilter(city)}
              />
            </div>

            {/* Desktop Nav - simplified */}
            <nav className="hidden md:flex items-center gap-5">
              <Link to="/marketplace/vehicles" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">Buy Used Car</Link>
              <Link to="/sell-vehicle" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Sell Car</Link>
              <Link to="/marketplace/dealers" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Dealers</Link>
              {wishlistCount > 0 && (
                <Link to="/marketplace/wishlist" className="relative">
                  <Heart className="h-5 w-5 text-muted-foreground hover:text-red-500 transition-colors" />
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">{wishlistCount}</span>
                </Link>
              )}
            </nav>

            {/* Mobile: wishlist only */}
            <div className="flex items-center gap-2 md:hidden">
              {wishlistCount > 0 && (
                <Link to="/marketplace/wishlist" className="relative p-2">
                  <Heart className="h-5 w-5 text-muted-foreground" />
                  <span className="absolute top-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">{wishlistCount}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ───── HERO SECTION ───── */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-white rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-300 rounded-full blur-[80px]" />
        </div>

        <div className="container mx-auto px-4 pt-8 pb-4 md:pt-14 md:pb-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-white leading-tight mb-3">
              India's Most Trusted<br className="hidden sm:block" />
              <span className="text-yellow-300"> Used Car Platform</span>
            </h1>
            <p className="text-blue-100 text-sm md:text-base max-w-lg mx-auto">
              Buy & sell certified pre-owned cars with confidence. 300+ quality checks. 7-day returns.
            </p>
          </div>
        </div>

        {/* Floating card */}
        <div className="container mx-auto px-3 md:px-4 relative z-20 -mb-24 md:-mb-28">
          <div className="bg-card rounded-2xl md:rounded-3xl shadow-2xl border border-border p-4 md:p-8 max-w-4xl mx-auto">
            {/* Service Categories */}
            <div className="flex gap-3 md:gap-6 overflow-x-auto pb-4 scrollbar-hide justify-start md:justify-center -mx-1 px-1">
              {serviceCategories.map((svc) => (
                <Link key={svc.label} to={svc.href} className="flex flex-col items-center gap-1.5 min-w-[56px] md:min-w-[80px] group">
                  <div className={`h-11 w-11 md:h-14 md:w-14 rounded-2xl ${svc.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                    <svc.icon className={`h-5 w-5 md:h-6 md:w-6 ${svc.color}`} />
                  </div>
                  <span className={`text-[9px] md:text-xs font-medium text-center leading-tight ${svc.active ? 'text-blue-600' : 'text-muted-foreground'}`}>
                    {svc.label}
                  </span>
                  {svc.active && <div className="h-0.5 w-8 bg-blue-600 rounded-full" />}
                </Link>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative my-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for your favourite cars..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-12 pr-4 h-12 md:h-14 rounded-xl border-2 border-border focus-visible:border-blue-500 focus-visible:ring-0 text-sm md:text-base bg-muted/30"
              />
            </div>

            {/* 5 Brand Logos + View More */}
            <div className="flex items-center justify-center gap-4 md:gap-6 pt-2">
              {popularBrands.map((brand) => (
                <button
                  key={brand.name}
                  onClick={() => handleBrandClick(brand.name)}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-muted/50 border border-border flex items-center justify-center group-hover:border-blue-300 group-hover:shadow-md transition-all duration-200 overflow-hidden">
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="w-7 h-7 md:w-9 md:h-9 object-contain"
                      loading="eager"
                      onError={(e) => {
                        const el = e.target as HTMLImageElement;
                        el.style.display = 'none';
                        el.parentElement!.innerHTML = `<span class="text-xs font-bold text-muted-foreground">${brand.name.slice(0, 2).toUpperCase()}</span>`;
                      }}
                    />
                  </div>
                  <span className="text-[8px] md:text-[10px] text-muted-foreground group-hover:text-foreground font-medium truncate max-w-[52px] md:max-w-[60px] text-center">{brand.name}</span>
                </button>
              ))}
              <Link to="/marketplace/vehicles" className="flex flex-col items-center gap-1.5">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors">
                  <ArrowRight className="h-5 w-5" />
                </div>
                <span className="text-[8px] md:text-[10px] text-blue-600 font-semibold">View More</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Spacer */}
      <div className="h-28 md:h-32" />

      {/* ───── PROMO CARDS ───── */}
      <section className="container mx-auto px-3 md:px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {promoCards.map((promo) => (
            <Link
              key={promo.tag}
              to={promo.href}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${promo.gradient} p-5 md:p-6 text-white group hover:shadow-xl transition-shadow duration-300`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <span className="text-[10px] font-bold tracking-widest uppercase opacity-70">{promo.tag}</span>
              <h3 className="text-lg md:text-xl font-bold mt-2 mb-3 leading-snug">{promo.title}</h3>
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/80 mb-4">
                {promo.features.map((f, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 shrink-0" />
                    <span className="whitespace-nowrap">{f}</span>
                  </span>
                ))}
              </div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium group-hover:bg-white/30 transition-colors">
                {promo.cta} <ChevronRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ───── CARS BY CATEGORY ───── */}
      <section className="container mx-auto px-3 md:px-4 py-6 md:py-10">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-lg md:text-2xl font-bold text-foreground">Cars by Category</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent" />
        </div>

        <div className="flex gap-2 md:gap-3 mb-6">
          {categoryTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategoryTab(tab.id)}
              className={`px-4 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-medium transition-all border ${
                activeCategoryTab === tab.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                  : 'bg-card text-muted-foreground border-border hover:border-blue-200 hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4">
          {activeCategoryTab === "body" && bodyTypes.map((item) => (
            <button
              key={item.label}
              onClick={() => handleCategoryClick("body", item.label.toLowerCase())}
              className="group flex flex-col items-center gap-2 p-3 md:p-5 rounded-2xl bg-card border border-border hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
            >
              <span className="text-2xl md:text-4xl group-hover:scale-110 transition-transform">{item.icon}</span>
              <span className="text-[10px] md:text-sm font-medium text-muted-foreground group-hover:text-foreground">{item.label}</span>
            </button>
          ))}
          {activeCategoryTab === "budget" && budgetRanges.map((item) => (
            <button
              key={item.label}
              onClick={() => handleCategoryClick("budget", item.value)}
              className="group flex flex-col items-center gap-2 p-3 md:p-5 rounded-2xl bg-card border border-border hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
            >
              <span className="text-2xl md:text-4xl group-hover:scale-110 transition-transform">{item.icon}</span>
              <span className="text-[10px] md:text-sm font-medium text-muted-foreground group-hover:text-foreground text-center">{item.label}</span>
            </button>
          ))}
          {activeCategoryTab === "fuel" && fuelTypes.map((item) => (
            <button
              key={item.label}
              onClick={() => handleCategoryClick("fuel", item.value)}
              className="group flex flex-col items-center gap-2 p-3 md:p-5 rounded-2xl bg-card border border-border hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
            >
              <span className="text-2xl md:text-4xl group-hover:scale-110 transition-transform">{item.icon}</span>
              <span className="text-[10px] md:text-sm font-medium text-muted-foreground group-hover:text-foreground">{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ───── TRUST STRIP ───── */}
      <section className="bg-muted/50 border-y border-border py-5 overflow-hidden">
        <div className="container mx-auto px-3 md:px-4">
          <div className="flex gap-4 md:gap-12 overflow-x-auto scrollbar-hide items-center justify-start md:justify-center">
            {[
              { icon: ShieldCheck, text: "300+ Quality Checks", color: "text-blue-600" },
              { icon: RefreshCw, text: "7-Day Return Policy", color: "text-emerald-600" },
              { icon: FileCheck, text: "Fixed Transparent Price", color: "text-purple-600" },
              { icon: Headphones, text: "Dedicated Support", color: "text-orange-600" },
              { icon: BadgePercent, text: "Best Price Guarantee", color: "text-rose-600" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 shrink-0">
                <div className="h-8 w-8 md:h-9 md:w-9 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
                  <item.icon className={`h-3.5 w-3.5 md:h-4 md:w-4 ${item.color}`} />
                </div>
                <span className="text-[10px] md:text-sm font-medium text-foreground whitespace-nowrap">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── HAPPY STORIES - 3 square cards ───── */}
      <section className="container mx-auto px-3 md:px-4 py-8 md:py-12">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-lg md:text-2xl font-bold text-foreground">
            <span className="text-blue-600">10,000+</span> Happy Drive Stories
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
          {happyStories.map((story, i) => (
            <div
              key={i}
              className="bg-card rounded-2xl border border-border p-5 md:p-7 flex flex-col justify-between min-h-[200px] sm:min-h-[260px] hover:shadow-lg transition-shadow duration-300"
            >
              <div>
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className={`h-4 w-4 ${j < story.rating ? 'text-amber-400 fill-amber-400' : 'text-muted'}`} />
                  ))}
                </div>
                <p className="text-sm md:text-base text-foreground leading-relaxed font-medium mb-4">"{story.review}"</p>
              </div>
              <div className="flex items-center gap-3 mt-auto pt-4 border-t border-border">
                <div className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {story.avatar}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{story.name}</p>
                  <p className="text-xs text-muted-foreground">{story.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───── EMI BANNER ───── */}
      <section className="container mx-auto px-3 md:px-4 py-6 md:py-8" id="finance">
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 md:p-10">
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
            <Button
              className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-full px-8 h-12 font-semibold shadow-lg"
              onClick={() => setShowEMICalculator(true)}
            >
              Calculate EMI <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ───── DEALER CTA - white bg with reviews ───── */}
      <section className="container mx-auto px-3 md:px-4 py-8 md:py-14">
        <div className="bg-card rounded-2xl md:rounded-3xl border border-border shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left - CTA */}
            <div className="p-6 md:p-10 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-xs font-bold tracking-widest uppercase text-blue-600">For Dealers</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Grow Your Business with VahanHub</h2>
              <p className="text-muted-foreground mb-6 text-sm md:text-base leading-relaxed">
                Join 500+ trusted dealers already growing their sales. Free tools, more leads, zero commission. Start your free trial today.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 shadow-lg shadow-blue-600/20" onClick={() => navigate("/auth")}>
                  Start Free Trial
                </Button>
                <Link to="/how-it-works">
                  <Button size="lg" variant="outline" className="rounded-full px-8 border-border hover:bg-muted">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right - Dealer Reviews */}
            <div className="bg-muted/30 p-6 md:p-10 flex flex-col justify-center border-t md:border-t-0 md:border-l border-border">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">Dealer Reviews</h3>
              <div className="space-y-4">
                {[
                  { name: "AutoMax Motors", city: "Mumbai", rating: 5, text: "VahanHub doubled our online leads in just 2 months!" },
                  { name: "Prime Cars", city: "Delhi", rating: 5, text: "Best platform for used car dealers. Highly recommend!" },
                  { name: "Royal Wheels", city: "Bangalore", rating: 4, text: "Easy to manage inventory and connect with genuine buyers." },
                ].map((review, i) => (
                  <div key={i} className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-foreground text-sm">{review.name}</p>
                        <p className="text-xs text-muted-foreground">{review.city}</p>
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} className={`h-3.5 w-3.5 ${j < review.rating ? 'text-amber-400 fill-amber-400' : 'text-muted'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">"{review.text}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── MOBILE BOTTOM NAV ───── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 shadow-lg">
        <div className="grid grid-cols-4 h-16">
          <Link to="/marketplace/vehicles" className="flex flex-col items-center justify-center gap-0.5 text-blue-600">
            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center"><Car className="h-4 w-4" /></div>
            <span className="text-[10px] font-medium">Buy</span>
          </Link>
          <Link to="/sell-vehicle" className="flex flex-col items-center justify-center gap-0.5 text-emerald-600">
            <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center"><Tag className="h-4 w-4" /></div>
            <span className="text-[10px] font-medium">Sell</span>
          </Link>
          <Link to="/marketplace/dealers" className="flex flex-col items-center justify-center gap-0.5 text-purple-600">
            <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center"><Store className="h-4 w-4" /></div>
            <span className="text-[10px] font-medium">Dealers</span>
          </Link>
          <Link to="/marketplace/wishlist" className="flex flex-col items-center justify-center gap-0.5 text-muted-foreground">
            <div className="relative h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <Heart className="h-4 w-4" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">{wishlistCount}</span>
              )}
            </div>
            <span className="text-[10px] font-medium">Wishlist</span>
          </Link>
        </div>
      </div>

      {/* Popups & Overlays - lazy loaded */}
      <Suspense fallback={null}>
        <MarketplacePopup />
        {showEMICalculator && <MarketplaceEMICalculator open={showEMICalculator} onOpenChange={setShowEMICalculator} />}
        <MarketplaceFooter />
      </Suspense>
    </div>
  );
};

export default Marketplace;
