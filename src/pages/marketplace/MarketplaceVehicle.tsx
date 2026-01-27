import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, MapPin, Phone, MessageCircle, Star, Car, Heart,
  Fuel, Calendar, Gauge, Send, CheckCircle, ChevronLeft, ChevronRight,
  Shield, Award, Building2, Calculator, Share2, Users, Clock, Sparkles
} from "lucide-react";
import { formatCurrency, formatIndianNumber } from "@/lib/formatters";
import { createPublicLead } from "@/lib/leads";
import { trackPublicEvent } from "@/lib/publicAnalytics";
import CarLoader from "@/components/CarLoader";
import MarketplaceEMICalculator from "@/components/marketplace/MarketplaceEMICalculator";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
  const [enquirySheetOpen, setEnquirySheetOpen] = useState(false);
  
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
          publicPageId: dealerData.public_page_id || "marketplace",
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
        publicPageId: dealer.public_page_id || "marketplace",
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
          publicPageId: dealer.public_page_id || "marketplace",
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
        publicPageId: dealer?.public_page_id || "marketplace",
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
        publicPageId: dealer.public_page_id || "marketplace",
        vehicleId: vehicle.id
      });
    }
  };

  const handleCall = () => {
    if (dealer?.dealer_phone) {
      trackPublicEvent({
        eventType: "cta_call",
        dealerUserId: vehicle.user_id,
        publicPageId: dealer.public_page_id || "marketplace",
        vehicleId: vehicle.id
      });
    }
  };

  // Get badge style from vehicle
  const getBadgeStyle = () => {
    if (vehicle?.image_badge_color) {
      return { backgroundColor: vehicle.image_badge_color };
    }
    return {};
  };

  if (loading) {
    return <CarLoader />;
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

  // Enquiry Form Component
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
          className="border-slate-200 rounded-xl"
        />
        <Input
          placeholder="Phone Number *"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          onFocus={onFocus}
          className="border-slate-200 rounded-xl"
        />
        <Input
          placeholder="Email (optional)"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          onFocus={onFocus}
          className="border-slate-200 rounded-xl"
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
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl h-12"
        >
          <Send className="h-4 w-4 mr-2" />
          {submitting ? "Sending..." : "Get Best Price"}
        </Button>
      </div>
    )
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24 lg:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <Car className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-slate-900">VahanHub</span>
          </Link>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-slate-100 rounded-full">
              <Share2 className="h-5 w-5 text-slate-400" />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-full">
              <Heart className="h-5 w-5 text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-4">
            {/* Image Gallery - Large Hero */}
            <Card className="overflow-hidden border-0 shadow-lg rounded-2xl">
              <div className="relative aspect-[16/9] md:aspect-[16/10] bg-slate-100">
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
                          className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/95 shadow-xl flex items-center justify-center hover:bg-white transition-colors"
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button 
                          onClick={() => setCurrentImageIndex(i => i < images.length - 1 ? i + 1 : 0)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/95 shadow-xl flex items-center justify-center hover:bg-white transition-colors"
                        >
                          <ChevronRight className="h-6 w-6" />
                        </button>
                        <div className="absolute bottom-4 right-4 bg-black/60 text-white px-4 py-2 rounded-full text-sm font-medium">
                          {currentImageIndex + 1} / {images.length}
                        </div>
                      </>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {vehicle.image_badge_text && (
                        <Badge 
                          className="text-white border-0 shadow-lg px-3 py-1"
                          style={getBadgeStyle()}
                        >
                          {vehicle.image_badge_text}
                        </Badge>
                      )}
                      {vehicle.condition === "new" && (
                        <Badge className="bg-emerald-500 text-white border-0 shadow">New</Badge>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                    <Car className="h-24 w-24 text-slate-300" />
                  </div>
                )}
              </div>
              
              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto scrollbar-hide bg-white">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        i === currentImageIndex ? 'border-blue-600 ring-2 ring-blue-200' : 'border-transparent hover:border-slate-300'
                      }`}
                    >
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Vehicle Title & Price - Mobile */}
            <Card className="p-5 border-0 shadow-sm rounded-2xl lg:hidden">
              <div className="space-y-3">
                <h1 className="text-xl font-bold text-slate-900">
                  {vehicle.manufacturing_year} {vehicle.brand} {vehicle.model}
                </h1>
                <p className="text-slate-500">{vehicle.variant}</p>
                
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-blue-600">
                    {formatCurrency(vehicle.selling_price)}
                  </span>
                  {vehicle.strikeout_price && vehicle.strikeout_price > vehicle.selling_price && (
                    <span className="text-lg text-slate-400 line-through">
                      {formatCurrency(vehicle.strikeout_price)}
                    </span>
                  )}
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full gap-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                  onClick={() => setEmiOpen(true)}
                >
                  <Calculator className="h-4 w-4" />
                  EMI from ₹{formatIndianNumber(monthlyEmi)}/mo
                </Button>
              </div>
            </Card>

            {/* Dealer Badge */}
            {dealer && (
              <Link to={`/marketplace/dealer/${dealer.user_id}`}>
                <Card className="p-4 border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow group">
                  <div className="flex items-center gap-4">
                    {dealer.shop_logo_url ? (
                      <img src={dealer.shop_logo_url} alt={dealer.dealer_name} className="h-14 w-14 rounded-xl object-cover border-2 border-slate-100" />
                    ) : (
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                        <Building2 className="h-7 w-7 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{dealer.dealer_name}</span>
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                        {dealer.marketplace_badge && (
                          <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                            {dealer.marketplace_badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {dealer.dealer_address?.split(",").slice(-2, -1).join("").trim() || "India"}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </Card>
              </Link>
            )}

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
              {[
                { label: "Year", value: vehicle.manufacturing_year, icon: Calendar },
                { label: "Fuel", value: vehicle.fuel_type, icon: Fuel },
                { label: "KM", value: vehicle.odometer_reading ? `${(vehicle.odometer_reading / 1000).toFixed(0)}K` : "N/A", icon: Gauge },
                { label: "Transmission", value: vehicle.transmission?.slice(0, 4), icon: null },
                { label: "Owner", value: `${vehicle.number_of_owners || 1}${vehicle.number_of_owners === 1 ? 'st' : 'nd'}`, icon: Users },
                { label: "Color", value: vehicle.color?.slice(0, 8) || "N/A", icon: null },
              ].map((spec, i) => (
                <Card key={i} className="p-3 border-0 shadow-sm rounded-xl text-center hover:shadow-md transition-shadow">
                  <p className="text-xs text-slate-500 mb-1">{spec.label}</p>
                  <p className="font-semibold text-slate-900 capitalize text-sm">{spec.value}</p>
                </Card>
              ))}
            </div>

            {/* Features */}
            {vehicle.public_features && vehicle.public_features.length > 0 && (
              <Card className="p-5 border-0 shadow-sm rounded-2xl">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  Features
                </h3>
                <div className="flex flex-wrap gap-2">
                  {vehicle.public_features.map((feature: string, i: number) => (
                    <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-700 font-normal px-3 py-1.5">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Highlights - 2 per row */}
            {vehicle.public_highlights && vehicle.public_highlights.length > 0 && (
              <Card className="p-5 border-0 shadow-sm rounded-2xl">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  Key Highlights
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {vehicle.public_highlights.map((highlight: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 bg-amber-50/50 rounded-xl p-3">
                      <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                        <CheckCircle className="h-4 w-4 text-amber-600" />
                      </div>
                      <p className="text-sm font-medium text-slate-700">{highlight}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Description */}
            {vehicle.public_description && (
              <Card className="p-5 border-0 shadow-sm rounded-2xl">
                <h3 className="font-semibold text-slate-900 mb-3">About This Vehicle</h3>
                <p className="text-slate-600 whitespace-pre-line leading-relaxed">{vehicle.public_description}</p>
              </Card>
            )}

            {/* Mobile Enquiry Form */}
            <Card className="p-5 border-0 shadow-sm rounded-2xl lg:hidden">
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
            </Card>
          </div>

          {/* Right Column - Enquiry Form (Desktop) */}
          <div className="hidden lg:block space-y-4">
            {/* Price Card */}
            <Card className="p-5 border-0 shadow-lg rounded-2xl sticky top-20">
              <h1 className="text-xl font-bold text-slate-900 mb-1">
                {vehicle.manufacturing_year} {vehicle.brand} {vehicle.model}
              </h1>
              <p className="text-slate-500 mb-4">{vehicle.variant}</p>
              
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl font-bold text-blue-600">
                  {formatCurrency(vehicle.selling_price)}
                </span>
                {vehicle.strikeout_price && vehicle.strikeout_price > vehicle.selling_price && (
                  <span className="text-lg text-slate-400 line-through">
                    {formatCurrency(vehicle.strikeout_price)}
                  </span>
                )}
              </div>
              
              <Button 
                variant="outline" 
                className="w-full gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 mb-6"
                onClick={() => setEmiOpen(true)}
              >
                <Calculator className="h-4 w-4" />
                Check EMI - ₹{formatIndianNumber(monthlyEmi)}/month
              </Button>

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
                    className="flex-1 gap-2 border-emerald-300 text-emerald-600 hover:bg-emerald-50 rounded-xl"
                    onClick={handleWhatsApp}
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Button>
                )}
                {dealer?.dealer_phone && (
                  <a href={`tel:${dealer.dealer_phone}`} className="flex-1" onClick={handleCall}>
                    <Button variant="outline" className="w-full gap-2 rounded-xl">
                      <Phone className="h-4 w-4" />
                      Call
                    </Button>
                  </a>
                )}
              </div>
            </Card>

            {/* Trust Badges */}
            <Card className="p-4 border-0 shadow-sm rounded-2xl">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-slate-600">Verified by VahanHub</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-slate-600">Complete documentation</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <span className="text-slate-600">24-hour response guarantee</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Sticky CTA - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 lg:hidden z-40">
        <div className="container mx-auto flex gap-2">
          {dealer?.dealer_phone && (
            <a href={`tel:${dealer.dealer_phone}`} onClick={handleCall}>
              <Button variant="outline" size="default" className="gap-2 rounded-xl h-12 px-4">
                <Phone className="h-5 w-5" />
              </Button>
            </a>
          )}
          {dealer?.whatsapp_number && (
            <Button
              size="default"
              className="flex-1 gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl h-12"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="h-5 w-5" />
              <span className="hidden xs:inline">WhatsApp</span>
            </Button>
          )}
          <Sheet open={enquirySheetOpen} onOpenChange={setEnquirySheetOpen}>
            <SheetTrigger asChild>
              <Button
                size="default"
                className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl h-12"
              >
                <Send className="h-5 w-5" />
                <span>Get Quote</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl">
              <SheetHeader className="mb-4">
                <SheetTitle>Get Best Price</SheetTitle>
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

      {/* Footer */}
      <MarketplaceFooter />
    </div>
  );
};

export default MarketplaceVehicle;
