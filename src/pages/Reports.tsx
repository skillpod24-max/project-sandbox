import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area, ComposedChart, RadialBarChart, RadialBar, Treemap } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Car, Users, Receipt, Package, ArrowUpRight, ArrowDownRight, Target, Wallet, CreditCard, IndianRupee, ShoppingCart, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { Sector } from "recharts";
import { format, subMonths, subDays } from "date-fns";
import { formatIndianNumber } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AnalyticsSkeleton } from "@/components/ui/page-skeleton";
import {
  ROUNDING_TOLERANCE,
  getEffectiveBalance,
  isEffectivelySettled,
} from "@/lib/accounting";


const COLORS = ["hsl(217, 91%, 60%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(262, 83%, 58%)", "hsl(339, 90%, 51%)", "hsl(199, 89%, 48%)", "hsl(25, 95%, 53%)", "hsl(173, 80%, 40%)"];
const emiColorMap: Record<string, string> = {
Paid: "hsl(142, 71%, 45%)",
Pending: "hsl(262, 83%, 58%)",
Overdue: "hsl(339, 90%, 51%)",
Partial: "hsl(38, 92%, 50%)",
};

const Reports = () => {
const [salesData, setSalesData] = useState<any[]>([]);
const [vehicleData, setVehicleData] = useState<any[]>([]);
const [vehicleStatusData, setVehicleStatusData] = useState<any[]>([]);
const [paymentData, setPaymentData] = useState<any[]>([]);
const [emiData, setEmiData] = useState<any[]>([]);
const [profitData, setProfitData] = useState<any[]>([]);
const [customerData, setCustomerData] = useState<any[]>([]);
const [topVehicles, setTopVehicles] = useState<any[]>([]);
const [expenseData, setExpenseData] = useState<any[]>([]);
const [vehicleAgingData, setVehicleAgingData] = useState<any[]>([]);
const [inventoryTurnover, setInventoryTurnover] = useState({ ratio: 0, avgDays: 0 });
const [fuelTypeData, setFuelTypeData] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
// Accounting mode toggle
const [accountingMode, setAccountingMode] = useState<"simple" | "nbfc">("simple");
// NBFC view switch (visual vs accounting)
const [nbfcView, setNbfcView] = useState<"visual" | "breakdown">("visual");


// NBFC accounting tables
const [vehicleLedgers, setVehicleLedgers] = useState<any[]>([]);
const [pnlStatement, setPnlStatement] = useState<any | null>(null);
const [balanceSheet, setBalanceSheet] = useState<any | null>(null);
const [receivables, setReceivables] = useState<any[]>([]);
const [interestLedger, setInterestLedger] = useState<any[]>([]);

// 🔍 Vehicle Drilldown
const [activeVehicleLedger, setActiveVehicleLedger] = useState<any | null>(null);
const [showVehicleDrilldown, setShowVehicleDrilldown] = useState(false);



const [period, setPeriod] = useState("6months");
const [customerPaymentHealth, setCustomerPaymentHealth] = useState<
{ name: string; value: number }[]
>([]);

const [vendorPayables, setVendorPayables] = useState<
{ name: string; value: number }[]
>([]);
const [profitMode, setProfitMode] = useState<"normal" | "emi">("normal");
const [activeEmi, setActiveEmi] = useState<{
name: string;
value: number;
} | null>(null);

// Report mode
const [reportView, setReportView] = useState<"business" | "public">("business");

// Public page daily analytics
const [selectedDate, setSelectedDate] = useState(
  new Date().toISOString().split("T")[0]
);

const [dailyStats, setDailyStats] = useState({
  visitors: 0,
  views: 0,
  enquiries: 0,
  ctaClicks: 0,
  vehiclesWithEnquiry: 0,
  score: 0,
});

const [vehicleViewData, setVehicleViewData] = useState<
  { name: string; value: number }[]
>([]);

const [vehicleEnquiryData, setVehicleEnquiryData] = useState<
  { name: string; value: number }[]
>([]);

const [vehicleConversionData, setVehicleConversionData] = useState<
  {
    vehicle: string;
    views: number;
    enquiries: number;
    conversion: number;
  }[]
>([]);




const totalEmi = emiData.reduce((sum, e) => sum + e.value, 0);
const pendingEmi = emiData.find(e => e.name === "Pending")?.value || 0;
const pendingPercent =
totalEmi > 0 ? Math.round((pendingEmi / totalEmi) * 100) : 0;
const defaultEmi = {
name: "Pending",
value: emiData.find(e => e.name === "Pending")?.value || 0,
};

const activeDisplay = activeEmi || defaultEmi;

const activePercent =
totalEmi > 0 ? Math.round((activeDisplay.value / totalEmi) * 100) : 0;




const [summary, setSummary] = useState({
totalRevenue: 0,
totalCost: 0,
totalProfit: 0,
avgSaleValue: 0,
totalSales: 0,
totalPurchases: 0,
pendingAmount: 0,
collectedAmount: 0,
totalCustomers: 0,
totalVehicles: 0,
profitMargin: 0,
totalExpenses: 0,

 interestCollected: 0,
  interestPending: 0,
});




useEffect(() => {
  fetchReportData();
}, [period, accountingMode]);

useEffect(() => {
  fetchDailyPublicAnalytics();
}, [selectedDate]);



type MonthlyBucket = {
  sales: number;
  revenue: number;   // principal cashflow
  interest: number;  // EMI interest income
  purchases: number;
  cost: number;
  profit: number;
  customers: number;
  expenses: number;
};



const fetchReportData = async () => {
setLoading(true);
// Get current user for explicit filtering
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
setLoading(false);
return;
}

const [salesRes, vehiclesRes, purchasesRes, paymentsRes, emisRes, customersRes, expensesRes, vendorsRes] = await Promise.all([
supabase.from("sales").select("*").eq("user_id", user.id),
supabase.from("vehicles").select("*").eq("user_id", user.id),
supabase.from("vehicle_purchases").select("*").eq("user_id", user.id),
supabase.from("payments").select("*").eq("user_id", user.id),
supabase.from("emi_schedules").select("*").eq("user_id", user.id),
supabase.from("customers").select("*").eq("user_id", user.id),
supabase.from("expenses").select("*").eq("user_id", user.id),
supabase.from("vendors").select("id, name").eq("user_id", user.id),
]);

const sales = salesRes.data || [];
const vehicles = vehiclesRes.data || [];
const purchases = purchasesRes.data || [];
const payments = paymentsRes.data || [];
const emis = emisRes.data || [];
const customers = customersRes.data || [];
const expenses = expensesRes.data || [];
const vendors = vendorsRes.data || [];


// ===============================
// SIMPLE CASH ACCOUNTING
// ===============================

const simpleRevenue = payments
  .filter(
    p =>
      p.payment_type === "customer_payment" ||
      p.payment_type === "emi_payment"
  )
  .reduce((sum, p) => sum + Number(p.amount || 0), 0);

const simpleCost = payments
  .filter(p => p.payment_type === "vendor_payment")
  .reduce((sum, p) => sum + Number(p.amount || 0), 0);

const simpleExpenses = payments
  .filter(p => p.payment_type === "expense")
  .reduce((sum, p) => sum + Number(p.amount || 0), 0);

const simpleProfit = simpleRevenue - simpleCost - simpleExpenses;

const simpleProfitMargin =
  simpleRevenue > 0 ? (simpleProfit / simpleRevenue) * 100 : 0;



// ---------- Vendor Payables (Risk Exposure) ----------
const vendorMap: Record<string, number> = {};

purchases.forEach((p) => {
const pending = Number(p.purchase_price || 0) - Number(p.amount_paid || 0);
if (pending > 0) {
const vendor = vendors.find(v => v.id === p.vendor_id);
if (!vendor) return;

vendorMap[vendor.name] = (vendorMap[vendor.name] || 0) + pending;
}
});

setVendorPayables(
Object.entries(vendorMap)
.map(([name, value]) => ({ name, value }))
.sort((a, b) => b.value - a.value)
);

// ✅ Only completed sales should affect customer payment health







const now = new Date();
let startDate = subMonths(now, 6);
if (period === "3months") startDate = subMonths(now, 3);
if (period === "12months") startDate = subMonths(now, 12);
if (period === "30days") startDate = subDays(now, 30);

const filteredSales = sales.filter(s => new Date(s.sale_date) >= startDate && s.status === 'completed');
const filteredPurchases = purchases.filter(p => new Date(p.purchase_date) >= startDate);
const filteredExpenses = expenses.filter(e => new Date(e.expense_date) >= startDate);
const filteredCustomers = customers.filter(c => new Date(c.created_at) >= startDate);

const completedSalesAll = sales.filter(s => s.status === 'completed');

// ===============================
// NBFC VEHICLE LEDGER (GROUND TRUTH)
// ===============================

const ledgerRows: any[] = [];

vehicles.forEach(vehicle => {
  const purchase = purchases.find(p => p.vehicle_id === vehicle.id);
  if (!purchase) return;

  const sale = completedSalesAll.find(s => s.vehicle_id === vehicle.id);

  const salePayments = payments.filter(
    p =>
      sale &&
      p.reference_id === sale.id &&
      (p.payment_type === "customer_payment" ||
       p.payment_type === "emi_payment")
  );

  const saleEmis = emis.filter(e => sale && e.sale_id === sale.id);

  // ✅ PRINCIPAL COLLECTED = DOWN PAYMENT + EMI PRINCIPAL
const principalCollected =
  payments
    .filter(p =>
      sale &&
      p.reference_id === sale.id &&
      p.payment_purpose === "down_payment"
    )
    .reduce((s, p) => s + Number(p.principal_amount || p.amount || 0), 0)
  +
  saleEmis.reduce(
    (s, e) => s + Number(e.principal_paid || 0),
    0
  );



  const interestCollectedVehicle = saleEmis.reduce(
    (s, e) => s + Number(e.interest_paid || 0),
    0
  );

  const sellingPrice = sale ? Number(sale.total_amount || 0) : 0;
  const purchasePrice = Number(purchase.purchase_price || 0);

  const totalProfit = sellingPrice - purchasePrice;

  // 🔒 PROFIT RATIO (PRINCIPAL ONLY)
const profitRatio =
  sellingPrice > 0 ? totalProfit / sellingPrice : 0;
// 🔒 RAW REALISED PROFIT (NO ROUNDING)
// ✅ PROFIT REALISED (CAPPED, PROPERLY ROUNDED)
const realisedProfitVehicle = Math.round(
  Math.min(principalCollected * profitRatio, totalProfit) * 100
) / 100;

// ✅ PROFIT PENDING
const profitPendingVehicle = getEffectiveBalance(
  Math.round((totalProfit - realisedProfitVehicle) * 100) / 100
);



const expectedProfit = totalProfit;





  const interestPendingVehicle = saleEmis.reduce(
  (s, e) =>
    s +
    Math.max(
      Number(e.emi_amount || 0) -
      Number(e.principal_paid || 0) -
      Number(e.interest_paid || 0),
      0
    ),
  0
);

const customerPending = sale
  ? getEffectiveBalance(sellingPrice - principalCollected)
  : 0;




const profitPending = sale
  ? Math.max(expectedProfit - realisedProfitVehicle, 0)
  : 0;

ledgerRows.push({
  vehicle: `${vehicle.brand} ${vehicle.model}`,
  purchase_price: purchasePrice,
  sale_price: sellingPrice,
  principal_collected: principalCollected,
  interest_collected: interestCollectedVehicle,

  customer_pending: customerPending,
  realised_profit: realisedProfitVehicle,

  profit_pending: profitPendingVehicle,
});

});

setVehicleLedgers(ledgerRows);




const interestCollected = emis
  .filter(e => e.status === "paid" || e.status === "partially_paid")
  .reduce((sum, e) => sum + Number(e.interest_paid || 0), 0);


// ✅ Revenue = actual cash collected (customer + EMI principal)
// ✅ PRINCIPAL REVENUE (USED FOR PROFIT)
const principalRevenue =
  // customer payments
  payments
    .filter(p => p.payment_type === "customer_payment")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)
  +
  // EMI principal only
  emis.reduce(
    (sum, e) => sum + Number(e.principal_paid || 0),
    0
  );

