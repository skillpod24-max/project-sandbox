import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, Phone, Mail, MessageCircle, Star, Car,
  Send, CheckCircle, ExternalLink, Award, Sparkles,
  Shield, Clock, ArrowRight, PhoneCall, ThumbsUp
} from "lucide-react";
import { formatIndianNumber } from "@/lib/formatters";
import { createPublicLead } from "@/lib/leads";
import CarLoader from "@/components/CarLoader";
import { trackPublicEvent } from "@/lib/publicAnalytics";
import { useScrollTracking } from "@/lib/useScrollTracking";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAutoLeadPopup } from "@/lib/useAutoLeadPopup";
import DealerEnquiryForm from "@/components/public/DealerEnquiryForm";
import CatalogueVehicleCard from "@/components/catalogue/CatalogueVehicleCard";
import { getAccent } from "@/components/catalogue/CatalogueThemeProvider";

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
  const [enquiryForm, setEnquiryForm] = useState<{ name: string; phone: string; email: string; city: string; message: string; leadType: "buying" | "selling" }>({ name: "", phone: "", email: "", city: "", message: "", leadType: "buying" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formOpened, setFormOpened] = useState(false);
  const [ratingForm, setRatingForm] = useState({ name: "", rating: 5, review: "" });
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [liveStats, setLiveStats] = useState({ viewsToday: 0, enquiriesToday: 0 });

  useScrollTracking({
    dealerUserId: dealerInfo?.user_id,
    publicPageId: pageId || "",
  });

  const { open, setOpen } = useAutoLeadPopup({
    enabled: dealerInfo?.enable_auto_lead_popup === true,
    scrollPercent: 40,
    onceKey: `dealer-${pageId}`,
  });

  const handleInlineFormFocus = useCallback(() => {
    if (!formOpened && dealerInfo?.user_id && pageId) {
      setFormOpened(true);
      trackPublicEvent({ eventType: "form_opened", dealerUserId: dealerInfo.user_id, publicPageId: pageId });
    }
  }, [formOpened, dealerInfo?.user_id, pageId]);

  useEffect(() => {
    return () => {
      if (formOpened && !submitted && dealerInfo?.user_id && pageId) {
        trackPublicEvent({ eventType: "form_abandoned", dealerUserId: dealerInfo.user_id, publicPageId: pageId });
      }
    };
  }, [formOpened, submitted, dealerInfo?.user_id, pageId]);

  // Template & accent
  const template = dealerInfo?.catalogue_template || "classic";
  const accent = getAccent(dealerInfo?.public_page_theme);

  useEffect(() => {
    if (pageId) fetchDealerData();
  }, [pageId]);

  const fetchDealerData = async () => {
    try {
      const { data: settings, error } = await supabase
        .from("settings").select("*")
        .eq("public_page_id", pageId).eq("public_page_enabled", true).single();

      if (error || !settings) { setLoading(false); return; }
      setDealerInfo(settings);

      await trackPublicEvent({ eventType: "page_view", dealerUserId: settings.user_id, publicPageId: pageId! });
      await fetchLiveStats(settings.user_id);

      const { data: publicVehicles } = await supabase
        .from("vehicles").select("*")
        .eq("user_id", settings.user_id).eq("is_public", true).eq("status", "in_stock");
      setVehicles(publicVehicles || []);

      if (publicVehicles && publicVehicles.length > 0) {
        const vehicleIds = publicVehicles.map(v => v.id);
        const { data: images } = await supabase.from("vehicle_images").select("*").in("vehicle_id", vehicleIds);
        const imagesMap: Record<string, any[]> = {};
        (images || []).forEach((img) => {
          if (!imagesMap[img.vehicle_id]) imagesMap[img.vehicle_id] = [];
          imagesMap[img.vehicle_id].push(img);
        });
        setVehicleImages(imagesMap);
      }

      const { data: reviews } = await supabase
        .from("dealer_testimonials").select("*")
        .eq("user_id", settings.user_id).order("created_at", { ascending: false }).limit(10);
      setTestimonials(reviews || []);

      const { data: sales } = await supabase
        .from("sales").select("id").eq("user_id", settings.user_id).eq("status", "completed");

      const totalSales = sales?.length || 0;
      const avgRating = reviews && reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
      setStats({ vehiclesSold: totalSales, avgRating: Math.round(avgRating * 10) / 10, totalReviews: reviews?.length || 0 });
    } catch (error) {
      console.error("Error fetching dealer data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveStats = async (dealerUserId: string) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const { data } = await supabase.from("public_page_events").select("event_type").eq("dealer_user_id", dealerUserId).gte("created_at", today.toISOString());
    if (!data) return;
    setLiveStats({ viewsToday: data.filter(e => e.event_type === "page_view").length, enquiriesToday: data.filter(e => e.event_type === "enquiry_submit").length });
  };

  const handleEnquiry = async () => {
    if (!enquiryForm.name || !enquiryForm.phone) {
      toast({ title: "Please fill required fields", variant: "destructive" }); return;
    }
    setSubmitting(true);
    try {
      const notesParts = [];
      if (enquiryForm.leadType) notesParts.push(`[${enquiryForm.leadType.toUpperCase()}]`);
      if (enquiryForm.city) notesParts.push(`City: ${enquiryForm.city}`);
      if (enquiryForm.message) notesParts.push(enquiryForm.message);
      await createPublicLead({
        dealerUserId: dealerInfo.user_id, customerName: enquiryForm.name, phone: enquiryForm.phone,
        email: enquiryForm.email || undefined, city: enquiryForm.city || undefined,
        notes: notesParts.join(" | ") || undefined, source: "website", lead_type: enquiryForm.leadType,
      });
      setSubmitted(true);
      toast({ title: "Enquiry submitted successfully!" });
      await trackPublicEvent({ eventType: "enquiry_submit", dealerUserId: dealerInfo.user_id, publicPageId: pageId! });
    } catch (error: any) {
      toast({ title: "Error", description: error.message ?? "Failed", variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const resetEnquiryForm = () => { setEnquiryForm({ name: "", phone: "", email: "", city: "", message: "", leadType: "buying" }); setSubmitted(false); };

  const handleRatingSubmit = async () => {
    if (!ratingForm.name) { toast({ title: "Please enter your name", variant: "destructive" }); return; }
    setSubmittingRating(true);
    try {
      const { error } = await supabase.from("dealer_testimonials").insert({ user_id: dealerInfo.user_id, customer_name: ratingForm.name, rating: ratingForm.rating, review: ratingForm.review || null, is_verified: false });
      if (error) throw error;
      setRatingSubmitted(true); toast({ title: "Thank you for your review!" }); fetchDealerData();
    } catch (error: any) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    finally { setSubmittingRating(false); }
  };

  const handleVehicleClick = (vehicle: any) => {
    if (vehicle.public_page_id) navigate(`/v/${vehicle.public_page_id}`);
  };

  if (loading) return <CarLoader variant="center" text="Loading, hold on!" />;

  if (!dealerInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
          <p className="text-gray-500">This dealer page is not available or has been disabled.</p>
        </Card>
      </div>
    );
  }

  const isPremium = template === "premium";
  const isModern = template === "modern";
  const isShowroom = template === "showroom";
  const isMinimal = template === "minimal";

  const pageBg = isPremium ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-900";
  const cardBg = isPremium ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200";
  const textPrimary = isPremium ? "text-white" : "text-gray-900";
  const textSecondary = isPremium ? "text-gray-400" : "text-gray-600";
  const textMuted = isPremium ? "text-gray-500" : "text-gray-400";
  const inputClasses = isPremium
    ? "bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:ring-1"
    : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-1";

  // Vehicle grid columns per template
  const gridCols = isMinimal ? "grid-cols-1" : isShowroom ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={`min-h-screen ${pageBg}`}>
      {/* ============ HERO SECTION ============ */}
      {isModern ? (
        // Modern: Full-width gradient hero
        <div className={`relative overflow-hidden bg-gradient-to-br ${accent.gradient} py-16 sm:py-20`}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative w-full px-4 sm:px-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {dealerInfo.shop_logo_url && (
                <img src={dealerInfo.shop_logo_url} alt={dealerInfo.dealer_name} className="h-24 w-24 sm:h-28 sm:w-28 object-contain rounded-2xl bg-white/20 backdrop-blur-sm p-3 border border-white/20" />
              )}
              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">{dealerInfo.dealer_name || "Dealer"}</h1>
                {dealerInfo.shop_tagline && <p className="text-lg text-white/80 mt-2">{dealerInfo.shop_tagline}</p>}
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                  {renderTrustBadges(true)}
                </div>
              </div>
              <div className="flex flex-row md:flex-col gap-2">
                {renderCtaButtons(true)}
              </div>
            </div>
          </div>
        </div>
      ) : isPremium ? (
        // Premium: Dark gradient hero
        <div className="relative border-b border-gray-800">
          <div className={`absolute inset-0 bg-gradient-to-r ${accent.gradient} opacity-10`} />
          <div className="w-full px-4 sm:px-8 max-w-6xl mx-auto py-10 sm:py-14 relative">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {dealerInfo.shop_logo_url && (
                <div className="relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${accent.gradient} rounded-2xl blur-xl opacity-40`} />
                  <img src={dealerInfo.shop_logo_url} alt={dealerInfo.dealer_name} className="relative h-28 w-28 sm:h-32 sm:w-32 object-contain rounded-2xl bg-gray-800 p-3 border border-gray-700" />
                </div>
              )}
              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{dealerInfo.dealer_name || "Dealer"}</h1>
                {dealerInfo.shop_tagline && <p className="text-lg text-gray-400 mt-2">{dealerInfo.shop_tagline}</p>}
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                  {renderTrustBadges(false)}
                </div>
              </div>
              <div className="flex flex-row md:flex-col gap-2">
                {renderCtaButtons(false)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Classic / Minimal / Showroom: Clean white hero
        <div className="relative border-b border-gray-200 bg-white">
          <div className="w-full px-4 sm:px-8 max-w-6xl mx-auto py-8 sm:py-12 relative">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
              {dealerInfo.shop_logo_url && (
                <div className="relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${accent.gradient} rounded-2xl blur-xl opacity-30`} />
                  <img src={dealerInfo.shop_logo_url} alt={dealerInfo.dealer_name} className="relative h-24 w-24 sm:h-32 sm:w-32 object-contain rounded-2xl bg-white p-3 border border-gray-200 shadow-sm" />
                </div>
              )}
              <div className="text-center md:text-left flex-1">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight">{dealerInfo.dealer_name || "Dealer"}</h1>
                  {dealerInfo.show_ratings && stats.avgRating > 0 && (
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-sm py-1 px-3 gap-1.5 w-fit mx-auto md:mx-0 shadow-lg">
                      <Star className="h-3.5 w-3.5 fill-white" /> {stats.avgRating} ({stats.totalReviews})
                    </Badge>
                  )}
                </div>
                {dealerInfo.shop_tagline && <p className="text-base sm:text-lg text-gray-600 mt-2">{dealerInfo.shop_tagline}</p>}
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                  {renderTrustBadges(false)}
                </div>
                {dealerInfo.dealer_address && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-3 justify-center md:justify-start">
                    <MapPin className={`h-4 w-4 ${accent.text}`} />
                    <span className="font-medium">{dealerInfo.dealer_address.split(",").slice(-3, -1).join(", ").trim()}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-row md:flex-col gap-2">
                {renderCtaButtons(false)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ TRUST BAR (Modern only) ============ */}
      {isModern && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {stats.vehiclesSold > 0 && (
              <div className="flex items-center gap-2">
                <ThumbsUp className={`h-5 w-5 ${accent.text}`} />
                <span className="text-sm font-semibold text-gray-900">{stats.vehiclesSold}+ Happy Customers</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Shield className={`h-5 w-5 ${accent.text}`} />
              <span className="text-sm font-semibold text-gray-900">Verified Dealer</span>
            </div>
            {stats.avgRating > 0 && (
              <div className="flex items-center gap-2">
                <Star className={`h-5 w-5 fill-amber-400 text-amber-400`} />
                <span className="text-sm font-semibold text-gray-900">{stats.avgRating} Rating ({stats.totalReviews} reviews)</span>
              </div>
            )}
            {dealerInfo.dealer_address && (
              <div className="flex items-center gap-2">
                <MapPin className={`h-5 w-5 ${accent.text}`} />
                <span className="text-sm text-gray-600">{dealerInfo.dealer_address.split(",").slice(-3, -1).join(", ").trim()}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ MAIN CONTENT ============ */}
      <div className="w-full px-4 sm:px-8 max-w-6xl mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Vehicles */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {dealerInfo.dealer_phone && (
                <Card className={`${cardBg} hover:shadow-md transition-all`}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className={`h-10 w-10 rounded-lg ${accent.bgLight} flex items-center justify-center`}>
                      <Phone className={`h-4 w-4 ${accent.text}`} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs ${textMuted}`}>Phone</p>
                      <p className={`font-medium text-sm truncate ${textPrimary}`}>{dealerInfo.dealer_phone}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              {dealerInfo.dealer_email && (
                <Card className={`${cardBg} hover:shadow-md transition-all`}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className={`h-10 w-10 rounded-lg ${accent.bgLight} flex items-center justify-center`}>
                      <Mail className={`h-4 w-4 ${accent.text}`} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs ${textMuted}`}>Email</p>
                      <p className={`font-medium text-sm truncate ${textPrimary}`}>{dealerInfo.dealer_email}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              {dealerInfo.gmap_link && (
                <a href={dealerInfo.gmap_link} target="_blank" rel="noopener noreferrer">
                  <Card className={`${cardBg} hover:shadow-md transition-all cursor-pointer h-full`}>
                    <CardContent className="flex items-center gap-3 p-3">
                      <div className={`h-10 w-10 rounded-lg ${accent.bgLight} flex items-center justify-center`}>
                        <MapPin className={`h-4 w-4 ${accent.text}`} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs ${textMuted}`}>Location</p>
                        <p className={`font-medium text-sm ${textPrimary}`}>View on Maps</p>
                      </div>
                      <ExternalLink className={`h-3.5 w-3.5 ${textMuted}`} />
                    </CardContent>
                  </Card>
                </a>
              )}
            </div>

            {/* Vehicles Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-bold flex items-center gap-2 ${textPrimary}`}>
                  <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${accent.gradient} flex items-center justify-center`}>
                    <Car className="h-4 w-4 text-white" />
                  </div>
                  Available Vehicles ({vehicles.length})
                </h2>
              </div>
              {vehicles.length === 0 ? (
                <Card className={`p-10 text-center ${cardBg}`}>
                  <Car className={`h-14 w-14 mx-auto ${textMuted} mb-3`} />
                  <p className={`text-sm ${textSecondary}`}>No vehicles currently available.</p>
                </Card>
              ) : (
                <div className={`grid ${gridCols} gap-3 sm:gap-4`}>
                  {vehicles.map((vehicle) => (
                    <CatalogueVehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      images={vehicleImages[vehicle.id] || []}
                      accent={accent}
                      template={template}
                      onClick={() => handleVehicleClick(vehicle)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sticky Sidebar */}
          <div className="space-y-4">
            {/* Quick Connect CTA */}
            <Card className={`${cardBg} overflow-hidden`}>
              <div className={`bg-gradient-to-r ${accent.gradient} p-4`}>
                <h3 className="text-white font-bold text-base flex items-center gap-2">
                  <PhoneCall className="h-4 w-4" /> Get Best Price
                </h3>
                <p className="text-white/80 text-xs mt-1">Connect with us for exclusive deals</p>
              </div>
              <CardContent className="p-4 space-y-2">
                {dealerInfo.dealer_phone && (
                  <a href={`tel:${dealerInfo.dealer_phone}`} onClick={() => trackPublicEvent({ eventType: "cta_call", dealerUserId: dealerInfo.user_id, publicPageId: pageId! })}>
                    <Button variant="outline" size="sm" className="w-full gap-2 justify-start"><Phone className="h-4 w-4" /> {dealerInfo.dealer_phone}</Button>
                  </a>
                )}
                {dealerInfo.whatsapp_number && (
                  <a href={`https://wa.me/${dealerInfo.whatsapp_number.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" onClick={() => trackPublicEvent({ eventType: "cta_whatsapp", dealerUserId: dealerInfo.user_id, publicPageId: pageId! })}>
                    <Button size="sm" className="w-full gap-2 justify-start bg-green-500 hover:bg-green-600 text-white border-0"><MessageCircle className="h-4 w-4" /> WhatsApp Us</Button>
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Customer Reviews */}
            {dealerInfo.show_testimonials && testimonials.length > 0 && (
              <Card className={cardBg}>
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className={`flex items-center gap-2 text-base ${textPrimary}`}>
                    <Award className="h-4 w-4 text-amber-400" /> Customer Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-64 overflow-y-auto px-4 pb-4">
                  {testimonials.slice(0, 5).map((review) => (
                    <div key={review.id} className={`p-2.5 rounded-lg ${isPremium ? "bg-gray-800 border border-gray-700" : "bg-gray-50 border border-gray-100"}`}>
                      <div className="flex items-center gap-0.5 mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`h-3 w-3 ${star <= review.rating ? "fill-amber-400 text-amber-400" : textMuted}`} />
                        ))}
                      </div>
                      {review.review && <p className={`text-xs ${textSecondary} mb-2`}>{review.review}</p>}
                      <div className="flex items-center gap-2">
                        <div className={`h-6 w-6 rounded-full bg-gradient-to-br ${accent.gradient} flex items-center justify-center text-white text-xs font-bold`}>
                          {review.customer_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className={`font-medium text-xs ${textPrimary}`}>{review.customer_name}</p>
                          {review.is_verified && <p className={`text-[10px] ${accent.text} flex items-center gap-0.5`}><CheckCircle className="h-2.5 w-2.5" /> Verified</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Rate Experience */}
            <Card className={cardBg}>
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className={`flex items-center gap-2 text-base ${textPrimary}`}>
                  <Sparkles className="h-4 w-4 text-amber-400" /> Rate Your Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {ratingSubmitted ? (
                  <div className="text-center py-4">
                    <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${accent.gradient} flex items-center justify-center mx-auto mb-3`}>
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <p className={`text-base font-semibold ${textPrimary}`}>Thank You!</p>
                    <p className={`text-xs mt-1 ${textMuted}`}>Your review has been submitted.</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => { setRatingSubmitted(false); setRatingForm({ name: "", rating: 5, review: "" }); }}>Submit Another</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label className={`text-xs ${textSecondary}`}>Your Name *</Label>
                      <Input value={ratingForm.name} onChange={(e) => setRatingForm({ ...ratingForm, name: e.target.value })} placeholder="Enter your name" className={`${inputClasses} h-9 text-sm`} />
                    </div>
                    <div>
                      <Label className={`text-xs ${textSecondary}`}>Rating</Label>
                      <div className="flex gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} type="button" onClick={() => setRatingForm({ ...ratingForm, rating: star })} className="p-0.5 transition-transform hover:scale-110">
                            <Star className={`h-6 w-6 ${star <= ratingForm.rating ? "fill-amber-400 text-amber-400" : textMuted}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className={`text-xs ${textSecondary}`}>Review (Optional)</Label>
                      <Textarea value={ratingForm.review} onChange={(e) => setRatingForm({ ...ratingForm, review: e.target.value })} placeholder="Share your experience..." rows={2} className={`${inputClasses} text-sm`} />
                    </div>
                    <Button onClick={handleRatingSubmit} disabled={submittingRating} size="sm" className={`w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0`}>
                      {submittingRating ? "Submitting..." : "Submit Review"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enquiry Form */}
            <Card className={`${cardBg} sticky top-4`}>
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className={`flex items-center gap-2 text-base ${textPrimary}`}>
                  <Send className={`h-4 w-4 ${accent.text}`} /> Send Enquiry
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {submitted ? (
                  <div className="text-center py-4">
                    <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${accent.gradient} flex items-center justify-center mx-auto mb-3`}>
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <p className={`text-base font-semibold ${textPrimary}`}>Enquiry Submitted!</p>
                    <p className={`text-xs mt-1 ${textMuted}`}>We'll contact you soon.</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={resetEnquiryForm}>Send Another</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className={`flex items-center justify-between p-2 rounded-lg ${isPremium ? "bg-gray-800" : "bg-gray-100"}`}>
                      <Label className={`text-xs ${textSecondary}`}>I am interested in</Label>
                      <div className="flex gap-2">
                        <Button type="button" size="sm" className={`h-7 text-xs px-3 ${enquiryForm.leadType === "buying" ? `bg-gradient-to-r ${accent.gradient} text-white border-0` : ""}`} variant={enquiryForm.leadType === "buying" ? "default" : "outline"} onClick={() => setEnquiryForm({ ...enquiryForm, leadType: "buying" })}>Buying</Button>
                        <Button type="button" size="sm" className={`h-7 text-xs px-3 ${enquiryForm.leadType === "selling" ? "bg-orange-500 hover:bg-orange-600 text-white border-0" : ""}`} variant={enquiryForm.leadType === "selling" ? "default" : "outline"} onClick={() => setEnquiryForm({ ...enquiryForm, leadType: "selling" })}>Selling</Button>
                      </div>
                    </div>
                    {[
                      { key: "name", label: "Name *", placeholder: "Your name" },
                      { key: "phone", label: "Phone *", placeholder: "Your phone number" },
                      { key: "city", label: "City", placeholder: "Your city" },
                      { key: "email", label: "Email", placeholder: "Your email", type: "email" },
                    ].map(({ key, label, placeholder, type }) => (
                      <div key={key}>
                        <Label className={`text-xs ${textSecondary}`}>{label}</Label>
                        <Input
                          type={type || "text"}
                          value={(enquiryForm as any)[key]}
                          onChange={(e) => setEnquiryForm({ ...enquiryForm, [key]: e.target.value })}
                          placeholder={placeholder}
                          onFocus={handleInlineFormFocus}
                          className={`${inputClasses} h-9 text-sm`}
                        />
                      </div>
                    ))}
                    <div>
                      <Label className={`text-xs ${textSecondary}`}>Message</Label>
                      <Textarea value={enquiryForm.message} onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })} placeholder="I'm interested in..." rows={2} onFocus={handleInlineFormFocus} className={`${inputClasses} text-sm`} />
                    </div>
                    <Button onClick={handleEnquiry} disabled={submitting} size="sm" className={`w-full bg-gradient-to-r ${accent.gradient} hover:${accent.gradientHover} text-white border-0`}>
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

      {/* Auto Lead Popup */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-0">
          <div className={`bg-gradient-to-br ${accent.gradient} p-6 text-white`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span className="text-xs font-semibold">Special Offer</span>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-1">Looking for the perfect vehicle?</h3>
            <p className="text-white/80 text-sm">Share your details and get personalized recommendations from {dealerInfo?.dealer_name || "our expert team"}. Free consultation, no obligations.</p>
          </div>
          <div className="p-5">
            <DealerEnquiryForm dealerInfo={dealerInfo} pageId={pageId!} compact />
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className={`border-t ${isPremium ? "border-gray-800" : "border-gray-200"} mt-12`}>
        <div className="w-full px-4 sm:px-6 py-6 text-center">
          <p className={`text-xs ${textMuted}`}>© {new Date().getFullYear()} {dealerInfo.dealer_name}. Powered by VahanHub</p>
        </div>
      </footer>
    </div>
  );

  // ======== Helper render functions ========
  function renderTrustBadges(isWhiteText: boolean) {
    const badgeBase = isWhiteText ? "bg-white/20 text-white border-white/20" : "";
    return (
      <>
        {dealerInfo.show_vehicles_sold && stats.vehiclesSold > 0 && (
          <Badge className={`text-xs py-1 px-3 gap-1.5 ${isWhiteText ? badgeBase : "bg-gray-100 text-gray-700 border-gray-200"}`}>
            <Car className="h-3.5 w-3.5" /> {stats.vehiclesSold}+ Sold
          </Badge>
        )}
        <Badge className={`text-xs py-1 px-3 gap-1.5 ${isWhiteText ? badgeBase : "bg-blue-50 text-blue-600 border-blue-200"}`}>
          <Shield className="h-3.5 w-3.5" /> Verified Dealer
        </Badge>
        {dealerInfo.dealer_tag && (
          <Badge className={`text-xs py-1 px-3 gap-1.5 ${isWhiteText ? badgeBase : "bg-amber-50 text-amber-700 border-amber-200"}`}>
            <CheckCircle className="h-3.5 w-3.5" /> {dealerInfo.dealer_tag}
          </Badge>
        )}
        {dealerInfo.show_dealer_page_views && (
          <Badge className={`text-xs py-1 px-3 ${isWhiteText ? badgeBase : "bg-gray-100 text-gray-600 border-gray-200"}`}>
            👀 {liveStats.viewsToday} views today
          </Badge>
        )}
        {dealerInfo.show_dealer_page_enquiries && (
          <Badge className={`text-xs py-1 px-3 ${isWhiteText ? badgeBase : "bg-gray-100 text-gray-600 border-gray-200"}`}>
            ✉️ {liveStats.enquiriesToday} enquiries today
          </Badge>
        )}
      </>
    );
  }

  function renderCtaButtons(isWhiteText: boolean) {
    return (
      <>
        {dealerInfo.dealer_phone && (
          <a href={`tel:${dealerInfo.dealer_phone}`} onClick={() => trackPublicEvent({ eventType: "cta_call", dealerUserId: dealerInfo.user_id, publicPageId: pageId! })}>
            <Button variant="outline" size="sm" className={`gap-2 ${isWhiteText ? "border-white/30 text-white hover:bg-white/10" : "border-gray-300 bg-white text-gray-800 hover:bg-gray-100"}`}>
              <Phone className="h-4 w-4" /> Call
            </Button>
          </a>
        )}
        {dealerInfo.whatsapp_number && (
          <a href={`https://wa.me/${dealerInfo.whatsapp_number.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" onClick={() => trackPublicEvent({ eventType: "cta_whatsapp", dealerUserId: dealerInfo.user_id, publicPageId: pageId! })}>
            <Button size="sm" className="gap-2 bg-green-500 hover:bg-green-600 text-white border-0">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </Button>
          </a>
        )}
      </>
    );
  }
};

export default DealerPublicPage;
