import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, Phone, Mail, MessageCircle, Star, Car, 
  Fuel, Calendar, Gauge, Send, CheckCircle, ExternalLink, Award, Sparkles
} from "lucide-react";
import { formatIndianNumber } from "@/lib/formatters";
import { createPublicLead } from "@/lib/leads";
import CarLoader from "@/components/CarLoader";
import { trackPublicEvent } from "@/lib/publicAnalytics";
import { useScrollTracking } from "@/lib/useScrollTracking";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAutoLeadPopup } from "@/lib/useAutoLeadPopup";
import DealerEnquiryForm from "@/components/public/DealerEnquiryForm";




// Public page themes
// Public page themes (LOCKED TO WHITE)
const publicThemes = [
  {
    id: "white",
    name: "Clean White",
    bgFrom: "bg-white",
    bgVia: "",
    bgTo: "",
    accent: "emerald",
    cardBg: "bg-white",
    border: "border-gray-200",
  },
];


const badgeColorMap: Record<string, string> = {
  emerald: "bg-emerald-600",
  rose: "bg-rose-600",
  amber: "bg-amber-500",
  indigo: "bg-indigo-600",
};



const DealerPublicPage = () => {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dealerInfo, setDealerInfo] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehicleImages, setVehicleImages] = useState<Record<string, any[]>>({});
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [stats, setStats] = useState({ vehiclesSold: 0, avgRating: 0, totalReviews: 0 });
  const [enquiryForm, setEnquiryForm] = useState({ name: "", phone: "", email: "", city: "", message: "", leadType: "buying" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Rating form
  const [ratingForm, setRatingForm] = useState({ name: "", rating: 5, review: "" });
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const [liveStats, setLiveStats] = useState({
  viewsToday: 0,
  enquiriesToday: 0,
});

useScrollTracking({
  dealerUserId: dealerInfo?.user_id,
  publicPageId: pageId || "",
});

const { open, setOpen } = useAutoLeadPopup({
  enabled: dealerInfo?.enable_auto_lead_popup === true,
  scrollPercent: 40,
  onceKey: `dealer-${pageId}`,
});





  // Theme (default slate)
  //const theme = publicThemes[0];
  const [theme, setTheme] = useState(publicThemes[0]);

  useEffect(() => {
    if (pageId) fetchDealerData();
  }, [pageId]);

  const fetchDealerData = async () => {
    try {
      const { data: settings, error } = await supabase
        .from("settings")
        .select("*")
        .eq("public_page_id", pageId)
        .eq("public_page_enabled", true)
        .single();

      if (error || !settings) {
        setLoading(false);
        return;
      }

      setDealerInfo(settings);

      await trackPublicEvent({
  eventType: "page_view",
  dealerUserId: settings.user_id,
  publicPageId: pageId!,
});

      await fetchLiveStats(settings.user_id);



      


const selectedTheme =
  publicThemes.find(t => t.id === settings.public_page_theme) ||
  publicThemes[0];

setTheme(selectedTheme);


      const { data: publicVehicles } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", settings.user_id)
        .eq("is_public", true)
        .eq("status", "in_stock");

      setVehicles(publicVehicles || []);

      if (publicVehicles && publicVehicles.length > 0) {
        const vehicleIds = publicVehicles.map(v => v.id);
        const { data: images } = await supabase
          .from("vehicle_images")
          .select("*")
          .in("vehicle_id", vehicleIds);

        const imagesMap: Record<string, any[]> = {};
        (images || []).forEach((img) => {
          if (!imagesMap[img.vehicle_id]) imagesMap[img.vehicle_id] = [];
          imagesMap[img.vehicle_id].push(img);
        });
        setVehicleImages(imagesMap);
      }

      const { data: reviews } = await supabase
        .from("dealer_testimonials")
        .select("*")
        .eq("user_id", settings.user_id)
        .order("created_at", { ascending: false })
        .limit(10);

      setTestimonials(reviews || []);

      const { data: sales } = await supabase
        .from("sales")
        .select("id")
        .eq("user_id", settings.user_id)
        .eq("status", "completed");

      const totalSales = sales?.length || 0;
      const avgRating = reviews && reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      setStats({
        vehiclesSold: totalSales,
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews?.length || 0,
      });

    } catch (error) {
      console.error("Error fetching dealer data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveStats = async (dealerUserId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("public_page_events")
    .select("event_type")
    .eq("dealer_user_id", dealerUserId)
    .gte("created_at", today.toISOString());

  if (!data) return;

  setLiveStats({
    viewsToday: data.filter(e => e.event_type === "page_view").length,
    enquiriesToday: data.filter(e => e.event_type === "enquiry_submit").length,
  });
};


  const handleEnquiry = async () => {
  if (!enquiryForm.name || !enquiryForm.phone) {
    toast({ title: "Please fill required fields", variant: "destructive" });
    return;
  }

  setSubmitting(true);

  try {
    const notesParts = [];
    if (enquiryForm.leadType)
      notesParts.push(`[${enquiryForm.leadType.toUpperCase()}]`);
    if (enquiryForm.city)
      notesParts.push(`City: ${enquiryForm.city}`);
    if (enquiryForm.message)
      notesParts.push(enquiryForm.message);

    const notes = notesParts.join(" | ");

    await createPublicLead({
  dealerUserId: dealerInfo.user_id,
  customerName: enquiryForm.name,
  phone: enquiryForm.phone,
  email: enquiryForm.email || undefined,
  city: enquiryForm.city || undefined,   // ✅ IMPORTANT
  notes: notes || undefined,
  source: "website",
  lead_type: enquiryForm.leadType, // ✅ ADD THIS LINE
});


    setSubmitted(true);
    toast({ title: "Enquiry submitted successfully!" });
    await trackPublicEvent({
  eventType: "enquiry_submit",
  dealerUserId: dealerInfo.user_id,
  publicPageId: pageId!,
});

  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message ?? "Failed to submit enquiry",
      variant: "destructive",
    });
  } finally {
    setSubmitting(false);
  }
};


  const resetEnquiryForm = () => {
    setEnquiryForm({ name: "", phone: "", email: "", city: "", message: "", leadType: "buying" });
    setSubmitted(false);
  };

  const handleRatingSubmit = async () => {
    if (!ratingForm.name) {
      toast({ title: "Please enter your name", variant: "destructive" });
      return;
    }

    setSubmittingRating(true);
    try {
      const { error } = await supabase.from("dealer_testimonials").insert({
        user_id: dealerInfo.user_id,
        customer_name: ratingForm.name,
        rating: ratingForm.rating,
        review: ratingForm.review || null,
        is_verified: false,
      });

      if (error) throw error;

      setRatingSubmitted(true);
      toast({ title: "Thank you for your review!" });
      fetchDealerData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleVehicleClick = (vehicle: any) => {
    if (vehicle.public_page_id) {
      navigate(`/v/${vehicle.public_page_id}`);
    }
  };

  if (loading) {
  return (
    <CarLoader
       position="center"
      text="Loading, hold on!"
    />
  );
}


  if (!dealerInfo) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${theme.bgFrom} ${theme.bgVia} ${theme.bgTo}`}>
        <Card className={`p-8 text-center ${theme.cardBg} ${theme.border}`}>
          <h2 className="text-2xl font-bold mb-2 text-white">Page Not Found</h2>
          <p className="text-slate-400">This dealer page is not available or has been disabled.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bgFrom} text-gray-900`}>
      {/* Hero Section */}
      <div className="relative border-b border-gray-200 bg-white">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-transparent to-cyan-600/20" />
        <div className="w-full px-4 sm:px-6 py-8 sm:py-12 relative">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
            {dealerInfo.shop_logo_url && (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl blur-xl opacity-40" />
                <img 
                  src={dealerInfo.shop_logo_url} 
                  alt={dealerInfo.dealer_name} 
                  className={`relative h-24 w-24 sm:h-32 sm:w-32 object-contain rounded-2xl ${theme.cardBg} p-3 ${theme.border} border`}
                />
              </div>
            )}
            <div className="text-center md:text-left flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                  {dealerInfo.dealer_name || "Dealer"}
                </h1>
                {dealerInfo.show_ratings && stats.avgRating > 0 && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-sm py-1 px-3 gap-1.5 w-fit mx-auto md:mx-0 shadow-lg">
                    <Star className="h-3.5 w-3.5 fill-white" /> {stats.avgRating} ({stats.totalReviews})
                  </Badge>

                )}
                <div className="flex gap-2 mt-3 flex-wrap">
  {dealerInfo.show_dealer_page_views && (
    <Badge className="bg-blue-100 text-blue-700">
      👀 {liveStats.viewsToday} views today
    </Badge>
  )}

  {dealerInfo.show_dealer_page_enquiries && (
    <Badge className="bg-green-100 text-green-700">
      ✉️ {liveStats.enquiriesToday} enquiries today
    </Badge>
  )}
</div>


              </div>
              {dealerInfo.shop_tagline && (
                <p className="text-base sm:text-lg text-gray-600 mt-2">
{dealerInfo.shop_tagline}</p>
              )}
              <div className="mt-5 space-y-3">
  {/* Badges row */}
  <div className="flex flex-wrap justify-center md:justify-start gap-2">
    {dealerInfo.show_vehicles_sold && stats.vehiclesSold > 0 && (
      <Badge className="bg-slate-700/80 text-slate-200 border-slate-600 text-xs py-1 px-3 gap-1.5">
        <Car className="h-3.5 w-3.5" /> {stats.vehiclesSold}+ Sold
      </Badge>
    )}

    <Badge className="bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/30 text-xs py-1 px-3 gap-1.5 flex items-center">
      <CheckCircle className="h-3.5 w-3.5" /> Verified
    </Badge>

    {dealerInfo.dealer_tag && (
      <Badge
        className="
          flex items-center gap-1.5
          rounded-full
          bg-yellow-50
          text-yellow-700
          border border-yellow-200
          px-3 py-1
          text-xs
          font-medium
        "
      >
        <CheckCircle className="h-3.5 w-3.5" />
        {dealerInfo.dealer_tag}
      </Badge>
    )}
  </div>

  {/* Location */}
  {dealerInfo.dealer_address && (
    <div className="flex items-center gap-1.5 text-sm text-gray-600">
      <MapPin className="h-4 w-4 text-emerald-500" />
      <span className="font-medium">
        {dealerInfo.dealer_address
          .split(",")
          .slice(-3, -1)
          .join(", ")
          .trim()}
      </span>
    </div>
  )}
</div>



            </div>
            <div className="flex flex-row md:flex-col gap-2">
              {dealerInfo.dealer_phone && (
                <a
  href={`tel:${dealerInfo.dealer_phone}`}
  onClick={() => {
    console.log("📞 Call CTA clicked");
    console.log("Payload:", {
      eventType: "cta_call",
      dealerUserId: dealerInfo.user_id,
      publicPageId: pageId!,
    });

    trackPublicEvent({
      eventType: "cta_call",
      dealerUserId: dealerInfo.user_id,
      publicPageId: pageId!,
    });
  }}
>


                  <Button
  variant="outline"
  size="sm"
  className="gap-2 border border-gray-300 bg-white text-gray-800 hover:bg-gray-100"
>

                    <Phone className="h-4 w-4" /> Call
                  </Button>
                </a>
              )}
              {dealerInfo.whatsapp_number && (
                <a
  href={`https://wa.me/${dealerInfo.whatsapp_number.replace(/\D/g, "")}`}
  target="_blank"
  onClick={() => {
    console.log("📲 WhatsApp CTA clicked");
    console.log("Payload:", {
      eventType: "cta_whatsapp",
      dealerUserId: dealerInfo.user_id,
      publicPageId: pageId!,
    });

    trackPublicEvent({
      eventType: "cta_whatsapp",
      dealerUserId: dealerInfo.user_id,
      publicPageId: pageId!,
    });
  }}
  rel="noopener noreferrer"
>


                  <Button size="sm" className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 py-8">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Vehicles */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {dealerInfo.dealer_phone && (
                <Card className={`${theme.cardBg} ${theme.border} hover:border-emerald-500/50 transition-colors`}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Phone</p>
<p className="font-medium text-gray-900 text-sm truncate">
{dealerInfo.dealer_phone}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              {dealerInfo.dealer_email && (
                <Card className={`${theme.cardBg} ${theme.border} hover:border-cyan-500/50 transition-colors`}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-cyan-400" />
                    </div>
                    <div className="min-w-0 overflow-hidden">
                      <p className="text-xs text-gray-500">Email</p>
<p className="font-medium text-gray-900 text-sm truncate">{dealerInfo.dealer_email}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              {dealerInfo.gmap_link && (
                <a href={dealerInfo.gmap_link} target="_blank" rel="noopener noreferrer">
                  <Card className={`${theme.cardBg} ${theme.border} hover:border-rose-500/50 transition-colors cursor-pointer h-full`}>
                    <CardContent className="flex items-center gap-3 p-3">
                      <div className="h-10 w-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-rose-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Location</p>
<p className="font-medium text-gray-900 text-sm">View on Maps</p>

                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                    </CardContent>
                  </Card>
                </a>
              )}
            </div>

            {/* Vehicles Grid */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                  <Car className="h-4 w-4 text-white" />
                </div>
                Available Vehicles ({vehicles.length})
              </h2>
              {vehicles.length === 0 ? (
                <Card className={`p-10 text-center ${theme.cardBg} ${theme.border}`}>
                  <Car className="h-14 w-14 mx-auto text-slate-600 mb-3" />
                  <p className="text-slate-400 text-sm">No vehicles currently available.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {vehicles.map((vehicle) => {
                    const images = vehicleImages[vehicle.id] || [];
                    const primaryImage = images.find(i => i.is_primary) || images[0];
                    return (
                      <Card 
                        key={vehicle.id} 
                        className={`overflow-hidden ${theme.cardBg} ${theme.border} hover:border-emerald-500/50 transition-all hover:shadow-lg hover:shadow-emerald-500/10 cursor-pointer group`}
                        onClick={() => handleVehicleClick(vehicle)}
                      >
                        <div className="aspect-[4/3] relative bg-gray-100">

                        {vehicle.image_badge_text && (
  <div
    className={`absolute bottom-2 left-2 z-10 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white shadow-md
      ${badgeColorMap[vehicle.image_badge_color || "emerald"]}`}
  >
    {vehicle.image_badge_text}
  </div>
)}


                          {primaryImage ? (
                            
                            <img 
                              src={primaryImage.image_url} 
                              alt={vehicle.brand} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Car className="h-12 w-12 text-slate-600" />
                            </div>
                          )}
                          <Badge className="absolute top-2 right-2 bg-emerald-500 text-white border-0 capitalize text-xs">{vehicle.condition}</Badge>
                        </div>
                        <CardContent className="p-3">
                          <h3 className="font-bold text-sm sm:text-base text-gray-900 truncate">
{vehicle.brand} {vehicle.model}</h3>
                          {vehicle.variant && <p className="text-xs text-gray-500 truncate">{vehicle.variant}</p>}
                          <div className="flex flex-wrap gap-1 mt-2">
                            <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs border-gray-300 text-gray-600 px-1.5 py-0.5">
                              <Calendar className="h-2.5 w-2.5" /> {vehicle.manufacturing_year}
                            </Badge>
                            <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs capitalize border-gray-300 text-gray-600 px-1.5 py-0.5">
                              <Fuel className="h-2.5 w-2.5" /> {vehicle.fuel_type}
                            </Badge>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <p className="text-lg sm:text-xl font-bold text-emerald-400">₹{formatIndianNumber(vehicle.selling_price)}</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Reviews & Enquiry */}
          <div className="space-y-4">
            {/* Customer Reviews */}
            {dealerInfo.show_testimonials && testimonials.length > 0 && (
              <Card className={`${theme.cardBg} ${theme.border}`}>
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="flex items-center gap-2 text-gray-900 text-base">
                    <Award className="h-4 w-4 text-amber-400" /> Customer Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-64 overflow-y-auto px-4 pb-4">
                  {testimonials.slice(0, 5).map((review) => (
                    <div
  key={review.id}
  className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg"
>

                      <div className="flex items-center gap-0.5 mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${star <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-600"}`}
                          />
                        ))}
                      </div>
                      {review.review && <p className="text-xs text-gray-600 mb-2">{review.review}</p>}
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                          {review.customer_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-xs text-gray-900">{review.customer_name}</p>
                          {review.is_verified && (
                            <p className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                              <CheckCircle className="h-2.5 w-2.5" /> Verified
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Rate Experience */}
            <Card className={`${theme.cardBg} ${theme.border}`}>
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="flex items-center gap-2 text-gray-900 text-base">
                  <Sparkles className="h-4 w-4 text-amber-400" /> Rate Your Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {ratingSubmitted ? (
                  <div className="text-center py-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-base font-semibold text-gray-900">Thank You!</p>
                    <p className="text-slate-400 text-xs mt-1">Your review has been submitted.</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className={`mt-3 ${theme.border} text-gray-900 hover:bg-slate-700`}
                      onClick={() => { setRatingSubmitted(false); setRatingForm({ name: "", rating: 5, review: "" }); }}
                    >
                      Submit Another
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-gray-600 text-xs">Your Name *</Label>
                      <Input 
                        value={ratingForm.name} 
                        onChange={(e) => setRatingForm({ ...ratingForm, name: e.target.value })}
                        placeholder="Enter your name"
                        className="bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-emerald-500 focus:border-emerald-500 h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-600 text-xs">Rating</Label>
                      <div className="flex gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRatingForm({ ...ratingForm, rating: star })}
                            className="p-0.5 transition-transform hover:scale-110"
                          >
                            <Star
                              className={`h-6 w-6 ${star <= ratingForm.rating ? "fill-amber-400 text-amber-400" : "text-slate-600"}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-600 text-xs">Review (Optional)</Label>
                      <Textarea 
                        value={ratingForm.review}
                        onChange={(e) => setRatingForm({ ...ratingForm, review: e.target.value })}
                        placeholder="Share your experience..."
                        rows={2}
                        className="bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-emerald-500 focus:border-emerald-500 h-9 text-sm"
                      />
                    </div>
                    <Button 
                      onClick={handleRatingSubmit} 
                      disabled={submittingRating}
                      size="sm"
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
                    >
                      {submittingRating ? "Submitting..." : "Submit Review"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enquiry Form */}
            <Card className={`${theme.cardBg} ${theme.border} sticky top-4`}>
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="flex items-center gap-2 text-gray-900 text-base">
                  <Send className="h-4 w-4 text-emerald-400" /> Send Enquiry
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {submitted ? (
                  <div className="text-center py-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-base font-semibold text-gray-900">Enquiry Submitted!</p>
                    <p className="text-slate-400 text-xs mt-1">We'll contact you soon.</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className={`mt-3 ${theme.border} text-gray-900 hover:bg-slate-700`}
                      onClick={resetEnquiryForm}
                    >
                      Send Another
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Buying/Selling Toggle */}
                    <div className="flex items-center justify-between p-2 bg-gray-100 rounded-lg">
                      <Label className="text-gray-600 text-xs">I am interested in</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={enquiryForm.leadType === "buying" ? "default" : "outline"}
                          className={`h-7 text-xs px-3 ${
  enquiryForm.leadType === "buying"
    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
    : "border border-gray-300 text-gray-700 bg-white hover:bg-gray-100"
}`}

                          onClick={() => setEnquiryForm({ ...enquiryForm, leadType: "buying" })}
                        >
                          Buying
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={enquiryForm.leadType === "selling" ? "default" : "outline"}
                          className={`h-7 text-xs px-3 ${
  enquiryForm.leadType === "selling"
    ? "bg-orange-500 hover:bg-orange-600 text-white"
    : "border border-gray-300 text-gray-700 bg-white hover:bg-gray-100"
}`}

                          onClick={() => setEnquiryForm({ ...enquiryForm, leadType: "selling" })}
                        >
                          Selling
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-600 text-xs">Name *</Label>
                      <Input 
                        value={enquiryForm.name}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, name: e.target.value })}
                        placeholder="Your name"
                        className="bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-emerald-500 focus:border-emerald-500 h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-600 text-xs">Phone *</Label>
                      <Input 
                        value={enquiryForm.phone}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                        placeholder="Your phone number"
                        className="bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-emerald-500 focus:border-emerald-500 h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-600 text-xs">City</Label>
                      <Input 
                        value={enquiryForm.city}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, city: e.target.value })}
                        placeholder="Your city"
                        className="bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-emerald-500 focus:border-emerald-500 h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-600 text-xs">Email</Label>
                      <Input 
                        type="email"
                        value={enquiryForm.email}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                        placeholder="Your email"
                        className="bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-emerald-500 focus:border-emerald-500 h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-600 text-xs">Message</Label>
                      <Textarea 
                        value={enquiryForm.message}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
                        placeholder="I'm interested in..."
                        rows={2}
                        className="bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-emerald-500 focus:border-emerald-500 h-9 text-sm"
                      />
                    </div>
                    <Button 
                      onClick={handleEnquiry} 
                      disabled={submitting}
                      size="sm"
                      className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0"
                    >
                      <Send className="h-3.5 w-3.5 mr-2" />
                      {submitting ? "Sending..." : "Send Enquiry"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="max-w-md">
    <DealerEnquiryForm
      dealerInfo={dealerInfo}
      pageId={pageId!}
      compact
    />
  </DialogContent>
</Dialog>


      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12">
        <div className="w-full px-4 sm:px-6 py-6 text-center">
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} {dealerInfo.dealer_name}. Powered by VahanHub
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DealerPublicPage;
