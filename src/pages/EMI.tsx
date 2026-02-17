import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { format, addMonths } from "date-fns";
import { ArrowLeft, Car, User, DollarSign, Calendar, CreditCard, Settings2, Plus, Search } from "lucide-react";
import { formatCurrency, formatIndianNumber } from "@/lib/formatters";
import type { Database } from "@/integrations/supabase/types";
import { PageSkeleton } from "@/components/ui/page-skeleton";

type EMISchedule = Database["public"]["Tables"]["emi_schedules"]["Row"];
type Sale = Database["public"]["Tables"]["sales"]["Row"];
type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type Customer = Database["public"]["Tables"]["customers"]["Row"];

const EMI = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [emis, setEmis] = useState<EMISchedule[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [emiInterestCollected, setEmiInterestCollected] = useState(0);
const [emiInterestPending, setEmiInterestPending] = useState(0);
const [emiAmountCollected, setEmiAmountCollected] = useState(0);
const [emiAmountPending, setEmiAmountPending] = useState(0);

  const [loanClosed, setLoanClosed] = useState(false);

  

  // Detail view state
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [detailView, setDetailView] = useState(false);

  const [emiDocuments, setEmiDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedEmiDoc, setSelectedEmiDoc] = useState<string | null>(null);
  const [emiDocViewerOpen, setEmiDocViewerOpen] = useState(false);


  
  // Dialogs
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedEmi, setSelectedEmi] = useState<EMISchedule | null>(null);
  const [selectedSaleForConfig, setSelectedSaleForConfig] = useState<Sale | null>(null);

  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  
  // EMI Configuration
  const [emiConfig, setEmiConfig] = useState({
    tenure: 12,
    interestRate: 10,
    startDate: new Date().toISOString().split('T')[0],
  });
  
  // Payment form
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<string>("cash");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
  if (!selectedSaleId) return;

  supabase
    .from("emi_documents")
    .select("*")
    .eq("reference_type", "emi")
    .eq("reference_id", selectedSaleId)
    .order("created_at", { ascending: false })
    .then(({ data }) => {
      setEmiDocuments(data || []);
    });
}, [selectedSaleId]);


  const fetchData = async () => {
    try {
      // Get current user for explicit filtering
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const [emisRes, salesRes, vehiclesRes, customersRes] = await Promise.all([
        supabase.from("emi_schedules").select("*").eq("user_id", user.id).order("due_date", { ascending: true }),
        supabase.from("sales").select("*").eq("is_emi", true).eq("user_id", user.id),
        supabase.from("vehicles").select("*").eq("user_id", user.id),
        supabase.from("customers").select("*").eq("user_id", user.id),
      ]);
      setEmis(emisRes.data || []);
      setSales(salesRes.data || []);
      setVehicles(vehiclesRes.data || []);
      setCustomers(customersRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSaleInfo = (saleId: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return { sale: null, vehicle: null, customer: null };
    const vehicle = vehicles.find(v => v.id === sale.vehicle_id);
    const customer = customers.find(c => c.id === sale.customer_id);
    return { sale, vehicle, customer };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-chart-2 text-white";
      case "overdue": return "bg-destructive text-white";
      case "pending": return "bg-chart-3 text-white";
      case "partially_paid": return "bg-chart-4 text-white";
      default: return "bg-muted";
    }
  };

  const uploadEmiDocument = async (file: File) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !selectedSaleId) return;

  try {
    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${selectedSaleId}/${Date.now()}.${fileExt}`;

    // 1️⃣ Upload to bucket
    const { error: uploadError } = await supabase.storage
      .from("emidocuments")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 2️⃣ Get public URL
    const { data } = supabase.storage
      .from("emidocuments")
      .getPublicUrl(filePath);

    // 3️⃣ Save DB record
    await supabase.from("emi_documents").insert({
      user_id: user.id,
      reference_type: "emi",
      reference_id: selectedSaleId,
      document_name: file.name,
      document_type: "emi_document",
      document_url: data.publicUrl,
    });

    toast({ title: "Document uploaded successfully" });

    // Refresh list
    const { data: docs } = await supabase
      .from("emi_documents")
      .select("*")
      .eq("reference_type", "emi")
      .eq("reference_id", selectedSaleId)
      .order("created_at", { ascending: false });

    setEmiDocuments(docs || []);
  } catch (err: any) {
    toast({
      title: "Upload failed",
      description: err.message,
      variant: "destructive",
    });
  } finally {
    setUploading(false);
  }
};


  const openConfigDialog = (sale: Sale) => {
    setSelectedSaleForConfig(sale);
    setEmiConfig({
      tenure: 12,
      interestRate: 10,
      startDate: new Date().toISOString().split('T')[0],
    });
    setConfigDialogOpen(true);
  };

  const openPaymentDialog = (emi: EMISchedule) => {
    setSelectedEmi(emi);
    setPaymentAmount(emi.emi_amount - (emi.amount_paid || 0));
    setPaymentDialogOpen(true);
  };

  const calculateEMI = (principal: number, rate: number, tenure: number) => {
    if (rate === 0) return principal / tenure;
    const monthlyRate = rate / 12 / 100;
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenure) / (Math.pow(1 + monthlyRate, tenure) - 1);
    return Math.round(emi);
  };

  const generateEMISchedule = async () => {
  if (!selectedSaleForConfig) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const principal =
    Number(selectedSaleForConfig.total_amount) -
    Number(selectedSaleForConfig.down_payment || 0);

  const tenure = Number(emiConfig.tenure);
  const annualRate = Number(emiConfig.interestRate);
  const monthlyRate = annualRate / 12 / 100;

  const emiAmount = calculateEMI(principal, annualRate, tenure);
  const startDate = new Date(emiConfig.startDate);

  let remainingPrincipal = principal;
  const schedules: any[] = [];

  for (let i = 1; i <= tenure; i++) {
  const interestComponent = Math.round(remainingPrincipal * monthlyRate);

  // 🔑 DEFAULT principal
  let principalComponent = Math.round(emiAmount - interestComponent);

  // 🔒 LAST EMI FORCE ADJUSTMENT
  if (i === tenure) {
    principalComponent = remainingPrincipal;
  }

  remainingPrincipal = Math.max(
    remainingPrincipal - principalComponent,
    0
  );

  schedules.push({
    sale_id: selectedSaleForConfig.id,
    user_id: user.id,
    emi_number: i,
    emi_amount: emiAmount,
    principal_component: principalComponent,
    interest_component: interestComponent,
    interest_paid: 0,
    due_date: addMonths(startDate, i).toISOString().split("T")[0],
    status: "pending",
    amount_paid: 0,
  });
}


  try {
    await supabase
      .from("emi_schedules")
      .delete()
      .eq("sale_id", selectedSaleForConfig.id);

    const { error } = await supabase
      .from("emi_schedules")
      .insert(schedules);

    if (error) throw error;

    // ✅ MARK EMI AS CONFIGURED
await supabase
  .from("sales")
  .update({ emi_configured: true })
  .eq("id", selectedSaleForConfig.id);


    toast({ title: "EMI schedule generated successfully" });
    setConfigDialogOpen(false);
    fetchData();
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
  }
};


  const recordPayment = async () => {
  if (!selectedEmi || paymentAmount <= 0 || isRecordingPayment) return;

  setIsRecordingPayment(true);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    setIsRecordingPayment(false);
    return;
  }

  try {
    const interestRemaining =
      Number(selectedEmi.interest_component || 0) -
      Number(selectedEmi.interest_paid || 0);

    const interestPaidNow = Math.min(interestRemaining, paymentAmount);

let principalPaidNow = paymentAmount - interestPaidNow;

// 🔒 LAST EMI FORCE CLOSE (₹1–₹10 protection)
const isLastEmi =
  selectedEmi.emi_number ===
  emis.filter(e => e.sale_id === selectedEmi.sale_id).length;

const remainingPrincipal =
  Number(selectedEmi.principal_component || 0) -
  Number(selectedEmi.principal_paid || 0);

if (isLastEmi && remainingPrincipal <= 10) {
  principalPaidNow = remainingPrincipal;
}

    const newInterestPaid =
      Number(selectedEmi.interest_paid || 0) + interestPaidNow;

    const newAmountPaid =
      Number(selectedEmi.amount_paid || 0) + paymentAmount;

    const remainingAfterPayment =
  selectedEmi.emi_amount - newAmountPaid;

const newStatus =
  remainingAfterPayment <= 10 ? "paid" : "partially_paid";


    // 🔒 Update EMI
    await supabase
  .from("emi_schedules")
  .update({
    amount_paid: newAmountPaid,
    interest_paid: newInterestPaid,
    principal_paid:
      Number(selectedEmi.principal_paid || 0) + principalPaidNow,
    status: newStatus,
    paid_date:
      newStatus === "paid"
        ? new Date().toISOString().split("T")[0]
        : null,
  })
  .eq("id", selectedEmi.id);


    // 🔒 Insert payment record
    await supabase.from("payments").insert({
  user_id: user.id,
  payment_number: `PAY${Date.now().toString(36).toUpperCase()}`,

  payment_type: "emi_payment",
  payment_purpose: "emi_installment", // ✅

  amount: paymentAmount,
  payment_mode: paymentMode as any,
  payment_date: new Date().toISOString().split("T")[0],

  // 🔒 MUST point to EMI row
  reference_type: "emi",
  reference_id: selectedEmi.id,

  principal_amount: principalPaidNow,
  interest_amount: interestPaidNow,
  profit_amount: 0,
  effective_date: selectedEmi.due_date,

  description: `EMI #${selectedEmi.emi_number}`,
});



    const { sale } = getSaleInfo(selectedEmi.sale_id);
    if (sale) {
      // ONLY principal should affect sale balance
await supabase.from("sales").update({
  amount_paid:
    Number(sale.amount_paid || 0) + principalPaidNow,
  balance_amount:
    Math.max(
      Number(sale.balance_amount || 0) - principalPaidNow,
      0
    ),
}).eq("id", sale.id);

    }

    toast({ title: "Payment recorded successfully" });

    setPaymentDialogOpen(false);
    fetchData();
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
  } finally {
    setIsRecordingPayment(false);
  }
};


  // Get EMI sales that don't have schedules yet
  const salesWithoutSchedule = sales.filter(s => 
    s.is_emi && !emis.some(e => e.sale_id === s.id)
  );

  // Group EMIs by sale
  const emisBySale = emis.reduce((acc: Record<string, EMISchedule[]>, emi) => {
    if (!acc[emi.sale_id]) acc[emi.sale_id] = [];
    acc[emi.sale_id].push(emi);
    return acc;
  }, {});

  // Get summary data for each sale
  const getSaleSummary = (saleId: string) => {
    const saleEmis = emisBySale[saleId] || [];
    const { vehicle, customer, sale } = getSaleInfo(saleId);
    
    const upcomingDue = saleEmis
      .filter(e => e.status === 'pending' || e.status === 'partially_paid')
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];
    
    const lastPaid = saleEmis
      .filter(e => e.status === 'paid')
      .sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())[0];
    
    const totalPaid = saleEmis.reduce((sum, e) => sum + (e.amount_paid || 0), 0);
    const totalAmount = saleEmis.reduce((sum, e) => sum + e.emi_amount, 0);
    const paidCount = saleEmis.filter(e => e.status === 'paid').length;
    const overdueCount = saleEmis.filter(e => e.status === 'pending' && new Date(e.due_date) < new Date()).length;
    
    return {
      vehicle,
      customer,
      sale,
      upcomingDue,
      lastPaid,
      totalPaid,
      totalAmount,
      paidCount,
      totalEmis: saleEmis.length,
      overdueCount,
    };
  };

  // Filter sales with EMI schedules
  const emiSales = Object.keys(emisBySale).map(saleId => ({
    saleId,
    ...getSaleSummary(saleId),
  })).filter(s => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      s.vehicle?.brand?.toLowerCase().includes(search) ||
      s.vehicle?.model?.toLowerCase().includes(search) ||
      s.customer?.full_name?.toLowerCase().includes(search) ||
      s.sale?.sale_number?.toLowerCase().includes(search)
    );
  });

  // Stats
  const totalEMIs = emis.length;
  const pendingEMIs = emis.filter(
  e =>
    e.status === "pending" &&
    new Date(e.due_date) <= new Date()
).length;

  const overdueEMIs = emis.filter(e => e.status === 'overdue' || (e.status === 'pending' && new Date(e.due_date) < new Date())).length;
  const paidEMIs = emis.filter(e => e.status === 'paid').length;
  const totalDueThisMonth = emis
  .filter(
    e =>
      e.status === "pending" &&
      new Date(e.due_date).getMonth() === new Date().getMonth() &&
      new Date(e.due_date).getFullYear() === new Date().getFullYear()
  )
  .reduce((sum, e) => sum + e.emi_amount, 0);



  // -------- EMI FINANCIAL CALCULATION --------
// -------- EMI FINANCIAL CALCULATION (CORRECT SEMANTICS) --------
useEffect(() => {
  let interestCollected = 0;
  let interestDueTillToday = 0;
  let emiCollected = 0;
  let loanOutstanding = 0;

  const today = new Date();

  emis.forEach((emi) => {
    // Interest actually collected
    interestCollected += Number(emi.interest_paid || 0);

    // Interest DUE only if EMI date passed
    if (new Date(emi.due_date) <= today) {
      interestDueTillToday +=
        Number(emi.interest_component || 0) -
        Number(emi.interest_paid || 0);
    }

    // EMI collected (full amount paid)
    emiCollected += Number(emi.amount_paid || 0);

    // Loan outstanding (future + due EMI balances)
    const diff =
      Number(emi.emi_amount) - Number(emi.amount_paid || 0);

    loanOutstanding += diff > 0 && diff <= 10 ? 0 : diff;
  });

  setEmiInterestCollected(interestCollected);
  setEmiInterestPending(interestDueTillToday); // 🔑 FIX
  setEmiAmountCollected(emiCollected);
  setEmiAmountPending(loanOutstanding);        // 🔑 FIX
}, [emis]);




  if (loading) {
    return <PageSkeleton />;
  }

  // Detail View
  if (detailView && selectedSaleId) {
    const { vehicle, customer, sale } = getSaleInfo(selectedSaleId);
    const saleEmis = emisBySale[selectedSaleId] || [];

    



const totalPaid = saleEmis.reduce(
  (sum, e) => sum + (e.amount_paid || 0),
  0
);

const totalAmount = saleEmis.reduce(
  (sum, e) => sum + e.emi_amount,
  0
);

const principal = sale
  ? Number(sale.total_amount) - Number(sale.down_payment || 0)
  : 0;

const totalInterest = totalAmount - principal;


const interestCollected = saleEmis.reduce(
  (sum, e) => sum + (e.interest_paid || 0),
  0
);

const interestPending = totalInterest - interestCollected;

const progress =
  totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;

// Interest rate (derived from first EMI)
const interestRate =
  saleEmis.length > 0 && saleEmis[0].principal_component
    ? (
        ((saleEmis[0].interest_component || 0) /
          saleEmis[0].principal_component) *
        12 *
        100
      ).toFixed(1)
    : "0";

    const isLoanFullyPaid =
  saleEmis.length > 0 &&
  saleEmis.every(e =>
    e.status === "paid" ||
    (e.emi_amount - (e.amount_paid || 0)) <= 10
  );


const roundingDifference = saleEmis.reduce(
  (sum, e) => sum + Math.max(e.emi_amount - (e.amount_paid || 0), 0),
  0
);


const needsFinalConfirmation =
  isLoanFullyPaid && roundingDifference > 0 && roundingDifference <= 10;



    return (
      <div className="space-y-6 animate-fade-in">
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => { setDetailView(false); setSelectedSaleId(null); }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">EMI Details</h1>
            <p className="text-muted-foreground">{sale?.sale_number}</p>
          </div>

          {/* 🔔 EMI Rounding Information */}
<div className="flex justify-end">
  <div className="max-w-xl bg-blue-50 border border-blue-200 text-blue-900 rounded-lg px-4 py-3 text-sm">
    <p className="font-medium">EMI Rounding Information</p>
    <p className="mt-1 text-xs leading-relaxed">
      EMIs are calculated using standard financial rounding.  
      In rare cases, the final EMI may differ by ₹1–₹10 due to rounding.
      This adjustment is normal and will be transparently settled during loan closure.
    </p>
  </div>
</div>

        </div>

        

        {/* Vehicle & Customer Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Car className="h-5 w-5 text-chart-1" /> Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-muted-foreground">Vehicle:</span><p className="font-medium">{vehicle?.brand} {vehicle?.model} {vehicle?.variant}</p></div>
                <div><span className="text-muted-foreground">Year:</span><p className="font-medium">{vehicle?.manufacturing_year}</p></div>
                <div><span className="text-muted-foreground">Registration:</span><p className="font-medium">{vehicle?.registration_number || 'N/A'}</p></div>
                <div><span className="text-muted-foreground">Color:</span><p className="font-medium">{vehicle?.color || 'N/A'}</p></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-5 w-5 text-chart-2" /> Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-muted-foreground">Name:</span><p className="font-medium">{customer?.full_name}</p></div>
                <div><span className="text-muted-foreground">Phone:</span><p className="font-medium">{customer?.phone}</p></div>
                <div><span className="text-muted-foreground">Email:</span><p className="font-medium">{customer?.email || 'N/A'}</p></div>
                <div><span className="text-muted-foreground">DL No:</span><p className="font-medium">{customer?.driving_license_number || 'N/A'}</p></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* EMI Summary */}
        <Card className="border border-border">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CardTitle>EMI Summary</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Total: {formatCurrency(sale?.total_amount || 0)} | Down Payment: {formatCurrency(sale?.down_payment || 0)} | 
                  Financed: {formatCurrency((sale?.total_amount || 0) - (sale?.down_payment || 0))}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Progress</p>
                <div className="w-48 h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-chart-2 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(totalPaid)} / {formatCurrency(totalAmount)} ({progress.toFixed(1)}%)
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>EMI #</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>EMI Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saleEmis.map((emi) => {
  const rawBalance = emi.emi_amount - (emi.amount_paid || 0);
  const balance = rawBalance > 0 && rawBalance <= 10 ? 0 : rawBalance;
  const isOverdue =
    emi.status === "pending" && new Date(emi.due_date) < new Date();

  return (
    <TableRow key={emi.id} className={isOverdue ? "bg-destructive/5" : ""}>
      <TableCell className="font-medium">{emi.emi_number}</TableCell>
      <TableCell>{format(new Date(emi.due_date), "dd MMM yyyy")}</TableCell>
      <TableCell>{formatCurrency(emi.emi_amount)}</TableCell>
      <TableCell className="text-chart-2">
        {formatCurrency(emi.amount_paid || 0)}
      </TableCell>

      {/* ✅ BALANCE (CORRECT PLACE) */}
      <TableCell className={balance > 0 ? "text-chart-3" : ""}>
        {formatCurrency(balance)}
      </TableCell>

      <TableCell>
        {emi.paid_date
          ? format(new Date(emi.paid_date), "dd MMM yyyy")
          : "-"}
      </TableCell>

      <TableCell>
        <Badge
          className={
            isOverdue
              ? "bg-destructive text-white"
              : getStatusColor(emi.status)
          }
        >
          {isOverdue ? "overdue" : emi.status.replace("_", " ")}
        </Badge>
      </TableCell>

      <TableCell className="text-right">
        {emi.status !== "paid" && !loanClosed && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => openPaymentDialog(emi)}
          >
            <DollarSign className="h-4 w-4 mr-1" /> Pay
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
})}

              </TableBody>
            </Table>
          </CardContent>
        </Card>

        

