import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatters";
import {
  Shield, Users, Car, CheckCircle, XCircle, AlertTriangle,
  Sparkles, Building2, Search, MoreVertical, Eye, Ban,
  Award, TrendingUp, Calendar, Image, Upload, Settings,
  Crown, DollarSign, MessageSquare, CreditCard, Clock, Ticket,
  BarChart3, Phone, Globe, Zap, ArrowUpRight, ArrowDownRight,
  Activity, MapPin, Tag, FileText, ChevronRight
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

const MarketplaceAdmin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [dealers, setDealers] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [sellRequests, setSellRequests] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDealer, setSelectedDealer] = useState<any>(null);
  const [dealerInsightsOpen, setDealerInsightsOpen] = useState(false);
  const [dealerEvents, setDealerEvents] = useState<any[]>([]);
  const [analyticsPeriod, setAnalyticsPeriod] = useState("30d");

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState({
    totalViews: 0, totalEnquiries: 0, totalCalls: 0, totalWhatsapp: 0,
    uniqueSessions: 0, conversionRate: 0,
  });
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [topVehicles, setTopVehicles] = useState<any[]>([]);
  const [cityData, setCityData] = useState<any[]>([]);

  // Banner customization
  const [bannerDesktopUrl, setBannerDesktopUrl] = useState("");
  const [bannerMobileUrl, setBannerMobileUrl] = useState("");
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);

  const [stats, setStats] = useState({
    totalDealers: 0, activeDealers: 0, pendingDealers: 0,
    totalVehicles: 0, featuredDealers: 0, totalSellRequests: 0,
  });

  useEffect(() => { checkAdminAccess(); }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }
    const { data: adminData } = await supabase.from("marketplace_admins").select("*").eq("user_id", user.id).single();
    if (!adminData) {
      toast({ title: "Access Denied", description: "You don't have admin privileges", variant: "destructive" });
      navigate("/"); return;
    }
    setIsAdmin(true);
    fetchData();
  };

  const fetchData = async () => {
    try {
      const [dealersRes, vehiclesRes, ticketsRes, sellRes] = await Promise.all([
        supabase.from("settings").select("*").eq("marketplace_enabled", true),
        supabase.from("vehicles").select("*").eq("is_public", true),
        supabase.from("support_tickets" as any).select("*").order("created_at", { ascending: false }),
        supabase.from("leads").select("*").in("source", ["marketplace_sell", "marketplace"]).eq("lead_type", "seller").order("created_at", { ascending: false }),
      ]);

      setDealers(dealersRes.data || []);
      setVehicles(vehiclesRes.data || []);
      setSupportTickets(ticketsRes.data || []);
      setSellRequests(sellRes.data || []);

      const d = dealersRes.data || [];
      setStats({
        totalDealers: d.length,
        activeDealers: d.filter(x => x.marketplace_status === 'approved').length,
        pendingDealers: d.filter(x => x.marketplace_status === 'pending').length,
        featuredDealers: d.filter(x => x.marketplace_featured).length,
        totalVehicles: (vehiclesRes.data || []).length,
        totalSellRequests: (sellRes.data || []).length,
      });

      const savedDesktop = localStorage.getItem('marketplace_banner_desktop');
      const savedMobile = localStorage.getItem('marketplace_banner_mobile');
      if (savedDesktop) setBannerDesktopUrl(savedDesktop);
      if (savedMobile) setBannerMobileUrl(savedMobile);

      // Fetch marketplace analytics
      await fetchAnalytics();
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    const days = analyticsPeriod === "7d" ? 7 : analyticsPeriod === "30d" ? 30 : 90;
    const startDate = startOfDay(subDays(new Date(), days));

    const { data: events } = await supabase
      .from("public_page_events")
      .select("*")
      .eq("public_page_id", "marketplace")
      .gte("created_at", startDate.toISOString());

    const allEvents = events || [];
    const views = allEvents.filter(e => e.event_type === "vehicle_view" || e.event_type === "dealer_view").length;
    const enquiries = allEvents.filter(e => e.event_type === "enquiry_submit").length;
    const calls = allEvents.filter(e => e.event_type === "cta_call").length;
    const whatsapp = allEvents.filter(e => e.event_type === "cta_whatsapp").length;
    const sessions = new Set(allEvents.map(e => e.session_id)).size;
    const interactions = enquiries + calls + whatsapp;

    setAnalyticsData({
      totalViews: views, totalEnquiries: enquiries, totalCalls: calls,
      totalWhatsapp: whatsapp, uniqueSessions: sessions,
      conversionRate: views > 0 ? (interactions / views) * 100 : 0,
    });

    // Daily trend
    const dailyMap: Record<string, { date: string; views: number; enquiries: number; sessions: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = format(subDays(new Date(), i), "MMM dd");
      dailyMap[d] = { date: d, views: 0, enquiries: 0, sessions: 0 };
    }
    const sessionsByDate: Record<string, Set<string>> = {};
    allEvents.forEach(e => {
      const d = format(new Date(e.created_at), "MMM dd");
      if (dailyMap[d]) {
        if (e.event_type === "vehicle_view" || e.event_type === "dealer_view") dailyMap[d].views++;
        if (e.event_type === "enquiry_submit") dailyMap[d].enquiries++;
        if (!sessionsByDate[d]) sessionsByDate[d] = new Set();
        sessionsByDate[d].add(e.session_id);
      }
    });
    Object.keys(dailyMap).forEach(d => { dailyMap[d].sessions = sessionsByDate[d]?.size || 0; });
    setDailyData(Object.values(dailyMap).reverse());

    // Top vehicles by views
    const vehicleMap: Record<string, { id: string; views: number; enquiries: number }> = {};
    allEvents.filter(e => e.vehicle_id).forEach(e => {
      if (!vehicleMap[e.vehicle_id]) vehicleMap[e.vehicle_id] = { id: e.vehicle_id, views: 0, enquiries: 0 };
      if (e.event_type === "vehicle_view") vehicleMap[e.vehicle_id].views++;
      if (e.event_type === "enquiry_submit") vehicleMap[e.vehicle_id].enquiries++;
    });
    const vIds = Object.keys(vehicleMap);
    if (vIds.length > 0) {
      const { data: vData } = await supabase.from("vehicles").select("id, brand, model, manufacturing_year, selling_price").in("id", vIds);
      const enriched = (vData || []).map(v => ({ ...v, ...vehicleMap[v.id], name: `${v.manufacturing_year} ${v.brand} ${v.model}` })).sort((a, b) => b.views - a.views);
      setTopVehicles(enriched.slice(0, 10));
    }

    // City distribution from leads
    const { data: leads } = await supabase.from("leads").select("city").eq("source", "marketplace").gte("created_at", startDate.toISOString());
    const cityMap: Record<string, number> = {};
    (leads || []).forEach(l => { if (l.city) cityMap[l.city] = (cityMap[l.city] || 0) + 1; });
    setCityData(Object.entries(cityMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8));
  };

  useEffect(() => { if (isAdmin) fetchAnalytics(); }, [analyticsPeriod]);

  const fetchDealerInsights = async (dealer: any) => {
    setSelectedDealer(dealer);
    setDealerInsightsOpen(true);
    const days = 30;
    const startDate = startOfDay(subDays(new Date(), days));
    const { data: events } = await supabase
      .from("public_page_events")
      .select("*")
      .eq("dealer_user_id", dealer.user_id)
      .gte("created_at", startDate.toISOString());
    setDealerEvents(events || []);
  };

  const getDealerInsightStats = useMemo(() => {
    if (!dealerEvents.length) return { views: 0, enquiries: 0, calls: 0, whatsapp: 0, sessions: 0, conversion: 0 };
    const views = dealerEvents.filter(e => e.event_type === "vehicle_view" || e.event_type === "dealer_view").length;
    const enquiries = dealerEvents.filter(e => e.event_type === "enquiry_submit").length;
    const calls = dealerEvents.filter(e => e.event_type === "cta_call").length;
    const whatsapp = dealerEvents.filter(e => e.event_type === "cta_whatsapp").length;
    const sessions = new Set(dealerEvents.map(e => e.session_id)).size;
    const interactions = enquiries + calls + whatsapp;
    return { views, enquiries, calls, whatsapp, sessions, conversion: views > 0 ? ((interactions / views) * 100) : 0 };
  }, [dealerEvents]);

  const dealerDailyData = useMemo(() => {
    const map: Record<string, { date: string; views: number; enquiries: number }> = {};
    for (let i = 0; i < 30; i++) {
      const d = format(subDays(new Date(), i), "MMM dd");
      map[d] = { date: d, views: 0, enquiries: 0 };
    }
    dealerEvents.forEach(e => {
      const d = format(new Date(e.created_at), "MMM dd");
      if (map[d]) {
        if (e.event_type === "vehicle_view" || e.event_type === "dealer_view") map[d].views++;
        if (e.event_type === "enquiry_submit") map[d].enquiries++;
      }
    });
    return Object.values(map).reverse();
  }, [dealerEvents]);

  const handleDealerAction = async (dealerId: string, action: string, badgeValue?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      const updates: any = {};
      switch (action) {
        case 'approve': updates.marketplace_status = 'approved'; break;
        case 'suspend': updates.marketplace_status = 'suspended'; break;
        case 'feature': updates.marketplace_featured = true; break;
        case 'unfeature': updates.marketplace_featured = false; break;
        case 'badge_update': updates.marketplace_badge = badgeValue; break;
      }
      await supabase.from("settings").update(updates).eq("id", dealerId);
      const dealer = dealers.find(d => d.id === dealerId);
      await supabase.from("marketplace_moderation").insert({
        target_type: 'dealer', target_id: dealer?.user_id, action, badge_value: badgeValue, performed_by: user.id,
      });
      toast({ title: "Action completed successfully" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleUploadBanner = async (file: File, type: 'desktop' | 'mobile') => {
    if (type === 'desktop') setUploadingDesktop(true); else setUploadingMobile(true);
    try {
      const fileName = `banner-${type}-${Date.now()}.${file.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('vehicle-images').upload(fileName, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('vehicle-images').getPublicUrl(fileName);
      if (type === 'desktop') { setBannerDesktopUrl(urlData.publicUrl); localStorage.setItem('marketplace_banner_desktop', urlData.publicUrl); }
      else { setBannerMobileUrl(urlData.publicUrl); localStorage.setItem('marketplace_banner_mobile', urlData.publicUrl); }
      toast({ title: `${type} banner uploaded!` });
    } catch (error: any) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); }
    finally { if (type === 'desktop') setUploadingDesktop(false); else setUploadingMobile(false); }
  };

  const handleSaveBanners = () => {
    localStorage.setItem('marketplace_banner_desktop', bannerDesktopUrl);
    localStorage.setItem('marketplace_banner_mobile', bannerMobileUrl);
    toast({ title: "Banners saved successfully" });
    setBannerDialogOpen(false);
  };

  const getDealerVehicleCount = (userId: string) => vehicles.filter(v => v.user_id === userId).length;

  const filteredDealers = dealers.filter(d => {
    const matchesSearch = !searchTerm || d.dealer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || d.marketplace_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const parseSellNotes = (notes: string) => {
    try { return JSON.parse(notes); } catch { return null; }
  };

  if (loading) return <PageSkeleton />;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Professional Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-lg">Admin Console</h1>
              <p className="text-xs text-slate-500">VahanHub Marketplace</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={bannerDialogOpen} onOpenChange={setBannerDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 hidden md:flex">
                  <Image className="h-4 w-4" /> Banners
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Banner Customization</DialogTitle>
                  <DialogDescription>Upload separate banners for desktop and mobile</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  {(['desktop', 'mobile'] as const).map(type => (
                    <div key={type} className="space-y-3">
                      <h4 className="font-medium text-sm capitalize">{type} Banner</h4>
                      <Input
                        placeholder={`Enter ${type} banner URL...`}
                        value={type === 'desktop' ? bannerDesktopUrl : bannerMobileUrl}
                        onChange={(e) => type === 'desktop' ? setBannerDesktopUrl(e.target.value) : setBannerMobileUrl(e.target.value)}
                      />
                      <input type="file" accept="image/*" className="hidden" id={`${type}-upload`}
                        onChange={(e) => e.target.files?.[0] && handleUploadBanner(e.target.files[0], type)} />
                      <Button variant="outline" className="w-full" onClick={() => document.getElementById(`${type}-upload`)?.click()}
                        disabled={type === 'desktop' ? uploadingDesktop : uploadingMobile}>
                        <Upload className="h-4 w-4 mr-2" /> {(type === 'desktop' ? uploadingDesktop : uploadingMobile) ? 'Uploading...' : 'Upload'}
                      </Button>
                      {(type === 'desktop' ? bannerDesktopUrl : bannerMobileUrl) && (
                        <div className="rounded-lg overflow-hidden border aspect-video">
                          <img src={type === 'desktop' ? bannerDesktopUrl : bannerMobileUrl} alt={`${type} preview`} className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <Button onClick={handleSaveBanners} className="w-full mt-4">Save Banners</Button>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>Marketplace</Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 lg:px-8 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: "Total Dealers", value: stats.totalDealers, icon: Building2, color: "from-blue-500 to-blue-600", bg: "bg-blue-50" },
            { label: "Active", value: stats.activeDealers, icon: CheckCircle, color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50" },
            { label: "Pending", value: stats.pendingDealers, icon: AlertTriangle, color: "from-amber-500 to-amber-600", bg: "bg-amber-50" },
            { label: "Featured", value: stats.featuredDealers, icon: Sparkles, color: "from-purple-500 to-purple-600", bg: "bg-purple-50" },
            { label: "Vehicles", value: stats.totalVehicles, icon: Car, color: "from-slate-500 to-slate-600", bg: "bg-slate-100" },
            { label: "Sell Requests", value: stats.totalSellRequests, icon: Tag, color: "from-rose-500 to-rose-600", bg: "bg-rose-50" },
          ].map((stat, i) => (
            <Card key={i} className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-sm`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm p-1 rounded-xl">
            <TabsTrigger value="analytics" className="gap-2 rounded-lg"><BarChart3 className="h-4 w-4" /> Analytics</TabsTrigger>
            <TabsTrigger value="dealers" className="gap-2 rounded-lg"><Building2 className="h-4 w-4" /> Dealers</TabsTrigger>
            <TabsTrigger value="vehicles" className="gap-2 rounded-lg"><Car className="h-4 w-4" /> Vehicles</TabsTrigger>
            <TabsTrigger value="sell_requests" className="gap-2 rounded-lg"><Tag className="h-4 w-4" /> Sell Requests</TabsTrigger>
            <TabsTrigger value="featured" className="gap-2 rounded-lg"><Sparkles className="h-4 w-4" /> Featured</TabsTrigger>
            <TabsTrigger value="tickets" className="gap-2 rounded-lg"><Ticket className="h-4 w-4" /> Support</TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 rounded-lg"><Settings className="h-4 w-4" /> Settings</TabsTrigger>
          </TabsList>

          {/* ===== ANALYTICS TAB ===== */}
          <TabsContent value="analytics">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Marketplace Analytics</h2>
                <div className="flex gap-1 p-1 bg-white rounded-xl border shadow-sm">
                  {[{ key: "7d", label: "7D" }, { key: "30d", label: "30D" }, { key: "90d", label: "90D" }].map(p => (
                    <button key={p.key} onClick={() => setAnalyticsPeriod(p.key)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${analyticsPeriod === p.key ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "Total Views", value: analyticsData.totalViews, icon: Eye, color: "text-blue-600 bg-blue-50" },
                  { label: "Unique Visitors", value: analyticsData.uniqueSessions, icon: Users, color: "text-indigo-600 bg-indigo-50" },
                  { label: "Enquiries", value: analyticsData.totalEnquiries, icon: MessageSquare, color: "text-emerald-600 bg-emerald-50" },
                  { label: "Calls", value: analyticsData.totalCalls, icon: Phone, color: "text-violet-600 bg-violet-50" },
                  { label: "WhatsApp", value: analyticsData.totalWhatsapp, icon: MessageSquare, color: "text-green-600 bg-green-50" },
                  { label: "Conversion", value: `${analyticsData.conversionRate.toFixed(1)}%`, icon: TrendingUp, color: "text-rose-600 bg-rose-50" },
                ].map((m, i) => (
                  <Card key={i} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className={`h-9 w-9 rounded-lg ${m.color} flex items-center justify-center mb-2`}>
                        <m.icon className="h-4 w-4" />
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{m.value}</p>
                      <p className="text-xs text-slate-500">{m.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="border-0 shadow-sm lg:col-span-2">
                  <CardHeader><CardTitle className="text-base">Traffic Trend</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="views" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} strokeWidth={2} />
                        <Area type="monotone" dataKey="enquiries" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader><CardTitle className="text-base">Enquiries by City</CardTitle></CardHeader>
                  <CardContent>
                    {cityData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie data={cityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                            {cityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[280px] text-slate-400 text-sm">No city data yet</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Top Vehicles */}
              {topVehicles.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardHeader><CardTitle className="text-base">Top Performing Vehicles</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Views</TableHead>
                          <TableHead>Enquiries</TableHead>
                          <TableHead>Conversion</TableHead>
                          <TableHead>Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topVehicles.map((v, i) => (
                          <TableRow key={v.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400 w-5">#{i + 1}</span>
                                <span className="font-medium">{v.name}</span>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="outline">{v.views}</Badge></TableCell>
                            <TableCell><Badge className="bg-emerald-50 text-emerald-700 border-0">{v.enquiries}</Badge></TableCell>
                            <TableCell>{v.views > 0 ? `${((v.enquiries / v.views) * 100).toFixed(1)}%` : '0%'}</TableCell>
                            <TableCell className="font-semibold text-blue-600">{formatCurrency(v.selling_price)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ===== DEALERS TAB ===== */}
          <TabsContent value="dealers">
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b border-slate-100">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <CardTitle>Dealer Management</CardTitle>
                    <CardDescription>Approve, feature, and view dealer insights</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input placeholder="Search dealers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-64" />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
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
                      <TableHead>Badge</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDealers.map((dealer) => (
                      <TableRow key={dealer.id} className="cursor-pointer hover:bg-slate-50/80" onClick={() => fetchDealerInsights(dealer)}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {dealer.shop_logo_url ? (
                              <img src={dealer.shop_logo_url} alt={dealer.dealer_name} className="h-10 w-10 rounded-lg object-cover" />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-slate-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-900">{dealer.dealer_name}</p>
                              {dealer.marketplace_featured && (
                                <Badge className="bg-amber-100 text-amber-700 border-0 text-xs"><Sparkles className="h-3 w-3 mr-1" /> Featured</Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{dealer.dealer_phone}</p>
                          <p className="text-xs text-slate-500">{dealer.dealer_email}</p>
                        </TableCell>
                        <TableCell><Badge variant="outline">{getDealerVehicleCount(dealer.user_id)}</Badge></TableCell>
                        <TableCell>
                          <Badge className={`${dealer.marketplace_status === 'approved' ? 'bg-emerald-100 text-emerald-700' : dealer.marketplace_status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'} border-0`}>
                            {dealer.marketplace_status || 'pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {dealer.marketplace_badge ? <Badge variant="outline" className="text-xs">{dealer.marketplace_badge}</Badge> : <span className="text-xs text-slate-400">—</span>}
                        </TableCell>
                        <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => fetchDealerInsights(dealer)}><Eye className="h-4 w-4 mr-2 text-blue-600" /> View Insights</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDealerAction(dealer.id, 'approve')}><CheckCircle className="h-4 w-4 mr-2 text-emerald-600" /> Approve</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDealerAction(dealer.id, 'suspend')}><Ban className="h-4 w-4 mr-2 text-red-600" /> Suspend</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDealerAction(dealer.id, dealer.marketplace_featured ? 'unfeature' : 'feature')}>
                                <Sparkles className="h-4 w-4 mr-2 text-amber-600" /> {dealer.marketplace_featured ? 'Unfeature' : 'Feature'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDealerAction(dealer.id, 'badge_update', 'Trusted Seller')}><Award className="h-4 w-4 mr-2 text-blue-600" /> Trusted Seller</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDealerAction(dealer.id, 'badge_update', 'Premium Dealer')}><Award className="h-4 w-4 mr-2 text-purple-600" /> Premium Dealer</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredDealers.length === 0 && (
                  <div className="p-12 text-center text-slate-500"><Building2 className="h-12 w-12 mx-auto mb-4 text-slate-300" /><p>No dealers found</p></div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== VEHICLES TAB ===== */}
          <TabsContent value="vehicles">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Listed Vehicles</CardTitle>
                <CardDescription>All {vehicles.length} vehicles on the marketplace</CardDescription>
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
                    {vehicles.slice(0, 30).map((vehicle) => {
                      const dealer = dealers.find(d => d.user_id === vehicle.user_id);
                      return (
                        <TableRow key={vehicle.id}>
                          <TableCell>
                            <p className="font-semibold text-slate-900">{vehicle.manufacturing_year} {vehicle.brand} {vehicle.model}</p>
                            <p className="text-xs text-slate-500">{vehicle.fuel_type} · {vehicle.transmission}</p>
                          </TableCell>
                          <TableCell>{dealer?.dealer_name || 'Unknown'}</TableCell>
                          <TableCell className="font-semibold text-blue-600">{formatCurrency(vehicle.selling_price)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={vehicle.status === 'in_stock' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100'}>{vehicle.status}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">{new Date(vehicle.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== SELL REQUESTS TAB ===== */}
          <TabsContent value="sell_requests">
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5 text-rose-500" /> Sell Vehicle Requests</CardTitle>
                <CardDescription>Submissions from the "Sell Your Vehicle" form ({sellRequests.length} total)</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {sellRequests.length === 0 ? (
                  <div className="p-12 text-center text-slate-500"><Tag className="h-12 w-12 mx-auto mb-4 text-slate-300" /><p>No sell requests yet</p></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Expected Price</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sellRequests.map((req) => {
                        const details = parseSellNotes(req.notes);
                        return (
                          <TableRow key={req.id}>
                            <TableCell className="text-sm whitespace-nowrap">{new Date(req.created_at).toLocaleDateString("en-IN")}</TableCell>
                            <TableCell className="font-medium">{req.customer_name}</TableCell>
                            <TableCell>
                              <p className="text-sm">{req.phone}</p>
                              {req.email && <p className="text-xs text-slate-500">{req.email}</p>}
                            </TableCell>
                            <TableCell>
                              <p className="font-medium">{req.vehicle_interest}</p>
                              {details?.variant && <p className="text-xs text-slate-500">{details.variant}</p>}
                            </TableCell>
                            <TableCell>
                              {details ? (
                                <div className="text-xs space-y-0.5">
                                  <p>{details.fuelType} · {details.transmission}</p>
                                  <p>{details.kmDriven ? `${details.kmDriven} km` : ''}{details.owners ? ` · ${details.owners} owner` : ''}</p>
                                  {details.color && <p>Color: {details.color}</p>}
                                  {details.registrationNumber && <p>Reg: {details.registrationNumber}</p>}
                                  {details.condition && <p>Condition: <span className="capitalize">{details.condition}</span></p>}
                                  {details.accidentHistory && details.accidentHistory !== "no" && (
                                    <Badge variant="outline" className="text-xs mt-0.5 border-red-300 text-red-600">Accident: {details.accidentHistory}</Badge>
                                  )}
                                  {details.insuranceValid && <p>Insurance: {details.insuranceValid}</p>}
                                  {details.images?.length > 0 && (
                                    <Badge variant="outline" className="text-xs mt-1"><Image className="h-3 w-3 mr-1" />{details.images.length} photos</Badge>
                                  )}
                                </div>
                              ) : <span className="text-xs text-slate-400">—</span>}
                            </TableCell>
                            <TableCell className="font-semibold text-blue-600">
                              {req.budget_min ? formatCurrency(req.budget_min) : '—'}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {req.city || '—'}
                                {details?.state && <p className="text-xs text-slate-500">{details.state}</p>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={req.status === 'new' ? 'bg-amber-100 text-amber-700 border-0' : 'bg-emerald-100 text-emerald-700 border-0'}>
                                {req.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== FEATURED TAB ===== */}
          <TabsContent value="featured">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-amber-500" /> Featured Vehicles</CardTitle>
                <CardDescription>Control "High Demand" section (max 4)</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Dealer</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Featured</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.slice(0, 30).map((vehicle) => {
                      const dealer = dealers.find(d => d.user_id === vehicle.user_id);
                      const isFeatured = vehicle.marketplace_status === 'featured';
                      return (
                        <TableRow key={vehicle.id}>
                          <TableCell className="font-semibold">{vehicle.manufacturing_year} {vehicle.brand} {vehicle.model}</TableCell>
                          <TableCell>{dealer?.dealer_name || 'Unknown'}</TableCell>
                          <TableCell className="font-semibold text-blue-600">{formatCurrency(vehicle.selling_price)}</TableCell>
                          <TableCell>
                            {isFeatured ? <Badge className="bg-amber-100 text-amber-700 border-0"><Sparkles className="h-3 w-3 mr-1" /> Featured</Badge> : <Badge variant="outline">No</Badge>}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant={isFeatured ? "outline" : "default"} onClick={async () => {
                              await supabase.from("vehicles").update({ marketplace_status: isFeatured ? 'listed' : 'featured' }).eq("id", vehicle.id);
                              toast({ title: isFeatured ? "Removed" : "Featured" }); fetchData();
                            }}>
                              {isFeatured ? 'Remove' : 'Feature'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== SUPPORT TAB ===== */}
          <TabsContent value="tickets">
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b border-slate-100">
                <CardTitle>Support Tickets</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supportTickets.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">No tickets yet</TableCell></TableRow>
                    ) : supportTickets.map((ticket: any) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="text-sm whitespace-nowrap">{new Date(ticket.created_at).toLocaleDateString("en-IN")}</TableCell>
                        <TableCell className="font-medium">{ticket.name}</TableCell>
                        <TableCell className="text-sm">{ticket.email}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs capitalize">{ticket.subject || "general"}</Badge></TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-slate-600">{ticket.message}</TableCell>
                        <TableCell><Badge className={ticket.status === "open" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}>{ticket.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== SETTINGS TAB ===== */}
          <TabsContent value="settings">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Marketplace Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Display Settings</h4>
                    <div className="space-y-2"><label className="text-sm text-slate-600">Vehicles per page</label><Input type="number" defaultValue="6" /></div>
                    <div className="space-y-2"><label className="text-sm text-slate-600">Featured dealers limit</label><Input type="number" defaultValue="10" /></div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">General</h4>
                    <div className="space-y-2"><label className="text-sm text-slate-600">Min bid increment (₹)</label><Input type="number" defaultValue="1000" /></div>
                  </div>
                </div>
                <Button>Save Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dealer Insights Dialog */}
      <Dialog open={dealerInsightsOpen} onOpenChange={setDealerInsightsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedDealer?.shop_logo_url ? (
                <img src={selectedDealer.shop_logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center"><Building2 className="h-5 w-5 text-blue-600" /></div>
              )}
              <div>
                <p>{selectedDealer?.dealer_name}</p>
                <p className="text-sm font-normal text-slate-500">Last 30 days insights</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* Dealer Stats */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { label: "Views", value: getDealerInsightStats.views, color: "text-blue-600" },
                { label: "Sessions", value: getDealerInsightStats.sessions, color: "text-indigo-600" },
                { label: "Enquiries", value: getDealerInsightStats.enquiries, color: "text-emerald-600" },
                { label: "Calls", value: getDealerInsightStats.calls, color: "text-violet-600" },
                { label: "WhatsApp", value: getDealerInsightStats.whatsapp, color: "text-green-600" },
                { label: "Conv. Rate", value: `${getDealerInsightStats.conversion.toFixed(1)}%`, color: "text-rose-600" },
              ].map((s, i) => (
                <div key={i} className="text-center p-3 rounded-xl bg-slate-50">
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Dealer trend chart */}
            <Card className="border shadow-none">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Daily Traffic</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={dealerDailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="views" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} strokeWidth={2} />
                    <Area type="monotone" dataKey="enquiries" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Dealer info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="text-slate-500">Phone</p>
                <p className="font-medium">{selectedDealer?.dealer_phone || '—'}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="text-slate-500">Email</p>
                <p className="font-medium">{selectedDealer?.dealer_email || '—'}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="text-slate-500">Address</p>
                <p className="font-medium">{selectedDealer?.dealer_address || '—'}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="text-slate-500">Vehicles Listed</p>
                <p className="font-medium">{getDealerVehicleCount(selectedDealer?.user_id)}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarketplaceAdmin;