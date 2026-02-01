import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, MapPin, Phone, MessageCircle, Star, Car,
  Building2, Clock, ExternalLink, Shield, CheckCircle
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { trackPublicEvent } from "@/lib/publicAnalytics";
import { DealerPageSkeleton } from "@/components/marketplace/ShimmerSkeleton";
import DealerEnquiryForm from "@/components/public/DealerEnquiryForm";
const MarketplaceDealer = () => {
  const { dealerId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [dealer, setDealer] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehicleImages, setVehicleImages] = useState<Record<string, string>>({});
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [stats, setStats] = useState({ vehiclesSold: 0, avgRating: 0, totalReviews: 0 });

  useEffect(() => {
    if (dealerId) fetchDealer();
  }, [dealerId]);

  const fetchDealer = async () => {
    try {
      // Fetch dealer settings
      const { data: dealerData, error } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", dealerId)
        .eq("marketplace_enabled", true)
        .single();

      if (error || !dealerData) {
        setLoading(false);
        return;
      }

      setDealer(dealerData);

      // Track page view
      await trackPublicEvent({
        eventType: "dealer_view",
        dealerUserId: dealerId!,
        publicPageId: "marketplace"
      });

      // Fetch vehicles
      const { data: vehiclesData } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", dealerId)
        .eq("is_public", true)
        .eq("status", "in_stock");

      setVehicles(vehiclesData || []);

      // Fetch vehicle images - get ALL images, not just primary
      if (vehiclesData && vehiclesData.length > 0) {
        const vehicleIds = vehiclesData.map(v => v.id);
        const { data: imagesData } = await supabase
          .from("vehicle_images")
          .select("*")
          .in("vehicle_id", vehicleIds);

        // Create image map - prefer primary, otherwise use first available
        const imageMap: Record<string, string> = {};
        (imagesData || []).forEach(img => {
          if (!imageMap[img.vehicle_id] || img.is_primary) {
            imageMap[img.vehicle_id] = img.image_url;
          }
        });
        setVehicleImages(imageMap);
      }

      // Fetch testimonials
      const { data: reviewsData } = await supabase
        .from("dealer_testimonials")
        .select("*")
        .eq("user_id", dealerId)
        .eq("is_verified", true)
        .order("created_at", { ascending: false })
        .limit(10);

      setTestimonials(reviewsData || []);

      // Fetch sales count
      const { data: salesData } = await supabase
        .from("sales")
        .select("id")
        .eq("user_id", dealerId)
        .eq("status", "completed");

      const avgRating = reviewsData && reviewsData.length > 0
        ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length
        : 0;

      setStats({
        vehiclesSold: salesData?.length || 0,
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviewsData?.length || 0
      });
    } catch (error) {
      console.error("Error fetching dealer:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    if (dealer?.whatsapp_number) {
      const message = encodeURIComponent(
        `Hi, I found you on VahanHub Marketplace. I'm interested in your vehicles.`
      );
      window.open(`https://wa.me/${dealer.whatsapp_number.replace(/\D/g, "")}?text=${message}`, "_blank");
      
      trackPublicEvent({
        eventType: "cta_whatsapp",
        dealerUserId: dealerId!,
        publicPageId: "marketplace"
      });
    }
  };

  const handleCall = () => {
    if (dealer?.dealer_phone) {
      trackPublicEvent({
        eventType: "cta_call",
        dealerUserId: dealerId!,
        publicPageId: "marketplace"
      });
    }
  };

  if (loading) {
    return <DealerPageSkeleton />;
  }

  if (!dealer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Dealer Not Found</h2>
          <p className="text-slate-500 mb-4">This dealer is not available on the marketplace.</p>
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
          <div className="w-10" />
        </div>
      </header>

      {/* Dealer Hero */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {dealer.shop_logo_url ? (
              <img 
                src={dealer.shop_logo_url} 
                alt={dealer.dealer_name} 
                className="h-24 w-24 rounded-2xl object-cover border-4 border-white/20 shadow-lg"
              />
            ) : (
              <div className="h-24 w-24 rounded-2xl bg-white/20 flex items-center justify-center">
                <Building2 className="h-12 w-12" />
              </div>
            )}
            <div className="text-center md:text-left flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold">{dealer.dealer_name}</h1>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <Badge className="bg-white/20 text-white border-0">
                    <CheckCircle className="h-3 w-3 mr-1" /> Verified
                  </Badge>
                  {dealer.marketplace_badge && (
                    <Badge className="bg-amber-400 text-amber-900 border-0">
                      {dealer.marketplace_badge}
                    </Badge>
                  )}
                </div>
              </div>
              {dealer.shop_tagline && (
                <p className="text-white/80 mb-3">{dealer.shop_tagline}</p>
              )}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm">
                {stats.avgRating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold">{stats.avgRating}</span>
                    <span className="text-white/70">({stats.totalReviews} reviews)</span>
                  </div>
                )}
                <span className="text-white/50">•</span>
                <span>{vehicles.length} Vehicles</span>
                {stats.vehiclesSold > 0 && (
                  <>
                    <span className="text-white/50">•</span>
                    <span>{stats.vehiclesSold}+ Sold</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {dealer.dealer_phone && (
                <a href={`tel:${dealer.dealer_phone}`} onClick={handleCall}>
                  <Button variant="secondary" className="gap-2">
                    <Phone className="h-4 w-4" /> Call
                  </Button>
                </a>
              )}
              {dealer.whatsapp_number && (
                <Button 
                  className="gap-2 bg-emerald-500 hover:bg-emerald-600"
                  onClick={handleWhatsApp}
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Vehicles */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dealer.dealer_address && (
                <Card className="p-4 border-0 shadow-sm rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Location</p>
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {dealer.dealer_address.split(",").slice(-2, -1).join("").trim()}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
              {dealer.marketplace_working_hours && (
                <Card className="p-4 border-0 shadow-sm rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Working Hours</p>
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {dealer.marketplace_working_hours}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
              <Card className="p-4 border-0 shadow-sm rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Trust</p>
                    <p className="text-sm font-medium text-slate-900">Verified Dealer</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Description */}
            {dealer.marketplace_description && (
              <Card className="p-6 border-0 shadow-sm rounded-2xl">
                <h3 className="font-semibold text-slate-900 mb-3">About</h3>
                <p className="text-slate-600">{dealer.marketplace_description}</p>
              </Card>
            )}

            {/* Vehicles */}
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Available Vehicles ({vehicles.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {vehicles.map(vehicle => (
                  <Link key={vehicle.id} to={`/marketplace/vehicle/${vehicle.id}`} className="group">
                    <Card className="overflow-hidden border-0 shadow-sm rounded-2xl hover:shadow-lg transition-all">
                      <div className="relative aspect-[4/3] bg-slate-100">
                        {vehicleImages[vehicle.id] ? (
                          <img
                            src={vehicleImages[vehicle.id]}
                            alt={`${vehicle.brand} ${vehicle.model}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="h-12 w-12 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h4 className="font-semibold text-slate-900 text-sm line-clamp-1">
                          {vehicle.manufacturing_year} {vehicle.brand} {vehicle.model}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span>{vehicle.fuel_type}</span>
                          <span>•</span>
                          <span>{vehicle.transmission}</span>
                        </div>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="font-bold text-blue-600">
                            {formatCurrency(vehicle.selling_price)}
                          </span>
                          {vehicle.strikeout_price && vehicle.strikeout_price > vehicle.selling_price && (
                            <span className="text-xs text-slate-400 line-through">
                              {formatCurrency(vehicle.strikeout_price)}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
                {vehicles.length === 0 && (
                  <div className="col-span-full text-center py-12 text-slate-500">
                    No vehicles listed yet
                  </div>
                )}
              </div>
            </div>

            {/* Reviews */}
            {testimonials.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Customer Reviews</h3>
                <div className="space-y-4">
                  {testimonials.slice(0, 5).map(review => (
                    <Card key={review.id} className="p-4 border-0 shadow-sm rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                          <span className="font-semibold text-slate-600">
                            {review.customer_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-slate-900">{review.customer_name}</span>
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          {review.review && (
                            <p className="text-sm text-slate-600">{review.review}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Enquiry Form */}
          <div className="space-y-4">
            <div className="sticky top-20">
              <DealerEnquiryForm 
                dealerInfo={{ 
                  user_id: dealerId!, 
                  public_page_id: dealer.public_page_id,
                  dealer_name: dealer.dealer_name 
                }} 
                pageId="marketplace"
              />
            </div>

            {/* Public page link */}
            {dealer.public_page_id && (
              <Card className="p-4 border-0 shadow-sm rounded-xl">
                <Link 
                  to={`/d/${dealer.public_page_id}`}
                  className="flex items-center justify-between text-blue-600 hover:text-blue-700"
                >
                  <span className="text-sm font-medium">Visit Dealer's Website</span>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceDealer;