<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <Card className="border border-border">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <DollarSign className="h-5 w-5 text-purple-600" />
      EMI Interest & Finance Details
    </CardTitle>
  </CardHeader>

  <CardContent>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

      <div>
        <p className="text-xs text-muted-foreground">Financed Amount</p>
        <p className="text-lg font-semibold">
          {formatCurrency(principal)}
        </p>
      </div>

      <div>
        <p className="text-xs text-muted-foreground">Interest Rate</p>
        <p className="text-lg font-semibold text-purple-600">
          {interestRate}% p.a.
        </p>
      </div>

      <div>
        <p className="text-xs text-muted-foreground">EMI Type</p>
        <p className="text-lg font-semibold">
          Reducing Balance
        </p>
      </div>

      <div>
        <p className="text-xs text-muted-foreground">Total Interest</p>
        <p className="text-lg font-semibold">
          {formatCurrency(totalInterest)}
        </p>
      </div>

      <div>
        <p className="text-xs text-muted-foreground">Interest Collected</p>
        <p className="text-lg font-semibold text-green-600">
          {formatCurrency(interestCollected)}
        </p>
      </div>

      <div>
        <p className="text-xs text-muted-foreground">Interest Pending</p>
        <p className="text-lg font-semibold text-orange-500">
          {formatCurrency(interestPending)}
        </p>
      </div>

    </div>
  </CardContent>
