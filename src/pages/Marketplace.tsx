import { useState, useMemo, useCallback, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search, MapPin, Car, Bike, Truck, Star, CheckCircle, Shield,
  CreditCard, ChevronRight, Building2, ArrowRight, Heart,
  Award, Calculator, DollarSign, Phone, Zap, FileCheck,
  Headphones, RefreshCw, ShieldCheck, BadgePercent, Fuel,
  Gauge, IndianRupee, Wrench, FileText, Scale, Banknote,
  CircleDollarSign, HandCoins, Smartphone, Tag
} from "lucide-react";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import LocationSelector, { MAJOR_CITIES } from "@/components/marketplace/LocationSelector";
import useWishlist from "@/hooks/useWishlist";
import MarketplacePopup from "@/components/marketplace/MarketplacePopup";
import FloatingCTA from "@/components/marketplace/FloatingCTA";
import MarketplaceEMICalculator from "@/components/marketplace/MarketplaceEMICalculator";

// Service category items like Cars24
const serviceCategories = [
  { icon: Car, label: "Buy Used Car", href: "/marketplace/vehicles", color: "text-blue-600", bg: "bg-blue-50", active: true },
  { icon: DollarSign, label: "Sell Car", href: "/sell-vehicle", color: "text-emerald-600", bg: "bg-emerald-50" },
  { icon: Scale, label: "Car Valuation", href: "/sell-vehicle", color: "text-purple-600", bg: "bg-purple-50" },
  { icon: Banknote, label: "Car Loan", href: "#finance", color: "text-amber-600", bg: "bg-amber-50" },
  { icon: Shield, label: "Insurance", href: "#", color: "text-rose-600", bg: "bg-rose-50" },
  { icon: Wrench, label: "Car Services", href: "#", color: "text-cyan-600", bg: "bg-cyan-50" },
];

// Brand logos
const popularBrands = [
  { name: "Maruti Suzuki", logo: "https://www.carlogos.org/car-logos/maruti-suzuki-logo.png" },
  { name: "Hyundai", logo: "https://www.carlogos.org/car-logos/hyundai-logo.png" },
  { name: "Tata", logo: "https://www.carlogos.org/car-logos/tata-logo.png" },
  { name: "Honda", logo: "https://www.carlogos.org/car-logos/honda-logo.png" },
  { name: "Mahindra", logo: "https://www.carlogos.org/car-logos/mahindra-logo.png" },
  { name: "Kia", logo: "https://www.carlogos.org/car-logos/kia-logo.png" },
  { name: "Volkswagen", logo: "https://www.carlogos.org/car-logos/volkswagen-logo.png" },
  { name: "Toyota", logo: "https://www.carlogos.org/car-logos/toyota-logo.png" },
];

// Category tabs
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

// Promo cards like Cars24
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

// Happy customer stories
const happyStories = [
  { name: "Rajesh", city: "Mumbai", review: "Exchanged my car seamlessly, amazing experience!", avatar: "R" },
  { name: "Priya", city: "Delhi", review: "Smooth buying process, got my dream car within a week!", avatar: "P" },
  { name: "Suresh", city: "Bangalore", review: "Best price for my old car, instant payment!", avatar: "S" },
  { name: "Anita", city: "Chennai", review: "Finance options made it so easy to upgrade my car!", avatar: "A" },
  { name: "Vikram", city: "Hyderabad", review: "Trusted platform, verified dealers. Highly recommend!", avatar: "V" },
];

