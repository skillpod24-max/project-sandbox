import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Car, Users, TrendingUp, DollarSign, ShoppingCart, Package, 
  CreditCard, Wallet, ChevronDown, ChevronUp
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend } from "recharts";
import { formatCurrency, formatIndianNumber } from "@/lib/formatters";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import {
  UpcomingFollowUpsWidget,
  RecentLeadsWidget,
  PerformingVehicleWidget,
  QuickOverviewWidget,
  OutstandingPaymentsWidget,
  UpcomingTestDrivesWidget,
} from "@/components/dashboard/DashboardWidgets";
import { useDashboardData } from "@/services/api";

const Dashboard = () => {
  const [showAllCards, setShowAllCards] = useState(false);

  const {
    isLoading: loading,
    stats,
    inventoryValueData,
    salesFunnelData,
    cashFlowData,
    upcomingFollowUps,
    recentLeads,
    upcomingTestDrives,
    topMarketplaceVehicle,
    topCatalogueVehicle,
    quickOverview,
    outstandingPayments,
  } = useDashboardData();

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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
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
        <Card className="lg:col-span-1 border border-border bg-card rounded-xl">
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

        {/* Test Drive Widget in charts row - third column */}
        <UpcomingTestDrivesWidget testDrives={upcomingTestDrives} />
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
