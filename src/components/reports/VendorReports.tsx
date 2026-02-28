import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportKPICard } from "./ReportKPICard";
import { ReportsData } from "@/hooks/useReportsData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { ShoppingCart, DollarSign, Wallet, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const COLORS = ["hsl(217, 91%, 60%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(262, 83%, 58%)", "hsl(339, 90%, 51%)"];
const TT = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' };

export const VendorReports = ({ data, sub }: { data: ReportsData; sub: string }) => {
  if (sub === "margin") return <PurchaseSaleMargin data={data} />;
  return <VendorSummary data={data} />;
};

const VendorSummary = ({ data }: { data: ReportsData }) => {
  const { vendors, purchases, payments } = data;

  const m = useMemo(() => {
    const activeVendors = vendors.filter(v => v.is_active).length;
    const totalPurchases = purchases.length;
    const paidToVendors = payments.filter(p => p.payment_type === "vendor_payment").reduce((s, p) => s + Number(p.amount || 0), 0);
    const outstanding = purchases.reduce((s, p) => s + Number(p.balance_amount || 0), 0);
    const pendingVendors = new Set(purchases.filter(p => Number(p.balance_amount || 0) > 0).map(p => p.vendor_id)).size;

    const paidPending = [
      { name: "Paid", value: paidToVendors, color: COLORS[1] },
      { name: "Pending", value: outstanding, color: COLORS[4] },
    ].filter(d => d.value > 0);

    const vendorPurchaseVal: Record<string, { name: string; value: number }> = {};
    purchases.forEach(p => {
      const v = vendors.find(v => v.id === p.vendor_id);
      if (!v) return;
      if (!vendorPurchaseVal[v.id]) vendorPurchaseVal[v.id] = { name: v.name, value: 0 };
      vendorPurchaseVal[v.id].value += Number(p.purchase_price || 0);
    });
    const topVendors = Object.values(vendorPurchaseVal).sort((a, b) => b.value - a.value).slice(0, 10);

    const ledger = vendors.map(v => {
      const vPurchases = purchases.filter(p => p.vendor_id === v.id);
      const totalVal = vPurchases.reduce((s, p) => s + Number(p.purchase_price || 0), 0);
      const paid = vPurchases.reduce((s, p) => s + Number(p.amount_paid || 0), 0);
      const balance = vPurchases.reduce((s, p) => s + Number(p.balance_amount || 0), 0);
      const lastPurchase = vPurchases.sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime())[0];
      const lastPayment = payments.filter(p => p.vendor_id === v.id).sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())[0];
      return {
        name: v.name, count: vPurchases.length, totalVal, paid, balance,
        lastPurchaseDate: lastPurchase?.purchase_date, lastPaymentDate: lastPayment?.payment_date,
        risk: balance > 50000 ? "Red" : balance > 0 ? "Amber" : "Green",
      };
    }).filter(v => v.count > 0).sort((a, b) => b.balance - a.balance);

    return { activeVendors, totalPurchases, paidToVendors, outstanding, pendingVendors, paidPending, topVendors, ledger };
  }, [vendors, purchases, payments]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Vendor Summary</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ReportKPICard title="Total Vendors" value={m.activeVendors} icon={ShoppingCart} color="text-chart-1" />
        <ReportKPICard title="Vehicles Purchased" value={m.totalPurchases} icon={ShoppingCart} color="text-chart-2" />
        <ReportKPICard title="Paid to Vendors" value={m.paidToVendors} icon={DollarSign} color="text-chart-2" isCurrency />
        <ReportKPICard title="Outstanding" value={m.outstanding} icon={Wallet} color="text-chart-4" isCurrency secondary={`${m.pendingVendors} vendors`} />
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
          <CardHeader><CardTitle className="text-base">Top Vendors by Purchase Value</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={m.topVendors} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" fontSize={12} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="name" fontSize={11} stroke="hsl(var(--muted-foreground))" width={100} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={TT} />
                <Bar dataKey="value" fill={COLORS[0]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card className="border border-border bg-card rounded-xl">
        <CardHeader><CardTitle className="text-base">Vendor Ledger</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Vendor</TableHead>
                <TableHead className="text-xs">Vehicles</TableHead>
                <TableHead className="text-xs text-right">Total Value</TableHead>
                <TableHead className="text-xs text-right">Paid</TableHead>
                <TableHead className="text-xs text-right">Pending</TableHead>
                <TableHead className="text-xs">Last Purchase</TableHead>
                <TableHead className="text-xs">Last Payment</TableHead>
                <TableHead className="text-xs">Risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {m.ledger.slice(0, 20).map((v, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-medium">{v.name}</TableCell>
                  <TableCell className="text-xs">{v.count}</TableCell>
                  <TableCell className="text-xs text-right">{formatCurrency(v.totalVal)}</TableCell>
                  <TableCell className="text-xs text-right">{formatCurrency(v.paid)}</TableCell>
                  <TableCell className="text-xs text-right font-medium">{formatCurrency(v.balance)}</TableCell>
                  <TableCell className="text-xs">{v.lastPurchaseDate ? format(new Date(v.lastPurchaseDate), "dd MMM yy") : "-"}</TableCell>
                  <TableCell className="text-xs">{v.lastPaymentDate ? format(new Date(v.lastPaymentDate), "dd MMM yy") : "-"}</TableCell>
                  <TableCell><span className={`inline-block h-2.5 w-2.5 rounded-full ${v.risk === "Red" ? "bg-destructive" : v.risk === "Amber" ? "bg-chart-3" : "bg-chart-2"}`} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

const PurchaseSaleMargin = ({ data }: { data: ReportsData }) => {
  const { vehicles, purchases, sales, expenses, vendors } = data;

  const m = useMemo(() => {
    const completed = sales.filter(s => s.status === "completed");
    const avgPurchase = purchases.length > 0 ? purchases.reduce((s, p) => s + Number(p.purchase_price || 0), 0) / purchases.length : 0;
    const avgSelling = completed.length > 0 ? completed.reduce((s, x) => s + Number(x.selling_price || 0), 0) / completed.length : 0;
    const avgMargin = avgSelling - avgPurchase;
    const marginPct = avgSelling > 0 ? (avgMargin / avgSelling * 100) : 0;

    const vendorMargins: Record<string, { name: string; margin: number; count: number }> = {};
    completed.forEach(s => {
      const p = purchases.find(p => p.vehicle_id === s.vehicle_id);
      if (!p) return;
      const v = vendors.find(v => v.id === p.vendor_id);
      if (!v) return;
      if (!vendorMargins[v.id]) vendorMargins[v.id] = { name: v.name, margin: 0, count: 0 };
      vendorMargins[v.id].margin += Number(s.selling_price || 0) - Number(p.purchase_price || 0);
      vendorMargins[v.id].count++;
    });
    const bestVendor = Object.values(vendorMargins).sort((a, b) => (b.margin / b.count) - (a.margin / a.count))[0];

    const vehicleMargins = completed.map(s => {
      const v = vehicles.find(v => v.id === s.vehicle_id);
      const p = purchases.find(p => p.vehicle_id === s.vehicle_id);
      if (!v || !p) return null;
      const vExpenses = expenses.filter(e => e.vehicle_id === v.id).reduce((s, e) => s + Number(e.amount || 0), 0);
      const margin = Number(s.selling_price || 0) - Number(p.purchase_price || 0) - vExpenses;
      return { name: `${v.brand} ${v.model}`, purchase: Number(p.purchase_price || 0), selling: Number(s.selling_price || 0), expenses: vExpenses, margin, marginPct: Number(s.selling_price || 0) > 0 ? (margin / Number(s.selling_price || 0) * 100) : 0 };
    }).filter(Boolean) as any[];

    return { avgPurchase, avgSelling, avgMargin, marginPct, bestVendor, vehicleMargins: vehicleMargins.sort((a, b) => b.margin - a.margin) };
  }, [vehicles, purchases, sales, expenses, vendors]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Purchase vs Sale Margin</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ReportKPICard title="Avg Purchase Price" value={m.avgPurchase} icon={ShoppingCart} color="text-chart-1" isCurrency />
        <ReportKPICard title="Avg Selling Price" value={m.avgSelling} icon={DollarSign} color="text-chart-2" isCurrency />
        <ReportKPICard title="Avg Margin" value={m.avgMargin} icon={TrendingUp} color="text-chart-2" isCurrency secondary={`${m.marginPct.toFixed(1)}%`} />
        <ReportKPICard title="Best Vendor" value={m.bestVendor?.name || "N/A"} icon={ShoppingCart} color="text-chart-4" secondary={m.bestVendor ? formatCurrency(m.bestVendor.margin / m.bestVendor.count) + "/vehicle" : ""} />
      </div>
      <Card className="border border-border bg-card rounded-xl">
        <CardHeader><CardTitle className="text-base">Margin Analysis</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Vehicle</TableHead>
                <TableHead className="text-xs text-right">Purchase ₹</TableHead>
                <TableHead className="text-xs text-right">Selling ₹</TableHead>
                <TableHead className="text-xs text-right">Expenses ₹</TableHead>
                <TableHead className="text-xs text-right">Net Margin</TableHead>
                <TableHead className="text-xs text-right">Margin %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {m.vehicleMargins.slice(0, 20).map((v: any, i: number) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-medium">{v.name}</TableCell>
                  <TableCell className="text-xs text-right">{formatCurrency(v.purchase)}</TableCell>
                  <TableCell className="text-xs text-right">{formatCurrency(v.selling)}</TableCell>
                  <TableCell className="text-xs text-right">{formatCurrency(v.expenses)}</TableCell>
                  <TableCell className={`text-xs text-right font-medium ${v.margin >= 0 ? "text-chart-2" : "text-destructive"}`}>{formatCurrency(v.margin)}</TableCell>
                  <TableCell className="text-xs text-right">{v.marginPct.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
