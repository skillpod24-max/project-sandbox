import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportKPICard } from "./ReportKPICard";
import { ReportsData } from "@/hooks/useReportsData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { Wallet, TrendingUp, TrendingDown, DollarSign, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { format, subMonths } from "date-fns";
import { Badge } from "@/components/ui/badge";

const COLORS = ["hsl(217, 91%, 60%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(262, 83%, 58%)", "hsl(339, 90%, 51%)", "hsl(199, 89%, 48%)", "hsl(25, 95%, 53%)", "hsl(173, 80%, 40%)"];
const TT = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' };

export const ExpenseReports = ({ data, sub }: { data: ReportsData; sub: string }) => {
  if (sub === "cashflow") return <CashFlowStatement data={data} />;
  return <ExpenseSummary data={data} />;
};

const ExpenseSummary = ({ data }: { data: ReportsData }) => {
  const { expenses, vehicles } = data;
  const now = new Date();
  const cm = now.getMonth(), cy = now.getFullYear();

  const m = useMemo(() => {
    const mtd = expenses.filter(e => { const d = new Date(e.expense_date); return d.getMonth() === cm && d.getFullYear() === cy; }).reduce((s, e) => s + Number(e.amount || 0), 0);

    // Avg monthly
    const monthlyTotals: Record<string, number> = {};
    expenses.forEach(e => {
      const month = format(new Date(e.expense_date), "yyyy-MM");
      monthlyTotals[month] = (monthlyTotals[month] || 0) + Number(e.amount || 0);
    });
    const months = Object.keys(monthlyTotals);
    const avgMonthly = months.length > 0 ? Object.values(monthlyTotals).reduce((s, v) => s + v, 0) / months.length : 0;

    const catMap: Record<string, number> = {};
    expenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount || 0); });
    const highestCat = Object.entries(catMap).sort(([, a], [, b]) => b - a)[0];
    const catPie = Object.entries(catMap).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));

    const vehicleLinked = expenses.filter(e => e.vehicle_id).reduce((s, e) => s + Number(e.amount || 0), 0);
    const totalExp = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const vehiclePct = totalExp > 0 ? (vehicleLinked / totalExp * 100).toFixed(0) : "0";

    const monthlyTrend: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const month = format(subMonths(now, i), "MMM yy");
      monthlyTrend.push({ month, amount: expenses.filter(e => format(new Date(e.expense_date), "MMM yy") === month).reduce((s, e) => s + Number(e.amount || 0), 0) });
    }

    // Vehicle-wise expenses
    const vehicleExpMap: Record<string, { name: string; amount: number }> = {};
    expenses.filter(e => e.vehicle_id).forEach(e => {
      const v = vehicles.find(v => v.id === e.vehicle_id);
      if (!v) return;
      const key = v.id;
      if (!vehicleExpMap[key]) vehicleExpMap[key] = { name: `${v.brand} ${v.model}`, amount: 0 };
      vehicleExpMap[key].amount += Number(e.amount || 0);
    });
    const topVehicleExp = Object.values(vehicleExpMap).sort((a, b) => b.amount - a.amount).slice(0, 10);

    const recent = [...expenses].sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()).slice(0, 20);

    return { mtd, avgMonthly, highestCat, catPie, vehicleLinked, vehiclePct, monthlyTrend, topVehicleExp, recent };
  }, [expenses, vehicles]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Expense Summary</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ReportKPICard title="Expenses (MTD)" value={m.mtd} icon={Wallet} color="text-chart-4" isCurrency />
        <ReportKPICard title="Avg Monthly" value={m.avgMonthly} icon={Wallet} color="text-chart-1" isCurrency />
        <ReportKPICard title="Highest Category" value={m.highestCat?.[0] || "N/A"} icon={Wallet} color="text-chart-3" secondary={m.highestCat ? formatCurrency(m.highestCat[1]) : ""} />
        <ReportKPICard title="Vehicle-linked" value={m.vehicleLinked} icon={Wallet} color="text-chart-2" isCurrency secondary={`${m.vehiclePct}% of total`} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-border bg-card rounded-xl">
          <CardHeader><CardTitle className="text-base">Monthly Expense Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={m.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={TT} />
                <Bar dataKey="amount" name="Expenses" fill={COLORS[4]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border border-border bg-card rounded-xl">
          <CardHeader><CardTitle className="text-base">Category-wise Expenses</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={m.catPie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                  {m.catPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={TT} />
                <Legend iconType="circle" formatter={v => <span className="text-xs capitalize">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card className="border border-border bg-card rounded-xl">
        <CardHeader><CardTitle className="text-base">Expense Register</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Category</TableHead>
                <TableHead className="text-xs">Description</TableHead>
                <TableHead className="text-xs text-right">Amount</TableHead>
                <TableHead className="text-xs">Mode</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {m.recent.map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs">{format(new Date(e.expense_date), "dd MMM yy")}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px] capitalize">{e.category}</Badge></TableCell>
                  <TableCell className="text-xs truncate max-w-[150px]">{e.description}</TableCell>
                  <TableCell className="text-xs text-right font-medium">{formatCurrency(e.amount)}</TableCell>
                  <TableCell className="text-xs capitalize">{e.payment_mode?.replace("_", " ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

const CashFlowStatement = ({ data }: { data: ReportsData }) => {
  const { payments, expenses } = data;
  const now = new Date();

  const m = useMemo(() => {
    const inflow = payments.filter(p => p.payment_type === "customer_payment" || p.payment_type === "emi_payment").reduce((s, p) => s + Number(p.amount || 0), 0);
    const outflow = expenses.reduce((s, e) => s + Number(e.amount || 0), 0) + payments.filter(p => p.payment_type === "vendor_payment").reduce((s, p) => s + Number(p.amount || 0), 0);
    const net = inflow - outflow;

    const monthly: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const month = format(subMonths(now, i), "MMM yy");
      const mInflow = payments.filter(p => (p.payment_type === "customer_payment" || p.payment_type === "emi_payment") && format(new Date(p.created_at), "MMM yy") === month).reduce((s, p) => s + Number(p.amount || 0), 0);
      const mOutflow = expenses.filter(e => format(new Date(e.expense_date), "MMM yy") === month).reduce((s, e) => s + Number(e.amount || 0), 0)
        + payments.filter(p => p.payment_type === "vendor_payment" && format(new Date(p.created_at), "MMM yy") === month).reduce((s, p) => s + Number(p.amount || 0), 0);
      monthly.push({ month, inflow: mInflow, outflow: mOutflow, net: mInflow - mOutflow });
    }

    return { inflow, outflow, net, monthly };
  }, [payments, expenses]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Cash Flow Statement</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <ReportKPICard title="Cash Inflow" value={m.inflow} icon={TrendingUp} color="text-chart-2" isCurrency />
        <ReportKPICard title="Cash Outflow" value={m.outflow} icon={TrendingDown} color="text-chart-4" isCurrency />
        <ReportKPICard title="Net Cash" value={m.net} icon={DollarSign} color={m.net >= 0 ? "text-chart-2" : "text-destructive"} isCurrency />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-border bg-card rounded-xl">
          <CardHeader><CardTitle className="text-base">Cash Inflow vs Outflow</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={m.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={TT} />
                <Legend />
                <Bar dataKey="inflow" name="Inflow" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="outflow" name="Outflow" fill={COLORS[4]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border border-border bg-card rounded-xl">
          <CardHeader><CardTitle className="text-base">Net Cash Flow Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={m.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={TT} />
                <Line type="monotone" dataKey="net" stroke={COLORS[0]} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card className="border border-border bg-card rounded-xl">
        <CardHeader><CardTitle className="text-base">Monthly Cash Flow Summary</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Month</TableHead>
                <TableHead className="text-xs text-right">Inflow</TableHead>
                <TableHead className="text-xs text-right">Outflow</TableHead>
                <TableHead className="text-xs text-right">Net Cash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {m.monthly.map((row: any, i: number) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-medium">{row.month}</TableCell>
                  <TableCell className="text-xs text-right text-chart-2">{formatCurrency(row.inflow)}</TableCell>
                  <TableCell className="text-xs text-right text-destructive">{formatCurrency(row.outflow)}</TableCell>
                  <TableCell className={`text-xs text-right font-medium ${row.net >= 0 ? "text-chart-2" : "text-destructive"}`}>{formatCurrency(row.net)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
