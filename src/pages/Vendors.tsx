import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Eye, Phone, Mail, MapPin, Building, User, History, Car, IndianRupee, Filter, X } from "lucide-react";
import ViewToggle from "@/components/ViewToggle";
import { useViewMode } from "@/hooks/useViewMode";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { formatCurrency, formatIndianNumber } from "@/lib/formatters";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import { PageSkeleton } from "@/components/ui/page-skeleton";

type Vendor = Database["public"]["Tables"]["vendors"]["Row"];
type VendorInsert = Database["public"]["Tables"]["vendors"]["Insert"];
type VehiclePurchase = Database["public"]["Tables"]["vehicle_purchases"]["Row"];
type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];

type VendorType = "company" | "individual";

// Helper to parse address stored as "line1||city||state||pincode"
const parseAddress = (address: string | null) => {
  if (!address) return { line1: "", city: "", state: "", pincode: "" };
  const parts = address.split("||");
  return {
    line1: parts[0] || "",
    city: parts[1] || "",
    state: parts[2] || "",
    pincode: parts[3] || "",
  };
};

const formatAddress = (addr: { line1: string; city: string; state: string; pincode: string }) => {
  return [addr.line1, addr.city, addr.state, addr.pincode].join("||");
};

const displayAddress = (address: string | null) => {
  if (!address) return "";
  const p = parseAddress(address);
  return [p.line1, p.city, p.state, p.pincode].filter(Boolean).join(", ");
};

