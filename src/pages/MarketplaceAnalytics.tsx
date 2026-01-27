import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3, Eye, MessageSquare, Phone, TrendingUp, Car, Users,
  Globe, ArrowUpRight, ArrowDownRight, Calendar
} from "lucide-react";
import { formatCurrency, formatIndianNumber } from "@/lib/formatters";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import CarLoader from "@/components/CarLoader";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from "recharts";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const MarketplaceAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalEnquiries: 0,
    totalCalls: 0,
    totalWhatsapp: 0,
    publicVehicles: 0,
    conversionRate: 0,
  });
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [vehicleStats, setVehicleStats] = useState<any[]>([]);
  const [period, setPeriod] = useState("7d");

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      const startDate = startOfDay(subDays(new Date(), days));

      // Fetch ONLY marketplace-specific events (from marketplace pages, not public dealer pages)
      // Marketplace events have public_page_id = "marketplace" or come from vehicle_view in marketplace context
      const { data: events } = await supabase
        .from("public_page_events")
        .select("*")
        .eq("dealer_user_id", user.id)
        .eq("public_page_id", "marketplace")
        .gte("created_at", startDate.toISOString());

      // Fetch marketplace-enabled vehicles count
      const { count: publicVehiclesCount } = await supabase
        .from("vehicles")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_public", true)
        .eq("marketplace_status", "listed");

      // Calculate stats - only marketplace events
      const views = (events || []).filter(e => 
        e.event_type === "vehicle_view" || e.event_type === "dealer_view"
      ).length;
      const enquiries = (events || []).filter(e => e.event_type === "enquiry_submit").length;
      const calls = (events || []).filter(e => e.event_type === "cta_call").length;
      const whatsapp = (events || []).filter(e => e.event_type === "cta_whatsapp").length;

      setStats({
        totalViews: views,
        totalEnquiries: enquiries,
        totalCalls: calls,
        totalWhatsapp: whatsapp,
        publicVehicles: publicVehiclesCount || 0,
        conversionRate: views > 0 ? ((enquiries + calls + whatsapp) / views) * 100 : 0,
      });

      // Daily breakdown
      const dailyMap: Record<string, { date: string; views: number; enquiries: number }> = {};
      for (let i = 0; i < days; i++) {
        const d = format(subDays(new Date(), i), "MMM dd");
        dailyMap[d] = { date: d, views: 0, enquiries: 0 };
      }

      (events || []).forEach(e => {
        const d = format(new Date(e.created_at), "MMM dd");
        if (dailyMap[d]) {
          if (e.event_type === "vehicle_view" || e.event_type === "dealer_view") dailyMap[d].views++;
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
        const { data: vehiclesData } = await supabase
          .from("vehicles")
          .select("id, brand, model, manufacturing_year, selling_price")
          .in("id", vehicleIds);

        const enriched = (vehiclesData || []).map(v => ({
          ...v,
          ...vehicleMap[v.id],
          name: `${v.manufacturing_year} ${v.brand} ${v.model}`,
        })).sort((a, b) => b.views - a.views);

        setVehicleStats(enriched.slice(0, 10));
      }

    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <CarLoader variant="top" text="Loading analytics..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Marketplace Analytics
          </h1>
          <p className="text-muted-foreground">Track your marketplace performance</p>
        </div>
        <div className="flex gap-2">
          {["7d", "30d", "90d"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? "bg-blue-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Views", value: stats.totalViews, icon: Eye, color: "text-blue-600 bg-blue-50" },
          { label: "Enquiries", value: stats.totalEnquiries, icon: MessageSquare, color: "text-green-600 bg-green-50" },
          { label: "Calls", value: stats.totalCalls, icon: Phone, color: "text-purple-600 bg-purple-50" },
          { label: "WhatsApp", value: stats.totalWhatsapp, icon: MessageSquare, color: "text-emerald-600 bg-emerald-50" },
          { label: "Public Vehicles", value: stats.publicVehicles, icon: Car, color: "text-amber-600 bg-amber-50" },
          { label: "Conversion Rate", value: `${stats.conversionRate.toFixed(1)}%`, icon: TrendingUp, color: "text-rose-600 bg-rose-50" },
        ].map((stat, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views Over Time */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Views & Enquiries Trend</CardTitle>
            <CardDescription>Daily performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" fontSize={12} stroke="#9CA3AF" />
                  <YAxis fontSize={12} stroke="#9CA3AF" />
                  <Tooltip />
                  <Line type="monotone" dataKey="views" stroke="#3B82F6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="enquiries" stroke="#10B981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Vehicles */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Top Performing Vehicles</CardTitle>
            <CardDescription>Most viewed vehicles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vehicleStats.map((v, i) => (
                <div key={v.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-6">#{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{v.name}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(v.selling_price)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-blue-600">
                      <Eye className="h-3 w-3" /> {v.views}
                    </span>
                    <span className="flex items-center gap-1 text-green-600">
                      <MessageSquare className="h-3 w-3" /> {v.enquiries}
                    </span>
                  </div>
                </div>
              ))}
              {vehicleStats.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No vehicle data available for this period
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MarketplaceAnalytics;
