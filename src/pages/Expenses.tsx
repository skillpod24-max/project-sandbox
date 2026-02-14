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
import { Plus, Pencil, Trash2, Search, Receipt, TrendingUp, IndianRupee } from "lucide-react";
import ViewToggle from "@/components/ViewToggle";
import { useViewMode } from "@/hooks/useViewMode";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { formatCurrency, formatIndianNumber } from "@/lib/formatters";
import type { Database } from "@/integrations/supabase/types";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as DatePickerCalendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { ChevronDown, ChevronUp } from "lucide-react";




type Expense = Database["public"]["Tables"]["expenses"]["Row"];
type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"];

const expenseCategories = [
  { value: "fuel", label: "Fuel & Petrol", icon: "⛽" },
  { value: "maintenance", label: "Maintenance & Repairs", icon: "🔧" },
  { value: "office_supplies", label: "Office Supplies", icon: "📎" },
  { value: "utilities", label: "Utilities (Electricity/Water)", icon: "💡" },
  { value: "rent", label: "Rent & Lease", icon: "🏢" },
  { value: "salary", label: "Salary & Wages", icon: "💰" },
  { value: "marketing", label: "Marketing & Advertising", icon: "📢" },
  { value: "insurance", label: "Insurance", icon: "🛡️" },
  { value: "travel", label: "Travel & Transport", icon: "🚗" },
  { value: "food", label: "Food & Refreshments", icon: "🍽️" },
  { value: "cleaning", label: "Cleaning & Housekeeping", icon: "🧹" },
  { value: "professional_fees", label: "Professional Fees (CA/Legal)", icon: "⚖️" },
  { value: "vehicle_parts", label: "Vehicle Parts & Accessories", icon: "🔩" },
  { value: "miscellaneous", label: "Miscellaneous", icon: "📦" },
] as const;

const paymentModes = ["cash", "bank_transfer", "cheque", "upi", "card"] as const;

const Expenses = () => {
  const { toast } = useToast();
  const { viewMode, setViewMode } = useViewMode("expenses");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDialogSubmitting, setIsDialogSubmitting] = useState(false);

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
const [selectedExpenseDetail, setSelectedExpenseDetail] = useState<Expense | null>(null);
const [showAllCategories, setShowAllCategories] = useState(false);

