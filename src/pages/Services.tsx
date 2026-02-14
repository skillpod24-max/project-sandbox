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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Eye, Package, Wrench, FileText, Car } from "lucide-react";
import ViewToggle from "@/components/ViewToggle";
import { useViewMode } from "@/hooks/useViewMode";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { PageSkeleton } from "@/components/ui/page-skeleton";

interface ServicePackage {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  services_included: string[];
  price: number;
  duration_hours: number;
  vehicle_types: string[];
  is_active: boolean;
  created_at: string;
}

interface ServiceRecord {
  id: string;
  user_id: string;
  service_number: string;
  vehicle_number: string;
  vehicle_name: string;
  customer_name: string;
  customer_phone: string;
  service_type: string;
  package_id: string | null;
  services_done: string[];
  labor_cost: number;
  parts_cost: number;
  total_cost: number;
  status: string;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  created_at: string;
}

const serviceTypes = ["general", "oil_change", "brake_service", "tire_service", "ac_service", "full_service", "custom"] as const;
const serviceStatuses = ["pending", "in_progress", "completed", "cancelled"] as const;
const vehicleTypes = ["car", "bike", "commercial"] as const;

const commonServices = [
  "Oil Change",
  "Oil Filter Replacement",
  "Air Filter Cleaning",
  "Brake Pad Replacement",
  "Brake Fluid Top Up",
  "Coolant Top Up",
  "Tire Rotation",
  "Wheel Alignment",
  "Wheel Balancing",
  "Battery Check",
  "Battery Replacement",
  "AC Gas Refill",
  "AC Filter Cleaning",
  "Spark Plug Replacement",
  "Clutch Plate Check",
  "Chain Lubrication",
  "Full Body Wash",
  "Interior Cleaning",
  "Engine Cleaning",
  "Headlight Restoration",
];

