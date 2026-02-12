import { useEffect, useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Eye, Phone, Mail, MapPin, Building, User, History, Car, IndianRupee } from "lucide-react";
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

const Vendors = () => {
  const { toast } = useToast();
  const { viewMode, setViewMode } = useViewMode("vendors");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchases, setPurchases] = useState<VehiclePurchase[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendorType, setVendorType] = useState<VendorType>("company");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  fetchData();

  const handler = () => fetchData();
  window.addEventListener("vendor-updated", handler);

  return () => {
    window.removeEventListener("vendor-updated", handler);
  };
}, []);


  const fetchData = async () => {
    try {
      // Get current user for explicit filtering
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const [vendorsRes, purchasesRes, vehiclesRes] = await Promise.all([
        supabase.from("vendors").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("vehicle_purchases").select("*").eq("user_id", user.id).order("purchase_date", { ascending: false }),
        supabase.from("vehicles").select("*").eq("user_id", user.id),
      ]);
      setVendors(vendorsRes.data || []);
      setPurchases(purchasesRes.data || []);
      setVehicles(vehiclesRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => `VEN${Date.now().toString(36).toUpperCase()}`;

  const detectVendorType = (vendor: Vendor): VendorType => {
    if (vendor.gst_number || (vendor.contact_person && vendor.contact_person !== vendor.name)) {
      return "company";
    }
    return "individual";
  };

  const needsUpdateVendor = (vendor: Vendor) => {
  // Only vendors converted from leads
  if (!vendor.converted_from_lead) return false;

  const requiredFields = [
    vendor.address,
    vendor.phone,
    vendor.vendor_type === "company" ? vendor.gst_number : "ok",
    vendor.bank_account_number,
    vendor.bank_ifsc,
  ];

  return requiredFields.some(
    (field) => !field || field.trim?.() === ""
  );
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

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (isSubmitting) return; // 🔒 prevent double submit
  setIsSubmitting(true);

const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  setIsSubmitting(false); // 🔓 unlock
  return;
}


    try {
      //const dataToSubmit = { ...formData };
      const dataToSubmit = {
  ...formData,
  vendor_type: vendorType,
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
      fetchData();
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    finally {
  setIsSubmitting(false); // 🔓 unlock button
}
  };

  const handleDelete = async () => {
    if (!vendorToDelete) return;
    try {
      const { error } = await supabase.from("vendors").delete().eq("id", vendorToDelete);
      if (error) throw error;
      toast({ title: "Vendor deleted successfully" });
      fetchData();
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
    setDialogOpen(true);
  };

  const openDetailDialog = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setDetailDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedVendor(null);
    setVendorType("individual");
    setFormData({
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
  };

  const filteredVendors = vendors.filter((v) =>
    `${v.name} ${v.contact_person || ""} ${v.phone || ""} ${v.code}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <PageSkeleton />;
  }

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
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>GST</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.map((vendor) => {
                  const type = vendor.vendor_type as VendorType;
                  return (
                    <TableRow key={vendor.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetailDialog(vendor)}>
                      <TableCell className="font-mono text-sm">{vendor.code}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {type === "company" ? <Building className="h-4 w-4" /> : <User className="h-4 w-4" />}
                          <span className="capitalize text-sm">{type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{vendor.name}</TableCell>
                      <TableCell>{vendor.contact_person || "-"}</TableCell>
                      <TableCell>{vendor.phone || "-"}</TableCell>
                      <TableCell className="font-mono text-sm">{vendor.gst_number || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={vendor.is_active ? "bg-chart-2 text-white" : "bg-muted text-muted-foreground"}>
                            {vendor.is_active ? "Active" : "Inactive"}
                          </Badge>
                          {vendor.converted_from_lead && (
                            <Badge className="bg-purple-500/10 text-purple-600">Lead</Badge>
                          )}
                          {needsUpdateVendor(vendor) && (
                            <Badge className="bg-amber-500/10 text-amber-600 animate-pulse-fade">Update Needed</Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredVendors.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No vendors found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredVendors.map((vendor) => {
              const type = vendor.vendor_type as VendorType;
              return (
                <Card key={vendor.id} className="cursor-pointer hover:shadow-md transition-shadow border border-border" onClick={() => openDetailDialog(vendor)}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {type === "company" ? <Building className="h-5 w-5 text-primary" /> : <User className="h-5 w-5 text-primary" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{vendor.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{vendor.code}</p>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      {vendor.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3 w-3 shrink-0" />
                          <span>{vendor.phone}</span>
                        </div>
                      )}
                      {vendor.contact_person && (
                        <p className="text-xs text-muted-foreground">Contact: {vendor.contact_person}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={vendor.is_active ? "bg-chart-2 text-white text-xs" : "bg-muted text-xs"}>
                        {vendor.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <span className="capitalize text-xs text-muted-foreground">{type}</span>
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
              <RadioGroup
                value={vendorType}
                onValueChange={(v) => setVendorType(v as VendorType)}
                className="flex gap-4"
              >
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
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Textarea value={formData.address || ""} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={2} placeholder="Company address" />
                </div>
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
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Textarea value={formData.address || ""} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={2} placeholder="Residential address" />
                </div>
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
  {isSubmitting
    ? selectedVendor
      ? "Updating..."
      : "Adding..."
    : selectedVendor
      ? "Update"
      : "Add"} Vendor
</Button>

            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog with History */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent
  className="
    w-[calc(100%-16px)]
    sm:max-w-3xl
    max-h-[90vh]
    overflow-y-auto
    rounded-lg
  "
>

          <div className="px-4 sm:px-6">
          {selectedVendor && (
            <>
              <DialogHeader className="flex flex-row items-center justify-between">
  <DialogTitle>{selectedVendor.name}</DialogTitle>

  <div className="flex gap-2">
    <Button
      variant="ghost"
      size="icon"
      tabIndex={-1}
      onClick={() => {
        setDetailDialogOpen(false);
        openEditDialog(selectedVendor);
      }}
    >
      <Pencil className="h-4 w-4" />
    </Button>

    <Button
      variant="ghost"
      size="icon"
      tabIndex={-1}
      onClick={() => {
        setDetailDialogOpen(false);
        openDeleteDialog(selectedVendor.id);
      }}
    >
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  </div>
</DialogHeader>

              
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details" className="gap-2"><User className="h-4 w-4" /> Details</TabsTrigger>
                  <TabsTrigger value="history" className="gap-2"><History className="h-4 w-4" /> Purchase History</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6 mt-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                      {detectVendorType(selectedVendor) === "company" ? <Building className="h-8 w-8" /> : <User className="h-8 w-8" />}
                    </div>
                    <div>
                      <p className="font-mono text-sm text-muted-foreground">{selectedVendor.code}</p>
                      <Badge className={selectedVendor.is_active ? "bg-chart-2 text-white" : "bg-muted"}>
                        {selectedVendor.is_active ? "Active" : "Inactive"}
                      </Badge>
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
                            <p className="text-2xl font-bold text-chart-3">₹{formatIndianNumber(stats.pendingAmount)}</p>
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
                    {selectedVendor.address && (
                      <div className="flex items-start gap-2 md:col-span-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                        <span>{selectedVendor.address}</span>
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
        <p className="font-medium break-words">
          {selectedVendor.bank_name || "-"}
        </p>
      </div>

      <div>
        <p className="text-xs text-muted-foreground">Account No</p>
        <p className="font-mono break-all">
          {selectedVendor.bank_account_number || "-"}
        </p>
      </div>

      <div>
        <p className="text-xs text-muted-foreground">IFSC</p>
        <p className="font-mono break-all">
          {selectedVendor.bank_ifsc || "-"}
        </p>
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
                  {needsUpdateVendor(selectedVendor) && (
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
                                    <p className="text-sm text-chart-3">Pending: ₹{formatIndianNumber(purchase.balance_amount)}</p>
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
