import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Users, Receipt, TrendingUp, DollarSign, ShoppingCart, Package, AlertTriangle, CreditCard, Clock, CheckCircle, XCircle, Wallet, FileText, Bell, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { formatCurrency, formatIndianNumber, calculateProfit } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";

const COLORS = ['hsl(221, 83%, 53%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(262, 83%, 58%)', 'hsl(339, 90%, 51%)'];

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    vehiclesInStock: 0,
    vehiclesSold: 0,
    vehiclesReserved: 0,
    totalCustomers: 0,
    activeCustomers: 0,
    totalVendors: 0,
    activeVendors: 0,
    pendingPayments: 0,
    monthlySales: 0,
    monthlyPurchases: 0,
    totalRevenue: 0,
    overdueEMIs: 0,
    pendingEMIs: 0,
    totalProfit: 0,
    totalSalesCount: 0,
    avgSaleValue: 0,
    totalExpenses: 0,
  });
  const [vehiclesByType, setVehiclesByType] = useState<any[]>([]);
  const [vehiclesByStatus, setVehiclesByStatus] = useState<any[]>([]);
  const [salesTrend, setSalesTrend] = useState<any[]>([]);
  const [revenueByMonth, setRevenueByMonth] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cashFlowData, setCashFlowData] = useState<any[]>([]);
  const [inventoryValueData, setInventoryValueData] = useState<any[]>([]);
const [salesFunnelData, setSalesFunnelData] = useState<any[]>([]);



  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Get current user for explicit filtering
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [vehiclesRes, customersRes, vendorsRes, salesRes, purchasesRes, emisRes, paymentsRes, expensesRes, docsRes, leadsRes] = await Promise.all([
        supabase.from("vehicles").select("*").eq("user_id", user.id),
        supabase.from("customers").select("*").eq("user_id", user.id),
        supabase.from("vendors").select("*").eq("user_id", user.id),
        supabase.from("sales").select("*").eq("user_id", user.id),
        supabase.from("vehicle_purchases").select("*").eq("user_id", user.id),
        supabase.from("emi_schedules").select("*").eq("user_id", user.id),
        supabase.from("payments").select("*").eq("user_id", user.id),
        supabase.from("expenses").select("*").eq("user_id", user.id),
        supabase.from("documents").select("*").eq("user_id", user.id),
        supabase.from("leads").select("*").eq("user_id", user.id),
      ]);

      const vehicles = vehiclesRes.data || [];
      const customers = customersRes.data || [];
      const vendors = vendorsRes.data || [];
      const sales = salesRes.data || [];
      const purchases = purchasesRes.data || [];
      const emis = emisRes.data || [];
      const expenses = expensesRes.data || [];
      const docs = docsRes.data || [];
      const payments = paymentsRes.data || [];
      const leads = leadsRes.data || [];



      const inStock = vehicles.filter(v => v.status === 'in_stock').length;
      const sold = vehicles.filter(v => v.status === 'sold').length;
      const reserved = vehicles.filter(v => v.status === 'reserved').length;
      
      // Only count pending payments from COMPLETED sales
      const completedSales = sales.filter(s => s.status === 'completed');
      const totalSalesValue = completedSales.reduce(
  (sum, s) => sum + Number(s.total_amount || 0),
  0
);

const totalCollected = payments
  .filter(p => p.payment_type === "customer_payment")
  .reduce((sum, p) => sum + Number(p.amount || 0), 0);

const pendingPayments = totalSalesValue - totalCollected;


      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Only count COMPLETED sales for monthly stats
      const monthlyCollections = payments
  .filter(p =>
    p.payment_type === "customer_payment" &&
    new Date(p.created_at).getMonth() === currentMonth &&
    new Date(p.created_at).getFullYear() === currentYear
  )
  .reduce((sum, p) => sum + Number(p.amount || 0), 0);

const monthlyPurchases = payments
  .filter(p =>
    p.payment_type === "vendor_payment" &&
    new Date(p.created_at).getMonth() === currentMonth &&
    new Date(p.created_at).getFullYear() === currentYear
  )
  .reduce((sum, p) => sum + Number(p.amount || 0), 0);


      // Only count COMPLETED sales for revenue
      // ✅ REAL REVENUE = money actually collected from customers
const totalRevenue = payments
  .filter(p => p.payment_type === "customer_payment")
  .reduce((sum, p) => sum + Number(p.amount || 0), 0);

