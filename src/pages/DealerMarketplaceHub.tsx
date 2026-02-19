import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatters";
import {
  Car, Clock, MapPin, Phone, User, Eye, CheckCircle, XCircle,
  Calendar, Fuel, Gauge, Tag, MessageSquare,
  BarChart3, TrendingUp, Mail, Store, Users, ArrowUpRight
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, startOfDay } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from "recharts";

// Tab Types - Only dealer-relevant tabs (removed all-vehicles and dealers)
type HubTab = "analytics" | "vehicles-for-sale";

interface SellRequest {
  id: string;
  lead_number: string;
  customer_name: string;
  phone: string;
  email: string | null;
  city: string | null;
  vehicle_interest: string;
  notes: string | null;
  status: string;
  created_at: string;
  parsedData?: {
    type?: string;
    vehicleType?: string;
    brand?: string;
    model?: string;
    year?: number;
    fuelType?: string;
    transmission?: string;
    kmDriven?: string;
    expectedPrice?: string;
    owners?: string;
    description?: string;
    images?: string[];
  };
}

interface TestDriveRequest {
  id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  vehicle_interest: string;
  notes: string | null;
  status: string;
  created_at: string;
  testDriveDate?: string;
  testDriveTime?: string;
  isTestDrive: boolean;
}

interface DealerMarketplaceHubProps {
  // Optional props for when used as a component
}