// ✅ GROSS COLLECTION (FOR CASHFLOW DISPLAY)
const grossCollection = principalRevenue + interestCollected;


const collectedAmount = grossCollection;



// const totalCost = filteredPurchases.reduce((sum, p) => sum + Number(p.purchase_price), 0);
// ✅ Only PAID purchase cost


// ✅ TOTAL INVENTORY COST (purchase price)
const totalInventoryCost = filteredPurchases.reduce(
(sum, p) => sum + Number(p.purchase_price || 0),
0
);

// ✅ TOTAL PAID TO VENDORS (REAL COST)
const totalPaidCost = filteredPurchases.reduce(
(sum, p) => sum + Number(p.amount_paid || 0),
0
);

// ✅ VENDOR PENDING (LIABILITY)
const totalVendorPending = totalInventoryCost - totalPaidCost;



const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

// ---------------- CASH BASIS PROFIT (EMI SAFE) ----------------



// subtract real expenses



const avgSaleValue =
  filteredSales.length > 0
    ? filteredSales.reduce((s, sale) => s + Number(sale.total_amount || 0), 0) / filteredSales.length
    : 0;


// Only count pending from completed sales


const customerBalanceMap: Record<string, number> = {};

const customerMap = Object.fromEntries(
customers.map(c => [c.id, c])
);

completedSalesAll.forEach(sale => {
const customer = customerMap[sale.customer_id];
if (!customer) return;

// 🔥 Calculate paid from payments table
const paid =
  payments
    .filter(p =>
      p.reference_id === sale.id &&
      p.payment_purpose === "down_payment"
    )
    .reduce((sum, p) => sum + Number(p.principal_amount || p.amount || 0), 0)
  +
  emis
    .filter(e => e.sale_id === sale.id)
    .reduce((sum, e) => sum + Number(e.principal_paid || 0), 0);


const rawBalance = Number(sale.total_amount || 0) - paid;
const effectiveBalance = getEffectiveBalance(rawBalance);

customerBalanceMap[customer.full_name] =
(customerBalanceMap[customer.full_name] || 0) + effectiveBalance;

});



const paidCustomers = Object.values(customerBalanceMap).filter(v => v === 0).length;
const pendingCustomers = Object.values(customerBalanceMap).filter(v => v > 0).length;

setCustomerPaymentHealth([
{ name: "Paid", value: paidCustomers },
{ name: "Pending", value: pendingCustomers },
]);









// ✅ Pending = total sales value - total collected
// ✅ TOTAL PAYABLE = SALE PRICE + TOTAL INTEREST
// ✅ FINAL PENDING AMOUNT (EMI SAFE — NO DOUBLE COUNTING)
// ✅ FINAL PENDING AMOUNT = CUSTOMER PRINCIPAL ONLY
let finalPendingAmount = 0;

completedSalesAll.forEach(sale => {
  const saleEmis = emis.filter(e => e.sale_id === sale.id);

  const principalCollected =
    payments
      .filter(p =>
        p.reference_id === sale.id &&
        p.payment_purpose === "down_payment"
      )
      .reduce((sum, p) => sum + Number(p.principal_amount || p.amount || 0), 0)
    +
    saleEmis.reduce(
      (sum, e) => sum + Number(e.principal_paid || 0),
      0
    );

  const rawPending =
  Number(sale.total_amount || 0) - principalCollected;

finalPendingAmount += getEffectiveBalance(rawPending);

});


// 🔒 ROUNDING SETTLEMENT (NBFC STANDARD)






// ✅ CASH BASIS PROFIT (FINAL & CORRECT)


// ✅ Monthly cash collected (customer + EMI, excluding interest)
const monthlyCollected: Record<string, number> = {};

payments
.filter(
p =>
p.payment_type === "customer_payment" ||
p.payment_type === "emi_payment"
)
.forEach(p => {
const month = format(new Date(p.created_at), "MMM yy");
monthlyCollected[month] =
(monthlyCollected[month] || 0) + Number(p.amount || 0);
});

const hasEmiConfigured = (saleId: string) =>
emis.some(e => e.sale_id === saleId);


// ✅ EMI-SAFE CASH-BASED PROFIT (PROPORTIONAL)


// 🔒 CAP PROFIT TO VEHICLE PROFIT (NO INTEREST LEAK)
// ✅ EMI-SAFE CASH-BASED PROFIT (PROPORTIONAL — PER SALE)
let realisedProfit = 0;

completedSalesAll.forEach((sale) => {
  const purchase = purchases.find(p => p.vehicle_id === sale.vehicle_id);
  if (!purchase) return;

  const sellingPrice = Number(sale.total_amount || 0);
  const purchaseCost = Number(purchase.purchase_price || 0);
  const vehicleProfit = sellingPrice - purchaseCost;

  if (vehicleProfit <= 0) return;

  // 🔹 TOTAL EXPECTED COLLECTION (principal only)
  const totalExpectedCollection =
  Number(sale.total_amount || 0);



  if (totalExpectedCollection <= 0) return;

  // 🔹 CASH COLLECTED SO FAR
  const cashCollected =
  emis
    .filter(e => e.sale_id === sale.id)
    .reduce((sum, e) => sum + Number(e.principal_paid || 0), 0)
  +
  payments
    .filter(p =>
      p.reference_id === sale.id &&
      p.payment_purpose === "down_payment"
    )
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);


  // 🔹 PROFIT RATIO
  const profitRatio = vehicleProfit / totalExpectedCollection;

// 🔒 CAP PER SALE (PROPERLY ROUNDED)
  const saleProfit = Math.round(
    Math.min(cashCollected * profitRatio, vehicleProfit) * 100
  ) / 100;

  realisedProfit += saleProfit;
});


// ❌ DO NOT subtract expenses here for gross profit


const safeRevenue = Math.round(principalRevenue * 100) / 100;
const safeProfit = Math.round(realisedProfit * 100) / 100;

const profitMargin =
safeRevenue > 0
  ? (safeProfit / safeRevenue) * 100
  : 0;



// ✅ INTEREST CALCULATION


// ✅ INTEREST CALCULATION (NBFC SAFE – DERIVED, NOT SUMMED)
let interestTotal = 0;

completedSalesAll.forEach(sale => {
  const saleEmis = emis.filter(e => e.sale_id === sale.id);

  if (saleEmis.length === 0) return;

  const principal =
    Number(sale.total_amount || 0) -
    Number(sale.down_payment || 0);

  const totalEmiPayable = saleEmis.reduce(
    (s, e) => s + Number(e.emi_amount || 0),
    0
  );

  const saleInterest = Math.max(
    totalEmiPayable - principal,
    0
  );

  interestTotal += saleInterest;
});

const interestPending = Math.max(
  interestTotal - interestCollected,
  0
);


// ===============================
// EMI INTEREST LEDGER
// ===============================
setInterestLedger(
  emis.map(e => ({
    due_date: e.due_date,
    interest_paid: Number(e.interest_paid || 0),
    interest_pending: Math.max(
      Number(e.emi_amount || 0) -
      Number(e.principal_paid || 0) -
      Number(e.interest_paid || 0),
      0
    ),
  }))
);