// ✅ REAL COST = money actually paid to vendors
const totalCost = payments
  .filter(p => p.payment_type === "vendor_payment")
  .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const totalDiscount = completedSales.reduce((sum, s) => sum + Number(s.discount || 0), 0);
      const totalExpenses = expenses.reduce(
  (sum, e) => sum + Number(e.amount || 0),
  0
);

const totalProfit = totalRevenue - totalCost - totalExpenses;

      const avgSaleValue = completedSales.length > 0
  ? totalSalesValue / completedSales.length
  : 0;


      const overdueEMIs = emis.filter(e => e.status === 'overdue' || (e.status === 'pending' && new Date(e.due_date) < now)).length;
      const pendingEMIs = emis.filter(e => e.status === 'pending').length;

      // -------- CASH FLOW TREND (Last 6 months) --------
const cashFlowMap: Record<string, { inflow: number; outflow: number }> = {};

for (let i = 5; i >= 0; i--) {
  const date = subMonths(now, i);
  const key = format(date, "MMM yyyy")
  cashFlowMap[key] = { inflow: 0, outflow: 0 };
}

payments.forEach(p => {
  const month = format(new Date(p.created_at), "MMM yyyy");
  if (!cashFlowMap[month]) return;

  if (p.payment_type === "customer_payment") {
    cashFlowMap[month].inflow += Number(p.amount || 0);
  }

  if (p.payment_type === "vendor_payment") {
    cashFlowMap[month].outflow += Number(p.amount || 0);
  }
});

setCashFlowData(
  Object.entries(cashFlowMap)
    .map(([month, data]) => ({ month, ...data }))
    .sort(
      (a, b) =>
        new Date(a.month).getTime() - new Date(b.month).getTime()
    )
);



      // Generate alerts
      const alertsList = [];
      if (overdueEMIs > 0) {
        alertsList.push({ type: 'error', message: `${overdueEMIs} EMI payments are overdue` });
      }
      if (pendingPayments > 100000) {
        alertsList.push({ type: 'warning', message: `Pending payments: ${formatCurrency(pendingPayments)}` });
      }
      const expiringDocs = docs.filter(d => {
        if (!d.expiry_date) return false;
        const expiry = new Date(d.expiry_date);
        const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
      });
      if (expiringDocs.length > 0) {
        alertsList.push({ type: 'info', message: `${expiringDocs.length} documents expiring soon` });
      }
      if (inStock === 0) {
        alertsList.push({ type: 'warning', message: 'No vehicles in stock!' });
      }
      setAlerts(alertsList);

      setStats({
        totalVehicles: vehicles.length,
        vehiclesInStock: inStock,
        vehiclesSold: sold,
        vehiclesReserved: reserved,
        totalCustomers: customers.length,
        activeCustomers: customers.filter(c => c.is_active).length,
        totalVendors: vendors.length,
        activeVendors: vendors.filter(v => v.is_active).length,
        pendingPayments,
        monthlySales: monthlyCollections,
        monthlyPurchases,
        totalRevenue,
        overdueEMIs,
        pendingEMIs,
        totalProfit,
        totalSalesCount: completedSales.length,
        avgSaleValue,
        totalExpenses,
      });

      // Vehicles by type
      const typeCount = vehicles.reduce((acc: any, v) => {
        acc[v.vehicle_type] = (acc[v.vehicle_type] || 0) + 1;
        return acc;
      }, {});
      setVehiclesByType(Object.entries(typeCount).map(([name, value]) => ({ 
        name: name.charAt(0).toUpperCase() + name.slice(1), 
        value 
      })));

      // -------- INVENTORY VALUE DISTRIBUTION --------
const inventoryValueMap = {
  in_stock: 0,
  sold: 0,
  reserved: 0,
};

vehicles.forEach(v => {
  const price = Number(v.purchase_price || 0);

  if (v.status === "in_stock") inventoryValueMap.in_stock += price;
  if (v.status === "sold") inventoryValueMap.sold += price;
  if (v.status === "reserved") inventoryValueMap.reserved += price;
});

