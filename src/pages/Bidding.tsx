import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatters";
import {
  Gavel, Clock, TrendingUp, Users, CheckCircle, XCircle, AlertTriangle,
  Car, Play, Pause, Timer, DollarSign, ArrowUp, Crown, History
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CarLoader from "@/components/CarLoader";
import Layout from "@/components/Layout";

interface Auction {
  id: string;
  vehicle_id: string;
  title: string;
  description: string;
  starting_price: number;
  current_bid: number;
  bid_count: number;
  start_time: string;
  end_time: string;
  status: string;
  winner_id: string | null;
  final_price: number | null;
  seller_confirmed: boolean;
  dealer_confirmed: boolean;
  vehicle?: any;
}

interface Bid {
  id: string;
  auction_id: string;
  bidder_id: string;
  bid_amount: number;
  is_winning: boolean;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  auction_live: "bg-emerald-100 text-emerald-700",
  auction_ended: "bg-blue-100 text-blue-700",
  post_bid_seller_pending: "bg-amber-100 text-amber-700",
  post_bid_dealer_pending: "bg-orange-100 text-orange-700",
  post_bid_negotiation: "bg-purple-100 text-purple-700",
  payment_pending: "bg-cyan-100 text-cyan-700",
  sold: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-700",
};

const Bidding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidAmount, setBidAmount] = useState("");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Create auction form
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newAuction, setNewAuction] = useState({
    vehicleId: "",
    title: "",
    description: "",
    startingPrice: "",
    reservePrice: "",
    duration: "24", // hours
  });

  useEffect(() => {
    checkUserAndFetch();
    setupRealtimeSubscription();
  }, []);

  const checkUserAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    if (user) {
      const { data: adminData } = await supabase
        .from("marketplace_admins")
        .select("*")
        .eq("user_id", user.id)
        .single();
      setIsAdmin(!!adminData);
    }

    await fetchAuctions();
    await fetchVehicles();
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('auction-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'auction_listings' },
        (payload) => {
          console.log('Auction update:', payload);
          fetchAuctions();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'auction_bids' },
        (payload) => {
          console.log('New bid:', payload);
          if (selectedAuction) {
            fetchBids(selectedAuction.id);
          }
          fetchAuctions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchAuctions = async () => {
    try {
      const { data, error } = await supabase
        .from("auction_listings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch vehicle details for each auction
      const auctionsWithVehicles = await Promise.all(
        (data || []).map(async (auction) => {
          if (auction.vehicle_id) {
            const { data: vehicle } = await supabase
              .from("vehicles")
              .select("*")
              .eq("id", auction.vehicle_id)
              .single();
            return { ...auction, vehicle };
          }
          return auction;
        })
      );

      setAuctions(auctionsWithVehicles);
    } catch (error: any) {
      console.error("Error fetching auctions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("vehicles")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "in_stock");

    setVehicles(data || []);
  };

  const fetchBids = async (auctionId: string) => {
    const { data, error } = await supabase
      .from("auction_bids")
      .select("*")
      .eq("auction_id", auctionId)
      .order("bid_amount", { ascending: false });

    if (!error) {
      setBids(data || []);
    }
  };

  const handleCreateAuction = async () => {
    if (!currentUser || !isAdmin) {
      toast({ title: "Access denied", variant: "destructive" });
      return;
    }

    if (!newAuction.vehicleId || !newAuction.title || !newAuction.startingPrice) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + parseInt(newAuction.duration) * 60 * 60 * 1000);

    try {
      const { error } = await supabase.from("auction_listings").insert({
        vehicle_id: newAuction.vehicleId,
        created_by: currentUser.id,
        title: newAuction.title,
        description: newAuction.description,
        starting_price: parseFloat(newAuction.startingPrice),
        reserve_price: newAuction.reservePrice ? parseFloat(newAuction.reservePrice) : null,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: "auction_live",
      });

      if (error) throw error;

      toast({ title: "Auction created successfully!" });
      setCreateDialogOpen(false);
      setNewAuction({ vehicleId: "", title: "", description: "", startingPrice: "", reservePrice: "", duration: "24" });
      fetchAuctions();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handlePlaceBid = async (auctionId: string) => {
    if (!currentUser) {
      toast({ title: "Please login to bid", variant: "destructive" });
      return;
    }

    const auction = auctions.find(a => a.id === auctionId);
    if (!auction) return;

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= auction.current_bid) {
      toast({ title: "Bid must be higher than current bid", variant: "destructive" });
      return;
    }

    try {
      // Insert the bid
      const { error: bidError } = await supabase.from("auction_bids").insert({
        auction_id: auctionId,
        bidder_id: currentUser.id,
        bid_amount: amount,
        is_winning: true,
      });

      if (bidError) throw bidError;

      // Update auction with new highest bid
      const { error: updateError } = await supabase
        .from("auction_listings")
        .update({
          current_bid: amount,
          current_bidder_id: currentUser.id,
          bid_count: auction.bid_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", auctionId);

      if (updateError) throw updateError;

      toast({ title: "Bid placed successfully!" });
      setBidAmount("");
      fetchAuctions();
      if (selectedAuction?.id === auctionId) {
        fetchBids(auctionId);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleStatusChange = async (auctionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("auction_listings")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", auctionId);

      if (error) throw error;

      // Log state change
      await supabase.from("auction_state_log").insert({
        auction_id: auctionId,
        from_status: auctions.find(a => a.id === auctionId)?.status,
        to_status: newStatus,
        performed_by: currentUser?.id,
      });

      toast({ title: `Status updated to ${newStatus}` });
      fetchAuctions();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
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
      return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const liveAuctions = auctions.filter(a => a.status === "auction_live");
  const postBidAuctions = auctions.filter(a => 
    ["auction_ended", "post_bid_seller_pending", "post_bid_dealer_pending", "post_bid_negotiation", "payment_pending"].includes(a.status)
  );
  const completedAuctions = auctions.filter(a => ["sold", "failed", "cancelled"].includes(a.status));

  if (loading) {
    return <Layout><CarLoader /></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Gavel className="h-7 w-7 text-blue-600" />
              Vehicle Bidding
            </h1>
            <p className="text-slate-500 mt-1">Real-time auctions with post-bid workflow</p>
          </div>
          {isAdmin && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Play className="h-4 w-4" />
                  Create Auction
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Auction</DialogTitle>
                  <DialogDescription>Set up a vehicle auction with bidding timeline</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Select 
                    value={newAuction.vehicleId} 
                    onValueChange={(v) => setNewAuction({ ...newAuction, vehicleId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.manufacturing_year} {v.brand} {v.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Auction Title *"
                    value={newAuction.title}
                    onChange={(e) => setNewAuction({ ...newAuction, title: e.target.value })}
                  />
                  <Textarea
                    placeholder="Description"
                    value={newAuction.description}
                    onChange={(e) => setNewAuction({ ...newAuction, description: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Starting Price *"
                      type="number"
                      value={newAuction.startingPrice}
                      onChange={(e) => setNewAuction({ ...newAuction, startingPrice: e.target.value })}
                    />
                    <Input
                      placeholder="Reserve Price"
                      type="number"
                      value={newAuction.reservePrice}
                      onChange={(e) => setNewAuction({ ...newAuction, reservePrice: e.target.value })}
                    />
                  </div>
                  <Select
                    value={newAuction.duration}
                    onValueChange={(v) => setNewAuction({ ...newAuction, duration: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Hour</SelectItem>
                      <SelectItem value="6">6 Hours</SelectItem>
                      <SelectItem value="12">12 Hours</SelectItem>
                      <SelectItem value="24">24 Hours</SelectItem>
                      <SelectItem value="48">48 Hours</SelectItem>
                      <SelectItem value="72">3 Days</SelectItem>
                      <SelectItem value="168">7 Days</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleCreateAuction} className="w-full">
                    Start Auction
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Live Auctions", value: liveAuctions.length, icon: Play, color: "text-emerald-600 bg-emerald-50" },
            { label: "Post-Bid", value: postBidAuctions.length, icon: Clock, color: "text-amber-600 bg-amber-50" },
            { label: "Completed", value: completedAuctions.length, icon: CheckCircle, color: "text-blue-600 bg-blue-50" },
            { label: "Total Bids", value: auctions.reduce((sum, a) => sum + a.bid_count, 0), icon: Gavel, color: "text-purple-600 bg-purple-50" },
          ].map((stat, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="live" className="space-y-4">
          <TabsList>
            <TabsTrigger value="live" className="gap-2">
              <Play className="h-4 w-4" /> Live ({liveAuctions.length})
            </TabsTrigger>
            <TabsTrigger value="postbid" className="gap-2">
              <Clock className="h-4 w-4" /> Post-Bid ({postBidAuctions.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <History className="h-4 w-4" /> History ({completedAuctions.length})
            </TabsTrigger>
          </TabsList>

          {/* Live Auctions */}
          <TabsContent value="live">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveAuctions.map((auction) => (
                <Card key={auction.id} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="aspect-video bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center relative">
                    {auction.vehicle ? (
                      <div className="text-white text-center p-4">
                        <Car className="h-12 w-12 mx-auto mb-2 opacity-80" />
                        <p className="font-semibold">{auction.vehicle.brand} {auction.vehicle.model}</p>
                        <p className="text-sm opacity-80">{auction.vehicle.manufacturing_year}</p>
                      </div>
                    ) : (
                      <Car className="h-16 w-16 text-white/50" />
                    )}
                    <Badge className="absolute top-3 left-3 bg-emerald-500 text-white border-0 animate-pulse">
                      <Play className="h-3 w-3 mr-1" /> LIVE
                    </Badge>
                    <Badge className="absolute top-3 right-3 bg-white/20 text-white border-0">
                      <Users className="h-3 w-3 mr-1" /> {auction.bid_count} bids
                    </Badge>
                  </div>
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <h3 className="font-semibold text-slate-900 line-clamp-1">{auction.title}</h3>
                      <p className="text-sm text-slate-500 line-clamp-1">{auction.description}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-500">Current Bid</p>
                        <p className="text-xl font-bold text-emerald-600">
                          {formatCurrency(auction.current_bid || auction.starting_price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Time Left</p>
                        <p className="text-lg font-semibold text-amber-600 flex items-center gap-1">
                          <Timer className="h-4 w-4" />
                          {getTimeRemaining(auction.end_time)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder={`Min: ₹${(auction.current_bid || auction.starting_price) + 1000}`}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        onClick={() => handlePlaceBid(auction.id)}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <ArrowUp className="h-4 w-4 mr-1" /> Bid
                      </Button>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(`/marketplace/auction/${auction.id}`)}
                    >
                      View Details & Bid
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {liveAuctions.length === 0 && (
                <div className="col-span-full text-center py-16 text-slate-500">
                  <Gavel className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium">No live auctions</p>
                  <p className="text-sm">Check back later or create a new auction</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Post-Bid Workflow */}
          <TabsContent value="postbid">
            <div className="space-y-4">
              {postBidAuctions.map((auction) => (
                <Card key={auction.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Car className="h-8 w-8 text-slate-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{auction.title}</h3>
                          <p className="text-sm text-slate-500">
                            Winning bid: {formatCurrency(auction.current_bid)}
                          </p>
                          <Badge className={`mt-1 ${statusColors[auction.status]} border-0`}>
                            {auction.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="flex gap-2">
                          <Select
                            value={auction.status}
                            onValueChange={(v) => handleStatusChange(auction.id, v)}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="post_bid_seller_pending">Seller Pending</SelectItem>
                              <SelectItem value="post_bid_dealer_pending">Dealer Pending</SelectItem>
                              <SelectItem value="post_bid_negotiation">Negotiation</SelectItem>
                              <SelectItem value="payment_pending">Payment Pending</SelectItem>
                              <SelectItem value="sold">Mark as Sold</SelectItem>
                              <SelectItem value="failed">Mark as Failed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* Post-bid workflow status */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-4 text-sm">
                        <div className={`flex items-center gap-1 ${auction.seller_confirmed ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {auction.seller_confirmed ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                          Seller {auction.seller_confirmed ? 'Confirmed' : 'Pending'}
                        </div>
                        <div className={`flex items-center gap-1 ${auction.dealer_confirmed ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {auction.dealer_confirmed ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                          Dealer {auction.dealer_confirmed ? 'Confirmed' : 'Pending'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {postBidAuctions.length === 0 && (
                <div className="text-center py-16 text-slate-500">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium">No pending post-bid workflows</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Completed */}
          <TabsContent value="completed">
            <div className="space-y-4">
              {completedAuctions.map((auction) => (
                <Card key={auction.id} className="border-0 shadow-sm opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Car className="h-6 w-6 text-slate-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{auction.title}</h3>
                          <p className="text-sm text-slate-500">
                            Final: {formatCurrency(auction.final_price || auction.current_bid)}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${statusColors[auction.status]} border-0`}>
                        {auction.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Bid History Dialog */}
        <Dialog open={!!selectedAuction} onOpenChange={() => setSelectedAuction(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Bid History</DialogTitle>
              <DialogDescription>{selectedAuction?.title}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {bids.map((bid, i) => (
                <div 
                  key={bid.id} 
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    i === 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {i === 0 && <Crown className="h-4 w-4 text-emerald-600" />}
                    <span className="font-medium">{formatCurrency(bid.bid_amount)}</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(bid.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
              {bids.length === 0 && (
                <p className="text-center text-slate-500 py-4">No bids yet</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Bidding;
