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
import { Plus, Pencil, Trash2, Search, Eye, ChevronLeft, ChevronRight, Upload, X, Image, FileText, Download, ExternalLink, Globe, Copy, Link, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/formatters";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { getBrandsForType, getModelsForBrand, getVariantsForModel, vehicleColors } from "@/lib/vehicleData";
import { generateVehicleBrochurePDF } from "@/lib/vehiclePdfGenerator";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import CarLoader from "@/components/CarLoader";


import VehicleFormDialog from "./VehicleFormDialog";
import VehicleDetailDialog from "./VehicleDetailDialog";


// 🇮🇳 Indian number formatting while typing
const formatIndianNumber = (value: string) => {
  const digits = value.replace(/,/g, "").replace(/\D/g, "");
  if (!digits) return "";

  const lastThree = digits.slice(-3);
  const otherNumbers = digits.slice(0, -3);

  return otherNumbers
    ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
    : lastThree;
};

const parseIndianNumber = (value: string) =>
  Number(value.replace(/,/g, "")) || 0;

const documentTypeMeta: Record<
  DocumentType,
  { label: string; className: string }
> = {
  rc: {
    label: "RC Book",
    className: "bg-blue-100 text-blue-700 border-blue-300",
  },
  insurance: {
    label: "Insurance",
    className: "bg-green-100 text-green-700 border-green-300",
  },
  puc: {
    label: "PUC",
    className: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  invoice: {
    label: "Invoice",
    className: "bg-purple-100 text-purple-700 border-purple-300",
  },
  sale_agreement: {
    label: "Sale Agreement",
    className: "bg-indigo-100 text-indigo-700 border-indigo-300",
  },
  delivery_note: {
    label: "Delivery Note",
    className: "bg-cyan-100 text-cyan-700 border-cyan-300",
  },
  id_proof: {
    label: "ID Proof",
    className: "bg-orange-100 text-orange-700 border-orange-300",
  },
  driving_license: {
    label: "Driving License",
    className: "bg-rose-100 text-rose-700 border-rose-300",
  },
};


type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type VehicleInsert = Database["public"]["Tables"]["vehicles"]["Insert"];
type VehicleImage = Database["public"]["Tables"]["vehicle_images"]["Row"];
type Vendor = Database["public"]["Tables"]["vendors"]["Row"];
type Document = Database["public"]["Tables"]["documents"]["Row"];
type DocumentType =
  | "rc"
  | "insurance"
  | "puc"
  | "invoice"
  | "sale_agreement"
  | "delivery_note"
  | "id_proof"
  | "driving_license";


const vehicleTypes = ["car", "bike", "commercial"] as const;
const conditions = ["new", "used"] as const;
const fuelTypes = ["petrol", "diesel", "electric", "hybrid", "cng", "lpg"] as const;
const transmissions = ["manual", "automatic", "cvt", "dct"] as const;
const statuses = ["in_stock", "reserved"] as const;
const tyreConditions = ["Excellent", "Good", "Fair", "Needs Replacement"] as const;
const batteryHealthOptions = ["Excellent", "Good", "Fair", "Poor", "New"] as const;
const documentTypes: { value: DocumentType; label: string }[] = [
  { value: "rc", label: "RC Book" },
  { value: "insurance", label: "Insurance" },
  { value: "puc", label: "PUC" },
  { value: "invoice", label: "Invoice" },
  { value: "sale_agreement", label: "Sale Agreement" },
  { value: "delivery_note", label: "Delivery Note" },
  { value: "id_proof", label: "ID Proof" },
  { value: "driving_license", label: "Driving License" },
];



const Vehicles = () => {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleImages, setVehicleImages] = useState<Record<string, VehicleImage[]>>({});
  const [vehicleDocs, setVehicleDocs] = useState<Record<string, Document[]>>({});
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [docViewerOpen, setDocViewerOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [hasPurchasePayment, setHasPurchasePayment] = useState(false);

  const [pendingDocs, setPendingDocs] = useState<
  { file: File; type: DocumentType }[]
>([]);


  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);

const [purchasePriceDisplay, setPurchasePriceDisplay] = useState("");
const [sellingPriceDisplay, setSellingPriceDisplay] = useState("");

const [highlightsText, setHighlightsText] = useState("");
const [featuresText, setFeaturesText] = useState("");


  
  const [formData, setFormData] = useState<Partial<VehicleInsert & {
    tyre_condition?: string;
    insurance_expiry?: string;
    puc_expiry?: string;
    fitness_expiry?: string;
    permit_expiry?: string;
    road_tax_expiry?: string;
    battery_health?: string;
    service_history?: string;
    number_of_owners?: number;
    hypothecation?: string;
    last_service_date?: string;
    next_service_due?: string;
    mileage?: number;
    seating_capacity?: number;
    boot_space?: string;
  }>>({
    vehicle_type: "car",
    condition: "used",
    fuel_type: "petrol",
    transmission: "manual",
    status: "in_stock",
    brand: "",
    model: "",
    manufacturing_year: new Date().getFullYear(),
    purchase_price: 0,
    selling_price: 0,
    is_public: false,
    show_engine_number: false,
    show_chassis_number: false,
    number_of_owners: 1,
  });

  const availableBrands = getBrandsForType(formData.vehicle_type || "car");
  const availableModels = getModelsForBrand(formData.vehicle_type || "car", formData.brand || "");
  const availableVariants = getVariantsForModel(formData.vehicle_type || "car", formData.brand || "", formData.model || "");

  useEffect(() => {
    if (!detailDialogOpen || !selectedVehicle) return;
    const images = vehicleImages[selectedVehicle.id] || [];
    if (images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % images.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [detailDialogOpen, selectedVehicle, vehicleImages]);

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

      const [vehiclesRes, vendorsRes, imagesRes, docsRes] = await Promise.all([
        supabase.from("vehicles").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("vendors").select("*").eq("is_active", true).eq("user_id", user.id),
        supabase.from("vehicle_images").select("*").eq("user_id", user.id),
        supabase.from("documents").select("*").eq("reference_type", "vehicle").eq("user_id", user.id),
      ]);

      setVehicles(vehiclesRes.data || []);
      setVendors(vendorsRes.data || []);
      
      const imagesMap: Record<string, VehicleImage[]> = {};
      (imagesRes.data || []).forEach((img) => {
        if (!imagesMap[img.vehicle_id]) imagesMap[img.vehicle_id] = [];
        imagesMap[img.vehicle_id].push(img);
      });
      setVehicleImages(imagesMap);

      const docsMap: Record<string, Document[]> = {};
      (docsRes.data || []).forEach((doc) => {
        if (!docsMap[doc.reference_id]) docsMap[doc.reference_id] = [];
        docsMap[doc.reference_id].push(doc);
      });
      setVehicleDocs(docsMap);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => `VH${Date.now().toString(36).toUpperCase()}`;
  const generatePurchaseCode = () => `PUR${Date.now().toString(36).toUpperCase()}`;
  const generatePublicPageId = () => `v${Date.now().toString(36)}${Math.random().toString(36).substr(2, 4)}`;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ❌ Vendor is mandatory on create
// ✅ Vendor required only if purchased
if (
  formData.purchase_status === "purchased" &&
  !formData.vendor_id
) {
  toast({
    title: "Vendor required",
    description: "Vendor is mandatory for purchased vehicles",
    variant: "destructive",
  });
  setIsSubmitting(false);
  return;
}



    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsSubmitting(false);
      return;
    }

    try {
      let vehicleId: string;
      const vehicleData = { ...formData };

      // 🔒 Backend safety: prevent vendor change on edit
if (
  selectedVehicle &&
  selectedVehicle.purchase_status === "purchased"
) {
  delete (vehicleData as any).vendor_id;
}

// 🔒 HARD LOCK purchase price if payment exists
if (hasPurchasePayment) {
  delete (vehicleData as any).purchase_price;
}


      
      // Generate public page ID if making public
      if (formData.is_public && !formData.public_page_id) {
        vehicleData.public_page_id = generatePublicPageId();
      }
      
      if (selectedVehicle) {
        const { error } = await supabase
          .from("vehicles")
          .update(vehicleData as any)
          .eq("id", selectedVehicle.id);
        if (error) throw error;
        vehicleId = selectedVehicle.id;
        toast({ title: "Vehicle updated successfully" });
      } else {
        const { data, error } = await supabase
          .from("vehicles")
          .insert([{ ...vehicleData, code: generateCode(), user_id: user.id } as any])
          .select()
          .single();
        if (error) throw error;
        vehicleId = data.id;
        
        if (
  formData.purchase_status === "purchased" &&
  formData.vendor_id &&
  formData.purchase_price > 0
) {

          const { error: purchaseError } = await supabase
            .from("vehicle_purchases")
            .insert([{
              vehicle_id: vehicleId,
              vendor_id: formData.vendor_id,
              purchase_number: generatePurchaseCode(),
              purchase_price: formData.purchase_price,
              amount_paid: 0,
              balance_amount: formData.purchase_price,
              payment_mode: "cash",
              user_id: user.id,
            }]);
          if (purchaseError) console.error("Auto-purchase creation failed:", purchaseError);
        }
        
        toast({ title: "Vehicle added successfully" });
      }
      
      if (pendingImages.length > 0) {
        await uploadImages(vehicleId, user.id);
      }
      
      if (pendingDocs.length > 0) {
        await uploadDocuments(vehicleId, user.id);
      }

      setDialogOpen(false);
      setPendingImages([]);
      setPendingDocs([]);
      fetchData();
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadImages = async (vehicleId: string, userId: string) => {
    setUploadingImages(true);
    try {
      for (const file of pendingImages) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${vehicleId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("vehicle-images")
          .upload(fileName, file, { upsert: false });
        
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("vehicle-images")
          .getPublicUrl(fileName);

        await supabase.from("vehicle_images").insert({
          vehicle_id: vehicleId,
          user_id: userId,
          image_url: publicUrl,
          is_primary: vehicleImages[vehicleId]?.length === 0,
        });
      }
    } catch (error: any) {
      toast({ title: "Error uploading images", description: error.message, variant: "destructive" });
    } finally {
      setUploadingImages(false);
    }
  };

  const uploadDocuments = async (vehicleId: string, userId: string) => {
  try {
    for (const doc of pendingDocs) {
      const file = doc.file;
      const fileName = `${vehicleId}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("vehicle-documents")
        .upload(fileName, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("vehicle-documents")
        .getPublicUrl(fileName);

      await supabase.from("documents").insert({
        reference_id: vehicleId,
        reference_type: "vehicle",
        user_id: userId,
        document_name: file.name,
        document_type: doc.type, // ✅ REAL TAG
        document_url: publicUrl,
        status: "completed",
      });
    }
  } catch (error: any) {
    toast({
      title: "Error uploading documents",
      description: error.message,
      variant: "destructive",
    });
  }
};

const updateDocumentType = async (
  docId: string,
  type: DocumentType
) => {
  const { error } = await supabase
    .from("documents")
    .update({ document_type: type })
    .eq("id", docId);

  if (error) {
    toast({
      title: "Failed to update document type",
      description: error.message,
      variant: "destructive",
    });
  } else {
    fetchData(); // refresh
  }
};

const deleteDocument = async (docId: string) => {
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", docId);

  if (error) {
    toast({
      title: "Failed to delete document",
      description: error.message,
      variant: "destructive",
    });
  } else {
    fetchData();
  }
};

const deleteExistingImage = async (img: VehicleImage) => {
  try {
    // 1. Delete from storage
    const path = img.image_url.split("/vehicle-images/")[1];

    if (path) {
      await supabase.storage
        .from("vehicle-images")
        .remove([path]);
    }

    // 2. Delete DB record
    const { error } = await supabase
      .from("vehicle_images")
      .delete()
      .eq("id", img.id);

    if (error) throw error;

    toast({ title: "Image removed" });

setVehicleImages(prev => ({
  ...prev,
  [img.vehicle_id]: prev[img.vehicle_id].filter(
    image => image.id !== img.id
  ),
}));

  } catch (err: any) {
    toast({
      title: "Failed to remove image",
      description: err.message,
      variant: "destructive",
    });
  }
};




  const handleDelete = async () => {
  if (!vehicleToDelete) return;

  try {
    // 1. Check purchase record
    const { data: purchase } = await supabase
      .from("vehicle_purchases")
      .select("amount_paid")
      .eq("vehicle_id", vehicleToDelete)
      .maybeSingle();

    // 2. Block if any payment exists
    if (purchase && purchase.amount_paid > 0) {
      toast({
        title: "Delete blocked",
        description:
          "This vehicle has payments. Reverse payments or cancel purchase first.",
        variant: "destructive",
      });
      return;
    }

    // 3. Purchased but no payment → soft cancel
    if (purchase) {
  await supabase
    .from("vehicle_purchases")
    .delete()
    .eq("vehicle_id", vehicleToDelete);

  await supabase
    .from("vehicles")
    .update({
      purchase_status: "listing",
      vendor_id: null,
      is_public: false,
    })
    .eq("id", vehicleToDelete);

  toast({
    title: "Vehicle removed from purchase",
    description: "Vehicle moved back to listing-only",
  });
}
 else {
      // 4. Listing-only → hard delete
      await supabase
        .from("vehicles")
        .delete()
        .eq("id", vehicleToDelete);

      toast({ title: "Vehicle deleted successfully" });
    }

    fetchData();
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
  } finally {
    setDeleteDialogOpen(false);
    setVehicleToDelete(null);
  }
};


  const openDeleteDialog = (id: string) => {
    setVehicleToDelete(id);
    setDeleteDialogOpen(true);
  };

  const openEditDialog = async (vehicle: Vehicle) => {
  setSelectedVehicle(vehicle);

  // 🔍 Check if any payment exists
  const { data: purchase } = await supabase
    .from("vehicle_purchases")
    .select("amount_paid")
    .eq("vehicle_id", vehicle.id)
    .maybeSingle();

  setHasPurchasePayment(!!purchase && purchase.amount_paid > 0);

  setPurchasePriceDisplay(
    vehicle.purchase_price
      ? formatIndianNumber(String(vehicle.purchase_price))
      : ""
  );

  setSellingPriceDisplay(
    vehicle.selling_price
      ? formatIndianNumber(String(vehicle.selling_price))
      : ""
  );

  setHighlightsText((vehicle.public_highlights || []).join(", "));
  setFeaturesText((vehicle.public_features || []).join(", "));

  setFormData(vehicle as any);
  setPendingImages([]);
  setPendingDocs([]);
  setDialogOpen(true);
};


  const openDetailDialog = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setCurrentImageIndex(0);
    setDetailDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedVehicle(null);
    setHasPurchasePayment(false); 
    setFormData({
      vehicle_type: "car",
      condition: "used",
      fuel_type: "petrol",
      transmission: "manual",
      status: "in_stock",
      brand: "",
      model: "",
      manufacturing_year: new Date().getFullYear(),
      purchase_price: 0,
      selling_price: 0,
      purchase_status: "listing",
      is_public: false,
      show_engine_number: false,
      show_chassis_number: false,
      number_of_owners: 1,
    });
    setPurchasePriceDisplay("");
setSellingPriceDisplay("");

    setPendingImages([]);
    setPendingDocs([]);
  };

  const handleVehicleTypeChange = (newType: string) => {
    setFormData({ 
      ...formData, 
      vehicle_type: newType as any,
      brand: "",
      model: "",
      variant: "",
    });
  };

  const handleBrandChange = (newBrand: string) => {
    setFormData({ 
      ...formData, 
      brand: newBrand,
      model: "",
      variant: "",
    });
  };

  const handleModelChange = (newModel: string) => {
    setFormData({ 
      ...formData, 
      model: newModel,
      variant: "",
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPendingImages([...pendingImages, ...Array.from(e.target.files)]);
    }
  };

  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (!e.target.files) return;

  const newDocs = Array.from(e.target.files).map(file => ({
    file,
    type: "rc" as DocumentType, // default selection
  }));

  setPendingDocs(prev => [...prev, ...newDocs]);
};


  const removePendingImage = (index: number) => {
    setPendingImages(pendingImages.filter((_, i) => i !== index));
  };

  const removePendingDoc = (index: number) => {
    setPendingDocs(pendingDocs.filter((_, i) => i !== index));
  };

  const openDocViewer = (url: string) => {
    setSelectedDoc(url);
    setDocViewerOpen(true);
  };

  const copyPublicLink = (pageId: string) => {
    const url = `${window.location.origin}/v/${pageId}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied to clipboard" });
  };

  const filteredVehicles = vehicles.filter((v) =>
    `${v.brand} ${v.model} ${v.code} ${v.registration_number || ""}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_stock": return "bg-chart-2 text-white";
      case "reserved": return "bg-chart-3 text-white";
      case "sold": return "bg-chart-1 text-white";
      default: return "bg-muted";
    }
  };

  const nextImage = () => {
    if (!selectedVehicle) return;
    const images = vehicleImages[selectedVehicle.id] || [];
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (!selectedVehicle) return;
    const images = vehicleImages[selectedVehicle.id] || [];
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const existingImages = selectedVehicle ? vehicleImages[selectedVehicle.id] || [] : [];
  const existingDocs = selectedVehicle ? vehicleDocs[selectedVehicle.id] || [] : [];

  if (loading) {
  return <CarLoader />;
}

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vehicles</h1>
          <p className="text-muted-foreground">Manage your vehicle inventory</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Add Vehicle
        </Button>
      </div>

      <Card className="border border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle>Vehicle Inventory ({filteredVehicles.length})</CardTitle>
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search vehicles..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Brand / Model</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Public</TableHead>
                  <TableHead>Selling Price</TableHead>
                  
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => {
                  const images = vehicleImages[vehicle.id] || [];
                  const primaryImage = images.find((i) => i.is_primary) || images[0];
                  return (
                    <TableRow key={vehicle.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetailDialog(vehicle)}>
                      <TableCell>
                        {primaryImage ? (
                          <img src={primaryImage.image_url} alt={vehicle.brand} className="h-12 w-16 object-cover rounded" loading="lazy" />
                        ) : (
                          <div className="h-12 w-16 bg-muted rounded flex items-center justify-center"><Image className="h-6 w-6 text-muted-foreground" /></div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{vehicle.code}</TableCell>
                      <TableCell className="font-medium">{vehicle.brand} {vehicle.model}</TableCell>
                      <TableCell className="capitalize">{vehicle.vehicle_type}</TableCell>
                      <TableCell>{vehicle.manufacturing_year}</TableCell>
                      <TableCell><Badge className={getStatusColor(vehicle.status)}>{vehicle.status.replace("_", " ")}</Badge></TableCell>
                      <TableCell>
                        {vehicle.is_public ? (
                          <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                            <Globe className="h-3 w-3" /> Public
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Private</span>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(vehicle.selling_price)}</TableCell>
                      
                    </TableRow>
                  );
                })}
                {filteredVehicles.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No vehicles found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Vehicle"
        description="Are you sure you want to delete this vehicle? This action cannot be undone."
      />

      

      <VehicleFormDialog
  open={dialogOpen}
  onOpenChange={setDialogOpen}
  selectedVehicle={selectedVehicle}
  setSelectedVehicle={setSelectedVehicle}
  fetchData={fetchData}
  vendors={vendors}
  vehicleImages={vehicleImages}
  vehicleDocs={vehicleDocs}
/>

<VehicleDetailDialog
  open={detailDialogOpen}
  onOpenChange={setDetailDialogOpen}
  selectedVehicle={selectedVehicle}
  openEditDialog={openEditDialog}
  openDeleteDialog={openDeleteDialog}
  vehicleImages={vehicleImages}
  vehicleDocs={vehicleDocs}
/>


      
    </div>
  );
};

export default Vehicles;