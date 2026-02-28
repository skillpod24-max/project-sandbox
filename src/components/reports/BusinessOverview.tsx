import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportKPICard } from "./ReportKPICard";
import { ReportsData } from "@/hooks/useReportsData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend } from "recharts";
import { Car, TrendingUp, DollarSign, CreditCard, Wallet, Users, Package } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { format, subMonths } from "date-fns";

const COLORS = ["hsl(217, 91%, 60%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(262, 83%, 58%)", "hsl(339, 90%, 51%)"];
const TT = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' };

export const BusinessOverview = ({ data }: { data: ReportsData }) => {
  const { sales, vehicles, purchases, payments, emis, customers, expenses, leads } = data;

  const m = useMemo(() => {
    const now = new Date();
    const cm = now.getMonth(), cy = now.getFullYear();
    const completed = sales.filter(s => s.status === "completed");
    const inStock = vehicles.filter(v => v.status === "in_stock").length;
    const soldMTD = completed.filter(s => { const d = new Date(s.sale_date); return d.getMonth() === cm && d.getFullYear() === cy; }).length;
    const soldYTD = completed.filter(s => new Date(s.sale_date).getFullYear() === cy).length;
    const totalSalesVal = completed.reduce((s, x) => s + Number(x.total_amount || 0), 0);

    const rev = payments.filter(p => p.payment_type === "customer_payment" || p.payment_type === "emi_payment").reduce((s, p) => s + Number(p.amount || 0), 0);
    const cost = payments.filter(p => p.payment_type === "vendor_payment").reduce((s, p) => s + Number(p.amount || 0), 0);
    const exp = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const profit = rev - cost - exp;
    const margin = rev > 0 ? (profit / rev * 100) : 0;

    const pendingEmis = emis.filter(e => e.status === "pending" || e.status === "overdue");
    const pendingEmiAmt = pendingEmis.reduce((s, e) => s + (Number(e.emi_amount || 0) - Number(e.amount_paid || 0)), 0);
    const overdue = emis.filter(e => e.status === "overdue" || (e.status === "pending" && new Date(e.due_date) < now)).length;

    const vendorPending = purchases.reduce((s, p) => s + Number(p.balance_amount || 0), 0);
    const vendorCount = new Set(purchases.filter(p => Number(p.balance_amount || 0) > 0).map(p => p.vendor_id)).size;

    const todayLeads = leads.filter(l => new Date(l.created_at).toDateString() === now.toDateString()).length;
    const monthLeads = leads.filter(l => { const d = new Date(l.created_at); return d.getMonth() === cm && d.getFullYear() === cy; }).length;
    const won = leads.filter(l => l.status === "won").length;
    const convPct = leads.length > 0 ? (won / leads.length * 100).toFixed(1) : "0";

    const revTrend: any[] = [];
    const svsE: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const month = format(subMonths(now, i), "MMM yy");
      const ms = completed.filter(s => format(new Date(s.sale_date), "MMM yy") === month);
      revTrend.push({ month, revenue: ms.reduce((s, x) => s + Number(x.total_amount || 0), 0), count: ms.length });
      const me = expenses.filter(e => format(new Date(e.expense_date), "MMM yy") === month).reduce((s, e) => s + Number(e.amount || 0), 0);
      svsE.push({ month, sales: ms.reduce((s, x) => s + Number(x.total_amount || 0), 0), expenses: me });
    }

    const totalLeadsCount = leads.length;
    const convertedCust = customers.filter(c => c.converted_from_lead).length;
    const completedCount = completed.length;

    const emiSum = [
      { name: "Paid", value: emis.filter(e => e.status === "paid").reduce((s, e) => s + Number(e.emi_amount || 0), 0), color: COLORS[1] },
      { name: "Pending", value: emis.filter(e => e.status === "pending").reduce((s, e) => s + Number(e.emi_amount || 0), 0), color: COLORS[3] },
      { name: "Overdue", value: emis.filter(e => e.status === "overdue" || (e.status === "pending" && new Date(e.due_date) < now)).reduce((s, e) => s + (Number(e.emi_amount || 0) - Number(e.amount_paid || 0)), 0), color: COLORS[4] },
    ].filter(d => d.value > 0);

    const typeSales: Record<string, number> = {};
    completed.forEach(s => { const v = vehicles.find(v => v.id === s.vehicle_id); if (v) typeSales[v.vehicle_type] = (typeSales[v.vehicle_type] || 0) + 1; });
    const topType = Object.entries(typeSales).sort(([, a], [, b]) => b - a);
    const todayFU = leads.filter(l => l.follow_up_date && new Date(l.follow_up_date).toDateString() === now.toDateString()).length;

    return { inStock, soldMTD, soldYTD, totalSalesVal, profit, margin, pendingEmiAmt, overdue, vendorPending, vendorCount, todayLeads, monthLeads, convPct, revTrend, svsE, totalLeadsCount, convertedCust, completedCount, emiSum, topType, todayFU };
  }, [data]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Business Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <ReportKPICard title="In Stock" value={m.inStock} icon={Car} color="text-chart-2" secondary="Live inventory" />
        <ReportKPICard title="Sold (MTD)" value={m.soldMTD} icon={TrendingUp} color="text-chart-1" secondary={`YTD: ${m.soldYTD}`} />
        <ReportKPICard title="Sales Value" value={m.totalSalesVal} icon={DollarSign} color="text-chart-2" isCurrency />
        <ReportKPICard title="Total Profit" value={m.profit} icon={TrendingUp} color={m.profit >= 0 ? "text-chart-2" : "text-destructive"} isCurrency secondary={`Margin: ${m.margin.toFixed(1)}%`} />
        <ReportKPICard title="Pending EMI" value={m.pendingEmiAmt} icon={CreditCard} color="text-chart-4" isCurrency secondary={`${m.overdue} overdue`} />
        <ReportKPICard title="Vendor Pending" value={m.vendorPending} icon={Wallet} color="text-chart-3" isCurrency secondary={`${m.vendorCount} vendors`} />
        <ReportKPICard title="Leads (Today)" value={m.todayLeads} icon={Users} color="text-chart-5" secondary={`Month: ${m.monthLeads} | Conv: ${m.convPct}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-border bg-card rounded-xl">
          <CardHeader><CardTitle className="text-base">Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={m.revTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={TT} />
                <Area type="monotone" dataKey="revenue" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border border-border bg-card rounded-xl">
          <CardHeader><CardTitle className="text-base">Sales vs Expenses</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={m.svsE}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={TT} />
                <Legend />
                <Bar dataKey="sales" name="Sales" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill={COLORS[4]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border border-border bg-card rounded-xl">
          <CardHeader><CardTitle className="text-base">Lead → Sale Funnel</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Leads Created", value: m.totalLeadsCount, pct: 100 },
                { label: "Customers Created", value: m.convertedCust, pct: m.totalLeadsCount > 0 ? (m.convertedCust / m.totalLeadsCount * 100) : 0 },
                { label: "Sales Completed", value: m.completedCount, pct: m.totalLeadsCount > 0 ? (m.completedCount / m.totalLeadsCount * 100) : 0 },
              ].map((step, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{step.label}</span>
                    <span className="font-medium">{step.value} ({step.pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-6 bg-muted rounded-md overflow-hidden">
                    <div className="h-full rounded-md" style={{ width: `${Math.max(step.pct, 2)}%`, backgroundColor: COLORS[i] }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card rounded-xl">
          <CardHeader><CardTitle className="text-base">EMI Due Summary</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={m.emiSum} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                  {m.emiSum.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={TT} />
                <Legend iconType="circle" formatter={v => <span className="text-xs">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card rounded-xl">
          <CardHeader><CardTitle className="text-base">Quick Insights</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Top Selling Type</p>
              <p className="font-semibold text-sm mt-1 capitalize">{m.topType[0]?.[0] || "N/A"}</p>
              <p className="text-xs text-muted-foreground">{m.topType[0]?.[1] || 0} sales</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">High Risk EMIs</p>
              <p className="font-semibold text-sm mt-1 text-destructive">{m.overdue}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Today's Follow-ups</p>
              <p className="font-semibold text-sm mt-1">{m.todayFU}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