// ===============================
// PROFIT & LOSS STATEMENT
// ===============================

setPnlStatement({
  revenue: {
    vehicle_sales: principalRevenue,
    interest_income: interestCollected,
  },
  expenses: {
    operating: totalExpenses,
  },
  net_profit: Math.round(realisedProfit - totalExpenses),
});

// ===============================
// BALANCE SHEET (SNAPSHOT)
// ===============================

setBalanceSheet({
  assets: {
    // ✅ ALL CASH (principal + interest)
    cash_and_bank: payments.reduce(
      (s, p) => s + Number(p.amount || 0),
      0
    ),

    // ✅ PRINCIPAL ONLY
    customer_receivables: finalPendingAmount,

    // ✅ UNSOLD INVENTORY ONLY
    inventory: vehicles
      .filter(v => v.status === "in_stock")
      .reduce((s, v) => {
        const p = purchases.find(p => p.vehicle_id === v.id);
        return s + Number(p?.purchase_price || 0);
      }, 0),
  },

  liabilities: {
    vendor_payables: totalVendorPending,
  },
});



// ===============================
// CUSTOMER RECEIVABLES
// ===============================

setReceivables(
  Object.entries(customerBalanceMap)
    .map(([customer, amount]) => ({
      customer,
      amount: getEffectiveBalance(amount),
    }))
    .filter(r => r.amount > 0)
);



if (accountingMode === "simple") {
  setSummary({
    totalRevenue: simpleRevenue,
    collectedAmount: simpleRevenue,
    totalCost: simpleCost,
    totalProfit: simpleProfit,
    profitMargin: simpleProfitMargin,
    avgSaleValue,
    totalSales: filteredSales.length,
    totalPurchases: filteredPurchases.length,
    pendingAmount: finalPendingAmount,
    totalCustomers: customers.length,
    totalVehicles: vehicles.length,
    totalExpenses: simpleExpenses,
    interestCollected: 0,
    interestPending: 0,
  });
} else {
  // NBFC GRADE MODEL
  setSummary({
  totalRevenue: Math.round(principalRevenue),
  collectedAmount: Math.round(grossCollection),
  totalCost: Math.round(totalPaidCost),
  totalProfit: Math.round(realisedProfit),
  profitMargin,
  avgSaleValue,
  totalSales: filteredSales.length,
  totalPurchases: filteredPurchases.length,
  pendingAmount: finalPendingAmount,
  totalCustomers: customers.length,
  totalVehicles: vehicles.length,
  totalExpenses,
  interestCollected: Math.round(interestCollected),
  interestPending: Math.round(interestPending),
});

}


// MODE-AWARE DATA SOURCES  👈 ADD HERE
// ===============================

const revenueSource =
  accountingMode === "simple"
    ? payments.filter(p =>
        p.payment_type === "customer_payment" ||
        p.payment_type === "emi_payment"
      )
    : null; // NBFC handled per-sale

const costSource =
  accountingMode === "simple"
    ? payments.filter(p => p.payment_type === "vendor_payment")
    : purchases;

const expenseSource =
  accountingMode === "simple"
    ? payments.filter(p => p.payment_type === "expense")
    : filteredExpenses;


// Monthly data
const monthlyData: Record<string, MonthlyBucket> = {};

const months = period === "30days" ? 4 : period === "3months" ? 3 : period === "12months" ? 12 : 6;

for (let i = months - 1; i >= 0; i--) {
const date = subMonths(now, i);
const monthKey = format(date, 'MMM yy');
monthlyData[monthKey] = { sales: 0, revenue: 0, purchases: 0, cost: 0, profit: 0, customers: 0, expenses: 0, interest: 0 };
}

// Monthly sales volume (count of sales per month)
filteredSales.forEach((s) => {
  const month = format(new Date(s.sale_date), 'MMM yy');
  if (monthlyData[month]) {
    monthlyData[month].sales += 1;
  }
});

filteredPurchases.forEach((p) => {
  const month = format(new Date(p.purchase_date), 'MMM yy');
  if (monthlyData[month]) {
    monthlyData[month].purchases += 1;
  }
});

if (accountingMode === "simple") {
  revenueSource?.forEach(p => {
    const month = format(new Date(p.created_at), "MMM yy");
    if (monthlyData[month]) {
      monthlyData[month].revenue += Number(p.amount || 0);
    }
  });
} else {
  // NBFC MODE
  emis.forEach(e => {
    const month = format(new Date(e.updated_at), "MMM yy");
    if (!monthlyData[month]) return;

    // ✅ Principal = cashflow (not revenue)
    monthlyData[month].revenue += Number(e.principal_paid || 0);

    // ✅ Interest = real revenue
    monthlyData[month].interest += Number(e.interest_paid || 0);
  });
}







if (accountingMode === "simple") {
  costSource.forEach(p => {
    const month = format(new Date(p.created_at), "MMM yy");
    if (monthlyData[month]) {
      monthlyData[month].cost += Number(p.amount || 0);
    }
  });
} else {
  costSource.forEach(p => {
    const month = format(new Date(p.purchase_date), "MMM yy");
    if (monthlyData[month]) {
      monthlyData[month].cost += Number(p.amount_paid || 0);
    }
  });
}



if (accountingMode === "simple") {
  expenseSource.forEach(p => {
    const month = format(new Date(p.created_at), "MMM yy");
    if (monthlyData[month]) {
      monthlyData[month].expenses += Number(p.amount || 0);
    }
  });
} else {
  expenseSource.forEach(e => {
    const month = format(new Date(e.expense_date), "MMM yy");
    if (monthlyData[month]) {
      monthlyData[month].expenses += Number(e.amount);
    }
  });
}


filteredCustomers.forEach((c) => {
const month = format(new Date(c.created_at), 'MMM yy');
if (monthlyData[month]) {
monthlyData[month].customers += 1;
}
});

Object.keys(monthlyData).forEach(month => {
  if (accountingMode === "simple") {
    monthlyData[month].profit =
      monthlyData[month].revenue -
      monthlyData[month].cost -
      monthlyData[month].expenses;
  } else {
    let monthProfit = 0;

    completedSalesAll.forEach(sale => {
      const purchase = purchases.find(p => p.vehicle_id === sale.vehicle_id);
      if (!purchase) return;

      const vehicleProfit =
        Number(sale.total_amount || 0) -
        Number(purchase.purchase_price || 0);

      if (vehicleProfit <= 0) return;

      const totalExpectedCollection = Number(sale.total_amount || 0);

      const monthCollected =
  payments
    .filter(p =>
      p.reference_id === sale.id &&
      format(new Date(p.created_at), "MMM yy") === month &&
      p.payment_type === "customer_payment"
    )
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)
  +
  emis
    .filter(e =>
      e.sale_id === sale.id &&
      format(new Date(e.updated_at), "MMM yy") === month
    )
    .reduce((sum, e) => sum + Number(e.principal_paid || 0), 0);


      const profitRatio = vehicleProfit / totalExpectedCollection;
      // 🔒 CUMULATIVE COLLECTION TILL THIS MONTH
const cumulativeCollected =
  emis
    .filter(e =>
      e.sale_id === sale.id &&
      format(new Date(e.updated_at), "MMM yy") <= month
    )
    .reduce((sum, e) => sum + Number(e.principal_paid || 0), 0)
  +
  payments
    .filter(p =>
      p.reference_id === sale.id &&
      p.payment_purpose === "down_payment" &&
      format(new Date(p.created_at), "MMM yy") <= month
    )
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);


// 🔒 TOTAL PROFIT CAP
const cappedProfit = Math.min(
  cumulativeCollected * profitRatio,
  vehicleProfit
);

// 🔒 PREVIOUS MONTH PROFIT (already realised)
const previousCollected = cumulativeCollected - monthCollected;
const previousProfit = Math.min(
  previousCollected * profitRatio,
  vehicleProfit
);

// 🔓 UNLOCK ONLY DIFFERENCE
monthProfit += Math.max(cappedProfit - previousProfit, 0);

    });

    monthlyData[month].profit =
      monthProfit - monthlyData[month].expenses;
  }
});





setSalesData(Object.entries(monthlyData).map(([month, data]) => ({ month, ...data })));
setProfitData(Object.entries(monthlyData).map(([month, data]) => ({
month,
revenue: data.revenue,
cost: data.cost,
expenses: data.expenses,
profit: data.profit,
})));
setCustomerData(Object.entries(monthlyData).map(([month, data]) => ({ month, customers: data.customers })));

// Vehicle type distribution
const typeCount: Record<string, number> = {};
vehicles.forEach((v) => { typeCount[v.vehicle_type] = (typeCount[v.vehicle_type] || 0) + 1; });
setVehicleData(Object.entries(typeCount).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })));

// Vehicle status with distinct colors
const statusColors: Record<string, string> = {
  'In Stock': 'hsl(142, 71%, 45%)',  // Green
  'Sold': 'hsl(221, 83%, 53%)',       // Blue
  'Reserved': 'hsl(38, 92%, 50%)',    // Amber
};

const statusCount = {
'In Stock': vehicles.filter(v => v.status === 'in_stock').length,
'Sold': vehicles.filter(v => v.status === 'sold').length,
'Reserved': vehicles.filter(v => v.status === 'reserved').length,
};
setVehicleStatusData(Object.entries(statusCount).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value })));

// Top selling brands
const brandSales: Record<string, { count: number; revenue: number }> = {};
filteredSales.forEach((s) => {
const vehicle = vehicles.find(v => v.id === s.vehicle_id);
if (vehicle) {
if (!brandSales[vehicle.brand]) brandSales[vehicle.brand] = { count: 0, revenue: 0 };
brandSales[vehicle.brand].count += 1;
brandSales[vehicle.brand].revenue += Number(s.total_amount);
}
});
setTopVehicles(Object.entries(brandSales)
.map(([brand, data]) => ({ brand, ...data }))
.sort((a, b) => b.revenue - a.revenue)
.slice(0, 5));

// EMI status
const emiStatus = {
'Paid': emis.filter(e => e.status === 'paid').length,
'Pending': emis.filter(e => e.status === 'pending').length,
'Overdue': emis.filter(e => e.status === 'overdue' || (e.status === 'pending' && new Date(e.due_date) < now)).length,
'Partial': emis.filter(e => e.status === 'partially_paid').length,
};


setEmiData(Object.entries(emiStatus).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value })));





// Payment mode distribution
const paymentModes: Record<string, number> = {};
payments.forEach(p => {
const mode = p.payment_mode.replace('_', ' ');
paymentModes[mode] = (paymentModes[mode] || 0) + Number(p.amount);
});
setPaymentData(Object.entries(paymentModes).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })));

// Expense by category
const expenseCategories: Record<string, number> = {};
filteredExpenses.forEach(e => {
expenseCategories[e.category] = (expenseCategories[e.category] || 0) + Number(e.amount);
});
setExpenseData(Object.entries(expenseCategories).map(([name, value]) => ({ name: name.replace('_', ' '), value })).sort((a, b) => b.value - a.value));

// Vehicle Aging Analysis - how long vehicles have been in stock
const inStockVehicles = vehicles.filter(v => v.status === 'in_stock');
const agingBuckets = {
'0-30 days': 0,
'31-60 days': 0,
'61-90 days': 0,
'90+ days': 0,
};

inStockVehicles.forEach(v => {
const daysInStock = Math.floor((now.getTime() - new Date(v.created_at).getTime()) / (1000 * 60 * 60 * 24));
if (daysInStock <= 30) agingBuckets['0-30 days']++;
else if (daysInStock <= 60) agingBuckets['31-60 days']++;
else if (daysInStock <= 90) agingBuckets['61-90 days']++;
else agingBuckets['90+ days']++;
});
setVehicleAgingData(Object.entries(agingBuckets).map(([name, value]) => ({ name, value })));

// Inventory Turnover - how fast vehicles are selling
const soldVehicles = vehicles.filter(v => v.status === 'sold');
const avgInventory = (inStockVehicles.length + soldVehicles.length) / 2;
const turnoverRatio = avgInventory > 0 ? filteredSales.length / avgInventory : 0;
const avgDaysToSell = soldVehicles.length > 0
? soldVehicles.reduce((sum, v) => {
const sale = sales.find(s => s.vehicle_id === v.id && s.status === 'completed');
if (sale) {
return sum + Math.floor((new Date(sale.sale_date).getTime() - new Date(v.created_at).getTime()) / (1000 * 60 * 60 * 24));
}
return sum;
}, 0) / soldVehicles.length
: 0;
setInventoryTurnover({ ratio: Math.round(turnoverRatio * 100) / 100, avgDays: Math.round(avgDaysToSell) });

// Fuel type distribution
const fuelCount: Record<string, number> = {};
vehicles.forEach(v => {
fuelCount[v.fuel_type] = (fuelCount[v.fuel_type] || 0) + 1;
});
setFuelTypeData(Object.entries(fuelCount).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })));

setLoading(false);
};


const fetchDailyPublicAnalytics = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const start = new Date(selectedDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(selectedDate);
  end.setHours(23, 59, 59, 999);

  const { data } = await supabase
    .from("public_page_events")
    .select("event_type, session_id, vehicle_id")
    .eq("dealer_user_id", user.id)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  if (!data) return;

  const visitors = new Set(data.map(d => d.session_id)).size;
  const views = data.filter(
    d => d.event_type === "page_view" || d.event_type === "vehicle_view"
  ).length;
  const enquiries = data.filter(d => d.event_type === "enquiry_submit").length;
  const ctaClicks = data.filter(
    d => d.event_type === "cta_call" || d.event_type === "cta_whatsapp"
  ).length;

  const vehiclesWithEnquiry = new Set(
    data.filter(d => d.event_type === "enquiry_submit").map(d => d.vehicle_id)
  ).size;

  // 🧠 Public Page Score (0–100)
  let score = 0;
  if (visitors > 0) score += 30;
  if (views / Math.max(visitors, 1) > 1.5) score += 20;
  if (ctaClicks > 0) score += 20;
  if (enquiries > 0) score += 30;

  setDailyStats({
    visitors,
    views,
    enquiries,
    ctaClicks,
    vehiclesWithEnquiry,
    score,
  });

  // ---------- VEHICLE MAP ----------
const vehicleMap: Record<string, { views: number; enquiries: number }> = {};

data.forEach((e) => {
  if (!e.vehicle_id) return;

  if (!vehicleMap[e.vehicle_id]) {
    vehicleMap[e.vehicle_id] = { views: 0, enquiries: 0 };
  }

  if (e.event_type === "vehicle_view") {
    vehicleMap[e.vehicle_id].views += 1;
  }

  if (e.event_type === "enquiry_submit") {
    vehicleMap[e.vehicle_id].enquiries += 1;
  }
});

// Resolve vehicle names
const { data: vehicleRows } = await supabase
  .from("vehicles")
  .select("id, brand, model")
  .eq("user_id", user.id);

const vehicleNameMap = Object.fromEntries(
  (vehicleRows || []).map(v => [
    v.id,
    `${v.brand} ${v.model}`,
  ])
);

// ---------- PIE DATA ----------
const viewPie: any[] = [];
const enquiryPie: any[] = [];
const conversionTable: any[] = [];

Object.entries(vehicleMap).forEach(([vehicleId, stats]) => {
  const name = vehicleNameMap[vehicleId] || "Unknown Vehicle";

  if (stats.views > 0) {
    viewPie.push({ name, value: stats.views });
  }

  if (stats.enquiries > 0) {
    enquiryPie.push({ name, value: stats.enquiries });
  }

  conversionTable.push({
    vehicle: name,
    views: stats.views,
    enquiries: stats.enquiries,
    conversion:
      stats.views > 0
        ? Math.round((stats.enquiries / stats.views) * 100)
        : 0,
  });
});

setVehicleViewData(viewPie);
setVehicleEnquiryData(enquiryPie);
setVehicleConversionData(
  conversionTable.sort((a, b) => b.enquiries - a.enquiries)
);


};


