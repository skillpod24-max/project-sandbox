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
import { Plus, Search, Eye } from "lucide-react";
import ViewToggle from "@/components/ViewToggle";
import { useViewMode } from "@/hooks/useViewMode";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import { PageSkeleton } from "@/components/ui/page-skeleton";

type Payment = Database["public"]["Tables"]["payments"]["Row"];
type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];

const paymentModes = ["cash", "bank_transfer", "cheque", "upi", "card"] as const;
const paymentTypes = ["customer_payment", "vendor_payment", "emi_payment", "expense"] as const;

const Payments = () => {
  const { toast } = useToast();
  const { viewMode, setViewMode } = useViewMode("payments");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<PaymentInsert>>({ amount: 0, payment_mode: "cash", payment_type: "customer_payment" });
  const [showFilters, setShowFilters] = useState(false);
const [filterType, setFilterType] = useState<string>("all");
const [fromDate, setFromDate] = useState<string>("");
const [toDate, setToDate] = useState<string>("");
const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);



  useEffect(() => { fetchPayments(); }, []);

  const fetchPayments = async () => {
    // Get current user for explicit filtering
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase.from("payments").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setPayments(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      const { error } = await supabase.from("payments").insert([{ ...formData, payment_number: `PAY${Date.now().toString(36).toUpperCase()}`, user_id: user.id } as PaymentInsert]);
      if (error) throw error;
      toast({ title: "Payment recorded successfully" });
      setDialogOpen(false);
      fetchPayments();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getPaymentTypeBadge = (type: string) => {
  switch (type) {
    case "customer_payment":
      return "bg-green-100 text-green-700 border border-green-200";
    case "emi_payment":
      return "bg-purple-100 text-purple-700 border border-purple-200";
    case "vendor_payment":
      return "bg-blue-100 text-blue-700 border border-blue-200";
    case "expense":
      return "bg-red-100 text-red-700 border border-red-200";
    default:
      return "bg-muted text-muted-foreground";
  }
};


  const filteredPayments = payments.filter((p) => {
  // Search
  if (
    searchTerm &&
    !p.payment_number.toLowerCase().includes(searchTerm.toLowerCase())
  ) {
    return false;
  }

  // Type filter
  if (filterType !== "all" && p.payment_type !== filterType) {
    return false;
  }

  // Date filters
  const paymentDate = new Date(p.payment_date);

  if (fromDate && paymentDate < new Date(fromDate)) return false;
  if (toDate && paymentDate > new Date(toDate)) return false;

  return true;
});


  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between gap-4">
        <div><h1 className="text-3xl font-bold">Payments</h1><p className="text-muted-foreground">Track all payments</p></div>
         
  <div className="flex items-center gap-2 relative">
  {/* Filter Button */}
  <Button
    variant="outline"
    size="sm"
    onClick={() => setShowFilters(v => !v)}
    className="gap-1"
  >
    Filter
  </Button>

  {/* Ledger Info */}
  <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-sm text-blue-700 border border-blue-200">
    <span className="h-2 w-2 rounded-full bg-blue-600" />
    Auto-generated payment ledger
  </div>

  {/* Filter Panel */}
  {showFilters && (
    <div className="absolute right-0 top-10 z-50 w-72 rounded-xl border bg-card shadow-lg p-4 space-y-3">
      {/* Payment Type */}
      <div className="space-y-1">
        <Label className="text-xs">Payment Type</Label>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger>
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {paymentTypes.map(t => (
              <SelectItem key={t} value={t} className="capitalize">
                {t.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setFilterType("all");
            setFromDate("");
            setToDate("");
          }}
        >
          Reset
        </Button>
        <Button size="sm" onClick={() => setShowFilters(false)}>
          Apply
        </Button>
      </div>
    </div>
  )}
</div>

      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payment List ({filteredPayments.length})</CardTitle>
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "list" ? (
          <Table>
            <TableHeader><TableRow><TableHead>Number</TableHead><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Mode</TableHead><TableHead>Amount</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredPayments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono">{p.payment_number}</TableCell>
                  <TableCell>{format(new Date(p.payment_date), "dd MMM yyyy")}</TableCell>
                  <TableCell className="space-y-1">
                    <Badge className={getPaymentTypeBadge(p.payment_type)}>{p.payment_type.replace("_", " ")}</Badge>
                    {p.payment_purpose && (
                      <div className="text-[11px] text-muted-foreground capitalize">{p.payment_purpose.replace("_", " ")}</div>
                    )}
                  </TableCell>
                  <TableCell className="capitalize">{p.payment_mode.replace("_", " ")}</TableCell>
                  <TableCell className="font-bold">₹{p.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => setSelectedPayment(p)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredPayments.map((p) => (
              <Card key={p.id} className="border border-border hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedPayment(p)}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">{p.payment_number}</span>
                    <Badge className={getPaymentTypeBadge(p.payment_type) + " text-xs"}>{p.payment_type.replace("_", " ")}</Badge>
                  </div>
                  <p className="font-bold text-lg">₹{p.amount.toLocaleString()}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="capitalize">{p.payment_mode.replace("_", " ")}</span>
                    <span>{format(new Date(p.payment_date), "dd MMM yyyy")}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredPayments.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">No payments found</div>
            )}
          </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Payment</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Amount *</Label><Input type="number" value={formData.amount || ""} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })} required /></div>
              <div className="space-y-2"><Label>Payment Type</Label><Select value={formData.payment_type} onValueChange={(v) => setFormData({ ...formData, payment_type: v as any })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{paymentTypes.map((t) => <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Payment Mode</Label><Select value={formData.payment_mode} onValueChange={(v) => setFormData({ ...formData, payment_mode: v as any })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{paymentModes.map((m) => <SelectItem key={m} value={m} className="capitalize">{m.replace("_", " ")}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
            <DialogFooter><Button type="submit">Add Payment</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Payment Breakdown</DialogTitle>
    </DialogHeader>

    {selectedPayment && (
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span>Total Amount</span>
          <span className="font-bold">₹{selectedPayment.amount.toLocaleString()}</span>
        </div>

        {selectedPayment.payment_purpose && (
  <div className="text-xs text-muted-foreground capitalize">
    Purpose: {selectedPayment.payment_purpose.replace("_", " ")}
  </div>
)}


        {selectedPayment.principal_amount > 0 && (
          <div className="flex justify-between text-blue-600">
            <span>Principal</span>
            <span>₹{selectedPayment.principal_amount.toLocaleString()}</span>
          </div>
        )}

        {selectedPayment.interest_amount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Interest (Unlocked)</span>
            <span>₹{selectedPayment.interest_amount.toLocaleString()}</span>
          </div>
        )}

        {selectedPayment.profit_amount !== 0 && (
          <div className="flex justify-between text-purple-600">
            <span>Profit Impact</span>
            <span>₹{selectedPayment.profit_amount.toLocaleString()}</span>
          </div>
        )}

        <div className="pt-2 border-t text-muted-foreground">
          Effective On:{" "}
          {selectedPayment.effective_date
            ? format(new Date(selectedPayment.effective_date), "dd MMM yyyy")
            : "—"}
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>

    </div>
  );
};

export default Payments;
