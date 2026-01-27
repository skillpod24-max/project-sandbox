import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CarLoader from "@/components/CarLoader";
import { Badge } from "@/components/ui/badge";

import {
  Eye,
  Users,
  Send,
  Percent,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  Phone,
  MessageCircle,
  ArrowRight,
  Clock,
  CarFront,
  MousePointerClick,
  Camera,
  FormInput,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import YouTubeIcon from "@/assets/social/youtube.svg?react";
import WhatsAppIcon from "@/assets/social/whatsapp.svg?react";
import InstagramIcon from "@/assets/social/instagram.svg?react";
import SnapchatIcon from "@/assets/social/snapchat.svg?react";

/* ---------------- TYPES ---------------- */

interface InsightStats {
  visitors: number;
  pageViews: number;
  enquiries: number;
  avgViewsPerVisitor: number;
  conversion: number;
  dropOff: number;
  engagedUsers: number;
  deepScrollRate: number;
  formOpened: number;
  formAbandoned: number;
  formSubmitted: number;
  formConversion: number;
}

interface TrendRow {
  date: string;
  views: number;
  enquiries: number;
}

interface VehicleStat {
  vehicle_id: string;
  brand: string;
  model: string;
  status: "in_stock" | "reserved" | "sold";
  views: number;
  uniqueVisitors: number;
  enquiries: number;
  ctaClicks: number;
  clickRate: number;
  conversion: number;
}

interface HourStat {
  hour: number;
  count: number;
}

interface CTAStats {
  whatsapp: number;
  call: number;
}

interface Comparison {
  current: number;
  previous: number;
  change: number;
}

const isHighViewNoLead = (v: VehicleStat) => v.views >= 10 && v.enquiries === 0;
const clickHeat = (v: VehicleStat) => {
  if (v.clickRate >= 15) return "hot";
  if (v.clickRate >= 5) return "warm";
  return "cold";
};
const isTopPerformer = (v: VehicleStat) => v.enquiries >= 3 || v.conversion >= 10;

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

/* ---------------- MEMOIZED COMPONENTS ---------------- */

const StatCard = memo(({ title, value, suffix = "", icon: Icon, color, trend, inverseTrend }: any) => {
  const bgMap: any = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <Card className="shadow-sm border-border hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 sm:p-5">
        <div className="flex justify-between items-start mb-2">
          <div className={`p-2 rounded-lg ${bgMap[color] || 'bg-muted'}`}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          {trend && (
            <div className={`flex items-center text-xs font-medium px-1.5 py-0.5 rounded ${
              (trend.change >= 0 && !inverseTrend) || (trend.change < 0 && inverseTrend)
                ? "text-emerald-700 bg-emerald-50" 
                : "text-rose-700 bg-rose-50"
            }`}>
              {trend.change > 0 ? "+" : ""}{trend.change}%
            </div>
          )}
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            {value}<span className="text-sm sm:text-lg text-muted-foreground font-normal ml-0.5">{suffix}</span>
          </h3>
          <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-1 truncate">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
});

StatCard.displayName = "StatCard";

/* ---------------- MAIN COMPONENT ---------------- */

const PublicPageAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [publicEnabled, setPublicEnabled] = useState(false);
  const [dealerUserId, setDealerUserId] = useState<string | null>(null);
  const [publicPageId, setPublicPageId] = useState<string | null>(null);

  const [stats, setStats] = useState<InsightStats | null>(null);
  const [trend, setTrend] = useState<TrendRow[]>([]);
  const [vehicleStats, setVehicleStats] = useState<VehicleStat[]>([]);
  const [hourStats, setHourStats] = useState<HourStat[]>([]);
  const [ctaStats, setCtaStats] = useState<CTAStats>({ whatsapp: 0, call: 0 });
  const [comparison, setComparison] = useState<Record<string, Comparison>>({});
  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(7);
  const [viewMode, setViewMode] = useState<"charts" | "insights">("charts");
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    init();
  }, [rangeDays]);

  const init = useCallback(async () => {
    setLoading(true);

    const { data: settings } = await supabase
      .from("settings")
      .select("public_page_enabled, user_id, public_page_id")
      .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
      .maybeSingle();

    if (!settings?.public_page_enabled) {
      setPublicEnabled(false);
      setLoading(false);
      return;
    }

    setPublicEnabled(true);
    setDealerUserId(settings.user_id);
    setPublicPageId(settings.public_page_id);

    await Promise.all([
      fetchStats(settings.user_id),
      fetchTrend(settings.user_id),
      fetchVehicleStats(settings.user_id),
      fetchHourStats(settings.user_id),
      fetchCTAStats(settings.user_id),
      fetchComparison(settings.user_id),
    ]);

    setLoading(false);
  }, [rangeDays]);

  const fetchStats = async (dealerId: string) => {
    const { data } = await supabase
      .from("public_page_events")
      .select("event_type, session_id")
      .eq("dealer_user_id", dealerId);

    if (!data) return;

    const visitors = new Set(data.map(d => d.session_id)).size;
    const pageViews = data.filter(d => d.event_type === "page_view" || d.event_type === "vehicle_view").length;
    const enquiries = data.filter(d => d.event_type === "enquiry_submit").length;
    const engaged = data.filter(d => d.event_type === "engaged_30s").length;
    const deepScroll = data.filter(d => d.event_type === "scroll_75").length;
    
    // Form analytics
    const formOpened = data.filter(d => d.event_type === "form_opened").length;
    const formAbandoned = data.filter(d => d.event_type === "form_abandoned").length;
    const formSubmitted = enquiries;
    const formConversion = formOpened > 0 ? +((formSubmitted / formOpened) * 100).toFixed(1) : 0;

    setStats({
      visitors,
      pageViews,
      enquiries,
      avgViewsPerVisitor: visitors ? +(pageViews / visitors).toFixed(2) : 0,
      conversion: pageViews ? +((enquiries / pageViews) * 100).toFixed(2) : 0,
      dropOff: pageViews ? +(100 - (enquiries / pageViews) * 100).toFixed(2) : 0,
      engagedUsers: engaged,
      deepScrollRate: visitors ? +((deepScroll / visitors) * 100).toFixed(1) : 0,
      formOpened,
      formAbandoned,
      formSubmitted,
      formConversion,
    });
  };

  const fetchTrend = async (dealerId: string) => {
    const from = new Date(Date.now() - rangeDays * 86400000).toISOString();

    const { data } = await supabase
      .from("public_page_events")
      .select("event_type, created_at")
      .eq("dealer_user_id", dealerId)
      .gte("created_at", from);

    if (!data) return;

    const map: Record<string, TrendRow> = {};
    data.forEach(e => {
      const date = e.created_at.slice(0, 10);
      if (!map[date]) map[date] = { date, views: 0, enquiries: 0 };
      if (e.event_type === "page_view") map[date].views++;
      if (e.event_type === "enquiry_submit") map[date].enquiries++;
    });

    setTrend(Object.values(map).sort((a, b) => a.date.localeCompare(b.date)));
  };

  const fetchVehicleStats = async (dealerId: string) => {
    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("id, brand, model, status")
      .eq("user_id", dealerId);

    if (!vehicles) return;

    const { data: events } = await supabase
      .from("public_page_events")
      .select("event_type, vehicle_id, session_id")
      .eq("dealer_user_id", dealerId);

    const map: Record<string, VehicleStat> = {};

    vehicles.forEach((v) => {
      map[v.id] = {
        vehicle_id: v.id,
        brand: v.brand,
        model: v.model,
        status: v.status,
        views: 0,
        uniqueVisitors: 0,
        enquiries: 0,
        ctaClicks: 0,
        clickRate: 0,
        conversion: 0,
      };
    });

    if (events) {
      const visitorMap: Record<string, Set<string>> = {};

      events.forEach((e) => {
        if (!e.vehicle_id || !map[e.vehicle_id]) return;

        const v = map[e.vehicle_id];
        if (e.event_type === "vehicle_view") v.views++;
        if (e.event_type === "enquiry_submit") v.enquiries++;
        if (e.event_type === "cta_call" || e.event_type === "cta_whatsapp") v.ctaClicks++;

        if (!visitorMap[e.vehicle_id]) visitorMap[e.vehicle_id] = new Set();
        visitorMap[e.vehicle_id].add(e.session_id);
      });

      Object.values(map).forEach((v) => {
        v.uniqueVisitors = visitorMap[v.vehicle_id]?.size || 0;
        v.clickRate = v.views ? +((v.ctaClicks / v.views) * 100).toFixed(1) : 0;
        v.conversion = v.views ? +((v.enquiries / v.views) * 100).toFixed(1) : 0;
      });
    }

    const statusOrder = { in_stock: 1, reserved: 2, sold: 3 };
    setVehicleStats(Object.values(map).sort((a, b) => statusOrder[a.status] - statusOrder[b.status]));
  };

  const fetchHourStats = async (dealerId: string) => {
    const { data } = await supabase
      .from("public_page_events")
      .select("created_at")
      .eq("dealer_user_id", dealerId);

    if (!data) return;

    const map: Record<number, number> = {};
    data.forEach(e => {
      const hour = new Date(e.created_at).getHours();
      map[hour] = (map[hour] || 0) + 1;
    });

    setHourStats(Array.from({ length: 24 }, (_, i) => ({ hour: i, count: map[i] || 0 })));
  };

  const fetchCTAStats = async (dealerId: string) => {
    const { data } = await supabase
      .from("public_page_events")
      .select("event_type")
      .eq("dealer_user_id", dealerId);

    if (!data) return;

    setCtaStats({
      whatsapp: data.filter(d => d.event_type === "cta_whatsapp").length,
      call: data.filter(d => d.event_type === "cta_call").length,
    });
  };

  const fetchComparison = async (dealerId: string) => {
    const now = Date.now();
    const currFrom = new Date(now - rangeDays * 86400000).toISOString();
    const prevFrom = new Date(now - rangeDays * 2 * 86400000).toISOString();

    const { data: curr } = await supabase
      .from("public_page_events")
      .select("event_type")
      .eq("dealer_user_id", dealerId)
      .gte("created_at", currFrom);

    const { data: prev } = await supabase
      .from("public_page_events")
      .select("event_type")
      .eq("dealer_user_id", dealerId)
      .gte("created_at", prevFrom)
      .lt("created_at", currFrom);

    if (!curr || !prev) return;

    const metric = (type: string, arr: any[]) => arr.filter(e => e.event_type === type).length;
    const make = (c: number, p: number): Comparison => ({
      current: c,
      previous: p,
      change: p ? +(((c - p) / p) * 100).toFixed(1) : 100,
    });

    setComparison({
      views: make(metric("page_view", curr), metric("page_view", prev)),
      enquiries: make(metric("enquiry_submit", curr), metric("enquiry_submit", prev)),
    });
  };

  const businessInsights = useMemo(() => {
    if (!stats) return [];
    const insights: string[] = [];

    if (stats.visitors > 0) {
      insights.push(`👀 ${stats.visitors} people visited your public page in the last ${rangeDays} days.`);
    }
    if (stats.avgViewsPerVisitor > 1.5) {
      insights.push(`📄 Visitors are exploring multiple vehicles (avg ${stats.avgViewsPerVisitor} pages per visit).`);
    } else {
      insights.push(`⚠️ Most visitors are viewing only one page — consider improving vehicle images or pricing.`);
    }
    if (stats.engagedUsers > 0) {
      insights.push(`🧠 ${stats.engagedUsers} visitors stayed on your page for more than 30 seconds — these are high-interest buyers.`);
    }
    if (stats.deepScrollRate > 40) {
      insights.push(`⬇️ ${stats.deepScrollRate}% of visitors scrolled deeply — your content is holding attention.`);
    }
    if (stats.enquiries > 0) {
      insights.push(`📩 You received ${stats.enquiries} enquiries — these leads are already interested buyers.`);
    } else {
      insights.push(`🚨 No enquiries received yet — your vehicles are getting views but not converting.`);
    }
    if (stats.formOpened > 0 && stats.formAbandoned > 0) {
      const abandonRate = ((stats.formAbandoned / stats.formOpened) * 100).toFixed(0);
      insights.push(`📝 ${abandonRate}% of users who opened the form left without submitting — simplify your form or add trust signals.`);
    }
    if (stats.formConversion > 0) {
      insights.push(`✅ Your form conversion rate is ${stats.formConversion}% — ${stats.formConversion > 30 ? 'great job!' : 'there is room for improvement.'}`);
    }
    if (ctaStats.whatsapp > ctaStats.call) {
      insights.push(`💬 Most customers prefer WhatsApp over calls — WhatsApp follow-up will close deals faster.`);
    }

    const hotVehicles = vehicleStats.filter(v => v.conversion >= 10);
    const coldVehicles = vehicleStats.filter(v => v.views >= 10 && v.enquiries === 0);

    if (hotVehicles.length > 0) {
      insights.push(`🏆 ${hotVehicles.length} vehicle(s) are top performers — push these first during customer calls.`);
    }
    if (coldVehicles.length > 0) {
      insights.push(`❄️ ${coldVehicles.length} vehicle(s) have high views but no enquiries — review pricing or photos.`);
    }

    const peakHour = hourStats.length > 0 ? hourStats.reduce((a, b) => (b.count > a.count ? b : a)) : null;
    if (peakHour?.count > 0) {
      insights.push(`⏰ Most activity happens around ${peakHour.hour}:00 — posting or sharing links during this time can increase leads.`);
    }

    return insights.slice(0, 20);
  }, [stats, ctaStats, vehicleStats, hourStats, rangeDays]);

  const formFunnelData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Opened", value: stats.formOpened, color: COLORS[0] },
      { name: "Submitted", value: stats.formSubmitted, color: COLORS[1] },
      { name: "Abandoned", value: stats.formAbandoned, color: COLORS[3] },
    ].filter(d => d.value > 0);
  }, [stats]);

  const publicPageUrl = publicPageId ? `${window.location.origin}/d/${publicPageId}` : "";

  if (loading) return <CarLoader />;

  if (!publicEnabled) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <AlertTriangle className="mx-auto h-6 w-6 text-amber-600" />
            <CardTitle className="text-center">Analytics Unavailable</CardTitle>
            <CardDescription className="text-center">Public page is disabled</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => (window.location.href = "/settings")}>Enable in Settings</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 space-y-6 font-sans text-foreground">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-3">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            Performance Overview
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Real-time insights into your inventory's public performance.
          </p>

          <div className="inline-flex items-center gap-1 bg-card p-1 rounded-lg border border-border shadow-sm">
            <button
              onClick={() => setViewMode("charts")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                viewMode === "charts" ? "bg-blue-600 text-white" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              📊 Performance
            </button>
            <button
              onClick={() => setViewMode("insights")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                viewMode === "insights" ? "bg-emerald-600 text-white" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              💡 Insights
            </button>
            {viewMode === "insights" && (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-red-50 text-red-700 border border-emerald-200">
                🤖 AI
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 bg-card px-2 py-1.5 rounded-md border border-border shadow-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setRangeDays(d as 7 | 14 | 30)}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                rangeDays === d ? "bg-blue-600 text-white" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {d}D
            </button>
          ))}
        </div>
      </div>

      {/* KPI Grid - Performance View */}
      {viewMode === "charts" && stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
            <StatCard title="Visitors" value={stats.visitors} icon={Users} color="blue" />
            <StatCard title="Page Views" value={stats.pageViews} icon={Eye} color="indigo" trend={comparison.views} />
            <StatCard title="Enquiries" value={stats.enquiries} icon={Send} color="emerald" trend={comparison.enquiries} />
            <StatCard title="Engagement" value={stats.avgViewsPerVisitor} suffix="pgs" icon={TrendingUp} color="violet" />
            <StatCard title="Conversion" value={stats.conversion} suffix="%" icon={Percent} color="amber" />
            <StatCard title="Engaged 30s+" value={stats.engagedUsers} icon={MousePointerClick} color="indigo" />
            <StatCard title="Deep Scroll" value={stats.deepScrollRate} suffix="%" icon={TrendingUp} color="emerald" />
          </div>

          {/* Form Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card className="shadow-sm border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <FormInput className="h-4 w-4 text-blue-600" />
                  Form Analytics
                </CardTitle>
                <CardDescription>Enquiry form performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-blue-50/50 border-blue-200">
                  <div className="flex items-center gap-2">
                    <FormInput className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Forms Opened</span>
                  </div>
                  <span className="font-bold">{stats.formOpened}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-emerald-50/50 border-emerald-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm">Submitted</span>
                  </div>
                  <span className="font-bold text-emerald-700">{stats.formSubmitted}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-red-50/50 border-red-200">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Abandoned</span>
                  </div>
                  <span className="font-bold text-red-700">{stats.formAbandoned}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Form Conversion</span>
                    <span className="font-bold">{stats.formConversion}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Funnel Pie */}
            {formFunnelData.length > 0 && (
              <Card className="shadow-sm border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Form Funnel</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={formFunnelData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {formFunnelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* CTA Breakdown */}
            <Card className="shadow-sm border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">CTA Sources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-emerald-500/10 border-emerald-500/20">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <MessageCircle className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-sm font-medium">WhatsApp</span>
                  </div>
                  <span className="text-lg font-bold">{ctaStats.whatsapp}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-blue-500/10 border-blue-500/20">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium">Phone Calls</span>
                  </div>
                  <span className="text-lg font-bold">{ctaStats.call}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trend Chart */}
          <Card className="shadow-sm border-border">
            <CardHeader>
              <CardTitle className="text-base font-medium">Traffic & Lead Volume</CardTitle>
              <CardDescription>Daily breakdown over the selected period</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] sm:h-[350px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEnq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tick={{fontSize: 11}} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, {weekday: 'short'})} 
                  />
                  <YAxis tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" name="Views" />
                  <Area type="monotone" dataKey="enquiries" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorEnq)" name="Enquiries" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Peak Hours Heatmap */}
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Peak Activity Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-8 sm:grid-cols-12 gap-1.5">
                {hourStats.map((h) => {
                  const intensity = h.count > 0 ? Math.min(Math.max(h.count / 5, 0.2), 1) : 0.05;
                  return (
                    <div
                      key={h.hour}
                      className="h-8 rounded-sm flex items-center justify-center text-[10px] text-muted-foreground cursor-default relative group"
                      style={{ backgroundColor: `rgba(59, 130, 246, ${intensity})`, color: intensity > 0.5 ? 'white' : '' }}
                    >
                      {h.hour}
                      <div className="absolute bottom-full mb-1 hidden group-hover:block bg-popover text-popover-foreground border border-border text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                        {h.hour}:00 - {h.count} events
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between items-center mt-3 text-[10px] text-muted-foreground">
                <span>00:00</span>
                <span>12:00</span>
                <span>23:00</span>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Performance Table */}
          <Card className="shadow-sm border-border overflow-hidden">
            <CardHeader className="bg-muted/50 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <CarFront className="h-4 w-4 text-muted-foreground" />
                  Vehicle Performance Matrix
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700">
                  View Inventory <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium">
                  <tr>
                    <th className="px-4 py-3">Vehicle</th>
                    <th className="px-4 py-3 text-right">Status</th>
                    <th className="px-4 py-3 text-right">Views</th>
                    <th className="px-4 py-3 text-right">Visitors</th>
                    <th className="px-4 py-3 text-right">CTAs</th>
                    <th className="px-4 py-3 text-right">Heat</th>
                    <th className="px-4 py-3 text-right">Leads</th>
                    <th className="px-4 py-3 text-right">Conv%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {vehicleStats.map((v) => (
                    <tr key={v.vehicle_id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="truncate max-w-[120px] sm:max-w-none">{v.brand} {v.model}</span>
                          {isHighViewNoLead(v) && (
                            <Badge className="bg-rose-100 text-rose-700 border-rose-300 text-[10px]">No leads</Badge>
                          )}
                          {isTopPerformer(v) && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-[10px]">🏆 Top</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right capitalize">
                        <Badge variant="outline" className={
                          v.status === "in_stock" ? "border-emerald-400 text-emerald-600" :
                          v.status === "reserved" ? "border-amber-400 text-amber-600" : "border-border text-muted-foreground"
                        }>
                          {v.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">{v.views}</td>
                      <td className="px-4 py-3 text-right">{v.uniqueVisitors}</td>
                      <td className="px-4 py-3 text-right">{v.ctaClicks}</td>
                      <td className="px-4 py-3 text-right">
                        <Badge className={
                          clickHeat(v) === "hot" ? "bg-red-100 text-red-700" :
                          clickHeat(v) === "warm" ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"
                        }>
                          {clickHeat(v) === "hot" ? "🔥" : clickHeat(v) === "warm" ? "🌡" : "❄️"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">{v.enquiries}</td>
                      <td className="px-4 py-3 text-right">{v.conversion}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Insights View */}
      {viewMode === "insights" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-4">
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  💡 Business Insights
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">AI</Badge>
                </CardTitle>
                <CardDescription>What your public page activity is telling you</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {businessInsights.map((line, i) => (
                  <div key={i} className="p-4 rounded-lg border border-border bg-card hover:shadow-sm transition-shadow">
                    <p className="text-sm text-foreground leading-relaxed">{line}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-border shadow-sm sticky top-24">
              <CardHeader>
                <CardTitle className="text-base font-medium">✅ Today's Action Plan</CardTitle>
                <CardDescription>Do these to increase enquiries</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex gap-2"><MessageCircle className="h-4 w-4 text-green-600 mt-0.5" /><span>Reply to WhatsApp within <b>5 minutes</b></span></div>
                <div className="flex gap-2"><Camera className="h-4 w-4 text-blue-600 mt-0.5" /><span>Improve first vehicle image</span></div>
                <div className="flex gap-2"><Percent className="h-4 w-4 text-amber-600 mt-0.5" /><span>Show EMI clearly above the fold</span></div>
                <div className="flex gap-2"><Clock className="h-4 w-4 text-violet-600 mt-0.5" /><span>Share page around peak hours</span></div>
                <Button className="w-full mt-3" onClick={() => setShowShareModal(true)}>Share Public Page</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && publicPageId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-card rounded-xl w-full max-w-md p-5 relative shadow-xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowShareModal(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">✕</button>
            <h2 className="text-lg font-semibold text-center mb-1">Share Your Public Page</h2>
            <p className="text-sm text-muted-foreground text-center mb-4">Share this link to get more enquiries</p>
            <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-muted">
              <input readOnly value={publicPageUrl} className="flex-1 bg-transparent text-sm outline-none" />
              <Button size="sm" onClick={() => navigator.clipboard.writeText(publicPageUrl)}>Copy</Button>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-6 text-center">
              <a href={`https://wa.me/?text=${encodeURIComponent(publicPageUrl)}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 hover:scale-110 transition-transform">
                <WhatsAppIcon className="h-8 w-8 text-green-500" />
                <span className="text-[10px]">WhatsApp</span>
              </a>
              <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 hover:scale-110 transition-transform">
                <InstagramIcon className="h-8 w-8 text-pink-500" />
                <span className="text-[10px]">Instagram</span>
              </a>
              <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 hover:scale-110 transition-transform">
                <YouTubeIcon className="h-8 w-8 text-red-600" />
                <span className="text-[10px]">YouTube</span>
              </a>
              <a href="https://www.snapchat.com/" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 hover:scale-110 transition-transform">
                <SnapchatIcon className="h-8 w-8 text-yellow-400" />
                <span className="text-[10px]">Snapchat</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicPageAnalytics;
