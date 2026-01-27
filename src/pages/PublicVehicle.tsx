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
  Gauge, Settings, Send, CheckCircle, MessageCircle, Star, Award, Sparkles, ArrowLeft
} from "lucide-react";
import { createPublicLead } from "@/lib/leads";
import CarLoader from "@/components/CarLoader";
import { trackPublicEvent } from "@/lib/publicAnalytics";
import { useScrollTracking } from "@/lib/useScrollTracking";

import { useAutoLeadPopup } from "@/lib/useAutoLeadPopup";
import { Dialog, DialogContent } from "@/components/ui/dialog";



const publicThemes = [
  {
    id: "white",
    bgFrom: "bg-white",
    bgVia: "",
    bgTo: "",
    cardBg: "bg-white",
    border: "border-gray-200",
    accent: "emerald",
  },
];

const badgeColors: Record<string, string> = {
  emerald: "bg-emerald-600",
  rose: "bg-rose-600",
  amber: "bg-amber-500",
  indigo: "bg-indigo-600",
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
  image_badge_color?: "emerald" | "rose" | "amber" | "indigo" | null;
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
  enable_auto_lead_popup?: boolean;
  show_vehicle_page_views?: boolean;
  show_vehicle_page_enquiries?: boolean;
}


const PublicVehicle = () => {
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
  const [theme, setTheme] = useState(publicThemes[0]);

  const [vehicleStats, setVehicleStats] = useState({
  views: 0,
  enquiries: 0,
});

const { open, setOpen } = useAutoLeadPopup({
  enabled: dealer?.enable_auto_lead_popup === true,                // later you can control from settings
  scrollPercent: 40,              // OR after 40% scroll
  onceKey: `vehicle-${vehicle?.id}`,
});



  
  const [enquiryForm, setEnquiryForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });

  // Rating form
  const [ratingForm, setRatingForm] = useState({ name: "", rating: 5, review: "" });
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);