const [dateFilter, setDateFilter] = useState<DateRange | undefined>(
  undefined
);

  const [formData, setFormData] = useState<Partial<ExpenseInsert>>({
    amount: 0,
    category: "miscellaneous",
    description: "",
    expense_date: new Date().toISOString().split("T")[0],
    payment_mode: "cash",
    notes: "",
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      // Get current user for explicit filtering
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .order("expense_date", { ascending: false });
      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateExpenseNumber = () => `EXP${Date.now().toString(36).toUpperCase()}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDialogSubmitting) return;
setIsDialogSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsDialogSubmitting(false);
      return;
    }

    try {
      if (selectedExpense) {
        const { error } = await supabase
          .from("expenses")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedExpense.id);
        if (error) throw error;
        toast({ title: "Expense updated successfully" });
      } else {
        const expenseInsert: ExpenseInsert = {
  amount: Number(formData.amount),
  category: formData.category!,
  description: formData.description!,
  expense_date: formData.expense_date,
  payment_mode: formData.payment_mode,
  notes: formData.notes,
  expense_number: generateExpenseNumber(),
  user_id: user.id,
};

const { data: insertedExpenses, error } = await supabase
  .from("expenses")
  .insert([expenseInsert])
  .select();

if (error) throw error;

const expense = insertedExpenses?.[0];
if (!expense) {
  throw new Error("Expense insert failed");
}


// 🔥 CREATE PAYMENT ENTRY (THIS WAS MISSING)
const { error: paymentError } = await supabase
  .from("payments")
  .insert([{
    user_id: user.id,
    payment_number: `PAY${Date.now().toString(36).toUpperCase()}`,
    payment_type: "expense",
    payment_mode: expense.payment_mode,
    amount: expense.amount,
    payment_date: expense.expense_date,
    description: expense.description || "Expense payment",
    reference_id: expense.id,     // 🔗 link to expense
    payment_purpose: "expense",
  }]);

if (paymentError) throw paymentError;

toast({ title: "Expense added successfully" });

      }
      setDialogOpen(false);
      fetchExpenses();
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsDialogSubmitting(false);
    }
  };

  const handleDelete = async () => {
  if (!expenseToDelete) return;

  try {
    // 1️⃣ Delete linked payment FIRST
    await supabase
      .from("payments")
      .delete()
      .eq("payment_type", "expense")
      .eq("reference_id", expenseToDelete);

    // 2️⃣ Delete expense
    await supabase
      .from("expenses")
      .delete()
      .eq("id", expenseToDelete);

    toast({
      title: "Expense deleted",
      description: "Linked payment entry was also removed",
    });

    fetchExpenses();
  } catch (error: any) {
    toast({
      title: "Delete failed",
      description: error.message,
      variant: "destructive",
    });
  } finally {
    setDeleteDialogOpen(false);
    setExpenseToDelete(null);
  }
};


  const openEditDialog = (expense: Expense) => {
    setSelectedExpense(expense);
    setFormData(expense);
    setDialogOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setExpenseToDelete(id);
    setDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedExpense(null);
    setFormData({
      amount: 0,
      category: "miscellaneous",
      description: "",
      expense_date: new Date().toISOString().split("T")[0],
      payment_mode: "cash",
      notes: "",
    });
  };

  const openExpenseDetailDialog = (expense: Expense) => {
  setSelectedExpenseDetail(expense);
  setDetailDialogOpen(true);
};


  const getCategoryInfo = (category: string) => {
    return expenseCategories.find(c => c.value === category) || { label: category, icon: "📦" };
  };

  

  const filteredExpenses = expenses.filter((e) => {
  const matchesSearch =
    `${e.expense_number} ${e.description} ${e.category}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

  const matchesCategory =
    categoryFilter === "all" || e.category === categoryFilter;

  const expenseDate = new Date(e.expense_date);

  const matchesDate =
  !dateFilter?.from ||
  (expenseDate >= dateFilter.from &&
    (!dateFilter.to || expenseDate <= dateFilter.to));


  return matchesSearch && matchesCategory && matchesDate;
});


  // Stats calculations
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const thisMonthExpenses = expenses.filter(e => {
    const date = new Date(e.expense_date);
    return date >= thisMonthStart && date <= thisMonthEnd;
  });

  const lastMonthExpenses = expenses.filter(e => {
    const date = new Date(e.expense_date);
    return date >= lastMonthStart && date <= lastMonthEnd;
  });

  const stats = {
    totalExpenses: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
    thisMonth: thisMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
    lastMonth: lastMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
    todayExpenses: expenses.filter(e => e.expense_date === format(now, 'yyyy-MM-dd')).reduce((sum, e) => sum + Number(e.amount), 0),
  };

  const monthChange = stats.lastMonth > 0 
    ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth * 100).toFixed(1)
    : "0";

  // Category breakdown for this month
  const categoryBreakdown = expenseCategories.map(cat => ({
    ...cat,
    amount: thisMonthExpenses.filter(e => e.category === cat.value).reduce((sum, e) => sum + Number(e.amount), 0),
  })).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

  


  if (loading) {
    return <PageSkeleton />;
  }

const visibleCategories = showAllCategories
  ? categoryBreakdown
  : categoryBreakdown.slice(0, 4); // desktop default


  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Daily Expenses</h1>
          <p className="text-muted-foreground">Track and manage your business expenses</p>
        </div>
        <Button
  onClick={() => {
    resetForm();
    setDialogOpen(true);
  }}
  className="gap-2"
>
  <Plus className="h-4 w-4" />
  Add Expense
