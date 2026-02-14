import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Car, Users, TrendingUp, DollarSign, ShoppingCart, Package, 
  CreditCard, Wallet, ChevronDown, ChevronUp
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend } from "recharts";
import { format, subMonths, startOfDay, endOfDay } from "date-fns";
import { formatCurrency, formatIndianNumber } from "@/lib/formatters";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import {
  UpcomingFollowUpsWidget,
  RecentLeadsWidget,
  PerformingVehicleWidget,
  QuickOverviewWidget,
  OutstandingPaymentsWidget,
} from "@/components/dashboard/DashboardWidgets";

const COLORS = ['hsl(221, 83%, 53%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(262, 83%, 58%)', 'hsl(339, 90%, 51%)'];

const Dashboard = () => {
  const [showAllCards, setShowAllCards] = useState(false);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    vehiclesInStock: 0,
    vehiclesSold: 0,
    vehiclesReserved: 0,
    totalCustomers: 0,
    totalVendors: 0,
    pendingPayments: 0,
    monthlySales: 0,
    totalRevenue: 0,
    totalProfit: 0,
    totalSalesCount: 0,
    avgSaleValue: 0,
    totalExpenses: 0,
    pendingEMIs: 0,
  });
  const [cashFlowData, setCashFlowData] = useState<any[]>([]);
  const [inventoryValueData, setInventoryValueData] = useState<any[]>([]);
  const [salesFunnelData, setSalesFunnelData] = useState<any[]>([]);
  const [upcomingFollowUps, setUpcomingFollowUps] = useState<any[]>([]);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [topMarketplaceVehicle, setTopMarketplaceVehicle] = useState<any>(null);
  const [topCatalogueVehicle, setTopCatalogueVehicle] = useState<any>(null);
  const [quickOverview, setQuickOverview] = useState({
    marketplace_views: 0,
    marketplace_enquiries: 0,
    catalogue_views: 0,
    catalogue_enquiries: 0,
  });
  const [outstandingPayments, setOutstandingPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [vehiclesRes, customersRes, vendorsRes, salesRes, purchasesRes, emisRes, paymentsRes, expensesRes, leadsRes, imagesRes, eventsRes] = await Promise.all([
        supabase.from("vehicles").select("*").eq("user_id", user.id),
        supabase.from("customers").select("*").eq("user_id", user.id),
        supabase.from("vendors").select("*").eq("user_id", user.id),
        supabase.from("sales").select("*").eq("user_id", user.id),
        supabase.from("vehicle_purchases").select("*").eq("user_id", user.id),
        supabase.from("emi_schedules").select("*").eq("user_id", user.id),
        supabase.from("payments").select("*").eq("user_id", user.id),
        supabase.from("expenses").select("*").eq("user_id", user.id),
        supabase.from("leads").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("vehicle_images").select("*").eq("user_id", user.id),
        supabase.from("public_page_events").select("*").eq("dealer_user_id", user.id),
      ]);

      const vehicles = vehiclesRes.data || [];
      const customers = customersRes.data || [];
      const vendors = vendorsRes.data || [];
      const sales = salesRes.data || [];
      const emis = emisRes.data || [];
      const expenses = expensesRes.data || [];
      const payments = paymentsRes.data || [];
      const leads = leadsRes.data || [];
      const images = imagesRes.data || [];
      const events = eventsRes.data || [];

      const inStock = vehicles.filter(v => v.status === 'in_stock').length;
      const sold = vehicles.filter(v => v.status === 'sold').length;
      const reserved = vehicles.filter(v => v.status === 'reserved').length;
      
      const completedSales = sales.filter(s => s.status === 'completed');
      const totalSalesValue = completedSales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
      const totalCollected = payments.filter(p => p.payment_type === "customer_payment").reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const pendingPayments = totalSalesValue - totalCollected;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthlyCollections = payments
        .filter(p =>
          p.payment_type === "customer_payment" &&
          new Date(p.created_at).getMonth() === currentMonth &&
          new Date(p.created_at).getFullYear() === currentYear
        )
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      const totalRevenue = payments.filter(p => p.payment_type === "customer_payment").reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const totalCost = payments.filter(p => p.payment_type === "vendor_payment").reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const totalProfit = totalRevenue - totalCost - totalExpenses;

      const avgSaleValue = completedSales.length > 0 ? totalSalesValue / completedSales.length : 0;
      const pendingEMIs = emis.filter(e => e.status === 'pending').length;

      // Cash Flow Trend
      const cashFlowMap: Record<string, { inflow: number; outflow: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(now, i);
        const key = format(date, "MMM yyyy");
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

      setCashFlowData(Object.entries(cashFlowMap).map(([month, data]) => ({ month, ...data })));

      // Inventory Value Distribution
      const inventoryValueMap = { in_stock: 0, sold: 0, reserved: 0 };
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

      // Sales Funnel
      const totalLeads = leads.length;
      const qualifiedLeads = leads.filter(l => l.status === "qualified").length;
      const soldCount = leads.filter(l => l.status === "won").length;
      const lostCount = leads.filter(l => l.status === "lost").length;

      setSalesFunnelData([
        { name: "Leads", count: totalLeads, percent: 100, color: COLORS[0] },
        { name: "Qualified", count: qualifiedLeads, percent: totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0, color: COLORS[1] },
        { name: "Sold", count: soldCount, percent: qualifiedLeads > 0 ? Math.round((soldCount / qualifiedLeads) * 100) : 0, color: COLORS[2] },
        { name: "Lost", count: lostCount, percent: qualifiedLeads > 0 ? Math.round((lostCount / qualifiedLeads) * 100) : 0, color: COLORS[4] },
      ]);

      // Upcoming Follow-ups
      const upcomingFU = leads
        .filter(l => l.follow_up_date && new Date(l.follow_up_date) >= now)
        .sort((a, b) => new Date(a.follow_up_date!).getTime() - new Date(b.follow_up_date!).getTime())
        .slice(0, 5);
      setUpcomingFollowUps(upcomingFU);

      // Recent Leads
      setRecentLeads(leads.slice(0, 5));

      // Today's Overview
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      
      const todayEvents = events.filter(e => {
        const eventDate = new Date(e.created_at);
        return eventDate >= todayStart && eventDate <= todayEnd;
      });

      // Separate marketplace vs catalogue events
      const marketplaceEvents = todayEvents.filter(e => e.public_page_id === 'marketplace');
      const catalogueEvents = todayEvents.filter(e => e.public_page_id !== 'marketplace');

      const marketplaceViews = marketplaceEvents.filter(e => e.event_type === 'vehicle_view' || e.event_type === 'dealer_view').length;
      const marketplaceEnquiries = marketplaceEvents.filter(e => e.event_type === 'enquiry_submit').length;
      const catalogueViews = catalogueEvents.filter(e => e.event_type === 'page_view' || e.event_type === 'vehicle_view').length;
      const catalogueEnquiries = catalogueEvents.filter(e => e.event_type === 'enquiry' || e.event_type === 'enquiry_submit').length;

      setQuickOverview({
        marketplace_views: marketplaceViews,
        marketplace_enquiries: marketplaceEnquiries,
        catalogue_views: catalogueViews,
        catalogue_enquiries: catalogueEnquiries,
      });

      // Top Performing Vehicles - separate marketplace and catalogue
      const vehicleViewCounts: Record<string, { views: number; enquiries: number; isMarketplace: boolean }> = {};
      events.forEach(e => {
        if (!e.vehicle_id) return;
        const isMarketplace = e.public_page_id === 'marketplace';
        const key = `${e.vehicle_id}_${isMarketplace ? 'mp' : 'cat'}`;
        if (!vehicleViewCounts[key]) {
          vehicleViewCounts[key] = { views: 0, enquiries: 0, isMarketplace };
        }
        if (e.event_type.includes('view')) {
          vehicleViewCounts[key].views++;
        }
        if (e.event_type.includes('enquiry')) {
          vehicleViewCounts[key].enquiries++;
        }
      });

      // Top marketplace vehicle
      const marketplaceSorted = Object.entries(vehicleViewCounts)
        .filter(([, v]) => v.isMarketplace)
        .sort(([, a], [, b]) => (b.views + b.enquiries) - (a.views + a.enquiries));

      if (marketplaceSorted.length > 0) {
        const topVehicleId = marketplaceSorted[0][0].split('_')[0];
        const topVehicle = vehicles.find(v => v.id === topVehicleId);
        const vehicleImage = images.find(i => i.vehicle_id === topVehicleId);
        if (topVehicle) {
          setTopMarketplaceVehicle({
            id: topVehicle.id,
            brand: topVehicle.brand,
            model: topVehicle.model,
            image_url: vehicleImage?.image_url,
            views: vehicleViewCounts[`${topVehicleId}_mp`]?.views || 0,
            enquiries: vehicleViewCounts[`${topVehicleId}_mp`]?.enquiries || 0,
            selling_price: topVehicle.selling_price,
          });
        }
      }

      // Top catalogue vehicle
      const catalogueSorted = Object.entries(vehicleViewCounts)
        .filter(([, v]) => !v.isMarketplace)
        .sort(([, a], [, b]) => (b.views + b.enquiries) - (a.views + a.enquiries));

      if (catalogueSorted.length > 0) {
        const topVehicleId = catalogueSorted[0][0].split('_')[0];
        const topVehicle = vehicles.find(v => v.id === topVehicleId);
        const vehicleImage = images.find(i => i.vehicle_id === topVehicleId);
        if (topVehicle) {
          setTopCatalogueVehicle({
            id: topVehicle.id,
            brand: topVehicle.brand,
            model: topVehicle.model,
            image_url: vehicleImage?.image_url,
            views: vehicleViewCounts[`${topVehicleId}_cat`]?.views || 0,
            enquiries: vehicleViewCounts[`${topVehicleId}_cat`]?.enquiries || 0,
            selling_price: topVehicle.selling_price,
          });
        }
      }

      // Outstanding Payments
      const outstandingList = completedSales
        .filter(s => s.balance_amount > 0)
        .map(s => {
          const customer = customers.find(c => c.id === s.customer_id);
          const vehicle = vehicles.find(v => v.id === s.vehicle_id);
          return {
            id: s.id,
            customer_name: customer?.full_name || 'Unknown',
            vehicle_name: vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Unknown',
            amount: s.balance_amount,
          };
        })
        .slice(0, 5);
      setOutstandingPayments(outstandingList);

      setStats({
        totalVehicles: vehicles.length,
        vehiclesInStock: inStock,
        vehiclesSold: sold,
        vehiclesReserved: reserved,
        totalCustomers: customers.length,
        totalVendors: vendors.length,
        pendingPayments,
        monthlySales: monthlyCollections,
        totalRevenue,
        totalProfit,
        totalSalesCount: completedSales.length,
        avgSaleValue,
        totalExpenses,
        pendingEMIs,
      });

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const primaryCards = [
    { title: "Total Vehicles", value: formatIndianNumber(stats.totalVehicles), icon: Car, color: "text-chart-1" },
    { title: "In Stock", value: formatIndianNumber(stats.vehiclesInStock), icon: Package, color: "text-chart-2" },
    { title: "Vehicles Sold", value: formatIndianNumber(stats.vehiclesSold), icon: TrendingUp, color: "text-chart-3" },
    { title: "Total Revenue", value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: "text-chart-2" },
    { title: "Total Profit", value: formatCurrency(stats.totalProfit), icon: TrendingUp, color: stats.totalProfit >= 0 ? "text-chart-2" : "text-destructive" },
    { title: "Pending Payments", value: formatCurrency(stats.pendingPayments), icon: Wallet, color: "text-chart-4" },
  ];

  const secondaryCards = [
    { title: "Reserved", value: formatIndianNumber(stats.vehiclesReserved), icon: Package, color: "text-chart-4" },
    { title: "Customers", value: formatIndianNumber(stats.totalCustomers), icon: Users, color: "text-chart-5" },
    { title: "Vendors", value: formatIndianNumber(stats.totalVendors), icon: ShoppingCart, color: "text-chart-1" },
    { title: "Monthly Sales", value: formatCurrency(stats.monthlySales), icon: TrendingUp, color: "text-chart-2" },
    { title: "Avg Sale Value", value: formatCurrency(stats.avgSaleValue), icon: DollarSign, color: "text-chart-4" },
    { title: "Total Expenses", value: formatCurrency(stats.totalExpenses), icon: CreditCard, color: "text-chart-5" },
    { title: "Pending EMIs", value: formatIndianNumber(stats.pendingEMIs), icon: CreditCard, color: "text-chart-3" },
    { title: "Total Sales", value: formatIndianNumber(stats.totalSalesCount), icon: TrendingUp, color: "text-chart-1" },
  ];

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome to VahanHub</p>
      </div>

      {/* Primary KPI Cards - Always Visible */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {primaryCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer border border-border bg-card rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3 px-3 sm:px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 shrink-0 ${stat.color}`} />
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3">
              <div className="text-base sm:text-lg font-bold text-foreground truncate">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expandable Secondary Cards */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAllCards(!showAllCards)}
          className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
        >
          {showAllCards ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Show More Stats
            </>
          )}
        </Button>
        
        {showAllCards && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-4 animate-fade-in">
            {secondaryCards.map((stat, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer border border-border bg-card rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3 px-3">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">{stat.title}</CardTitle>
                  <stat.icon className={`h-3 w-3 shrink-0 ${stat.color}`} />
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="text-sm font-bold text-foreground truncate">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Zoho-style Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <UpcomingFollowUpsWidget followUps={upcomingFollowUps} />
        <RecentLeadsWidget leads={recentLeads} />
        <QuickOverviewWidget overview={quickOverview} />
        <PerformingVehicleWidget vehicle={topMarketplaceVehicle} type="marketplace" />
        <PerformingVehicleWidget vehicle={topCatalogueVehicle} type="catalogue" />
        <OutstandingPaymentsWidget payments={outstandingPayments} pendingAmount={stats.pendingPayments} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2 border border-border bg-card rounded-xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Cash Flow Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${formatIndianNumber(v / 1000)}K`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="inflow" name="Cash In" stroke="hsl(142,71%,45%)" fill="hsl(142,71%,45%)" fillOpacity={0.35} />
                <Area type="monotone" dataKey="outflow" name="Cash Out" stroke="hsl(339,90%,51%)" fill="hsl(339,90%,51%)" fillOpacity={0.35} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card rounded-xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={inventoryValueData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
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
                    borderRadius: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-xs text-muted-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Chart */}
      <Card className="border border-border bg-card rounded-xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Sales Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart layout="vertical" data={salesFunnelData} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={80}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
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
  );
};

export default Dashboard;