</Card>

<Card className="border border-border">
  <CardHeader className="flex flex-row items-center justify-between">
    <CardTitle className="flex items-center gap-2">
      📄 EMI Documents
    </CardTitle>

    <Button size="sm" variant="outline" disabled={uploading}>
  <label className="flex items-center gap-2 cursor-pointer">
    <Plus className="h-4 w-4" />
    {uploading ? "Uploading..." : "Upload"}
    <input
      type="file"
      hidden
      accept=".pdf,.jpg,.jpeg,.png"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) uploadEmiDocument(file);
      }}
    />
  </label>
</Button>

  </CardHeader>

  <CardContent className="space-y-3">
    {emiDocuments.length === 0 ? (
      <p className="text-sm text-muted-foreground">
        No EMI documents uploaded yet
      </p>
    ) : (
      emiDocuments.map(doc => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
        >
          <div>
            <p className="font-medium text-sm">{doc.document_name}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {doc.document_type.replace("_", " ")}
            </p>
          </div>

          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.document_url);
                const isPdf = /\.pdf$/i.test(doc.document_url);
                if (isImage || isPdf) {
                  setSelectedEmiDoc(doc.document_url);
                  setEmiDocViewerOpen(true);
                } else {
                  window.open(doc.document_url, "_blank");
                }
              }}
            >
              View
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.open(doc.document_url, "_blank")}
            >
              ↗
            </Button>
          </div>
        </div>
      ))
    )}
  </CardContent>
