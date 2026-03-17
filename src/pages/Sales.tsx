import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Search, Eye, FileText, Download, X } from "lucide-react";
import ViewToggle from "@/components/ViewToggle";
import { useViewMode } from "@/hooks/useViewMode";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/formatters";
import { generateSaleInvoicePDF } from "@/lib/pdfGenerator";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import type { Database } from "@/integrations/supabase/types";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { getEffectiveBalance } from "@/lib/accounting";


// formats number to Indian comma style
const formatIndianInput = (value: string) => {
  const num = value.replace(/,/g, "").replace(/[^\d]/g, "");
  if (!num) return "";
  return Number(num).toLocaleString("en-IN");
};

// converts formatted value back to number
const parseIndianInput = (value: string) =>
  Number(value.replace(/,/g, "")) || 0;





type Sale = Database["public"]["Tables"]["sales"]["Row"];
type SaleInsert = Database["public"]["Tables"]["sales"]["Insert"];
type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type Customer = Database["public"]["Tables"]["customers"]["Row"];
type Settings = Database["public"]["Tables"]["settings"]["Row"];

const paymentModes = ["cash", "bank_transfer", "cheque", "upi", "card", "emi"] as const;
const saleStatuses = ["inquiry", "reserved", "completed", "cancelled"] as const;

const Sales = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { viewMode, setViewMode } = useViewMode("sales");

  const { data: pageData, isLoading: loading } = useQuery({
    queryKey: ['sales-page'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const [salesRes, vehiclesRes, customersRes, settingsRes] = await Promise.all([
        supabase.from("sales").select("id, sale_number, vehicle_id, customer_id, selling_price, discount, tax_amount, total_amount, down_payment, amount_paid, balance_amount, payment_mode, status, is_emi, emi_configured, annual_interest_rate, notes, sale_date, created_at, user_id").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("vehicles").select("id, brand, model, variant, status, selling_price, manufacturing_year, registration_number, vehicle_type").eq("user_id", user.id),
        supabase.from("customers").select("id, full_name, phone, email, code").eq("is_active", true).eq("user_id", user.id),
        supabase.from("settings").select("dealer_name, dealer_address, dealer_phone, dealer_email, dealer_gst, shop_logo_url, sale_prefix, tax_rate, currency").eq("user_id", user.id).maybeSingle(),
      ]);
      return {
        sales: (salesRes.data || []) as Sale[],
        vehicles: (vehiclesRes.data || []) as Vehicle[],
        customers: (customersRes.data || []) as Customer[],
        settings: settingsRes.data as Settings | null,
      };
    },
    staleTime: 2 * 60 * 1000,
  });

  const sales = pageData?.sales || [];
  const vehicles = pageData?.vehicles || [];
  const customers = pageData?.customers || [];
  const settings = pageData?.settings || null;

  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<typeof paymentModes[number]>("cash");
  const [addingPayment, setAddingPayment] = useState(false);

  const paymentExceedsBalance =
    selectedSale && paymentAmount > selectedSale.balance_amount;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enableTax, setEnableTax] = useState(false);
  const [additionalCharges, setAdditionalCharges] = useState<{name: string; amount: number; display: string}[]>([]);
  const [displayValues, setDisplayValues] = useState({
    selling_price: "",
    discount: "",
    tax_amount: "",
    down_payment: "",
    amount_paid: "",
  });

  const [formData, setFormData] = useState<Partial<SaleInsert>>({
    vehicle_id: "",
    customer_id: "",
    selling_price: 0,
    discount: 0,
    tax_amount: 0,
    total_amount: 0,
    down_payment: 0,
    amount_paid: 0,
    payment_mode: "cash",
    status: "completed",
    is_emi: false,
    notes: "",
  });

  const generateCode = () => `SL${Date.now().toString(36).toUpperCase()}`;

  const calculateTotal = () => {
    const sellingPrice = formData.selling_price || 0;
    const discount = formData.discount || 0;
    const taxAmount = enableTax ? (formData.tax_amount || 0) : 0;
    const additionalTotal = additionalCharges.reduce((sum, c) => sum + c.amount, 0);
    return sellingPrice - discount + taxAmount + additionalTotal;
  };

  const updateVehicleStatusFromSale = async (
  vehicleId: string,
  saleStatus: "completed" | "reserved"
) => {
  const vehicleStatus = saleStatus === "completed" ? "sold" : "reserved";

  const updateData: any = { status: vehicleStatus };

  // When sold, disable catalogue & marketplace visibility and expire links
  if (vehicleStatus === "sold") {
    updateData.is_public = false;
    updateData.marketplace_status = "unlisted";
    updateData.public_page_id = null;
  }

  await supabase
    .from("vehicles")
    .update(updateData)
    .eq("id", vehicleId);
};


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsSubmitting(false);
      return;
    }

    const totalAmount = calculateTotal();
    const isEmi = !!formData.is_emi;

