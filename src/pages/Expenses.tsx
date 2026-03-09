import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import ScrollLoader from "@/components/ScrollLoader";
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
import { Plus, Pencil, Trash2, Search, Receipt, TrendingUp, IndianRupee, Filter } from "lucide-react";
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
import { useIsMobile } from "@/hooks/use-mobile";

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  fuel: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300" },
  maintenance: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  office_supplies: { bg: "bg-slate-100 dark:bg-slate-800/50", text: "text-slate-700 dark:text-slate-300" },
  utilities: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300" },
  rent: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300" },
  salary: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" },
  marketing: { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-300" },
  insurance: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300" },
  travel: { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-300" },
  food: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300" },
  cleaning: { bg: "bg-teal-100 dark:bg-teal-900/30", text: "text-teal-700 dark:text-teal-300" },
  professional_fees: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300" },
  vehicle_parts: { bg: "bg-sky-100 dark:bg-sky-900/30", text: "text-sky-700 dark:text-sky-300" },
  miscellaneous: { bg: "bg-gray-100 dark:bg-gray-800/50", text: "text-gray-700 dark:text-gray-300" },
};

const PAYMENT_MODE_COLORS: Record<string, { bg: string; text: string }> = {
  cash: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300" },
  bank_transfer: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  cheque: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300" },
  upi: { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-300" },
  card: { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-300" },
};




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
  const queryClient = useQueryClient();
  const { viewMode, setViewMode } = useViewMode("expenses");

  const { data: expenses = [] as Expense[], isLoading: loading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as Expense[];
      const { data, error } = await supabase
        .from("expenses")
        .select("id,expense_number,amount,category,description,expense_date,payment_mode,vehicle_id,notes,created_at,user_id")
        .eq("user_id", user.id)
        .order("expense_date", { ascending: false });
      if (error) throw error;
      return (data || []) as Expense[];
    },
    staleTime: 2 * 60 * 1000,
  });

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
  const [showFilters, setShowFilters] = useState(false);
  const isMobile = useIsMobile();

  const [dateFilter, setDateFilter] = useState<DateRange | undefined>(undefined);

  const [formData, setFormData] = useState<Partial<ExpenseInsert>>({
    amount: 0,
    category: "miscellaneous",
    description: "",
    expense_date: new Date().toISOString().split("T")[0],
    payment_mode: "cash",
    notes: "",
  });

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
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
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

    queryClient.invalidateQueries({ queryKey: ['expenses'] });
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

  const { displayedItems: displayedExpenses, hasMore: hasMoreExpenses, loaderRef: expensesLoaderRef } = useInfiniteScroll(filteredExpenses, 30);


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
            <div className="flex gap-2 items-center flex-wrap">
              <div className="relative max-w-xs flex-1 min-w-[150px]">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search expenses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>

              {/* Mobile: filter icon toggle */}
              {isMobile && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowFilters(!showFilters)}
                  className="relative"
                >
                  <Filter className="h-4 w-4" />
                  {(categoryFilter !== "all" || dateFilter?.from) && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary" />
                  )}
                </Button>
              )}

              {/* Desktop: always show filters */}
              {!isMobile && (
                <>
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
                </>
              )}
              <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
            </div>
          </div>

          {/* Mobile expanded filters */}
          {isMobile && showFilters && (
            <div className="flex flex-col gap-2 mt-3 animate-fade-in">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2 text-muted-foreground w-full justify-start">
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
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {expenseCategories.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
                {displayedExpenses.map((expense) => {
                  const cat = getCategoryInfo(expense.category);
                  const catColor = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.miscellaneous;
                  const pmColor = PAYMENT_MODE_COLORS[expense.payment_mode] || PAYMENT_MODE_COLORS.cash;
                  return (
                    <TableRow key={expense.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openExpenseDetailDialog(expense)}>
                      <TableCell className="font-mono text-sm">{expense.expense_number}</TableCell>
                      <TableCell>{format(new Date(expense.expense_date), "dd MMM yyyy")}</TableCell>
                      <TableCell>
                        <Badge className={`gap-1 border-0 ${catColor.bg} ${catColor.text}`}>
                          <span>{cat.icon}</span> {cat.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                      <TableCell>
                        <Badge className={`border-0 capitalize ${pmColor.bg} ${pmColor.text}`}>
                          {expense.payment_mode.replace("_", " ")}
                        </Badge>
                      </TableCell>
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
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {displayedExpenses.map((expense) => {
              const cat = getCategoryInfo(expense.category);
              const catColor = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.miscellaneous;
              const pmColor = PAYMENT_MODE_COLORS[expense.payment_mode] || PAYMENT_MODE_COLORS.cash;
              return (
                <Card key={expense.id} className="cursor-pointer hover:shadow-md transition-shadow border border-border" onClick={() => openExpenseDetailDialog(expense)}>
                  <CardContent className="p-3 sm:p-4 space-y-2">
                    <div className="flex items-start justify-between gap-1">
                      <Badge className={`gap-1 text-[10px] sm:text-xs border-0 ${catColor.bg} ${catColor.text}`}>
                        <span>{cat.icon}</span> <span className="hidden sm:inline">{cat.label}</span><span className="sm:hidden">{cat.label.split(" ")[0]}</span>
                      </Badge>
                      <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">{format(new Date(expense.expense_date), "dd MMM")}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-foreground truncate">{expense.description}</p>
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-sm text-destructive">₹{formatIndianNumber(expense.amount)}</span>
                      <Badge className={`border-0 capitalize text-[10px] sm:text-xs ${pmColor.bg} ${pmColor.text}`}>
                        {expense.payment_mode.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="font-mono text-[10px] sm:text-xs text-muted-foreground">{expense.expense_number}</p>
                  </CardContent>
                </Card>
              );
            })}
            {filteredExpenses.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">No expenses found</div>
            )}
          </div>
          )}
          <ScrollLoader ref={expensesLoaderRef} hasMore={hasMoreExpenses} />
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