if (loading) {
  return <AnalyticsSkeleton />;
}
return (
<div className="space-y-6 animate-fade-in">
<div className="flex flex-col sm:flex-row justify-between gap-4 px-1">
<div className="min-w-0">
<h1 className="text-2xl sm:text-3xl font-bold truncate">Reports & Analytics</h1>
<p className="text-muted-foreground text-sm sm:text-base">Comprehensive business insights and analytics dashboard</p>
</div>
<Select value={period} onValueChange={setPeriod}>
<SelectTrigger className="w-32 sm:w-40 shrink-0">
<SelectValue />
</SelectTrigger>
<SelectContent>
<SelectItem value="30days">Last 30 Days</SelectItem>
<SelectItem value="3months">Last 3 Months</SelectItem>
<SelectItem value="6months">Last 6 Months</SelectItem>
<SelectItem value="12months">Last 12 Months</SelectItem>
</SelectContent>
</Select>
<div className="flex items-center gap-2">
  <span className="text-sm text-muted-foreground">Accounting</span>

  <Select
    value={accountingMode}
    onValueChange={(v: "simple" | "nbfc") => setAccountingMode(v)}
  >

  {accountingMode === "nbfc" && (
  <div className="flex items-center gap-2">
    <span className="text-sm text-muted-foreground">View</span>

    <Select
      value={nbfcView}
      onValueChange={(v: "visual" | "breakdown") => setNbfcView(v)}
    >
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="visual">Visual Summary</SelectItem>
        <SelectItem value="breakdown">Ledger Breakdown</SelectItem>
      </SelectContent>
    </Select>
  </div>
)}



    <SelectTrigger className="w-44">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="simple">Simple Cash</SelectItem>
      <SelectItem value="nbfc">NBFC / EMI Grade</SelectItem> 
    </SelectContent>
  </Select>
</div>

</div>


{!(accountingMode === "nbfc" && nbfcView === "breakdown") && (
  <>
{/* KPI Cards - Row 1 */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 px-1">
<Card className="border border-border bg-gradient-to-br from-chart-2/10 to-transparent">
<CardContent className="p-2 sm:p-4">
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
<div className="min-w-0 flex-1">
<p className="text-[10px] sm:text-sm text-muted-foreground">Revenue</p>
<p className="text-sm sm:text-2xl font-bold text-chart-2">₹{formatIndianNumber(summary.totalRevenue)}</p>
<p className="text-[10px] text-chart-2">{summary.totalSales} sales</p>
</div>
<div className="hidden sm:flex h-12 w-12 rounded-full bg-chart-2/20 items-center justify-center">
<TrendingUp className="h-6 w-6 text-chart-2" />
</div>
</div>
</CardContent>
</Card>
<Card className="border border-border bg-gradient-to-br from-chart-5/10 to-transparent">
<CardContent className="p-2 sm:p-4">
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
<div className="min-w-0 flex-1">
<p className="text-[10px] sm:text-sm text-muted-foreground">Paid Cost</p>
<p className="text-sm sm:text-2xl font-bold text-chart-5">₹{formatIndianNumber(summary.totalCost)}</p>
<p className="text-[10px] text-chart-5">{summary.totalPurchases} purchases</p>
</div>
<div className="hidden sm:flex h-12 w-12 rounded-full bg-chart-5/20 items-center justify-center">
<TrendingDown className="h-6 w-6 text-chart-5" />
</div>
</div>
</CardContent>
</Card>
<Card className="border border-border bg-gradient-to-br from-chart-4/10 to-transparent">
<CardContent className="p-2 sm:p-4">
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
<div className="min-w-0 flex-1">
<p className="text-[10px] sm:text-sm text-muted-foreground">Profit</p>
<p className={`text-sm sm:text-2xl font-bold ${summary.totalProfit >= 0 ? 'text-chart-2' : 'text-destructive'}`}>
₹{formatIndianNumber(summary.totalProfit)}
</p>
<p className="text-[10px] text-chart-4">{summary.profitMargin.toFixed(1)}% margin</p>
</div>
<div className="hidden sm:flex h-12 w-12 rounded-full bg-chart-4/20 items-center justify-center">
<DollarSign className="h-6 w-6 text-chart-4" />
</div>
</div>
</CardContent>
</Card>
<Card className="border border-border bg-gradient-to-br from-chart-1/10 to-transparent">
<CardContent className="p-2 sm:p-4">
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
<div className="min-w-0 flex-1">
<p className="text-[10px] sm:text-sm text-muted-foreground">Avg Sale</p>
<p className="text-sm sm:text-2xl font-bold">₹{formatIndianNumber(Math.round(summary.avgSaleValue))}</p>
<p className="text-[10px] text-chart-1">per sale</p>
</div>
<div className="hidden sm:flex h-12 w-12 rounded-full bg-chart-1/20 items-center justify-center">
<Receipt className="h-6 w-6 text-chart-1" />
</div>
</div>
</CardContent>
</Card>
</div>

{/* KPI Cards - Row 2 */}
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
  {accountingMode === "nbfc" && (
<Card className="border border-border">
  <CardContent className="p-2 sm:p-4 text-center">
    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-chart-4/20 flex items-center justify-center mx-auto mb-2">
      <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 text-chart-4" />
    </div>

    <p className="text-lg sm:text-3xl font-bold text-chart-4 truncate">
      ₹{formatIndianNumber(summary.interestCollected)}
    </p>

    <p className="text-xs sm:text-sm text-muted-foreground">
      Interest Earned
    </p>

    {summary.interestPending > 0 && (
      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">
        ₹{formatIndianNumber(summary.interestPending)} pending
      </p>
    )}
  </CardContent>
</Card>
  )}

<Card className="border border-border">
<CardContent className="p-2 sm:p-4 text-center">
<div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-chart-4/20 flex items-center justify-center mx-auto mb-2">
<Users className="h-4 w-4 sm:h-5 sm:w-5 text-chart-4" />
</div>
<p className="text-lg sm:text-3xl font-bold text-chart-4">{summary.totalCustomers}</p>
<p className="text-xs sm:text-sm text-muted-foreground">Total Customers</p>
</CardContent>
</Card>
<Card className="border border-border">
<CardContent className="p-2 sm:p-4 text-center">
<div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-chart-3/20 flex items-center justify-center mx-auto mb-2">
<Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-chart-3" />
</div>
<p className="text-lg sm:text-3xl font-bold text-chart-3 truncate">₹{formatIndianNumber(summary.pendingAmount)}</p>
<p className="text-xs sm:text-sm text-muted-foreground">Pending Amount</p>
</CardContent>
</Card>
<Card className="border border-border">
<CardContent className="p-2 sm:p-4 text-center">
<div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-chart-2/20 flex items-center justify-center mx-auto mb-2">
<CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-chart-2" />
</div>
<p className="text-lg sm:text-3xl font-bold text-chart-2 truncate">₹{formatIndianNumber(summary.collectedAmount)}</p>
<p className="text-xs sm:text-sm text-muted-foreground">Collected</p>
</CardContent>
</Card>

<Card className="border border-border">
  <CardContent className="p-2 sm:p-4 text-center">
    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-chart-5/20 flex items-center justify-center mx-auto mb-2">
      <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-chart-5" />
    </div>

    <p className="text-lg sm:text-3xl font-bold text-chart-5 truncate">
      ₹{formatIndianNumber(summary.totalExpenses)}
    </p>

    <p className="text-xs sm:text-sm text-muted-foreground">
      Expenses
    </p>

    {accountingMode === "simple" && (
      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
        Deducted from profit
      </p>
    )}
  </CardContent>
</Card>


</div>

</>
)}


  {accountingMode === "nbfc" && nbfcView === "breakdown" && (
  <Tabs defaultValue="vehicles" className="space-y-4">

    <TabsList className="grid grid-cols-6 w-full">
      <TabsTrigger value="vehicles">Vehicle Ledger</TabsTrigger>
<TabsTrigger value="pnl">P&L (Cash)</TabsTrigger>
<TabsTrigger value="balance">Balance Sheet</TabsTrigger>
<TabsTrigger value="receivables">Customer Dues</TabsTrigger>
<TabsTrigger value="payables">Vendor Dues</TabsTrigger>
<TabsTrigger value="interest">Interest Ledger</TabsTrigger>
    </TabsList>

    {/* VEHICLE LEDGER */}
    <TabsContent value="vehicles">
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Ledger</CardTitle>
          <CardDescription>Per vehicle accounting trail</CardDescription>
          <CardDescription>
  Click a vehicle row to see EMI-wise profit unlocking
</CardDescription>

        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead>
              <tr className="border-b bg-muted">
                <th className="p-2 text-left">Vehicle</th>
                <th className="p-2">Purchase</th>
                <th className="p-2">Sale</th>
                <th className="p-2">Collected</th>
<th className="p-2">Interest</th>
<th className="p-2">Customer Pending</th>
<th className="p-2">Profit Realised</th>
<th className="p-2">Profit Pending</th>
              </tr>
            </thead>
            <tbody>
              {vehicleLedgers.map((v, i) => (
                <tr
  key={i}
  className="border-b cursor-pointer hover:bg-muted/50"
  onClick={() => {
    setActiveVehicleLedger(v);
    setShowVehicleDrilldown(true);
  }}
>

                  <td className="p-2">{v.vehicle}</td>
                  <td className="p-2">₹{formatIndianNumber(v.purchase_price)}</td>
                  <td className="p-2">₹{formatIndianNumber(v.sale_price)}</td>
                  <td className="p-2">₹{formatIndianNumber(v.principal_collected)}</td>
<td className="p-2">₹{formatIndianNumber(v.interest_collected)}</td>
<td className="p-2 text-red-600">₹{formatIndianNumber(v.customer_pending)}</td>
<td className="p-2 text-green-600 font-medium">₹{formatIndianNumber(Math.round(v.realised_profit))}</td>
<td className="p-2 text-orange-600">₹{formatIndianNumber(v.profit_pending)}</td>

                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 grid grid-cols-3 gap-4 text-sm font-medium">
  <div>Total Inventory: ₹{formatIndianNumber(
    vehicleLedgers.reduce((s, v) => s + v.purchase_price, 0)
  )}</div>

  <div className="text-green-600">
    Profit Realised: ₹{formatIndianNumber(
      vehicleLedgers.reduce((s, v) => s + v.realised_profit, 0)
    )}
  </div>

  <div className="text-orange-600">
    Profit Pending: ₹{formatIndianNumber(
      vehicleLedgers.reduce((s, v) => s + v.profit_pending, 0)
    )}
  </div>
</div>

        </CardContent>
      </Card>
    </TabsContent>

    {/* P&L */}
    <TabsContent value="pnl">
      <Card>
        <CardHeader><CardTitle>Profit & Loss</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="text-green-600">
  Vehicle Sales: ₹{formatIndianNumber(pnlStatement?.revenue.vehicle_sales)}
</div>

<div className="text-green-600">
  Interest Income: ₹{formatIndianNumber(pnlStatement?.revenue.interest_income)}
</div>

<div className="text-red-600">
  Expenses: ₹{formatIndianNumber(pnlStatement?.expenses.operating)}
</div>

<div className={`font-bold ${
  (pnlStatement?.net_profit ?? 0) >= 0 ? "text-green-700" : "text-red-700"
}`}>
  Net Profit: ₹{formatIndianNumber(pnlStatement?.net_profit)}
</div>

        </CardContent>
      </Card>
    </TabsContent>

    {/* BALANCE SHEET */}
    <TabsContent value="balance">
      <Card>
        <CardHeader><CardTitle>Balance Sheet</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">Assets</p>
            <p className="text-green-600">
  Cash: ₹{formatIndianNumber(balanceSheet?.assets.cash_and_bank)}
</p>

<p className="text-orange-600">
  Receivables: ₹{formatIndianNumber(balanceSheet?.assets.customer_receivables)}
</p>

<p className="text-muted-foreground">
  Inventory: ₹{formatIndianNumber(balanceSheet?.assets.inventory)}
</p>

          </div>
          <div>
            <p className="font-medium">Liabilities</p>
            <p className="text-red-600">
  Vendor Payables: ₹{formatIndianNumber(balanceSheet?.liabilities.vendor_payables)}
</p>

            
          </div>
        </CardContent>
      </Card>
    </TabsContent>

    {/* RECEIVABLES */}
    <TabsContent value="receivables">
      <Card>
        <CardHeader><CardTitle>Customer Receivables</CardTitle></CardHeader>
        <CardContent>
          {receivables.map((r, i) => (
            <div key={i} className="flex justify-between border-b py-1 text-sm">
              <span>{r.customer}</span>
              <span className="text-red-600 font-medium">
  ₹{formatIndianNumber(r.amount)}
</span>

            </div>
          ))}
        </CardContent>
      </Card>
    </TabsContent>

    {/* PAYABLES */}
    <TabsContent value="payables">
      <Card>
        <CardHeader><CardTitle>Vendor Payables</CardTitle></CardHeader>
        <CardContent>
          {vendorPayables.map((v, i) => (
            <div key={i} className="flex justify-between border-b py-1 text-sm">
              <span>{v.name}</span>
              <span>₹{formatIndianNumber(v.value)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </TabsContent>

    {/* INTEREST */}
    <TabsContent value="interest">
      <Card>
        <CardHeader><CardTitle>EMI Interest Ledger</CardTitle></CardHeader>
        <CardContent>
          {interestLedger.map((i, idx) => (
            <div key={idx} className="flex justify-between border-b py-1 text-sm">
              <span>{i.due_date}</span>
              <span>
  <span className="text-green-600">
    Paid ₹{formatIndianNumber(i.interest_paid)}
  </span>
  {" | "}
  <span className="text-orange-600">
    Pending ₹{formatIndianNumber(i.interest_pending)}
  </span>
</span>

            </div>
          ))}
        </CardContent>
      </Card>
    </TabsContent>

  </Tabs>
)}


{!(accountingMode === "nbfc" && nbfcView === "breakdown") && (
<Tabs defaultValue="overview" className="space-y-4">
<TabsList className="grid grid-cols-6 w-full max-w-2xl">
<TabsTrigger value="overview">Overview</TabsTrigger>
<TabsTrigger value="sales">Sales</TabsTrigger>
<TabsTrigger value="inventory">Inventory</TabsTrigger>
<TabsTrigger value="customers">Customers</TabsTrigger>
<TabsTrigger value="payments">Payments</TabsTrigger>
<TabsTrigger value="public">Public Page</TabsTrigger>

</TabsList>

{/* Overview Tab */}
<TabsContent value="overview" className="space-y-6">
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
<Card className="border border-border">
<CardHeader>
<CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Revenue vs Cost vs Expenses</CardTitle>
</CardHeader>
<CardContent>
<ResponsiveContainer width="100%" height={300}>
<ComposedChart data={profitData}>
<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
<XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
<YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
<Tooltip
contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
formatter={(value: number) => `₹${formatIndianNumber(value)}`}
/>
<Legend />
<Bar dataKey="revenue" fill="hsl(142, 71%, 45%)" name="Revenue" radius={[4, 4, 0, 0]} />
<Bar dataKey="cost" fill="hsl(339, 90%, 51%)" name="Cost" radius={[4, 4, 0, 0]} />
<Bar dataKey="expenses" fill="hsl(38, 92%, 50%)" name="Expenses" radius={[4, 4, 0, 0]} />
<Line type="monotone" dataKey="profit" stroke="hsl(221, 83%, 53%)" strokeWidth={3} name="Profit" dot={{ fill: 'hsl(221, 83%, 53%)', strokeWidth: 2 }} />
</ComposedChart>
</ResponsiveContainer>
</CardContent>
</Card>

<Card className="border border-border">
<CardHeader>
<CardTitle>Top Selling Brands</CardTitle>
<CardDescription>By revenue generated</CardDescription>
</CardHeader>
<CardContent className="space-y-4">
{topVehicles.map((item, i) => (
<div key={item.brand} className="space-y-2">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<Badge variant="outline" style={{ backgroundColor: `${COLORS[i % COLORS.length]}20`, borderColor: COLORS[i % COLORS.length], color: COLORS[i % COLORS.length] }}>
#{i + 1}
</Badge>
<span className="font-medium">{item.brand}</span>
</div>
<div className="text-right">
<span className="font-bold">₹{formatIndianNumber(item.revenue)}</span>
<span className="text-xs text-muted-foreground ml-2">({item.count} units)</span>
</div>
</div>
<Progress value={(item.revenue / (topVehicles[0]?.revenue || 1)) * 100} className="h-2" />
</div>
))}
{topVehicles.length === 0 && <p className="text-muted-foreground text-center py-4">No sales data</p>}
</CardContent>
</Card>
</div>

<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
<Card className="border border-border">
<CardHeader>
<CardTitle className="flex items-center gap-2">
<Wallet className="h-5 w-5 text-chart-3" />
Vendor Payables
</CardTitle>
<CardDescription>Pending payments by vendor</CardDescription>
</CardHeader>

<CardContent>
{vendorPayables.length === 0 ? (
<p className="text-muted-foreground text-center py-6">
No vendor dues 🎉
</p>
) : (
<ResponsiveContainer width="100%" height={250}>
<BarChart data={vendorPayables} layout="vertical">
<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
<XAxis
type="number"
stroke="hsl(var(--muted-foreground))"
tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
/>
<YAxis
dataKey="name"
type="category"
width={100}
stroke="hsl(var(--muted-foreground))"
/>
<Tooltip
formatter={(value: number) =>
`₹${formatIndianNumber(value)}`
}
contentStyle={{
backgroundColor: "hsl(var(--card))",
border: "1px solid hsl(var(--border))",
borderRadius: "8px",
}}
/>
<Bar
dataKey="value"
fill="hsl(339, 90%, 51%)"
radius={[0, 6, 6, 0]}
name="Pending Amount"
/>
</BarChart>
</ResponsiveContainer>
)}
</CardContent>
</Card>


<Card className="border border-border">
<CardHeader>
<CardTitle>Stock Status</CardTitle>
</CardHeader>
<CardContent>
<ResponsiveContainer width="100%" height={250}>
<PieChart>
<Pie
data={vehicleStatusData.length > 0 ? vehicleStatusData : [{ name: "No Data", value: 1 }]}
cx="50%" cy="50%"
innerRadius={50} outerRadius={80}
paddingAngle={5} dataKey="value" labelLine={false}
label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
>
{vehicleStatusData.map((entry, i) => {
  // Distinct colors for each status
  const statusColors: Record<string, string> = {
    'In Stock': 'hsl(142, 71%, 45%)',
    'Sold': 'hsl(217, 91%, 60%)',
    'Reserved': 'hsl(38, 92%, 50%)',
  };
  return <Cell key={i} fill={statusColors[entry.name] || COLORS[i % COLORS.length]} />;
})}
</Pie>
<Tooltip
contentStyle={{
backgroundColor: 'hsl(var(--card))',
border: '1px solid hsl(var(--border))',
borderRadius: '8px',
color: 'hsl(var(--foreground))',
}}
itemStyle={{
color: 'hsl(var(--foreground))',
}}
labelStyle={{
color: 'hsl(var(--foreground))',
}}
/>
<Legend />
</PieChart>
</ResponsiveContainer>
</CardContent>
</Card>

<Card className="border border-border">
<CardHeader>
<CardTitle>EMI Status</CardTitle>
</CardHeader>
<CardContent>
<ResponsiveContainer width="100%" height={250}>
<PieChart>
<Pie
data={emiData.length > 0 ? emiData : [{ name: "No Data", value: 1 }]}
cx="50%"
cy="50%"
innerRadius={65}
outerRadius={95}
paddingAngle={4}
dataKey="value"
label={false}
labelLine={false}
activeShape={(props) => {
const RADIAN = Math.PI / 180;
const {
cx, cy, midAngle, outerRadius, fill
} = props;

const x = cx + Math.cos(-midAngle * RADIAN) * (outerRadius + 6);
const y = cy + Math.sin(-midAngle * RADIAN) * (outerRadius + 6);

return (
<g>
<Sector {...props} outerRadius={outerRadius + 6} />
<circle cx={x} cy={y} r={3} fill={fill} />
</g>
);
}}
onMouseEnter={(_, index) => setActiveEmi(emiData[index])}
onMouseLeave={() => setActiveEmi(null)}
>
{emiData.map((entry, i) => (
<Cell
key={i}
fill={emiColorMap[entry.name] || COLORS[i % COLORS.length]}
/>
))}
</Pie>

{/* CENTER TEXT */}
<text
x="50%"
y="42%"
textAnchor="middle"
dominantBaseline="middle"
className="fill-muted-foreground text-sm"
>
{activeDisplay.name}
</text>

<text
x="50%"
y="58%"
textAnchor="middle"
dominantBaseline="middle"
style={{
fill: emiColorMap[activeDisplay.name] || "currentColor",
fontSize: "22px",
fontWeight: 700,
}}
>
{activePercent}%
</text>

<Tooltip
contentStyle={{
backgroundColor: 'hsl(var(--card))',
border: '1px solid hsl(var(--border))',
borderRadius: '8px',
color: 'hsl(var(--foreground))',
}}
itemStyle={{
color: 'hsl(var(--foreground))',
}}
labelStyle={{
color: 'hsl(var(--foreground))',
}}
/>

</PieChart>
</ResponsiveContainer>

</CardContent>
</Card>
</div>
</TabsContent>

{/* Sales Tab */}
<TabsContent value="sales" className="space-y-6">
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
<Card className="border border-border">
<CardHeader><CardTitle>Monthly Sales Volume</CardTitle></CardHeader>
<CardContent>
<ResponsiveContainer width="100%" height={300}>
<BarChart data={salesData}>
<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
<XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
<YAxis stroke="hsl(var(--muted-foreground))" />
<Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
<Bar dataKey="sales" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} name="Sales Count" />
<Bar dataKey="purchases" fill="hsl(262, 83%, 58%)" radius={[4, 4, 0, 0]} name="Purchases" />
</BarChart>
</ResponsiveContainer>
</CardContent>
</Card>

<Card className="border border-border">
<CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
<CardContent>
<ResponsiveContainer width="100%" height={300}>
<AreaChart data={salesData}>
<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
<XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
<YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
<Tooltip
contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
formatter={(value: number) => `₹${formatIndianNumber(value)}`}
/>
<Area type="monotone" dataKey="revenue" stroke="hsl(142, 71%, 45%)" fill="hsl(142, 71%, 45%)" fillOpacity={0.3} strokeWidth={2} />
</AreaChart>
</ResponsiveContainer>
</CardContent>
</Card>
</div>

<Card className="border border-border">
<CardHeader><CardTitle>Profit Analysis</CardTitle></CardHeader>
<CardContent>
<ResponsiveContainer width="100%" height={350}>
<AreaChart data={profitData}>
<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
<XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
<YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
<Tooltip
contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
formatter={(value: number) => `₹${formatIndianNumber(value)}`}
/>
<Legend />
<Area type="monotone" dataKey="revenue" stackId="1" stroke="hsl(142, 71%, 45%)" fill="hsl(142, 71%, 45%)" fillOpacity={0.6} name="Revenue" />
<Area type="monotone" dataKey="profit" stackId="2" stroke="hsl(217, 91%, 60%)" fill="hsl(217, 91%, 60%)" fillOpacity={0.8} name="Profit" />
</AreaChart>
</ResponsiveContainer>
</CardContent>
</Card>
</TabsContent>

{/* Inventory Tab */}
<TabsContent value="inventory" className="space-y-6">
{/* Inventory KPIs */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
<Card className="border border-border bg-gradient-to-br from-chart-1/10 to-transparent">
<CardContent className="p-4 text-center">
<p className="text-sm text-muted-foreground">Turnover Ratio</p>
<p className="text-3xl font-bold text-chart-1">{inventoryTurnover.ratio}x</p>
<p className="text-xs text-muted-foreground mt-1">This period</p>
</CardContent>
</Card>
<Card className="border border-border bg-gradient-to-br from-chart-2/10 to-transparent">
<CardContent className="p-4 text-center">
<p className="text-sm text-muted-foreground">Avg Days to Sell</p>
<p className="text-3xl font-bold text-chart-2">{inventoryTurnover.avgDays}</p>
<p className="text-xs text-muted-foreground mt-1">Days</p>
</CardContent>
</Card>
<Card className="border border-border bg-gradient-to-br from-chart-3/10 to-transparent">
<CardContent className="p-4 text-center">
<p className="text-sm text-muted-foreground">In Stock</p>
<p className="text-3xl font-bold text-chart-3">{vehicleStatusData.find(v => v.name === 'In Stock')?.value || 0}</p>
<p className="text-xs text-muted-foreground mt-1">Vehicles</p>
</CardContent>
</Card>
<Card className="border border-border bg-gradient-to-br from-chart-4/10 to-transparent">
<CardContent className="p-4 text-center">
<p className="text-sm text-muted-foreground">Aging 90+ Days</p>
<p className="text-3xl font-bold text-destructive">{vehicleAgingData.find(v => v.name === '90+ days')?.value || 0}</p>
<p className="text-xs text-muted-foreground mt-1">Needs attention</p>
</CardContent>
</Card>
</div>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
<Card className="border border-border">
<CardHeader><CardTitle>Vehicle Aging Analysis</CardTitle><CardDescription>How long vehicles have been in stock</CardDescription></CardHeader>
<CardContent>
<ResponsiveContainer width="100%" height={300}>
<BarChart data={vehicleAgingData}>
<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
<XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
<YAxis stroke="hsl(var(--muted-foreground))" />
<Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
<Bar dataKey="value" name="Vehicles" radius={[4, 4, 0, 0]}>
{vehicleAgingData.map((entry, i) => (
<Cell key={i} fill={entry.name === '90+ days' ? 'hsl(339, 90%, 51%)' : COLORS[i % COLORS.length]} />
))}
</Bar>
</BarChart>
</ResponsiveContainer>
</CardContent>
</Card>

<Card className="border border-border">
<CardHeader><CardTitle>Fuel Type Distribution</CardTitle></CardHeader>
<CardContent>
<ResponsiveContainer width="100%" height={300}>
<PieChart>
<Pie
data={fuelTypeData.length > 0 ? fuelTypeData : [{ name: "No Data", value: 1 }]}
cx="50%" cy="50%"
innerRadius={50}
outerRadius={100}
dataKey="value"
labelLine={false}
label={({ name, value }) => `${name}: ${value}`}
>
{fuelTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
</Pie>
<Tooltip
contentStyle={{
backgroundColor: 'hsl(var(--card))',
border: '1px solid hsl(var(--border))',
borderRadius: '8px',
color: 'hsl(var(--foreground))',
}}
itemStyle={{
color: 'hsl(var(--foreground))',
}}
labelStyle={{
color: 'hsl(var(--foreground))',
}}
/>

<Legend />
</PieChart>
</ResponsiveContainer>
</CardContent>
</Card>
</div>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
<Card className="border border-border">
<CardHeader><CardTitle>Vehicles by Type</CardTitle></CardHeader>
<CardContent>
<ResponsiveContainer width="100%" height={300}>
<PieChart>
<Pie
data={vehicleData.length > 0 ? vehicleData : [{ name: "No Data", value: 1 }]}
cx="50%"
cy="50%"
innerRadius={55}
outerRadius={85}
paddingAngle={4}
dataKey="value"
labelLine={false}
label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
>

{vehicleData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
</Pie>
<Tooltip
contentStyle={{
backgroundColor: 'hsl(var(--card))',
border: '1px solid hsl(var(--border))',
borderRadius: '8px',
color: 'hsl(var(--foreground))',
}}
itemStyle={{
color: 'hsl(var(--foreground))',
}}
labelStyle={{
color: 'hsl(var(--foreground))',
}}
/>

<Legend />
</PieChart>
</ResponsiveContainer>
</CardContent>
</Card>

<Card className="border border-border">
<CardHeader><CardTitle>Stock Status Distribution</CardTitle></CardHeader>
<CardContent>
<ResponsiveContainer width="100%" height={300}>
<BarChart data={vehicleStatusData} layout="vertical">
<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
<XAxis type="number" stroke="hsl(var(--muted-foreground))" />
<YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={80} />
<Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
<Bar dataKey="value" radius={[0, 4, 4, 0]}>
  {vehicleStatusData.map((entry, i) => {
    const statusBarColors: Record<string, string> = {
      'In Stock': 'hsl(142, 71%, 45%)',
      'Sold': 'hsl(217, 91%, 60%)',
      'Reserved': 'hsl(38, 92%, 50%)',
    };
    return <Cell key={i} fill={statusBarColors[entry.name] || COLORS[i % COLORS.length]} />;
  })}
</Bar>
</BarChart>
</ResponsiveContainer>
</CardContent>
</Card>
</div>
</TabsContent>

{/* Customers Tab */}
<TabsContent value="customers" className="space-y-6">
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
<Card className="border border-border">
<CardHeader><CardTitle>New Customers Trend</CardTitle></CardHeader>
<CardContent>
<ResponsiveContainer width="100%" height={300}>
<BarChart data={customerData}>
<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
<XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
<YAxis stroke="hsl(var(--muted-foreground))" />
<Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
<Bar dataKey="customers" fill="hsl(262, 83%, 58%)" radius={[4, 4, 0, 0]} name="New Customers" />
</BarChart>
</ResponsiveContainer>
</CardContent>
</Card>

<Card className="border border-border">
<CardHeader>
<CardTitle>Customer Payment Health</CardTitle>
<CardDescription>Paid vs pending customers</CardDescription>
</CardHeader>
<CardContent>
{customerPaymentHealth.length === 0 ? (
<p className="text-muted-foreground text-center py-6">
No completed sales yet
</p>
) : (
<ResponsiveContainer width="100%" height={300}>
<PieChart>
<Pie
data={customerPaymentHealth}
cx="50%"
cy="50%"
innerRadius={60}
outerRadius={90}
dataKey="value"
paddingAngle={4}
label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
labelLine={false}
>
{customerPaymentHealth.map((entry, i) => {
  const healthColors: Record<string, string> = {
    'Paid': 'hsl(142, 71%, 45%)',
    'Pending': 'hsl(339, 90%, 51%)',
  };
  return <Cell key={i} fill={healthColors[entry.name] || COLORS[i % COLORS.length]} />;
})}
</Pie>
<Tooltip
contentStyle={{
backgroundColor: 'hsl(var(--card))',
border: '1px solid hsl(var(--border))',
borderRadius: '8px',
color: 'hsl(var(--foreground))',
}}
/>
<Legend />
</PieChart>
</ResponsiveContainer>
)}
</CardContent>
</Card>

</div>
</TabsContent>

{/* Payments Tab */}
<TabsContent value="payments" className="space-y-6">
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
<Card className="border border-border">
<CardHeader><CardTitle>Payment by Mode</CardTitle></CardHeader>
<CardContent>
<ResponsiveContainer width="100%" height={300}>
<PieChart>
<Pie
data={paymentData.length > 0 ? paymentData : [{ name: "No Data", value: 1 }]}
cx="50%" cy="50%"
innerRadius={60} outerRadius={100}
paddingAngle={5} dataKey="value" labelLine={false}
label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
>
{paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
</Pie>
<Tooltip
formatter={(value: number) => `₹${formatIndianNumber(value)}`}
contentStyle={{
backgroundColor: 'hsl(var(--card))',
border: '1px solid hsl(var(--border))',
borderRadius: '8px',
color: 'hsl(var(--foreground))',
}}
itemStyle={{
color: 'hsl(var(--foreground))',
}}
labelStyle={{
color: 'hsl(var(--foreground))',
}}
/>


<Legend />
</PieChart>
</ResponsiveContainer>
</CardContent>
</Card>

<Card className="border border-border">
<CardHeader><CardTitle>Collection Summary</CardTitle></CardHeader>
<CardContent className="space-y-6">
<div className="space-y-3">
<div className="flex justify-between items-center">
<span className="text-muted-foreground flex items-center gap-2">
<div className="h-3 w-3 rounded-full bg-chart-2" />
Total Collected
</span>
<span className="font-bold text-chart-2">₹{formatIndianNumber(summary.collectedAmount)}</span>
</div>
<Progress value={(summary.collectedAmount / (summary.collectedAmount + summary.pendingAmount)) * 100} className="h-3" />
</div>
<div className="space-y-3">
<div className="flex justify-between items-center">
<span className="text-muted-foreground flex items-center gap-2">
<div className="h-3 w-3 rounded-full bg-chart-3" />
Pending
</span>
<span className="font-bold text-chart-3">₹{formatIndianNumber(summary.pendingAmount)}</span>
</div>
<Progress value={(summary.pendingAmount / (summary.collectedAmount + summary.pendingAmount)) * 100} className="h-3 [&>div]:bg-chart-3" />
</div>

<div className="pt-4 border-t">
<h4 className="font-medium mb-4">Expense Breakdown</h4>
<div className="space-y-2">
{expenseData.slice(0, 5).map((item, i) => (
<div key={item.name} className="flex items-center justify-between text-sm">
<span className="capitalize text-muted-foreground">{item.name}</span>
<span className="font-medium">₹{formatIndianNumber(item.value)}</span>
</div>
))}
{expenseData.length === 0 && <p className="text-muted-foreground text-sm">No expenses recorded</p>}
</div>
</div>
</CardContent>
</Card>
</div>
</TabsContent>

<TabsContent value="public" className="space-y-6">

  {/* Header row */}
  <div className="flex items-center justify-between">
    <div>
      <h3 className="text-lg font-semibold">Public Page – Daily Analytics</h3>
      <p className="text-sm text-muted-foreground">
        Performance of your public vehicle page for a selected day
      </p>
    </div>

    <input
      type="date"
      value={selectedDate}
      onChange={(e) => setSelectedDate(e.target.value)}
      className="border rounded-md px-3 py-1 text-sm"
    />
  </div>

  {/* Stats row */}
  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-xs text-muted-foreground">Visitors</p>
        <p className="text-2xl font-bold">{dailyStats.visitors}</p>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-xs text-muted-foreground">Views</p>
        <p className="text-2xl font-bold">{dailyStats.views}</p>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-xs text-muted-foreground">Enquiries</p>
        <p className="text-2xl font-bold text-green-600">
          {dailyStats.enquiries}
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-xs text-muted-foreground">CTA Clicks</p>
        <p className="text-2xl font-bold text-blue-600">
          {dailyStats.ctaClicks}
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-xs text-muted-foreground">Score</p>
        <p
          className={`text-2xl font-bold ${
            dailyStats.score >= 70
              ? "text-green-600"
              : dailyStats.score >= 40
              ? "text-orange-500"
              : "text-red-600"
          }`}
        >
          {dailyStats.score}/100
        </p>
      </CardContent>
    </Card>
  </div>

  {/* Simple insight */}
  <Card>
    <CardContent className="p-4 text-sm space-y-1">
      <p>
        👀 <b>{dailyStats.visitors}</b> visitors viewed your public page on{" "}
        {format(new Date(selectedDate), "dd MMM yyyy")}
      </p>
      <p>
        🚗 <b>{dailyStats.views}</b> vehicle views generated
      </p>
      <p>
        📩 <b>{dailyStats.enquiries}</b> enquiries from{" "}
        <b>{dailyStats.vehiclesWithEnquiry}</b> vehicle(s)
      </p>
    </CardContent>
  </Card>


  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">


  <Card className="border border-border">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Car className="h-5 w-5" /> Vehicle Views Distribution
    </CardTitle>
    <CardDescription>
      Which vehicles attracted the most attention
    </CardDescription>
  </CardHeader>

  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={vehicleViewData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={95}
          dataKey="value"
          labelLine={false}
          label={({ name, percent }) =>
            `${name.split(" ")[0]} ${(percent * 100).toFixed(0)}%`
          }
        >
          {vehicleViewData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  </CardContent>
</Card>

<Card className="border border-border">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Users className="h-5 w-5" /> Enquiries by Vehicle
    </CardTitle>
    <CardDescription>
      Which vehicles generated actual leads
    </CardDescription>
  </CardHeader>

  <CardContent>
    {vehicleEnquiryData.length === 0 ? (
      <p className="text-center text-muted-foreground py-8">
        No enquiries received on this day
      </p>
    ) : (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={vehicleEnquiryData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={4}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
          >
            {vehicleEnquiryData.map((_, i) => (
              <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    )}
  </CardContent>
</Card>

<Card className="border border-border">
  <CardHeader>
    <CardTitle>Vehicle Conversion Performance</CardTitle>
    <CardDescription>
      Views vs Enquiries (lead quality indicator)
    </CardDescription>
  </CardHeader>

  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={vehicleConversionData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="vehicle" hide />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="views" fill="hsl(217, 91%, 60%)" />
        <Bar dataKey="enquiries" fill="hsl(142, 71%, 45%)" />
      </BarChart>
    </ResponsiveContainer>
  </CardContent>
</Card>

</div>


<Card className="border border-border">
  <CardHeader>
    <CardTitle>Top Performing Vehicles</CardTitle>
    <CardDescription>
      Sorted by enquiry generation
    </CardDescription>
  </CardHeader>

  <CardContent>
    <table className="w-full text-sm">
      <thead className="border-b bg-muted">
        <tr>
          <th className="p-2 text-left">Vehicle</th>
          <th className="p-2 text-center">Views</th>
          <th className="p-2 text-center">Enquiries</th>
          <th className="p-2 text-center">Conversion</th>
        </tr>
      </thead>
      <tbody>
        {vehicleConversionData.map((v, i) => (
          <tr key={i} className="border-b">
            <td className="p-2">{v.vehicle}</td>
            <td className="p-2 text-center">{v.views}</td>
            <td className="p-2 text-center text-green-600">
              {v.enquiries}
            </td>
            <td
              className={`p-2 text-center font-medium ${
                v.conversion >= 10
                  ? "text-green-600"
                  : v.conversion >= 5
                  ? "text-orange-500"
                  : "text-muted-foreground"
              }`}
            >
              {v.conversion}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </CardContent>
</Card>


</TabsContent>


</Tabs>
)}

{showVehicleDrilldown && activeVehicleLedger && (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
    <div className="bg-background rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative">

      {/* Close */}
      <button
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
        onClick={() => setShowVehicleDrilldown(false)}
      >
        ✕
      </button>

      {/* HEADER */}
      <h2 className="text-xl font-bold mb-4">
        {activeVehicleLedger.vehicle} — Profit Breakdown
      </h2>

      {/* SNAPSHOT */}
      <div className="grid grid-cols-3 gap-4 text-sm mb-6">
        <div>
          <p className="text-muted-foreground">Purchase</p>
          <p className="font-medium">
            ₹{formatIndianNumber(activeVehicleLedger.purchase_price)}
          </p>
        </div>

        <div>
          <p className="text-muted-foreground">Sale</p>
          <p className="font-medium">
            ₹{formatIndianNumber(activeVehicleLedger.sale_price)}
          </p>
        </div>

        <div>
          <p className="text-muted-foreground">Total Profit</p>
          <p className="font-medium text-green-600">
            ₹{formatIndianNumber(
              activeVehicleLedger.sale_price -
              activeVehicleLedger.purchase_price
            )}
          </p>
        </div>
      </div>

      {/* PROFIT PROGRESS */}
      {(() => {
        const totalProfit =
          activeVehicleLedger.sale_price -
          activeVehicleLedger.purchase_price;

        const percent =
          totalProfit > 0
            ? Math.round(
                (activeVehicleLedger.realised_profit / totalProfit) * 100
              )
            : 0;

        return (
          <div className="mb-6">
            <p className="text-sm mb-2">
              Profit Realised:{" "}
              <span className="font-medium text-green-600">
                ₹{formatIndianNumber(activeVehicleLedger.realised_profit)}
              </span>{" "}
              / ₹{formatIndianNumber(totalProfit)}
            </p>

            <Progress value={percent} className="h-3" />
          </div>
        );
      })()}

      {/* PAYMENT / PROFIT TABLE */}
      <div className="border rounded-lg overflow-hidden text-sm">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">Type</th>
              <th className="p-2">Collected</th>
              <th className="p-2">Profit Unlocked</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2">Principal Collected</td>
              <td className="p-2">
                ₹{formatIndianNumber(activeVehicleLedger.principal_collected)}
              </td>
              <td className="p-2 text-green-600">
                ₹{formatIndianNumber(activeVehicleLedger.realised_profit)}
              </td>
            </tr>

            <tr>
              <td className="p-2">Pending</td>
              <td className="p-2 text-red-600">
                ₹{formatIndianNumber(activeVehicleLedger.customer_pending)}
              </td>
              <td className="p-2 text-orange-600">
                ₹{formatIndianNumber(activeVehicleLedger.profit_pending)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* FOOTER NOTE */}
      <p className="text-xs text-muted-foreground mt-4">
        Profit is unlocked proportionally as principal is collected.
        Interest is excluded from profit.
      </p>

    </div>
  </div>
)}



</div>
);
};

export default Reports;