useScrollTracking({
  dealerUserId: vehicle?.user_id,
  publicPageId: dealer?.public_page_id || "",
  vehicleId: vehicle?.id,
});



  useEffect(() => {
    if (pageId) {
      fetchVehicle();
    }
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
    // 1️⃣ Fetch vehicle
    const { data: vehicleData, error: vehicleError } = await supabase
      .from("vehicles")
      .select("*")
      .eq("public_page_id", pageId)
      .eq("is_public", true)
      .single();

    if (vehicleError || !vehicleData) {
      console.error("Vehicle not found:", vehicleError);
      return;
    }

    setVehicle(vehicleData as PublicVehicle);

    // 2️⃣ Fetch dealer settings (REQUIRED before analytics)
    const { data: settingsData } = await supabase
      .from("settings")
      .select(`
        dealer_name,
        dealer_phone,
        dealer_email,
        dealer_address,
        whatsapp_number,
        public_page_id,
        public_page_theme,
        show_vehicle_page_views,
  show_vehicle_page_enquiries,
  enable_auto_lead_popup

      `)
      .eq("user_id", vehicleData.user_id)
      .single();

    setDealer(settingsData as DealerInfo);

    const selectedTheme =
      publicThemes.find(t => t.id === settingsData?.public_page_theme) ||
      publicThemes[0];

    setTheme(selectedTheme);

    // 3️⃣ Track vehicle view (NOW SAFE)
    await trackPublicEvent({
      eventType: "vehicle_view",
      dealerUserId: vehicleData.user_id,
      publicPageId: settingsData?.public_page_id || "",
      vehicleId: vehicleData.id,
    });

    // 4️⃣ Fetch vehicle analytics stats
    await fetchVehicleStats(vehicleData.id);

    // 5️⃣ Fetch vehicle images
    const { data: imagesData } = await supabase
      .from("vehicle_images")
      .select("*")
      .eq("vehicle_id", vehicleData.id);

    setImages(imagesData || []);

    // 6️⃣ Fetch testimonials
    const { data: reviews } = await supabase
      .from("dealer_testimonials")
      .select("*")
      .eq("user_id", vehicleData.user_id)
      .order("created_at", { ascending: false })
      .limit(5);

    setTestimonials(reviews || []);
  } catch (error) {
    console.error("Error fetching vehicle:", error);
  } finally {
    setLoading(false);
  }
};



  const fetchVehicleStats = async (vehicleId: string) => {
  const { data } = await supabase
    .from("public_page_events")
    .select("event_type")
    .eq("vehicle_id", vehicleId);

  if (!data) return;

  setVehicleStats({
    views: data.filter(e => e.event_type === "vehicle_view").length,
    enquiries: data.filter(e => e.event_type === "enquiry_submit").length,
  });
};


  const handleEnquirySubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (isSubmitting || !vehicle) return;

  if (!enquiryForm.name || !enquiryForm.phone) {
    toast({ title: "Please fill required fields", variant: "destructive" });
    return;
  }

  setIsSubmitting(true);

  try {
    await createPublicLead({
      dealerUserId: vehicle.user_id,
      customerName: enquiryForm.name,
      phone: enquiryForm.phone,
      email: enquiryForm.email || undefined,
      city: undefined, // (vehicle page usually doesn’t ask city)
      vehicleInterest: `${vehicle.brand} ${vehicle.model}${vehicle.variant ? ` ${vehicle.variant}` : ""} (${vehicle.manufacturing_year})`,
      notes: enquiryForm.message || undefined,
      source: "website", // internal only
    });

    setSubmitted(true);
    toast({ title: "Enquiry sent successfully!" });

    await trackPublicEvent({
  eventType: "enquiry_submit",
  dealerUserId: vehicle.user_id,
  publicPageId: dealer?.public_page_id || "",
  vehicleId: vehicle.id,
});


  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message ?? "Failed to send enquiry",
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
  }
};


  const handleRatingSubmit = async () => {
    if (!ratingForm.name || !vehicle) {
      toast({ title: "Please enter your name", variant: "destructive" });
      return;
    }

    setSubmittingRating(true);
    try {
      const { error } = await supabase.from("dealer_testimonials").insert({
        user_id: vehicle.user_id,
        customer_name: ratingForm.name,
        rating: ratingForm.rating,
        review: ratingForm.review || null,
        is_verified: false,
      });

      if (error) throw error;

      setRatingSubmitted(true);
      toast({ title: "Thank you for your review!" });
      fetchVehicle();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmittingRating(false);
    }
  };

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  if (loading) {
  return (
    <CarLoader
      variant="center"
      text="Loading, hold on!"
    />
  );
}



  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="max-w-md mx-4 bg-white border border-gray-200">
          <CardContent className="py-12 text-center">
            <Car className="h-16 w-16 mx-auto text-slate-600 mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-white">Vehicle Not Found</h1>
            <p className="text-slate-400">This vehicle listing is no longer available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentImage = images[currentImageIndex];

  const getWhatsAppMessage = (vehicle: PublicVehicle) =>
  encodeURIComponent(
    `Hi, I am interested in your ${vehicle.brand} ${vehicle.model}${
      vehicle.variant ? ` ${vehicle.variant}` : ""
    } (${vehicle.manufacturing_year}).`
  );

  const enquiryFormUI = (
  <Card className="border-slate-700 shadow-lg bg-white border border-gray-200">
    <CardHeader className="pb-3">
      <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
        <Send className="h-5 w-5 text-emerald-400" /> Send Enquiry
      </CardTitle>
    </CardHeader>
    <CardContent>
      {submitted ? (
        <div className="text-center py-8">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <p className="text-lg font-semibold text-gray-900">Enquiry Submitted!</p>
          <p className="text-slate-400 text-sm mt-1">We'll contact you soon.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSubmitted(false);
              setEnquiryForm({ name: "", phone: "", email: "", message: "" });
            }}
          >
            Send Another Enquiry
          </Button>
        </div>
      ) : (
        <form onSubmit={handleEnquirySubmit} className="space-y-4">
          <div>
            <Label>Name *</Label>
            <Input
              value={enquiryForm.name}
              onChange={(e) =>
                setEnquiryForm({ ...enquiryForm, name: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label>Phone *</Label>
            <Input
              value={enquiryForm.phone}
              onChange={(e) =>
                setEnquiryForm({ ...enquiryForm, phone: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={enquiryForm.email}
              onChange={(e) =>
                setEnquiryForm({ ...enquiryForm, email: e.target.value })
              }
            />
          </div>

          <div>
            <Label>Message</Label>
            <Textarea
              value={enquiryForm.message}
              onChange={(e) =>
                setEnquiryForm({ ...enquiryForm, message: e.target.value })
              }
              rows={3}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Send Enquiry"}
          </Button>
        </form>
      )}
    </CardContent>
  </Card>
);



  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
  <div className="px-4 py-3 flex items-center justify-between gap-3">
  
  {/* LEFT: Back + Dealer name */}
  <div className="flex items-center gap-3 min-w-0">
    {dealer?.public_page_id && (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate(`/d/${dealer.public_page_id}`)}
        className="shrink-0"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
    )}

    <h1 className="text-base font-semibold text-gray-900 truncate">
      {dealer?.dealer_name || "Vehicle Showroom"}
    </h1>
  </div>

  {/* RIGHT: DESKTOP CTAs */}
  {(dealer?.dealer_phone || dealer?.whatsapp_number) && (
    <div className="hidden lg:flex gap-2">
      
      {dealer?.dealer_phone && (
        <a href={`tel:${dealer.dealer_phone}`}>
          <Button variant="outline" size="sm" className="gap-2">
            <Phone className="h-4 w-4" />
            Call
          </Button>
        </a>
      )}

      {dealer?.whatsapp_number && (
        <a
          href={`https://wa.me/${dealer.whatsapp_number.replace(/\D/g, "")}?text=${getWhatsAppMessage(vehicle)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            trackPublicEvent({
              eventType: "cta_whatsapp",
              dealerUserId: vehicle!.user_id,
              publicPageId: dealer?.public_page_id || "",
              vehicleId: vehicle!.id,
            });
          }}
        >
          <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700 text-white">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
        </a>
      )}

    </div>
  )}
</div>

</header>

{(dealer?.dealer_phone || dealer?.whatsapp_number) && (
  <div className="bg-white border-b px-4 py-2 flex gap-3 sticky top-[52px] z-40 lg:hidden">
    {dealer?.dealer_phone && (
      <a href={`tel:${dealer.dealer_phone}`} className="flex-1">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
        >
          <Phone className="h-4 w-4" /> Call
        </Button>
      </a>
    )}

    {dealer?.whatsapp_number && (
      <a
        href={`https://wa.me/${dealer.whatsapp_number.replace(/\D/g, "")}?text=${getWhatsAppMessage(vehicle)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1"
        onClick={() => {
          trackPublicEvent({
            eventType: "cta_whatsapp",
            dealerUserId: vehicle!.user_id,
            publicPageId: dealer?.public_page_id || "",
            vehicleId: vehicle!.id,
          });
        }}
      >
        <Button
          size="sm"
          className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </Button>
      </a>
    )}
  </div>
)}



      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Left Column - Image Gallery & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Carousel */}
            <Card className={`overflow-hidden shadow-2xl ${theme.cardBg} ${theme.border}`}>
              <div className="relative bg-slate-900 aspect-[16/10]">
                {images.length > 0 ? (
                  <>
                    <img 
                      src={currentImage?.image_url} 
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-full object-contain"
                    />

                    {vehicle.image_badge_text && (
  <div
    className={`absolute bottom-3 right-3 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg text-white
      ${badgeColors[vehicle.image_badge_color || "emerald"]}`}
  >
    {vehicle.image_badge_text}
  </div>
)}




                    {images.length > 1 && (
                      <>
                        <Button 
                          variant="secondary" 
                          size="icon" 
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 shadow-lg border-0"
                          onClick={prevImage}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="icon" 
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-100 text-gray-800 shadow-lg border-0"
                          onClick={nextImage}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {images.map((_, i) => (
                            <button 
                              key={i} 
                              className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentImageIndex ? 'bg-emerald-500 w-5' : 'bg-white/40'}`}
                              onClick={() => setCurrentImageIndex(i)}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className="h-24 w-24 text-slate-700" />
                  </div>
                )}
              </div>
              
              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="p-3 bg-slate-800/50 flex gap-2 overflow-x-auto">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`shrink-0 w-16 h-12 rounded-md overflow-hidden border-2 transition-all ${
                        i === currentImageIndex ? 'border-emerald-500' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Vehicle Info */}
            <Card className={`${theme.cardBg} ${theme.border} shadow-xl`}>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {vehicle.brand} {vehicle.model}
                    </CardTitle>
                    {vehicle.variant && <p className="text-lg text-gray-500">{vehicle.variant}</p>}
                  </div>
                  <div className="text-left sm:text-right">
                    {vehicle.strikeout_price && vehicle.strikeout_price > vehicle.selling_price && (
                      <p className="text-lg sm:text-xl text-gray-400 line-through mb-1">
                        ₹{formatIndianNumber(vehicle.strikeout_price)}
                      </p>
                    )}
                    <p className="text-3xl sm:text-4xl font-bold text-emerald-400">₹{formatIndianNumber(vehicle.selling_price)}</p>
                    <div className="flex gap-2 mt-2">
  {dealer?.show_vehicle_page_views && (
    <Badge className="bg-indigo-100 text-indigo-700">
      👁 {vehicleStats.views} views
    </Badge>
  )}

  {dealer?.show_vehicle_page_enquiries && vehicleStats.enquiries > 0 && (
    <Badge className="bg-rose-100 text-rose-700">
      🔥 {vehicleStats.enquiries} enquiries
    </Badge>
  )}
</div>


                    <div className="flex gap-2 mt-2 justify-start sm:justify-end">
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 capitalize">{vehicle.condition}</Badge>
                      <Badge variant="outline" className="border-gray-300 text-gray-700">{vehicle.manufacturing_year}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Quick Specs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className={`flex items-center gap-3 p-4 ${theme.cardBg} rounded-xl`}>
                    <Fuel className="h-5 w-5 text-emerald-400" />
                    <div>
                      <p className="text-xs text-gray-500">Fuel</p>
                      <p className="font-medium capitalize text-gray-900">{vehicle.fuel_type}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-3 p-4 ${theme.cardBg} rounded-xl`}>
                    <Settings className="h-5 w-5 text-cyan-400" />
                    <div>
                      <p className="text-xs text-gray-500">Transmission</p>
                      <p className="font-medium uppercase text-gray-900">{vehicle.transmission}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-3 p-4 ${theme.cardBg} rounded-xl`}>
                    <Gauge className="h-5 w-5 text-amber-400" />
                    <div>
                      <p className="text-xs text-gray-500">Odometer</p>
                      <p className="font-medium text-gray-900">{vehicle.odometer_reading ? `${formatIndianNumber(vehicle.odometer_reading)} km` : 'N/A'}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-3 p-4 ${theme.cardBg} rounded-xl`}>
                    <Calendar className="h-5 w-5 text-rose-400" />
                    <div>
                      <p className="text-xs text-gray-500">Year</p>
                      <p className="font-medium text-gray-900">{vehicle.manufacturing_year}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {vehicle.public_description && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-white">Description</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{vehicle.public_description}</p>
                  </div>
                )}

                {/* Detailed Specs */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-gray-900">Specifications</h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                    {[
                      { label: "Type", value: vehicle.vehicle_type },
                      { label: "Condition", value: vehicle.condition },
                      { label: "Color", value: vehicle.color || "N/A" },
                      { label: "Mileage", value: vehicle.mileage ? `${vehicle.mileage} km/l` : "N/A" },
                      { label: "Owners", value: vehicle.number_of_owners?.toString() || "1" },
                      { label: "Tyre Condition", value: vehicle.tyre_condition || "N/A" },
                      { label: "Battery", value: vehicle.battery_health || "N/A" },
                      vehicle.registration_number ? { label: "Reg. No.", value: vehicle.registration_number } : null,
                      vehicle.show_engine_number && vehicle.engine_number ? { label: "Engine No.", value: vehicle.engine_number } : null,
                      vehicle.show_chassis_number && vehicle.chassis_number ? { label: "Chassis No.", value: vehicle.chassis_number } : null,
                    ].filter(Boolean).map((spec, i) => spec && (
                      <div key={i} className="flex justify-between py-2.5 border-b border-gray-200/50">
                        <span className="text-gray-500">{spec.label}</span>
                        <span className="font-medium capitalize text-gray-900">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Highlights */}
                {vehicle.public_highlights && vehicle.public_highlights.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-gray-900">Highlights</h3>
                    <div className="flex flex-wrap gap-2">
                      {vehicle.public_highlights.map((h, i) => (
                        <Badge key={i} className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-sm py-1.5 px-4">{h}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Features */}
                {vehicle.public_features && vehicle.public_features.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-gray-900">Features</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {vehicle.public_features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span className="text-sm text-gray-700">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Dealer Info, Reviews & Enquiry Form */}
          <div className="space-y-6">
            {/* Dealer Card */}
            <Card className={`${theme.cardBg} ${theme.border} shadow-lg`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-gray-900">Contact Dealer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dealer && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg text-gray-900">{dealer.dealer_name}</h3>
                    {dealer.dealer_address && (
                      <div className="flex items-start gap-2 text-gray-600">
                        <MapPin className="h-4 w-4 mt-1 shrink-0 text-rose-400" />
                        <span className="text-sm">{dealer.dealer_address}</span>
                      </div>
                    )}
                    {dealer.dealer_phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-4 w-4 text-emerald-400" />
                        <a href={`tel:${dealer.dealer_phone}`} className="text-sm hover:text-emerald-400">{dealer.dealer_phone}</a>
                      </div>
                    )}
                    {dealer.dealer_email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-4 w-4 text-cyan-400" />
                        <a href={`mailto:${dealer.dealer_email}`} className="text-sm hover:text-cyan-400 break-all">{dealer.dealer_email}</a>
                      </div>
                    )}
                  </div>
                )}

                {/* DESKTOP CTA BUTTONS */}


              </CardContent>
            </Card>

            {/* Customer Reviews */}
            {testimonials.length > 0 && (
              <Card className={`${theme.cardBg} ${theme.border}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Award className="h-5 w-5 text-amber-400" /> Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-60 overflow-y-auto">
                  {testimonials.map((review) => (
                    <div key={review.id} className="p-3 bg-gray-100 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${star <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-600"}`}
                          />
                        ))}
                      </div>
                      {review.review && <p className="text-xs text-gray-600 mb-2">{review.review}</p>}
                      <p className="text-xs font-medium text-gray-800">{review.customer_name}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Rate Experience */}
            <Card className={`${theme.cardBg} ${theme.border}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-gray-900 text-base">
                  <Sparkles className="h-4 w-4 text-amber-400" /> Rate Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ratingSubmitted ? (
                  <div className="text-center py-4">
                    <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">Thank You!</p>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="mt-2 text-slate-400"
                      onClick={() => { setRatingSubmitted(false); setRatingForm({ name: "", rating: 5, review: "" }); }}
                    >
                      Submit Another
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Input 
                      value={ratingForm.name} 
                      onChange={(e) => setRatingForm({ ...ratingForm, name: e.target.value })}
                      placeholder="Your name"
                      className="bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    />
                    <div className="flex gap-1 justify-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingForm({ ...ratingForm, rating: star })}
                          className="p-0.5"
                        >
                          <Star
                            className={`h-6 w-6 ${star <= ratingForm.rating ? "fill-amber-400 text-amber-400" : "text-slate-600"}`}
                          />
                        </button>
                      ))}
                    </div>
                    <Textarea 
  value={ratingForm.review}
  onChange={(e) => setRatingForm({ ...ratingForm, review: e.target.value })}
  placeholder="Share your experience (optional)"
  rows={2}
  className="bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
/>

                    <Button 
                      onClick={handleRatingSubmit} 
                      disabled={submittingRating}
                      size="sm"
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white border-0"
                    >
                      {submittingRating ? "..." : "Submit"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enquiry Form */}
            <div className="sticky top-24">
  {enquiryFormUI}
</div>

          </div>
        </div>
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="max-w-md">
    {enquiryFormUI}
  </DialogContent>
</Dialog>



      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} {dealer?.dealer_name}. Powered by VahanHub
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicVehicle;