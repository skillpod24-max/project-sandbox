import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportKPICard } from "./ReportKPICard";
import { ReportsData } from "@/hooks/useReportsData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { Users, DollarSign, TrendingUp, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const COLORS = ["hsl(217, 91%, 60%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(262, 83%, 58%)", "hsl(339, 90%, 51%)"];
const TT = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' };

export const CustomerReports = ({ data, sub }: { data: ReportsData; sub: string }) => {
  if (sub === "clv") return <CustomerLifetimeValue data={data} />;
  return <CustomerLedger data={data} />;
};

const CustomerLedger = ({ data }: { data: ReportsData }) => {
  const { customers, sales, payments, emis } = data;

  const m = useMemo(() => {
    const completed = sales.filter(s => s.status === "completed");
    const totalPaid = payments.filter(p => p.payment_type === "customer_payment" || p.payment_type === "emi_payment").reduce((s, p) => s + Number(p.amount || 0), 0);
    const totalPending = completed.reduce((s, x) => s + Math.max(Number(x.total_amount || 0) - Number(x.amount_paid || 0), 0), 0);
    const activeEmiCustomers = new Set(emis.filter(e => e.status === "pending" || e.status === "overdue").map(e => {
      const sale = sales.find(s => s.id === e.sale_id);
      return sale?.customer_id;
    }).filter(Boolean)).size;
    const overdueEmi = emis.filter(e => e.status === "overdue" || (e.status === "pending" && new Date(e.due_date) < new Date())).length;

    const emiStatusPie = [
      { name: "Active EMI", value: new Set(emis.filter(e => e.status === "pending").map(e => e.sale_id)).size, color: COLORS[0] },
      { name: "Completed", value: new Set(emis.filter(e => e.status === "paid").map(e => e.sale_id)).size - new Set(emis.filter(e => e.status === "pending").map(e => e.sale_id)).size, color: COLORS[1] },
      { name: "Overdue", value: new Set(emis.filter(e => e.status === "overdue" || (e.status === "pending" && new Date(e.due_date) < new Date())).map(e => e.sale_id)).size, color: COLORS[4] },
    ].filter(d => d.value > 0);

    const ledger = customers.map(c => {
      const custSales = completed.filter(s => s.customer_id === c.id);
      const totalSalesVal = custSales.reduce((s, x) => s + Number(x.total_amount || 0), 0);
      const totalPaidVal = custSales.reduce((s, x) => s + Number(x.amount_paid || 0), 0);
      const balance = totalSalesVal - totalPaidVal;
      const custEmis = emis.filter(e => custSales.some(s => s.id === e.sale_id));
      const hasOverdue = custEmis.some(e => e.status === "overdue" || (e.status === "pending" && new Date(e.due_date) < new Date()));
      const hasActiveEmi = custEmis.some(e => e.status === "pending");
      const lastPayment = payments.filter(p => p.customer_id === c.id).sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())[0];
      const nextEmi = custEmis.filter(e => e.status === "pending").sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];

      return {
        name: c.full_name, phone: c.phone, totalSales: totalSalesVal, totalPaid: totalPaidVal, balance,
        emiStatus: hasOverdue ? "Overdue" : hasActiveEmi ? "Active" : custEmis.length > 0 ? "Closed" : "N/A",
        lastPaymentDate: lastPayment?.payment_date, nextEmiDate: nextEmi?.due_date,
        risk: hasOverdue ? "Red" : balance > 0 ? "Amber" : "Green",
      };
    }).filter(c => c.totalSales > 0).sort((a, b) => b.balance - a.balance);

    return { totalPaid, totalPending, activeEmiCustomers, overdueEmi, emiStatusPie, ledger };
  }, [customers, sales, payments, emis]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Customer Ledger</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ReportKPICard title="Total Paid" value={m.totalPaid} icon={DollarSign} color="text-chart-2" isCurrency />
        <ReportKPICard title="Total Pending" value={m.totalPending} icon={DollarSign} color="text-chart-4" isCurrency secondary={`${m.ledger.filter(c => c.balance > 0).length} customers pending`} />
        <ReportKPICard title="Active EMI Customers" value={m.activeEmiCustomers} icon={CreditCard} color="text-chart-1" secondary={`${m.overdueEmi} overdue`} />
      </div>
      <Card className="border border-border bg-card rounded-xl">
        <CardHeader><CardTitle className="text-base">Customer Ledger</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Customer</TableHead>
                <TableHead className="text-xs">Phone</TableHead>
                <TableHead className="text-xs text-right">Total Sales</TableHead>
                <TableHead className="text-xs text-right">Paid</TableHead>
                <TableHead className="text-xs text-right">Pending</TableHead>
                <TableHead className="text-xs">EMI Status</TableHead>
                <TableHead className="text-xs">Last Payment</TableHead>
                <TableHead className="text-xs">Next EMI</TableHead>
                <TableHead className="text-xs">Risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {m.ledger.slice(0, 30).map((c, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-medium">{c.name}</TableCell>
                  <TableCell className="text-xs">{c.phone}</TableCell>
                  <TableCell className="text-xs text-right">{formatCurrency(c.totalSales)}</TableCell>
                  <TableCell className="text-xs text-right">{formatCurrency(c.totalPaid)}</TableCell>
                  <TableCell className="text-xs text-right font-medium">{formatCurrency(c.balance)}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{c.emiStatus}</Badge></TableCell>
                  <TableCell className="text-xs">{c.lastPaymentDate ? format(new Date(c.lastPaymentDate), "dd MMM yy") : "-"}</TableCell>
                  <TableCell className="text-xs">{c.nextEmiDate ? format(new Date(c.nextEmiDate), "dd MMM yy") : "-"}</TableCell>
                  <TableCell>
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${c.risk === "Red" ? "bg-destructive" : c.risk === "Amber" ? "bg-chart-3" : "bg-chart-2"}`} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

const CustomerLifetimeValue = ({ data }: { data: ReportsData }) => {
  const { customers, sales, payments } = data;

  const m = useMemo(() => {
    const completed = sales.filter(s => s.status === "completed");
    const totalRev = completed.reduce((s, x) => s + Number(x.total_amount || 0), 0);
    const uniqueCustomers = new Set(completed.map(s => s.customer_id)).size;
    const avgRevPerCustomer = uniqueCustomers > 0 ? totalRev / uniqueCustomers : 0;

    const intEarned = payments.filter(p => p.payment_type === "emi_payment").reduce((s, p) => s + Number(p.interest_amount || 0), 0);

    const customerSalesCount: Record<string, number> = {};
    completed.forEach(s => { customerSalesCount[s.customer_id] = (customerSalesCount[s.customer_id] || 0) + 1; });
    const repeatCustomers = Object.values(customerSalesCount).filter(c => c > 1).length;
    const repeatPct = uniqueCustomers > 0 ? (repeatCustomers / uniqueCustomers * 100).toFixed(1) : "0";

    const topCustomers = customers.map(c => {
      const custSales = completed.filter(s => s.customer_id === c.id);
      return { name: c.full_name, revenue: custSales.reduce((s, x) => s + Number(x.total_amount || 0), 0) };
    }).filter(c => c.revenue > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    return { avgRevPerCustomer, intEarned, repeatCustomers, repeatPct, topCustomers };
  }, [customers, sales, payments]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Customer Lifetime Value</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <ReportKPICard title="Avg Revenue/Customer" value={m.avgRevPerCustomer} icon={DollarSign} color="text-chart-1" isCurrency />
        <ReportKPICard title="EMI Interest Earned" value={m.intEarned} icon={TrendingUp} color="text-chart-2" isCurrency />
        <ReportKPICard title="Repeat Customers" value={m.repeatCustomers} icon={Users} color="text-chart-3" secondary={`${m.repeatPct}%`} />
      </div>
      <Card className="border border-border bg-card rounded-xl">
        <CardHeader><CardTitle className="text-base">Revenue per Customer (Top 10)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={m.topCustomers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" fontSize={12} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
              <YAxis type="category" dataKey="name" fontSize={11} stroke="hsl(var(--muted-foreground))" width={120} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={TT} />
              <Bar dataKey="revenue" fill={COLORS[0]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
