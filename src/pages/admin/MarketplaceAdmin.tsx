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
import {
  Shield, Users, Car, Star, CheckCircle, XCircle, AlertTriangle,
  Sparkles, Building2, Search, Filter, MoreVertical, Eye, Ban,
  Award, TrendingUp, Calendar, Image, Upload, Settings
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
import CarLoader from "@/components/CarLoader";

const MarketplaceAdmin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [dealers, setDealers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Banner customization
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);

  const [stats, setStats] = useState({
    totalDealers: 0,
    activeDealers: 0,
    pendingDealers: 0,
    totalVehicles: 0,
    featuredDealers: 0,
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

    // Check if user is marketplace admin
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

      // Calculate stats
      const active = (dealersData || []).filter(d => d.marketplace_status === 'approved').length;
      const pending = (dealersData || []).filter(d => d.marketplace_status === 'pending').length;
      const featured = (dealersData || []).filter(d => d.marketplace_featured).length;

      setStats({
        totalDealers: (dealersData || []).length,
        activeDealers: active,
        pendingDealers: pending,
        totalVehicles: (vehiclesData || []).length,
        featuredDealers: featured,
      });
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
      // Update dealer settings based on action
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

      // Log moderation action
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

  const handleSaveBanner = () => {
    // In a real implementation, this would save to database or storage
    localStorage.setItem('marketplace_banner_url', bannerUrl);
    toast({ title: "Banner updated successfully" });
    setBannerDialogOpen(false);
  };

  const filteredDealers = dealers.filter(d => {
    const matchesSearch = !searchTerm || 
      d.dealer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || d.marketplace_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
                  Edit Banner
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Customize Banner Image</DialogTitle>
                  <DialogDescription>
                    Set the top banner image URL for the marketplace landing page
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="Enter banner image URL..."
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                  />
                  {bannerUrl && (
                    <div className="rounded-lg overflow-hidden border">
                      <img src={bannerUrl} alt="Banner preview" className="w-full h-32 object-cover" />
                    </div>
                  )}
                  <Button onClick={handleSaveBanner} className="w-full">
                    Save Banner
                  </Button>
                </div>
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total Dealers", value: stats.totalDealers, icon: Building2, color: "text-blue-600 bg-blue-50" },
            { label: "Active", value: stats.activeDealers, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
            { label: "Pending", value: stats.pendingDealers, icon: AlertTriangle, color: "text-amber-600 bg-amber-50" },
            { label: "Featured", value: stats.featuredDealers, icon: Sparkles, color: "text-purple-600 bg-purple-50" },
            { label: "Vehicles", value: stats.totalVehicles, icon: Car, color: "text-slate-600 bg-slate-100" },
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

        <Tabs defaultValue="dealers" className="space-y-6">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="dealers" className="gap-2">
              <Building2 className="h-4 w-4" /> Dealers
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="gap-2">
              <Car className="h-4 w-4" /> Vehicles
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" /> Settings
            </TabsTrigger>
          </TabsList>

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
                <div className="divide-y divide-slate-100">
                  {filteredDealers.map((dealer) => (
                    <div key={dealer.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {dealer.shop_logo_url ? (
                            <img 
                              src={dealer.shop_logo_url} 
                              alt={dealer.dealer_name} 
                              className="h-12 w-12 rounded-lg object-cover" 
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-slate-900">{dealer.dealer_name}</h3>
                              {dealer.marketplace_featured && (
                                <Badge className="bg-amber-100 text-amber-700 border-0">
                                  <Sparkles className="h-3 w-3 mr-1" /> Featured
                                </Badge>
                              )}
                              <Badge className={`${
                                dealer.marketplace_status === 'approved' 
                                  ? 'bg-emerald-100 text-emerald-700' 
                                  : dealer.marketplace_status === 'suspended'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-700'
                              } border-0`}>
                                {dealer.marketplace_status || 'pending'}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-500">{dealer.dealer_phone}</p>
                            {dealer.marketplace_badge && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {dealer.marketplace_badge}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
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
                              <Award className="h-4 w-4 mr-2 text-blue-600" /> Add "Trusted Seller" Badge
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDealerAction(dealer.id, 'badge_update', 'Premium Dealer')}>
                              <Award className="h-4 w-4 mr-2 text-purple-600" /> Add "Premium Dealer" Badge
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDealerAction(dealer.id, 'badge_update', '')}>
                              <XCircle className="h-4 w-4 mr-2 text-slate-600" /> Remove Badge
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                  
                  {filteredDealers.length === 0 && (
                    <div className="p-12 text-center text-slate-500">
                      <Building2 className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      <p>No dealers found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vehicles">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Vehicle Moderation</CardTitle>
                <CardDescription>Review and moderate listed vehicles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vehicles.slice(0, 12).map((vehicle) => (
                    <Card key={vehicle.id} className="overflow-hidden">
                      <div className="aspect-video bg-slate-100 flex items-center justify-center">
                        <Car className="h-12 w-12 text-slate-300" />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-slate-900">
                          {vehicle.manufacturing_year} {vehicle.brand} {vehicle.model}
                        </h3>
                        <p className="text-sm text-slate-500">{vehicle.variant}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Marketplace Settings</CardTitle>
                <CardDescription>Configure marketplace appearance and behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Banner Image</h3>
                  <div className="flex gap-4">
                    <Input
                      placeholder="Enter banner image URL..."
                      value={bannerUrl}
                      onChange={(e) => setBannerUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleSaveBanner}>Save</Button>
                  </div>
                  {bannerUrl && (
                    <div className="rounded-lg overflow-hidden border">
                      <img src={bannerUrl} alt="Banner preview" className="w-full h-40 object-cover" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MarketplaceAdmin;
