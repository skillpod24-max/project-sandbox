import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Download, ExternalLink, FileText } from "lucide-react";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import { PageSkeleton } from "@/components/ui/page-skeleton";






type Document = Database["public"]["Tables"]["documents"]["Row"];
type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type DocumentType =
  | "rc"
  | "insurance"
  | "puc"
  | "invoice"
  | "sale_agreement"
  | "delivery_note"
  | "id_proof"
  | "driving_license";

const documentTypeMeta: Record<
  DocumentType,
  { label: string; className: string }
> = {
  rc: { label: "RC Book", className: "bg-blue-100 text-blue-700 border-blue-300" },
  insurance: { label: "Insurance", className: "bg-green-100 text-green-700 border-green-300" },
  puc: { label: "PUC", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  invoice: { label: "Invoice", className: "bg-purple-100 text-purple-700 border-purple-300" },
  sale_agreement: { label: "Sale Agreement", className: "bg-indigo-100 text-indigo-700 border-indigo-300" },
  delivery_note: { label: "Delivery Note", className: "bg-cyan-100 text-cyan-700 border-cyan-300" },
  id_proof: { label: "ID Proof", className: "bg-orange-100 text-orange-700 border-orange-300" },
  driving_license: { label: "Driving License", className: "bg-rose-100 text-rose-700 border-rose-300" },
};



const Documents = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const [docViewerOpen, setDocViewerOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Get current user for explicit filtering
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const [docsRes, vehiclesRes] = await Promise.all([
      supabase.from("documents").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("vehicles").select("*").eq("user_id", user.id).order("brand"),
    ]);
    setDocuments(docsRes.data || []);
    setVehicles(vehiclesRes.data || []);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-chart-2 text-white";
      case "expired": return "bg-destructive text-white";
      default: return "bg-chart-3 text-white";
    }
  };

  const openDocViewer = (doc: Document) => {
    setSelectedDoc(doc);
    setDocViewerOpen(true);
  };

  const handleDownload = async (doc: Document) => {
  try {
    const response = await fetch(doc.document_url);
    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = doc.document_name || "document";
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Download failed", err);
  }
};


  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.code})` : "Unknown";
  };

  const filteredDocuments = selectedVehicle === "all" 
    ? documents 
    : documents.filter(d => d.reference_id === selectedVehicle);

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">Manage all documents</p>
        </div>
        
        <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by vehicle" />
          </SelectTrigger>
          <SelectContent className="max-h-64 overflow-y-auto">
            <SelectItem value="all">All Documents</SelectItem>
            {vehicles.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.brand} {v.model} ({v.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-border">
        <CardHeader>
          <CardTitle>
            Document List ({filteredDocuments.length})
            {selectedVehicle !== "all" && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                - Filtered by: {getVehicleName(selectedVehicle)}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Vehicle</TableHead>
                  
                  <TableHead>Status</TableHead>
                  
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((d) => (
                  <TableRow
  key={d.id}
  className="cursor-pointer hover:bg-muted/50"
  onClick={() => openDocViewer(d)}
>

                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {d.document_name}
                      </div>
                    </TableCell>
                    <TableCell>
  <span
    className={`inline-block px-2 py-0.5 rounded text-xs border ${
      documentTypeMeta[d.document_type as DocumentType]?.className
    }`}
  >
    {documentTypeMeta[d.document_type as DocumentType]?.label || d.document_type}
  </span>
</TableCell>


                    <TableCell className="text-sm text-muted-foreground">
                      {d.reference_type === "vehicle" ? getVehicleName(d.reference_id) : d.reference_type}
                    </TableCell>
                    
                    <TableCell><Badge className={getStatusColor(d.status)}>{d.status}</Badge></TableCell>
                    
                  </TableRow>
                ))}
                {filteredDocuments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {selectedVehicle === "all" ? "No documents found" : "No documents found for this vehicle"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Document Viewer Dialog */}
      <Dialog open={docViewerOpen} onOpenChange={setDocViewerOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
  <span>{selectedDoc?.document_name}</span>

  <div className="flex gap-2">
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() => selectedDoc && handleDownload(selectedDoc)}
    >
      <Download className="h-4 w-4" />
      Download
    </Button>

    <a
      href={selectedDoc?.document_url || ""}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Button variant="outline" size="sm" className="gap-2">
        <ExternalLink className="h-4 w-4" />
        Open
      </Button>
    </a>
  </div>
</DialogTitle>

          </DialogHeader>
          {selectedDoc && (
            <div className="h-[75vh] bg-muted rounded-lg overflow-hidden">
              {selectedDoc.document_url.toLowerCase().endsWith('.pdf') ? (
                <iframe src={selectedDoc.document_url} className="w-full h-full border-0" />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img 
                    src={selectedDoc.document_url} 
                    alt={selectedDoc.document_name} 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Documents;