</Button>


      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold text-foreground">₹{formatIndianNumber(stats.todayExpenses)}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-chart-1" />

            </div>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-chart-3">₹{formatIndianNumber(stats.thisMonth)}</p>
              </div>
              <Receipt className="h-8 w-8 text-chart-3" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last Month</p>
                <p className="text-2xl font-bold text-muted-foreground">₹{formatIndianNumber(stats.lastMonth)}</p>
              </div>
              <IndianRupee className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Month Change</p>
                <p className={`text-2xl font-bold ${Number(monthChange) >= 0 ? 'text-destructive' : 'text-chart-2'}`}>
                  {Number(monthChange) >= 0 ? '+' : ''}{monthChange}%
                </p>
              </div>
              <TrendingUp className={`h-8 w-8 ${Number(monthChange) >= 0 ? 'text-destructive' : 'text-chart-2'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {/* Category Breakdown */}
{categoryBreakdown.length > 0 && (
  <Card className="border border-border">
    <CardHeader className="pb-2 flex flex-row items-center justify-between">
      <CardTitle className="text-lg">This Month by Category</CardTitle>

      {/* MOBILE arrow → show when 4 or more */}
{categoryBreakdown.length >= 4 && (
  <Button
    variant="outline"
    size="icon"
    onClick={() => setShowAllCategories((v) => !v)}
    className="md:hidden text-primary border-primary/30 hover:bg-primary/10"
  >
    <ChevronDown
      className={`h-5 w-5 transition-transform ${
        showAllCategories ? "rotate-180" : ""
      }`}
    />
  </Button>
)}

{/* DESKTOP arrow → show when 5 or more */}
{categoryBreakdown.length >= 5 && (
  <Button
    variant="outline"
    size="icon"
    onClick={() => setShowAllCategories((v) => !v)}
    className="hidden md:inline-flex text-primary border-primary/30 hover:bg-primary/10"
  >
    <ChevronDown
      className={`h-5 w-5 transition-transform ${
        showAllCategories ? "rotate-180" : ""
      }`}
    />
  </Button>
)}

    </CardHeader>

    <CardContent>
      <div className="flex flex-wrap gap-2">
        {/* MOBILE (top 3) */}
        {!showAllCategories &&
          categoryBreakdown.slice(0, 3).map((cat) => (
            <Badge
              key={cat.value}
              variant="outline"
              className="px-3 py-2 text-sm md:hidden"
            >
              <span className="mr-2">{cat.icon}</span>
              {cat.label}:
              <span className="font-bold ml-1">
                ₹{formatIndianNumber(cat.amount)}
              </span>
            </Badge>
          ))}

        {/* DESKTOP (top 4) */}
        {!showAllCategories &&
          categoryBreakdown.slice(0, 4).map((cat) => (
            <Badge
              key={cat.value}
              variant="outline"
              className="px-3 py-2 text-sm hidden md:inline-flex"
            >
              <span className="mr-2">{cat.icon}</span>
              {cat.label}:
              <span className="font-bold ml-1">
                ₹{formatIndianNumber(cat.amount)}
              </span>
            </Badge>
          ))}

        {/* SHOW ALL (both views) */}
        {showAllCategories &&
          categoryBreakdown.map((cat) => (
            <Badge
              key={cat.value}
              variant="outline"
              className="px-3 py-2 text-sm"
            >
              <span className="mr-2">{cat.icon}</span>
              {cat.label}:
              <span className="font-bold ml-1">
                ₹{formatIndianNumber(cat.amount)}
              </span>
            </Badge>
          ))}
      </div>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground mt-2">
        {showAllCategories ? "Show less categories" : "Show more categories"}
      </p>
    </CardContent>
  </Card>
)}



      {/* Expense Table */}
      <Card className="border border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle>Expenses ({filteredExpenses.length})</CardTitle>
            <div className="flex gap-2 items-center">
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search expenses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2 text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    {dateFilter?.from
                      ? dateFilter.to
                        ? `${format(dateFilter.from, "dd MMM")} - ${format(dateFilter.to, "dd MMM")}`
                        : format(dateFilter.from, "dd MMM yyyy")
                      : "All Dates"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3 z-[100]" align="start">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Select date range</span>
                    {dateFilter?.from && (
                      <Button variant="ghost" size="sm" onClick={() => setDateFilter(undefined)} className="h-7 px-2 text-xs">Clear</Button>
                    )}
                  </div>
                  <DatePickerCalendar mode="range" selected={dateFilter} onSelect={setDateFilter} initialFocus />
                </PopoverContent>
              </Popover>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {expenseCategories.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  <TableHead>Expense #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => {
                  const cat = getCategoryInfo(expense.category);
                  return (
                    <TableRow key={expense.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openExpenseDetailDialog(expense)}>
                      <TableCell className="font-mono text-sm">{expense.expense_number}</TableCell>
                      <TableCell>{format(new Date(expense.expense_date), "dd MMM yyyy")}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <span>{cat.icon}</span> {cat.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                      <TableCell className="capitalize">{expense.payment_mode.replace("_", " ")}</TableCell>
                      <TableCell className="text-right font-bold text-destructive">₹{formatIndianNumber(expense.amount)}</TableCell>
                    </TableRow>
                  );
                })}
                {filteredExpenses.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No expenses found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredExpenses.map((expense) => {
              const cat = getCategoryInfo(expense.category);
              return (
                <Card key={expense.id} className="cursor-pointer hover:shadow-md transition-shadow border border-border" onClick={() => openExpenseDetailDialog(expense)}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="gap-1 text-xs">
                        <span>{cat.icon}</span> {cat.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{format(new Date(expense.expense_date), "dd MMM")}</span>
                    </div>
                    <p className="text-sm text-foreground truncate">{expense.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-destructive">₹{formatIndianNumber(expense.amount)}</span>
                      <span className="text-xs text-muted-foreground capitalize">{expense.payment_mode.replace("_", " ")}</span>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">{expense.expense_number}</p>
                  </CardContent>
                </Card>
              );
            })}
            {filteredExpenses.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">No expenses found</div>
            )}
          </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Expense"
        description="Are you sure you want to delete this expense? This action cannot be undone."
      />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
  className="
    max-w-lg
    px-4 sm:px-6
    data-[state=open]:animate-in
    data-[state=closed]:animate-out
    data-[state=open]:fade-in-0
    data-[state=closed]:fade-out-0
    data-[state=open]:zoom-in-95
    data-[state=closed]:zoom-out-95
    data-[state=open]:slide-in-from-top-4
  "
>


          <DialogHeader>
            <DialogTitle>{selectedExpense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pb-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  value={formData.amount || ""}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.expense_date || ""}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center gap-2">
                        <span>{c.icon}</span> {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Input
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                placeholder="Brief description of expense"
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <Select value={formData.payment_mode} onValueChange={(v) => setFormData({ ...formData, payment_mode: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {paymentModes.map(m => (
                    <SelectItem key={m} value={m} className="capitalize">{m.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder="Additional notes (optional)"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button
  type="submit"
  disabled={isDialogSubmitting}
  className={`transition-opacity ${
    isDialogSubmitting ? "opacity-60 pointer-events-none" : ""
  }`}
>
  {isDialogSubmitting
    ? selectedExpense
      ? "Updating Expense..."
      : "Adding Expense..."
    : selectedExpense
    ? "Update Expense"
    : "Add Expense"}
</Button>


            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
  <DialogContent
  className="
    w-[calc(100vw-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto
    data-[state=open]:animate-in
    data-[state=closed]:animate-out
    data-[state=open]:fade-in-0
    data-[state=closed]:fade-out-0
    data-[state=open]:zoom-in-95
    data-[state=closed]:zoom-out-95
    data-[state=open]:slide-in-from-bottom-4
  "
>

    {selectedExpenseDetail && (
      <>
        <DialogHeader className="flex flex-row items-center justify-between">
  <DialogTitle>
    Expense {selectedExpenseDetail.expense_number}
  </DialogTitle>
  <Badge variant="outline" className="capitalize">
    {getCategoryInfo(selectedExpenseDetail.category).icon}{" "}
    {getCategoryInfo(selectedExpenseDetail.category).label}
  </Badge>
</DialogHeader>

        <div className="space-y-4">
          {/* Expense Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="h-5 w-5" /> Expense Info
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-3 sm:px-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Amount</p>
                <p className="font-bold text-destructive">
                  ₹{formatIndianNumber(selectedExpenseDetail.amount)}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase">Date</p>
                <p className="font-medium">
                  {format(new Date(selectedExpenseDetail.expense_date), "dd MMM yyyy")}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase">Payment Mode</p>
                <p className="font-medium capitalize">
                  {selectedExpenseDetail.payment_mode.replace("_", " ")}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase">Category</p>
                <Badge variant="outline">
                  {getCategoryInfo(selectedExpenseDetail.category).icon}{" "}
                  {getCategoryInfo(selectedExpenseDetail.category).label}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <p className="text-sm">
                {selectedExpenseDetail.description || "-"}
              </p>
            </CardContent>
          </Card>

          {/* Notes */}
          {selectedExpenseDetail.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <p className="whitespace-pre-wrap text-sm">
                  {selectedExpenseDetail.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
  <Button
    variant="destructive"
    onClick={() => {
      setDetailDialogOpen(false);
      openDeleteDialog(selectedExpenseDetail.id);
    }}
  >
    <Trash2 className="h-4 w-4 mr-2" /> Delete Expense
  </Button>

  <p className="text-xs text-muted-foreground">
    Deleting this expense will also remove its linked payment entry.
  </p>
</div>

        </div>
      </>
    )}
  </DialogContent>
</Dialog>

    </div>
  );
};

export default Expenses;
