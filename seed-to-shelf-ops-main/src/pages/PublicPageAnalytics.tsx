import { useEffect, useState } from "react";
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
  TrendingDown,
  Phone,
  MessageCircle,
  ArrowRight,
  Clock,
  CarFront,
  MousePointerClick,
  Camera
} from "lucide-react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";

import YouTubeIcon from "@/assets/social/youtube.svg?react";
import WhatsAppIcon from "@/assets/social/whatsapp.svg?react";
import InstagramIcon from "@/assets/social/instagram.svg?react";
import FacebookIcon from "@/assets/social/facebook.svg?react";
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

const isHighViewNoLead = (v: VehicleStat) =>
  v.views >= 10 && v.enquiries === 0;

const clickHeat = (v: VehicleStat) => {
  if (v.clickRate >= 15) return "hot";
  if (v.clickRate >= 5) return "warm";
  return "cold";
};

const isTopPerformer = (v: VehicleStat) =>
  v.enquiries >= 3 || v.conversion >= 10;



/* ---------------- COMPONENT ---------------- */

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


  const init = async () => {
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
  };

  /* ---------------- BASIC KPIs ---------------- */

  const fetchStats = async (dealerId: string) => {
    const { data } = await supabase
      .from("public_page_events")
      .select("event_type, session_id")
      .eq("dealer_user_id", dealerId);

    if (!data) return;

    const visitors = new Set(data.map(d => d.session_id)).size;
    const pageViews = data.filter(
      d => d.event_type === "page_view" || d.event_type === "vehicle_view"
    ).length;
    const enquiries = data.filter(d => d.event_type === "enquiry_submit").length;
    const engaged = data.filter(d => d.event_type === "engaged_30s").length;
    const deepScroll = data.filter(d => d.event_type === "scroll_75").length;

    setStats({
      visitors,
      pageViews,
      enquiries,
      avgViewsPerVisitor: visitors ? +(pageViews / visitors).toFixed(2) : 0,
      conversion: pageViews ? +((enquiries / pageViews) * 100).toFixed(2) : 0,
      dropOff: pageViews ? +(100 - (enquiries / pageViews) * 100).toFixed(2) : 0,
      engagedUsers: engaged,
      deepScrollRate: visitors ? +((deepScroll / visitors) * 100).toFixed(1) : 0,
    });
  };

  /* ---------------- 7 DAY TREND ---------------- */

  const fetchTrend = async (dealerId: string) => {
    const from = new Date(
  Date.now() - rangeDays * 86400000
).toISOString();


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

  /* ---------------- VEHICLE ANALYTICS ---------------- */

  const fetchVehicleStats = async (dealerId: string) => {
  // 1️⃣ Fetch all vehicles
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, brand, model, status")
    .eq("user_id", dealerId);

  if (!vehicles) return;

  // 2️⃣ Fetch all analytics for dealer
  const { data: events } = await supabase
    .from("public_page_events")
    .select("event_type, vehicle_id, session_id")
    .eq("dealer_user_id", dealerId);

  const map: Record<string, VehicleStat> = {};

  // 3️⃣ Initialize vehicles (IMPORTANT)
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
      if (e.event_type === "cta_call" || e.event_type === "cta_whatsapp") {
        v.ctaClicks++;
      }

      // Unique visitors
      if (!visitorMap[e.vehicle_id]) {
        visitorMap[e.vehicle_id] = new Set();
      }
      visitorMap[e.vehicle_id].add(e.session_id);
    });

    // 4️⃣ Final calculations
    Object.values(map).forEach((v) => {
      v.uniqueVisitors = visitorMap[v.vehicle_id]?.size || 0;

      v.clickRate = v.views
        ? +((v.ctaClicks / v.views) * 100).toFixed(1)
        : 0;

      v.conversion = v.views
        ? +((v.enquiries / v.views) * 100).toFixed(1)
        : 0;
    });
  }

  // 5️⃣ Sort by status priority
  const statusOrder = {
    in_stock: 1,
    reserved: 2,
    sold: 3,
  };

  setVehicleStats(
    Object.values(map).sort(
      (a, b) => statusOrder[a.status] - statusOrder[b.status]
    )
  );
};


  /* ---------------- TIME HEATMAP ---------------- */

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

    setHourStats(Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: map[i] || 0,
    })));
  };

  /* ---------------- CTA ANALYTICS ---------------- */

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

  /* ---------------- COMPARISON ---------------- */

  const fetchComparison = async (dealerId: string) => {
    const now = Date.now();
    const currFrom = new Date(
  now - rangeDays * 86400000
).toISOString();

const prevFrom = new Date(
  now - rangeDays * 2 * 86400000
).toISOString();


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

    const metric = (type: string, arr: any[]) =>
      arr.filter(e => e.event_type === type).length;

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

  if (loading) return <CarLoader />;

  if (!publicEnabled) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <AlertTriangle className="mx-auto h-6 w-6 text-amber-600" />
            <CardTitle className="text-center">Analytics Unavailable</CardTitle>
            <CardDescription className="text-center">
              Public page is disabled
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => (window.location.href = "/settings")}>
              Enable in Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const publicPageUrl = publicPageId
  ? `${window.location.origin}/d/${publicPageId}`
  : "";


  const generateBusinessInsights = () => {
  if (!stats) return [];

  const insights: string[] = [];

  // Traffic & Visibility
  if (stats.visitors > 0) {
    insights.push(`👀 ${stats.visitors} people visited your public page in the last ${rangeDays} days.`);
  }

  if (stats.avgViewsPerVisitor > 1.5) {
    insights.push(
      `📄 Visitors are exploring multiple vehicles (avg ${stats.avgViewsPerVisitor} pages per visit).`
    );
  } else {
    insights.push(
      `⚠️ Most visitors are viewing only one page — consider improving vehicle images or pricing.`
    );
  }

  // Engagement
  if (stats.engagedUsers > 0) {
    insights.push(
      `🧠 ${stats.engagedUsers} visitors stayed on your page for more than 30 seconds — these are high-interest buyers.`
    );
  }

  if (stats.deepScrollRate > 40) {
    insights.push(
      `⬇️ ${stats.deepScrollRate}% of visitors scrolled deeply — your content is holding attention.`
    );
  } else {
    insights.push(
      `📉 Many users are not scrolling fully — important details may be missing or too low on the page.`
    );
  }

  // Conversion
  if (stats.enquiries > 0) {
    insights.push(
      `📩 You received ${stats.enquiries} enquiries — these leads are already interested buyers.`
    );
  } else {
    insights.push(
      `🚨 No enquiries received yet — your vehicles are getting views but not converting.`
    );
  }

  if (stats.conversion >= 5) {
    insights.push(
      `🔥 Your enquiry conversion rate is ${stats.conversion}%, which is strong for vehicle listings.`
    );
  } else {
    insights.push(
      `🧊 Conversion rate is low (${stats.conversion}%). Consider adjusting price, images, or EMI clarity.`
    );
  }

  // CTA behaviour
  if (ctaStats.whatsapp > ctaStats.call) {
    insights.push(
      `💬 Most customers prefer WhatsApp over calls — WhatsApp follow-up will close deals faster.`
    );
  } else if (ctaStats.call > 0) {
    insights.push(
      `📞 Phone calls are still important — quick response time matters here.`
    );
  }

  // Vehicle performance insights
  const hotVehicles = vehicleStats.filter(v => v.conversion >= 10);
  const coldVehicles = vehicleStats.filter(v => v.views >= 10 && v.enquiries === 0);

  if (hotVehicles.length > 0) {
    insights.push(
      `🏆 ${hotVehicles.length} vehicle(s) are top performers — push these first during customer calls.`
    );
  }

  if (coldVehicles.length > 0) {
    insights.push(
      `❄️ ${coldVehicles.length} vehicle(s) have high views but no enquiries — review pricing or photos.`
    );
  }

  // Time behaviour
  const peakHour =
  hourStats.length > 0
    ? hourStats.reduce((a, b) => (b.count > a.count ? b : a))
    : null;

  if (peakHour?.count > 0) {
    insights.push(
      `⏰ Most activity happens around ${peakHour.hour}:00 — posting or sharing links during this time can increase leads.`
    );
  }


  if (stats.dropOff > 80) {
  insights.push(
    `🚪 ${stats.dropOff}% of visitors are leaving without enquiry — page is getting attention but trust or clarity is missing.`
  );
}

if (stats.enquiries > 0 && stats.visitors > 0) {
  insights.push(
    `🎯 Roughly 1 enquiry for every ${Math.round(stats.visitors / stats.enquiries)} visitors — improving CTA placement can boost this.`
  );
}

const totalCTAs = ctaStats.whatsapp + ctaStats.call;

if (totalCTAs > 0) {
  const whatsappShare = Math.round((ctaStats.whatsapp / totalCTAs) * 100);
  insights.push(
    `📲 ${whatsappShare}% of interested users prefer WhatsApp — replying within 5 minutes increases closure chances.`
  );
}


const lowClickVehicles = vehicleStats.filter(
  v => v.views >= 10 && v.ctaClicks === 0
);

if (lowClickVehicles.length > 0) {
  insights.push(
    `🖼 ${lowClickVehicles.length} vehicle(s) are viewed but not clicked — first image or price may not be attractive.`
  );
}


const activeStock = vehicleStats.filter(v => v.status === "in_stock").length;

if (activeStock > 0) {
  insights.push(
    `🚗 You currently have ${activeStock} active vehicles — sharing your public page link daily improves visibility.`
  );
}


if (peakHour?.count > 0) {
  insights.push(
    `⏱ Highest buyer activity is around ${peakHour.hour}:00 — follow-ups during this time convert better.`
  );
}


if (stats.visitors >= 20 && stats.enquiries === 0) {
  insights.push(
    `🚨 You are getting traffic but ZERO leads — this usually means pricing, trust signals, or contact visibility needs fixing.`
  );
}


if (stats.avgViewsPerVisitor >= 4) {
  insights.push(
    `🔁 Some visitors are checking multiple vehicles — these are comparison buyers and highly closable.`
  );
}


if (stats.pageViews > 0 && stats.enquiries / stats.pageViews < 0.03) {
  insights.push(
    `🕳 Your funnel has a leakage — many views but few enquiries. Try stronger CTA text like “Best Price – Enquire Now”.`
  );
}

const lowImageInterest = vehicleStats.filter(
  v => v.views >= 15 && v.clickRate < 3
);

if (lowImageInterest.length > 0) {
  insights.push(
    `📷 ${lowImageInterest.length} vehicle(s) may need better images — low click rate usually means photos are not convincing.`
  );
}


const slowMovingStock = vehicleStats.filter(
  v => v.views < 5 && v.status === "in_stock"
);

if (slowMovingStock.length > 0) {
  insights.push(
    `🐢 ${slowMovingStock.length} vehicle(s) have very low visibility — share these directly on WhatsApp or groups.`
  );
}

if (ctaStats.call > 0 && ctaStats.whatsapp === 0) {
  insights.push(
    `📞 Buyers are calling instead of messaging — missed calls may lead to lost deals if not answered quickly.`
  );
}

if (stats.enquiries > 0) {
  insights.push(
    `⚡ Responding to enquiries within 5 minutes increases closing chances by up to 4x.`
  );
}


if (peakHour && peakHour.hour >= 18) {
  insights.push(
    `🌙 Buyer activity peaks in the evening — evening follow-ups and ads work better for your page.`
  );
}


if (vehicleStats.length > 0 && stats.enquiries / vehicleStats.length < 0.5) {
  insights.push(
    `⚖ You may have more stock than demand — promote only top-performing vehicles to avoid buyer confusion.`
  );
}


if (stats.deepScrollRate < 30) {
  insights.push(
    `🛡 Low scroll depth suggests trust is missing — add dealer info, reviews, or warranty details higher on the page.`
  );
}

if (stats.enquiries > 0) {
  insights.push(
    `🚀 Your public page is already generating leads — sharing this link daily can replace manual follow-ups.`
  );
}


if (stats.conversion < 4) {
  insights.push(
    `🎁 Adding a hook like “Best Price Guaranteed” or “Easy EMI Available” can instantly improve enquiries.`
  );
}


  return insights.slice(0, 50);
};


  return (
    <div className="min-h-screen bg-background p-6 space-y-8 font-sans text-foreground">

      
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-3">
  <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
    <BarChart3 className="h-6 w-6 text-blue-600" />
    Performance Overview
  </h1>

  <p className="text-sm text-muted-foreground">
    Real-time insights into your inventory's public performance.
  </p>

  <div className="inline-flex items-center gap-1 bg-card p-1 rounded-lg border border-border shadow-sm">
    <button
      onClick={() => setViewMode("charts")}
      className={`px-3 py-1 text-xs rounded-md transition ${
        viewMode === "charts"
          ? "bg-blue-600 text-white"
          : "text-muted-foreground hover:bg-muted"

      }`}
    >
      📊 Performance
    </button>

    <button
      onClick={() => setViewMode("insights")}
      className={`px-3 py-1 text-xs rounded-md transition ${
        viewMode === "insights"
          ? "bg-emerald-600 text-white"
          : "text-muted-foreground hover:bg-muted"
      }`}
    >
      💡 Business Insights
    </button>

    {/* AI Badge – ONLY when Insights tab is active */}
    {viewMode === "insights" && (
      <span className="px-2 py-0.5 text-[10px] rounded-full bg-red-50 text-red-700 border border-emerald-200">
        🤖 AI-generated
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
      className={`px-2 py-0.5 text-xs rounded transition ${
        rangeDays === d
          ? "bg-blue-600 text-white"
          : "text-muted-foreground hover:bg-muted"
      }`}
    >
      {d} Days
    </button>
  ))}
