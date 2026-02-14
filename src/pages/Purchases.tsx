import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Eye } from "lucide-react";
import ViewToggle from "@/components/ViewToggle";
import { useViewMode } from "@/hooks/useViewMode";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import type { Database } from "@/integrations/supabase/types";
import { PageSkeleton } from "@/components/ui/page-skeleton";

const formatINR = (value: string) => {
  const num = value.replace(/,/g, "");
  if (!num) return "";
  return Number(num).toLocaleString("en-IN");
};

const parseINR = (value: string) =>
  Number(value.replace(/,/g, ""));




type Purchase = Database["public"]["Tables"]["vehicle_purchases"]["Row"];
type PurchaseInsert = Database["public"]["Tables"]["vehicle_purchases"]["Insert"];
type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type Vendor = Database["public"]["Tables"]["vendors"]["Row"];
type Payment = Database["public"]["Tables"]["payments"]["Row"];

const paymentModes = ["cash", "bank_transfer", "cheque", "upi", "card"] as const;

const Purchases = () => {
  const { toast } = useToast();
  const { viewMode, setViewMode } = useViewMode("purchases");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
const [loadingPayments, setLoadingPayments] = useState(false);
const [addPaymentOpen, setAddPaymentOpen] = useState(false);
const [paymentAmount, setPaymentAmount] = useState(0);
const [paymentMode, setPaymentMode] = useState<typeof paymentModes[number]>("cash");
const [addingPayment, setAddingPayment] = useState(false);


  const [formData, setFormData] = useState<Partial<PurchaseInsert>>({
    vehicle_id: "",
    vendor_id: "",
    purchase_price: 0,
    amount_paid: 0,
    payment_mode: "cash",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get current user for explicit filtering
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const [purchasesRes, vehiclesRes, vendorsRes] = await Promise.all([
        supabase.from("vehicle_purchases").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("vehicles").select("*").eq("user_id", user.id),
        supabase.from("vendors").select("*").eq("is_active", true).eq("user_id", user.id),
      ]);
      setPurchases(purchasesRes.data || []);
      setVehicles(vehiclesRes.data || []);
      setVendors(vendorsRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => `PUR${Date.now().toString(36).toUpperCase()}`;
  const paymentExceedsBalance =
  selectedPurchase &&
  paymentAmount > selectedPurchase.balance_amount;


  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsSubmitting(false);
      return;
    }

    const vehicle = vehicles.find(v => v.id === formData.vehicle_id);
const finalPurchasePrice = vehicle?.purchase_price || 0;
const amountPaid = formData.amount_paid || 0;
const balanceAmount = finalPurchasePrice - amountPaid;


if (amountPaid > finalPurchasePrice) {
  toast({
    title: "Invalid amount",
    description: "Amount paid cannot exceed purchase price",
    variant: "destructive",
  });
  setIsSubmitting(false);
  return;
}



    try {
      if (selectedPurchase) {
  const { error } = await supabase
    .from("vehicle_purchases")
    .update({
      notes: formData.notes,
      payment_mode: formData.payment_mode,
    })
    .eq("id", selectedPurchase.id);

  if (error) throw error;
  toast({ title: "Purchase updated successfully" });
}
 else {
        const purchaseNumber = generateCode();
        const { data: purchaseData, error } = await supabase.from("vehicle_purchases").insert([{
          ...formData,
           purchase_price: finalPurchasePrice, // 🔒 FORCE VEHICLE PRICE
          purchase_number: purchaseNumber,
          balance_amount: balanceAmount,
          user_id: user.id,
        } as PurchaseInsert]).select().single();

        // 🔁 Sync vehicle state after purchase creation
await supabase
  .from("vehicles")
  .update({
    purchase_status: "purchased",
    vendor_id: formData.vendor_id,
  })
  .eq("id", formData.vehicle_id);


        if (error) throw error;
        
        // Auto-create payment record if amount_paid > 0
        if (amountPaid > 0 && purchaseData) {
          const { data: existingPayment } = await supabase
            .from("payments")
            .select("id")
            .eq("reference_id", purchaseData.id)
            .eq("reference_type", "purchase")
            .maybeSingle();
          
          if (!existingPayment) {
            await supabase.from("payments").insert({
              payment_number: `PAY${Date.now().toString(36).toUpperCase()}`,
              amount: amountPaid,
              payment_type: "vendor_payment",
              payment_mode: formData.payment_mode || "cash",
              reference_id: purchaseData.id,
              reference_type: "purchase",
              vendor_id: formData.vendor_id,
              description: `Payment for purchase ${purchaseNumber}`,
              user_id: user.id,
            });
          }
        }
        
        toast({ title: "Purchase added successfully" });
      }
      setDialogOpen(false);
      fetchData();
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!purchaseToDelete) return;
    try {
      const { error } = await supabase.from("vehicle_purchases").delete().eq("id", purchaseToDelete);
      if (error) throw error;
      toast({ title: "Purchase deleted successfully" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setPurchaseToDelete(null);
    }
  };

  const openDeleteDialog = (id: string) => {
    setPurchaseToDelete(id);
    setDeleteDialogOpen(true);
  };

  const openEditDialog = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setFormData(purchase);
    setDialogOpen(true);
  };

  const openDetailDialog = async (purchase: Purchase) => {
  setSelectedPurchase(purchase);
  setDetailDialogOpen(true);
  setLoadingPayments(true);

  


  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("reference_id", purchase.id)
    .eq("reference_type", "purchase")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  setPayments(data || []);
  setLoadingPayments(false);
};

const handleAddPayment = async () => {
  if (!selectedPurchase || paymentAmount <= 0) return;

  if (paymentAmount > selectedPurchase.balance_amount) {
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
        payment_type: "vendor_payment",
        payment_mode: paymentMode,
        reference_id: selectedPurchase.id,
        reference_type: "purchase",
        vendor_id: selectedPurchase.vendor_id,
        description: `Payment for ${selectedPurchase.purchase_number}`,
        user_id: user.id,
      })
      .select()
      .single();

    // 2️⃣ Calculate new totals
    const newPaid = selectedPurchase.amount_paid + paymentAmount;
    const newBalance = selectedPurchase.purchase_price - newPaid;

    // 3️⃣ Update purchase in DB
    await supabase
      .from("vehicle_purchases")
      .update({
        amount_paid: newPaid,
        balance_amount: newBalance,
      })
      .eq("id", selectedPurchase.id);

    // ✅ 4️⃣ UPDATE LOCAL STATE (THIS IS THE KEY)
    const updatedPurchase = {
      ...selectedPurchase,
      amount_paid: newPaid,
      balance_amount: newBalance,
    };

    setSelectedPurchase(updatedPurchase);

    setPurchases(prev =>
      prev.map(p => p.id === selectedPurchase.id ? updatedPurchase : p)
    );

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
    setSelectedPurchase(null);
    setFormData({
      vehicle_id: "",
      vendor_id: "",
      purchase_price: 0,
      amount_paid: 0,
      payment_mode: "cash",
      notes: "",
    });
  };

  const getVehicleName = (id: string) => {
    const vehicle = vehicles.find((v) => v.id === id);
    return vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.code})` : "-";
  };

  const getVendorName = (id: string) => {
    const vendor = vendors.find((v) => v.id === id);
    return vendor?.name || "-";
  };

  const filteredPurchases = purchases.filter((p) =>
    `${p.purchase_number} ${getVehicleName(p.vehicle_id)} ${getVendorName(p.vendor_id)}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <PageSkeleton />;
  }