const Services = () => {
  const { toast } = useToast();
  const { viewMode, setViewMode } = useViewMode("services");
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<"package" | "service">("service");
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [packageForm, setPackageForm] = useState<Partial<ServicePackage>>({
    name: "",
    description: "",
    services_included: [],
    price: 0,
    duration_hours: 1,
    vehicle_types: ["car"],
    is_active: true,
  });

  const [serviceForm, setServiceForm] = useState<Partial<ServiceRecord>>({
    vehicle_number: "",
    vehicle_name: "",
    customer_name: "",
    customer_phone: "",
    service_type: "general",
    package_id: null,
    services_done: [],
    labor_cost: 0,
    parts_cost: 0,
    status: "pending",
    start_date: new Date().toISOString().split("T")[0],
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

      const [packagesRes, servicesRes] = await Promise.all([
        supabase.from("service_packages").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("service_records").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      
      setPackages(packagesRes.data || []);
      setServices(servicesRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateServiceNumber = () => `SVC${Date.now().toString(36).toUpperCase()}`;

  // Package handlers
  const handlePackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsSubmitting(false);
      return;
    }

    try {
      if (selectedPackage) {
        const { error } = await supabase
          .from("service_packages")
          .update({
            name: packageForm.name,
            description: packageForm.description,
            services_included: packageForm.services_included,
            price: packageForm.price,
            duration_hours: packageForm.duration_hours,
            vehicle_types: packageForm.vehicle_types,
          })
          .eq("id", selectedPackage.id);
        if (error) throw error;
        toast({ title: "Package updated successfully" });
      } else {
        const { error } = await supabase
          .from("service_packages")
          .insert([{
            user_id: user.id,
            name: packageForm.name || "",
            description: packageForm.description || null,
            services_included: packageForm.services_included || [],
            price: packageForm.price || 0,
            duration_hours: packageForm.duration_hours || 1,
            vehicle_types: packageForm.vehicle_types || ["car"],
            is_active: true,
          }]);
        if (error) throw error;
        toast({ title: "Package created successfully" });
      }
      setPackageDialogOpen(false);
      resetPackageForm();
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeletePackageDialog = (id: string) => {
    setDeleteType("package");
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const openDeleteServiceDialog = (id: string) => {
    setDeleteType("service");
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      if (deleteType === "package") {
        const { error } = await supabase.from("service_packages").delete().eq("id", itemToDelete);
        if (error) throw error;
        toast({ title: "Package deleted" });
      } else {
        const { error } = await supabase.from("service_records").delete().eq("id", itemToDelete);
        if (error) throw error;
        toast({ title: "Service deleted" });
      }
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const resetPackageForm = () => {
    setSelectedPackage(null);
    setPackageForm({ name: "", description: "", services_included: [], price: 0, duration_hours: 1, vehicle_types: ["car"], is_active: true });
  };

  // Service handlers
  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsSubmitting(false);
      return;
    }

    try {
      const totalCost = (serviceForm.labor_cost || 0) + (serviceForm.parts_cost || 0);
      
      if (selectedService) {
        const { error } = await supabase
          .from("service_records")
          .update({
            vehicle_number: serviceForm.vehicle_number,
            vehicle_name: serviceForm.vehicle_name,
            customer_name: serviceForm.customer_name,
            customer_phone: serviceForm.customer_phone,
            service_type: serviceForm.service_type,
            package_id: serviceForm.package_id,
            services_done: serviceForm.services_done,
            labor_cost: serviceForm.labor_cost,
            parts_cost: serviceForm.parts_cost,
            total_cost: totalCost,
            status: serviceForm.status,
            start_date: serviceForm.start_date,
            end_date: serviceForm.end_date,
            notes: serviceForm.notes,
          })
          .eq("id", selectedService.id);
        if (error) throw error;
        toast({ title: "Service updated successfully" });
      } else {
        const { error } = await supabase
          .from("service_records")
          .insert([{
            user_id: user.id,
            service_number: generateServiceNumber(),
            vehicle_number: serviceForm.vehicle_number || "",
            vehicle_name: serviceForm.vehicle_name || "",
            customer_name: serviceForm.customer_name || "",
            customer_phone: serviceForm.customer_phone || "",
            service_type: serviceForm.service_type || "general",
            package_id: serviceForm.package_id || null,
            services_done: serviceForm.services_done || [],
            labor_cost: serviceForm.labor_cost || 0,
            parts_cost: serviceForm.parts_cost || 0,
            total_cost: totalCost,
            status: serviceForm.status || "pending",
            start_date: serviceForm.start_date || new Date().toISOString(),
            end_date: serviceForm.end_date || null,
            notes: serviceForm.notes || null,
          }]);
        if (error) throw error;
        toast({ title: "Service created successfully" });
      }
      setServiceDialogOpen(false);
      resetServiceForm();
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetServiceForm = () => {
    setSelectedService(null);
    setServiceForm({ vehicle_number: "", vehicle_name: "", customer_name: "", customer_phone: "", service_type: "general", package_id: null, services_done: [], labor_cost: 0, parts_cost: 0, status: "pending", start_date: new Date().toISOString().split("T")[0] });
  };

  const toggleServiceIncluded = (service: string, isPackage: boolean) => {
    if (isPackage) {
      const current = packageForm.services_included || [];
      setPackageForm({
        ...packageForm,
        services_included: current.includes(service) ? current.filter(s => s !== service) : [...current, service]
      });
    } else {
      const current = serviceForm.services_done || [];
      setServiceForm({
        ...serviceForm,
        services_done: current.includes(service) ? current.filter(s => s !== service) : [...current, service]
      });
    }
  };

  const handlePackageSelect = (packageId: string) => {
    const pkg = packages.find(p => p.id === packageId);
    if (pkg) {
      setServiceForm({
        ...serviceForm,
        package_id: packageId,
        services_done: [...pkg.services_included],
        labor_cost: pkg.price,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "in_progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-muted";
    }
  };

  const stats = {
    totalPackages: packages.filter(p => p.is_active).length,
    totalServices: services.length,
    pending: services.filter(s => s.status === "pending").length,
    inProgress: services.filter(s => s.status === "in_progress").length,
    completed: services.filter(s => s.status === "completed").length,
    totalRevenue: services.filter(s => s.status === "completed").reduce((sum, s) => sum + s.total_cost, 0),
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Services</h1>
          <p className="text-muted-foreground">Manage vehicle servicing, packages and records</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card className="border border-border">
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-chart-4">{stats.totalPackages}</p>
            <p className="text-xs text-muted-foreground uppercase">Packages</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalServices}</p>
            <p className="text-xs text-muted-foreground uppercase">Total</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-chart-3">{stats.pending}</p>
            <p className="text-xs text-muted-foreground uppercase">Pending</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-chart-1">{stats.inProgress}</p>
            <p className="text-xs text-muted-foreground uppercase">In Progress</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-chart-2">{stats.completed}</p>
            <p className="text-xs text-muted-foreground uppercase">Completed</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-chart-2">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-xs text-muted-foreground uppercase">Revenue</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services" className="gap-2"><Wrench className="h-4 w-4" /> Services</TabsTrigger>
          <TabsTrigger value="packages" className="gap-2"><Package className="h-4 w-4" /> Packages</TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <div className="flex justify-between">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search services..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <div className="flex items-center gap-2">
              <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
              <Button onClick={() => { resetServiceForm(); setServiceDialogOpen(true); }} className="gap-2">
                <Plus className="h-4 w-4" /> New Service
              </Button>
            </div>
          </div>

          <Card className="border border-border">
            <CardContent className="p-0">
              {viewMode === "list" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service #</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.filter(s => `${s.service_number} ${s.vehicle_name} ${s.customer_name}`.toLowerCase().includes(searchTerm.toLowerCase())).map((service) => (
                    <TableRow key={service.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedService(service); setDetailDialogOpen(true); }}>
                      <TableCell className="font-mono text-sm">{service.service_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{service.vehicle_name}</p>
                          <p className="text-xs text-muted-foreground">{service.vehicle_number}</p>
                        </div>
                      </TableCell>
                      <TableCell>{service.customer_name}</TableCell>
                      <TableCell className="capitalize">{service.service_type.replace("_", " ")}</TableCell>
                      <TableCell><Badge className={getStatusColor(service.status)}>{service.status.replace("_", " ")}</Badge></TableCell>
                      <TableCell>{formatCurrency(service.total_cost)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedService(service); setServiceForm(service); setServiceDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteServiceDialog(service.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {services.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No services found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                {services.filter(s => `${s.service_number} ${s.vehicle_name} ${s.customer_name}`.toLowerCase().includes(searchTerm.toLowerCase())).map((service) => (
                  <Card key={service.id} className="cursor-pointer hover:shadow-md transition-shadow border border-border" onClick={() => { setSelectedService(service); setDetailDialogOpen(true); }}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-muted-foreground">{service.service_number}</span>
                        <Badge className={getStatusColor(service.status) + " text-xs"}>{service.status.replace("_", " ")}</Badge>
                      </div>
                      <p className="font-semibold text-foreground truncate">{service.vehicle_name}</p>
                      <p className="text-sm text-muted-foreground">{service.customer_name}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary">{formatCurrency(service.total_cost)}</span>
                        <span className="text-xs text-muted-foreground capitalize">{service.service_type.replace("_", " ")}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {services.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">No services found</div>
                )}
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Packages Tab */}
        <TabsContent value="packages" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { resetPackageForm(); setPackageDialogOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" /> New Package
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.filter(p => p.is_active).map((pkg) => (
              <Card key={pkg.id} className="border border-border hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{pkg.name}</span>
                    <span className="text-chart-2">{formatCurrency(pkg.price)}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pkg.description && <p className="text-sm text-muted-foreground">{pkg.description}</p>}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-2">Services Included ({pkg.services_included.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {pkg.services_included.slice(0, 5).map((s, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                      {pkg.services_included.length > 5 && <Badge variant="outline" className="text-xs">+{pkg.services_included.length - 5} more</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duration: {pkg.duration_hours}h</span>
                    <div className="flex gap-1">
                      {pkg.vehicle_types.map((t, i) => (
                        <Badge key={i} variant="secondary" className="capitalize text-xs">{t}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => { setSelectedPackage(pkg); setPackageForm(pkg); setPackageDialogOpen(true); }}>
                      <Pencil className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openDeletePackageDialog(pkg.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {packages.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No packages created yet. Create your first service package!
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title={deleteType === "package" ? "Delete Package" : "Delete Service"}
        description={`Are you sure you want to delete this ${deleteType}? This action cannot be undone.`}
      />

      {/* Package Dialog */}
      <Dialog open={packageDialogOpen} onOpenChange={setPackageDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPackage ? "Edit Package" : "Create Package"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePackageSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Package Name *</Label>
                <Input value={packageForm.name || ""} onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Price *</Label>
                <Input type="number" value={packageForm.price || ""} onChange={(e) => setPackageForm({ ...packageForm, price: parseFloat(e.target.value) })} required />
              </div>
              <div className="space-y-2">
                <Label>Duration (Hours)</Label>
                <Input type="number" value={packageForm.duration_hours || ""} onChange={(e) => setPackageForm({ ...packageForm, duration_hours: parseInt(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Vehicle Types</Label>
                <div className="flex gap-2">
                  {vehicleTypes.map(t => (
                    <Button key={t} type="button" variant={(packageForm.vehicle_types || []).includes(t) ? "default" : "outline"} size="sm" className="capitalize"
                      onClick={() => {
                        const current = packageForm.vehicle_types || [];
                        setPackageForm({ ...packageForm, vehicle_types: current.includes(t) ? current.filter(v => v !== t) : [...current, t] });
                      }}
                    >{t}</Button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={packageForm.description || ""} onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Services Included</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                {commonServices.map((s) => (
                  <Button key={s} type="button" variant={(packageForm.services_included || []).includes(s) ? "default" : "outline"} size="sm" className="justify-start text-left h-auto py-1.5"
                    onClick={() => toggleServiceIncluded(s, true)}
                  >{s}</Button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPackageDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : (selectedPackage ? "Update" : "Create")} Package
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Service Dialog */}
      <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedService ? "Edit Service" : "New Service"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleServiceSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vehicle Number *</Label>
                <Input value={serviceForm.vehicle_number || ""} onChange={(e) => setServiceForm({ ...serviceForm, vehicle_number: e.target.value })} required placeholder="MH 12 AB 1234" />
              </div>
              <div className="space-y-2">
                <Label>Vehicle Name *</Label>
                <Input value={serviceForm.vehicle_name || ""} onChange={(e) => setServiceForm({ ...serviceForm, vehicle_name: e.target.value })} required placeholder="Maruti Swift VXi" />
              </div>
              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input value={serviceForm.customer_name || ""} onChange={(e) => setServiceForm({ ...serviceForm, customer_name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Customer Phone *</Label>
                <Input value={serviceForm.customer_phone || ""} onChange={(e) => setServiceForm({ ...serviceForm, customer_phone: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Select Package</Label>
                <Select 
                  value={serviceForm.package_id || "none"} 
                  onValueChange={(v) => v === "none" ? setServiceForm({ ...serviceForm, package_id: null, services_done: [], labor_cost: 0 }) : handlePackageSelect(v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select a package" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Package</SelectItem>
                    {packages.filter(p => p.is_active).map(pkg => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name} - {formatCurrency(pkg.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Service Type</Label>
                <Select value={serviceForm.service_type} onValueChange={(v) => setServiceForm({ ...serviceForm, service_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{serviceTypes.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={serviceForm.status} onValueChange={(v) => setServiceForm({ ...serviceForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{serviceStatuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Labor Cost</Label>
                <Input type="number" value={serviceForm.labor_cost || ""} onChange={(e) => setServiceForm({ ...serviceForm, labor_cost: parseFloat(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Parts Cost</Label>
                <Input type="number" value={serviceForm.parts_cost || ""} onChange={(e) => setServiceForm({ ...serviceForm, parts_cost: parseFloat(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={serviceForm.start_date?.split("T")[0] || ""} onChange={(e) => setServiceForm({ ...serviceForm, start_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={serviceForm.end_date?.split("T")[0] || ""} onChange={(e) => setServiceForm({ ...serviceForm, end_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Services Done</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                {commonServices.map((s) => (
                  <Button key={s} type="button" variant={(serviceForm.services_done || []).includes(s) ? "default" : "outline"} size="sm" className="justify-start text-left h-auto py-1.5"
                    onClick={() => toggleServiceIncluded(s, false)}
                  >{s}</Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={serviceForm.notes || ""} onChange={(e) => setServiceForm({ ...serviceForm, notes: e.target.value })} rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setServiceDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : (selectedService ? "Update" : "Create")} Service
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl mx-4">
          {selectedService && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between flex-wrap gap-2">
                  <span>Service Details - {selectedService.service_number}</span>
                  <Badge className={getStatusColor(selectedService.status)}>{selectedService.status.replace("_", " ")}</Badge>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2"><Car className="h-5 w-5" /> Vehicle & Customer</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 sm:px-6">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Vehicle</p>
                      <p className="font-medium">{selectedService.vehicle_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedService.vehicle_number}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Customer</p>
                      <p className="font-medium">{selectedService.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedService.customer_phone}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2"><Wrench className="h-5 w-5" /> Services Done</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6">
                    <div className="flex flex-wrap gap-2">
                      {selectedService.services_done.map((s, i) => (
                        <Badge key={i} variant="outline">{s}</Badge>
                      ))}
                      {selectedService.services_done.length === 0 && <span className="text-muted-foreground">No services listed</span>}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5" /> Cost Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 px-4 sm:px-6">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Labor Cost</span>
                      <span>{formatCurrency(selectedService.labor_cost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Parts Cost</span>
                      <span>{formatCurrency(selectedService.parts_cost)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-bold">
                      <span>Total</span>
                      <span className="text-chart-2">{formatCurrency(selectedService.total_cost)}</span>
                    </div>
                  </CardContent>
                </Card>

                {selectedService.notes && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6">
                      <p className="text-muted-foreground">{selectedService.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Services;
