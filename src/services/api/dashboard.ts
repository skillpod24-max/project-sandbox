import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { subMonths, format, startOfDay, endOfDay } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardSummary {
  total_vehicles: number;
  vehicles_in_stock: number;
  vehicles_sold: number;
  vehicles_reserved: number;
  total_customers: number;
  total_vendors: number;
  total_sales_count: number;
  total_sales_value: number;
  total_revenue: number;
  total_cost: number;
  total_expenses: number;
  pending_emis: number;
  monthly_collections: number;
  inventory_value: { in_stock: number; sold: number; reserved: number };
  lead_counts: { total: number; qualified: number; won: number; lost: number };
  outstanding_balance: number;
}

const fetchDashboardSummary = async (userId: string): Promise<DashboardSummary> => {
  const { data, error } = await supabase.rpc("dashboard_summary", { p_user_id: userId });
  if (error) throw error;
  return data as unknown as DashboardSummary;
};

const fetchDashboardDetails = async (userId: string) => {
  const now = new Date();

  const [paymentsRes, leadsRes, salesRes, customersRes, vehiclesRes, imagesRes, eventsRes] = await Promise.all([
    supabase.from("payments").select("id, amount, payment_type, created_at").eq("user_id", userId),
    supabase.from("leads").select("id, customer_name, phone, vehicle_interest, status, priority, source, follow_up_date, notes, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
    supabase.from("sales").select("id, status, balance_amount, customer_id, vehicle_id").eq("user_id", userId).eq("status", "completed"),
    supabase.from("customers").select("id, full_name").eq("user_id", userId),
    supabase.from("vehicles").select("id, brand, model, selling_price").eq("user_id", userId),
    supabase.from("vehicle_images").select("vehicle_id, image_url, is_primary").eq("user_id", userId),
    supabase.from("public_page_events").select("event_type, vehicle_id, public_page_id, created_at").eq("dealer_user_id", userId),
  ]);

  const payments = paymentsRes.data || [];
  const leads = leadsRes.data || [];
  const sales = salesRes.data || [];
  const customers = customersRes.data || [];
  const vehicles = vehiclesRes.data || [];
  const images = imagesRes.data || [];
  const events = eventsRes.data || [];

  // Cash Flow Trend (6 months)
  const cashFlowMap: Record<string, { inflow: number; outflow: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const date = subMonths(now, i);
    const key = format(date, "MMM yyyy");
    cashFlowMap[key] = { inflow: 0, outflow: 0 };
  }
  payments.forEach(p => {
    const month = format(new Date(p.created_at), "MMM yyyy");
    if (!cashFlowMap[month]) return;
    if (p.payment_type === "customer_payment") cashFlowMap[month].inflow += Number(p.amount || 0);
    if (p.payment_type === "vendor_payment") cashFlowMap[month].outflow += Number(p.amount || 0);
  });
  const cashFlowData = Object.entries(cashFlowMap).map(([month, data]) => ({ month, ...data }));

  // Upcoming Follow-ups
  const upcomingFollowUps = leads
    .filter(l => l.follow_up_date && new Date(l.follow_up_date) >= now)
    .sort((a, b) => new Date(a.follow_up_date!).getTime() - new Date(b.follow_up_date!).getTime())
    .slice(0, 5);

  const recentLeads = leads.slice(0, 5);

  // Test Drives
  const testDriveLeads = leads
    .filter(l => {
      if (!l.notes) return false;
      const match = l.notes.match(/TEST DRIVE REQUESTED:\s*(\d{4}-\d{2}-\d{2})/);
      return match ? new Date(match[1]) >= now : false;
    })
    .map(l => {
      const match = l.notes!.match(/TEST DRIVE REQUESTED:\s*(\d{4}-\d{2}-\d{2})(?:\s*at\s*(.+?))?[\]\n]/);
      return { id: l.id, customer_name: l.customer_name, phone: l.phone, test_drive_date: match?.[1] || '', test_drive_time: match?.[2]?.trim() || '', vehicle_interest: l.vehicle_interest };
    })
    .sort((a, b) => new Date(a.test_drive_date).getTime() - new Date(b.test_drive_date).getTime())
    .slice(0, 5);

  // Today's overview
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const todayEvents = events.filter(e => {
    const d = new Date(e.created_at);
    return d >= todayStart && d <= todayEnd;
  });
  const mpEvents = todayEvents.filter(e => e.public_page_id === 'marketplace');
  const catEvents = todayEvents.filter(e => e.public_page_id !== 'marketplace');

  const quickOverview = {
    marketplace_views: mpEvents.filter(e => e.event_type === 'vehicle_view' || e.event_type === 'dealer_view').length,
    marketplace_enquiries: mpEvents.filter(e => e.event_type === 'enquiry_submit').length,
    catalogue_views: catEvents.filter(e => e.event_type === 'page_view' || e.event_type === 'vehicle_view').length,
    catalogue_enquiries: catEvents.filter(e => e.event_type === 'enquiry' || e.event_type === 'enquiry_submit').length,
  };

  // Top performing vehicles
  const vehicleViewCounts: Record<string, { views: number; enquiries: number; isMarketplace: boolean }> = {};
  events.forEach(e => {
    if (!e.vehicle_id) return;
    const isMP = e.public_page_id === 'marketplace';
    const key = `${e.vehicle_id}_${isMP ? 'mp' : 'cat'}`;
    if (!vehicleViewCounts[key]) vehicleViewCounts[key] = { views: 0, enquiries: 0, isMarketplace: isMP };
    if (e.event_type.includes('view')) vehicleViewCounts[key].views++;
    if (e.event_type.includes('enquiry')) vehicleViewCounts[key].enquiries++;
  });

  const getTopVehicle = (isMP: boolean) => {
    const sorted = Object.entries(vehicleViewCounts)
      .filter(([, v]) => v.isMarketplace === isMP)
      .sort(([, a], [, b]) => (b.views + b.enquiries) - (a.views + a.enquiries));
    if (!sorted.length) return null;
    const vid = sorted[0][0].split('_')[0];
    const v = vehicles.find(x => x.id === vid);
    const img = images.find(i => i.vehicle_id === vid);
    if (!v) return null;
    const suffix = isMP ? 'mp' : 'cat';
    return { id: v.id, brand: v.brand, model: v.model, image_url: img?.image_url, views: vehicleViewCounts[`${vid}_${suffix}`]?.views || 0, enquiries: vehicleViewCounts[`${vid}_${suffix}`]?.enquiries || 0, selling_price: v.selling_price };
  };

  // Outstanding payments
  const outstandingPayments = sales
    .filter(s => s.balance_amount > 0)
    .map(s => {
      const customer = customers.find(c => c.id === s.customer_id);
      const vehicle = vehicles.find(v => v.id === s.vehicle_id);
      return { id: s.id, customer_name: customer?.full_name || 'Unknown', vehicle_name: vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Unknown', amount: s.balance_amount };
    })
    .slice(0, 5);

  return {
    cashFlowData,
    upcomingFollowUps,
    recentLeads,
    upcomingTestDrives: testDriveLeads,
    topMarketplaceVehicle: getTopVehicle(true),
    topCatalogueVehicle: getTopVehicle(false),
    quickOverview,
    outstandingPayments,
  };
};

export function useDashboardData() {
  const { user } = useAuth();
  const userId = user?.id;

  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary', userId],
    queryFn: () => fetchDashboardSummary(userId!),
    enabled: !!userId,
  });

  const detailsQuery = useQuery({
    queryKey: ['dashboard-details', userId],
    queryFn: () => fetchDashboardDetails(userId!),
    enabled: !!userId,
  });

  const summary = summaryQuery.data;
  const details = detailsQuery.data;

  const stats = summary ? {
    totalVehicles: summary.total_vehicles,
    vehiclesInStock: summary.vehicles_in_stock,
    vehiclesSold: summary.vehicles_sold,
    vehiclesReserved: summary.vehicles_reserved,
    totalCustomers: summary.total_customers,
    totalVendors: summary.total_vendors,
    pendingPayments: summary.outstanding_balance,
    monthlySales: summary.monthly_collections,
    totalRevenue: summary.total_revenue,
    totalProfit: summary.total_revenue - summary.total_cost - summary.total_expenses,
    totalSalesCount: summary.total_sales_count,
    avgSaleValue: summary.total_sales_count > 0 ? summary.total_sales_value / summary.total_sales_count : 0,
    totalExpenses: summary.total_expenses,
    pendingEMIs: summary.pending_emis,
  } : {
    totalVehicles: 0, vehiclesInStock: 0, vehiclesSold: 0, vehiclesReserved: 0,
    totalCustomers: 0, totalVendors: 0, pendingPayments: 0, monthlySales: 0,
    totalRevenue: 0, totalProfit: 0, totalSalesCount: 0, avgSaleValue: 0,
    totalExpenses: 0, pendingEMIs: 0,
  };

  const COLORS = ['hsl(221, 83%, 53%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(262, 83%, 58%)', 'hsl(339, 90%, 51%)'];

  const inventoryValueData = summary ? [
    { name: "In Stock", value: summary.inventory_value.in_stock, color: COLORS[1] },
    { name: "Sold", value: summary.inventory_value.sold, color: COLORS[0] },
    { name: "Reserved", value: summary.inventory_value.reserved, color: COLORS[2] },
  ] : [];

  const salesFunnelData = summary ? [
    { name: "Leads", count: summary.lead_counts.total, percent: summary.lead_counts.total > 0 ? 100 : 0, color: COLORS[0] },
    { name: "Qualified", count: summary.lead_counts.qualified, percent: summary.lead_counts.total > 0 ? Math.round((summary.lead_counts.qualified / summary.lead_counts.total) * 100) : 0, color: COLORS[1] },
    { name: "Sold", count: summary.lead_counts.won, percent: summary.lead_counts.total > 0 ? Math.round((summary.lead_counts.won / summary.lead_counts.total) * 100) : 0, color: COLORS[2] },
    { name: "Lost", count: summary.lead_counts.lost, percent: summary.lead_counts.total > 0 ? Math.round((summary.lead_counts.lost / summary.lead_counts.total) * 100) : 0, color: COLORS[4] },
  ] : [];

  return {
    isLoading: summaryQuery.isLoading || detailsQuery.isLoading,
    stats,
    inventoryValueData,
    salesFunnelData,
    cashFlowData: details?.cashFlowData ?? [],
    upcomingFollowUps: details?.upcomingFollowUps ?? [],
    recentLeads: details?.recentLeads ?? [],
    upcomingTestDrives: details?.upcomingTestDrives ?? [],
    topMarketplaceVehicle: details?.topMarketplaceVehicle ?? null,
    topCatalogueVehicle: details?.topCatalogueVehicle ?? null,
    quickOverview: details?.quickOverview ?? { marketplace_views: 0, marketplace_enquiries: 0, catalogue_views: 0, catalogue_enquiries: 0 },
    outstandingPayments: details?.outstandingPayments ?? [],
  };
}