const Marketplace = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [activeCategoryTab, setActiveCategoryTab] = useState("body");
  const [showEMICalculator, setShowEMICalculator] = useState(false);
  const { wishlistCount } = useWishlist();

  const availableCities = useMemo(() => MAJOR_CITIES.map(c => c.name), []);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/marketplace/vehicles?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleBrandClick = (brandName: string) => {
    navigate(`/marketplace/vehicles?search=${encodeURIComponent(brandName)}`);
  };

  const handleCategoryClick = (type: string, value: string) => {
    const params = new URLSearchParams();
    if (type === "body") params.set("body", value);
    if (type === "budget") params.set("budget", value);
    if (type === "fuel") params.set("fuel", value);
    navigate(`/marketplace/vehicles?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 overflow-x-hidden">
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

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-5">
              <Link to="/marketplace/vehicles" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">Buy Used Car</Link>
              <Link to="/sell-vehicle" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Sell Car</Link>
              <button onClick={() => setShowEMICalculator(true)} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Car Finance</button>
              <Link to="/marketplace/dealers" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Dealers</Link>
              {wishlistCount > 0 && (
                <Link to="/marketplace/wishlist" className="relative">
                  <Heart className="h-5 w-5 text-muted-foreground hover:text-red-500 transition-colors" />
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">{wishlistCount}</span>
                </Link>
              )}
              <Link to="/auth">
                <Button size="sm" className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-5">
                  <Phone className="h-3.5 w-3.5 mr-1.5" /> Call Us
                </Button>
              </Link>
              <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground">Account</Link>
            </nav>

            {/* Mobile: wishlist + login */}
            <div className="flex items-center gap-2 md:hidden">
              {wishlistCount > 0 && (
                <Link to="/marketplace/wishlist" className="relative p-2">
                  <Heart className="h-5 w-5 text-muted-foreground" />
                  <span className="absolute top-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">{wishlistCount}</span>
                </Link>
              )}
              <Link to="/auth" className="text-xs font-medium text-muted-foreground">Login</Link>
            </div>
          </div>
        </div>
      </header>

      {/* ───── HERO SECTION (Cars24-style blue with search + services + brands) ───── */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 overflow-hidden">
        {/* Subtle pattern overlay */}
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

        {/* Floating card with services + search + brands */}
        <div className="container mx-auto px-3 md:px-4 relative z-20 -mb-24 md:-mb-28">
          <div className="bg-card rounded-2xl md:rounded-3xl shadow-2xl border border-border p-4 md:p-8 max-w-4xl mx-auto">
            {/* Service Categories Row */}
            <div className="flex gap-3 md:gap-6 overflow-x-auto pb-4 scrollbar-hide justify-start md:justify-center -mx-1 px-1">
              {serviceCategories.map((svc) => (
                <Link
                  key={svc.label}
                  to={svc.href}
                  className={`flex flex-col items-center gap-1.5 min-w-[64px] md:min-w-[80px] group ${svc.active ? '' : ''}`}
                >
                  <div className={`h-12 w-12 md:h-14 md:w-14 rounded-2xl ${svc.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                    <svc.icon className={`h-5 w-5 md:h-6 md:w-6 ${svc.color}`} />
                  </div>
                  <span className={`text-[10px] md:text-xs font-medium text-center leading-tight ${svc.active ? 'text-blue-600' : 'text-muted-foreground'}`}>
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

            {/* Brand Logos Row */}
            <div className="flex items-center gap-3 md:gap-5 overflow-x-auto scrollbar-hide pt-2 -mx-1 px-1">
              {popularBrands.map((brand) => (
                <button
                  key={brand.name}
                  onClick={() => handleBrandClick(brand.name)}
                  className="flex flex-col items-center gap-1.5 min-w-[56px] md:min-w-[64px] group shrink-0"
                >
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-muted/50 border border-border flex items-center justify-center group-hover:border-blue-300 group-hover:shadow-md transition-all duration-200">
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="w-6 h-6 md:w-8 md:h-8 object-contain"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                  <span className="text-[9px] md:text-[10px] text-muted-foreground group-hover:text-foreground font-medium truncate max-w-[60px] text-center">{brand.name}</span>
                </button>
              ))}
              <Link
                to="/marketplace/vehicles"
                className="flex flex-col items-center gap-1.5 min-w-[56px] md:min-w-[64px] shrink-0"
              >
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors">
                  <ArrowRight className="h-5 w-5" />
                </div>
                <span className="text-[9px] md:text-[10px] text-orange-600 font-semibold">View all</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Spacer for the floating card */}
      <div className="h-28 md:h-32" />

      {/* ───── PROMO CARDS (Buy / Sell / Finance) ───── */}
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
              <div className="flex items-center gap-3 text-xs text-white/80 mb-4">
                {promo.features.map((f, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 shrink-0" />
                    <span className="whitespace-nowrap">{f}</span>
                    {i < promo.features.length - 1 && <span className="text-white/30 ml-2">|</span>}
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

        {/* Category Tabs */}
        <div className="flex gap-2 md:gap-3 mb-6">
          {categoryTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategoryTab(tab.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all border ${
                activeCategoryTab === tab.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                  : 'bg-card text-muted-foreground border-border hover:border-blue-200 hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category Items */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4">
          {activeCategoryTab === "body" && bodyTypes.map((item) => (
            <button
              key={item.label}
              onClick={() => handleCategoryClick("body", item.label.toLowerCase())}
              className="group flex flex-col items-center gap-2 p-4 md:p-5 rounded-2xl bg-card border border-border hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
            >
              <span className="text-3xl md:text-4xl group-hover:scale-110 transition-transform">{item.icon}</span>
              <span className="text-xs md:text-sm font-medium text-muted-foreground group-hover:text-foreground">{item.label}</span>
            </button>
          ))}
          {activeCategoryTab === "budget" && budgetRanges.map((item) => (
            <button
              key={item.label}
              onClick={() => handleCategoryClick("budget", item.value)}
              className="group flex flex-col items-center gap-2 p-4 md:p-5 rounded-2xl bg-card border border-border hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
            >
              <span className="text-3xl md:text-4xl group-hover:scale-110 transition-transform">{item.icon}</span>
              <span className="text-xs md:text-sm font-medium text-muted-foreground group-hover:text-foreground text-center">{item.label}</span>
            </button>
          ))}
          {activeCategoryTab === "fuel" && fuelTypes.map((item) => (
            <button
              key={item.label}
              onClick={() => handleCategoryClick("fuel", item.value)}
              className="group flex flex-col items-center gap-2 p-4 md:p-5 rounded-2xl bg-card border border-border hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
            >
              <span className="text-3xl md:text-4xl group-hover:scale-110 transition-transform">{item.icon}</span>
              <span className="text-xs md:text-sm font-medium text-muted-foreground group-hover:text-foreground">{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ───── TRUST STRIP ───── */}
      <section className="bg-muted/50 border-y border-border py-5 overflow-hidden">
        <div className="container mx-auto px-3 md:px-4">
          <div className="flex gap-6 md:gap-12 overflow-x-auto scrollbar-hide items-center justify-start md:justify-center">
            {[
              { icon: ShieldCheck, text: "300+ Quality Checks", color: "text-blue-600" },
              { icon: RefreshCw, text: "7-Day Return Policy", color: "text-emerald-600" },
              { icon: FileCheck, text: "Fixed Transparent Price", color: "text-purple-600" },
              { icon: Headphones, text: "Dedicated Support", color: "text-orange-600" },
              { icon: BadgePercent, text: "Best Price Guarantee", color: "text-rose-600" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 shrink-0">
                <div className="h-9 w-9 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <span className="text-xs md:text-sm font-medium text-foreground whitespace-nowrap">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── HAPPY STORIES (Cars24-style) ───── */}
      <section className="container mx-auto px-3 md:px-4 py-8 md:py-12">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-lg md:text-2xl font-bold text-foreground">
            <span className="text-blue-600">10,000+</span> Happy Drive Stories
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent" />
        </div>

        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-3 px-3">
          {happyStories.map((story, i) => (
            <div
              key={i}
              className="min-w-[220px] md:min-w-[260px] bg-card rounded-2xl border border-border p-5 shrink-0 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  {story.avatar}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{story.name}</p>
                  <p className="text-xs text-muted-foreground">{story.city}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">"{story.review}"</p>
              <div className="flex gap-0.5 mt-3">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                ))}
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

      {/* ───── WHY CHOOSE US ───── */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Why Choose VahanHub?</h2>
            <p className="text-white/50 text-sm md:text-base">India's fastest growing vehicle marketplace</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 mb-14">
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
              Join trusted dealers already growing their business with VahanHub. Free tools, more leads, zero commission.
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
          <button onClick={() => setShowEMICalculator(true)} className="flex flex-col items-center justify-center gap-0.5 text-purple-600">
            <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center"><Calculator className="h-4 w-4" /></div>
            <span className="text-[10px] font-medium">EMI</span>
          </button>
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

      {/* Popups & Overlays */}
      <MarketplacePopup />
      <FloatingCTA />
      <MarketplaceEMICalculator open={showEMICalculator} onOpenChange={setShowEMICalculator} />
      <MarketplaceFooter />
    </div>
  );
};

export default Marketplace;
