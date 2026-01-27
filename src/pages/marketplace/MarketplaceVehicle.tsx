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
  Shield, Award, Building2, Info
} from "lucide-react";
import { formatCurrency, formatIndianNumber } from "@/lib/formatters";
import { createPublicLead } from "@/lib/leads";
import { trackPublicEvent } from "@/lib/publicAnalytics";
import CarLoader from "@/components/CarLoader";

const MarketplaceVehicle = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<any>(null);
  const [dealer, setDealer] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
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
      // Fetch vehicle
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

      // Fetch dealer info
      const { data: dealerData } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", vehicleData.user_id)
        .eq("marketplace_enabled", true)
        .single();

      if (dealerData) {
        setDealer(dealerData);

        // Track page view
        await trackPublicEvent({
          eventType: "vehicle_view",
          dealerUserId: vehicleData.user_id,
          publicPageId: dealerData.public_page_id || "marketplace",
          vehicleId: vehicleData.id
        });
      }

      // Fetch images
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

  // Track form opened
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

  // Track form abandoned on unmount
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Car className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-slate-900">VahanHub</span>
          </Link>
          <button className="p-2 hover:bg-slate-100 rounded-full">
            <Heart className="h-5 w-5 text-slate-400" />
          </button>
        </div>
      </header>

      {/* Vehicle Info Header - Mobile */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-4 md:hidden">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge className="bg-white/20 text-white border-0">
            {vehicle.odometer_reading ? `${(vehicle.odometer_reading / 1000).toFixed(0)}K km` : 'N/A'}
          </Badge>
          <span>•</span>
          <span>{vehicle.fuel_type}</span>
          <span>•</span>
          <span>{vehicle.transmission}</span>
          <span>•</span>
          <span>{vehicle.number_of_owners || 1} Owner</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="overflow-hidden border-0 shadow-sm rounded-2xl">
              <div className="relative aspect-[16/10] bg-slate-100">
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
                          className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => setCurrentImageIndex(i => i < images.length - 1 ? i + 1 : 0)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                        <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                          {currentImageIndex + 1}/{images.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className="h-24 w-24 text-slate-300" />
                  </div>
                )}
              </div>
              
              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto scrollbar-hide">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 ${
                        i === currentImageIndex ? 'border-blue-500' : 'border-transparent'
                      }`}
                    >
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Dealer Badge */}
            {dealer && (
              <Link to={`/marketplace/dealer/${dealer.user_id}`}>
                <Card className="p-4 border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    {dealer.shop_logo_url ? (
                      <img src={dealer.shop_logo_url} alt={dealer.dealer_name} className="h-12 w-12 rounded-xl object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{dealer.dealer_name}</span>
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                      </div>
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {dealer.dealer_address?.split(",").slice(-2, -1).join("").trim() || "Location"}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
                </Card>
              </Link>
            )}

            {/* Vehicle Title & Price */}
            <Card className="p-6 border-0 shadow-sm rounded-2xl">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    {vehicle.manufacturing_year} {vehicle.brand} {vehicle.model}
                  </h1>
                  <p className="text-slate-500">{vehicle.variant}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-blue-600">
                      {formatCurrency(vehicle.selling_price)}
                    </span>
                    {vehicle.strikeout_price && vehicle.strikeout_price > vehicle.selling_price && (
                      <span className="text-lg text-slate-400 line-through">
                        {formatCurrency(vehicle.strikeout_price)}
                      </span>
                    )}
                  </div>
                  {vehicle.mileage && (
                    <p className="text-sm text-slate-500 mt-1">
                      EMI starts at ₹{formatIndianNumber(Math.round(vehicle.selling_price / 48))}/mo
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Quick Specs */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { label: "Reg. Year", value: vehicle.manufacturing_year },
                { label: "Fuel", value: vehicle.fuel_type },
                { label: "KM Driven", value: vehicle.odometer_reading ? `${(vehicle.odometer_reading / 1000).toFixed(0)}K` : "N/A" },
                { label: "Transmission", value: vehicle.transmission },
                { label: "Owners", value: `${vehicle.number_of_owners || 1}` },
                { label: "Color", value: vehicle.color || "N/A" },
              ].map((spec, i) => (
                <Card key={i} className="p-3 border-0 shadow-sm rounded-xl text-center">
                  <p className="text-xs text-slate-500">{spec.label}</p>
                  <p className="font-semibold text-slate-900 capitalize">{spec.value}</p>
                </Card>
              ))}
            </div>

            {/* Highlights */}
            {vehicle.public_highlights && vehicle.public_highlights.length > 0 && (
              <Card className="p-6 border-0 shadow-sm rounded-2xl">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Great things about this vehicle
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehicle.public_highlights.map((highlight: string, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                        <CheckCircle className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{highlight}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Description */}
            {vehicle.public_description && (
              <Card className="p-6 border-0 shadow-sm rounded-2xl">
                <h3 className="font-semibold text-slate-900 mb-3">Description</h3>
                <p className="text-slate-600 whitespace-pre-line">{vehicle.public_description}</p>
              </Card>
            )}
          </div>

          {/* Right Column - Enquiry Form */}
          <div className="space-y-4">
            <Card className="p-6 border-0 shadow-sm rounded-2xl sticky top-20">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Enquiry Sent!</h3>
                  <p className="text-slate-500 mb-4">The dealer will contact you shortly.</p>
                  <Button variant="outline" onClick={() => setSubmitted(false)}>
                    Send Another
                  </Button>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">Get Best Price</h3>
                  <p className="text-sm text-slate-500 mb-4">Share your details - dealer will contact you</p>
                  
                  <div className="space-y-3">
                    <Input
                      placeholder="Your Name *"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      onFocus={handleFormFocus}
                      className="border-slate-200"
                    />
                    <Input
                      placeholder="Phone Number *"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      onFocus={handleFormFocus}
                      className="border-slate-200"
                    />
                    <Input
                      placeholder="Email (optional)"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      onFocus={handleFormFocus}
                      className="border-slate-200"
                    />
                    <Textarea
                      placeholder="Message (optional)"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      onFocus={handleFormFocus}
                      className="border-slate-200"
                      rows={3}
                    />
                    <Button 
                      onClick={handleSubmit} 
                      disabled={submitting} 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {submitting ? "Sending..." : "Send Enquiry"}
                    </Button>
                  </div>
                </>
              )}

              {/* Quick Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                {dealer?.whatsapp_number && (
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                    onClick={handleWhatsApp}
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Button>
                )}
                {dealer?.dealer_phone && (
                  <a href={`tel:${dealer.dealer_phone}`} className="flex-1" onClick={handleCall}>
                    <Button variant="outline" className="w-full gap-2">
                      <Phone className="h-4 w-4" />
                      Call
                    </Button>
                  </a>
                )}
              </div>
            </Card>

            {/* Trust Badges */}
            <Card className="p-4 border-0 shadow-sm rounded-2xl">
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="text-slate-600">Verified by VahanHub</span>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 md:hidden z-40">
        <div className="flex gap-3">
          {dealer?.dealer_phone && (
            <a href={`tel:${dealer.dealer_phone}`} onClick={handleCall}>
              <Button variant="outline" size="lg" className="gap-2">
                <Phone className="h-5 w-5" />
              </Button>
            </a>
          )}
          {dealer?.whatsapp_number && (
            <Button
              size="lg"
              className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketplaceVehicle;

// Import sparkles icon
const Sparkles = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);