</div>

      </div>

      {/* --- KPI GRID --- */}
      {/* --- KPI GRID (ONLY PERFORMANCE TAB) --- */}
{viewMode === "charts" && stats && (
  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">

    <StatCard 
      title="Total Visitors" 
      value={stats.visitors} 
      icon={Users} 
      color="blue" 
      trend={null}
    />
    <StatCard 
      title="Page Views" 
      value={stats.pageViews} 
      icon={Eye} 
      color="indigo" 
      trend={comparison.views}
    />
    <StatCard 
      title="Enquiries" 
      value={stats.enquiries} 
      icon={Send} 
      color="emerald" 
      trend={comparison.enquiries}
    />
    <StatCard 
      title="Engagement" 
      value={stats.avgViewsPerVisitor} 
      suffix="pgs/visit"
      icon={TrendingUp} 
      color="violet" 
    />
    <StatCard 
      title="Conversion" 
      value={stats.conversion} 
      suffix="%"
      icon={Percent} 
      color="amber" 
    />
    
    <StatCard
      title="Engaged Visitors"
      value={stats.engagedUsers}
      icon={MousePointerClick}
      color="indigo"
    />
    <StatCard
      title="Deep Scroll Rate"
      value={stats.deepScrollRate}
      suffix="%"
      icon={TrendingUp}
      color="emerald"
    />
  </div>
)}



      {viewMode === "insights" && (
  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

    {/* LEFT: AI INSIGHTS */}
    <div className="xl:col-span-2 space-y-4">
      <Card className="border border-border bg-card text-card-foreground shadow-sm">

        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            💡 Business Insights
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
              AI-generated
            </Badge>
          </CardTitle>
          <CardDescription>
            What your public page activity is telling you — in simple terms.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {generateBusinessInsights().map((line, i) => (
            <div
              key={i}
              className="p-4 rounded-lg border border-border bg-card hover:shadow-sm transition"
            >
              <p className="text-sm text-foreground leading-relaxed">
                {line}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>

    {/* RIGHT: ACTION PANEL */}
    <div className="space-y-4">
      <Card className="border-border shadow-sm sticky top-24">
        <CardHeader>
          <CardTitle className="text-base font-medium">
            ✅ Today’s Action Plan
          </CardTitle>
          <CardDescription>
            Do these to increase enquiries
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 text-sm text-foreground">
          <div className="flex gap-2">
            <MessageCircle className="h-4 w-4 text-green-600 mt-0.5" />
            <span>Reply to WhatsApp enquiries within <b>5 minutes</b></span>
          </div>

          <div className="flex gap-2">
            <Camera className="h-4 w-4 text-blue-600 mt-0.5" />
            <span>Improve first vehicle image (low trust signal)</span>
          </div>

          <div className="flex gap-2">
            <Percent className="h-4 w-4 text-amber-600 mt-0.5" />
            <span>Show EMI / best price clearly above the fold</span>
          </div>

          <div className="flex gap-2">
            <Clock className="h-4 w-4 text-violet-600 mt-0.5" />
            <span>Share public page around <b>4:00 PM</b></span>
          </div>

          <Button className="w-full mt-3" onClick={() => setShowShareModal(true)}>
  Share Public Page
</Button>

        </CardContent>
      </Card>
    </div>

  </div>
)}


{viewMode === "charts" && (
  <>

      {/* --- MAIN CHART SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Trend Line Chart */}
        <Card className="lg:col-span-2 shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-base font-medium text-foreground">Traffic & Lead Volume</CardTitle>
            <CardDescription>Daily breakdown of views vs enquiries over the last week.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] w-full pt-4">
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
                    tick={{fontSize: 12, fill: "hsl(var(--muted-foreground))"}} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, {weekday: 'short'})} 
                    dy={10}
                />
                <YAxis 
                    tick={{fontSize: 12, fill: "hsl(var(--muted-foreground))"}} 
                    tickLine={false} 
                    axisLine={false} 
                />
                <Tooltip
  contentStyle={{
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--foreground))",
  }}
