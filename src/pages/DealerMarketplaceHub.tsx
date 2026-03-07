import { useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatters";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Car, Phone, Eye, Calendar, MessageSquare,
  BarChart3, TrendingUp, Store, Tag
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, startOfDay } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from "recharts";

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
  parsedData?: Record<string, any>;
}

// ─── Auth hook (single call, cached) ───
const useCurrentUserId = () => {
  const { data: userId, isLoading } = useQuery({
    queryKey: ['auth-user-id'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id ?? null;
    },
    staleTime: Infinity, // Auth doesn't change mid-session
    gcTime: Infinity,
  });
  return { userId: userId ?? null, isLoading };
};

// ─── Analytics query ───
const useHubAnalytics = (userId: string | null, period: string) => {
  return useQuery({
    queryKey: ['hub-analytics', userId, period],
    queryFn: async () => {
      if (!userId) return null;
      const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      const startDate = startOfDay(subDays(new Date(), days));

      // Parallel: events + public vehicle count
      const [{ data: events }, { count: publicVehiclesCount }] = await Promise.all([
        supabase
          .from("public_page_events")
          .select("event_type, vehicle_id, created_at")
          .eq("dealer_user_id", userId)
          .eq("public_page_id", "marketplace")
          .gte("created_at", startDate.toISOString()),
        supabase
          .from("vehicles")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("is_public", true),
      ]);

      const allEvents = events || [];
      const dealerViews = allEvents.filter(e => e.event_type === "dealer_view").length;
      const vehicleViews = allEvents.filter(e => e.event_type === "vehicle_view").length;
      const enquiriesCount = allEvents.filter(e => e.event_type === "enquiry_submit").length;
      const calls = allEvents.filter(e => e.event_type === "cta_call").length;
      const whatsapp = allEvents.filter(e => e.event_type === "cta_whatsapp").length;
      const totalViews = dealerViews + vehicleViews;

      // Daily breakdown
      const dailyMap: Record<string, { date: string; dealerViews: number; vehicleViews: number; enquiries: number }> = {};
      for (let i = 0; i < days; i++) {
        const d = format(subDays(new Date(), i), "MMM dd");
        dailyMap[d] = { date: d, dealerViews: 0, vehicleViews: 0, enquiries: 0 };
      }
      allEvents.forEach(e => {
        const d = format(new Date(e.created_at), "MMM dd");
        if (dailyMap[d]) {
          if (e.event_type === "dealer_view") dailyMap[d].dealerViews++;
          if (e.event_type === "vehicle_view") dailyMap[d].vehicleViews++;
          if (e.event_type === "enquiry_submit") dailyMap[d].enquiries++;
        }
      });

      // Vehicle-wise stats
      const vehicleMap: Record<string, { id: string; views: number; enquiries: number }> = {};
      allEvents.filter(e => e.vehicle_id).forEach(e => {
        if (!vehicleMap[e.vehicle_id!]) vehicleMap[e.vehicle_id!] = { id: e.vehicle_id!, views: 0, enquiries: 0 };
        if (e.event_type === "vehicle_view") vehicleMap[e.vehicle_id!].views++;
        if (e.event_type === "enquiry_submit") vehicleMap[e.vehicle_id!].enquiries++;
      });

      let vehicleStats: any[] = [];
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
        vehicleStats = (vehiclesData || []).map(v => ({
          ...v, ...vehicleMap[v.id],
          name: `${v.manufacturing_year} ${v.brand} ${v.model}`,
          image_url: imageMap[v.id] || null,
        })).sort((a, b) => b.views - a.views).slice(0, 10);
      }

      return {
        stats: {
          dealerPageViews: dealerViews,
          vehiclePageViews: vehicleViews,
          totalEnquiries: enquiriesCount,
          testDriveRequests: 0, // Will be derived from leads query
          totalCalls: calls,
          totalWhatsapp: whatsapp,
          publicVehicles: publicVehiclesCount || 0,
          conversionRate: totalViews > 0 ? ((enquiriesCount + calls + whatsapp) / totalViews) * 100 : 0,
        },
        dailyData: Object.values(dailyMap).reverse(),
        vehicleStats,
      };
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 min
  });
};

