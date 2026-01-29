import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, MapPin, Phone, MessageCircle, Star, Car, Heart,
  Fuel, Calendar, Gauge, Send, CheckCircle, ChevronLeft, ChevronRight,
  Shield, Award, Building2, Calculator, Share2, Users, Clock, Sparkles,
  Zap, Settings, FileText, Info, Camera, ThumbsUp, Wrench, Navigation
} from "lucide-react";
import { formatCurrency, formatIndianNumber } from "@/lib/formatters";
import { createPublicLead } from "@/lib/leads";
import { trackPublicEvent } from "@/lib/publicAnalytics";
import { VehiclePageSkeleton } from "@/components/marketplace/ShimmerSkeleton";
import MarketplaceEMICalculator from "@/components/marketplace/MarketplaceEMICalculator";
import VehicleValuationCalculator from "@/components/marketplace/VehicleValuationCalculator";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const MarketplaceVehicle = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<any>(null);
  const [dealer, setDealer] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [emiOpen, setEmiOpen] = useState(false);
  const [valuationOpen, setValuationOpen] = useState(false);
  const [enquirySheetOpen, setEnquirySheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  // Form state
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formOpened, setFormOpened] = useState(false);

  useEffect(() => {
    if (vehicleId) fetchVehicle();
  }, [vehicleId]);

  const fetchVehicle = async () => {
    try {
      const { data: vehicleData, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", vehicleId)
        .eq("is_public", true)
        .single();

      if (error || !vehicleData) {
        setLoading(false);
        return;
      }

      setVehicle(vehicleData);

      const { data: dealerData } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", vehicleData.user_id)
        .eq("marketplace_enabled", true)
        .single();

      if (dealerData) {
        setDealer(dealerData);

        await trackPublicEvent({
          eventType: "vehicle_view",
          dealerUserId: vehicleData.user_id,
          publicPageId: "marketplace",
          vehicleId: vehicleData.id
        });
      }

      const { data: imagesData } = await supabase
        .from("vehicle_images")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .order("is_primary", { ascending: false });

      setImages(imagesData || []);
    } catch (error) {
      console.error("Error fetching vehicle:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormFocus = useCallback(() => {
    if (!formOpened && vehicle && dealer) {
      setFormOpened(true);
      trackPublicEvent({
        eventType: "form_opened",
        dealerUserId: vehicle.user_id,
        publicPageId: "marketplace",
        vehicleId: vehicle.id
      });
    }
  }, [formOpened, vehicle, dealer]);

  useEffect(() => {
    return () => {
      if (formOpened && !submitted && vehicle && dealer) {
        trackPublicEvent({
          eventType: "form_abandoned",
          dealerUserId: vehicle.user_id,
          publicPageId: "marketplace",
          vehicleId: vehicle.id
        });
      }
    };
  }, [formOpened, submitted, vehicle, dealer]);

  const handleSubmit = async () => {
    if (!form.name || !form.phone) {
      toast({ title: "Name & phone required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await createPublicLead({
        dealerUserId: vehicle.user_id,
        customerName: form.name,
        phone: form.phone,
        email: form.email || undefined,
        vehicleInterest: `${vehicle.brand} ${vehicle.model}`,
        notes: `[MARKETPLACE] ${form.message || ""}`,
        source: "marketplace",
      });

      await trackPublicEvent({
        eventType: "enquiry_submit",
        dealerUserId: vehicle.user_id,
        publicPageId: "marketplace",
        vehicleId: vehicle.id
      });

      setSubmitted(true);
      setEnquirySheetOpen(false);
      toast({ title: "Enquiry sent successfully!" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsApp = () => {
    if (dealer?.whatsapp_number) {
      const message = encodeURIComponent(
        `Hi, I'm interested in the ${vehicle.manufacturing_year} ${vehicle.brand} ${vehicle.model} listed on VahanHub Marketplace.`
      );
      window.open(`https://wa.me/${dealer.whatsapp_number.replace(/\D/g, "")}?text=${message}`, "_blank");
      
      trackPublicEvent({
        eventType: "cta_whatsapp",
        dealerUserId: vehicle.user_id,
        publicPageId: "marketplace",
        vehicleId: vehicle.id
      });
    }
  };

  const handleCall = () => {
    if (dealer?.dealer_phone) {
      trackPublicEvent({
        eventType: "cta_call",
        dealerUserId: vehicle.user_id,
        publicPageId: "marketplace",
        vehicleId: vehicle.id
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${vehicle.manufacturing_year} ${vehicle.brand} ${vehicle.model}`,
          text: `Check out this ${vehicle.brand} ${vehicle.model} on VahanHub`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied to clipboard!" });
    }
  };

  const getBadgeStyle = () => {
    if (vehicle?.image_badge_color) {
      return { backgroundColor: vehicle.image_badge_color };
    }
    return {};
  };

  if (loading) {
    return <VehiclePageSkeleton />;
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Vehicle Not Found</h2>
          <p className="text-slate-500 mb-4">This vehicle is not available on the marketplace.</p>
          <Button onClick={() => navigate("/")}>Back to Marketplace</Button>
        </Card>
      </div>
    );
  }

  const monthlyEmi = Math.round(vehicle.selling_price / 48);
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - vehicle.manufacturing_year;

  // Overview data for Cars24 style
  const overviewData = [
    { label: "Make Year", value: vehicle.manufacturing_year, icon: Calendar },
    { label: "Registration Year", value: vehicle.manufacturing_year, icon: FileText },
    { label: "Fuel Type", value: vehicle.fuel_type, icon: Fuel },
    { label: "KM Driven", value: vehicle.odometer_reading ? `${formatIndianNumber(vehicle.odometer_reading)} km` : "N/A", icon: Gauge },
    { label: "Transmission", value: vehicle.transmission, icon: Settings },
    { label: "No. of Owners", value: `${vehicle.number_of_owners || 1}${vehicle.number_of_owners === 1 ? 'st' : 'nd'} Owner`, icon: Users },
    { label: "Insurance", value: vehicle.insurance_expiry ? "Valid" : "Check with dealer", icon: Shield },
    { label: "RTO", value: vehicle.registration_number?.slice(0, 4) || "N/A", icon: Navigation },
  ];

  const EnquiryForm = ({ onSubmit, form, setForm, submitting, submitted, onFocus }: any) => (
    submitted ? (
      <div className="text-center py-6">
        <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Enquiry Sent!</h3>
        <p className="text-slate-500 mb-4">The dealer will contact you shortly.</p>
      </div>
    ) : (
      <div className="space-y-3">
        <Input
          placeholder="Your Name *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          onFocus={onFocus}
          className="border-slate-200 rounded-xl h-12"
        />
        <Input
          placeholder="Phone Number *"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          onFocus={onFocus}
          className="border-slate-200 rounded-xl h-12"
        />
        <Input
          placeholder="Email (optional)"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          onFocus={onFocus}
          className="border-slate-200 rounded-xl h-12"
        />
        <Textarea
          placeholder="Message (optional)"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          onFocus={onFocus}
          className="border-slate-200 rounded-xl"
          rows={3}
        />
        <Button 
          onClick={onSubmit} 
          disabled={submitting} 
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl h-12 text-base font-semibold"
        >
          <Send className="h-4 w-4 mr-2" />
          {submitting ? "Sending..." : "Get Best Price"}
        </Button>
      </div>
    )
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24 lg:pb-0">
      {/* Header - Cars24 Style */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium">
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <Car className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-slate-900">VahanHub</span>
          </Link>
          <div className="flex items-center gap-1">
            <button 
              onClick={handleShare}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <Share2 className="h-5 w-5 text-slate-500" />
            </button>
            <button 
              onClick={() => setIsWishlisted(!isWishlisted)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-slate-500'}`} />
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 lg:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-4">
            {/* Image Gallery - Cars24 Style with large hero */}
            <Card className="overflow-hidden border-0 shadow-lg rounded-2xl bg-white">
              <div className="relative aspect-[16/10] md:aspect-[16/9] bg-slate-900">
                {images.length > 0 ? (
                  <>
                    <img
                      src={images[currentImageIndex]?.image_url}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                    {images.length > 1 && (
                      <>
                        <button 
                          onClick={() => setCurrentImageIndex(i => i > 0 ? i - 1 : images.length - 1)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors"
                        >
                          <ChevronLeft className="h-5 w-5 text-slate-700" />
                        </button>
                        <button 
                          onClick={() => setCurrentImageIndex(i => i < images.length - 1 ? i + 1 : 0)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors"
                        >
                          <ChevronRight className="h-5 w-5 text-slate-700" />
                        </button>
                      </>
                    )}
                    
                    {/* Image counter badge */}
                    <div className="absolute bottom-3 right-3 bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5">
                      <Camera className="h-4 w-4" />
                      {currentImageIndex + 1}/{images.length}
                    </div>
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {vehicle.image_badge_text && (
                        <Badge 
                          className="text-white border-0 shadow-lg px-3 py-1 text-xs font-semibold"
                          style={getBadgeStyle()}
                        >
                          {vehicle.image_badge_text}
                        </Badge>
                      )}
                      {vehicleAge <= 1 && (
                        <Badge className="bg-emerald-500 text-white border-0 shadow text-xs">Almost New</Badge>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                    <Car className="h-24 w-24 text-slate-600" />
                  </div>
                )}
              </div>
              
              {/* Thumbnail Strip - Horizontal scroll */}
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide bg-white">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`shrink-0 w-16 h-12 md:w-20 md:h-14 rounded-lg overflow-hidden transition-all ${
                        i === currentImageIndex 
                          ? 'ring-2 ring-blue-500 ring-offset-1' 
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Vehicle Title & Price - Mobile Only */}
            <Card className="p-4 border-0 shadow-sm rounded-2xl lg:hidden">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-lg font-bold text-slate-900 leading-tight">
                    {vehicle.manufacturing_year} {vehicle.brand} {vehicle.model}
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">{vehicle.variant}</p>
                </div>
              </div>
              
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-2xl font-bold text-slate-900">
                  {formatCurrency(vehicle.selling_price)}
                </span>
                {vehicle.strikeout_price && vehicle.strikeout_price > vehicle.selling_price && (
                  <span className="text-base text-slate-400 line-through">
                    {formatCurrency(vehicle.strikeout_price)}
                  </span>
                )}
              </div>
              
              <button 
                onClick={() => setEmiOpen(true)}
                className="mt-3 text-sm text-blue-600 font-medium flex items-center gap-1"
              >
                <Calculator className="h-4 w-4" />
                EMI starts at ₹{formatIndianNumber(monthlyEmi)}/mo
              </button>
            </Card>

            {/* Quick Specs Pills - Cars24 Style */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { icon: Gauge, value: vehicle.odometer_reading ? `${(vehicle.odometer_reading / 1000).toFixed(0)}K km` : "N/A" },
                { icon: Fuel, value: vehicle.fuel_type },
                { icon: Settings, value: vehicle.transmission },
                { icon: Users, value: `${vehicle.number_of_owners || 1} Owner` },
                { icon: Calendar, value: vehicle.manufacturing_year },
              ].map((spec, i) => (
                <div 
                  key={i} 
                  className="shrink-0 flex items-center gap-2 bg-white px-4 py-2.5 rounded-full border border-slate-200 shadow-sm"
                >
                  <spec.icon className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700 capitalize whitespace-nowrap">{spec.value}</span>
                </div>
              ))}
            </div>

            {/* Dealer Card - Cars24 Style */}
            {dealer && (
              <Link to={`/marketplace/dealer/${dealer.user_id}`}>
                <Card className="p-4 border-0 shadow-sm rounded-2xl hover:shadow-md transition-all group bg-white">
                  <div className="flex items-center gap-3">
                    {dealer.shop_logo_url ? (
                      <img src={dealer.shop_logo_url} alt={dealer.dealer_name} className="h-12 w-12 rounded-xl object-cover border border-slate-100" />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 truncate">{dealer.dealer_name}</span>
                        <CheckCircle className="h-4 w-4 text-blue-500 shrink-0" />
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs text-slate-600 font-medium">4.5</span>
                        </div>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-500 truncate">
                          {dealer.dealer_address?.split(",").slice(-2, -1).join("").trim() || "India"}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 shrink-0" />
                  </div>
                </Card>
              </Link>
            )}

            {/* Tabs - Cars24 Style */}
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full justify-start gap-0 rounded-none border-b border-slate-100 bg-transparent h-12 p-0">
                  <TabsTrigger 
                    value="overview" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-4 h-full font-medium"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="features" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-4 h-full font-medium"
                  >
                    Features
                  </TabsTrigger>
                  <TabsTrigger 
                    value="specs" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-4 h-full font-medium"
                  >
                    Specs
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="p-5 mt-0">
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-500" />
                    Car Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {overviewData.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <item.icon className="h-4 w-4 text-slate-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-500">{item.label}</p>
                          <p className="text-sm font-medium text-slate-900 capitalize truncate">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="features" className="p-5 mt-0">
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-500" />
                    Features
                  </h3>
                  {vehicle.public_features && vehicle.public_features.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {vehicle.public_features.map((feature: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">No features listed</p>
                  )}
                </TabsContent>

                <TabsContent value="specs" className="p-5 mt-0">
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-blue-500" />
                    Specifications
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: "Engine", value: vehicle.engine_number ? "Available" : "Contact Dealer" },
                      { label: "Chassis", value: vehicle.chassis_number ? "Available" : "Contact Dealer" },
                      { label: "Mileage", value: vehicle.mileage ? `${vehicle.mileage} kmpl` : "Contact Dealer" },
                      { label: "Color", value: vehicle.color || "Contact Dealer" },
                      { label: "Seating Capacity", value: vehicle.seating_capacity || "Contact Dealer" },
                      { label: "Boot Space", value: vehicle.boot_space || "Contact Dealer" },
                    ].map((spec, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                        <span className="text-sm text-slate-500">{spec.label}</span>
                        <span className="text-sm font-medium text-slate-900 capitalize">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Key Highlights - Cars24 Style */}
            {vehicle.public_highlights && vehicle.public_highlights.length > 0 && (
              <Card className="p-5 border-0 shadow-sm rounded-2xl bg-white">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  Why This Car?
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {vehicle.public_highlights.map((highlight: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3">
                      <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                        <ThumbsUp className="h-4 w-4 text-amber-600" />
                      </div>
                      <p className="text-sm font-medium text-slate-700 leading-snug">{highlight}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Description */}
            {vehicle.public_description && (
              <Card className="p-5 border-0 shadow-sm rounded-2xl bg-white">
                <h3 className="font-semibold text-slate-900 mb-3">About This Vehicle</h3>
                <p className="text-slate-600 text-sm whitespace-pre-line leading-relaxed">{vehicle.public_description}</p>
              </Card>
            )}

            {/* Trust Badges - Mobile */}
            <Card className="p-4 border-0 shadow-sm rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 lg:hidden">
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-1.5">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-xs font-medium text-slate-700">Verified</p>
                </div>
                <div className="text-center">
                  <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-1.5">
                    <FileText className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="text-xs font-medium text-slate-700">Documents</p>
                </div>
                <div className="text-center">
                  <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-1.5">
                    <Wrench className="h-5 w-5 text-amber-600" />
                  </div>
                  <p className="text-xs font-medium text-slate-700">Inspected</p>
                </div>
                <div className="text-center">
                  <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-1.5">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-xs font-medium text-slate-700">24hr Support</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Price & Enquiry (Desktop) */}
          <div className="hidden lg:block space-y-4">
            {/* Price Card - Sticky */}
            <Card className="p-5 border-0 shadow-lg rounded-2xl sticky top-20 bg-white">
              <h1 className="text-xl font-bold text-slate-900 leading-tight">
                {vehicle.manufacturing_year} {vehicle.brand} {vehicle.model}
              </h1>
              <p className="text-slate-500 text-sm mt-1">{vehicle.variant}</p>
              
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-3xl font-bold text-slate-900">
                  {formatCurrency(vehicle.selling_price)}
                </span>
                {vehicle.strikeout_price && vehicle.strikeout_price > vehicle.selling_price && (
                  <span className="text-lg text-slate-400 line-through">
                    {formatCurrency(vehicle.strikeout_price)}
                  </span>
                )}
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl h-11"
                  onClick={() => setEmiOpen(true)}
                >
                  <Calculator className="h-4 w-4" />
                  EMI Calculator
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-xl h-11"
                  onClick={() => setValuationOpen(true)}
                >
                  <Zap className="h-4 w-4" />
                  Valuation
                </Button>
              </div>

              <div className="border-t border-slate-100 mt-5 pt-5">
                <h3 className="font-semibold text-slate-900 mb-1">Interested?</h3>
                <p className="text-sm text-slate-500 mb-4">Share your details for best price</p>
                
                <EnquiryForm 
                  onSubmit={handleSubmit}
                  form={form}
                  setForm={setForm}
                  submitting={submitting}
                  submitted={submitted}
                  onFocus={handleFormFocus}
                />

                {/* Quick Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                  {dealer?.whatsapp_number && (
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 border-emerald-300 text-emerald-600 hover:bg-emerald-50 rounded-xl h-11"
                      onClick={handleWhatsApp}
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </Button>
                  )}
                  {dealer?.dealer_phone && (
                    <a href={`tel:${dealer.dealer_phone}`} className="flex-1" onClick={handleCall}>
                      <Button variant="outline" className="w-full gap-2 rounded-xl h-11">
                        <Phone className="h-4 w-4" />
                        Call Now
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </Card>

            {/* Trust Badges */}
            <Card className="p-4 border-0 shadow-sm rounded-2xl bg-white">
              <div className="space-y-3">
                {[
                  { icon: Shield, color: "blue", text: "Verified by VahanHub" },
                  { icon: CheckCircle, color: "emerald", text: "Complete documentation" },
                  { icon: Wrench, color: "amber", text: "150+ point inspection" },
                  { icon: Clock, color: "purple", text: "24-hour response guarantee" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className={`h-8 w-8 rounded-lg bg-${item.color}-50 flex items-center justify-center`}>
                      <item.icon className={`h-4 w-4 text-${item.color}-600`} />
                    </div>
                    <span className="text-slate-600">{item.text}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Sticky CTA - Cars24 Style */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 lg:hidden z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="container mx-auto flex gap-2">
          {dealer?.dealer_phone && (
            <a href={`tel:${dealer.dealer_phone}`} onClick={handleCall}>
              <Button variant="outline" size="default" className="gap-2 rounded-xl h-12 px-4 border-slate-300">
                <Phone className="h-5 w-5" />
              </Button>
            </a>
          )}
          {dealer?.whatsapp_number && (
            <Button
              size="default"
              className="flex-1 gap-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl h-12"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="h-5 w-5" />
              <span>WhatsApp</span>
            </Button>
          )}
          <Sheet open={enquirySheetOpen} onOpenChange={setEnquirySheetOpen}>
            <SheetTrigger asChild>
              <Button
                size="default"
                className="flex-1 gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl h-12"
              >
                <Send className="h-5 w-5" />
                <span>Get Best Price</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl">
              <SheetHeader className="mb-4">
                <SheetTitle>Get Best Price for This Car</SheetTitle>
              </SheetHeader>
              <EnquiryForm 
                onSubmit={handleSubmit}
                form={form}
                setForm={setForm}
                submitting={submitting}
                submitted={submitted}
                onFocus={handleFormFocus}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* EMI Calculator Dialog */}
      <MarketplaceEMICalculator
        open={emiOpen}
        onOpenChange={setEmiOpen}
        vehiclePrice={vehicle.selling_price}
        vehicleName={`${vehicle.manufacturing_year} ${vehicle.brand} ${vehicle.model}`}
      />

      {/* Valuation Calculator */}
      <VehicleValuationCalculator
        open={valuationOpen}
        onOpenChange={setValuationOpen}
      />

      {/* Footer */}
      <MarketplaceFooter />
    </div>
  );
};

export default MarketplaceVehicle;