/>

                <Area 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorViews)" 
                    name="Views"
                />
                <Area 
                    type="monotone" 
                    dataKey="enquiries" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorEnq)" 
                    name="Enquiries"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Right: CTA Breakdown & Heatmap */}
        <div className="space-y-6">
            
            {/* CTA Cards */}
            <Card className="shadow-sm border-border">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium text-foreground">Conversion Sources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg border
  bg-emerald-500/10 border-emerald-500/20">
  <div className="flex items-center gap-3">
    <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600">
      <MessageCircle className="h-4 w-4" />
    </div>
    <span className="text-sm font-medium text-foreground">WhatsApp</span>
  </div>
  <span className="text-lg font-bold text-foreground">{ctaStats.whatsapp}</span>
</div>

                    <div className="flex items-center justify-between p-3 rounded-lg border
  bg-blue-500/10 border-blue-500/20">
  <div className="flex items-center gap-3">
    <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-600">
      <Phone className="h-4 w-4" />
    </div>
    <span className="text-sm font-medium text-foreground">Phone Calls</span>
  </div>
  <span className="text-lg font-bold text-foreground">{ctaStats.call}</span>
</div>

                </CardContent>
            </Card>

            {/* Heatmap Mini */}
            <Card className="shadow-sm border-border flex-1">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium text-foreground">Peak Activity Hours</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-6 gap-1.5">
                    {hourStats.map((h) => {
                        const intensity = h.count > 0 ? Math.min(Math.max(h.count / 5, 0.2), 1) : 0.05;
                        return (
                            <div
                                key={h.hour}
                                className="h-8 rounded-sm flex items-center justify-center text-[10px] text-muted-foreground transition-all hover:scale-110 cursor-default relative group"
                                style={{ 
                                    backgroundColor: `rgba(59, 130, 246, ${intensity})`,
                                    color: intensity > 0.5 ? 'white' : ''
                                }}
                            >
                                {h.hour}
                                {/* Simple Tooltip on Hover */}
                                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-popover text-popover-foreground border border-border text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                                    {h.hour}:00 - {h.count} events
                                </div>
                            </div>
                        )
                    })}
                    </div>
                    <div className="flex justify-between items-center mt-3 text-[10px] text-muted-foreground">
                        <span>00:00</span>
                        <span>12:00</span>
                        <span>23:00</span>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      {/* --- DETAILED TABLE SECTION --- */}
      <Card className="shadow-sm border-border overflow-hidden">
        <CardHeader className="bg-muted/50 border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
                <CarFront className="h-4 w-4 text-muted-foreground" />
                Vehicle Performance Matrix
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                View Inventory <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium">
  <tr>
    <th className="px-6 py-3">Vehicle</th>
    <th className="px-6 py-3 text-right">Status</th>
    <th className="px-6 py-3 text-right">Views</th>
    <th className="px-6 py-3 text-right">Visitors</th>
    <th className="px-6 py-3 text-right">CTA Clicks</th>
    <th className="px-6 py-3 text-right">Heat</th>
    <th className="px-6 py-3 text-right">Enquiries</th>
    <th className="px-6 py-3">Funnel</th>
    <th className="px-6 py-3 text-right">Click Rate %</th>
<th className="px-6 py-3 text-right">Lead Conv %</th>

  </tr>
</thead>



                <tbody className="divide-y divide-border">
  {vehicleStats.map((v) => (
    <tr key={v.vehicle_id} className="hover:bg-muted/50">
      <td className="px-6 py-3 font-medium">
  <div className="flex items-center gap-2 flex-wrap">
    <span>{v.brand} {v.model}</span>

    {isHighViewNoLead(v) && (
      <Badge className="bg-rose-100 text-rose-700 border-rose-300">
        🚨 High views · No leads
      </Badge>
    )}

    {isTopPerformer(v) && (
  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
    🏆 Top Performer
  </Badge>
)}

  </div>
</td>


      <td className="px-6 py-3 text-right capitalize">
        <Badge
          variant="outline"
          className={
            v.status === "in_stock"
              ? "border-emerald-400 text-emerald-600"
              : v.status === "reserved"
              ? "border-amber-400 text-amber-600"
              : "border-border text-muted-foreground"

          }
        >
          {v.status}
        </Badge>
      </td>

      <td className="px-6 py-3 text-right">{v.views}</td>
      <td className="px-6 py-3 text-right">{v.uniqueVisitors}</td>
      <td className="px-6 py-3 text-right">{v.ctaClicks}</td>

      <td className="px-6 py-3 text-right">
  <Badge
    className={
      clickHeat(v) === "hot"
        ? "bg-red-100 text-red-700"
        : clickHeat(v) === "warm"
        ? "bg-amber-100 text-amber-700"
        : "bg-muted text-muted-foreground"
    }
  >
    {clickHeat(v) === "hot" ? "🔥 Hot" : clickHeat(v) === "warm" ? "Warm" : "Cold"}
  </Badge>
</td>



      <td className="px-6 py-3 text-right">{v.enquiries}</td>

      <td className="px-6 py-3 w-[180px]">
  <div className="flex h-2 w-full bg-muted rounded overflow-hidden">
    <div className="bg-blue-500" style={{ width: "100%" }} />
    <div
      className="bg-amber-500"
      style={{
        width: v.views ? `${(v.ctaClicks / v.views) * 100}%` : "0%",
      }}
    />
    <div
      className="bg-emerald-500"
      style={{
        width: v.views ? `${(v.enquiries / v.views) * 100}%` : "0%",
      }}
    />
  </div>

  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
    <span>{v.views}</span>
    <span>{v.ctaClicks}</span>
    <span>{v.enquiries}</span>
  </div>
</td>



      <td className="px-6 py-3 text-right">{v.clickRate}%</td>
      <td className="px-6 py-3 text-right">{v.conversion}%</td>
    </tr>
  ))}
</tbody>

            </table>
        </div>
      </Card>
      </>
)}

{/* SHARE PUBLIC PAGE MODAL */}
{showShareModal && publicPageId && (
  <div
    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center"
    onClick={() => setShowShareModal(false)}
  >

    <div
  className="bg-card rounded-xl w-full max-w-md mx-4 p-5 sm:p-6 relative shadow-xl"
  onClick={(e) => e.stopPropagation()}
>




      <button
        onClick={() => setShowShareModal(false)}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
      >
        ✕
      </button>

      <h2 className="text-lg font-semibold text-center mb-1">
        Share Your Public Page
      </h2>
      <p className="text-sm text-muted-foreground text-center mb-4">
        Share this link to get more enquiries
      </p>

      <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-muted">
        <input
          readOnly
          value={publicPageUrl}
          className="flex-1 bg-transparent text-sm outline-none"
        />
        <Button
          size="sm"
          onClick={() =>
            navigator.clipboard.writeText(publicPageUrl)
          }
        >
          Copy
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4 mt-6 text-center">

  {/* WhatsApp */}
  <a
    href={`https://wa.me/?text=${encodeURIComponent(publicPageUrl)}`}

    target="_blank"
    rel="noopener noreferrer"
    className="flex flex-col items-center gap-1 hover:scale-110 transition"
  >
    <WhatsAppIcon className="h-8 w-8 text-green-500" />
    <span className="text-[10px]">WhatsApp</span>
  </a>

  {/* Instagram */}
  <a
    href="https://www.instagram.com/"
    target="_blank"
    rel="noopener noreferrer"
    className="flex flex-col items-center gap-1 hover:scale-110 transition"
  >
    <InstagramIcon className="h-8 w-8 text-pink-500" />
    <span className="text-[10px]">Instagram</span>
  </a>

  {/* YouTube */}
  <a
    href="https://www.youtube.com/"
    target="_blank"
    rel="noopener noreferrer"
    className="flex flex-col items-center gap-1 hover:scale-110 transition"
  >
    <YouTubeIcon className="h-8 w-8 text-red-600" />
    <span className="text-[10px]">YouTube</span>
  </a>

  {/* Snapchat */}
  <a
    href="https://www.snapchat.com/"
    target="_blank"
    rel="noopener noreferrer"
    className="flex flex-col items-center gap-1 hover:scale-110 transition"
  >
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

/* ---------------- HELPER COMPONENTS ---------------- */

const StatCard = ({ title, value, suffix = "", icon: Icon, color, trend, inverseTrend }: any) => {
    // Color mapping specifically for the icon background
    const bgMap: any = {
      blue: "bg-blue-50 text-blue-600",
      indigo: "bg-indigo-50 text-indigo-600",
      violet: "bg-violet-50 text-violet-600",
      emerald: "bg-emerald-50 text-emerald-600",
      amber: "bg-amber-50 text-amber-600",
      rose: "bg-rose-50 text-rose-600",
    };

    return (
        <Card className="shadow-sm border-border hover:shadow-md transition-all duration-200">
            <CardContent className="p-5">
                <div className="flex justify-between items-start mb-2">
                    <div className={`p-2 rounded-lg ${bgMap[color] || 'bg-muted'}`}>
                        <Icon className="h-5 w-5" />
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
                    <h3 className="text-2xl font-bold text-foreground tracking-tight">
                        {value}<span className="text-lg text-muted-foreground font-normal ml-0.5">{suffix}</span>
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground mt-1">{title}</p>
                </div>
            </CardContent>
        </Card>
    );
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-3 border border-border shadow-lg rounded-lg text-xs">
          <p className="font-semibold text-foreground mb-2">{new Date(label).toDateString()}</p>
          {payload.map((p: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.stroke }} />
                <span className="text-muted-foreground capitalize">{p.name}:</span>
                <span className="font-bold text-foreground">{p.value}</span>
            </div>
          ))}

          
        </div>
      );
    }
    return null;
  };

export default PublicPageAnalytics;