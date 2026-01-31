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
const [strikeoutPriceDisplay, setStrikeoutPriceDisplay] = useState("");

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
    strikeout_price?: number | null;
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

  setHasPurchasePayment(!!purchase);


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

  setStrikeoutPriceDisplay(
    (vehicle as any).strikeout_price
      ? formatIndianNumber(String((vehicle as any).strikeout_price))
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
    setStrikeoutPriceDisplay("");
    setHighlightsText("");
    setFeaturesText("");

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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedVehicle ? "Edit Vehicle" : "Add New Vehicle"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="documents">Docs & Media</TabsTrigger>
                <TabsTrigger value="public">Public Page</TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Vehicle Type</Label>
                    <Select value={formData.vehicle_type} onValueChange={handleVehicleTypeChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{vehicleTypes.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <Select value={formData.condition} onValueChange={(v) => setFormData({ ...formData, condition: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{conditions.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(v) => {
  if (v === "sold") {
    toast({
      title: "Action blocked",
      description: "Vehicle can be sold only via Sales",
      variant: "destructive",
    });
    return;
  }
  setFormData({ ...formData, status: v as any });
}}
>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Brand *</Label>
                    <Select value={formData.brand || ""} onValueChange={handleBrandChange}>
                      <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                      <SelectContent>
                        {availableBrands.map((b) => <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Model *</Label>
                    <Select value={formData.model || ""} onValueChange={handleModelChange} disabled={!formData.brand}>
                      <SelectTrigger><SelectValue placeholder={formData.brand ? "Select model" : "Select brand first"} /></SelectTrigger>
                      <SelectContent>
                        {availableModels.map((m) => <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Variant</Label>
                    <Select value={formData.variant || ""} onValueChange={(v) => setFormData({ ...formData, variant: v })} disabled={!formData.model}>
                      <SelectTrigger><SelectValue placeholder={formData.model ? "Select variant" : "Select model first"} /></SelectTrigger>
                      <SelectContent>
                        {availableVariants.map((v) => <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Manufacturing Year *</Label>
                    <Input type="number" value={formData.manufacturing_year || ""} onChange={(e) => setFormData({ ...formData, manufacturing_year: parseInt(e.target.value) })} required />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <Select value={formData.color || ""} onValueChange={(v) => setFormData({ ...formData, color: v })}>
                      <SelectTrigger><SelectValue placeholder="Select color" /></SelectTrigger>
                      <SelectContent>
                        {vehicleColors.map((c) => (
                          <SelectItem key={c.name} value={c.name}>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: c.code }} />
                              {c.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Fuel Type</Label>
                    <Select value={formData.fuel_type} onValueChange={(v) => setFormData({ ...formData, fuel_type: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{fuelTypes.map((f) => <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Transmission</Label>
                    <Select value={formData.transmission} onValueChange={(v) => setFormData({ ...formData, transmission: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{transmissions.map((t) => <SelectItem key={t} value={t} className="uppercase">{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Registration No</Label>
                    <Input value={formData.registration_number || ""} onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Engine No</Label>
                    <Input value={formData.engine_number || ""} onChange={(e) => setFormData({ ...formData, engine_number: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Chassis No</Label>
                    <Input value={formData.chassis_number || ""} onChange={(e) => setFormData({ ...formData, chassis_number: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Odometer Reading (km)</Label>
                    <Input type="number" value={formData.odometer_reading || ""} onChange={(e) => setFormData({ ...formData, odometer_reading: parseInt(e.target.value) || null })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Purchase Price *</Label>
                    <Input
  type="text"
  inputMode="numeric"
  placeholder="₹ 5,50,000"
  value={purchasePriceDisplay}
  disabled={hasPurchasePayment}
  className={hasPurchasePayment ? "opacity-60 cursor-not-allowed" : ""}
  onChange={(e) => {
    if (hasPurchasePayment) return;

    const formatted = formatIndianNumber(e.target.value);
    setPurchasePriceDisplay(formatted);
    setFormData({
      ...formData,
      purchase_price: parseIndianNumber(formatted),
    });
  }}
  required={formData.purchase_status === "purchased"}
/>

{hasPurchasePayment && (
  <p className="text-xs text-amber-600">
    Purchase price is locked because payments have already started.
  </p>
)}


                  </div>
                  <div className="space-y-2">
                    <Label>Selling Price *</Label>
                    <Input
  type="text"
  inputMode="numeric"
  placeholder="₹ 6,25,000"
  value={sellingPriceDisplay}
  onChange={(e) => {
    const formatted = formatIndianNumber(e.target.value);
    setSellingPriceDisplay(formatted);
    setFormData({
      ...formData,
      selling_price: parseIndianNumber(formatted),
    });
  }}
  required
/>

                  </div>

                  {/* Purchase Toggle */}
<div className="space-y-2 md:col-span-3">
  <div className="flex items-center justify-between p-3 border rounded-lg">
    <div>
      <Label>Purchased from Vendor</Label>
      <p className="text-xs text-muted-foreground">
        Turn ON if this vehicle is bought from a vendor.
        Turn OFF if it is only listed for leads.
      </p>
    </div>

    <Switch
  checked={formData.purchase_status === "purchased"}
  disabled={selectedVehicle?.purchase_status === "purchased"}
  onCheckedChange={(checked) => {
    if (!checked) return; // cannot turn OFF

    // 🔒 FIX 2: Block if purchase price missing
    if (!formData.purchase_price || formData.purchase_price <= 0) {
      toast({
        title: "Purchase price required",
        description: "Enter purchase price before marking as purchased",
        variant: "destructive",
      });
      return;
    }

    setFormData({
      ...formData,
      purchase_status: "purchased",
    });
  }}
/>

  </div>

  {selectedVehicle?.purchase_status === "purchased" && (
    <p className="text-xs text-amber-600">
      Purchased vehicles cannot be converted back to listing-only.
    </p>
  )}
</div>

                  <div className="space-y-2">
                    <Label>
  Vendor <span className="text-red-500">*</span>
</Label>

                    <Select value={formData.vendor_id || ""} onValueChange={(v) => setFormData({ ...formData, vendor_id: v  })}
                     disabled={
  formData.purchase_status !== "purchased" ||
  selectedVehicle?.purchase_status === "purchased"
} // 🔒 lock on edit
                      >
                      <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                      <SelectContent>
                        
                        {vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                      </SelectContent>
                    </Select>

                    {formData.purchase_status !== "purchased" && (
  <p className="text-xs text-muted-foreground">
    Vendor not required for listing-only vehicles
  </p>
)}

{formData.purchase_status === "purchased" && !formData.vendor_id && (
  <p className="text-xs text-red-500">
    Vendor is mandatory for purchased vehicles
  </p>
)}


                    

                    {selectedVehicle && (
  <p className="text-xs text-muted-foreground">
    Vendor cannot be changed after vehicle creation
  </p>
)}

                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={formData.notes || ""} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
                </div>
              </TabsContent>

              {/* Details Tab - Automotive specific */}
              <TabsContent value="details" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">Additional automotive details based on vehicle type</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Common Fields */}
                  <div className="space-y-2">
                    <Label>Tyre Condition</Label>
                    <Select value={(formData as any).tyre_condition || ""} onValueChange={(v) => setFormData({ ...formData, tyre_condition: v } as any)}>
                      <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                      <SelectContent>{tyreConditions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Battery Health</Label>
                    <Select value={(formData as any).battery_health || ""} onValueChange={(v) => setFormData({ ...formData, battery_health: v } as any)}>
                      <SelectTrigger><SelectValue placeholder="Select health" /></SelectTrigger>
                      <SelectContent>{batteryHealthOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Number of Owners</Label>
                    <Input type="number" min="1" value={(formData as any).number_of_owners || 1} onChange={(e) => setFormData({ ...formData, number_of_owners: parseInt(e.target.value) || 1 } as any)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Insurance Expiry</Label>
                    <Input type="date" value={(formData as any).insurance_expiry || ""} onChange={(e) => setFormData({ ...formData, insurance_expiry: e.target.value } as any)} />
                  </div>
                  <div className="space-y-2">
                    <Label>PUC Expiry</Label>
                    <Input type="date" value={(formData as any).puc_expiry || ""} onChange={(e) => setFormData({ ...formData, puc_expiry: e.target.value } as any)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fitness Expiry</Label>
                    <Input type="date" value={(formData as any).fitness_expiry || ""} onChange={(e) => setFormData({ ...formData, fitness_expiry: e.target.value } as any)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Mileage (km/l)</Label>
                    <Input type="number" step="0.1" value={(formData as any).mileage || ""} onChange={(e) => setFormData({ ...formData, mileage: parseFloat(e.target.value) } as any)} />
                  </div>

                  {/* Car Specific Fields */}
                  {formData.vehicle_type === "car" && (
                    <>
                      <div className="space-y-2">
                        <Label>Seating Capacity</Label>
                        <Input type="number" value={(formData as any).seating_capacity || ""} onChange={(e) => setFormData({ ...formData, seating_capacity: parseInt(e.target.value) } as any)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Boot Space</Label>
                        <Input value={(formData as any).boot_space || ""} onChange={(e) => setFormData({ ...formData, boot_space: e.target.value } as any)} placeholder="e.g., 350 liters" />
                      </div>
                      <div className="space-y-2">
                        <Label>Ground Clearance (mm)</Label>
                        <Input type="number" placeholder="e.g., 180" onChange={(e) => setFormData({ ...formData, notes: `${formData.notes || ""} [Ground Clearance: ${e.target.value}mm]` })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Engine Displacement (cc)</Label>
                        <Input type="number" placeholder="e.g., 1498" onChange={(e) => setFormData({ ...formData, notes: `${formData.notes || ""} [Engine: ${e.target.value}cc]` })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Power (bhp)</Label>
                        <Input type="number" placeholder="e.g., 115" onChange={(e) => setFormData({ ...formData, notes: `${formData.notes || ""} [Power: ${e.target.value}bhp]` })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Torque (Nm)</Label>
                        <Input type="number" placeholder="e.g., 250" onChange={(e) => setFormData({ ...formData, notes: `${formData.notes || ""} [Torque: ${e.target.value}Nm]` })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Airbags</Label>
                        <Select onValueChange={(v) => setFormData({ ...formData, notes: `${formData.notes || ""} [Airbags: ${v}]` })}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="None">None</SelectItem>
                            <SelectItem value="2 Airbags">2 Airbags</SelectItem>
                            <SelectItem value="4 Airbags">4 Airbags</SelectItem>
                            <SelectItem value="6 Airbags">6 Airbags</SelectItem>
                            <SelectItem value="7+ Airbags">7+ Airbags</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Sunroof</Label>
                        <Select onValueChange={(v) => setFormData({ ...formData, notes: `${formData.notes || ""} [Sunroof: ${v}]` })}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="No">No Sunroof</SelectItem>
                            <SelectItem value="Single Pane">Single Pane</SelectItem>
                            <SelectItem value="Panoramic">Panoramic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Infotainment</Label>
                        <Select onValueChange={(v) => setFormData({ ...formData, notes: `${formData.notes || ""} [Infotainment: ${v}]` })}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Basic Audio">Basic Audio</SelectItem>
                            <SelectItem value="Touchscreen">Touchscreen</SelectItem>
                            <SelectItem value="Android Auto/CarPlay">Android Auto/CarPlay</SelectItem>
                            <SelectItem value="Connected Car">Connected Car Tech</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {/* Bike Specific Fields */}
                  {formData.vehicle_type === "bike" && (
                    <>
                      <div className="space-y-2">
                        <Label>Engine Displacement (cc)</Label>
                        <Input type="number" placeholder="e.g., 150, 350, 650" onChange={(e) => setFormData({ ...formData, notes: `${formData.notes || ""} [Engine: ${e.target.value}cc]` })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Power (PS)</Label>
                        <Input type="number" placeholder="e.g., 13.5" onChange={(e) => setFormData({ ...formData, notes: `${formData.notes || ""} [Power: ${e.target.value}PS]` })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Kerb Weight (kg)</Label>
                        <Input type="number" placeholder="e.g., 165" onChange={(e) => setFormData({ ...formData, notes: `${formData.notes || ""} [Weight: ${e.target.value}kg]` })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Seat Height (mm)</Label>
                        <Input type="number" placeholder="e.g., 800" onChange={(e) => setFormData({ ...formData, notes: `${formData.notes || ""} [Seat Height: ${e.target.value}mm]` })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Fuel Tank Capacity (L)</Label>
                        <Input type="number" step="0.1" placeholder="e.g., 12.5" onChange={(e) => setFormData({ ...formData, notes: `${formData.notes || ""} [Tank: ${e.target.value}L]` })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Top Speed (km/h)</Label>
                        <Input type="number" placeholder="e.g., 130" onChange={(e) => setFormData({ ...formData, notes: `${formData.notes || ""} [Top Speed: ${e.target.value}km/h]` })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Brake Type</Label>
                        <Select onValueChange={(v) => setFormData({ ...formData, notes: `${formData.notes || ""} [Brake: ${v}]` })}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Drum/Drum">Drum/Drum</SelectItem>
                            <SelectItem value="Disc/Drum">Disc/Drum</SelectItem>
                            <SelectItem value="Disc/Disc">Disc/Disc</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>ABS Type</Label>
                        <Select onValueChange={(v) => setFormData({ ...formData, notes: `${formData.notes || ""} [ABS: ${v}]` })}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="No ABS">No ABS</SelectItem>
                            <SelectItem value="Single Channel">Single Channel ABS</SelectItem>
                            <SelectItem value="Dual Channel">Dual Channel ABS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Bike Type</Label>
                        <Select onValueChange={(v) => setFormData({ ...formData, notes: `${formData.notes || ""} [Type: ${v}]` })}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Sport">Sport</SelectItem>
                            <SelectItem value="Cruiser">Cruiser</SelectItem>
                            <SelectItem value="Naked/Street">Naked/Street</SelectItem>
                            <SelectItem value="Adventure/Touring">Adventure/Touring</SelectItem>
                            <SelectItem value="Commuter">Commuter</SelectItem>
                            <SelectItem value="Scooter">Scooter</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {/* Commercial Vehicle Specific Fields */}
                  {formData.vehicle_type === "commercial" && (
                    <>
                      <div className="space-y-2">
                        <Label>Permit Expiry</Label>
                        <Input type="date" value={(formData as any).permit_expiry || ""} onChange={(e) => setFormData({ ...formData, permit_expiry: e.target.value } as any)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Road Tax Expiry</Label>
                        <Input type="date" value={(formData as any).road_tax_expiry || ""} onChange={(e) => setFormData({ ...formData, road_tax_expiry: e.target.value } as any)} />
                      </div>
                      <div className="space-y-2">
                        <Label>GVW (Gross Vehicle Weight in kg)</Label>
                        <Input type="number" placeholder="e.g., 7500" onChange={(e) => setFormData({ ...formData, notes: `${formData.notes || ""} [GVW: ${e.target.value}kg]` })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Payload Capacity (kg)</Label>
                        <Input type="number" placeholder="e.g., 3500" onChange={(e) => setFormData({ ...formData, notes: `${formData.notes || ""} [Payload: ${e.target.value}kg]` })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Body Type</Label>
                        <Select onValueChange={(v) => setFormData({ ...formData, notes: `${formData.notes || ""} [Body: ${v}]` })}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Open Body">Open Body</SelectItem>
                            <SelectItem value="Closed Container">Closed Container</SelectItem>
                            <SelectItem value="Tipper">Tipper</SelectItem>
                            <SelectItem value="Tanker">Tanker</SelectItem>
                            <SelectItem value="Bus/Passenger">Bus/Passenger</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Permit Type</Label>
                        <Select onValueChange={(v) => setFormData({ ...formData, notes: `${formData.notes || ""} [Permit: ${v}]` })}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="National">National Permit</SelectItem>
                            <SelectItem value="State">State Permit</SelectItem>
                            <SelectItem value="Tourist">Tourist Permit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label>Last Service Date</Label>
                    <Input type="date" value={(formData as any).last_service_date || ""} onChange={(e) => setFormData({ ...formData, last_service_date: e.target.value } as any)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Next Service Due</Label>
                    <Input type="date" value={(formData as any).next_service_due || ""} onChange={(e) => setFormData({ ...formData, next_service_due: e.target.value } as any)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hypothecation (if any)</Label>
                    <Input value={(formData as any).hypothecation || ""} onChange={(e) => setFormData({ ...formData, hypothecation: e.target.value } as any)} placeholder="Bank/Finance company name" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Service History</Label>
                  <Textarea value={(formData as any).service_history || ""} onChange={(e) => setFormData({ ...formData, service_history: e.target.value } as any)} rows={3} placeholder="Service history details..." />
                </div>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-4 mt-4">
                {selectedVehicle && existingImages.length > 0 && (
                  <div className="space-y-2">
                    <Label>Existing Images ({existingImages.length})</Label>
                    <div className="flex flex-wrap gap-2">
                      {existingImages.map((img) => (
  <div key={img.id} className="relative group">
    <img
      src={img.image_url}
      alt=""
      className="h-16 w-20 object-cover rounded border border-border"
    />

    {/* Primary badge */}
    {img.is_primary && (
      <Badge className="absolute -top-2 -left-2 text-xs">
        Primary
      </Badge>
    )}

    {/* ❌ Delete button */}
    <Button
  type="button" // 🔥 VERY IMPORTANT
  size="icon"
  variant="destructive"
  className="absolute -top-2 -right-2 h-5 w-5 opacity-0 group-hover:opacity-100 transition"
  onClick={(e) => {
    e.preventDefault();     // ⛔ stop form submit
    e.stopPropagation();    // ⛔ stop dialog events
    deleteExistingImage(img);
  }}
>
  <X className="h-3 w-3" />
</Button>

  </div>
))}

                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Add New Images</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4">
                    <Input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" id="image-upload" />
                    <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
                      <Upload className="h-8 w-8" />
                      <span>Click to upload images</span>
                    </label>
                  </div>
                  {pendingImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {pendingImages.map((file, i) => (
                        <div key={i} className="relative">
                          <img src={URL.createObjectURL(file)} alt="" className="h-16 w-20 object-cover rounded" />
                          <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-5 w-5" onClick={() => removePendingImage(i)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedVehicle && existingDocs.length > 0 && (
                  <div className="space-y-2">
                    <Label>Existing Documents ({existingDocs.length})</Label>
                    <div className="flex flex-wrap gap-2">
                      {existingDocs.map((doc) => (
  <div
    key={doc.id}
    className="flex items-center gap-2 bg-muted px-3 py-2 rounded"
  >
    <FileText className="h-4 w-4" />

    <span className="text-sm flex-1 truncate">
      {doc.document_name}
    </span>

    <Select
      value={doc.document_type as DocumentType}
      onValueChange={(v) =>
        updateDocumentType(doc.id, v as DocumentType)
      }
    >
      <SelectTrigger className="w-36 h-8">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {documentTypes.map((t) => (
  <SelectItem key={t.value} value={t.value}>

  <div className="flex items-center gap-2">
    <span
      className={`px-2 py-0.5 rounded text-xs border ${
        documentTypeMeta[t.value].className
      }`}
    >
      {documentTypeMeta[t.value].label}
    </span>
  </div>
</SelectItem>

        ))}
      </SelectContent>
    </Select>

    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6"
      onClick={() => openDocViewer(doc.document_url)}
    >
      <Eye className="h-4 w-4" />
    </Button>
  </div>
))}

                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Add New Documents (RC, Insurance, etc.)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4">
                    <Input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={handleDocChange} className="hidden" id="doc-upload" />
                    <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
                      <FileText className="h-8 w-8" />
                      <span>Click to upload documents</span>
                    </label>
                  </div>
                  {pendingDocs.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {pendingDocs.map((doc, i) => (
  <div key={i} className="flex items-center gap-2 bg-muted px-3 py-2 rounded">
    <FileText className="h-4 w-4" />

    <span className="text-sm flex-1 truncate">
      {doc.file.name}
    </span>

    <Select
      value={doc.type}
      onValueChange={(v) => {
  const updated = [...pendingDocs];
  updated[i].type = v as DocumentType;
  setPendingDocs(updated);
}}

    >
      <SelectTrigger className="w-36 h-8">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {documentTypes.map((t) => (
  <SelectItem key={t.value} value={t.value}>

  <div className="flex items-center gap-2">
    <span
      className={`px-2 py-0.5 rounded text-xs border ${
        documentTypeMeta[t.value].className
      }`}
    >
      {documentTypeMeta[t.value].label}
    </span>
  </div>
</SelectItem>

        ))}
      </SelectContent>
    </Select>

    <Button
      size="icon"
      variant="ghost"
      className="h-6 w-6"
      onClick={() => removePendingDoc(i)}
    >
      <X className="h-3 w-3" />
    </Button>
  </div>
))}

                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Public Page Tab */}
              <TabsContent value="public" className="space-y-4 mt-4">
                <Card className="border">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Make Vehicle Public</Label>
                        <p className="text-sm text-muted-foreground">Generate a shareable public page for this vehicle</p>
                      </div>
                      <Switch 
                        checked={formData.is_public || false} 
                        onCheckedChange={(v) => setFormData({ ...formData, is_public: v })} 
                      />
                    </div>

                    {formData.is_public && (
                      <>
                        <Separator />
                        
                        {(selectedVehicle?.public_page_id || formData.public_page_id) && (
                          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                            <Globe className="h-5 w-5 text-green-600" />
                            <code className="flex-1 text-sm">{window.location.origin}/v/{selectedVehicle?.public_page_id || formData.public_page_id}</code>
                            <Button size="sm" variant="outline" onClick={() => copyPublicLink(selectedVehicle?.public_page_id || formData.public_page_id || "")} className="gap-1">
                              <Copy className="h-4 w-4" /> Copy
                            </Button>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                              <Label>Show Engine Number</Label>
                              <p className="text-xs text-muted-foreground">Display on public page</p>
                            </div>
                            <Switch 
                              checked={formData.show_engine_number || false} 
                              onCheckedChange={(v) => setFormData({ ...formData, show_engine_number: v })} 
                            />
                          </div>
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                              <Label>Show Chassis Number</Label>
                              <p className="text-xs text-muted-foreground">Display on public page</p>
                            </div>
                            <Switch 
                              checked={formData.show_chassis_number || false} 
                              onCheckedChange={(v) => setFormData({ ...formData, show_chassis_number: v })} 
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Strike-out Price (Optional)</Label>
                            <Input
                              type="text"
                              inputMode="numeric"
                              placeholder="₹ 7,00,000 (original/market price)"
                              value={strikeoutPriceDisplay}
                              onChange={(e) => {
                                const formatted = formatIndianNumber(e.target.value);
                                setStrikeoutPriceDisplay(formatted);
                                setFormData({
                                  ...formData,
                                  strikeout_price: parseIndianNumber(formatted) || null,
                                });
                              }}
                            />
                            <p className="text-xs text-muted-foreground">
                              Shows as crossed-out price above selling price (like e-commerce)
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Public Description</Label>
                          <Textarea 
                            value={formData.public_description || ""} 
                            onChange={(e) => setFormData({ ...formData, public_description: e.target.value })}
                            placeholder="Write a compelling description for potential buyers..."
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Highlights (comma separated)</Label>
                          <Textarea
  value={highlightsText}
  onChange={(e) => {
    const value = e.target.value;
    setHighlightsText(value);
    setFormData({
      ...formData,
      public_highlights: value
        .split(",")
        .map(v => v.trim())
        .filter(Boolean),
    });
  }}
  placeholder="Single Owner, Accident Free, Well Maintained"
  rows={2}
/>

                        </div>

                        <div className="space-y-2">
                          <Label>Features (comma separated)</Label>
                          <Textarea
  value={featuresText}
  onChange={(e) => {
    const value = e.target.value;
    setFeaturesText(value);
    setFormData({
      ...formData,
      public_features: value
        .split(",")
        .map(v => v.trim())
        .filter(Boolean),
    });
  }}
  placeholder="Sunroof, Leather Seats, Apple CarPlay"
  rows={2}
/>

                        </div>

                        <Separator />

<div className="space-y-2">
  <Label>Vehicle Image Badge (Boost Clicks)</Label>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {/* Badge Text */}
    <div>
      <Input
        maxLength={20}
        placeholder="Eg: 🔥 Best Price"
        value={formData.image_badge_text || ""}
        onChange={(e) =>
          setFormData({ ...formData, image_badge_text: e.target.value })
        }
      />
      <p className="text-xs text-muted-foreground mt-1">
        Keep it under <b>3 words</b> for best results
      </p>
    </div>

    {/* Badge Color */}
    <div>
      <Select
        value={formData.image_badge_color || "emerald"}
        onValueChange={(v) =>
          setFormData({ ...formData, image_badge_color: v })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select badge color" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="emerald">🟢 Emerald (Trust)</SelectItem>
          <SelectItem value="rose">🔴 Rose (Urgency)</SelectItem>
          <SelectItem value="amber">🟡 Amber (Attention)</SelectItem>
          <SelectItem value="indigo">🔵 Indigo (Premium)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>

  {/* AI Suggestions */}
  <div className="bg-muted/50 p-3 rounded-lg text-sm">
    <p className="font-medium mb-1">✨ Suggested High-Conversion Tags</p>
    <div className="flex flex-wrap gap-2">
      {["🔥 Best Price", "💰 EMI Available", "⚡ Ready to Drive", "⭐ Verified"].map(
        (tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="cursor-pointer hover:bg-muted"
            onClick={() =>
              setFormData({ ...formData, image_badge_text: tag })
            }
          >
            {tag}
          </Badge>
        )
      )}
    </div>
  </div>
</div>


                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button
  type="submit"
  disabled={
  uploadingImages ||
  isSubmitting ||
  (formData.purchase_status === "purchased" && !formData.vendor_id)
}

>

                {uploadingImages || isSubmitting ? "Saving..." : (selectedVehicle ? "Update" : "Add")} Vehicle
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl w-[calc(100vw-2rem)] max-h-[95vh] overflow-y-auto p-0">
          {selectedVehicle && (() => {
            const images = vehicleImages[selectedVehicle.id] || [];
            const docs = vehicleDocs[selectedVehicle.id] || [];
            const currentImage = images[currentImageIndex];
            return (
              <div>
                <DialogHeader className="p-4 sm:p-6 pb-0">
                  <DialogTitle>{selectedVehicle.brand} {selectedVehicle.model} - {selectedVehicle.code}</DialogTitle>
                </DialogHeader>
                
                <div className="relative bg-muted">
                  {images.length > 0 ? (
                    <div
  className={`relative ${
    selectedVehicle.vehicle_type === "bike"
      ? "h-52 sm:h-64"
      : "h-64 sm:h-80"
  }`}
>
                      <img 
                        src={currentImage?.image_url} 
                        alt={selectedVehicle.brand} 
                        className="w-full h-full object-contain"
                      />
                      {images.length > 1 && (
                        <>
                          <Button 
                            variant="secondary" 
                            size="icon" 
                            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-background/80"
                            onClick={(e) => { e.stopPropagation(); prevImage(); }}
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="icon" 
                            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-background/80"
                            onClick={(e) => { e.stopPropagation(); nextImage(); }}
                          >
                            <ChevronRight className="h-5 w-5" />
                          </Button>
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {images.map((_, i) => (
                              <button 
                                key={i} 
                                className={`w-2 h-2 rounded-full transition-all ${i === currentImageIndex ? 'bg-foreground w-4' : 'bg-foreground/40'}`}
                                onClick={() => setCurrentImageIndex(i)}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-muted-foreground">
                      <Image className="h-16 w-16" />
                    </div>
                  )}
                </div>

                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={getStatusColor(selectedVehicle.status)}>{selectedVehicle.status.replace("_", " ")}</Badge>
                    <Badge variant="outline">{selectedVehicle.condition}</Badge>
                    {selectedVehicle.is_public && (
                      <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                        <Globe className="h-3 w-3" /> Public
                      </Badge>
                    )}
                  </div>

                  <div
  className={`grid gap-3 ${
    selectedVehicle.vehicle_type === "bike"
      ? "grid-cols-2 sm:grid-cols-3"
      : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
  }`}
>

                    <div className="p-2 bg-muted/50 rounded"><p className="text-xs text-muted-foreground uppercase">Type</p><p className="font-medium capitalize text-sm">{selectedVehicle.vehicle_type}</p></div>
                    <div className="p-2 bg-muted/50 rounded"><p className="text-xs text-muted-foreground uppercase">Year</p><p className="font-medium text-sm">{selectedVehicle.manufacturing_year}</p></div>
                    <div className="p-2 bg-muted/50 rounded"><p className="text-xs text-muted-foreground uppercase">Color</p><p className="font-medium text-sm">{selectedVehicle.color || 'N/A'}</p></div>
                    <div className="p-2 bg-muted/50 rounded"><p className="text-xs text-muted-foreground uppercase">Fuel</p><p className="font-medium capitalize text-sm">{selectedVehicle.fuel_type}</p></div>
                    <div className="p-2 bg-muted/50 rounded"><p className="text-xs text-muted-foreground uppercase">Transmission</p><p className="font-medium uppercase text-sm">{selectedVehicle.transmission}</p></div>
                    <div className="p-2 bg-muted/50 rounded"><p className="text-xs text-muted-foreground uppercase">Reg No</p><p className="font-medium text-sm">{selectedVehicle.registration_number || 'N/A'}</p></div>
                    <div className="p-2 bg-muted/50 rounded"><p className="text-xs text-muted-foreground uppercase">Odometer</p><p className="font-medium text-sm">{selectedVehicle.odometer_reading ? `${selectedVehicle.odometer_reading.toLocaleString()} km` : 'N/A'}</p></div>
                    <div className="p-2 bg-muted/50 rounded"><p className="text-xs text-muted-foreground uppercase">Variant</p><p className="font-medium text-sm">{selectedVehicle.variant || 'N/A'}</p></div>
                    {selectedVehicle.engine_number && <div className="p-2 bg-muted/50 rounded"><p className="text-xs text-muted-foreground uppercase">Engine No</p><p className="font-medium text-sm font-mono break-all">{selectedVehicle.engine_number}</p></div>}
                    {selectedVehicle.chassis_number && <div className="p-2 bg-muted/50 rounded"><p className="text-xs text-muted-foreground uppercase">Chassis No</p><p className="font-medium text-sm font-mono break-all">{selectedVehicle.chassis_number}</p></div>}
                    {(selectedVehicle as any).number_of_owners && <div className="p-2 bg-muted/50 rounded"><p className="text-xs text-muted-foreground uppercase">Owners</p><p className="font-medium text-sm">{(selectedVehicle as any).number_of_owners}</p></div>}
                    {(selectedVehicle as any).mileage && <div className="p-2 bg-muted/50 rounded"><p className="text-xs text-muted-foreground uppercase">Mileage</p><p className="font-medium text-sm">{(selectedVehicle as any).mileage} km/l</p></div>}
                    {(selectedVehicle as any).insurance_expiry && <div className="p-2 bg-muted/50 rounded"><p className="text-xs text-muted-foreground uppercase">Insurance</p><p className="font-medium text-sm">{format(new Date((selectedVehicle as any).insurance_expiry), "dd MMM yyyy")}</p></div>}
                    {(selectedVehicle as any).puc_expiry && <div className="p-2 bg-muted/50 rounded"><p className="text-xs text-muted-foreground uppercase">PUC Expiry</p><p className="font-medium text-sm">{format(new Date((selectedVehicle as any).puc_expiry), "dd MMM yyyy")}</p></div>}
                    {(selectedVehicle as any).fitness_expiry && <div className="p-2 bg-muted/50 rounded"><p className="text-xs text-muted-foreground uppercase">Fitness</p><p className="font-medium text-sm">{format(new Date((selectedVehicle as any).fitness_expiry), "dd MMM yyyy")}</p></div>}
                    {(selectedVehicle as any).tyre_condition && <div className="p-2 bg-muted/50 rounded"><p className="text-xs text-muted-foreground uppercase">Tyre Condition</p><p className="font-medium text-sm">{(selectedVehicle as any).tyre_condition}</p></div>}
                    {(selectedVehicle as any).battery_health && <div className="p-2 bg-muted/50 rounded"><p className="text-xs text-muted-foreground uppercase">Battery</p><p className="font-medium text-sm">{(selectedVehicle as any).battery_health}</p></div>}
                    {(selectedVehicle as any).hypothecation && <div className="p-2 bg-muted/50 rounded"><p className="text-xs text-muted-foreground uppercase">Hypothecation</p><p className="font-medium text-sm">{(selectedVehicle as any).hypothecation}</p></div>}
                    {(selectedVehicle as any).seating_capacity && <div className="p-2 bg-muted/50 rounded"><p className="text-xs text-muted-foreground uppercase">Seats</p><p className="font-medium text-sm">{(selectedVehicle as any).seating_capacity}</p></div>}
                    {(selectedVehicle as any).boot_space && <div className="p-2 bg-muted/50 rounded"><p className="text-xs text-muted-foreground uppercase">Boot Space</p><p className="font-medium text-sm">{(selectedVehicle as any).boot_space}</p></div>}
                  </div>

                  {selectedVehicle.is_public && selectedVehicle.public_page_id && (
                    <div className="flex flex-col sm:flex-row gap-2 p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Globe className="h-5 w-5 text-green-600 shrink-0" />
                        <code className="text-sm truncate">{window.location.origin}/v/{selectedVehicle.public_page_id}</code>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => copyPublicLink(selectedVehicle.public_page_id!)} className="gap-1">
                          <Copy className="h-4 w-4" /> Copy
                        </Button>
                        <a href={`/v/${selectedVehicle.public_page_id}`} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="gap-1">
                            <ExternalLink className="h-4 w-4" /> View
                          </Button>
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Purchase Price</p>
                      <p className="text-xl sm:text-2xl font-bold">{formatCurrency(selectedVehicle.purchase_price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Selling Price</p>
                      <p className="text-xl sm:text-2xl font-bold text-chart-2">{formatCurrency(selectedVehicle.selling_price)}</p>
                    </div>
                  </div>

                  {docs.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Documents</h4>
                      <div className="flex flex-wrap gap-2">
                        {docs.map((doc) => (
                          <div key={doc.id} className="flex items-center gap-2 bg-muted px-3 py-2 rounded">
                            <FileText className="h-4 w-4" />
                            <div className="flex flex-col">
  <span className="text-sm truncate">{doc.document_name}</span>
  <span
    className={`mt-0.5 w-fit px-2 py-0.5 rounded text-xs border ${
      documentTypeMeta[doc.document_type as DocumentType].className
    }`}
  >
    {documentTypeMeta[doc.document_type as DocumentType].label}
  </span>
</div>

                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openDocViewer(doc.document_url)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <a href={doc.document_url} download target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <Download className="h-4 w-4" />
                              </Button>
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedVehicle.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Notes</p>
                      <p className="mt-1">{selectedVehicle.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      className="gap-2" 
                      onClick={async () => {
                        const { data: settingsData } = await supabase.from("settings").select("*").maybeSingle();
                        const images = vehicleImages[selectedVehicle.id] || [];
                        const primaryImage = images.find(i => i.is_primary) || images[0];
                        await generateVehicleBrochurePDF(selectedVehicle as any, settingsData || {}, primaryImage?.image_url);
                        toast({ title: "Brochure PDF downloaded" });
                      }}
                    >
                      <Printer className="h-4 w-4" /> Download Brochure
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-4">
  <Button
    variant="outline"
    onClick={() => {
      setDetailDialogOpen(false);
      openEditDialog(selectedVehicle);
    }}
  >
    <Pencil className="h-4 w-4 mr-2" /> Edit Vehicle
  </Button>

  {selectedVehicle.status !== "sold" && (
  <Button
    variant="destructive"
    onClick={() => {
      setDetailDialogOpen(false);
      openDeleteDialog(selectedVehicle.id);
    }}
  >
    <Trash2 className="h-4 w-4 mr-2" /> Delete Vehicle
  </Button>
)}


  {selectedVehicle.is_public && selectedVehicle.public_page_id && (
    <>
      <Button
        variant="outline"
        onClick={() => copyPublicLink(selectedVehicle.public_page_id!)}
      >
        <Link className="h-4 w-4 mr-2" /> Copy Public Link
      </Button>

      <a
        href={`/v/${selectedVehicle.public_page_id}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button variant="outline">
          <ExternalLink className="h-4 w-4 mr-2" /> View Public Page
        </Button>
      </a>
    </>
  )}
</div>

                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Document Viewer */}
      <Dialog open={docViewerOpen} onOpenChange={setDocViewerOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Document Viewer</span>
              <a href={selectedDoc || ''} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" /> Open in New Tab
                </Button>
              </a>
            </DialogTitle>
          </DialogHeader>
          {selectedDoc && (
            <div className="h-[75vh]">
              {selectedDoc.toLowerCase().endsWith('.pdf') ? (
                <iframe src={selectedDoc} className="w-full h-full rounded border" />
              ) : (
                <img src={selectedDoc} alt="Document" className="w-full h-full object-contain" />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Vehicles;