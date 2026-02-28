import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportKPICard } from "./ReportKPICard";
import { ReportsData } from "@/hooks/useReportsData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, ScatterChart, Scatter, ZAxis } from "recharts";
import { Car, Package, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { formatCurrency, formatIndianNumber } from "@/lib/formatters";
import { differenceInDays, format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const COLORS = ["hsl(142, 71%, 45%)", "hsl(217, 91%, 60%)", "hsl(38, 92%, 50%)", "hsl(262, 83%, 58%)", "hsl(339, 90%, 51%)"];
const TT = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' };

export const InventoryReports = ({ data, sub }: { data: ReportsData; sub: string }) => {
  if (sub === "aging") return <VehicleAging data={data} />;
  if (sub === "performance") return <VehiclePerformance data={data} />;
  return <StockSummary data={data} />;
};

const StockSummary = ({ data }: { data: ReportsData }) => {
  const { vehicles, purchases } = data;
  const now = new Date();

  const m = useMemo(() => {
    const inStock = vehicles.filter(v => v.status === "in_stock");
    const reserved = vehicles.filter(v => v.status === "reserved");
    const sold = vehicles.filter(v => v.status === "sold");
    const reservedValue = reserved.reduce((s, v) => s + Number(v.selling_price || 0), 0);

    const avgAging = inStock.length > 0
      ? Math.round(inStock.reduce((s, v) => s + (v.purchase_date ? differenceInDays(now, new Date(v.purchase_date)) : 0), 0) / inStock.length)
      : 0;

    const statusPie = [
      { name: "In Stock", value: inStock.length, color: COLORS[0] },
      { name: "Reserved", value: reserved.length, color: COLORS[2] },
      { name: "Sold", value: sold.length, color: COLORS[1] },
    ].filter(d => d.value > 0);

    return { inStock: inStock.length, reserved: reserved.length, sold: sold.length, reservedValue, avgAging, statusPie };
  }, [vehicles]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Stock Summary</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ReportKPICard title="In Stock" value={m.inStock} icon={Car} color="text-chart-2" secondary={`${((m.inStock / Math.max(m.inStock + m.reserved + m.sold, 1)) * 100).toFixed(0)}% of total`} />
        <ReportKPICard title="Reserved" value={m.reserved} icon={Package} color="text-chart-3" secondary={formatCurrency(m.reservedValue)} />
        <ReportKPICard title="Sold" value={m.sold} icon={TrendingUp} color="text-chart-1" />
        <ReportKPICard title="Avg Stock Aging" value={`${m.avgAging}d`} icon={Clock} color="text-chart-4" secondary="Ideal < 45 days" />
      </div>
      <Card className="border border-border bg-card rounded-xl">
        <CardHeader><CardTitle className="text-base">Inventory Status</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={m.statusPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                {m.statusPie.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={TT} />
              <Legend iconType="circle" formatter={v => <span className="text-xs">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

const VehicleAging = ({ data }: { data: ReportsData }) => {
  const { vehicles, purchases } = data;
  const now = new Date();

  const m = useMemo(() => {
    const inStock = vehicles.filter(v => v.status === "in_stock");
    const buckets = [
      { range: "0-30 days", count: 0, value: 0 },
      { range: "31-60 days", count: 0, value: 0 },
      { range: "60+ days", count: 0, value: 0 },
    ];

    inStock.forEach(v => {
      const days = v.purchase_date ? differenceInDays(now, new Date(v.purchase_date)) : 0;
      const price = Number(v.purchase_price || 0);
      if (days <= 30) { buckets[0].count++; buckets[0].value += price; }
      else if (days <= 60) { buckets[1].count++; buckets[1].value += price; }
      else { buckets[2].count++; buckets[2].value += price; }
    });

    const agedList = inStock.map(v => {
      const p = purchases.find(p => p.vehicle_id === v.id);
      const days = v.purchase_date ? differenceInDays(now, new Date(v.purchase_date)) : 0;
      return {
        code: v.code,
        name: `${v.brand} ${v.model}`,
        type: v.vehicle_type,
        purchaseDate: v.purchase_date,
        days,
        purchasePrice: Number(v.purchase_price || 0),
        sellingPrice: Number(v.selling_price || 0),
        margin: Number(v.selling_price || 0) - Number(v.purchase_price || 0),
      };
    }).sort((a, b) => b.days - a.days);

    return { buckets, agedList };
  }, [vehicles, purchases]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Vehicle Aging Report</h2>
      <div className="grid grid-cols-3 gap-3">
        {m.buckets.map((b, i) => (
          <ReportKPICard key={i} title={b.range} value={b.count} icon={Clock}
            color={i === 2 ? "text-destructive" : i === 1 ? "text-chart-3" : "text-chart-2"}
            secondary={`Capital: ${formatCurrency(b.value)}`} />
        ))}
      </div>
      <Card className="border border-border bg-card rounded-xl">
        <CardHeader><CardTitle className="text-base">Stock Aging Distribution</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={m.buckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="range" fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={TT} />
              <Bar dataKey="count" name="Vehicles" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="border border-border bg-card rounded-xl">
        <CardHeader><CardTitle className="text-base">Aged Inventory List</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Vehicle</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Purchase Date</TableHead>
                <TableHead className="text-xs">Days</TableHead>
                <TableHead className="text-xs text-right">Purchase ₹</TableHead>
                <TableHead className="text-xs text-right">Selling ₹</TableHead>
                <TableHead className="text-xs text-right">Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {m.agedList.slice(0, 20).map((v, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-medium">{v.name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px] capitalize">{v.type}</Badge></TableCell>
                  <TableCell className="text-xs">{v.purchaseDate ? format(new Date(v.purchaseDate), "dd MMM yy") : "-"}</TableCell>
                  <TableCell className={`text-xs font-medium ${v.days > 60 ? "text-destructive" : ""}`}>{v.days}d</TableCell>
                  <TableCell className="text-xs text-right">{formatCurrency(v.purchasePrice)}</TableCell>
                  <TableCell className="text-xs text-right">{formatCurrency(v.sellingPrice)}</TableCell>
                  <TableCell className={`text-xs text-right font-medium ${v.margin >= 0 ? "text-chart-2" : "text-destructive"}`}>{formatCurrency(v.margin)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

const VehiclePerformance = ({ data }: { data: ReportsData }) => {
  const { vehicles, sales, purchases } = data;

  const m = useMemo(() => {
    const completed = sales.filter(s => s.status === "completed");
    const soldVehicles = completed.map(s => {
      const v = vehicles.find(v => v.id === s.vehicle_id);
      if (!v) return null;
      const days = v.purchase_date ? differenceInDays(new Date(s.sale_date), new Date(v.purchase_date)) : 0;
      return { name: `${v.brand} ${v.model}`, days, type: v.vehicle_type };
    }).filter(Boolean) as { name: string; days: number; type: string }[];

    const fastest = [...soldVehicles].sort((a, b) => a.days - b.days)[0];
    const inStock = vehicles.filter(v => v.status === "in_stock");
    const slowest = inStock.map(v => ({
      name: `${v.brand} ${v.model}`,
      days: v.purchase_date ? differenceInDays(new Date(), new Date(v.purchase_date)) : 0,
    })).sort((a, b) => b.days - a.days)[0];
    const avgDays = soldVehicles.length > 0 ? Math.round(soldVehicles.reduce((s, v) => s + v.days, 0) / soldVehicles.length) : 0;

    const top10Fast = [...soldVehicles].sort((a, b) => a.days - b.days).slice(0, 10);
    const top10Slow = [...soldVehicles].sort((a, b) => b.days - a.days).slice(0, 10);

    return { fastest, slowest, avgDays, top10Fast, top10Slow };
  }, [vehicles, sales]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Vehicle Performance</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <ReportKPICard title="Fastest Sold" value={m.fastest ? `${m.fastest.days}d` : "N/A"} icon={TrendingUp} color="text-chart-2" secondary={m.fastest?.name || ""} />
        <ReportKPICard title="Slowest Moving" value={m.slowest ? `${m.slowest.days}d` : "N/A"} icon={AlertTriangle} color="text-destructive" secondary={m.slowest?.name || ""} />
        <ReportKPICard title="Avg Days to Sell" value={`${m.avgDays}d`} icon={Clock} color="text-chart-1" />
      </div>
      <Card className="border border-border bg-card rounded-xl">
        <CardHeader><CardTitle className="text-base">Fastest Selling Vehicles</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={m.top10Fast} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <YAxis type="category" dataKey="name" fontSize={11} stroke="hsl(var(--muted-foreground))" width={120} />
              <Tooltip contentStyle={TT} formatter={(v: number) => `${v} days`} />
              <Bar dataKey="days" name="Days to Sell" fill={COLORS[0]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
