import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatIndianNumber } from "@/lib/formatters";
import {
  ArrowLeft, Gavel, Car, Timer, Users, TrendingUp, Crown, Clock,
  CheckCircle, Fuel, Gauge, Calendar, MapPin, Building2, Shield, Award
} from "lucide-react";
import CarLoader from "@/components/CarLoader";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import { useBidNotifications } from "@/hooks/useBidNotifications";

interface Bid {
  id: string;
  auction_id: string;
  bidder_id: string;
  bid_amount: number;
  created_at: string;
}

const AuctionDetail = () => {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { requestNotificationPermission } = useBidNotifications();

  const [loading, setLoading] = useState(true);
  const [auction, setAuction] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [dealer, setDealer] = useState<any>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidAmount, setBidAmount] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState("");

  useEffect(() => {
    if (auctionId) {
      fetchAuctionData();
      requestNotificationPermission();
    }
  }, [auctionId]);

  useEffect(() => {
    // Real-time subscription
    const channel = supabase
      .channel(`auction-${auctionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'auction_listings', filter: `id=eq.${auctionId}` },
        () => fetchAuctionData()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'auction_bids', filter: `auction_id=eq.${auctionId}` },
        () => fetchBids()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [auctionId]);

  useEffect(() => {
    // Timer update
    if (!auction?.end_time) return;

    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(auction.end_time));
    }, 1000);

    return () => clearInterval(interval);
  }, [auction?.end_time]);

  const fetchAuctionData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data: auctionData, error } = await supabase
        .from("auction_listings")
        .select("*")
        .eq("id", auctionId)
        .single();

      if (error || !auctionData) {
        setLoading(false);
        return;
      }

      setAuction(auctionData);

      // Fetch vehicle details
      if (auctionData.vehicle_id) {
        const { data: vehicleData } = await supabase
          .from("vehicles")
          .select("*")
          .eq("id", auctionData.vehicle_id)
          .single();

        if (vehicleData) {
          setVehicle(vehicleData);

          // Fetch vehicle images
          const { data: imagesData } = await supabase
            .from("vehicle_images")
            .select("*")
            .eq("vehicle_id", vehicleData.id)
            .order("is_primary", { ascending: false });

          setImages(imagesData || []);

          // Fetch dealer info
          const { data: dealerData } = await supabase
            .from("settings")
            .select("*")
            .eq("user_id", vehicleData.user_id)
            .single();

          setDealer(dealerData);
        }
      }

      await fetchBids();
    } catch (error) {
      console.error("Error fetching auction:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBids = async () => {
    const { data } = await supabase
      .from("auction_bids")
      .select("*")
      .eq("auction_id", auctionId)
      .order("bid_amount", { ascending: false });

    setBids(data || []);
  };

  const getTimeRemaining = (endTime: string) => {
    const end = new Date(endTime).getTime();
    const now = Date.now();
    const diff = end - now;

    if (diff <= 0) return "Ended";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 24) {
      return `${Math.floor(hours / 24)}d ${hours % 24}h ${minutes}m`;
    }
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const handlePlaceBid = async () => {
    if (!currentUser) {
      toast({ title: "Please login to bid", variant: "destructive" });
      return;
    }

    const amount = parseFloat(bidAmount);
    const minBid = (auction.current_bid || auction.starting_price) + 1000;

    if (isNaN(amount) || amount < minBid) {
      toast({ title: `Minimum bid is ₹${minBid.toLocaleString('en-IN')}`, variant: "destructive" });
      return;
    }

    try {
      const { error: bidError } = await supabase.from("auction_bids").insert({
        auction_id: auction.id,
        bidder_id: currentUser.id,
        bid_amount: amount,
        is_winning: true,
      });

      if (bidError) throw bidError;

      const { error: updateError } = await supabase
        .from("auction_listings")
        .update({
          current_bid: amount,
          current_bidder_id: currentUser.id,
          bid_count: (auction.bid_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", auction.id);

      if (updateError) throw updateError;

      toast({ title: "🎉 Bid placed successfully!" });
      setBidAmount("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-slate-100 text-slate-700",
    auction_live: "bg-emerald-100 text-emerald-700",
    auction_ended: "bg-blue-100 text-blue-700",
    post_bid_seller_pending: "bg-amber-100 text-amber-700",
    sold: "bg-emerald-100 text-emerald-700",
  };

  if (loading) return <CarLoader />;

  if (!auction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Auction Not Found</h2>
          <Button onClick={() => navigate("/bidding")}>Back to Auctions</Button>
        </Card>
      </div>
    );
  }

  const isLive = auction.status === "auction_live";
  const currentBid = auction.current_bid || auction.starting_price;
  const minBid = currentBid + 1000;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/bidding")} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Back to Auctions</span>
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <Gavel className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-slate-900">VahanHub Auctions</span>
          </Link>
          <Badge className={statusColors[auction.status] || "bg-slate-100"}>
            {auction.status === "auction_live" && <span className="h-2 w-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />}
            {auction.status.replace(/_/g, ' ')}
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Vehicle Details */}
          <div className="lg:col-span-2 space-y-4">
            {/* Main Image */}
            <Card className="overflow-hidden border-0 shadow-lg rounded-2xl">
              <div className="relative aspect-video bg-slate-100">
                {images.length > 0 ? (
                  <img
                    src={images[0]?.image_url}
                    alt={vehicle?.brand}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className="h-24 w-24 text-slate-300" />
                  </div>
                )}
                
                {/* Live Badge */}
                {isLive && (
                  <Badge className="absolute top-4 left-4 bg-red-500 text-white border-0 animate-pulse">
                    <span className="h-2 w-2 bg-white rounded-full mr-2" />
                    LIVE AUCTION
                  </Badge>
                )}

                {/* Timer */}
                <div className="absolute bottom-4 right-4 bg-black/80 text-white px-4 py-2 rounded-xl flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  <span className="font-bold">{timeRemaining}</span>
                </div>
              </div>
            </Card>

            {/* Vehicle Info */}
            {vehicle && (
              <>
                <Card className="p-5 border-0 shadow-sm rounded-2xl">
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    {vehicle.manufacturing_year} {vehicle.brand} {vehicle.model}
                  </h1>
                  <p className="text-slate-500 mb-4">{vehicle.variant}</p>
                  
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {[
                      { label: "Year", value: vehicle.manufacturing_year, icon: Calendar },
                      { label: "Fuel", value: vehicle.fuel_type, icon: Fuel },
                      { label: "KM", value: vehicle.odometer_reading ? `${(vehicle.odometer_reading / 1000).toFixed(0)}K` : "N/A", icon: Gauge },
                      { label: "Transmission", value: vehicle.transmission?.slice(0, 4), icon: null },
                      { label: "Owner", value: `${vehicle.number_of_owners || 1}st`, icon: Users },
                      { label: "Color", value: vehicle.color?.slice(0, 8) || "N/A", icon: null },
                    ].map((spec, i) => (
                      <div key={i} className="bg-slate-50 p-3 rounded-xl text-center">
                        <p className="text-lg font-bold text-slate-900 capitalize">{spec.value}</p>
                        <p className="text-xs text-slate-500">{spec.label}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Description */}
                {auction.description && (
                  <Card className="p-5 border-0 shadow-sm rounded-2xl">
                    <h3 className="font-semibold text-slate-900 mb-3">About This Auction</h3>
                    <p className="text-slate-600">{auction.description}</p>
                  </Card>
                )}
              </>
            )}

            {/* Bid History */}
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-100">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Bid History ({bids.length} bids)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-80 overflow-y-auto">
                {bids.map((bid, i) => (
                  <div
                    key={bid.id}
                    className={`flex items-center justify-between p-4 border-b border-slate-100 ${
                      i === 0 ? 'bg-emerald-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {i === 0 && <Crown className="h-5 w-5 text-amber-500" />}
                      <div className={`h-10 w-10 rounded-full ${i === 0 ? 'bg-emerald-500' : 'bg-slate-200'} flex items-center justify-center`}>
                        <Users className={`h-5 w-5 ${i === 0 ? 'text-white' : 'text-slate-500'}`} />
                      </div>
                      <div>
                        <p className={`font-bold ${i === 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                          {formatCurrency(bid.bid_amount)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {bid.bidder_id === currentUser?.id ? 'Your bid' : `Bidder #${bids.length - i}`}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">
                      {new Date(bid.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
                {bids.length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    <Gavel className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                    <p>No bids yet. Be the first!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right - Bidding Panel */}
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 shadow-xl rounded-2xl sticky top-20">
              <CardContent className="p-6 space-y-6">
                <div className="text-center">
                  <p className="text-blue-200 text-sm mb-1">Current Bid</p>
                  <p className="text-4xl font-bold">{formatCurrency(currentBid)}</p>
                  <p className="text-blue-200 text-sm mt-2 flex items-center justify-center gap-1">
                    <Users className="h-4 w-4" />
                    {auction.bid_count || 0} bids placed
                  </p>
                </div>

                {isLive && (
                  <>
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                      <p className="text-blue-200 text-xs mb-1">Time Remaining</p>
                      <p className="text-2xl font-bold flex items-center justify-center gap-2">
                        <Timer className="h-5 w-5" />
                        {timeRemaining}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Input
                        type="number"
                        placeholder={`Min: ₹${minBid.toLocaleString('en-IN')}`}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-blue-200 h-12 text-lg"
                      />
                      <Button
                        onClick={handlePlaceBid}
                        className="w-full h-12 bg-white text-blue-600 hover:bg-blue-50 font-bold text-lg"
                      >
                        <Gavel className="h-5 w-5 mr-2" />
                        Place Bid
                      </Button>
                    </div>

                    {/* Quick Bid Buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      {[1000, 5000, 10000].map((increment) => (
                        <Button
                          key={increment}
                          variant="outline"
                          className="border-white/30 text-white hover:bg-white/10"
                          onClick={() => setBidAmount((currentBid + increment).toString())}
                        >
                          +₹{formatIndianNumber(increment)}
                        </Button>
                      ))}
                    </div>
                  </>
                )}

                {!isLive && (
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <p className="text-lg font-semibold">Auction has ended</p>
                    {auction.current_bidder_id === currentUser?.id && (
                      <Badge className="mt-2 bg-amber-500 border-0">
                        <Crown className="h-3 w-3 mr-1" />
                        You won!
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dealer Info */}
            {dealer && (
              <Card className="border-0 shadow-sm rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  {dealer.shop_logo_url ? (
                    <img src={dealer.shop_logo_url} alt="" className="h-12 w-12 rounded-xl object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-900">{dealer.dealer_name}</p>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {dealer.dealer_address?.split(",").slice(-2, -1).join("").trim() || "India"}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Trust Badges */}
            <Card className="border-0 shadow-sm rounded-2xl p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-slate-600">Verified by VahanHub</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Award className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-slate-600">Secure bidding platform</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <MarketplaceFooter />
    </div>
  );
};

export default AuctionDetail;
