import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Phone, Mail, MapPin, Car, IndianRupee, AlertCircle, Filter, X } from "lucide-react";
import ViewToggle from "@/components/ViewToggle";
import { useViewMode } from "@/hooks/useViewMode";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import type { Database } from "@/integrations/supabase/types";
import { PageSkeleton } from "@/components/ui/page-skeleton";

type Customer = Database["public"]["Tables"]["customers"]["Row"];
type CustomerInsert = Database["public"]["Tables"]["customers"]["Insert"];

const idProofTypes = ["Aadhar", "Passport", "Voter ID", "PAN Card"] as const;

const isProfileIncomplete = (customer: Customer) => {
  const fields = [
    customer.address,
    customer.id_proof_type,
    customer.id_proof_number,
    customer.email,
  ];
  return fields.some((f) => !f || f.trim?.() === "");
};

const getCity = (address: string | null) => {
  if (!address) return "";
  if (address.includes("||")) return address.split("||")[1]?.trim() || "";
  return "";
};

type SaleWithVehicle = {
  id: string;
  sale_number: string;
  total_amount: number;
  amount_paid: number;
  balance_amount: number;
  status: string;
  sale_date: string;
  vehicle_id: string;
  vehicle_name?: string;
};

const Customers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { viewMode, setViewMode } = useViewMode("customers");

  const { data: customers = [] as Customer[], isLoading: loading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as Customer[];
      const { data, error } = await supabase.from("customers").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Customer[];
    },
    staleTime: 2 * 60 * 1000,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerSales, setCustomerSales] = useState<SaleWithVehicle[]>([]);
  const [formData, setFormData] = useState<Partial<CustomerInsert>>({
    full_name: "",
    phone: "",
    email: "",
    address: "",
    id_proof_type: "",
    id_proof_number: "",
    driving_license_number: "",
    notes: "",
    is_active: true,
  });

  const fetchCustomerSales = async (customerId: string) => {
    try {
      const { data: sales, error } = await supabase
        .from("sales")
        .select("id, sale_number, total_amount, amount_paid, balance_amount, status, sale_date, vehicle_id")
        .eq("customer_id", customerId)
        .order("sale_date", { ascending: false });
      if (error) throw error;
      if (!sales || sales.length === 0) { setCustomerSales([]); return; }

      const vehicleIds = [...new Set(sales.map(s => s.vehicle_id))];
      const { data: vehicles } = await supabase
        .from("vehicles")
        .select("id, brand, model, variant")
        .in("id", vehicleIds);

      const vehicleMap = new Map(
        (vehicles || []).map(v => [v.id, `${v.brand} ${v.model}${v.variant ? ` ${v.variant}` : ""}`])
      );

      setCustomerSales(
        sales.map(s => ({ ...s, vehicle_name: vehicleMap.get(s.vehicle_id) || "Unknown Vehicle" }))
      );
    } catch {
      setCustomerSales([]);
    }
  };

  const generateCode = () => `CUS${Date.now().toString(36).toUpperCase()}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsSubmitting(false); return; }
    try {
      if (selectedCustomer) {
        const { error } = await supabase.from("customers").update(formData).eq("id", selectedCustomer.id);
        if (error) throw error;
        toast({ title: "Customer updated successfully" });
      } else {
        const { error } = await supabase.from("customers").insert([{ ...formData, code: generateCode(), user_id: user.id } as CustomerInsert]);
        if (error) throw error;
        toast({ title: "Customer added successfully" });
      }
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;
    try {
      const { error } = await supabase.from("customers").delete().eq("id", customerToDelete);
      if (error) throw error;
      toast({ title: "Customer deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  const openDeleteDialog = (id: string) => {
    setCustomerToDelete(id);
    setDeleteDialogOpen(true);
  };

  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData(customer);
    setDialogOpen(true);
  };

  const openDetailDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailDialogOpen(true);
    fetchCustomerSales(customer.id);
  };

  const needsUpdate = (customer: Customer) => {
    if (!customer.converted_from_lead) return false;
    const essentialFields = [customer.address, customer.id_proof_type, customer.id_proof_number];
    return essentialFields.every((field) => !field || field.trim?.() === "");
  };

  const exportCustomers = () => {
    if (customers.length === 0) { toast({ title: "No customers to export" }); return; }
    const headers = ["Code", "Full Name", "Phone", "Email", "Status", "Address", "ID Proof Type", "ID Proof Number", "Driving License", "Created At"];
    const rows = customers.map((c) => [c.code, c.full_name, c.phone, c.email ?? "", c.is_active ? "Active" : "Inactive", c.address ?? "", c.id_proof_type ?? "", c.id_proof_number ?? "", c.driving_license_number ?? "", new Date(c.created_at).toLocaleDateString()]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setFormData({ full_name: "", phone: "", email: "", address: "", id_proof_type: "", id_proof_number: "", driving_license_number: "", notes: "", is_active: true });
  };

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCity, setFilterCity] = useState<string>("all");

  // Unique cities for filter
  const uniqueCities = Array.from(
    new Set(customers.map(c => getCity(c.address)).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b)) as string[];

  const activeFilterCount = [filterStatus, filterCity].filter(f => f !== "all").length;

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = `${c.full_name} ${c.phone} ${c.email || ""} ${c.code}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || (filterStatus === "active" ? c.is_active : !c.is_active);
    const matchesCity = filterCity === "all" || getCity(c.address) === filterCity;
    return matchesSearch && matchesStatus && matchesCity;
  });

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCustomers}>Export</Button>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Add Customer
          </Button>
        </div>
      </div>

      <Card className="border border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle>Customer List ({filteredCustomers.length})</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search customers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Button variant="outline" size="icon" className="relative" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
              <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
            </div>
          </div>

          {/* Filter bar */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 mt-4 p-3 bg-muted/50 rounded-lg border border-border">
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">City</Label>
                <Select value={filterCity} onValueChange={setFilterCity}>
                  <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {uniqueCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" className="self-end text-xs gap-1" onClick={() => { setFilterStatus("all"); setFilterCity("all"); }}>
                  <X className="h-3 w-3" /> Clear
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {viewMode === "list" ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetailDialog(customer)}>
                      <TableCell className="font-mono text-sm">{customer.code}</TableCell>
                      <TableCell className="font-medium">{customer.full_name}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.email || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={customer.is_active ? "bg-chart-2 text-white" : "bg-muted"}>
                            {customer.is_active ? "Active" : "Inactive"}
                          </Badge>
                          {customer.converted_from_lead && (
                            <Badge className="bg-purple-500/10 text-purple-600">Lead</Badge>
                          )}
                          {needsUpdate(customer) && (
                            <Badge className="bg-amber-500/10 text-amber-600 animate-pulse-fade">Update Needed</Badge>
                          )}
                          {isProfileIncomplete(customer) && (
                            <span className="relative flex h-2.5 w-2.5" title="Profile incomplete">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No customers found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredCustomers.map((customer) => {
                const city = getCity(customer.address);
                return (
                  <Card key={customer.id} className="cursor-pointer hover:shadow-md transition-shadow border border-border" onClick={() => openDetailDialog(customer)}>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 text-sm">
                          {customer.full_name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <p className="font-semibold text-foreground truncate text-sm">{customer.full_name}</p>
                            {isProfileIncomplete(customer) && (
                              <span className="relative flex h-2 w-2 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground font-mono">{customer.code}</p>
                        </div>
                      </div>
                      <div className="space-y-0.5 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-3 w-3 shrink-0" />
                          <span className="truncate">{customer.phone}</span>
                        </div>
                        {city && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{city}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        <Badge className={`text-[10px] px-1.5 py-0 ${customer.is_active ? "bg-chart-2 text-white" : "bg-muted"}`}>
                          {customer.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {customer.converted_from_lead && (
                          <Badge className="bg-purple-500/10 text-purple-600 text-[10px] px-1.5 py-0">Lead</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {filteredCustomers.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">No customers found</div>
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
        title="Delete Customer"
        description="Are you sure you want to delete this customer? This action cannot be undone."
      />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={formData.full_name || ""} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input value={formData.phone || ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>ID Proof Type</Label>
                <Select value={formData.id_proof_type || ""} onValueChange={(v) => setFormData({ ...formData, id_proof_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{idProofTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ID Proof Number</Label>
                <Input value={formData.id_proof_number || ""} onChange={(e) => setFormData({ ...formData, id_proof_number: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Driving License Number</Label>
                <Input value={formData.driving_license_number || ""} onChange={(e) => setFormData({ ...formData, driving_license_number: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Street Address</Label>
              <Textarea value={(formData.address || "").split("||")[0] || ""} onChange={(e) => {
                const parts = (formData.address || "").split("||");
                parts[0] = e.target.value;
                setFormData({ ...formData, address: parts.join("||") });
              }} rows={2} placeholder="Street address, area, landmark" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={(formData.address || "").split("||")[1] || ""} onChange={(e) => {
                  const parts = (formData.address || "").split("||");
                  while (parts.length < 4) parts.push("");
                  parts[1] = e.target.value;
                  setFormData({ ...formData, address: parts.join("||") });
                }} placeholder="City" />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input value={(formData.address || "").split("||")[2] || ""} onChange={(e) => {
                  const parts = (formData.address || "").split("||");
                  while (parts.length < 4) parts.push("");
                  parts[2] = e.target.value;
                  setFormData({ ...formData, address: parts.join("||") });
                }} placeholder="State" />
              </div>
              <div className="space-y-2">
                <Label>Pincode</Label>
                <Input value={(formData.address || "").split("||")[3] || ""} onChange={(e) => {
                  const parts = (formData.address || "").split("||");
                  while (parts.length < 4) parts.push("");
                  parts[3] = e.target.value;
                  setFormData({ ...formData, address: parts.join("||") });
                }} placeholder="Pincode" maxLength={6} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={formData.notes || ""} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : (selectedCustomer ? "Update" : "Add")} Customer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="w-[calc(100%-16px)] sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedCustomer.full_name}</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" tabIndex={-1} onClick={() => { setDetailDialogOpen(false); openEditDialog(selectedCustomer); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {customerSales.length === 0 && (
                      <Button variant="ghost" size="icon" tabIndex={-1} onClick={() => { setDetailDialogOpen(false); openDeleteDialog(selectedCustomer.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold">
                    {selectedCustomer.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-mono text-sm text-muted-foreground">{selectedCustomer.code}</p>
                    <div className="flex items-center gap-2">
                      <Badge className={selectedCustomer.is_active ? "bg-chart-2 text-white" : "bg-muted"}>
                        {selectedCustomer.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {isProfileIncomplete(selectedCustomer) && (
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedCustomer.phone}</span>
                  </div>
                  {selectedCustomer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedCustomer.email}</span>
                    </div>
                  )}
                  {selectedCustomer.address && (
                    <div className="flex items-start gap-2 md:col-span-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                      <span>{selectedCustomer.address.includes("||") ? selectedCustomer.address.split("||").filter(Boolean).join(", ") : selectedCustomer.address}</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">ID Proof</p>
                    <p className="font-medium">{selectedCustomer.id_proof_type || "-"}</p>
                    <p className="text-sm font-mono">{selectedCustomer.id_proof_number || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Driving License</p>
                    <p className="font-mono">{selectedCustomer.driving_license_number || "-"}</p>
                  </div>
                </div>

                {/* Vehicles Sold Section */}
                {customerSales.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Car className="h-4 w-4" /> Vehicles Sold
                    </h3>
                    <div className="space-y-2">
                      {customerSales.map((sale) => (
                        <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{sale.vehicle_name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{sale.sale_number} • {new Date(sale.sale_date).toLocaleDateString("en-IN")}</p>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <p className="text-sm font-semibold">{formatCurrency(sale.total_amount)}</p>
                            <div className="flex items-center gap-1 justify-end">
                              {sale.balance_amount > 0 ? (
                                <Badge className="bg-amber-500/10 text-amber-600 text-[10px] px-1.5 py-0 gap-1">
                                  <AlertCircle className="h-2.5 w-2.5" />
                                  {formatCurrency(sale.balance_amount)} pending
                                </Badge>
                              ) : (
                                <Badge className="bg-chart-2/10 text-chart-2 text-[10px] px-1.5 py-0">Paid</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-sm p-2 bg-muted rounded-md">
                      <span className="text-muted-foreground">Total</span>
                      <div className="text-right">
                        <span className="font-semibold">{formatCurrency(customerSales.reduce((s, c) => s + c.total_amount, 0))}</span>
                        {customerSales.reduce((s, c) => s + c.balance_amount, 0) > 0 && (
                          <p className="text-xs text-amber-600">
                            {formatCurrency(customerSales.reduce((s, c) => s + c.balance_amount, 0))} pending
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {customerSales.length === 0 && (
                  <div className="text-center py-4 text-sm text-muted-foreground bg-muted/30 rounded-lg">
                    <Car className="h-5 w-5 mx-auto mb-1 opacity-50" />
                    No vehicles sold to this customer
                  </div>
                )}

                {selectedCustomer.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p>{selectedCustomer.notes}</p>
                  </div>
                )}
              </div>

              {isProfileIncomplete(selectedCustomer) && (
                <div className="p-3 rounded-md bg-amber-500/10 text-amber-700 text-sm animate-fade-in">
                  ⚠️ This customer profile is incomplete. Please update missing details.
                </div>
              )}

              {needsUpdate(selectedCustomer) && !isProfileIncomplete(selectedCustomer) && (
                <div className="p-3 rounded-md bg-amber-500/10 text-amber-700 text-sm animate-fade-in">
                  ⚠️ This customer was converted from a lead. Please update missing details.
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;
