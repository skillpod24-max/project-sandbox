import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatIndianNumber } from "@/lib/formatters";
import {
  Shield, Users, Car, Star, CheckCircle, XCircle, AlertTriangle,
  Sparkles, Building2, Search, MoreVertical, Eye, Ban,
  Award, TrendingUp, Calendar, Image, Upload, Settings, Gavel,
  Timer, Crown, DollarSign, MessageSquare, CreditCard, Clock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CarLoader from "@/components/CarLoader";

const MarketplaceAdmin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [dealers, setDealers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [auctions, setAuctions] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Banner customization
  const [bannerDesktopUrl, setBannerDesktopUrl] = useState("");
  const [bannerMobileUrl, setBannerMobileUrl] = useState("");
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);

  const [stats, setStats] = useState({
    totalDealers: 0,
    activeDealers: 0,
    pendingDealers: 0,
    totalVehicles: 0,
    featuredDealers: 0,
    liveAuctions: 0,
    totalBids: 0,
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: adminData } = await supabase
      .from("marketplace_admins")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!adminData) {
      toast({ title: "Access Denied", description: "You don't have admin privileges", variant: "destructive" });
      navigate("/");
      return;
    }

    setIsAdmin(true);
    fetchData();
  };

  const fetchData = async () => {
    try {
      // Fetch all marketplace-enabled dealers
      const { data: dealersData } = await supabase
        .from("settings")
        .select("*")
        .eq("marketplace_enabled", true);

      setDealers(dealersData || []);

      // Fetch all public vehicles
      const { data: vehiclesData } = await supabase
        .from("vehicles")
        .select("*")
        .eq("is_public", true);

      setVehicles(vehiclesData || []);

      // Fetch all auctions
      const { data: auctionsData } = await supabase
        .from("auction_listings")
        .select("*")
        .order("created_at", { ascending: false });

      // Enrich auctions with vehicle data
      const enrichedAuctions = await Promise.all(
        (auctionsData || []).map(async (auction) => {
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
      setAuctions(enrichedAuctions);

      // Fetch all bids with bidder info
      const { data: bidsData } = await supabase
        .from("auction_bids")
        .select("*")
        .order("created_at", { ascending: false });

      // Enrich bids with bidder profiles
      const bidderIds = [...new Set((bidsData || []).map(b => b.bidder_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", bidderIds);

      setProfiles(profilesData || []);
      setBids(bidsData || []);

      // Calculate stats
      const active = (dealersData || []).filter(d => d.marketplace_status === 'approved').length;
      const pending = (dealersData || []).filter(d => d.marketplace_status === 'pending').length;
      const featured = (dealersData || []).filter(d => d.marketplace_featured).length;
      const live = (auctionsData || []).filter(a => a.status === 'auction_live').length;

      setStats({
        totalDealers: (dealersData || []).length,
        activeDealers: active,
        pendingDealers: pending,
        totalVehicles: (vehiclesData || []).length,
        featuredDealers: featured,
        liveAuctions: live,
        totalBids: (bidsData || []).length,
      });

      // Load saved banner URLs
      const savedDesktop = localStorage.getItem('marketplace_banner_desktop');
      const savedMobile = localStorage.getItem('marketplace_banner_mobile');
      if (savedDesktop) setBannerDesktopUrl(savedDesktop);
      if (savedMobile) setBannerMobileUrl(savedMobile);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDealerAction = async (dealerId: string, action: string, badgeValue?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const updates: any = {};
      
      switch (action) {
        case 'approve':
          updates.marketplace_status = 'approved';
          break;
        case 'suspend':
          updates.marketplace_status = 'suspended';
          break;
        case 'feature':
          updates.marketplace_featured = true;
          break;
        case 'unfeature':
          updates.marketplace_featured = false;
          break;
        case 'badge_update':
          updates.marketplace_badge = badgeValue;
          break;
      }

      await supabase
        .from("settings")
        .update(updates)
        .eq("id", dealerId);

      const dealer = dealers.find(d => d.id === dealerId);
      await supabase
        .from("marketplace_moderation")
        .insert({
          target_type: 'dealer',
          target_id: dealer?.user_id,
          action,
          badge_value: badgeValue,
          performed_by: user.id,
        });

      toast({ title: "Action completed successfully" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleAuctionStatusChange = async (auctionId: string, newStatus: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const auction = auctions.find(a => a.id === auctionId);
      
      await supabase
        .from("auction_listings")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", auctionId);

      await supabase.from("auction_state_log").insert({
        auction_id: auctionId,
        from_status: auction?.status,
        to_status: newStatus,
        performed_by: user.id,
      });

      toast({ title: `Auction status updated to ${newStatus}` });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleUploadBanner = async (file: File, type: 'desktop' | 'mobile') => {
    if (type === 'desktop') setUploadingDesktop(true);
    else setUploadingMobile(true);

    try {
      const fileName = `banner-${type}-${Date.now()}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage
        .from('vehicle-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('vehicle-images')
        .getPublicUrl(fileName);

      if (type === 'desktop') {
        setBannerDesktopUrl(urlData.publicUrl);
        localStorage.setItem('marketplace_banner_desktop', urlData.publicUrl);
      } else {
        setBannerMobileUrl(urlData.publicUrl);
        localStorage.setItem('marketplace_banner_mobile', urlData.publicUrl);
      }

      toast({ title: `${type === 'desktop' ? 'Desktop' : 'Mobile'} banner uploaded!` });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      if (type === 'desktop') setUploadingDesktop(false);
      else setUploadingMobile(false);
    }
  };

  const handleSaveBanners = () => {
    localStorage.setItem('marketplace_banner_desktop', bannerDesktopUrl);
    localStorage.setItem('marketplace_banner_mobile', bannerMobileUrl);
    toast({ title: "Banners saved successfully" });
    setBannerDialogOpen(false);
  };

  const getBidderName = (bidderId: string) => {
    const profile = profiles.find(p => p.user_id === bidderId);
    return profile?.full_name || 'Unknown User';
  };

  const getBidderEmail = (bidderId: string) => {
    const profile = profiles.find(p => p.user_id === bidderId);
    return profile?.email || 'N/A';
  };

  const getDealerVehicleCount = (userId: string) => {
    return vehicles.filter(v => v.user_id === userId).length;
  };

  const filteredDealers = dealers.filter(d => {
    const matchesSearch = !searchTerm || 
      d.dealer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || d.marketplace_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  if (loading) {
    return <CarLoader />;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900">Marketplace Admin</h1>
              <p className="text-xs text-slate-500">Moderation Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={bannerDialogOpen} onOpenChange={setBannerDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Image className="h-4 w-4" />
                  Edit Banners
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Banner Customization</DialogTitle>
                  <DialogDescription>
                    Upload separate banners for desktop and mobile views
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  {/* Desktop Banner */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <span className="h-6 w-6 bg-slate-100 rounded flex items-center justify-center text-xs">🖥️</span>
                      Desktop Banner
                    </h4>
                    <Input
                      placeholder="Enter desktop banner URL..."
                      value={bannerDesktopUrl}
                      onChange={(e) => setBannerDesktopUrl(e.target.value)}
                    />
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="desktop-upload"
                        onChange={(e) => e.target.files?.[0] && handleUploadBanner(e.target.files[0], 'desktop')}
                      />
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => document.getElementById('desktop-upload')?.click()}
                        disabled={uploadingDesktop}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingDesktop ? 'Uploading...' : 'Upload Local File'}
                      </Button>
                    </div>
                    {bannerDesktopUrl && (
                      <div className="rounded-lg overflow-hidden border aspect-video">
                        <img src={bannerDesktopUrl} alt="Desktop preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Mobile Banner */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <span className="h-6 w-6 bg-slate-100 rounded flex items-center justify-center text-xs">📱</span>
                      Mobile Banner
                    </h4>
                    <Input
                      placeholder="Enter mobile banner URL..."
                      value={bannerMobileUrl}
                      onChange={(e) => setBannerMobileUrl(e.target.value)}
                    />
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="mobile-upload"
                        onChange={(e) => e.target.files?.[0] && handleUploadBanner(e.target.files[0], 'mobile')}
                      />
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => document.getElementById('mobile-upload')?.click()}
                        disabled={uploadingMobile}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingMobile ? 'Uploading...' : 'Upload Local File'}
                      </Button>
                    </div>
                    {bannerMobileUrl && (
                      <div className="rounded-lg overflow-hidden border aspect-[9/16] max-h-48">
                        <img src={bannerMobileUrl} alt="Mobile preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
                <Button onClick={handleSaveBanners} className="w-full mt-4">
                  Save Banners
                </Button>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={() => navigate("/")}>
              Back to Marketplace
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          {[
            { label: "Total Dealers", value: stats.totalDealers, icon: Building2, color: "text-blue-600 bg-blue-50" },
            { label: "Active", value: stats.activeDealers, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
            { label: "Pending", value: stats.pendingDealers, icon: AlertTriangle, color: "text-amber-600 bg-amber-50" },
            { label: "Featured", value: stats.featuredDealers, icon: Sparkles, color: "text-purple-600 bg-purple-50" },
            { label: "Vehicles", value: stats.totalVehicles, icon: Car, color: "text-slate-600 bg-slate-100" },
            { label: "Live Auctions", value: stats.liveAuctions, icon: Gavel, color: "text-red-600 bg-red-50" },
            { label: "Total Bids", value: stats.totalBids, icon: TrendingUp, color: "text-cyan-600 bg-cyan-50" },
          ].map((stat, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${stat.color} flex items-center justify-center shrink-0`}>
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

        <Tabs defaultValue="dealers" className="space-y-6">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="dealers" className="gap-2">
              <Building2 className="h-4 w-4" /> Dealers
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="gap-2">
              <Car className="h-4 w-4" /> Vehicles
            </TabsTrigger>
            <TabsTrigger value="bidding" className="gap-2">
              <Gavel className="h-4 w-4" /> Bidding
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" /> Settings
            </TabsTrigger>
          </TabsList>

          {/* Dealers Tab */}
          <TabsContent value="dealers">
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b border-slate-100">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <CardTitle>Dealer Management</CardTitle>
                    <CardDescription>Approve, feature, and manage dealers</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search dealers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dealer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Vehicles</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDealers.map((dealer) => (
                      <TableRow key={dealer.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {dealer.shop_logo_url ? (
                              <img 
                                src={dealer.shop_logo_url} 
                                alt={dealer.dealer_name} 
                                className="h-10 w-10 rounded-lg object-cover" 
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-slate-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-900">{dealer.dealer_name}</p>
                              {dealer.marketplace_featured && (
                                <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
                                  <Sparkles className="h-3 w-3 mr-1" /> Featured
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{dealer.dealer_phone}</p>
                          <p className="text-xs text-slate-500">{dealer.dealer_email}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getDealerVehicleCount(dealer.user_id)} vehicles</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${
                            dealer.marketplace_status === 'approved' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : dealer.marketplace_status === 'suspended'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          } border-0`}>
                            {dealer.marketplace_status || 'pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            <CreditCard className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleDealerAction(dealer.id, 'approve')}>
                                <CheckCircle className="h-4 w-4 mr-2 text-emerald-600" /> Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDealerAction(dealer.id, 'suspend')}>
                                <Ban className="h-4 w-4 mr-2 text-red-600" /> Suspend
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDealerAction(dealer.id, dealer.marketplace_featured ? 'unfeature' : 'feature')}>
                                <Sparkles className="h-4 w-4 mr-2 text-amber-600" /> 
                                {dealer.marketplace_featured ? 'Remove Featured' : 'Make Featured'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDealerAction(dealer.id, 'badge_update', 'Trusted Seller')}>
                                <Award className="h-4 w-4 mr-2 text-blue-600" /> Add "Trusted Seller"
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDealerAction(dealer.id, 'badge_update', 'Premium Dealer')}>
                                <Award className="h-4 w-4 mr-2 text-purple-600" /> Add "Premium Dealer"
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {filteredDealers.length === 0 && (
                  <div className="p-12 text-center text-slate-500">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p>No dealers found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vehicles Tab */}
          <TabsContent value="vehicles">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Listed Vehicles</CardTitle>
                <CardDescription>All vehicles currently listed on the marketplace</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Dealer</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Listed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.slice(0, 20).map((vehicle) => {
                      const dealer = dealers.find(d => d.user_id === vehicle.user_id);
                      return (
                        <TableRow key={vehicle.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-16 bg-slate-100 rounded-lg flex items-center justify-center">
                                <Car className="h-6 w-6 text-slate-400" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {vehicle.manufacturing_year} {vehicle.brand} {vehicle.model}
                                </p>
                                <p className="text-xs text-slate-500">{vehicle.variant}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{dealer?.dealer_name || 'Unknown'}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(vehicle.selling_price)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={vehicle.status === 'in_stock' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100'}>
                              {vehicle.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {new Date(vehicle.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bidding Tab */}
          <TabsContent value="bidding">
            <div className="space-y-6">
              {/* Auctions Management */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gavel className="h-5 w-5 text-red-600" />
                    Auction Management
                  </CardTitle>
                  <CardDescription>View and manage all auctions</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Current Bid</TableHead>
                        <TableHead>Bids</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Time Left</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auctions.map((auction) => {
                        const endTime = new Date(auction.end_time).getTime();
                        const now = Date.now();
                        const diff = endTime - now;
                        const hours = Math.floor(diff / (1000 * 60 * 60));
                        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                        const timeLeft = diff <= 0 ? 'Ended' : `${hours}h ${minutes}m`;

                        return (
                          <TableRow key={auction.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-12 w-16 bg-slate-100 rounded-lg flex items-center justify-center">
                                  <Car className="h-6 w-6 text-slate-400" />
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900">{auction.title}</p>
                                  {auction.vehicle && (
                                    <p className="text-xs text-slate-500">
                                      {auction.vehicle.brand} {auction.vehicle.model}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="font-bold text-emerald-600">
                                {formatCurrency(auction.current_bid || auction.starting_price)}
                              </p>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{auction.bid_count || 0} bids</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${statusColors[auction.status] || 'bg-slate-100'} border-0`}>
                                {auction.status?.replace(/_/g, ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className={`flex items-center gap-1 text-sm ${diff <= 0 ? 'text-slate-400' : 'text-amber-600'}`}>
                                <Timer className="h-3 w-3" />
                                {timeLeft}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Select
                                value={auction.status}
                                onValueChange={(v) => handleAuctionStatusChange(auction.id, v)}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="auction_live">Live</SelectItem>
                                  <SelectItem value="auction_ended">End Auction</SelectItem>
                                  <SelectItem value="post_bid_seller_pending">Seller Pending</SelectItem>
                                  <SelectItem value="post_bid_dealer_pending">Dealer Pending</SelectItem>
                                  <SelectItem value="post_bid_negotiation">Negotiation</SelectItem>
                                  <SelectItem value="payment_pending">Payment Pending</SelectItem>
                                  <SelectItem value="sold">Mark Sold</SelectItem>
                                  <SelectItem value="failed">Mark Failed</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* All Bids with User Info */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    All Bids & Bidders
                  </CardTitle>
                  <CardDescription>Complete bid history with user information</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bidder</TableHead>
                        <TableHead>Auction</TableHead>
                        <TableHead>Bid Amount</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bids.slice(0, 30).map((bid) => {
                        const auction = auctions.find(a => a.id === bid.auction_id);
                        const isWinning = auction?.current_bidder_id === bid.bidder_id;
                        
                        return (
                          <TableRow key={bid.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <Users className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">{getBidderName(bid.bidder_id)}</p>
                                  <p className="text-xs text-slate-500">{getBidderEmail(bid.bidder_id)}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{auction?.title || 'Unknown Auction'}</p>
                            </TableCell>
                            <TableCell>
                              <span className="font-bold text-emerald-600">{formatCurrency(bid.bid_amount)}</span>
                            </TableCell>
                            <TableCell className="text-sm text-slate-500">
                              {new Date(bid.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {isWinning ? (
                                <Badge className="bg-amber-100 text-amber-700 border-0">
                                  <Crown className="h-3 w-3 mr-1" /> Winning
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-slate-500">Outbid</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Marketplace Settings</CardTitle>
                <CardDescription>Configure global marketplace settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Display Settings</h4>
                    <div className="space-y-2">
                      <label className="text-sm text-slate-600">Vehicles per page</label>
                      <Input type="number" defaultValue="6" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-slate-600">Featured dealers limit</label>
                      <Input type="number" defaultValue="10" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">Auction Settings</h4>
                    <div className="space-y-2">
                      <label className="text-sm text-slate-600">Minimum bid increment (₹)</label>
                      <Input type="number" defaultValue="1000" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-slate-600">Auto-extend time (minutes)</label>
                      <Input type="number" defaultValue="5" />
                    </div>
                  </div>
                </div>
                <Button>Save Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MarketplaceAdmin;