const Vendors = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { viewMode, setViewMode } = useViewMode("vendors");
  const { data: pageData, isLoading: loading } = useQuery({
    queryKey: ['vendors-page'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { vendors: [] as Vendor[], purchases: [] as VehiclePurchase[], vehicles: [] as Vehicle[] };
      const [vendorsRes, purchasesRes, vehiclesRes] = await Promise.all([
        supabase.from("vendors").select("id,code,name,phone,email,address,contact_person,gst_number,bank_name,bank_account_number,bank_ifsc,notes,is_active,vendor_type,created_at,user_id,converted_from_lead,lead_id").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("vehicle_purchases").select("id,vehicle_id,vendor_id,purchase_price,balance_amount,purchase_date,purchase_number").eq("user_id", user.id).order("purchase_date", { ascending: false }),
        supabase.from("vehicles").select("id,brand,model,variant,code,status").eq("user_id", user.id),
      ]);
      return {
        vendors: (vendorsRes.data || []) as Vendor[],
        purchases: (purchasesRes.data || []) as VehiclePurchase[],
        vehicles: (vehiclesRes.data || []) as Vehicle[],
      };
    },
    staleTime: 2 * 60 * 1000,
  });

  const vendors = pageData?.vendors || [];
  const purchases = pageData?.purchases || [];
  const vehicles = pageData?.vehicles || [];
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendorType, setVendorType] = useState<VendorType>("company");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Address fields for form
  const [addressFields, setAddressFields] = useState({ line1: "", city: "", state: "", pincode: "" });

  const [formData, setFormData] = useState<Partial<VendorInsert>>({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    gst_number: "",
    bank_name: "",
    bank_account_number: "",
    bank_ifsc: "",
    notes: "",
    is_active: true,
  });

  useEffect(() => {
    const handler = () => queryClient.invalidateQueries({ queryKey: ['vendors-page'] });
    window.addEventListener("vendor-updated", handler);
    return () => window.removeEventListener("vendor-updated", handler);
  }, [queryClient]);

  const generateCode = () => `VEN${Date.now().toString(36).toUpperCase()}`;

  const detectVendorType = (vendor: Vendor): VendorType => {
    if (vendor.gst_number || (vendor.contact_person && vendor.contact_person !== vendor.name)) return "company";
    return "individual";
  };

  const isProfileIncomplete = (vendor: Vendor) => {
    const requiredFields = [vendor.address, vendor.phone];
    if ((vendor.vendor_type as string) === "company") {
      requiredFields.push(vendor.gst_number);
    }
    return requiredFields.some((field) => !field || field.trim?.() === "");
  };

  const getVendorHistory = (vendorId: string) => {
    const vendorPurchases = purchases.filter(p => p.vendor_id === vendorId);
    return vendorPurchases.map(p => {
      const vehicle = vehicles.find(v => v.id === p.vehicle_id);
      return { ...p, vehicle };
    });
  };

  const getVendorStats = (vendorId: string) => {
    const vendorPurchases = purchases.filter(p => p.vendor_id === vendorId);
    return {
      totalPurchases: vendorPurchases.length,
      totalAmount: vendorPurchases.reduce((sum, p) => sum + Number(p.purchase_price), 0),
      pendingAmount: vendorPurchases.reduce((sum, p) => sum + Number(p.balance_amount), 0),
    };
  };

  const hasAssociatedPurchases = (vendorId: string) => {
    return purchases.some(p => p.vendor_id === vendorId);
  };

  const hasPendingPayment = (vendorId: string) => {
    return purchases.some(p => p.vendor_id === vendorId && Number(p.balance_amount) > 0);
  };

  // Get unique cities for filter
  const uniqueCities = [...new Set(
    vendors
      .map(v => parseAddress(v.address).city)
      .filter(Boolean)
  )].sort();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsSubmitting(false); return; }

    try {
      const dataToSubmit = {
        ...formData,
        vendor_type: vendorType,
        address: formatAddress(addressFields),
      };

      if (vendorType === "individual" && !dataToSubmit.contact_person) {
        dataToSubmit.contact_person = dataToSubmit.name;
      }

      if (selectedVendor) {
        const { error } = await supabase.from("vendors").update(dataToSubmit).eq("id", selectedVendor.id);
        if (error) throw error;
        toast({ title: "Vendor updated successfully" });
      } else {
        const { error } = await supabase.from("vendors").insert([{ ...dataToSubmit, code: generateCode(), user_id: user.id } as VendorInsert]);
        if (error) throw error;
        toast({ title: "Vendor added successfully" });
      }
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['vendors-page'] });
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!vendorToDelete) return;
    try {
      const { error } = await supabase.from("vendors").delete().eq("id", vendorToDelete);
      if (error) throw error;
      toast({ title: "Vendor deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['vendors-page'] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setVendorToDelete(null);
    }
  };

  const openDeleteDialog = (id: string) => {
    setVendorToDelete(id);
    setDeleteDialogOpen(true);
  };

  const openEditDialog = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setFormData(vendor);
    setVendorType(vendor.vendor_type as VendorType);
    setAddressFields(parseAddress(vendor.address));
    setDialogOpen(true);
  };

  const openDetailDialog = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setDetailDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedVendor(null);
    setVendorType("individual");
    setAddressFields({ line1: "", city: "", state: "", pincode: "" });
    setFormData({
      name: "", contact_person: "", phone: "", email: "", address: "",
      gst_number: "", bank_name: "", bank_account_number: "", bank_ifsc: "",
      notes: "", is_active: true,
    });
  };

  // Apply filters
  const filteredVendors = vendors.filter((v) => {
    const matchesSearch = `${v.name} ${v.contact_person || ""} ${v.phone || ""} ${v.code}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || (filterStatus === "active" ? v.is_active : !v.is_active);
    const matchesCity = filterCity === "all" || parseAddress(v.address).city === filterCity;
    const matchesType = filterType === "all" || (v.vendor_type as string) === filterType;
    return matchesSearch && matchesStatus && matchesCity && matchesType;
  });

  const activeFilterCount = [filterStatus, filterCity, filterType].filter(f => f !== "all").length;

  if (loading) return <PageSkeleton />;

  const addressFormFields = (
    <div className="space-y-3">
      <Label>Address</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2 space-y-1">
          <Label className="text-xs text-muted-foreground">Address Line 1</Label>
          <Input value={addressFields.line1} onChange={(e) => setAddressFields({ ...addressFields, line1: e.target.value })} placeholder="Street / Area" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">City</Label>
          <Input value={addressFields.city} onChange={(e) => setAddressFields({ ...addressFields, city: e.target.value })} placeholder="City" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">State</Label>
          <Input value={addressFields.state} onChange={(e) => setAddressFields({ ...addressFields, state: e.target.value })} placeholder="State" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Pincode</Label>
          <Input value={addressFields.pincode} onChange={(e) => setAddressFields({ ...addressFields, pincode: e.target.value })} placeholder="Pincode" maxLength={6} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vendors</h1>
          <p className="text-muted-foreground">Manage your supplier database</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Add Vendor
        </Button>
      </div>

      <Card className="border border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle>Vendor List ({filteredVendors.length})</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search vendors..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
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
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" className="self-end text-xs gap-1" onClick={() => { setFilterStatus("all"); setFilterCity("all"); setFilterType("all"); }}>
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
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.map((vendor) => {
                  const type = vendor.vendor_type as VendorType;
                  const stats = getVendorStats(vendor.id);
                  const pending = stats.pendingAmount > 0;
                  const canDelete = !hasAssociatedPurchases(vendor.id);
                  return (
                    <TableRow key={vendor.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetailDialog(vendor)}>
                      <TableCell className="font-mono text-sm">{vendor.code}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {type === "company" ? <Building className="h-4 w-4" /> : <User className="h-4 w-4" />}
                          <span className="capitalize text-sm">{type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {vendor.name}
                          {isProfileIncomplete(vendor) && (
                            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse inline-block" title="Incomplete profile" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{vendor.contact_person || "-"}</TableCell>
                      <TableCell className="text-sm">{parseAddress(vendor.address).city || "-"}</TableCell>
                      <TableCell>{vendor.phone || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge className={vendor.is_active ? "bg-chart-2 text-white" : "bg-muted text-muted-foreground"}>
                            {vendor.is_active ? "Active" : "Inactive"}
                          </Badge>
                          {vendor.converted_from_lead && (
                            <Badge className="bg-purple-500/10 text-purple-600 text-[10px]">Lead</Badge>
                          )}
                          {pending && (
                            <Badge className="bg-destructive/10 text-destructive text-[10px]">₹ Pending</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {canDelete && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDeleteDialog(vendor.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredVendors.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No vendors found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredVendors.map((vendor) => {
              const type = vendor.vendor_type as VendorType;
              const stats = getVendorStats(vendor.id);
              const pending = stats.pendingAmount > 0;
              const incomplete = isProfileIncomplete(vendor);
              return (
                <Card key={vendor.id} className="cursor-pointer hover:shadow-md transition-shadow border border-border relative" onClick={() => openDetailDialog(vendor)}>
                  {/* Incomplete profile indicator */}
                  {incomplete && (
                    <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" title="Incomplete profile" />
                  )}
                  <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {type === "company" ? <Building className="h-4 w-4 sm:h-5 sm:w-5 text-primary" /> : <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate text-sm sm:text-base">{vendor.name}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground font-mono">{vendor.code}</p>
                      </div>
                    </div>
                    <div className="space-y-1 text-xs sm:text-sm">
                      {vendor.phone && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-3 w-3 shrink-0" />
                          <span className="truncate">{vendor.phone}</span>
                        </div>
                      )}
                      {parseAddress(vendor.address).city && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{parseAddress(vendor.address).city}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge className={`${vendor.is_active ? "bg-chart-2 text-white" : "bg-muted text-muted-foreground"} text-[10px]`}>
                        {vendor.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {vendor.converted_from_lead && (
                        <Badge className="bg-purple-500/10 text-purple-600 text-[10px]">Lead</Badge>
                      )}
                      {pending && (
                        <Badge className="bg-destructive/10 text-destructive text-[10px]">₹ Due</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filteredVendors.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">No vendors found</div>
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
        title="Delete Vendor"
        description="Are you sure you want to delete this vendor? This action cannot be undone."
      />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedVendor ? "Edit Vendor" : "Add New Vendor"}</DialogTitle>
            <DialogDescription>
              {selectedVendor ? "Update vendor information" : "Choose vendor type and fill in the details"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-medium">Vendor Type</Label>
              <RadioGroup value={vendorType} onValueChange={(v) => setVendorType(v as VendorType)} className="flex gap-4">
                <div className="flex items-center space-x-2 border border-border rounded-lg p-4 flex-1 cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="company" id="company" />
                  <Label htmlFor="company" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Building className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Company</p>
                      <p className="text-sm text-muted-foreground">Business or organization</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border border-border rounded-lg p-4 flex-1 cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="individual" id="individual" />
                  <Label htmlFor="individual" className="flex items-center gap-2 cursor-pointer flex-1">
                    <User className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Individual</p>
                      <p className="text-sm text-muted-foreground">Person / sole proprietor</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {vendorType === "company" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company Name *</Label>
                    <Input value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Enter company name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Person *</Label>
                    <Input value={formData.contact_person || ""} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} required placeholder="Contact person name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input value={formData.phone || ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required placeholder="Phone number" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Email address" />
                  </div>
                  <div className="space-y-2">
                    <Label>GST Number</Label>
                    <Input value={formData.gst_number || ""} onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })} placeholder="GST registration number" />
                  </div>
                </div>
                {addressFormFields}
                <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                  <Label className="font-medium">Bank Details</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Bank Name</Label>
                      <Input value={formData.bank_name || ""} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} placeholder="Bank name" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Account Number</Label>
                      <Input value={formData.bank_account_number || ""} onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })} placeholder="Account number" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">IFSC Code</Label>
                      <Input value={formData.bank_ifsc || ""} onChange={(e) => setFormData({ ...formData, bank_ifsc: e.target.value })} placeholder="IFSC code" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {vendorType === "individual" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Enter full name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input value={formData.phone || ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required placeholder="Phone number" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Email address" />
                  </div>
                </div>
                {addressFormFields}
                <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                  <Label className="font-medium">Bank Details (Optional)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Bank Name</Label>
                      <Input value={formData.bank_name || ""} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} placeholder="Bank name" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Account Number</Label>
                      <Input value={formData.bank_account_number || ""} onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })} placeholder="Account number" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">IFSC Code</Label>
                      <Input value={formData.bank_ifsc || ""} onChange={(e) => setFormData({ ...formData, bank_ifsc: e.target.value })} placeholder="IFSC code" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={formData.notes || ""} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} placeholder="Additional notes" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (selectedVendor ? "Updating..." : "Adding...") : (selectedVendor ? "Update" : "Add")} Vendor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog with History */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="w-[calc(100%-16px)] sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg">
          <div className="px-4 sm:px-6">
          {selectedVendor && (
            <>
              <DialogHeader className="flex flex-row items-center justify-between">
                <DialogTitle>{selectedVendor.name}</DialogTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" tabIndex={-1} onClick={() => { setDetailDialogOpen(false); openEditDialog(selectedVendor); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {!hasAssociatedPurchases(selectedVendor.id) && (
                    <Button variant="ghost" size="icon" tabIndex={-1} onClick={() => { setDetailDialogOpen(false); openDeleteDialog(selectedVendor.id); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </DialogHeader>

              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details" className="gap-2"><User className="h-4 w-4" /> Details</TabsTrigger>
                  <TabsTrigger value="history" className="gap-2"><History className="h-4 w-4" /> Purchase History</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6 mt-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center relative">
                      {detectVendorType(selectedVendor) === "company" ? <Building className="h-8 w-8" /> : <User className="h-8 w-8" />}
                      {isProfileIncomplete(selectedVendor) && (
                        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-amber-500 animate-pulse border-2 border-background" />
                      )}
                    </div>
                    <div>
                      <p className="font-mono text-sm text-muted-foreground">{selectedVendor.code}</p>
                      <div className="flex items-center gap-2">
                        <Badge className={selectedVendor.is_active ? "bg-chart-2 text-white" : "bg-muted"}>
                          {selectedVendor.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {selectedVendor.converted_from_lead && (
                          <Badge className="bg-purple-500/10 text-purple-600">From Lead</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  {(() => {
                    const stats = getVendorStats(selectedVendor.id);
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="border border-border">
                          <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-chart-1">{stats.totalPurchases}</p>
                            <p className="text-xs text-muted-foreground">Total Purchases</p>
                          </CardContent>
                        </Card>
                        <Card className="border border-border">
                          <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-chart-2">₹{formatIndianNumber(stats.totalAmount)}</p>
                            <p className="text-xs text-muted-foreground">Total Amount</p>
                          </CardContent>
                        </Card>
                        <Card className="border border-border">
                          <CardContent className="p-4 text-center">
                            <p className={`text-2xl font-bold ${stats.pendingAmount > 0 ? "text-destructive" : "text-chart-3"}`}>₹{formatIndianNumber(stats.pendingAmount)}</p>
                            <p className="text-xs text-muted-foreground">Pending</p>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedVendor.contact_person && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedVendor.contact_person}</span>
                      </div>
                    )}
                    {selectedVendor.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedVendor.phone}</span>
                      </div>
                    )}
                    {selectedVendor.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedVendor.email}</span>
                      </div>
                    )}
                    {selectedVendor.address && displayAddress(selectedVendor.address) && (
                      <div className="flex items-start gap-2 md:col-span-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                        <span>{displayAddress(selectedVendor.address)}</span>
                      </div>
                    )}
                  </div>
                  {selectedVendor.gst_number && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">GST Number</p>
                      <p className="font-mono font-medium">{selectedVendor.gst_number}</p>
                    </div>
                  )}
                  {(selectedVendor.bank_name || selectedVendor.bank_account_number) && (
                    <div className="p-4 bg-muted rounded-lg space-y-3">
                      <p className="text-sm text-muted-foreground font-medium">Bank Details</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Bank Name</p>
                          <p className="font-medium break-words">{selectedVendor.bank_name || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Account No</p>
                          <p className="font-mono break-all">{selectedVendor.bank_account_number || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">IFSC</p>
                          <p className="font-mono break-all">{selectedVendor.bank_ifsc || "-"}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedVendor.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p>{selectedVendor.notes}</p>
                    </div>
                  )}
                  {isProfileIncomplete(selectedVendor) && (
                    <div className="p-3 rounded-md bg-amber-500/10 text-amber-700 text-sm animate-fade-in">
                      ⚠️ This vendor profile is incomplete. Please update missing details.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                  {(() => {
                    const history = getVendorHistory(selectedVendor.id);
                    return history.length > 0 ? (
                      <div className="space-y-3">
                        {history.map((purchase) => (
                          <Card key={purchase.id} className="border border-border">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-chart-1/20 flex items-center justify-center">
                                    <Car className="h-5 w-5 text-chart-1" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{purchase.vehicle?.brand} {purchase.vehicle?.model}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {purchase.purchase_number} • {format(new Date(purchase.purchase_date), "dd MMM yyyy")}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-chart-2">₹{formatIndianNumber(purchase.purchase_price)}</p>
                                  {Number(purchase.balance_amount) > 0 && (
                                    <p className="text-sm text-destructive">Pending: ₹{formatIndianNumber(purchase.balance_amount)}</p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No purchase history found for this vendor</p>
                      </div>
                    );
                  })()}
                </TabsContent>
              </Tabs>
            </>
          )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Vendors;