</Card>


</div>


        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment - EMI #{selectedEmi?.emi_number}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">EMI Amount:</span></div>
                  <div className="font-medium">{formatCurrency(selectedEmi?.emi_amount || 0)}</div>
                  <div><span className="text-muted-foreground">Already Paid:</span></div>
                  <div className="font-medium text-chart-2">{formatCurrency(selectedEmi?.amount_paid || 0)}</div>
                  <div><span className="text-muted-foreground">Balance:</span></div>
                  <div className="font-medium text-chart-3">{formatCurrency((selectedEmi?.emi_amount || 0) - (selectedEmi?.amount_paid || 0))}</div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Payment Amount</Label>
                <Input 
                  type="number" 
                  value={paymentAmount} 
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)} 
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
              <Button
  onClick={recordPayment}
  disabled={isRecordingPayment}
  className={`transition-opacity ${
    isRecordingPayment ? "opacity-50 cursor-not-allowed" : ""
  }`}
>
  {isRecordingPayment ? "Recording..." : "Record Payment"}
</Button>

            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
    );
  }

  // Main EMI List View
  return (
    <div className="space-y-6 animate-fade-in">
      {/* EMI Financial Summary */}


      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">EMI Management</h1>
          <p className="text-muted-foreground">Track and manage EMI payments</p>
        </div>
      </div>

      {/* Stats Cards */}
      
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <Card>
    <CardContent className="p-4">
      <p className="text-xs text-muted-foreground uppercase">Interest Collected</p>
      <p className="text-xl font-bold text-green-600">
        ₹{formatIndianNumber(Math.round(emiInterestCollected))}
      </p>
    </CardContent>
  </Card>

  <Card>
    <CardContent className="p-4">
      <p className="text-xs text-muted-foreground uppercase">
  Interest Due (Till Today)
</p>

      <p className="text-xl font-bold text-orange-500">
        ₹{formatIndianNumber(Math.round(emiInterestPending))}
      </p>
    </CardContent>
  </Card>

  <Card>
    <CardContent className="p-4">
      <p className="text-xs text-muted-foreground uppercase">EMI Collected</p>
      <p className="text-xl font-bold text-chart-2">
        ₹{formatIndianNumber(Math.round(emiAmountCollected))}
      </p>
    </CardContent>
  </Card>

  <Card>
    <CardContent className="p-4">
      <p className="text-xs text-muted-foreground uppercase">
  Loan Outstanding
</p>

      <p className="text-xl font-bold text-destructive">
        ₹{formatIndianNumber(Math.round(emiAmountPending))}
      </p>
    </CardContent>
  </Card>
</div>
<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Total EMIs</p>
                <p className="text-xl font-bold">{totalEMIs}</p>
              </div>
              <Calendar className="h-6 w-6 text-chart-1" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Pending</p>
                <p className="text-xl font-bold text-chart-3">{pendingEMIs}</p>
              </div>
              <DollarSign className="h-6 w-6 text-chart-3" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Overdue</p>
                <p className="text-xl font-bold text-destructive">{overdueEMIs}</p>
              </div>
              <DollarSign className="h-6 w-6 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Paid</p>
                <p className="text-xl font-bold text-chart-2">{paidEMIs}</p>
              </div>
              <DollarSign className="h-6 w-6 text-chart-2" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">
  Due This Month
</p>
<p className="text-xl font-bold">
  {formatCurrency(totalDueThisMonth)}
</p>

              </div>
              <CreditCard className="h-6 w-6 text-chart-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales needing EMI configuration */}
      {salesWithoutSchedule.length > 0 && (
        <Card className="border-2 border-chart-3">
          <CardHeader>
            <CardTitle className="text-chart-3 flex items-center gap-2 text-base">
              <Settings2 className="h-5 w-5" /> Configure EMI for Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {salesWithoutSchedule.map(sale => {
                const { vehicle, customer } = getSaleInfo(sale.id);
                return (
                  <div key={sale.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{sale.sale_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {vehicle?.brand} {vehicle?.model} • {customer?.full_name}
                      </p>
                      <p className="text-sm">Balance: {formatCurrency(sale.total_amount - (sale.down_payment || 0))}</p>
                    </div>
                    <Button 
                      onClick={() => openConfigDialog(sale)} 
                      size="sm" 
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" /> Generate Schedule
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* EMI Sales List */}
      <Card className="border border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle>EMI Accounts ({emiSales.length})</CardTitle>
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="scrollbar-hide overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Upcoming Due</TableHead>
                <TableHead>Last Payment</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emiSales.map(({ saleId, vehicle, customer, upcomingDue, lastPaid, paidCount, totalEmis, overdueCount }) => (
                <TableRow 
                  key={saleId} 
                  className="cursor-pointer hover:bg-muted/50" 
                  onClick={() => { setSelectedSaleId(saleId); setDetailView(true); }}
                >
                  <TableCell className="font-medium">{vehicle?.brand} {vehicle?.model}</TableCell>
                  <TableCell>{customer?.full_name}</TableCell>
                  <TableCell>
                    {upcomingDue ? (
                      <div>
                        <p className="font-medium">{format(new Date(upcomingDue.due_date), "dd MMM yyyy")}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(upcomingDue.emi_amount)}</p>
                      </div>
                    ) : (
                      <span className="text-chart-2">All Paid</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {lastPaid ? (
                      <Badge className="bg-chart-2 text-white">EMI #{lastPaid.emi_number} Paid</Badge>
                    ) : (
                      <span className="text-muted-foreground">No payments</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-chart-2" style={{ width: `${(paidCount / totalEmis) * 100}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{paidCount}/{totalEmis}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {overdueCount > 0 ? (
                      <Badge className="bg-destructive text-white">{overdueCount} Overdue</Badge>
                    ) : paidCount === totalEmis ? (
                      <Badge className="bg-chart-2 text-white">Completed</Badge>
                    ) : (
                      <Badge className="bg-chart-3 text-white">Active</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {emiSales.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No EMI accounts found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Config Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure EMI Schedule</DialogTitle>
          </DialogHeader>
          {selectedSaleForConfig && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Financed Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(selectedSaleForConfig.total_amount - (selectedSaleForConfig.down_payment || 0))}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tenure (Months)</Label>
                  <Input 
                    type="number" 
                    value={emiConfig.tenure} 
                    onChange={(e) => setEmiConfig({ ...emiConfig, tenure: parseInt(e.target.value) || 12 })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Interest Rate (%)</Label>
                  <Input 
                    type="number" 
                    step="0.1"
                    value={emiConfig.interestRate} 
                    onChange={(e) => setEmiConfig({ ...emiConfig, interestRate: parseFloat(e.target.value) || 0 })} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input 
                  type="date" 
                  value={emiConfig.startDate} 
                  onChange={(e) => setEmiConfig({ ...emiConfig, startDate: e.target.value })} 
                />
              </div>
              <div className="p-4 bg-chart-2/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Monthly EMI</p>
                <p className="text-2xl font-bold text-chart-2">
                  {formatCurrency(calculateEMI(
                    selectedSaleForConfig.total_amount - (selectedSaleForConfig.down_payment || 0),
                    emiConfig.interestRate,
                    emiConfig.tenure
                  ))}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
  {(() => {
  const principal =
    Number(selectedSaleForConfig.total_amount) -
    Number(selectedSaleForConfig.down_payment || 0);

  const emi = calculateEMI(
    principal,
    emiConfig.interestRate,
    emiConfig.tenure
  );

  return (
    <>
      <div>
        <p className="text-muted-foreground">Total Interest</p>
        <p className="font-semibold">
          {formatCurrency(emi * emiConfig.tenure - principal)}
        </p>
      </div>

      <div>
        <p className="text-muted-foreground">Total Payable</p>
        <p className="font-semibold">
          {formatCurrency(emi * emiConfig.tenure)}
        </p>
      </div>
    </>
  );
})()}

</div>

            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>Cancel</Button>
            <Button onClick={generateEMISchedule}>Generate Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EMI;