// 🔒 For EMI: only down payment counts as sale payment
const amountPaid = isEmi
  ? formData.down_payment || 0
  : formData.amount_paid || 0;

const balanceAmount = totalAmount - amountPaid;


// ❌ BLOCK OVERPAYMENT (same as Purchases)
if (amountPaid > totalAmount) {
  toast({
    title: "Invalid amount",
    description: isEmi
      ? "Down payment cannot exceed total amount"
      : "Amount paid cannot exceed total amount",
    variant: "destructive",
  });
  setIsSubmitting(false);
  return;
}



    try {
      if (selectedSale) {
        const { error } = await supabase.from("sales").update({
          ...formData,
          status: "completed",
          total_amount: totalAmount,
          balance_amount: balanceAmount,
        }).eq("id", selectedSale.id);
        if (error) throw error;
        
        await updateVehicleStatusFromSale(
  formData.vehicle_id!,
  "completed"
);

        
        toast({ title: "Sale updated successfully" });
      } else {
        const saleNumber = generateCode();
        const { data: saleData, error } = await supabase.from("sales").insert([{
          ...formData,
          status: "completed",
          sale_number: saleNumber,
          total_amount: totalAmount,
          balance_amount: balanceAmount,
          emi_configured: false,
          user_id: user.id,
        } as SaleInsert]).select().single();
        if (error) throw error;
        
        await updateVehicleStatusFromSale(
  formData.vehicle_id!,
  "completed"
);

        
        // Auto-create payment record if amount_paid > 0
       /*  if (!formData.is_emi && amountPaid > 0 && saleData) {
          const { data: existingPayment } = await supabase
            .from("payments")
            .select("id")
            .eq("reference_id", saleData.id)
            .eq("reference_type", "sale")
            .maybeSingle();
          
          if (!existingPayment) {
            await supabase.from("payments").insert({
              payment_number: `PAY${Date.now().toString(36).toUpperCase()}`,
              amount: amountPaid,
              payment_type: "customer_payment",
              payment_mode: formData.payment_mode || "cash",
              reference_id: saleData.id,
              reference_type: "sale",
              customer_id: formData.customer_id,
              description: `Payment for sale ${saleNumber}`,
              user_id: user.id,
            });
          }
        } */

          // ✅ ALWAYS record DOWN PAYMENT (EMI + NON-EMI)
if (amountPaid > 0 && saleData) {
  await supabase.from("payments").insert({
  user_id: user.id,
  payment_number: `PAY${Date.now().toString(36).toUpperCase()}`,
  payment_type: "customer_payment",
  payment_purpose: "down_payment", // ✅ KEY
  amount: amountPaid,
  payment_mode: formData.payment_mode || "cash",
  payment_date: saleData.sale_date,

  reference_type: "sale",
  reference_id: saleData.id,

  customer_id: formData.customer_id,
  principal_amount: amountPaid, // 🔒 DP reduces principal
  profit_amount: 0,             // optional (or calculate if any)
  interest_amount: 0,
  effective_date: saleData.sale_date,

  description: formData.is_emi
    ? `EMI Down Payment for sale ${saleNumber}`
    : `Sale Payment for ${saleNumber}`,
});

}

        
        toast({ title: "Sale added successfully" });
      }
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['sales-page'] });
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
  if (!saleToDelete) return;

  try {
    const sale = sales.find(s => s.id === saleToDelete);
    if (!sale) return;

    await supabase.from("sales").delete().eq("id", saleToDelete);

    await supabase
      .from("vehicles")
      .update({ status: "in_stock" })
      .eq("id", sale.vehicle_id);

    toast({ title: "Sale deleted & vehicle released" });
    queryClient.invalidateQueries({ queryKey: ['sales-page'] });
  } catch (error: any) {
    toast({ title: "Error", description: error.message, variant: "destructive" });
  } finally {
    setDeleteDialogOpen(false);
    setSaleToDelete(null);
  }
};


  const openDeleteDialog = (id: string) => {
    setSaleToDelete(id);
    setDeleteDialogOpen(true);
  };

  const openEditDialog = (sale: Sale) => {
  setSelectedSale(sale);
  setFormData(sale);

  setDisplayValues({
    selling_price: sale.selling_price?.toLocaleString("en-IN") || "",
    discount: sale.discount?.toLocaleString("en-IN") || "",
    tax_amount: sale.tax_amount?.toLocaleString("en-IN") || "",
    down_payment: sale.down_payment?.toLocaleString("en-IN") || "",
    amount_paid: sale.amount_paid?.toLocaleString("en-IN") || "",
  });

  setDialogOpen(true);
};


  const openDetailDialog = async (sale: Sale) => {
  setSelectedSale(sale);
  setDetailDialogOpen(true);

  // ❌ NO payments for EMI sales
  if (sale.is_emi) return;

  setLoadingPayments(true);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("reference_id", sale.id)
    .eq("reference_type", "sale")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  setPayments(data || []);
  setLoadingPayments(false);
};


const handleAddPayment = async () => {
  if (!selectedSale || paymentAmount <= 0) return;

if (selectedSale.is_emi) {
  toast({
    title: "EMI Sale",
    description: "Payments for EMI sales must be added from EMI module",
    variant: "destructive",
  });
  return;
}



  if (paymentAmount > selectedSale.balance_amount) {
    toast({
      title: "Invalid amount",
      description: "Payment exceeds pending balance",
      variant: "destructive",
    });
    return;
  }

  setAddingPayment(true);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1️⃣ Insert payment
    const { data: payment } = await supabase
      .from("payments")
      .insert({
        payment_number: `PAY${Date.now().toString(36).toUpperCase()}`,
        amount: paymentAmount,
        payment_type: "customer_payment",
        payment_mode: paymentMode,
        reference_id: selectedSale.id,
        reference_type: "sale",
        customer_id: selectedSale.customer_id,
        description: `Payment for sale ${selectedSale.sale_number}`,
        user_id: user.id,
      })
      .select()
      .single();

    // 2️⃣ Calculate new totals
    const newPaid = selectedSale.amount_paid + paymentAmount;
    const newBalance = selectedSale.total_amount - newPaid;

    // 3️⃣ Update sale
    await supabase
      .from("sales")
      .update({
        amount_paid: newPaid,
        balance_amount: newBalance,
      })
      .eq("id", selectedSale.id);

    // 4️⃣ Update UI instantly
    const updatedSale = {
      ...selectedSale,
      amount_paid: newPaid,
      balance_amount: newBalance,
    };

    setSelectedSale(updatedSale);
    queryClient.invalidateQueries({ queryKey: ['sales-page'] });

    setPayments(prev => payment ? [payment, ...prev] : prev);

    toast({ title: "Payment added successfully" });
    setAddPaymentOpen(false);
  } catch (err: any) {
    toast({ title: "Error", description: err.message, variant: "destructive" });
  } finally {
    setAddingPayment(false);
  }
};



  const resetForm = () => {
    setSelectedSale(null);
    setEnableTax(false);
    setAdditionalCharges([]);
    setFormData({
      vehicle_id: "",
      customer_id: "",
      selling_price: 0,
      discount: 0,
      tax_amount: 0,
      total_amount: 0,
      down_payment: 0,
      amount_paid: 0,
      payment_mode: "cash",
      status: "inquiry",
      is_emi: false,
      notes: "",
    });
    setDisplayValues({ selling_price: "", discount: "", tax_amount: "", down_payment: "", amount_paid: "" });
  };

  const getVehicle = (id: string) => vehicles.find((v) => v.id === id);
  const getCustomer = (id: string) => customers.find((c) => c.id === id);
  const getVehicleName = (id: string) => {
    const vehicle = getVehicle(id);
    return vehicle ? `${vehicle.brand} ${vehicle.model}` : "-";
  };
  const getCustomerName = (id: string) => getCustomer(id)?.full_name || "-";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-chart-2 text-white";
      case "reserved": return "bg-chart-3 text-white";
      case "inquiry": return "bg-chart-1 text-white";
      case "cancelled": return "bg-destructive text-white";
      default: return "bg-muted";
    }
  };


const getPaymentStatus = (sale: Sale) => {
  if (sale.amount_paid === 0) return "not_paid";
  if (getEffectiveBalance(sale.balance_amount) > 0) return "partial";
  return "paid";
};

const getPaymentBadgeColor = (status: string) => {
  switch (status) {
    case "not_paid":
      return "bg-destructive text-white";
    case "partial":
      return "bg-yellow-500 text-black";
    case "paid":
      return "bg-chart-2 text-white";
    default:
      return "bg-muted";
  }
};



  const handleDownloadInvoice = async (sale: Sale) => {
    const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  toast({
    title: "Error",
    description: "User not authenticated",
    variant: "destructive",
  });
  return;
}

const { data: dealerSettings, error } = await supabase
  .from("settings")
  .select("dealer_name, dealer_address, dealer_phone, dealer_email, dealer_gst")
  .eq("user_id", user.id)
  .single();

if (error || !dealerSettings) {
  toast({
    title: "Error",
    description: "Dealer settings not found",
    variant: "destructive",
  });
  return;
}

    const vehicle = getVehicle(sale.vehicle_id);
    const customer = getCustomer(sale.customer_id);
    
    if (!vehicle || !customer) {
      toast({ title: "Error", description: "Vehicle or customer data not found", variant: "destructive" });
      return;
    }

    const emiSchedules = await supabase
  .from("emi_schedules")
  .select("*")
  .eq("sale_id", sale.id)
  .order("emi_number", { ascending: true });

const schedules = emiSchedules.data || [];
const firstEmi = schedules[0];
const lastEmi = schedules[schedules.length - 1];

const emiStartDate = firstEmi?.due_date;
const emiEndDate = lastEmi?.due_date;

// Use the day of month (same every month)
const emiDueDay = emiStartDate
  ? new Date(emiStartDate).getDate()
  : undefined;

  console.log("Dealer address used in PDF:", dealerSettings.dealer_address);


generateSaleInvoicePDF(
  {
    dealer_name: dealerSettings.dealer_name,
    dealer_address: dealerSettings.dealer_address, // ✅ FIX
    dealer_phone: dealerSettings.dealer_phone,
    dealer_email: dealerSettings.dealer_email,
    dealer_gst: dealerSettings.dealer_gst,
  },
  vehicle,
  customer,
  {
    ...sale,
    emi_tenure: emiSchedules.data?.length || 0,
    emi_amount: firstEmi?.emi_amount || 0,
    emi_start_date: emiStartDate,
    emi_end_date: emiEndDate,
    emi_due_day: emiDueDay,
    emi_interest_rate:
      firstEmi && firstEmi.principal_component
        ? Math.round(
            ((firstEmi.interest_component || 0) /
              firstEmi.principal_component) *
              100
          )
        : 0,
  }
);


    toast({ title: "Invoice downloaded successfully" });
  };

  const filteredSales = sales.filter((s) =>
    `${s.sale_number} ${getVehicleName(s.vehicle_id)} ${getCustomerName(s.customer_id)}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableVehicles = vehicles.filter(
  (v) =>
    v.status === "in_stock" ||
    v.status === "reserved" ||
    v.id === formData.vehicle_id
);


  if (loading) {
    return <PageSkeleton />;
  }

const isEmiNotConfigured = (sale: Sale) => {
  return sale.is_emi === true && sale.emi_configured !== true;
};


  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales</h1>
          <p className="text-muted-foreground">Manage vehicle sales</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Add Sale
        </Button>
      </div>

      <Card className="border border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle>Sales List ({filteredSales.length})</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search sales..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "list" ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetailDialog(sale)}>
                    <TableCell className="space-y-1">
                      <div className="font-mono text-sm">{sale.sale_number}</div>
                      {isEmiNotConfigured(sale) && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-yellow-100 text-yellow-800 animate-soft-pulse cursor-pointer w-fit" onClick={(e) => { e.stopPropagation(); openDetailDialog(sale); }}>
                          ⚠ Configure EMI
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(sale.sale_date), "dd MMM yyyy")}</TableCell>
                    <TableCell>{getVehicleName(sale.vehicle_id)}</TableCell>
                    <TableCell>{getCustomerName(sale.customer_id)}</TableCell>
                    <TableCell>{formatCurrency(sale.total_amount)}</TableCell>
                    <TableCell><Badge className={getStatusColor(sale.status)}>{sale.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 max-w-[160px]">
                        {getEffectiveBalance(sale.balance_amount) > 0 ? (
                          <div className="text-sm font-semibold text-destructive">{formatCurrency(getEffectiveBalance(sale.balance_amount))} Due</div>
                        ) : (
                          <div className="text-sm font-semibold text-green-600">Paid</div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className={sale.amount_paid === 0 ? "text-destructive" : getEffectiveBalance(sale.balance_amount) > 0 ? "text-yellow-600" : "text-green-600"}>
                            {sale.amount_paid === 0 ? "Not Paid" : getEffectiveBalance(sale.balance_amount) > 0 ? "Partially Paid" : "Paid"}
                          </span>
                          <span>•</span>
                          <span className={sale.is_emi ? "text-purple-600 font-medium" : "text-muted-foreground"}>
                            {sale.is_emi ? "EMI" : "Non-EMI"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSales.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No sales found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSales.map((sale) => (
              <Card key={sale.id} className="cursor-pointer hover:shadow-md transition-shadow border border-border" onClick={() => openDetailDialog(sale)}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">{sale.sale_number}</span>
                    <Badge className={getStatusColor(sale.status) + " text-xs"}>{sale.status}</Badge>
                  </div>
                  <p className="font-semibold text-foreground truncate">{getVehicleName(sale.vehicle_id)}</p>
                  <p className="text-sm text-muted-foreground">{getCustomerName(sale.customer_id)}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">{formatCurrency(sale.total_amount)}</span>
                    {getEffectiveBalance(sale.balance_amount) > 0 ? (
                      <span className="text-xs text-destructive font-medium">{formatCurrency(getEffectiveBalance(sale.balance_amount))} Due</span>
                    ) : (
                      <span className="text-xs text-green-600 font-medium">Paid</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{format(new Date(sale.sale_date), "dd MMM yyyy")}</span>
                    <span>•</span>
                    <span className={sale.is_emi ? "text-purple-600 font-medium" : ""}>{sale.is_emi ? "EMI" : "Cash"}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredSales.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">No sales found</div>
            )}
          </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Sale"
        description="Are you sure you want to delete this sale? This action cannot be undone."
      />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedSale ? "Edit Sale" : "Add New Sale"}</DialogTitle>
          </DialogHeader>
          <form
  onSubmit={handleSubmit}
  className={`space-y-4 transition-opacity ${
    isSubmitting ? "opacity-60 pointer-events-none" : ""
  }`}
>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vehicle *</Label>
                <Select
  value={formData.vehicle_id}
  onValueChange={(v) => {
    const vehicle = vehicles.find((veh) => veh.id === v);
    const price = vehicle?.selling_price || 0;

    setFormData({
      ...formData,
      vehicle_id: v,
      selling_price: price,
    });

    setDisplayValues({
      ...displayValues,
      selling_price: price ? price.toLocaleString("en-IN") : "",
    });
  }}
>

                  <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                  <SelectContent>
                    {availableVehicles.map((v) => <SelectItem key={v.id} value={v.id}>
  {v.brand} {v.model} ({v.code})
  {v.status === "reserved" && " • Reserved"}
</SelectItem>
)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Customer *</Label>
                <Select value={formData.customer_id} onValueChange={(v) => setFormData({ ...formData, customer_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Selling Price *</Label>
                <Input
  value={displayValues.selling_price}
  readOnly
  disabled
  className="bg-muted cursor-not-allowed"
  placeholder="Auto from vehicle"
/>


              </div>
              <div className="space-y-2">
                <Label>Discount</Label>
                <Input
  value={displayValues.discount}
  onChange={(e) => {
    const formatted = formatIndianInput(e.target.value);
    setDisplayValues({ ...displayValues, discount: formatted });
    setFormData({
      ...formData,
      discount: parseIndianInput(formatted),
    });
  }}
  inputMode="numeric"
  placeholder="₹0"
/>

              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Tax</Label>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">Enable Tax</label>
                    <Switch checked={enableTax} onCheckedChange={(v) => {
                      setEnableTax(v);
                      if (!v) {
                        setDisplayValues({ ...displayValues, tax_amount: "" });
                        setFormData({ ...formData, tax_amount: 0 });
                      }
                    }} />
                  </div>
                </div>
                {enableTax && (
                  <Input
                    value={displayValues.tax_amount}
                    onChange={(e) => {
                      const formatted = formatIndianInput(e.target.value);
                      setDisplayValues({ ...displayValues, tax_amount: formatted });
                      setFormData({ ...formData, tax_amount: parseIndianInput(formatted) });
                    }}
                    inputMode="numeric"
                    placeholder="₹0"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>Total Amount</Label>
                <Input
  value={calculateTotal().toLocaleString("en-IN")}
  readOnly
  className="bg-muted"
/>
              </div>
            </div>

            {/* Additional Charges */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Additional Charges</Label>
                <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setAdditionalCharges([...additionalCharges, { name: "", amount: 0, display: "" }])}>
                  <Plus className="h-3 w-3" /> Add Charge
                </Button>
              </div>
              {additionalCharges.map((charge, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="Charge name"
                    value={charge.name}
                    onChange={(e) => {
                      const updated = [...additionalCharges];
                      updated[i].name = e.target.value;
                      setAdditionalCharges(updated);
                    }}
                    className="flex-1"
                  />
                  <Input
                    placeholder="₹0"
                    inputMode="numeric"
                    value={charge.display}
                    onChange={(e) => {
                      const formatted = formatIndianInput(e.target.value);
                      const updated = [...additionalCharges];
                      updated[i].display = formatted;
                      updated[i].amount = parseIndianInput(formatted);
                      setAdditionalCharges(updated);
                    }}
                    className="w-32"
                  />
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAdditionalCharges(additionalCharges.filter((_, j) => j !== i))}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {formData.is_emi && (
                <div className="space-y-2">
                  <Label>Down Payment</Label>
                  <Input
                    value={displayValues.down_payment}
                    onChange={(e) => {
                      const formatted = formatIndianInput(e.target.value);
                      setDisplayValues({ ...displayValues, down_payment: formatted });
                      setFormData({ ...formData, down_payment: parseIndianInput(formatted) });
                    }}
                    inputMode="numeric"
                    placeholder="₹0"
                  />
                  {formData.is_emi && parseIndianInput(displayValues.down_payment) > calculateTotal() && (
                    <p className="text-xs text-red-500 font-medium">Down payment cannot exceed total amount</p>
                  )}
                </div>
              )}

              {!formData.is_emi && (
                <div className="space-y-2">
                  <Label>Amount Paid</Label>
                  <Input
                    value={displayValues.amount_paid}
                    onChange={(e) => {
                      const formatted = formatIndianInput(e.target.value);
                      setDisplayValues({ ...displayValues, amount_paid: formatted });
                      setFormData({ ...formData, amount_paid: parseIndianInput(formatted) });
                    }}
                    inputMode="numeric"
                    placeholder="₹0"
                  />
                  {!formData.is_emi && parseIndianInput(displayValues.amount_paid) > calculateTotal() && (
                    <p className="text-xs text-red-500 font-medium">Amount paid cannot exceed total amount</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select value={formData.payment_mode} onValueChange={(v) => setFormData({ ...formData, payment_mode: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {paymentModes.map((m) => <SelectItem key={m} value={m} className="capitalize">{m.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
  id="is_emi"
  checked={formData.is_emi || false}
  onCheckedChange={(checked) =>
    setFormData({
      ...formData,
      is_emi: !!checked,
      amount_paid: checked ? 0 : formData.amount_paid,
      down_payment: checked ? formData.down_payment : 0,
    })
  }
/>

              <label htmlFor="is_emi" className="text-sm">Enable EMI for this sale</label>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={formData.notes || ""} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button
  type="submit"
  disabled={
    isSubmitting ||
    (!formData.is_emi &&
      parseIndianInput(displayValues.amount_paid) > calculateTotal()) ||
    (formData.is_emi &&
      parseIndianInput(displayValues.down_payment) > calculateTotal())
  }
>
{isSubmitting ? "Saving..." : (selectedSale ? "Update" : "Add")} Sale</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedSale && (
            <>
              <DialogHeader className="flex flex-row items-center justify-between">
  <DialogTitle>
    Sale {selectedSale.sale_number}
  </DialogTitle>

  <div className="flex gap-2">
    <Button
      variant="ghost"
      size="icon"
      onClick={() => handleDownloadInvoice(selectedSale)}
      title="Download Invoice"
    >
      <FileText className="h-4 w-4" />
    </Button>

    
  </div>
</DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(selectedSale.status)}>{selectedSale.status}</Badge>
                  {selectedSale.is_emi && <Badge className="bg-chart-4 text-white">EMI</Badge>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{format(new Date(selectedSale.sale_date), "dd MMM yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vehicle</p>
                    <p className="font-medium">{getVehicleName(selectedSale.vehicle_id)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-medium">{getCustomerName(selectedSale.customer_id)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Mode</p>
                    <p className="font-medium capitalize">{selectedSale.payment_mode.replace("_", " ")}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Selling Price</p>
                    <p className="font-bold">{formatCurrency(selectedSale.selling_price)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Discount</p>
                    <p className="font-bold text-chart-5">{formatCurrency(selectedSale.discount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tax</p>
                    <p className="font-bold">{formatCurrency(selectedSale.tax_amount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-bold text-chart-2">{formatCurrency(selectedSale.total_amount)}</p>
                  </div>
                </div>
                <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
  <div>
    <p className="text-sm text-muted-foreground">Down Payment</p>
    <p className="text-lg sm:text-xl font-bold">
      {formatCurrency(selectedSale.down_payment || 0)}
    </p>
  </div>

  {selectedSale.is_emi ? (
  <>
    <div>
      <p className="text-sm text-muted-foreground">Down Payment</p>
      <p className="text-lg sm:text-xl font-bold">
        {formatCurrency(selectedSale.down_payment || 0)}
      </p>
    </div>

    <div className="sm:col-span-2">
      <p className="text-sm text-muted-foreground">Pending (Principal)</p>
      <p className="text-lg sm:text-xl font-bold text-chart-5">
        {formatCurrency(getEffectiveBalance(selectedSale.balance_amount))}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Sale balance handled via EMI schedule (may include interest)
      </p>
    </div>
  </>
) : (
  <>
    <div>
      <p className="text-sm text-muted-foreground">Amount Paid</p>
      <p className="text-lg sm:text-xl font-bold text-chart-2">
        {formatCurrency(selectedSale.amount_paid)}
      </p>
    </div>

    <div>
      <p className="text-sm text-muted-foreground">Balance</p>
      <p className="text-lg sm:text-xl font-bold text-chart-5">
        {formatCurrency(getEffectiveBalance(selectedSale.balance_amount))}
      </p>
    </div>
  </>
)}


  {/* ➕ ADD PAYMENT ICON (ONLY NON-EMI & BALANCE > 0) */}
  {!selectedSale.is_emi &&
  getEffectiveBalance(selectedSale.balance_amount) > 0 && (

    <Button
      size="icon"
      className="absolute -top-3 -right-3 rounded-full"
      onClick={() => {
        setPaymentAmount(Math.max(0, selectedSale.balance_amount));
        setPaymentMode(selectedSale.payment_mode as any);
        setAddPaymentOpen(true);
      }}
    >
      <Plus className="h-4 w-4" />
    </Button>
  )}
</div>

{/* PAYMENT HISTORY (NON-EMI ONLY) */}
{!selectedSale.is_emi && (
  <div className="space-y-3">
    <h4 className="font-semibold text-sm">Payment History</h4>

    {loadingPayments && (
      <p className="text-sm text-muted-foreground">Loading payments...</p>
    )}

    {!loadingPayments && payments.length === 0 && (
      <p className="text-sm text-muted-foreground">
        No payments recorded yet
      </p>
    )}

    {!loadingPayments && payments.length > 0 && (
      <div className="space-y-2">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="flex items-center justify-between p-3 rounded-md border bg-background"
          >
            <div>
              <p className="font-medium">
                {formatCurrency(payment.amount)}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {payment.payment_mode.replace("_", " ")}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs">
                {format(new Date(payment.created_at), "dd MMM yyyy")}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(payment.created_at), "hh:mm a")}
              </p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}


                {selectedSale.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p>{selectedSale.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={addPaymentOpen} onOpenChange={setAddPaymentOpen}>
  <DialogContent className="max-w-sm">
    <DialogHeader>
      <DialogTitle>Add Payment</DialogTitle>
      {paymentExceedsBalance && (
  <p className="text-xs text-red-500 font-medium">
    Entered amount exceeds pending balance
  </p>
)}

    </DialogHeader>

    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Pending Amount</Label>
        <Input
          value={formatCurrency(selectedSale?.balance_amount || 0)}
          disabled
        />
      </div>

      <div className="space-y-2">
        <Label>Payment Amount</Label>
        <Input
          inputMode="numeric"
          value={paymentAmount.toLocaleString("en-IN")}
          onChange={(e) =>
            setPaymentAmount(
              Number(e.target.value.replace(/,/g, "")) || 0
            )
          }
        />
      </div>

      <div className="space-y-2">
        <Label>Payment Mode</Label>
        <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {paymentModes.map((m) => (
              <SelectItem key={m} value={m} className="capitalize">
                {m.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setAddPaymentOpen(false)}>
        Cancel
      </Button>
      <Button
  onClick={handleAddPayment}
  disabled={addingPayment || paymentExceedsBalance}
>

        {addingPayment ? "Saving..." : "Add Payment"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>



    </div>
  );
};

export default Sales;
