import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatters";
import {
  Shield, Users, Car, CheckCircle, XCircle, AlertTriangle,
  Sparkles, Building2, Search, MoreVertical, Eye, Ban,
  Award, TrendingUp, Calendar, Image, Upload, Settings,
  Crown, DollarSign, MessageSquare, CreditCard, Clock, Ticket,
  BarChart3, Phone, Globe, Zap, ArrowUpRight, ArrowDownRight,
  Activity, MapPin, Tag, FileText, ChevronRight, ArrowUp, ArrowDown
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
  PieChart, Pie, Cell, CartesianGrid
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

  // Marketplace settings state
  const [mpSettings, setMpSettings] = useState<Record<string, string>>({});
  const [savingSettings, setSavingSettings] = useState(false);

  // City filter
  const [allCities, setAllCities] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

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
      const [dealersRes, vehiclesRes, ticketsRes, sellRes, mpSettingsRes] = await Promise.all([
        supabase.from("settings").select("*").eq("marketplace_enabled", true),
        supabase.from("vehicles").select("*").eq("is_public", true),
        supabase.from("support_tickets" as any).select("*").order("created_at", { ascending: false }),
        supabase.from("leads").select("*").in("source", ["marketplace_sell"]).eq("lead_type", "seller").order("created_at", { ascending: false }),
        supabase.from("marketplace_settings").select("*"),
      ]);

      const dealersList = dealersRes.data || [];
      setDealers(dealersList);
      setVehicles(vehiclesRes.data || []);
      setSupportTickets(ticketsRes.data || []);
      setSellRequests(sellRes.data || []);

      // Parse marketplace settings into key-value map
      const settingsMap: Record<string, string> = {};
      (mpSettingsRes.data || []).forEach((s: any) => { settingsMap[s.setting_key] = s.setting_value || ""; });
      setMpSettings(settingsMap);

      const cities = dealersList
        .map(d => {
          const addr = d.dealer_address || "";
          const parts = addr.split(",").map((s: string) => s.trim()).filter(Boolean);
          return parts.length >= 2 ? parts[1] : parts[0] || "";
        })
        .filter(Boolean);
      const uniqueCities = [...new Set(cities)].sort();
      setAllCities(uniqueCities);

      setStats({
        totalDealers: dealersList.length,
        activeDealers: dealersList.filter(x => x.marketplace_status === 'approved').length,
        pendingDealers: dealersList.filter(x => x.marketplace_status === 'pending').length,
        featuredDealers: dealersList.filter(x => x.marketplace_featured).length,
        totalVehicles: (vehiclesRes.data || []).length,
        totalSellRequests: (sellRes.data || []).length,
      });

      const savedDesktop = localStorage.getItem('marketplace_banner_desktop');
      const savedMobile = localStorage.getItem('marketplace_banner_mobile');
      if (savedDesktop) setBannerDesktopUrl(savedDesktop);
      if (savedMobile) setBannerMobileUrl(savedMobile);

      await fetchAnalytics();
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMarketplaceSetting = async (key: string, value: string) => {
    setSavingSettings(true);
    try {
      const existing = await supabase.from("marketplace_settings").select("id").eq("setting_key", key).single();
      if (existing.data) {
        await supabase.from("marketplace_settings").update({ setting_value: value }).eq("setting_key", key);
      } else {
        await supabase.from("marketplace_settings").insert({ setting_key: key, setting_value: value });
      }
      setMpSettings(prev => ({ ...prev, [key]: value }));
      toast({ title: "Setting saved" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSavingSettings(false);
    }
  };

  const fetchAnalytics = async () => {
    const days = analyticsPeriod === "7d" ? 7 : analyticsPeriod === "30d" ? 30 : 90;
    const startDate = startOfDay(subDays(new Date(), days));

    // Fetch ALL marketplace events (admin RLS policy now allows this)
    const { data: events, error } = await supabase
      .from("public_page_events")
      .select("*")
      .eq("public_page_id", "marketplace")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error) {
      console.error("Analytics fetch error:", error);
    }

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
    const startDate = startOfDay(subDays(new Date(), 30));
    const { data: events } = await supabase
      .from("public_page_events")
      .select("*")
      .eq("dealer_user_id", dealer.user_id)
      .gte("created_at", startDate.toISOString())
      .limit(5000);
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
        case 'feature': {
          // Check max 5 featured
          const currentFeatured = dealers.filter(d => d.marketplace_featured).length;
          if (currentFeatured >= 5) {
            toast({ title: "Limit reached", description: "Maximum 5 dealers can be featured. Unfeature one first.", variant: "destructive" });
            return;
          }
          updates.marketplace_featured = true;
          break;
        }
        case 'unfeature': updates.marketplace_featured = false; break;
        case 'badge_update': updates.marketplace_badge = badgeValue; break;
      }
      const { error } = await supabase.from("settings").update(updates).eq("id", dealerId);
      if (error) throw error;
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

  const handleToggleFeaturedVehicle = async (vehicleId: string, currentlyFeatured: boolean) => {
    if (!currentlyFeatured) {
      const featuredCount = vehicles.filter(v => v.marketplace_status === 'featured' && v.status === 'in_stock').length;
      if (featuredCount >= 5) {
        toast({ title: "Limit reached", description: "Maximum 5 vehicles can be featured. Remove one first.", variant: "destructive" });
        return;
      }
    }
    const { error } = await supabase.from("vehicles").update({
      marketplace_status: currentlyFeatured ? 'listed' : 'featured'
    }).eq("id", vehicleId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: currentlyFeatured ? "Removed from featured" : "Vehicle featured!" });
    fetchData();
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
    // City filter
    if (selectedCities.length > 0) {
      const addr = d.dealer_address || "";
      const parts = addr.split(",").map((s: string) => s.trim()).filter(Boolean);
      const dealerCity = parts.length >= 2 ? parts[1] : parts[0] || "";
      if (!selectedCities.includes(dealerCity)) return false;
    }
    return matchesSearch;
  });

  // Featured vehicles: only in_stock, sorted by marketplace_status=featured first
  const featuredVehicles = useMemo(() => {
    return vehicles
      .filter(v => v.status === 'in_stock') // Only available vehicles
      .sort((a, b) => {
        const aFeat = a.marketplace_status === 'featured' ? 1 : 0;
        const bFeat = b.marketplace_status === 'featured' ? 1 : 0;
        return bFeat - aFeat;
      });
  }, [vehicles]);

  const [selectedSellRequest, setSelectedSellRequest] = useState<any>(null);
  const [sellDetailOpen, setSellDetailOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const parseSellNotes = (notes: string) => {
    try { return JSON.parse(notes); } catch { return null; }
  };

  const handleAssignDealer = async (leadId: string, dealerUserId: string) => {
    const dealer = dealers.find(d => d.user_id === dealerUserId);
    const { error } = await supabase.from("leads").update({
      assigned_to: dealerUserId,
      status: "contacted",
    }).eq("id", leadId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Assigned!", description: `Assigned to ${dealer?.dealer_name}` });
    setAssignDialogOpen(false);
    fetchData();
    setSelectedSellRequest((prev: any) => prev ? { ...prev, assigned_to: dealerUserId, status: "contacted" } : prev);
  };

  // Group ALL dealers by city for assignment popup (not just approved)
  const getDealersByCity = useMemo(() => {
    const cityMap: Record<string, any[]> = {};
    dealers.forEach(d => {
      const addr = d.dealer_address || "";
      const parts = addr.split(",").map((s: string) => s.trim()).filter(Boolean);
      const city = parts.length >= 2 ? parts[1] : parts[0] || "Other";
      if (!cityMap[city]) cityMap[city] = [];
      cityMap[city].push(d);
    });
    return cityMap;
  }, [dealers]);

  // Active sidebar tab
  const [activeAdminTab, setActiveAdminTab] = useState("analytics");

  // Get the sell request city to show matching dealers first
  const getSellRequestCity = (req: any) => {
    return req?.city || "";
  };

  if (loading) return <PageSkeleton />;
  if (!isAdmin) return null;

  const adminTabs = [
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "dealers", label: "Dealers", icon: Building2 },
    { id: "featured", label: "Featured", icon: Sparkles },
    { id: "banners", label: "Banners", icon: Image },
    { id: "sell_requests", label: "Sell Requests", icon: Tag },
    { id: "tickets", label: "Support", icon: Ticket },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar - Zoho style */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border bg-card shrink-0 sticky top-0 h-screen">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-sm">Admin Console</h1>
              <p className="text-xs text-muted-foreground">VahanHub Marketplace</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {adminTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeAdminTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          <Button variant="outline" size="sm" className="w-full gap-2 text-xs" onClick={() => setBannerDialogOpen(true)}>
            <Image className="h-3.5 w-3.5" /> Banners
          </Button>
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => navigate("/")}>
            Marketplace
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-foreground text-sm">Admin</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setBannerDialogOpen(true)}>Banners</Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => navigate("/")}>Home</Button>
          </div>
        </div>
        <div className="flex gap-1 px-3 pb-2 overflow-x-auto scrollbar-hide">
          {adminTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeAdminTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground bg-muted"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 min-w-0 mt-[100px] md:mt-0">
        <div className="p-4 lg:p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Total Dealers", value: stats.totalDealers, icon: Building2, color: "from-blue-500 to-blue-600" },
              { label: "Active", value: stats.activeDealers, icon: CheckCircle, color: "from-emerald-500 to-emerald-600" },
              { label: "Pending", value: stats.pendingDealers, icon: AlertTriangle, color: "from-amber-500 to-amber-600" },
              { label: "Featured", value: stats.featuredDealers, icon: Sparkles, color: "from-purple-500 to-purple-600" },
              { label: "Vehicles", value: stats.totalVehicles, icon: Car, color: "from-slate-500 to-slate-600" },
              { label: "Sell Requests", value: stats.totalSellRequests, icon: Tag, color: "from-rose-500 to-rose-600" },
            ].map((stat, i) => (
              <Card key={i} className="border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-sm`}>
                      <stat.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground tabular-nums">{stat.value}</p>
                      <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ===== ANALYTICS ===== */}
          {activeAdminTab === "analytics" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Marketplace Analytics</h2>
                <div className="flex gap-1 p-1 bg-muted rounded-xl">
                  {[{ key: "7d", label: "7D" }, { key: "30d", label: "30D" }, { key: "90d", label: "90D" }].map(p => (
                    <button key={p.key} onClick={() => setAnalyticsPeriod(p.key)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${analyticsPeriod === p.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "Total Views", value: analyticsData.totalViews, icon: Eye, color: "text-blue-600 bg-blue-50" },
                  { label: "Unique Visitors", value: analyticsData.uniqueSessions, icon: Users, color: "text-indigo-600 bg-indigo-50" },
                  { label: "Enquiries", value: analyticsData.totalEnquiries, icon: MessageSquare, color: "text-emerald-600 bg-emerald-50" },
                  { label: "Calls", value: analyticsData.totalCalls, icon: Phone, color: "text-violet-600 bg-violet-50" },
                  { label: "WhatsApp", value: analyticsData.totalWhatsapp, icon: MessageSquare, color: "text-green-600 bg-green-50" },
                  { label: "Conversion", value: `${analyticsData.conversionRate.toFixed(1)}%`, icon: TrendingUp, color: "text-rose-600 bg-rose-50" },
                ].map((m, i) => (
                  <Card key={i} className="border shadow-sm">
                    <CardContent className="p-4">
                      <div className={`h-9 w-9 rounded-lg ${m.color} flex items-center justify-center mb-2`}>
                        <m.icon className="h-4 w-4" />
                      </div>
                      <p className="text-2xl font-bold text-foreground tabular-nums">{m.value}</p>
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="border shadow-sm lg:col-span-2">
                  <CardHeader><CardTitle className="text-base">Traffic Trend</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="views" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} strokeWidth={2} />
                        <Area type="monotone" dataKey="enquiries" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border shadow-sm">
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
                      <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">No city data yet</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {topVehicles.length > 0 && (
                <Card className="border shadow-sm">
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
                                <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                                <span className="font-medium">{v.name}</span>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="outline">{v.views}</Badge></TableCell>
                            <TableCell><Badge className="bg-emerald-50 text-emerald-700 border-0">{v.enquiries}</Badge></TableCell>
                            <TableCell>{v.views > 0 ? `${((v.enquiries / v.views) * 100).toFixed(1)}%` : '0%'}</TableCell>
                            <TableCell className="font-semibold text-primary">{formatCurrency(v.selling_price)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ===== DEALERS ===== */}
          {activeAdminTab === "dealers" && (
            <Card className="border shadow-sm">
              <CardHeader className="border-b border-border">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <CardTitle>Dealer Management</CardTitle>
                    <CardDescription>Feature (max 5), and view dealer insights</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search dealers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-64" />
                    </div>
                  </div>
                </div>
                {allCities.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1"><MapPin className="h-4 w-4" /> Filter by City</p>
                    <div className="flex flex-wrap gap-3">
                      {allCities.map(city => (
                        <label key={city} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted px-2 py-1 rounded-lg transition-colors">
                          <Checkbox
                            checked={selectedCities.includes(city)}
                            onCheckedChange={(checked) => {
                              setSelectedCities(prev =>
                                checked ? [...prev, city] : prev.filter(c => c !== city)
                              );
                            }}
                          />
                          <span>{city}</span>
                        </label>
                      ))}
                      {selectedCities.length > 0 && (
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setSelectedCities([])}>
                          Clear all
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dealer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Vehicles</TableHead>
                      <TableHead>Featured</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDealers.map((dealer) => (
                      <TableRow key={dealer.id} className="cursor-pointer hover:bg-muted/50" onClick={() => fetchDealerInsights(dealer)}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {dealer.shop_logo_url ? (
                              <img src={dealer.shop_logo_url} alt={dealer.dealer_name} className="h-10 w-10 rounded-lg object-cover" />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-foreground">{dealer.dealer_name}</p>
                              <p className="text-xs text-muted-foreground">{dealer.dealer_address?.split(",").slice(-2).join(",").trim() || "—"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{dealer.dealer_phone}</p>
                          <p className="text-xs text-muted-foreground">{dealer.dealer_email}</p>
                        </TableCell>
                        <TableCell><Badge variant="outline">{getDealerVehicleCount(dealer.user_id)}</Badge></TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <Checkbox
                            checked={dealer.marketplace_featured || false}
                            onCheckedChange={() => handleDealerAction(dealer.id, dealer.marketplace_featured ? 'unfeature' : 'feature')}
                          />
                        </TableCell>
                        <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card">
                              <DropdownMenuItem onClick={() => fetchDealerInsights(dealer)}><Eye className="h-4 w-4 mr-2 text-blue-600" /> View Insights</DropdownMenuItem>
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
                  <div className="p-12 text-center text-muted-foreground"><Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" /><p>No dealers found</p></div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ===== FEATURED TAB ===== */}
          {activeAdminTab === "featured" && (
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-amber-500" /> Featured Vehicles</CardTitle>
                <CardDescription>
                  Only available (in_stock) vehicles shown. Max 5 featured.
                  Currently featured: {vehicles.filter(v => v.marketplace_status === 'featured' && v.status === 'in_stock').length}/5
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Dealer</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Featured</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {featuredVehicles.slice(0, 50).map((vehicle) => {
                      const dealer = dealers.find(d => d.user_id === vehicle.user_id);
                      const isFeatured = vehicle.marketplace_status === 'featured';
                      return (
                        <TableRow key={vehicle.id} className={isFeatured ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}>
                          <TableCell>
                            <p className="font-semibold text-foreground">{vehicle.manufacturing_year} {vehicle.brand} {vehicle.model}</p>
                            <p className="text-xs text-muted-foreground">{vehicle.fuel_type} · {vehicle.transmission}</p>
                          </TableCell>
                          <TableCell>{dealer?.dealer_name || 'Unknown'}</TableCell>
                          <TableCell className="font-semibold text-primary">{formatCurrency(vehicle.selling_price)}</TableCell>
                          <TableCell>
                            <Checkbox
                              checked={isFeatured}
                              onCheckedChange={() => handleToggleFeaturedVehicle(vehicle.id, isFeatured)}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* ===== BANNERS ===== */}
          {activeAdminTab === "banners" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Image className="h-5 w-5" /> Banner Management
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hero Slider Banners */}
                <Card className="border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Hero Slider Banners</CardTitle>
                    <CardDescription>Desktop & mobile banners for the marketplace hero carousel</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(['desktop', 'mobile'] as const).map(type => (
                      <div key={type} className="space-y-2">
                        <label className="text-sm font-medium capitalize">{type} Banner</label>
                        <div className="flex gap-2">
                          <Input
                            placeholder={`${type} banner URL`}
                            value={type === 'desktop' ? bannerDesktopUrl : bannerMobileUrl}
                            onChange={(e) => type === 'desktop' ? setBannerDesktopUrl(e.target.value) : setBannerMobileUrl(e.target.value)}
                          />
                          <label className="cursor-pointer">
                            <Button variant="outline" size="sm" asChild disabled={type === 'desktop' ? uploadingDesktop : uploadingMobile}>
                              <span><Upload className="h-4 w-4" /></span>
                            </Button>
                            <input type="file" accept="image/*" className="hidden"
                              onChange={(e) => e.target.files?.[0] && handleUploadBanner(e.target.files[0], type)} />
                          </label>
                        </div>
                        {(type === 'desktop' ? bannerDesktopUrl : bannerMobileUrl) && (
                          <img src={type === 'desktop' ? bannerDesktopUrl : bannerMobileUrl} alt={`${type} preview`}
                            className="w-full h-32 object-cover rounded-lg border" />
                        )}
                      </div>
                    ))}
                    <Button onClick={handleSaveBanners} className="w-full">Save Hero Banners</Button>
                  </CardContent>
                </Card>

                {/* Entry Popup Banner */}
                <Card className="border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Entry Popup Banner</CardTitle>
                    <CardDescription>Image-only popup shown on first visit to marketplace landing page</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Popup Image URL</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Popup banner image URL"
                          value={mpSettings["popup_image_url"] || ""}
                          onChange={(e) => setMpSettings(prev => ({ ...prev, popup_image_url: e.target.value }))}
                        />
                        <Button size="sm" variant="outline" disabled={savingSettings}
                          onClick={() => handleSaveMarketplaceSetting("popup_image_url", mpSettings["popup_image_url"] || "")}>
                          Save
                        </Button>
                      </div>
                      {mpSettings["popup_image_url"] && (
                        <img src={mpSettings["popup_image_url"]} alt="Popup preview"
                          className="w-full h-48 object-cover rounded-lg border" />
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Popup Link URL (when clicked)</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="/marketplace/vehicles or https://..."
                          value={mpSettings["popup_link_url"] || ""}
                          onChange={(e) => setMpSettings(prev => ({ ...prev, popup_link_url: e.target.value }))}
                        />
                        <Button size="sm" variant="outline" disabled={savingSettings}
                          onClick={() => handleSaveMarketplaceSetting("popup_link_url", mpSettings["popup_link_url"] || "")}>
                          Save
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Checkbox
                        checked={mpSettings["popup_enabled"] === "true"}
                        onCheckedChange={(checked) => {
                          const val = checked ? "true" : "false";
                          setMpSettings(prev => ({ ...prev, popup_enabled: val }));
                          handleSaveMarketplaceSetting("popup_enabled", val);
                        }}
                      />
                      <label className="text-sm font-medium">Enable Entry Popup</label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ===== SELL REQUESTS ===== */}
          {activeAdminTab === "sell_requests" && (
            <Card className="border shadow-sm">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5 text-rose-500" /> Sell Vehicle Requests</CardTitle>
                <CardDescription>Admin-only: {sellRequests.length} submissions from "Sell Your Vehicle" form</CardDescription>
              </CardHeader>
              <CardContent>
                {sellRequests.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground"><Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" /><p>No sell requests yet</p></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sellRequests.map((req) => {
                      const details = parseSellNotes(req.notes);
                      const primaryImage = details?.images?.[0];
                      return (
                        <Card key={req.id} className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                          onClick={() => { setSelectedSellRequest(req); setSellDetailOpen(true); }}>
                          <div className="aspect-video bg-muted relative overflow-hidden">
                            {primaryImage ? (
                              <img src={primaryImage} alt={req.vehicle_interest} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Car className="h-12 w-12 text-muted-foreground/30" /></div>
                            )}
                            {details?.images?.length > 1 && (
                              <Badge className="absolute bottom-2 right-2 bg-black/60 text-white border-0 text-xs">
                                <Image className="h-3 w-3 mr-1" />{details.images.length} photos
                              </Badge>
                            )}
                            <Badge className={`absolute top-2 left-2 border-0 text-xs ${req.status === 'new' ? 'bg-amber-500 text-white' : req.status === 'contacted' ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white'}`}>
                              {req.status}
                            </Badge>
                          </div>
                          <div className="p-4 space-y-2">
                            <h3 className="font-semibold text-foreground truncate">{req.vehicle_interest}</h3>
                            {details?.variant && <p className="text-xs text-muted-foreground">{details.variant}</p>}
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{req.customer_name}</span>
                              {req.budget_min ? <span className="font-bold text-primary">{formatCurrency(req.budget_min)}</span> : null}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(req.created_at).toLocaleDateString("en-IN")}
                              {req.city && <><MapPin className="h-3 w-3 ml-2" />{req.city}</>}
                            </div>
                            {req.assigned_to && (
                              <Badge variant="outline" className="text-xs mt-1 border-blue-200 text-blue-600">
                                Assigned
                              </Badge>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ===== SUPPORT ===== */}
          {activeAdminTab === "tickets" && (
            <Card className="border shadow-sm">
              <CardHeader className="border-b border-border">
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
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No tickets yet</TableCell></TableRow>
                    ) : supportTickets.map((ticket: any) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="text-sm whitespace-nowrap">{new Date(ticket.created_at).toLocaleDateString("en-IN")}</TableCell>
                        <TableCell className="font-medium">{ticket.name}</TableCell>
                        <TableCell className="text-sm">{ticket.email}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs capitalize">{ticket.subject || "general"}</Badge></TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{ticket.message}</TableCell>
                        <TableCell><Badge className={ticket.status === "open" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}>{ticket.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* ===== SETTINGS ===== */}
          {activeAdminTab === "settings" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Settings className="h-5 w-5" /> Marketplace Settings
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* General Config */}
                <Card className="border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">General Configuration</CardTitle>
                    <CardDescription>Core marketplace parameters</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { key: "marketplace_name", label: "Marketplace Name", placeholder: "VahanHub Marketplace" },
                      { key: "support_phone", label: "Support Phone", placeholder: "1800-123-4567" },
                      { key: "support_email", label: "Support Email", placeholder: "support@vahanhub.com" },
                      { key: "whatsapp_number", label: "WhatsApp Number", placeholder: "+91..." },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key} className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">{label}</label>
                        <div className="flex gap-2">
                          <Input
                            value={mpSettings[key] || ""}
                            placeholder={placeholder}
                            onChange={(e) => setMpSettings(prev => ({ ...prev, [key]: e.target.value }))}
                          />
                          <Button size="sm" variant="outline" disabled={savingSettings}
                            onClick={() => handleSaveMarketplaceSetting(key, mpSettings[key] || "")}>
                            Save
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Display Config */}
                <Card className="border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Display & Limits</CardTitle>
                    <CardDescription>Control what shows on marketplace</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { key: "max_featured_vehicles", label: "Max Featured Vehicles", placeholder: "5" },
                      { key: "max_featured_dealers", label: "Max Featured Dealers", placeholder: "5" },
                      { key: "vehicles_per_page", label: "Vehicles Per Page", placeholder: "6" },
                      { key: "hero_tagline", label: "Hero Tagline", placeholder: "India's most trusted vehicle marketplace" },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key} className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">{label}</label>
                        <div className="flex gap-2">
                          <Input
                            value={mpSettings[key] || ""}
                            placeholder={placeholder}
                            onChange={(e) => setMpSettings(prev => ({ ...prev, [key]: e.target.value }))}
                          />
                          <Button size="sm" variant="outline" disabled={savingSettings}
                            onClick={() => handleSaveMarketplaceSetting(key, mpSettings[key] || "")}>
                            Save
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* SEO & Meta */}
                <Card className="border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">SEO & Meta</CardTitle>
                    <CardDescription>Search engine and social sharing</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { key: "meta_title", label: "Meta Title", placeholder: "Buy & Sell Used Cars - VahanHub" },
                      { key: "meta_description", label: "Meta Description", placeholder: "India's fastest growing..." },
                      { key: "og_image_url", label: "OG Image URL", placeholder: "https://..." },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key} className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">{label}</label>
                        <div className="flex gap-2">
                          <Input
                            value={mpSettings[key] || ""}
                            placeholder={placeholder}
                            onChange={(e) => setMpSettings(prev => ({ ...prev, [key]: e.target.value }))}
                          />
                          <Button size="sm" variant="outline" disabled={savingSettings}
                            onClick={() => handleSaveMarketplaceSetting(key, mpSettings[key] || "")}>
                            Save
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Quick Actions</CardTitle>
                    <CardDescription>Administrative shortcuts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setBannerDialogOpen(true)}>
                      <Image className="h-4 w-4" /> Manage Hero Banners
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setActiveAdminTab("featured")}>
                      <Sparkles className="h-4 w-4" /> Manage Featured Items
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate("/")}>
                      <Globe className="h-4 w-4" /> View Live Marketplace
                    </Button>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Platform Stats</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 rounded bg-muted"><span className="font-bold">{stats.totalDealers}</span> <span className="text-muted-foreground">Dealers</span></div>
                        <div className="p-2 rounded bg-muted"><span className="font-bold">{stats.totalVehicles}</span> <span className="text-muted-foreground">Vehicles</span></div>
                        <div className="p-2 rounded bg-muted"><span className="font-bold">{stats.featuredDealers}</span> <span className="text-muted-foreground">Featured</span></div>
                        <div className="p-2 rounded bg-muted"><span className="font-bold">{stats.totalSellRequests}</span> <span className="text-muted-foreground">Sell Req</span></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

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

      {/* Sell Request Detail Dialog */}
      <Dialog open={sellDetailOpen} onOpenChange={setSellDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedSellRequest && (() => {
            const details = parseSellNotes(selectedSellRequest.notes);
            return (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedSellRequest.vehicle_interest}</DialogTitle>
                  <DialogDescription>
                    {details?.variant && <span>{details.variant} · </span>}
                    Submitted {new Date(selectedSellRequest.created_at).toLocaleDateString("en-IN")}
                  </DialogDescription>
                </DialogHeader>

                {/* Images Gallery */}
                {details?.images?.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
                    {details.images.map((img: string, i: number) => (
                      <div key={i} className={`${i === 0 ? 'col-span-2' : ''} bg-slate-100 rounded-lg overflow-hidden`}>
                        <img src={img} alt={`Vehicle photo ${i + 1}`} className="w-full h-auto max-h-64 object-contain bg-slate-50" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Vehicle Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: "Seller", value: selectedSellRequest.customer_name },
                    { label: "Phone", value: selectedSellRequest.phone },
                    { label: "Email", value: selectedSellRequest.email || "—" },
                    { label: "Expected Price", value: selectedSellRequest.budget_min ? formatCurrency(selectedSellRequest.budget_min) : "—" },
                    { label: "City", value: selectedSellRequest.city || "—" },
                    { label: "State", value: details?.state || "—" },
                    { label: "Fuel Type", value: details?.fuelType || "—" },
                    { label: "Transmission", value: details?.transmission || "—" },
                    { label: "KM Driven", value: details?.kmDriven ? `${details.kmDriven} km` : "—" },
                    { label: "Owners", value: details?.owners || "—" },
                    { label: "Color", value: details?.color || "—" },
                    { label: "Reg. Number", value: details?.registrationNumber || "—" },
                    { label: "Condition", value: details?.condition || "—" },
                    { label: "Insurance", value: details?.insuranceValid || "—" },
                    { label: "Accident History", value: details?.accidentHistory || "No" },
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-50">
                      <p className="text-xs text-slate-500">{item.label}</p>
                      <p className="font-medium text-sm text-slate-900 capitalize">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-slate-500">Status:</span>
                  <Badge className={selectedSellRequest.status === 'new' ? 'bg-amber-100 text-amber-700 border-0' : selectedSellRequest.status === 'contacted' ? 'bg-blue-100 text-blue-700 border-0' : selectedSellRequest.status === 'not_interested' ? 'bg-slate-100 text-slate-600 border-0' : 'bg-emerald-100 text-emerald-700 border-0'}>
                    {selectedSellRequest.status.replace("_", " ")}
                  </Badge>
                  {selectedSellRequest.assigned_to && (() => {
                    const assignedDealer = dealers.find(d => d.user_id === selectedSellRequest.assigned_to);
                    return (
                      <Badge variant="outline" className="border-blue-200 text-blue-600 gap-1">
                        <Building2 className="h-3 w-3" />
                        {assignedDealer?.dealer_name || "Unknown Dealer"}
                      </Badge>
                    );
                  })()}
                </div>

                {/* Assign to Dealer */}
                <div className="border-t pt-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900">Assign to Dealer</h4>
                    {selectedSellRequest.assigned_to && (() => {
                      const ad = dealers.find(d => d.user_id === selectedSellRequest.assigned_to);
                      return <p className="text-xs text-slate-500 mt-1">Currently: {ad?.dealer_name || selectedSellRequest.assigned_to}</p>;
                    })()}
                  </div>
                  <Button onClick={() => setAssignDialogOpen(true)} className="gap-2">
                    <Building2 className="h-4 w-4" />
                    Assign
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Assign Dealer Dialog - City-wise grouped */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign to Dealer</DialogTitle>
            <DialogDescription>
              Vehicle City: <Badge variant="outline" className="ml-1">{getSellRequestCity(selectedSellRequest) || "Not specified"}</Badge>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {(() => {
              const reqCity = getSellRequestCity(selectedSellRequest);
              const cityEntries = Object.entries(getDealersByCity);
              // Sort: matching city first
              const sorted = cityEntries.sort(([a], [b]) => {
                if (a === reqCity) return -1;
                if (b === reqCity) return 1;
                return a.localeCompare(b);
              });

              return sorted.map(([city, cityDealers]) => {
                const isMatchingCity = city === reqCity;
                return (
                  <div key={city} className={`rounded-xl border ${isMatchingCity ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200'}`}>
                    <div className={`px-4 py-2.5 flex items-center gap-2 ${isMatchingCity ? 'bg-blue-100/60' : 'bg-slate-50'} rounded-t-xl`}>
                      <MapPin className="h-4 w-4 text-slate-500" />
                      <span className="font-semibold text-sm text-slate-800">{city}</span>
                      {isMatchingCity && <Badge className="bg-blue-500 text-white border-0 text-[10px] ml-auto">Same City</Badge>}
                      <Badge variant="outline" className="text-[10px] ml-auto">{cityDealers.length}</Badge>
                    </div>
                    <div className="p-2 space-y-1">
                      {cityDealers.map((d: any) => (
                        <button
                          key={d.user_id}
                          onClick={() => selectedSellRequest && handleAssignDealer(selectedSellRequest.id, d.user_id)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-blue-100/50 transition-colors text-left"
                        >
                          {d.shop_logo_url ? (
                            <img src={d.shop_logo_url} alt="" className="h-9 w-9 rounded-lg object-cover" />
                          ) : (
                            <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-slate-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-slate-900 truncate">{d.dealer_name}</p>
                            <p className="text-xs text-slate-500">{d.dealer_phone || ''}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0">{getDealerVehicleCount(d.user_id)} vehicles</Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
            {Object.keys(getDealersByCity).length === 0 && (
              <p className="text-center text-muted-foreground py-8">No dealers found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Banner Dialog */}
      <Dialog open={bannerDialogOpen} onOpenChange={setBannerDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
    </div>
  );
};

export default MarketplaceAdmin;
