import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatIndianNumber } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft, ChevronRight, Phone, Mail, MapPin, Car, Fuel, Calendar,
  Gauge, Settings, Send, CheckCircle, MessageCircle, Star, Award, Sparkles, ArrowLeft,
  Shield, Users, Palette
} from "lucide-react";
import { createPublicLead } from "@/lib/leads";
import CarLoader from "@/components/CarLoader";
import { trackPublicEvent } from "@/lib/publicAnalytics";
import { useScrollTracking } from "@/lib/useScrollTracking";
import { useAutoLeadPopup } from "@/lib/useAutoLeadPopup";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getAccent } from "@/components/catalogue/CatalogueThemeProvider";

const badgeColors: Record<string, string> = {
  emerald: "bg-emerald-600",
  rose: "bg-rose-600",
  amber: "bg-amber-500",
  indigo: "bg-indigo-600",
  blue: "bg-blue-600",
  violet: "bg-violet-600",
  cyan: "bg-cyan-600",
  orange: "bg-orange-600",
};

interface PublicVehicle {
  id: string;
  user_id: string;
  code: string;
  brand: string;
  model: string;
  variant: string | null;
  manufacturing_year: number;
  color: string | null;
  fuel_type: string;
  transmission: string;
  vehicle_type: string;
  condition: string;
  selling_price: number;
  strikeout_price?: number | null;
  odometer_reading: number | null;
  registration_number: string | null;
  engine_number: string | null;
  chassis_number: string | null;
  show_engine_number: boolean;
  show_chassis_number: boolean;
  public_description: string | null;
  public_highlights: string[] | null;
  public_features: string[] | null;
  mileage: number | null;
  tyre_condition: string | null;
  battery_health: string | null;
  number_of_owners: number | null;
  image_badge_text?: string | null;
  image_badge_color?: string | null;
  seating_capacity?: number | null;
  boot_space?: string | null;
}

interface VehicleImage {
  id: string;
  image_url: string;
  is_primary: boolean;
}

interface DealerInfo {
  dealer_name: string | null;
  dealer_phone: string | null;
  dealer_email: string | null;
  dealer_address: string | null;
  whatsapp_number: string | null;
  public_page_id: string | null;
  public_page_theme: string | null;
  catalogue_template: string | null;
  enable_auto_lead_popup?: boolean;
  show_vehicle_page_views?: boolean;
  show_vehicle_page_enquiries?: boolean;
  shop_logo_url?: string | null;
}

const PublicVehiclePage = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vehicle, setVehicle] = useState<PublicVehicle | null>(null);
  const [images, setImages] = useState<VehicleImage[]>([]);
  const [dealer, setDealer] = useState<DealerInfo | null>(null);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [vehicleStats, setVehicleStats] = useState({ views: 0, enquiries: 0 });
  const [enquiryForm, setEnquiryForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [ratingForm, setRatingForm] = useState({ name: "", rating: 5, review: "" });
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const { open, setOpen } = useAutoLeadPopup({
    enabled: dealer?.enable_auto_lead_popup === true,
    scrollPercent: 40,
    onceKey: `vehicle-${vehicle?.id}`,
  });

  useScrollTracking({
    dealerUserId: vehicle?.user_id,
    publicPageId: dealer?.public_page_id || "",
    vehicleId: vehicle?.id,
  });

  // Derive theme from dealer settings
  const template = dealer?.catalogue_template || "classic";
  const accent = getAccent(dealer?.public_page_theme);
  const isPremium = template === "premium";

  const pageBg = isPremium ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-900";
  const cardBg = isPremium ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200";
  const textPrimary = isPremium ? "text-white" : "text-gray-900";
  const textSecondary = isPremium ? "text-gray-400" : "text-gray-600";
  const textMuted = isPremium ? "text-gray-500" : "text-gray-400";
  const inputClasses = isPremium
    ? "bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
    : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400";

  useEffect(() => {
    if (pageId) fetchVehicle();
  }, [pageId]);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  const fetchVehicle = async () => {
    try {
      const { data: vehicleData, error: vehicleError } = await supabase
        .from("vehicles").select("*").eq("public_page_id", pageId).eq("is_public", true).single();

      if (vehicleError || !vehicleData) { setLoading(false); return; }
      setVehicle(vehicleData as PublicVehicle);

      const { data: settingsData } = await supabase
        .from("settings").select("dealer_name, dealer_phone, dealer_email, dealer_address, whatsapp_number, public_page_id, public_page_theme, catalogue_template, show_vehicle_page_views, show_vehicle_page_enquiries, enable_auto_lead_popup, shop_logo_url")
        .eq("user_id", vehicleData.user_id).single();

      setDealer(settingsData as DealerInfo);

      await trackPublicEvent({ eventType: "vehicle_view", dealerUserId: vehicleData.user_id, publicPageId: settingsData?.public_page_id || "", vehicleId: vehicleData.id });
      await fetchVehicleStats(vehicleData.id);

      const { data: imagesData } = await supabase.from("vehicle_images").select("*").eq("vehicle_id", vehicleData.id);
      setImages(imagesData || []);

      const { data: reviews } = await supabase.from("dealer_testimonials").select("*").eq("user_id", vehicleData.user_id).order("created_at", { ascending: false }).limit(5);
      setTestimonials(reviews || []);
    } catch (error) {
      console.error("Error fetching vehicle:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicleStats = async (vehicleId: string) => {
    const { data } = await supabase.from("public_page_events").select("event_type").eq("vehicle_id", vehicleId);
    if (!data) return;
    setVehicleStats({ views: data.filter(e => e.event_type === "vehicle_view").length, enquiries: data.filter(e => e.event_type === "enquiry_submit").length });
  };

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !vehicle) return;
    if (!enquiryForm.name || !enquiryForm.phone) { toast({ title: "Please fill required fields", variant: "destructive" }); return; }
    setIsSubmitting(true);
    try {
      await createPublicLead({
        dealerUserId: vehicle.user_id, customerName: enquiryForm.name, phone: enquiryForm.phone,
        email: enquiryForm.email || undefined,
        vehicleInterest: `${vehicle.brand} ${vehicle.model}${vehicle.variant ? ` ${vehicle.variant}` : ""} (${vehicle.manufacturing_year})`,
        notes: enquiryForm.message || undefined, source: "website",
      });
      setSubmitted(true);
      toast({ title: "Enquiry sent successfully!" });
      await trackPublicEvent({ eventType: "enquiry_submit", dealerUserId: vehicle.user_id, publicPageId: dealer?.public_page_id || "", vehicleId: vehicle.id });
    } catch (error: any) {
      toast({ title: "Error", description: error.message ?? "Failed to send enquiry", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  const handleRatingSubmit = async () => {
    if (!ratingForm.name || !vehicle) { toast({ title: "Please enter your name", variant: "destructive" }); return; }
    setSubmittingRating(true);
    try {
      const { error } = await supabase.from("dealer_testimonials").insert({ user_id: vehicle.user_id, customer_name: ratingForm.name, rating: ratingForm.rating, review: ratingForm.review || null, is_verified: false });
      if (error) throw error;
      setRatingSubmitted(true);
      toast({ title: "Thank you for your review!" });
      fetchVehicle();
    } catch (error: any) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    finally { setSubmittingRating(false); }
  };

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  if (loading) return <CarLoader variant="center" text="Loading, hold on!" />;

  if (!vehicle) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${pageBg}`}>
        <Card className={`max-w-md mx-4 ${cardBg}`}>
          <CardContent className="py-12 text-center">
            <Car className={`h-16 w-16 mx-auto ${textMuted} mb-4`} />
            <h1 className={`text-2xl font-bold mb-2 ${textPrimary}`}>Vehicle Not Found</h1>
            <p className={textSecondary}>This vehicle listing is no longer available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentImage = images[currentImageIndex];

  const getWhatsAppMessage = () =>
    encodeURIComponent(`Hi, I am interested in your ${vehicle.brand} ${vehicle.model}${vehicle.variant ? ` ${vehicle.variant}` : ""} (${vehicle.manufacturing_year}).`);

  return (
    <div className={`min-h-screen ${pageBg}`}>
      {/* Header */}
      <header className={`${isPremium ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"} border-b sticky top-0 z-50`}>
        <div className="px-4 py-3 flex items-center justify-between gap-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            {dealer?.public_page_id && (
              <Button variant="ghost" size="icon" onClick={() => navigate(`/d/${dealer.public_page_id}`)} className="shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            {dealer?.shop_logo_url && (
              <img src={dealer.shop_logo_url} alt="" className="h-8 w-8 rounded-lg object-contain" />
            )}
            <h1 className={`text-base font-semibold truncate ${textPrimary}`}>
              {dealer?.dealer_name || "Vehicle Showroom"}
            </h1>
          </div>
          {(dealer?.dealer_phone || dealer?.whatsapp_number) && (
            <div className="hidden lg:flex gap-2">
              {dealer?.dealer_phone && (
                <a href={`tel:${dealer.dealer_phone}`}>
                  <Button variant="outline" size="sm" className="gap-2"><Phone className="h-4 w-4" /> Call</Button>
                </a>
              )}
              {dealer?.whatsapp_number && (
                <a href={`https://wa.me/${dealer.whatsapp_number.replace(/\D/g, "")}?text=${getWhatsAppMessage()}`} target="_blank" rel="noopener noreferrer"
                  onClick={() => trackPublicEvent({ eventType: "cta_whatsapp", dealerUserId: vehicle.user_id, publicPageId: dealer?.public_page_id || "", vehicleId: vehicle.id })}>
                  <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700 text-white"><MessageCircle className="h-4 w-4" /> WhatsApp</Button>
                </a>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Mobile CTA bar */}
      {(dealer?.dealer_phone || dealer?.whatsapp_number) && (
        <div className={`${isPremium ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"} border-b px-4 py-2 flex gap-3 sticky top-[52px] z-40 lg:hidden`}>
          {dealer?.dealer_phone && (
            <a href={`tel:${dealer.dealer_phone}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full gap-2"><Phone className="h-4 w-4" /> Call</Button>
            </a>
          )}
          {dealer?.whatsapp_number && (
            <a href={`https://wa.me/${dealer.whatsapp_number.replace(/\D/g, "")}?text=${getWhatsAppMessage()}`} target="_blank" rel="noopener noreferrer" className="flex-1"
              onClick={() => trackPublicEvent({ eventType: "cta_whatsapp", dealerUserId: vehicle.user_id, publicPageId: dealer?.public_page_id || "", vehicleId: vehicle.id })}>
              <Button size="sm" className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"><MessageCircle className="h-4 w-4" /> WhatsApp</Button>
            </a>
          )}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className={`overflow-hidden shadow-xl ${cardBg}`}>
              <div className={`relative ${isPremium ? "bg-gray-800" : "bg-gray-100"} aspect-[16/10]`}>
                {images.length > 0 ? (
                  <>
                    <img src={currentImage?.image_url} alt={`${vehicle.brand} ${vehicle.model}`} className="w-full h-full object-contain" />
                    {vehicle.image_badge_text && (
                      <div className={`absolute bottom-3 right-3 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg text-white ${badgeColors[vehicle.image_badge_color || "emerald"]}`}>
                        {vehicle.image_badge_text}
                      </div>
                    )}
                    {images.length > 1 && (
                      <>
                        <Button variant="secondary" size="icon" className={`absolute left-3 top-1/2 -translate-y-1/2 ${isPremium ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-white hover:bg-gray-100 text-gray-800"} shadow-lg border-0`} onClick={prevImage}>
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button variant="secondary" size="icon" className={`absolute right-3 top-1/2 -translate-y-1/2 ${isPremium ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-white hover:bg-gray-100 text-gray-800"} shadow-lg border-0`} onClick={nextImage}>
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {images.map((_, i) => (
                            <button key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentImageIndex ? `${accent.bg} w-5` : 'bg-white/40'}`} onClick={() => setCurrentImageIndex(i)} />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className={`h-24 w-24 ${textMuted}`} />
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className={`p-3 ${isPremium ? "bg-gray-800/50" : "bg-gray-50"} flex gap-2 overflow-x-auto`}>
                  {images.map((img, i) => (
                    <button key={img.id} onClick={() => setCurrentImageIndex(i)}
                      className={`shrink-0 w-16 h-12 rounded-md overflow-hidden border-2 transition-all ${i === currentImageIndex ? `${accent.border}` : 'border-transparent opacity-60 hover:opacity-100'}`}>
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Vehicle Info Card */}
            <Card className={`${cardBg} shadow-xl`}>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <CardTitle className={`text-2xl sm:text-3xl font-bold ${textPrimary}`}>
                      {vehicle.brand} {vehicle.model}
                    </CardTitle>
                    {vehicle.variant && <p className={`text-lg ${textSecondary}`}>{vehicle.variant}</p>}
                  </div>
                  <div className="text-left sm:text-right">
                    {vehicle.strikeout_price && vehicle.strikeout_price > vehicle.selling_price && (
                      <p className={`text-lg sm:text-xl ${textMuted} line-through mb-1`}>₹{formatIndianNumber(vehicle.strikeout_price)}</p>
                    )}
                    <p className={`text-3xl sm:text-4xl font-bold ${accent.text}`}>₹{formatIndianNumber(vehicle.selling_price)}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {dealer?.show_vehicle_page_views && (
                        <Badge className={`${accent.bgLight} ${accent.text}`}>👁 {vehicleStats.views} views</Badge>
                      )}
                      {dealer?.show_vehicle_page_enquiries && vehicleStats.enquiries > 0 && (
                        <Badge className="bg-rose-100 text-rose-700">🔥 {vehicleStats.enquiries} enquiries</Badge>
                      )}
                    </div>
                    <div className="flex gap-2 mt-2 justify-start sm:justify-end">
                      <Badge className={`bg-gradient-to-r ${accent.gradient} text-white border-0 capitalize`}>{vehicle.condition}</Badge>
                      <Badge variant="outline" className={isPremium ? "border-gray-700 text-gray-400" : "border-gray-300 text-gray-700"}>{vehicle.manufacturing_year}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quick Specs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: <Fuel className={`h-5 w-5 ${accent.text}`} />, label: "Fuel", value: vehicle.fuel_type },
                    { icon: <Settings className={`h-5 w-5 ${accent.text}`} />, label: "Transmission", value: vehicle.transmission },
                    { icon: <Gauge className={`h-5 w-5 ${accent.text}`} />, label: "Odometer", value: vehicle.odometer_reading ? `${formatIndianNumber(vehicle.odometer_reading)} km` : "N/A" },
                    { icon: <Calendar className={`h-5 w-5 ${accent.text}`} />, label: "Year", value: String(vehicle.manufacturing_year) },
                  ].map((spec, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3.5 rounded-xl ${isPremium ? "bg-gray-800 border border-gray-700" : "bg-gray-50 border border-gray-100"}`}>
                      {spec.icon}
                      <div>
                        <p className={`text-[11px] ${textMuted}`}>{spec.label}</p>
                        <p className={`font-semibold text-sm capitalize ${textPrimary}`}>{spec.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Description */}
                {vehicle.public_description && (
                  <div>
                    <h3 className={`font-semibold text-lg mb-2 ${textPrimary}`}>Description</h3>
                    <p className={`${textSecondary} whitespace-pre-wrap leading-relaxed`}>{vehicle.public_description}</p>
                  </div>
                )}

                {/* Detailed Specs */}
                <div>
                  <h3 className={`font-semibold text-lg mb-3 ${textPrimary}`}>Specifications</h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-0.5">
                    {[
                      { label: "Type", value: vehicle.vehicle_type },
                      { label: "Condition", value: vehicle.condition },
                      { label: "Color", value: vehicle.color },
                      { label: "Mileage", value: vehicle.mileage ? `${vehicle.mileage} km/l` : null },
                      { label: "Owners", value: vehicle.number_of_owners?.toString() },
                      { label: "Tyre Condition", value: vehicle.tyre_condition },
                      { label: "Battery", value: vehicle.battery_health },
                      { label: "Seating", value: vehicle.seating_capacity ? `${vehicle.seating_capacity} seater` : null },
                      { label: "Boot Space", value: vehicle.boot_space },
                      vehicle.registration_number ? { label: "Reg. No.", value: vehicle.registration_number } : null,
                      vehicle.show_engine_number && vehicle.engine_number ? { label: "Engine No.", value: vehicle.engine_number } : null,
                      vehicle.show_chassis_number && vehicle.chassis_number ? { label: "Chassis No.", value: vehicle.chassis_number } : null,
                    ].filter(spec => spec && spec.value).map((spec, i) => spec && (
                      <div key={i} className={`flex justify-between py-2.5 border-b ${isPremium ? "border-gray-800" : "border-gray-100"}`}>
                        <span className={textSecondary}>{spec.label}</span>
                        <span className={`font-medium capitalize ${textPrimary}`}>{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Highlights */}
                {vehicle.public_highlights && vehicle.public_highlights.length > 0 && (
                  <div>
                    <h3 className={`font-semibold text-lg mb-3 ${textPrimary}`}>Highlights</h3>
                    <div className="flex flex-wrap gap-2">
                      {vehicle.public_highlights.map((h, i) => (
                        <Badge key={i} className={`${accent.bgLight} ${accent.text} border ${accent.border} text-sm py-1.5 px-4`}>{h}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Features */}
                {vehicle.public_features && vehicle.public_features.length > 0 && (
                  <div>
                    <h3 className={`font-semibold text-lg mb-3 ${textPrimary}`}>Features</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {vehicle.public_features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle className={`h-4 w-4 ${accent.text} shrink-0`} />
                          <span className={`text-sm ${textSecondary}`}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            {/* Dealer Card */}
            <Card className={`${cardBg} shadow-lg overflow-hidden`}>
              <div className={`bg-gradient-to-r ${accent.gradient} p-4`}>
                <h3 className="text-white font-bold text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Contact Dealer
                </h3>
              </div>
              <CardContent className="p-4 space-y-3">
                {dealer && (
                  <>
                    <h3 className={`font-semibold text-lg ${textPrimary}`}>{dealer.dealer_name}</h3>
                    {dealer.dealer_address && (
                      <div className={`flex items-start gap-2 ${textSecondary}`}>
                        <MapPin className={`h-4 w-4 mt-0.5 shrink-0 ${accent.text}`} />
                        <span className="text-sm">{dealer.dealer_address}</span>
                      </div>
                    )}
                    {dealer.dealer_phone && (
                      <div className={`flex items-center gap-2 ${textSecondary}`}>
                        <Phone className={`h-4 w-4 ${accent.text}`} />
                        <a href={`tel:${dealer.dealer_phone}`} className={`text-sm hover:${accent.text}`}>{dealer.dealer_phone}</a>
                      </div>
                    )}
                    {dealer.dealer_email && (
                      <div className={`flex items-center gap-2 ${textSecondary}`}>
                        <Mail className={`h-4 w-4 ${accent.text}`} />
                        <a href={`mailto:${dealer.dealer_email}`} className="text-sm break-all">{dealer.dealer_email}</a>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Reviews */}
            {testimonials.length > 0 && (
              <Card className={cardBg}>
                <CardHeader className="pb-3 px-4 pt-4">
                  <CardTitle className={`flex items-center gap-2 text-base ${textPrimary}`}>
                    <Award className="h-4 w-4 text-amber-400" /> Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-60 overflow-y-auto px-4 pb-4">
                  {testimonials.map((review) => (
                    <div key={review.id} className={`p-3 rounded-lg ${isPremium ? "bg-gray-800 border border-gray-700" : "bg-gray-50 border border-gray-100"}`}>
                      <div className="flex items-center gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`h-3 w-3 ${star <= review.rating ? "fill-amber-400 text-amber-400" : textMuted}`} />
                        ))}
                      </div>
                      {review.review && <p className={`text-xs ${textSecondary} mb-2`}>{review.review}</p>}
                      <p className={`text-xs font-medium ${textPrimary}`}>{review.customer_name}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Rate Experience */}
            <Card className={cardBg}>
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className={`flex items-center gap-2 text-base ${textPrimary}`}>
                  <Sparkles className="h-4 w-4 text-amber-400" /> Rate Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {ratingSubmitted ? (
                  <div className="text-center py-4">
                    <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${accent.gradient} flex items-center justify-center mx-auto mb-3`}>
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <p className={`text-sm font-medium ${textPrimary}`}>Thank You!</p>
                    <Button variant="ghost" size="sm" className="mt-2" onClick={() => { setRatingSubmitted(false); setRatingForm({ name: "", rating: 5, review: "" }); }}>Submit Another</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Input value={ratingForm.name} onChange={(e) => setRatingForm({ ...ratingForm, name: e.target.value })} placeholder="Your name" className={`${inputClasses} h-9 text-sm`} />
                    <div className="flex gap-1 justify-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => setRatingForm({ ...ratingForm, rating: star })} className="p-0.5">
                          <Star className={`h-6 w-6 ${star <= ratingForm.rating ? "fill-amber-400 text-amber-400" : textMuted}`} />
                        </button>
                      ))}
                    </div>
                    <Textarea value={ratingForm.review} onChange={(e) => setRatingForm({ ...ratingForm, review: e.target.value })} placeholder="Share your experience (optional)" rows={2} className={`${inputClasses} text-sm`} />
                    <Button onClick={handleRatingSubmit} disabled={submittingRating} size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-white border-0">
                      {submittingRating ? "..." : "Submit"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enquiry Form */}
            <div className="sticky top-24">
              <Card className={`${cardBg} shadow-lg overflow-hidden`}>
                <div className={`bg-gradient-to-r ${accent.gradient} p-4`}>
                  <h3 className="text-white font-bold text-base flex items-center gap-2">
                    <Send className="h-4 w-4" /> Send Enquiry
                  </h3>
                  <p className="text-white/80 text-xs mt-1">Get the best deal on this vehicle</p>
                </div>
                <CardContent className="p-4">
                  {submitted ? (
                    <div className="text-center py-6">
                      <div className={`h-14 w-14 rounded-full bg-gradient-to-br ${accent.gradient} flex items-center justify-center mx-auto mb-3`}>
                        <CheckCircle className="h-7 w-7 text-white" />
                      </div>
                      <p className={`text-lg font-semibold ${textPrimary}`}>Enquiry Submitted!</p>
                      <p className={`text-xs mt-1 ${textMuted}`}>We'll contact you soon.</p>
                      <Button variant="outline" size="sm" className="mt-4" onClick={() => { setSubmitted(false); setEnquiryForm({ name: "", phone: "", email: "", message: "" }); }}>Send Another</Button>
                    </div>
                  ) : (
                    <form onSubmit={handleEnquirySubmit} className="space-y-3 mt-1">
                      <div>
                        <Label className={`text-xs ${textSecondary}`}>Name *</Label>
                        <Input value={enquiryForm.name} onChange={(e) => setEnquiryForm({ ...enquiryForm, name: e.target.value })} required className={`${inputClasses} h-9 text-sm`} />
                      </div>
                      <div>
                        <Label className={`text-xs ${textSecondary}`}>Phone *</Label>
                        <Input value={enquiryForm.phone} onChange={(e) => setEnquiryForm({ ...enquiryForm, phone: e.target.value })} required className={`${inputClasses} h-9 text-sm`} />
                      </div>
                      <div>
                        <Label className={`text-xs ${textSecondary}`}>Email</Label>
                        <Input type="email" value={enquiryForm.email} onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })} className={`${inputClasses} h-9 text-sm`} />
                      </div>
                      <div>
                        <Label className={`text-xs ${textSecondary}`}>Message</Label>
                        <Textarea value={enquiryForm.message} onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })} rows={2} className={`${inputClasses} text-sm`} />
                      </div>
                      <Button type="submit" className={`w-full bg-gradient-to-r ${accent.gradient} text-white border-0`} disabled={isSubmitting}>
                        {isSubmitting ? "Sending..." : "Send Enquiry"}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Auto Lead Popup */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-0">
          <div className={`bg-gradient-to-br ${accent.gradient} p-6 text-white`}>
            <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full w-fit mb-3">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span className="text-xs font-semibold">Special Offer</span>
            </div>
            <h3 className="text-xl font-bold mb-1">Interested in this vehicle?</h3>
            <p className="text-white/80 text-sm">Share your details for a personalized quote on the {vehicle.brand} {vehicle.model}.</p>
          </div>
          <div className="p-5">
            {submitted ? (
              <div className="text-center py-4">
                <CheckCircle className={`h-12 w-12 mx-auto mb-3 ${accent.text}`} />
                <p className="font-semibold">Enquiry Submitted!</p>
              </div>
            ) : (
              <form onSubmit={handleEnquirySubmit} className="space-y-3">
                <Input value={enquiryForm.name} onChange={(e) => setEnquiryForm({ ...enquiryForm, name: e.target.value })} placeholder="Your name *" required className="h-10" />
                <Input value={enquiryForm.phone} onChange={(e) => setEnquiryForm({ ...enquiryForm, phone: e.target.value })} placeholder="Phone number *" required className="h-10" />
                <Input type="email" value={enquiryForm.email} onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })} placeholder="Email (optional)" className="h-10" />
                <Button type="submit" className={`w-full bg-gradient-to-r ${accent.gradient} text-white`} disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Get Best Price"}
                </Button>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className={`border-t ${isPremium ? "border-gray-800" : "border-gray-200"} mt-16`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-center">
          <p className={`text-sm ${textMuted}`}>© {new Date().getFullYear()} {dealer?.dealer_name}. Powered by VahanHub</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicVehiclePage;