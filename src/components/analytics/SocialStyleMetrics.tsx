import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, TrendingDown, Users, Eye, Heart, MessageCircle,
  Share2, Bookmark, UserPlus, BarChart3, Activity, Zap
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, RadialBarChart, RadialBar
} from "recharts";

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: any;
  subtitle?: string;
  color?: string;
}

export const MetricCard = memo(({ title, value, change, icon: Icon, subtitle, color = "blue" }: MetricCardProps) => {
  const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
    blue: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-600", ring: "ring-blue-500/20" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600", ring: "ring-emerald-500/20" },
    violet: { bg: "bg-violet-50 dark:bg-violet-950/30", text: "text-violet-600", ring: "ring-violet-500/20" },
    amber: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-600", ring: "ring-amber-500/20" },
    rose: { bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-600", ring: "ring-rose-500/20" },
  };
  const colors = colorMap[color] || colorMap.blue;

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200 ring-1 ring-border/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${colors.bg} ring-2 ${colors.ring}`}>
            <Icon className={`h-5 w-5 ${colors.text}`} />
          </div>
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            change >= 0 
              ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400" 
              : "text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400"
          }`}>
            {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {change > 0 ? "+" : ""}{change}%
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-2xl font-bold text-foreground tracking-tight">{value}</h3>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground/70">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
});

MetricCard.displayName = "MetricCard";

interface EngagementRingProps {
  data: Array<{ name: string; value: number; color: string }>;
  centerLabel: string;
  centerValue: string;
}

export const EngagementRing = memo(({ data, centerLabel, centerValue }: EngagementRingProps) => (
  <Card className="border-0 shadow-sm">
    <CardHeader className="pb-2">
      <CardTitle className="text-base font-semibold flex items-center gap-2">
        <Activity className="h-4 w-4 text-violet-500" />
        Engagement Breakdown
      </CardTitle>
      <CardDescription>How visitors interact with your content</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="h-52 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [value, 'Count']}
              contentStyle={{ 
                borderRadius: '8px', 
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--card))'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-foreground">{centerValue}</span>
          <span className="text-xs text-muted-foreground">{centerLabel}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-muted-foreground truncate">{item.name}</span>
            <span className="ml-auto font-medium text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
));

EngagementRing.displayName = "EngagementRing";

interface ReachGraphProps {
  data: Array<{ date: string; reach: number; impressions: number }>;
}

export const ReachGraph = memo(({ data }: ReachGraphProps) => (
  <Card className="border-0 shadow-sm">
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Eye className="h-4 w-4 text-blue-500" />
            Reach & Impressions
          </CardTitle>
          <CardDescription>Audience exposure over time</CardDescription>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            Reach
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-violet-500" />
            Impressions
          </span>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="reachGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="impressionsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              fontSize={11} 
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              fontSize={11} 
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '8px', 
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--card))',
                fontSize: '12px'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="reach" 
              stroke="#3b82f6" 
              strokeWidth={2}
              fill="url(#reachGradient)" 
            />
            <Area 
              type="monotone" 
              dataKey="impressions" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              fill="url(#impressionsGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
));

ReachGraph.displayName = "ReachGraph";

interface AudienceInsightProps {
  title: string;
  data: Array<{ label: string; value: number; percentage: number }>;
  icon: any;
}

export const AudienceInsight = memo(({ title, data, icon: Icon }: AudienceInsightProps) => (
  <Card className="border-0 shadow-sm">
    <CardHeader className="pb-3">
      <CardTitle className="text-base font-semibold flex items-center gap-2">
        <Icon className="h-4 w-4 text-amber-500" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {data.map((item, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium text-foreground">{item.percentage}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500"
              style={{ width: `${item.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
));

AudienceInsight.displayName = "AudienceInsight";

interface TopContentProps {
  items: Array<{
    title: string;
    views: number;
    engagement: number;
    trend: "up" | "down" | "stable";
  }>;
}

export const TopContent = memo(({ items }: TopContentProps) => (
  <Card className="border-0 shadow-sm">
    <CardHeader className="pb-3">
      <CardTitle className="text-base font-semibold flex items-center gap-2">
        <Zap className="h-4 w-4 text-emerald-500" />
        Top Performing Content
      </CardTitle>
      <CardDescription>Your best vehicles by engagement</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-white text-sm font-bold">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {item.views.toLocaleString()} views • {item.engagement}% engagement
              </p>
            </div>
            <div className={`p-1.5 rounded-md ${
              item.trend === "up" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50" :
              item.trend === "down" ? "bg-rose-100 text-rose-600 dark:bg-rose-950/50" :
              "bg-muted text-muted-foreground"
            }`}>
              {item.trend === "up" ? <TrendingUp className="h-3.5 w-3.5" /> :
               item.trend === "down" ? <TrendingDown className="h-3.5 w-3.5" /> :
               <Activity className="h-3.5 w-3.5" />}
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
));

TopContent.displayName = "TopContent";

interface ActivityHeatmapProps {
  data: Array<{ hour: number; count: number }>;
}

export const ActivityHeatmap = memo(({ data }: ActivityHeatmapProps) => {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-rose-500" />
          Peak Activity Hours
        </CardTitle>
        <CardDescription>When your audience is most active</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-12 gap-1">
          {data.slice(0, 24).map((item, i) => {
            const intensity = item.count / maxCount;
            return (
              <div key={i} className="group relative">
                <div 
                  className="h-10 rounded transition-all duration-200 cursor-pointer hover:scale-105"
                  style={{ 
                    backgroundColor: `rgba(239, 68, 68, ${0.1 + intensity * 0.8})`,
                  }}
                />
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground">
                  {i % 4 === 0 ? `${i}h` : ''}
                </div>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {item.count} views at {i}:00
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between items-center mt-8 text-xs text-muted-foreground">
          <span>Less active</span>
          <div className="flex gap-1">
            {[0.1, 0.3, 0.5, 0.7, 0.9].map((opacity, i) => (
              <div 
                key={i}
                className="w-4 h-2 rounded-sm"
                style={{ backgroundColor: `rgba(239, 68, 68, ${opacity})` }}
              />
            ))}
          </div>
          <span>More active</span>
        </div>
      </CardContent>
    </Card>
  );
});

ActivityHeatmap.displayName = "ActivityHeatmap";

interface QuickInsightProps {
  insights: string[];
}

export const QuickInsights = memo(({ insights }: QuickInsightProps) => (
  <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-950/20 dark:to-violet-950/20">
    <CardHeader className="pb-3">
      <CardTitle className="text-base font-semibold flex items-center gap-2">
        💡 AI Insights
      </CardTitle>
      <CardDescription>Personalized recommendations based on your data</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-2.5">
        {insights.slice(0, 5).map((insight, i) => (
          <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-white/60 dark:bg-card/60">
            <span className="text-sm leading-relaxed text-foreground/90">{insight}</span>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
));

QuickInsights.displayName = "QuickInsights";