// ─── Marketplace leads query ───
const useMarketplaceLeads = (userId: string | null) => {
  return useQuery({
    queryKey: ['hub-marketplace-leads', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from("leads")
        .select("id, lead_number, customer_name, phone, email, vehicle_interest, notes, status, created_at")
        .eq("user_id", userId)
        .eq("source", "marketplace")
        .order("created_at", { ascending: false })
        .limit(200);

      return (data || []).map(lead => {
        const notes = lead.notes || "";
        const isTestDrive = notes.includes("TEST DRIVE REQUESTED");
        const dateMatch = notes.match(/TEST DRIVE REQUESTED: (\d{4}-\d{2}-\d{2})/);
        const timeMatch = notes.match(/at (\d{1,2}:\d{2} [AP]M)/);
        return { ...lead, testDriveDate: dateMatch?.[1], testDriveTime: timeMatch?.[1], isTestDrive };
      });
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
};

// ─── Sell requests query ───
const useSellRequests = (userId: string | null) => {
  return useQuery({
    queryKey: ['hub-sell-requests', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from("leads")
        .select("id, lead_number, customer_name, phone, email, city, vehicle_interest, notes, status, created_at")
        .eq("assigned_to", userId)
        .eq("source", "marketplace_sell")
        .order("created_at", { ascending: false })
        .limit(200);

      return (data || []).map(req => {
        let parsedData = {};
        try { if (req.notes) parsedData = JSON.parse(req.notes); } catch {}
        return { ...req, parsedData } as SellRequest;
      });
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
};

const DealerMarketplaceHub = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<HubTab>("analytics");
  const [period, setPeriod] = useState("7d");
  const [selectedRequest, setSelectedRequest] = useState<SellRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { userId, isLoading: authLoading } = useCurrentUserId();
  const { data: analyticsData, isLoading: analyticsLoading } = useHubAnalytics(userId, period);
  const { data: marketplaceLeads = [] } = useMarketplaceLeads(userId);
  const { data: sellRequests = [] } = useSellRequests(userId);

  const analyticsStats = analyticsData?.stats || {
    dealerPageViews: 0, vehiclePageViews: 0, totalEnquiries: 0,
    testDriveRequests: 0, totalCalls: 0, totalWhatsapp: 0,
    publicVehicles: 0, conversionRate: 0,
  };
  const dailyData = analyticsData?.dailyData || [];
  const vehicleStats = analyticsData?.vehicleStats || [];

  // Derive test drive count from leads
  const testDriveCount = useMemo(() => marketplaceLeads.filter(l => l.isTestDrive).length, [marketplaceLeads]);
  const statsWithTestDrives = { ...analyticsStats, testDriveRequests: testDriveCount };

  const handleStatusUpdate = useCallback(async (requestId: string, newStatus: string) => {
    try {
      await supabase.from("leads").update({ status: newStatus }).eq("id", requestId);
      toast({ title: `Status updated to ${newStatus}` });
      // Invalidate only the affected query
      queryClient.invalidateQueries({ queryKey: ['hub-sell-requests', userId] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  }, [userId, queryClient, toast]);

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

  const tabs: { id: HubTab; label: string; icon: any }[] = [
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "vehicles-for-sale", label: "Vehicles for Sale", icon: Tag },
  ];

  if (authLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
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

      {/* Tab Switcher */}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[
              { label: "Dealer Page Views", value: statsWithTestDrives.dealerPageViews, icon: Store, color: "text-blue-600 bg-blue-50" },
              { label: "Vehicle Page Views", value: statsWithTestDrives.vehiclePageViews, icon: Eye, color: "text-indigo-600 bg-indigo-50" },
              { label: "Total Enquiries", value: statsWithTestDrives.totalEnquiries, icon: MessageSquare, color: "text-green-600 bg-green-50" },
              { label: "Test Drive Requests", value: statsWithTestDrives.testDriveRequests, icon: Calendar, color: "text-purple-600 bg-purple-50" },
              { label: "Calls", value: statsWithTestDrives.totalCalls, icon: Phone, color: "text-amber-600 bg-amber-50" },
              { label: "WhatsApp", value: statsWithTestDrives.totalWhatsapp, icon: MessageSquare, color: "text-emerald-600 bg-emerald-50" },
              { label: "Public Vehicles", value: statsWithTestDrives.publicVehicles, icon: Car, color: "text-slate-600 bg-slate-100" },
              { label: "Conversion Rate", value: `${statsWithTestDrives.conversionRate.toFixed(1)}%`, icon: TrendingUp, color: "text-rose-600 bg-rose-50" },
            ].map((stat, i) => (
              <Card key={i} className="border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg ${stat.color} flex items-center justify-center shrink-0`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      {!analyticsLoading ? (
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

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          {/* Top Performing Vehicles */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Top Performing Vehicles</CardTitle>
              <CardDescription>Individual vehicle analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {vehicleStats.map((v: any, i: number) => (
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
                    onClick={() => { setSelectedRequest(req); setDetailOpen(true); }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{req.customer_name}</span>
                          <Badge className={statusColors[req.status] || "bg-slate-100"}>{req.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{req.vehicle_interest}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {req.phone}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">{format(new Date(req.created_at), "MMM dd")}</span>
                    </div>
                  </div>
                ))}
                {sellRequests.length === 0 && (
                  <p className="text-center text-muted-foreground py-12">No vehicle selling requests yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vehicle Selling Request</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              {selectedRequest.parsedData?.images?.length > 0 && (
                <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
                  {selectedRequest.parsedData.images.map((img: string, i: number) => (
                    <div key={i} className={`${i === 0 ? 'col-span-2' : ''} bg-muted rounded-lg overflow-hidden`}>
                      <img src={img} alt={`Vehicle photo ${i + 1}`} className="w-full h-auto max-h-64 object-contain bg-muted" />
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {[
                  { label: "Customer", value: selectedRequest.customer_name },
                  { label: "Phone", value: selectedRequest.phone },
                  { label: "Email", value: selectedRequest.email },
                  { label: "Vehicle", value: selectedRequest.vehicle_interest },
                  { label: "City", value: selectedRequest.city },
                  { label: "Brand", value: selectedRequest.parsedData?.brand },
                  { label: "Model", value: selectedRequest.parsedData?.model },
                  { label: "Year", value: selectedRequest.parsedData?.year },
                  { label: "Vehicle Type", value: selectedRequest.parsedData?.vehicleType },
                  { label: "Fuel Type", value: selectedRequest.parsedData?.fuelType },
                  { label: "Transmission", value: selectedRequest.parsedData?.transmission },
                  { label: "KM Driven", value: selectedRequest.parsedData?.kmDriven ? `${selectedRequest.parsedData.kmDriven} km` : null },
                  { label: "Expected Price", value: selectedRequest.parsedData?.expectedPrice },
                  { label: "Owners", value: selectedRequest.parsedData?.owners },
                ].filter(f => f.value).map((field, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted">
                    <p className="text-muted-foreground text-xs">{field.label}</p>
                    <p className="font-medium capitalize">{field.value}</p>
                  </div>
                ))}
              </div>

              {selectedRequest.parsedData?.description && (
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-muted-foreground text-xs mb-1">Description</p>
                  <p className="text-sm">{selectedRequest.parsedData.description}</p>
                </div>
              )}

              <div className="space-y-2 pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "contacted", label: "Contacted", color: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
                    { value: "purchased", label: "Purchased", color: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" },
                    { value: "not_interested", label: "Not Interested", color: "bg-slate-100 text-slate-600 hover:bg-slate-200" },
                  ].map((s) => (
                    <Button
                      key={s.value}
                      size="sm"
                      variant="outline"
                      className={`${selectedRequest.status === s.value ? s.color + " border-2 font-bold" : ""}`}
                      onClick={() => {
                        handleStatusUpdate(selectedRequest.id, s.value);
                        setSelectedRequest({ ...selectedRequest, status: s.value });
                      }}
                    >
                      {selectedRequest.status === s.value ? "✓ " : ""}{s.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DealerMarketplaceHub;
