import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportKPICard } from "./ReportKPICard";
import { ReportsData } from "@/hooks/useReportsData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { CreditCard, TrendingUp, AlertTriangle, DollarSign, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { format, subMonths, differenceInDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const COLORS = ["hsl(217, 91%, 60%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(262, 83%, 58%)", "hsl(339, 90%, 51%)"];
const TT = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' };

export const EMIReports = ({ data, sub }: { data: ReportsData; sub: string }) => {
  if (sub === "schedule") return <EMIDueSchedule data={data} />;
  if (sub === "interest") return <InterestPrincipal data={data} />;
  return <EMIOverview data={data} />;
};

const EMIOverview = ({ data }: { data: ReportsData }) => {
  const { emis, sales } = data;
  const now = new Date();
  const cm = now.getMonth(), cy = now.getFullYear();

  const m = useMemo(() => {
    const activeAccounts = new Set(emis.filter(e => e.status === "pending" || e.status === "overdue").map(e => e.sale_id)).size;
    const totalEmiSales = new Set(emis.map(e => e.sale_id)).size;
    const emiPct = totalEmiSales > 0 ? (activeAccounts / totalEmiSales * 100).toFixed(0) : "0";

    const outstanding = emis.filter(e => e.status !== "paid").reduce((s, e) => s + Math.max(Number(e.emi_amount || 0) - Number(e.amount_paid || 0), 0), 0);
    const overdueAmt = emis.filter(e => e.status === "overdue" || (e.status === "pending" && new Date(e.due_date) < now))
      .reduce((s, e) => s + Math.max(Number(e.emi_amount || 0) - Number(e.amount_paid || 0), 0), 0);
    const overduePct = outstanding > 0 ? (overdueAmt / outstanding * 100).toFixed(0) : "0";

    const collectedThisMonth = emis.filter(e => e.paid_date && new Date(e.paid_date).getMonth() === cm && new Date(e.paid_date).getFullYear() === cy)
      .reduce((s, e) => s + Number(e.amount_paid || 0), 0);

    const overdueCount = emis.filter(e => e.status === "overdue" || (e.status === "pending" && new Date(e.due_date) < now)).length;

    const totalDue = emis.reduce((s, e) => s + Number(e.emi_amount || 0), 0);
    const totalCollected = emis.reduce((s, e) => s + Number(e.amount_paid || 0), 0);
    const healthPct = totalDue > 0 ? (totalCollected / totalDue * 100) : 0;

    return { activeAccounts, emiPct, outstanding, overdueAmt, overduePct, collectedThisMonth, overdueCount, healthPct };
  }, [emis]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">EMI Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ReportKPICard title="Active EMI Accounts" value={m.activeAccounts} icon={CreditCard} color="text-chart-1" secondary={`${m.emiPct}% of sales on EMI`} />
        <ReportKPICard title="Total Outstanding" value={m.outstanding} icon={Wallet} color="text-chart-4" isCurrency secondary={`${m.overduePct}% overdue`} />
        <ReportKPICard title="Collected (MTD)" value={m.collectedThisMonth} icon={TrendingUp} color="text-chart-2" isCurrency />
        <ReportKPICard title="Overdue Amount" value={m.overdueAmt} icon={AlertTriangle} color="text-destructive" isCurrency secondary={`${m.overdueCount} EMIs`} />
      </div>
      <Card className="border border-border bg-card rounded-xl">
        <CardHeader><CardTitle className="text-base">EMI Collection Health</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Collection Progress</span>
              <span className="font-medium">{m.healthPct.toFixed(1)}%</span>
            </div>
            <Progress value={m.healthPct} className="h-4" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const EMIDueSchedule = ({ data }: { data: ReportsData }) => {
  const { emis, sales, vehicles, customers } = data;
  const now = new Date();

  const m = useMemo(() => {
    const todayDue = emis.filter(e => e.status === "pending" && new Date(e.due_date).toDateString() === now.toDateString());
    const todayAmt = todayDue.reduce((s, e) => s + Number(e.emi_amount || 0), 0);

    const next7 = emis.filter(e => e.status === "pending" && new Date(e.due_date) > now && differenceInDays(new Date(e.due_date), now) <= 7);
    const next15 = emis.filter(e => e.status === "pending" && new Date(e.due_date) > now && differenceInDays(new Date(e.due_date), now) <= 15);
    const next30 = emis.filter(e => e.status === "pending" && new Date(e.due_date) > now && differenceInDays(new Date(e.due_date), now) <= 30);

    const overdue = emis.filter(e => e.status === "pending" && new Date(e.due_date) < now);
    const overdueAmt = overdue.reduce((s, e) => s + Math.max(Number(e.emi_amount || 0) - Number(e.amount_paid || 0), 0), 0);

    const statusPie = [
      { name: "Paid", value: emis.filter(e => e.status === "paid").reduce((s, e) => s + Number(e.emi_amount || 0), 0), color: COLORS[1] },
      { name: "Pending", value: emis.filter(e => e.status === "pending" && new Date(e.due_date) >= now).reduce((s, e) => s + Number(e.emi_amount || 0), 0), color: COLORS[2] },
      { name: "Overdue", value: overdueAmt, color: COLORS[4] },
    ].filter(d => d.value > 0);

    // Aging buckets
    const aging = [
      { bucket: "0-30 days", amount: 0 },
      { bucket: "31-60 days", amount: 0 },
      { bucket: "61-90 days", amount: 0 },
      { bucket: "90+ days", amount: 0 },
    ];
    overdue.forEach(e => {
      const days = differenceInDays(now, new Date(e.due_date));
      const amt = Number(e.emi_amount || 0) - Number(e.amount_paid || 0);
      if (days <= 30) aging[0].amount += amt;
      else if (days <= 60) aging[1].amount += amt;
      else if (days <= 90) aging[2].amount += amt;
      else aging[3].amount += amt;
    });

    // Due list
    const dueList = emis.filter(e => e.status === "pending" || e.status === "partially_paid")
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 30)
      .map(e => {
        const sale = sales.find(s => s.id === e.sale_id);
        const vehicle = sale ? vehicles.find(v => v.id === sale.vehicle_id) : null;
        const customer = sale ? customers.find(c => c.id === sale.customer_id) : null;
        const daysOverdue = new Date(e.due_date) < now ? differenceInDays(now, new Date(e.due_date)) : 0;
        return { ...e, vehicleName: vehicle ? `${vehicle.brand} ${vehicle.model}` : "-", customerName: customer?.full_name || "-", daysOverdue };
      });

    return { todayCount: todayDue.length, todayAmt, next7: next7.length, next15: next15.length, next30: next30.length, overdueCount: overdue.length, overdueAmt, statusPie, aging, dueList };
  }, [emis, sales, vehicles, customers]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">EMI Due Schedule</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ReportKPICard title="Today's Due" value={m.todayCount} icon={CreditCard} color="text-destructive" secondary={formatCurrency(m.todayAmt)} />
        <ReportKPICard title="Next 7 Days" value={m.next7} icon={CreditCard} color="text-chart-3" />
        <ReportKPICard title="Next 30 Days" value={m.next30} icon={CreditCard} color="text-chart-1" />
        <ReportKPICard title="Overdue" value={m.overdueCount} icon={AlertTriangle} color="text-destructive" secondary={formatCurrency(m.overdueAmt)} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-border bg-card rounded-xl">
          <CardHeader><CardTitle className="text-base">Due vs Paid vs Overdue</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={m.statusPie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                  {m.statusPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={TT} />
                <Legend iconType="circle" formatter={v => <span className="text-xs">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border border-border bg-card rounded-xl">
          <CardHeader><CardTitle className="text-base">EMI Aging Buckets</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={m.aging}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="bucket" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={TT} />
                <Bar dataKey="amount" fill={COLORS[4]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card className="border border-border bg-card rounded-xl">
        <CardHeader><CardTitle className="text-base">EMI Due List</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Customer</TableHead>
                <TableHead className="text-xs">Vehicle</TableHead>
                <TableHead className="text-xs">EMI #</TableHead>
                <TableHead className="text-xs">Due Date</TableHead>
                <TableHead className="text-xs text-right">Amount</TableHead>
                <TableHead className="text-xs text-right">Paid</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Overdue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {m.dueList.map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs font-medium">{e.customerName}</TableCell>
                  <TableCell className="text-xs">{e.vehicleName}</TableCell>
                  <TableCell className="text-xs">#{e.emi_number}</TableCell>
                  <TableCell className="text-xs">{format(new Date(e.due_date), "dd MMM yy")}</TableCell>
                  <TableCell className="text-xs text-right">{formatCurrency(e.emi_amount)}</TableCell>
                  <TableCell className="text-xs text-right">{formatCurrency(e.amount_paid || 0)}</TableCell>
                  <TableCell><Badge variant={e.daysOverdue > 0 ? "destructive" : "outline"} className="text-[10px]">{e.daysOverdue > 0 ? "Overdue" : e.status}</Badge></TableCell>
                  <TableCell className="text-xs">{e.daysOverdue > 0 ? `${e.daysOverdue}d` : "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

const InterestPrincipal = ({ data }: { data: ReportsData }) => {
  const { emis } = data;
  const now = new Date();
  const cm = now.getMonth(), cy = now.getFullYear();

  const m = useMemo(() => {
    const intEarned = emis.reduce((s, e) => s + Number(e.interest_paid || 0), 0);
    const principalRecovered = emis.reduce((s, e) => s + Number(e.principal_paid || 0), 0);
    const intPending = emis.reduce((s, e) => s + Math.max(Number(e.interest_component || 0) - Number(e.interest_paid || 0), 0), 0);
    const intPendingPct = (intEarned + intPending) > 0 ? (intPending / (intEarned + intPending) * 100).toFixed(0) : "0";

    const intMTD = emis.filter(e => e.paid_date && new Date(e.paid_date).getMonth() === cm && new Date(e.paid_date).getFullYear() === cy)
      .reduce((s, e) => s + Number(e.interest_paid || 0), 0);

    const monthly: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const month = format(subMonths(now, i), "MMM yy");
      const me = emis.filter(e => e.paid_date && format(new Date(e.paid_date), "MMM yy") === month);
      monthly.push({
        month,
        interest: me.reduce((s, e) => s + Number(e.interest_paid || 0), 0),
        principal: me.reduce((s, e) => s + Number(e.principal_paid || 0), 0),
      });
    }

    return { intEarned, principalRecovered, intPending, intPendingPct, intMTD, monthly };
  }, [emis]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Interest & Principal Breakdown</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ReportKPICard title="Interest Earned" value={m.intEarned} icon={TrendingUp} color="text-chart-2" isCurrency secondary={`MTD: ${formatCurrency(m.intMTD)}`} />
        <ReportKPICard title="Principal Recovered" value={m.principalRecovered} icon={DollarSign} color="text-chart-1" isCurrency />
        <ReportKPICard title="Interest Pending" value={m.intPending} icon={Wallet} color="text-chart-3" isCurrency secondary={`${m.intPendingPct}% pending`} />
      </div>
      <Card className="border border-border bg-card rounded-xl">
        <CardHeader><CardTitle className="text-base">Interest vs Principal Recovery</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={m.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={TT} />
              <Legend />
              <Bar dataKey="interest" name="Interest" fill={COLORS[2]} stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="principal" name="Principal" fill={COLORS[0]} stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
