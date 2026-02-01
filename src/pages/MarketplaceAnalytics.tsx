import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3, Eye, MessageSquare, Phone, TrendingUp, Car, Users,
  Globe, Calendar, Zap
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { format, subDays, startOfDay } from "date-fns";
import { AnalyticsSkeleton } from "@/components/ui/page-skeleton";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from "recharts";
import {
  MetricCard, EngagementRing, ReachGraph, AudienceInsight,
  TopContent, ActivityHeatmap, QuickInsights
} from "@/components/analytics/SocialStyleMetrics";

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
  const [prevStats, setPrevStats] = useState({
    totalViews: 0,
    totalEnquiries: 0,
    totalCalls: 0,
    totalWhatsapp: 0,
  });
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [vehicleStats, setVehicleStats] = useState<any[]>([]);
  const [hourStats, setHourStats] = useState<any[]>([]);
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
      const prevStartDate = startOfDay(subDays(new Date(), days * 2));

      // Fetch marketplace-specific events
      const { data: events } = await supabase
        .from("public_page_events")
        .select("*")
        .eq("dealer_user_id", user.id)
        .eq("public_page_id", "marketplace")
        .gte("created_at", startDate.toISOString());

      // Fetch previous period for comparison
      const { data: prevEvents } = await supabase
        .from("public_page_events")
        .select("event_type")
        .eq("dealer_user_id", user.id)
        .eq("public_page_id", "marketplace")
        .gte("created_at", prevStartDate.toISOString())
        .lt("created_at", startDate.toISOString());

      // Fetch marketplace-enabled vehicles count
      const { count: publicVehiclesCount } = await supabase
        .from("vehicles")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_public", true)
        .eq("marketplace_status", "listed");

      // Calculate stats
      const views = (events || []).filter(e => 
        e.event_type === "vehicle_view" || e.event_type === "dealer_view"
      ).length;
      const enquiries = (events || []).filter(e => e.event_type === "enquiry_submit").length;
      const calls = (events || []).filter(e => e.event_type === "cta_call").length;
      const whatsapp = (events || []).filter(e => e.event_type === "cta_whatsapp").length;

      // Previous period stats
      const prevViews = (prevEvents || []).filter(e => 
        e.event_type === "vehicle_view" || e.event_type === "dealer_view"
      ).length;
      const prevEnquiries = (prevEvents || []).filter(e => e.event_type === "enquiry_submit").length;
      const prevCalls = (prevEvents || []).filter(e => e.event_type === "cta_call").length;
      const prevWhatsapp = (prevEvents || []).filter(e => e.event_type === "cta_whatsapp").length;

      setStats({
        totalViews: views,
        totalEnquiries: enquiries,
        totalCalls: calls,
        totalWhatsapp: whatsapp,
        publicVehicles: publicVehiclesCount || 0,
        conversionRate: views > 0 ? ((enquiries + calls + whatsapp) / views) * 100 : 0,
      });

      setPrevStats({
        totalViews: prevViews,
        totalEnquiries: prevEnquiries,
        totalCalls: prevCalls,
        totalWhatsapp: prevWhatsapp,
      });

      // Daily breakdown for reach graph
      const dailyMap: Record<string, { date: string; reach: number; impressions: number }> = {};
      for (let i = 0; i < days; i++) {
        const d = format(subDays(new Date(), i), "MMM dd");
        dailyMap[d] = { date: d, reach: 0, impressions: 0 };
      }

      const sessionsByDate: Record<string, Set<string>> = {};
      (events || []).forEach(e => {
        const d = format(new Date(e.created_at), "MMM dd");
        if (dailyMap[d]) {
          dailyMap[d].impressions++;
          if (!sessionsByDate[d]) sessionsByDate[d] = new Set();
          sessionsByDate[d].add(e.session_id);
        }
      });

      Object.keys(dailyMap).forEach(d => {
        dailyMap[d].reach = sessionsByDate[d]?.size || 0;
      });

      setDailyData(Object.values(dailyMap).reverse());

      // Hour stats for heatmap
      const hourMap: Record<number, number> = {};
      (events || []).forEach(e => {
        const hour = new Date(e.created_at).getHours();
        hourMap[hour] = (hourMap[hour] || 0) + 1;
      });
      setHourStats(Array.from({ length: 24 }, (_, i) => ({ hour: i, count: hourMap[i] || 0 })));

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

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const engagementData = useMemo(() => [
    { name: "Views", value: stats.totalViews, color: COLORS[0] },
    { name: "Enquiries", value: stats.totalEnquiries, color: COLORS[1] },
    { name: "Calls", value: stats.totalCalls, color: COLORS[2] },
    { name: "WhatsApp", value: stats.totalWhatsapp, color: COLORS[4] },
  ], [stats]);

  const topVehicles = useMemo(() => vehicleStats.slice(0, 5).map(v => ({
    title: v.name,
    views: v.views,
    engagement: v.views > 0 ? Math.round((v.enquiries / v.views) * 100) : 0,
    trend: v.enquiries > 0 ? "up" as const : v.views > 5 ? "stable" as const : "down" as const,
  })), [vehicleStats]);

  const insights = useMemo(() => {
    const list: string[] = [];
    
    if (stats.totalViews > 0) {
      list.push(`📊 Your marketplace listings received ${stats.totalViews} views in the last ${period === "7d" ? "7 days" : period === "30d" ? "30 days" : "90 days"}.`);
    }
    
    if (stats.conversionRate > 5) {
      list.push(`🎯 Great conversion rate of ${stats.conversionRate.toFixed(1)}% - your listings are compelling!`);
    } else if (stats.totalViews > 20 && stats.conversionRate < 2) {
      list.push(`⚠️ Low conversion rate (${stats.conversionRate.toFixed(1)}%) - consider improving photos or pricing.`);
    }

    if (stats.totalWhatsapp > stats.totalCalls) {
      list.push(`💬 Customers prefer WhatsApp (${stats.totalWhatsapp}) over calls (${stats.totalCalls}) - ensure quick WhatsApp responses.`);
    }

    const peakHour = hourStats.reduce((a, b) => b.count > a.count ? b : a, { hour: 0, count: 0 });
    if (peakHour.count > 0) {
      list.push(`⏰ Peak activity at ${peakHour.hour}:00 - best time to update listings or respond to enquiries.`);
    }

    if (topVehicles.length > 0 && topVehicles[0].views > 10) {
      list.push(`🏆 "${topVehicles[0].title}" is your top performer with ${topVehicles[0].views} views.`);
    }

    return list;
  }, [stats, hourStats, topVehicles, period]);

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Marketplace Analytics
          </h1>
          <p className="text-muted-foreground">Instagram-style insights for your marketplace presence</p>
        </div>
        <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
          {[
            { key: "7d", label: "7 Days" },
            { key: "30d", label: "30 Days" },
            { key: "90d", label: "90 Days" },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === p.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Total Reach"
          value={stats.totalViews}
          change={calculateChange(stats.totalViews, prevStats.totalViews)}
          icon={Eye}
          color="blue"
          subtitle="Unique impressions"
        />
        <MetricCard
          title="Enquiries"
          value={stats.totalEnquiries}
          change={calculateChange(stats.totalEnquiries, prevStats.totalEnquiries)}
          icon={MessageSquare}
          color="emerald"
          subtitle="Form submissions"
        />
        <MetricCard
          title="Phone Calls"
          value={stats.totalCalls}
          change={calculateChange(stats.totalCalls, prevStats.totalCalls)}
          icon={Phone}
          color="violet"
        />
        <MetricCard
          title="WhatsApp"
          value={stats.totalWhatsapp}
          change={calculateChange(stats.totalWhatsapp, prevStats.totalWhatsapp)}
          icon={MessageSquare}
          color="emerald"
        />
        <MetricCard
          title="Active Listings"
          value={stats.publicVehicles}
          change={0}
          icon={Car}
          color="amber"
        />
        <MetricCard
          title="Conversion"
          value={`${stats.conversionRate.toFixed(1)}%`}
          change={0}
          icon={TrendingUp}
          color="rose"
          subtitle="Lead rate"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReachGraph data={dailyData} />
        <EngagementRing 
          data={engagementData}
          centerLabel="Total Interactions"
          centerValue={(stats.totalViews + stats.totalEnquiries + stats.totalCalls + stats.totalWhatsapp).toString()}
        />
      </div>

      {/* Insights & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickInsights insights={insights} />
        <ActivityHeatmap data={hourStats} />
      </div>

      {/* Top Content */}
      {topVehicles.length > 0 && (
        <TopContent items={topVehicles} />
      )}
    </div>
  );
};

export default MarketplaceAnalytics;