const DealerMarketplaceHub = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<HubTab>("analytics");
  const [userId, setUserId] = useState<string | null>(null);

  // Analytics state
  const [analyticsStats, setAnalyticsStats] = useState({
    dealerPageViews: 0,
    vehiclePageViews: 0,
    totalEnquiries: 0,
    testDriveRequests: 0,
    totalCalls: 0,
    totalWhatsapp: 0,
    publicVehicles: 0,
    conversionRate: 0,
  });
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [vehicleStats, setVehicleStats] = useState<any[]>([]);
  const [period, setPeriod] = useState("7d");

  // Test Drive & Enquiries state (combined)
  const [marketplaceLeads, setMarketplaceLeads] = useState<TestDriveRequest[]>([]);

  // Vehicles for Sale state
  const [sellRequests, setSellRequests] = useState<SellRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SellRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Initial auth check - only runs once
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Fetch data when userId changes or period changes
  useEffect(() => {
    if (userId) {
      fetchAllData();

      // Realtime subscription for instant updates
      const channel = supabase
        .channel("hub-leads-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "leads" },
          () => fetchAllData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId, period]);

  const fetchAllData = async () => {
    if (!userId) return;

    try {
      await Promise.all([
        fetchAnalytics(userId),
        fetchMarketplaceLeads(userId),
        fetchSellRequests(userId)
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchAnalytics = async (uid: string) => {
    try {
      const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      const startDate = startOfDay(subDays(new Date(), days));

      // Fetch ONLY marketplace-specific events
      const { data: events } = await supabase
        .from("public_page_events")
        .select("*")
        .eq("dealer_user_id", uid)
        .eq("public_page_id", "marketplace")
        .gte("created_at", startDate.toISOString());

      const { count: publicVehiclesCount } = await supabase
        .from("vehicles")
        .select("*", { count: "exact", head: true })
        .eq("user_id", uid)
        .eq("is_public", true);

      // Separate dealer page views and vehicle page views
      const dealerViews = (events || []).filter(e => e.event_type === "dealer_view").length;
      const vehicleViews = (events || []).filter(e => e.event_type === "vehicle_view").length;
      const enquiriesCount = (events || []).filter(e => e.event_type === "enquiry_submit").length;
      const calls = (events || []).filter(e => e.event_type === "cta_call").length;
      const whatsapp = (events || []).filter(e => e.event_type === "cta_whatsapp").length;

      // Count test drive requests from leads
      const { count: testDriveCount } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("user_id", uid)
        .eq("source", "marketplace")
        .ilike("notes", "%TEST DRIVE REQUESTED%");

      const totalViews = dealerViews + vehicleViews;

      setAnalyticsStats({
        dealerPageViews: dealerViews,
        vehiclePageViews: vehicleViews,
        totalEnquiries: enquiriesCount,
        testDriveRequests: testDriveCount || 0,
        totalCalls: calls,
        totalWhatsapp: whatsapp,
        publicVehicles: publicVehiclesCount || 0,
        conversionRate: totalViews > 0 ? ((enquiriesCount + calls + whatsapp) / totalViews) * 100 : 0,
      });
      setStatsLoaded(true);

      // Daily breakdown with separate dealer/vehicle views
      const dailyMap: Record<string, { date: string; dealerViews: number; vehicleViews: number; enquiries: number }> = {};
      for (let i = 0; i < days; i++) {
        const d = format(subDays(new Date(), i), "MMM dd");
        dailyMap[d] = { date: d, dealerViews: 0, vehicleViews: 0, enquiries: 0 };
      }

      (events || []).forEach(e => {
        const d = format(new Date(e.created_at), "MMM dd");
        if (dailyMap[d]) {
          if (e.event_type === "dealer_view") dailyMap[d].dealerViews++;
          if (e.event_type === "vehicle_view") dailyMap[d].vehicleViews++;
          if (e.event_type === "enquiry_submit") dailyMap[d].enquiries++;
        }
      });

      setDailyData(Object.values(dailyMap).reverse());

      // Vehicle-wise stats
      const vehicleMap: Record<string, { id: string; views: number; enquiries: number }> = {};
      (events || []).filter(e => e.vehicle_id).forEach(e => {
        if (!vehicleMap[e.vehicle_id]) {
          vehicleMap[e.vehicle_id] = { id: e.vehicle_id, views: 0, enquiries: 0 };
        }
        if (e.event_type === "vehicle_view") vehicleMap[e.vehicle_id].views++;
        if (e.event_type === "enquiry_submit") vehicleMap[e.vehicle_id].enquiries++;
      });

      const vehicleIds = Object.keys(vehicleMap);
      if (vehicleIds.length > 0) {
        const [{ data: vehiclesData }, { data: imagesData }] = await Promise.all([
          supabase.from("vehicles").select("id, brand, model, manufacturing_year, selling_price").in("id", vehicleIds),
          supabase.from("vehicle_images").select("vehicle_id, image_url, is_primary").in("vehicle_id", vehicleIds),
        ]);

        const imageMap: Record<string, string> = {};
        (imagesData || []).forEach(img => {
          if (!imageMap[img.vehicle_id] || img.is_primary) imageMap[img.vehicle_id] = img.image_url;
        });

        const enriched = (vehiclesData || []).map(v => ({
          ...v,
          ...vehicleMap[v.id],
          name: `${v.manufacturing_year} ${v.brand} ${v.model}`,
          image_url: imageMap[v.id] || null,
        })).sort((a, b) => b.views - a.views);

        setVehicleStats(enriched.slice(0, 10));
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const fetchMarketplaceLeads = async (uid: string) => {
    // Fetch all marketplace leads (both enquiries and test drives)
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", uid)
      .eq("source", "marketplace")
      .order("created_at", { ascending: false });

    const parsed = (data || []).map(lead => {
      const notes = lead.notes || "";
      const isTestDrive = notes.includes("TEST DRIVE REQUESTED");
      const dateMatch = notes.match(/TEST DRIVE REQUESTED: (\d{4}-\d{2}-\d{2})/);
      const timeMatch = notes.match(/at (\d{1,2}:\d{2} [AP]M)/);
      return {
        ...lead,
        testDriveDate: dateMatch?.[1],
        testDriveTime: timeMatch?.[1],
        isTestDrive
      };
    });

    setMarketplaceLeads(parsed);
  };

  const fetchSellRequests = async (uid: string) => {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", uid)
      .eq("lead_type", "selling")
      .order("created_at", { ascending: false });

    const parsedRequests = (data || []).map(req => {
      let parsedData = {};
      try {
        if (req.notes) {
          parsedData = JSON.parse(req.notes);
        }
      } catch {}
      return { ...req, parsedData } as SellRequest;
    });

    setSellRequests(parsedRequests);
  };

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      await supabase
        .from("leads")
        .update({ status: newStatus })
        .eq("id", requestId);

      toast({ title: `Status updated to ${newStatus}` });
      if (userId) fetchAllData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const tabs: { id: HubTab; label: string; icon: any }[] = [
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "vehicles-for-sale", label: "Vehicles for Sale", icon: Tag },
  ];

  const statusColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-700",
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-emerald-100 text-emerald-700",
    completed: "bg-purple-100 text-purple-700",
    contacted: "bg-amber-100 text-amber-700",
    interested: "bg-emerald-100 text-emerald-700",
    not_interested: "bg-slate-100 text-slate-600",
    purchased: "bg-purple-100 text-purple-700",
  };

  // Separate test drives and enquiries
  const testDrives = useMemo(() => marketplaceLeads.filter(l => l.isTestDrive), [marketplaceLeads]);
  const enquiries = useMemo(() => marketplaceLeads.filter(l => !l.isTestDrive), [marketplaceLeads]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Marketplace Hub
          </h1>
          <p className="text-muted-foreground">Manage your marketplace presence</p>
        </div>
      </div>

      {/* Tab Switcher - Zoho Style */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div className="space-y-6 animate-fade-in">
          {/* Period Selector */}
          <div className="flex gap-2">
            {["7d", "30d", "90d"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === p
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "90 Days"}
              </button>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Dealer Page Views", value: analyticsStats.dealerPageViews, icon: Store, color: "text-blue-600 bg-blue-50" },
              { label: "Vehicle Page Views", value: analyticsStats.vehiclePageViews, icon: Eye, color: "text-indigo-600 bg-indigo-50" },
              { label: "Total Enquiries", value: analyticsStats.totalEnquiries, icon: MessageSquare, color: "text-green-600 bg-green-50" },
              { label: "Test Drive Requests", value: analyticsStats.testDriveRequests, icon: Calendar, color: "text-purple-600 bg-purple-50" },
              { label: "Calls", value: analyticsStats.totalCalls, icon: Phone, color: "text-amber-600 bg-amber-50" },
              { label: "WhatsApp", value: analyticsStats.totalWhatsapp, icon: MessageSquare, color: "text-emerald-600 bg-emerald-50" },
              { label: "Public Vehicles", value: analyticsStats.publicVehicles, icon: Car, color: "text-slate-600 bg-slate-100" },
              { label: "Conversion Rate", value: `${analyticsStats.conversionRate.toFixed(1)}%`, icon: TrendingUp, color: "text-rose-600 bg-rose-50" },
            ].map((stat, i) => (
              <Card key={i} className="border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg ${stat.color} flex items-center justify-center shrink-0`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      {statsLoaded ? (
                        <p className="text-2xl font-bold text-foreground tabular-nums">{stat.value}</p>
                      ) : (
                        <Skeleton className="h-8 w-16 rounded" />
                      )}
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Dealer Page vs Vehicle Page Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dealer Page Analytics */}
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Store className="h-4 w-4 text-blue-600" />
                  Dealer Page Performance
                </CardTitle>
                <CardDescription>Views and engagement on your dealer page</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyData.slice(-7)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" fontSize={10} stroke="hsl(var(--muted-foreground))" />
                      <YAxis fontSize={10} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip />
                      <Bar dataKey="dealerViews" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Page Analytics */}
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Car className="h-4 w-4 text-indigo-600" />
                  Vehicle Page Performance
                </CardTitle>
                <CardDescription>Views and enquiries per vehicle</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" fontSize={10} stroke="hsl(var(--muted-foreground))" />
                      <YAxis fontSize={10} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip />
                      <Line type="monotone" dataKey="vehicleViews" stroke="hsl(245 58% 58%)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="enquiries" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Vehicles - Grid Cards with Images */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Top Performing Vehicles</CardTitle>
              <CardDescription>Individual vehicle analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {vehicleStats.map((v, i) => (
                  <Card key={v.id} className="overflow-hidden border hover:shadow-md transition-shadow">
                    <div className="aspect-video bg-muted relative">
                      {v.image_url ? (
                        <img src={v.image_url} alt={v.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">#{i + 1}</span>
                      </div>
                    </div>
                    <CardContent className="p-3 space-y-2">
                      <p className="text-sm font-semibold text-foreground truncate">{v.name}</p>
                      <p className="text-xs text-primary font-bold">{formatCurrency(v.selling_price)}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 text-blue-600"><Eye className="h-3 w-3" /> {v.views}</span>
                        <span className="flex items-center gap-1 text-green-600"><MessageSquare className="h-3 w-3" /> {v.enquiries}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {vehicleStats.length === 0 && (
                  <p className="col-span-full text-center text-muted-foreground py-8">No vehicle data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}


      {/* Vehicles for Sale Tab */}
      {activeTab === "vehicles-for-sale" && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "New Requests", value: sellRequests.filter(r => r.status === "new").length, color: "text-blue-600 bg-blue-50" },
              { label: "Contacted", value: sellRequests.filter(r => r.status === "contacted").length, color: "text-amber-600 bg-amber-50" },
              { label: "Purchased", value: sellRequests.filter(r => r.status === "purchased").length, color: "text-emerald-600 bg-emerald-50" },
              { label: "Total", value: sellRequests.length, color: "text-slate-600 bg-slate-100" },
            ].map((stat, i) => (
              <Card key={i} className="border shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <Tag className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border shadow-sm">
            <CardContent className="p-0">
              <div className="divide-y">
                {sellRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedRequest(req);
                      setDetailOpen(true);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{req.customer_name}</span>
                          <Badge className={statusColors[req.status] || "bg-slate-100"}>
                            {req.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{req.vehicle_interest}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {req.phone}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(req.created_at), "MMM dd")}
                      </span>
                    </div>
                  </div>
                ))}
                {sellRequests.length === 0 && (
                  <p className="text-center text-muted-foreground py-12">
                    No vehicle selling requests yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detail Dialog for Sell Requests */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Vehicle Selling Request</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedRequest.customer_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedRequest.phone}</p>
                </div>
                {selectedRequest.email && (
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedRequest.email}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Vehicle</p>
                  <p className="font-medium">{selectedRequest.vehicle_interest}</p>
                </div>
              </div>

              {selectedRequest.parsedData && Object.keys(selectedRequest.parsedData).length > 0 && (
                <div className="pt-4 border-t">
                  <p className="font-medium mb-2">Vehicle Details</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {selectedRequest.parsedData.brand && (
                      <p><span className="text-muted-foreground">Brand:</span> {selectedRequest.parsedData.brand}</p>
                    )}
                    {selectedRequest.parsedData.model && (
                      <p><span className="text-muted-foreground">Model:</span> {selectedRequest.parsedData.model}</p>
                    )}
                    {selectedRequest.parsedData.year && (
                      <p><span className="text-muted-foreground">Year:</span> {selectedRequest.parsedData.year}</p>
                    )}
                    {selectedRequest.parsedData.expectedPrice && (
                      <p><span className="text-muted-foreground">Expected:</span> {selectedRequest.parsedData.expectedPrice}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={() => handleStatusUpdate(selectedRequest.id, "contacted")} variant="outline">
                  Mark Contacted
                </Button>
                <Button onClick={() => handleStatusUpdate(selectedRequest.id, "purchased")}>
                  Mark Purchased
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DealerMarketplaceHub;
