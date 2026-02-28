import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportKPICard } from "./ReportKPICard";
import { ReportsData } from "@/hooks/useReportsData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { TrendingUp, DollarSign, Receipt, Percent, CreditCard, Wallet } from "lucide-react";
import { formatCurrency, formatIndianNumber } from "@/lib/formatters";
import { format, subMonths } from "date-fns";
import { Badge } from "@/components/ui/badge";

const COLORS = ["hsl(217, 91%, 60%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(262, 83%, 58%)", "hsl(339, 90%, 51%)", "hsl(199, 89%, 48%)"];
const TT = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' };

export const SalesReports = ({ data, sub }: { data: ReportsData; sub: string }) => {
  const { sales, vehicles, purchases, payments, expenses, emis } = data;
  const completed = useMemo(() => sales.filter(s => s.status === "completed"), [sales]);
  const now = new Date();

  if (sub === "summary") return <SalesSummary completed={completed} vehicles={vehicles} />;
  if (sub === "profit") return <ProfitAnalysis completed={completed} vehicles={vehicles} purchases={purchases} expenses={expenses} />;
  if (sub === "collection") return <PaymentCollection payments={payments} sales={sales} />;
  return <SalesSummary completed={completed} vehicles={vehicles} />;
};

const SalesSummary = ({ completed, vehicles }: { completed: any[]; vehicles: any[] }) => {
  const now = new Date();
  const m = useMemo(() => {
    const gross = completed.reduce((s, x) => s + Number(x.selling_price || 0), 0);
    const net = completed.reduce((s, x) => s + Number(x.total_amount || 0), 0);
    const disc = completed.reduce((s, x) => s + Number(x.discount || 0), 0);
    const tax = completed.reduce((s, x) => s + Number(x.tax_amount || 0), 0);

    const trend: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const month = format(subMonths(now, i), "MMM yy");
      const ms = completed.filter(s => format(new Date(s.sale_date), "MMM yy") === month);
      trend.push({ month, revenue: ms.reduce((s, x) => s + Number(x.total_amount || 0), 0), count: ms.length });
    }

    const typeMap: Record<string, number> = {};
    completed.forEach(s => {
      const v = vehicles.find(v => v.id === s.vehicle_id);
      if (v) typeMap[v.vehicle_type] = (typeMap[v.vehicle_type] || 0) + Number(s.total_amount || 0);
    });
    const typePie = Object.entries(typeMap).map(([name, value], i) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value, color: COLORS[i % COLORS.length] }));

    return { count: completed.length, gross, net, disc, tax, trend, typePie };
  }, [completed, vehicles]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Sales Summary</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ReportKPICard title="Total Sales" value={m.count} icon={TrendingUp} color="text-chart-1" />
        <ReportKPICard title="Gross Sales" value={m.gross} icon={DollarSign} color="text-chart-2" isCurrency secondary="Before discount & tax" />
        <ReportKPICard title="Net Revenue" value={m.net} icon={DollarSign} color="text-chart-1" isCurrency />
        <ReportKPICard title="Discounts / Tax" value={m.disc + m.tax} icon={Receipt} color="text-chart-3" isCurrency secondary={`Disc: ${formatCurrency(m.disc)} | Tax: ${formatCurrency(m.tax)}`} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-border bg-card rounded-xl">
          <CardHeader><CardTitle className="text-base">Monthly Sales Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={m.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={TT} />
                <Line type="monotone" dataKey="revenue" stroke={COLORS[0]} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border border-border bg-card rounded-xl">
          <CardHeader><CardTitle className="text-base">Vehicle Type-wise Sales</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={m.typePie} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value">
                  {m.typePie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={TT} />
                <Legend iconType="circle" formatter={v => <span className="text-xs">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ProfitAnalysis = ({ completed, vehicles, purchases, expenses }: { completed: any[]; vehicles: any[]; purchases: any[]; expenses: any[] }) => {
  const now = new Date();
  const m = useMemo(() => {
    let grossProfit = 0;
    const vehicleProfits: { name: string; profit: number; type: string }[] = [];

    completed.forEach(s => {
      const v = vehicles.find(v => v.id === s.vehicle_id);
      const p = purchases.find(p => p.vehicle_id === s.vehicle_id);
      if (!v || !p) return;
      const prof = Number(s.selling_price || 0) - Number(p.purchase_price || 0);
      grossProfit += prof;
      vehicleProfits.push({ name: `${v.brand} ${v.model}`, profit: prof, type: v.vehicle_type });
    });

    const totalExp = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const avgPerVehicle = completed.length > 0 ? grossProfit / completed.length : 0;
    const cm = now.getMonth(), cy = now.getFullYear();
    const thisMonthSales = completed.filter(s => { const d = new Date(s.sale_date); return d.getMonth() === cm && d.getFullYear() === cy; });
    let thisMonthProfit = 0;
    thisMonthSales.forEach(s => {
      const p = purchases.find(p => p.vehicle_id === s.vehicle_id);
      if (p) thisMonthProfit += Number(s.selling_price || 0) - Number(p.purchase_price || 0);
    });

    const typeProfit: Record<string, number> = {};
    vehicleProfits.forEach(vp => { typeProfit[vp.type] = (typeProfit[vp.type] || 0) + vp.profit; });
    const bestType = Object.entries(typeProfit).sort(([, a], [, b]) => b - a)[0];

    const monthlyProfit: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const month = format(subMonths(now, i), "MMM yy");
      let mp = 0;
      completed.filter(s => format(new Date(s.sale_date), "MMM yy") === month).forEach(s => {
        const p = purchases.find(p => p.vehicle_id === s.vehicle_id);
        if (p) mp += Number(s.selling_price || 0) - Number(p.purchase_price || 0);
      });
      const me = expenses.filter(e => format(new Date(e.expense_date), "MMM yy") === month).reduce((s, e) => s + Number(e.amount || 0), 0);
      monthlyProfit.push({ month, profit: mp - me });
    }

    const typeProfitChart = Object.entries(typeProfit).map(([name, value], i) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), profit: value, color: COLORS[i % COLORS.length] }));
    const top10 = [...vehicleProfits].sort((a, b) => b.profit - a.profit).slice(0, 10);
    const bottom10 = [...vehicleProfits].sort((a, b) => a.profit - b.profit).slice(0, 10);

    return { grossProfit, avgPerVehicle, thisMonthProfit, bestType, monthlyProfit, typeProfitChart, top10, bottom10 };
  }, [completed, vehicles, purchases, expenses]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Profit Analysis</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ReportKPICard title="Gross Profit" value={m.grossProfit} icon={TrendingUp} color="text-chart-2" isCurrency />
        <ReportKPICard title="Avg Per Vehicle" value={m.avgPerVehicle} icon={DollarSign} color="text-chart-1" isCurrency />
        <ReportKPICard title="This Month" value={m.thisMonthProfit} icon={TrendingUp} color="text-chart-2" isCurrency />
        <ReportKPICard title="Best Type" value={m.bestType ? `${m.bestType[0]}` : "N/A"} icon={TrendingUp} color="text-chart-4" secondary={m.bestType ? formatCurrency(m.bestType[1]) : ""} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-border bg-card rounded-xl">
          <CardHeader><CardTitle className="text-base">Monthly Profit</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={m.monthlyProfit}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={TT} />
                <Bar dataKey="profit" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border border-border bg-card rounded-xl">
          <CardHeader><CardTitle className="text-base">Profit by Vehicle Type</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={m.typeProfitChart} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" fontSize={12} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="name" fontSize={12} stroke="hsl(var(--muted-foreground))" width={80} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={TT} />
                <Bar dataKey="profit" radius={[0, 4, 4, 0]}>
                  {m.typeProfitChart.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card className="border border-border bg-card rounded-xl">
        <CardHeader><CardTitle className="text-base">Top 10 Profit Vehicles</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={m.top10} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" fontSize={12} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
              <YAxis type="category" dataKey="name" fontSize={11} stroke="hsl(var(--muted-foreground))" width={120} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={TT} />
              <Bar dataKey="profit" fill={COLORS[1]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

const PaymentCollection = ({ payments, sales }: { payments: any[]; sales: any[] }) => {
  const m = useMemo(() => {
    const custPay = payments.filter(p => p.payment_type === "customer_payment").reduce((s, p) => s + Number(p.amount || 0), 0);
    const emiPay = payments.filter(p => p.payment_type === "emi_payment").reduce((s, p) => s + Number(p.amount || 0), 0);
    const completed = sales.filter(s => s.status === "completed");
    const outstanding = completed.reduce((s, x) => s + Math.max(Number(x.total_amount || 0) - Number(x.amount_paid || 0), 0), 0);
    const totalPaid = custPay + emiPay;

    const paidPending = [
      { name: "Paid", value: totalPaid, color: COLORS[1] },
      { name: "Pending", value: outstanding, color: COLORS[4] },
    ].filter(d => d.value > 0);

    const modeMap: Record<string, number> = {};
    payments.filter(p => p.payment_type === "customer_payment" || p.payment_type === "emi_payment").forEach(p => {
      modeMap[p.payment_mode] = (modeMap[p.payment_mode] || 0) + Number(p.amount || 0);
    });
    const modePie = Object.entries(modeMap).map(([name, value], i) => ({ name: name.replace("_", " ").toUpperCase(), value, color: COLORS[i % COLORS.length] }));

    const recent = payments.filter(p => p.payment_type === "customer_payment" || p.payment_type === "emi_payment")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 20);

    return { custPay, emiPay, outstanding, paidPending, modePie, recent };
  }, [payments, sales]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Payment Collection</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <ReportKPICard title="Customer Payments" value={m.custPay} icon={Wallet} color="text-chart-2" isCurrency />
        <ReportKPICard title="EMI Payments" value={m.emiPay} icon={CreditCard} color="text-chart-1" isCurrency />
        <ReportKPICard title="Outstanding" value={m.outstanding} icon={DollarSign} color="text-chart-4" isCurrency />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-border bg-card rounded-xl">
          <CardHeader><CardTitle className="text-base">Paid vs Pending</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={m.paidPending} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value">
                  {m.paidPending.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={TT} />
                <Legend iconType="circle" formatter={v => <span className="text-xs">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border border-border bg-card rounded-xl">
          <CardHeader><CardTitle className="text-base">Payment Mode Split</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={m.modePie} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value">
                  {m.modePie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={TT} />
                <Legend iconType="circle" formatter={v => <span className="text-xs capitalize">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card className="border border-border bg-card rounded-xl">
        <CardHeader><CardTitle className="text-base">Payment Register</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Mode</TableHead>
                <TableHead className="text-xs text-right">Amount</TableHead>
                <TableHead className="text-xs">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {m.recent.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs">{format(new Date(p.payment_date), "dd MMM yy")}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{p.payment_type.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="text-xs capitalize">{p.payment_mode.replace("_", " ")}</TableCell>
                  <TableCell className="text-xs text-right font-medium">{formatCurrency(p.amount)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground truncate max-w-[150px]">{p.description || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
