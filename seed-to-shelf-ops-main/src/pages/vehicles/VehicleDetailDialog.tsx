import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
  ExternalLink,
  Globe,
  Copy,
  Printer,
  Pencil,
  Trash2,
  Image,
  FileText,
  Link,
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { generateVehicleBrochurePDF } from "@/lib/vehiclePdfGenerator";
import { formatCurrency } from "@/lib/formatters";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selectedVehicle: Vehicle | null;
  openEditDialog: (v: Vehicle) => void;
  openDeleteDialog: (id: string) => void;
  vehicleImages: Record<string, VehicleImage[]>;
  vehicleDocs: Record<string, Document[]>;
}

export default function VehicleDetailDialog({
  open,
  onOpenChange,
  selectedVehicle,
  openEditDialog,
  openDeleteDialog,
  vehicleImages,
  vehicleDocs,
}: Props) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!open) setCurrentImageIndex(0);
  }, [open]);

  if (!selectedVehicle) return null;

  const images = vehicleImages[selectedVehicle.id] || [];
  const docs = vehicleDocs[selectedVehicle.id] || [];
  const currentImage = images[currentImageIndex];

  const nextImage = () =>
    setCurrentImageIndex((i) => (i + 1) % images.length);

  const prevImage = () =>
    setCurrentImageIndex((i) => (i - 1 + images.length) % images.length);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[calc(100vw-2rem)] max-h-[95vh] overflow-y-auto p-0">
        {/* 🔽 PASTE YOUR EXISTING JSX CONTENT HERE 🔽 */}

        

          <div>
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
      onOpenChange(false);

      openEditDialog(selectedVehicle);
    }}
  >
    <Pencil className="h-4 w-4 mr-2" /> Edit Vehicle
  </Button>

  {selectedVehicle.status !== "sold" && (
  <Button
    variant="destructive"
    onClick={() => {
      onOpenChange(false);

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
          </div>
        
      </DialogContent>
    </Dialog>
  );
}






