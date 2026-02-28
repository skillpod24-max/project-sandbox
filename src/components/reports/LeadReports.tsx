import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportKPICard } from "./ReportKPICard";
import { ReportsData } from "@/hooks/useReportsData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { Users, TrendingUp, Eye, MessageSquare } from "lucide-react";
import { formatCurrency, formatIndianNumber } from "@/lib/formatters";
import { format, subMonths, differenceInDays } from "date-fns";
import { Badge } from "@/components/ui/badge";

const COLORS = ["hsl(217, 91%, 60%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(262, 83%, 58%)", "hsl(339, 90%, 51%)", "hsl(199, 89%, 48%)"];
const TT = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' };

export const LeadReports = ({ data, sub }: { data: ReportsData; sub: string }) => {
  if (sub === "funnel") return <ConversionFunnel data={data} />;
  if (sub === "publicpage") return <PublicPagePerformance data={data} />;
  return <LeadSummary data={data} />;
};

const LeadSummary = ({ data }: { data: ReportsData }) => {
  const { leads } = data;
  const now = new Date();
  const cm = now.getMonth(), cy = now.getFullYear();

  const m = useMemo(() => {
    const total = leads.length;
    const today = leads.filter(l => new Date(l.created_at).toDateString() === now.toDateString()).length;
    const active = leads.filter(l => ["new", "contacted", "follow_up", "qualified"].includes(l.status)).length;
    const lost = leads.filter(l => l.status === "lost").length;
    const followPending = leads.filter(l => l.follow_up_date && new Date(l.follow_up_date).toDateString() === now.toDateString()).length;

    const sourceMap: Record<string, number> = {};
    leads.forEach(l => { sourceMap[l.source] = (sourceMap[l.source] || 0) + 1; });
    const sourcePie = Object.entries(sourceMap).map(([name, value], i) => ({ name: name.replace("_", " "), value, color: COLORS[i % COLORS.length] }));

    const statusMap: Record<string, number> = {};
    leads.forEach(l => { statusMap[l.status] = (statusMap[l.status] || 0) + 1; });
    const statusPie = Object.entries(statusMap).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));

    const recent = leads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 20)
      .map(l => ({ ...l, age: differenceInDays(now, new Date(l.created_at)) }));

    return { total, today, active, lost, followPending, sourcePie, statusPie, recent };
  }, [leads]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Lead Summary</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ReportKPICard title="Total Leads" value={m.total} icon={Users} color="text-chart-1" />
        <ReportKPICard title="New Today" value={m.today} icon={Users} color="text-chart-2" />
        <ReportKPICard title="Active Leads" value={m.active} icon={TrendingUp} color="text-chart-3" secondary={`${m.followPending} follow-ups today`} />
        <ReportKPICard title="Lost / Closed" value={m.lost} icon={Users} color="text-chart-4" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-border bg-card rounded-xl">
          <CardHeader><CardTitle className="text-base">Source-wise Leads</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={m.sourcePie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                  {m.sourcePie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={TT} />
                <Legend iconType="circle" formatter={v => <span className="text-xs capitalize">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border border-border bg-card rounded-xl">
          <CardHeader><CardTitle className="text-base">Status-wise Leads</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={m.statusPie}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={TT} />
                <Bar dataKey="value" name="Leads" radius={[4, 4, 0, 0]}>
                  {m.statusPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card className="border border-border bg-card rounded-xl">
        <CardHeader><CardTitle className="text-base">Lead Register</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">Phone</TableHead>
                <TableHead className="text-xs">Source</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Interest</TableHead>
                <TableHead className="text-xs">Age</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {m.recent.map((l: any) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs font-medium">{l.customer_name}</TableCell>
                  <TableCell className="text-xs">{l.phone}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px] capitalize">{l.source?.replace("_", " ")}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{l.status}</Badge></TableCell>
                  <TableCell className="text-xs truncate max-w-[100px]">{l.vehicle_interest || "-"}</TableCell>
                  <TableCell className="text-xs">{l.age}d</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

const ConversionFunnel = ({ data }: { data: ReportsData }) => {
  const { leads, customers, sales } = data;
  const now = new Date();

  const m = useMemo(() => {
    const totalLeads = leads.length;
    const converted = customers.filter(c => c.converted_from_lead).length;
    const completed = sales.filter(s => s.status === "completed").length;
    const custPct = totalLeads > 0 ? (converted / totalLeads * 100) : 0;
    const salePct = totalLeads > 0 ? (completed / totalLeads * 100) : 0;

    const monthly: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const month = format(subMonths(now, i), "MMM yy");
      const ml = leads.filter(l => format(new Date(l.created_at), "MMM yy") === month).length;
      const ms = sales.filter(s => s.status === "completed" && format(new Date(s.sale_date), "MMM yy") === month).length;
      monthly.push({ month, conversion: ml > 0 ? (ms / ml * 100) : 0 });
    }

    return { totalLeads, converted, completed, custPct, salePct, monthly };
  }, [leads, customers, sales]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Lead Conversion Funnel</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ReportKPICard title="Lead → Customer %" value={`${m.custPct.toFixed(1)}%`} icon={Users} color="text-chart-2" />
        <ReportKPICard title="Lead → Sale %" value={`${m.salePct.toFixed(1)}%`} icon={TrendingUp} color="text-chart-1" secondary="Good > 15%" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-border bg-card rounded-xl">
          <CardHeader><CardTitle className="text-base">Conversion Funnel</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "Leads Created", value: m.totalLeads, pct: 100, color: COLORS[0] },
                { label: "Customers Created", value: m.converted, pct: m.custPct, color: COLORS[1] },
                { label: "Sales Completed", value: m.completed, pct: m.salePct, color: COLORS[2] },
              ].map((step, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{step.label}</span>
                    <span className="font-medium">{step.value} ({step.pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-8 bg-muted rounded-md overflow-hidden">
                    <div className="h-full rounded-md flex items-center px-2" style={{ width: `${Math.max(step.pct, 3)}%`, backgroundColor: step.color }}>
                      <span className="text-[10px] text-white font-medium">{step.pct.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border bg-card rounded-xl">
          <CardHeader><CardTitle className="text-base">Conversion Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={m.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={TT} formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Line type="monotone" dataKey="conversion" stroke={COLORS[1]} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const PublicPagePerformance = ({ data }: { data: ReportsData }) => {
  const { events, leads, vehicles } = data;

  const m = useMemo(() => {
    const pageViews = events.filter(e => e.event_type === "page_view").length;
    const vehicleViews = events.filter(e => e.event_type === "vehicle_view").length;
    const publicLeads = leads.filter(l => l.source === "website" || l.source === "public_page").length;
    const convPct = pageViews > 0 ? (publicLeads / pageViews * 100) : 0;

    const vehicleViewMap: Record<string, { views: number; enquiries: number; name: string }> = {};
    events.forEach(e => {
      if (!e.vehicle_id) return;
      if (!vehicleViewMap[e.vehicle_id]) {
        const v = vehicles.find(v => v.id === e.vehicle_id);
        vehicleViewMap[e.vehicle_id] = { views: 0, enquiries: 0, name: v ? `${v.brand} ${v.model}` : "Unknown" };
      }
      if (e.event_type.includes("view")) vehicleViewMap[e.vehicle_id].views++;
      if (e.event_type.includes("enquiry")) vehicleViewMap[e.vehicle_id].enquiries++;
    });
    const topVehicles = Object.values(vehicleViewMap).sort((a, b) => (b.views + b.enquiries) - (a.views + a.enquiries)).slice(0, 10);

    return { pageViews, vehicleViews, publicLeads, convPct, topVehicles };
  }, [events, leads, vehicles]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Public Page Performance</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ReportKPICard title="Page Views" value={m.pageViews} icon={Eye} color="text-chart-1" />
        <ReportKPICard title="Vehicle Views" value={m.vehicleViews} icon={Eye} color="text-chart-2" />
        <ReportKPICard title="Enquiries" value={m.publicLeads} icon={MessageSquare} color="text-chart-3" />
        <ReportKPICard title="Conversion %" value={`${m.convPct.toFixed(1)}%`} icon={TrendingUp} color="text-chart-4" />
      </div>
      <Card className="border border-border bg-card rounded-xl">
        <CardHeader><CardTitle className="text-base">Top Performing Vehicles</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Vehicle</TableHead>
                <TableHead className="text-xs text-right">Views</TableHead>
                <TableHead className="text-xs text-right">Enquiries</TableHead>
                <TableHead className="text-xs text-right">Conv %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {m.topVehicles.map((v, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-medium">{v.name}</TableCell>
                  <TableCell className="text-xs text-right">{v.views}</TableCell>
                  <TableCell className="text-xs text-right">{v.enquiries}</TableCell>
                  <TableCell className="text-xs text-right">{v.views > 0 ? (v.enquiries / v.views * 100).toFixed(1) : "0"}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