// ✅ Vehicles eligible for manual purchase
const purchasedVehicleIds = new Set(
  purchases.map(p => p.vehicle_id)
);

const eligibleVehicles = vehicles.filter(v =>
  v.status === "in_stock" &&               // 1️⃣ only in stock
  !purchasedVehicleIds.has(v.id)           // 2️⃣ no vendor / purchase exists
);


  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Purchases</h1>
          <p className="text-muted-foreground">Manage vehicle purchases</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Add Manual Purchase
        </Button>
      </div>

      <Card className="border border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle>Purchase List ({filteredPurchases.length})</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search purchases..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
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
                  <TableHead>Vendor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.map((purchase) => (
                  <TableRow key={purchase.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetailDialog(purchase)}>
                    <TableCell className="font-mono text-sm">{purchase.purchase_number}</TableCell>
                    <TableCell>{format(new Date(purchase.purchase_date), "dd MMM yyyy")}</TableCell>
                    <TableCell>{getVehicleName(purchase.vehicle_id)}</TableCell>
                    <TableCell>{getVendorName(purchase.vendor_id)}</TableCell>
                    <TableCell>₹{purchase.purchase_price.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={purchase.balance_amount > 0 ? "bg-chart-3 text-white" : "bg-chart-2 text-white"}>
                        ₹{purchase.balance_amount.toLocaleString()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPurchases.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No purchases found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPurchases.map((purchase) => (
              <Card key={purchase.id} className="cursor-pointer hover:shadow-md transition-shadow border border-border" onClick={() => openDetailDialog(purchase)}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">{purchase.purchase_number}</span>
                    <Badge className={purchase.balance_amount > 0 ? "bg-chart-3 text-white text-xs" : "bg-chart-2 text-white text-xs"}>
                      {purchase.balance_amount > 0 ? `₹${purchase.balance_amount.toLocaleString()} Due` : "Paid"}
                    </Badge>
                  </div>
                  <p className="font-semibold text-foreground truncate">{getVehicleName(purchase.vehicle_id)}</p>
                  <p className="text-sm text-muted-foreground">{getVendorName(purchase.vendor_id)}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-primary">₹{purchase.purchase_price.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(purchase.purchase_date), "dd MMM yyyy")}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredPurchases.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">No purchases found</div>
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
        title="Delete Purchase"
        description="Are you sure you want to delete this purchase? This action cannot be undone."
      />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
  className="
    max-w-2xl
    w-[calc(100vw-1.5rem)]
    sm:w-full
    px-3 sm:px-6
    rounded-2xl
    sm:rounded-xl
    overflow-hidden
  "
>

          <DialogHeader>
            <DialogTitle>{selectedPurchase ? "Edit Purchase" : "Add New Purchase"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vehicle *</Label>
                <Select
  value={formData.vehicle_id}
  onValueChange={(vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);

    setFormData(prev => ({
      ...prev,
      vehicle_id: vehicleId,
      purchase_price: vehicle?.purchase_price || 0, // 🔥 AUTO FILL
    }));
  }}
>

                  <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                  <SelectContent>
  {eligibleVehicles.length === 0 && (
    <div className="px-3 py-2 text-sm text-muted-foreground">
      No eligible vehicles available
    </div>
  )}

  {eligibleVehicles.map((v) => (
    <SelectItem key={v.id} value={v.id}>
      {v.brand} {v.model} ({v.code})
    </SelectItem>
  ))}
</SelectContent>

                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vendor *</Label>
                <Select
  value={formData.vendor_id}
  onValueChange={(v) => setFormData({ ...formData, vendor_id: v })}
  disabled={!!selectedPurchase} // 🔒 LOCK vendor after creation
>

                  <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                  <SelectContent>
                    {vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {selectedPurchase && (
  <p className="text-xs text-muted-foreground">
    Vendor is locked for accounting consistency
  </p>
)}

              <div className="space-y-2">
                <Label>Purchase Price *</Label>
                <Input
  inputMode="numeric"
  value={formatINR(String(formData.purchase_price || ""))}
  disabled
/>

<p className="text-xs text-muted-foreground">
  Purchase price is taken from the vehicle.
  To change it, edit the vehicle details.
</p>


              </div>
              <div className="space-y-2">
                <Label>Amount Paid</Label>
                <Input
  inputMode="numeric"
  value={formatINR(String(formData.amount_paid || ""))}
  onChange={(e) =>
    setFormData({
      ...formData,
      amount_paid: parseINR(e.target.value),
    })
  }
/>

{formData.amount_paid > (formData.purchase_price || 0) && (
  <p className="text-xs text-red-500 font-medium">
    Amount paid cannot exceed purchase price
  </p>
)}


              </div>
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
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={formData.notes || ""} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : (selectedPurchase ? "Update" : "Add")} Purchase</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent
  className="
    max-w-2xl
    w-[calc(100vw-1.5rem)]
    sm:w-full
    px-3 sm:px-6
    rounded-2xl
    sm:rounded-xl
    overflow-hidden
  "
>

          {selectedPurchase && (
            <>
              <DialogHeader className="flex flex-row items-center justify-between">
  <DialogTitle>
    Purchase {selectedPurchase.purchase_number}
  </DialogTitle>

  <div className="flex gap-2">
    
  </div>
</DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{format(new Date(selectedPurchase.purchase_date), "dd MMM yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vehicle</p>
                    <p className="font-medium">{getVehicleName(selectedPurchase.vehicle_id)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vendor</p>
                    <p className="font-medium">{getVendorName(selectedPurchase.vendor_id)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Mode</p>
                    <p className="font-medium capitalize">{selectedPurchase.payment_mode.replace("_", " ")}</p>
                  </div>
                </div>
                <div className="relative grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
  <div>
    <p className="text-sm text-muted-foreground">Purchase Price</p>
    <p className="text-xl font-bold">₹{selectedPurchase.purchase_price.toLocaleString()}</p>
  </div>

  <div>
    <p className="text-sm text-muted-foreground">Amount Paid</p>
    <p className="text-xl font-bold text-chart-2">
      ₹{selectedPurchase.amount_paid.toLocaleString()}
    </p>
  </div>

  <div>
    <p className="text-sm text-muted-foreground">Balance</p>
    <p className="text-xl font-bold text-chart-3">
      ₹{selectedPurchase.balance_amount.toLocaleString()}
    </p>
  </div>

  {selectedPurchase.balance_amount > 0 && (
    <Button
      size="icon"
      className="absolute -top-3 -right-3 rounded-full"
      onClick={() => {
        setPaymentAmount(selectedPurchase.balance_amount); // auto fill
        setPaymentMode(selectedPurchase.payment_mode as any);
        setAddPaymentOpen(true);
      }}
    >
      <Plus className="h-4 w-4" />
    </Button>
  )}
</div>

<Dialog open={addPaymentOpen} onOpenChange={setAddPaymentOpen}>
  <DialogContent className="max-w-sm">
    <DialogHeader>
      <DialogTitle>Add Payment</DialogTitle>
    </DialogHeader>

    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Pending Amount</Label>
        <Input
          value={`₹${selectedPurchase?.balance_amount.toLocaleString()}`}
          disabled
        />
      </div>

      <div className="space-y-2">
        <Label>Payment Amount</Label>
        <Input
  inputMode="numeric"
  value={formatINR(String(paymentAmount))}
  onChange={(e) => setPaymentAmount(parseINR(e.target.value))}
/>

{paymentExceedsBalance && (
  <p className="text-xs text-red-500 font-medium">
    Entered amount is greater than pending balance
  </p>
)}


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
              ₹{payment.amount.toLocaleString("en-IN")}
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

                {selectedPurchase.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p>{selectedPurchase.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Purchases;