setInventoryValueData([
  { name: "In Stock", value: inventoryValueMap.in_stock, color: COLORS[1] },
  { name: "Sold", value: inventoryValueMap.sold, color: COLORS[0] },
  { name: "Reserved", value: inventoryValueMap.reserved, color: COLORS[2] },
]);



      // Vehicles by status
      setVehiclesByStatus([
        { name: 'In Stock', value: inStock, color: COLORS[1] },
        { name: 'Sold', value: sold, color: COLORS[0] },
        { name: 'Reserved', value: reserved, color: COLORS[2] },
      ].filter(s => s.value > 0));

      // Sales trend - last 6 months
      const monthlyData: Record<string, { sales: number; revenue: number; purchases: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(now, i);
        const monthKey = format(date, 'MMM');
        monthlyData[monthKey] = { sales: 0, revenue: 0, purchases: 0 };
      }

      // Only include COMPLETED sales in trend
      completedSales.forEach((s) => {
  const month = format(new Date(s.sale_date), 'MMM');
  if (monthlyData[month]) {
    monthlyData[month].sales += 1;
  }
});

payments
  .filter(p => p.payment_type === "customer_payment")
  .forEach(p => {
    const month = format(new Date(p.created_at), "MMM");
    if (monthlyData[month]) {
      monthlyData[month].revenue += Number(p.amount || 0);
    }
  });


      purchases.forEach((p) => {
        const month = format(new Date(p.purchase_date), 'MMM');
        if (monthlyData[month]) {
          monthlyData[month].purchases += Number(p.purchase_price);
        }
      });

      // -------- SALES CONVERSION FUNNEL --------
const totalLeads = leads.length;

const qualifiedLeads = leads.filter(
  l => l.status === "qualified"
).length;

const soldCount = leads.filter(
  l => l.status === "won"
).length;

const lostCount = leads.filter(
  l => l.status === "lost"
).length;


// Normalize widths (relative to LEADS)
const funnelData = [
  {
    name: "Leads",
    count: totalLeads,
    percent: 100,
    color: COLORS[0],
  },
  {
    name: "Qualified",
    count: qualifiedLeads,
    percent:
      totalLeads > 0
        ? Math.round((qualifiedLeads / totalLeads) * 100)
        : 0,
    color: COLORS[1],
  },
  {
    name: "Sold",
    count: soldCount,
    percent:
      qualifiedLeads > 0
        ? Math.round((soldCount / qualifiedLeads) * 100)
        : 0,
    color: COLORS[2],
  },
  {
    name: "Lost",
    count: lostCount,
    percent:
      qualifiedLeads > 0
        ? Math.round((lostCount / qualifiedLeads) * 100)
        : 0,
    color: COLORS[4],
  },
];

setSalesFunnelData(funnelData);





      setSalesTrend(Object.entries(monthlyData).map(([month, data]) => ({ month, ...data })));
      setRevenueByMonth(Object.entries(monthlyData).map(([month, data]) => ({ 
        month, 
        revenue: data.revenue,
        cost: data.purchases,
        profit: data.revenue - data.purchases,
      })));

      // Recent sales - only completed
      const recentSalesData = completedSales
        .sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime())
        .slice(0, 5)
        .map(s => {
          const vehicle = vehicles.find(v => v.id === s.vehicle_id);
          const customer = customers.find(c => c.id === s.customer_id);
          return {
            ...s,
            vehicleName: vehicle ? `${vehicle.brand} ${vehicle.model}` : '-',
            customerName: customer?.full_name || '-',
          };
        });
      setRecentSales(recentSalesData);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: "Total Vehicles", value: formatIndianNumber(stats.totalVehicles), icon: Car, color: "text-chart-1" },
    { title: "In Stock", value: formatIndianNumber(stats.vehiclesInStock), icon: Package, color: "text-chart-2" },
    { title: "Sold", value: formatIndianNumber(stats.vehiclesSold), icon: CheckCircle, color: "text-chart-3" },
    { title: "Reserved", value: formatIndianNumber(stats.vehiclesReserved), icon: Clock, color: "text-chart-4" },
    { title: "Customers", value: formatIndianNumber(stats.totalCustomers), icon: Users, color: "text-chart-5" },
    { title: "Vendors", value: formatIndianNumber(stats.totalVendors), icon: ShoppingCart, color: "text-chart-1" },
    { title: "Monthly Sales", value: formatCurrency(stats.monthlySales), icon: TrendingUp, color: "text-chart-2" },
    { title: "Monthly Purchases", value: formatCurrency(stats.monthlyPurchases), icon: Receipt, color: "text-chart-3" },
    { title: "Pending Payments", value: formatCurrency(stats.pendingPayments), icon: Wallet, color: "text-chart-4" },
    { title: "Overdue EMIs", value: formatIndianNumber(stats.overdueEMIs), icon: AlertTriangle, color: "text-destructive" },
    { title: "Total Revenue", value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: "text-chart-2" },
    { title: "Total Profit", value: formatCurrency(stats.totalProfit), icon: TrendingUp, color: stats.totalProfit >= 0 ? "text-chart-2" : "text-destructive" },
    { title: "Total Sales", value: formatIndianNumber(stats.totalSalesCount), icon: FileText, color: "text-chart-1" },
    { title: "Avg Sale Value", value: formatCurrency(stats.avgSaleValue), icon: Activity, color: "text-chart-4" },
    { title: "Total Expenses", value: formatCurrency(stats.totalExpenses), icon: CreditCard, color: "text-chart-5" },
    { title: "Pending EMIs", value: formatIndianNumber(stats.pendingEMIs), icon: CreditCard, color: "text-chart-3" },
  ];

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to VahanHub</p>
        </div>
        
        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {alerts.map((alert, i) => (
              <Badge 
                key={i} 
                variant="outline"
                className={`gap-1 ${
                  alert.type === 'error' ? 'border-destructive text-destructive' : 
                  alert.type === 'warning' ? 'border-chart-3 text-chart-3' : 
                  'border-chart-1 text-chart-1'
                }`}
              >
                <Bell className="h-3 w-3" />
                {alert.message}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {statCards.slice(0, 8).map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer border border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-lg font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Second Row of KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {statCards.slice(8).map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer border border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-lg font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Cash Flow Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={cashFlowData}>
  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />

  <XAxis
    dataKey="month"
    stroke="hsl(var(--muted-foreground))"
  />

  <YAxis
    stroke="hsl(var(--muted-foreground))"
    tickFormatter={(v) => `₹${formatIndianNumber(v / 1000)}K`}
  />

  <Tooltip
    formatter={(value: number) => formatCurrency(value)}
    contentStyle={{
      backgroundColor: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '8px',
    }}
  />

  <Legend />

  <Area
    type="monotone"
    dataKey="inflow"
    name="Cash In"
    stroke="hsl(142,71%,45%)"
    fill="hsl(142,71%,45%)"
    fillOpacity={0.35}
  />

  <Area
    type="monotone"
    dataKey="outflow"
    name="Cash Out"
    stroke="hsl(339,90%,51%)"
    fill="hsl(339,90%,51%)"
    fillOpacity={0.35}
  />
</AreaChart>


            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
  <CardHeader>
    <CardTitle className="text-foreground">
      Inventory Value Distribution
    </CardTitle>
  </CardHeader>

  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={inventoryValueData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={85}
          dataKey="value"
        >
          {inventoryValueData.map((e, i) => (
            <Cell key={i} fill={e.color} />
          ))}
        </Pie>

        <Tooltip
          formatter={(v: number) => formatCurrency(v)}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />

        <Legend
          verticalAlign="bottom"
          iconType="circle"
          formatter={(value) => (
            <span className="text-sm text-muted-foreground">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  </CardContent>
</Card>


      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Monthly Sales Count</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="sales" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} name="Sales" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
  <CardHeader>
    <CardTitle className="text-foreground">Sales Conversion Funnel</CardTitle>
  </CardHeader>

  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
  layout="vertical"
  data={salesFunnelData}
  barSize={28}
>

        <CartesianGrid
          strokeDasharray="3 3"
          horizontal={true}
          vertical={false}
          stroke="hsl(var(--border))"
        />

        <XAxis type="number" hide />

        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{
            fontSize: 12,
            fill: 'hsl(var(--muted-foreground))',
          }}
          axisLine={false}
          tickLine={false}
        />

        <Tooltip
  formatter={(value: number, _, props) => {
    const { count } = props.payload;
    return [`${value}% (${count})`, "Conversion"];
  }}
/>




        <Bar dataKey="percent" radius={[0, 6, 6, 0]}>
  {salesFunnelData.map((entry, i) => (
    <Cell key={i} fill={entry.color} />
  ))}
</Bar>

      </BarChart>
    </ResponsiveContainer>
  </CardContent>
</Card>


      </div>

      {/* Profit Trend Chart */}
      

      {/* Recent Sales */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          {recentSales.length > 0 ? (
            <div className="space-y-4">
              {recentSales.map((sale, index) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-chart-1/20 flex items-center justify-center">
                      <Car className="h-5 w-5 text-chart-1" />
                    </div>
                    <div>
                      <p className="font-medium">{sale.vehicleName}</p>
                      <p className="text-sm text-muted-foreground">{sale.customerName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(sale.total_amount)}</p>
                    <p className="text-sm text-muted-foreground">{format(new Date(sale.sale_date), 'dd MMM')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No recent sales</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
