import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatters";
import {
  Car, Clock, MapPin, Phone, User, Eye, CheckCircle, XCircle,
  Calendar, Fuel, Gauge, Image as ImageIcon, Tag
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Layout from "@/components/Layout";
import CarLoader from "@/components/CarLoader";

interface SellRequest {
  id: string;
  lead_number: string;
  customer_name: string;
  phone: string;
  email: string | null;
  city: string | null;
  vehicle_interest: string;
  notes: string | null;
  status: string;
  created_at: string;
  parsedData?: {
    type?: string;
    vehicleType?: string;
    brand?: string;
    model?: string;
    year?: number;
    fuelType?: string;
    transmission?: string;
    kmDriven?: string;
    expectedPrice?: string;
    owners?: string;
    description?: string;
    images?: string[];
  };
}

const VehiclesForSale = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<SellRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SellRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    fetchSellRequests();
  }, []);

  const fetchSellRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch sell requests assigned to this dealer
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id", user.id)
        .eq("lead_type", "seller")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Parse the notes JSON for each request
      const parsedRequests = (data || []).map(req => {
        let parsedData = {};
        try {
          if (req.notes) {
            parsedData = JSON.parse(req.notes);
          }
        } catch {
          // If notes isn't JSON, keep it as is
        }
        return { ...req, parsedData } as SellRequest;
      });

      setRequests(parsedRequests);
    } catch (error: any) {
      console.error("Error fetching sell requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      await supabase
        .from("leads")
        .update({ status: newStatus })
        .eq("id", requestId);

      toast({ title: `Status updated to ${newStatus}` });
      fetchSellRequests();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openDetail = (request: SellRequest) => {
    setSelectedRequest(request);
    setDetailOpen(true);
  };

  const statusColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-700",
    contacted: "bg-amber-100 text-amber-700",
    interested: "bg-emerald-100 text-emerald-700",
    not_interested: "bg-slate-100 text-slate-600",
    purchased: "bg-purple-100 text-purple-700",
  };

  if (loading) {
    return <Layout><CarLoader /></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Tag className="h-7 w-7 text-blue-600" />
            Vehicles Available for Sale
          </h1>
          <p className="text-slate-500 mt-1">
            Browse vehicles submitted by sellers looking for dealers
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "New Requests", value: requests.filter(r => r.status === "new").length, color: "text-blue-600 bg-blue-50" },
            { label: "Contacted", value: requests.filter(r => r.status === "contacted").length, color: "text-amber-600 bg-amber-50" },
            { label: "Interested", value: requests.filter(r => r.status === "interested").length, color: "text-emerald-600 bg-emerald-50" },
            { label: "Purchased", value: requests.filter(r => r.status === "purchased").length, color: "text-purple-600 bg-purple-50" },
          ].map((stat, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <Car className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <Car className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Vehicles Yet</h3>
              <p className="text-slate-500">
                When sellers submit vehicles for sale and admin assigns them to you, they'll appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requests.map((request) => (
              <Card key={request.id} className="border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {/* Image Preview */}
                <div className="aspect-video bg-slate-100 relative">
                  {request.parsedData?.images?.[0] ? (
                    <img
                      src={request.parsedData.images[0]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="h-12 w-12 text-slate-300" />
                    </div>
                  )}
                  <Badge className={`absolute top-3 left-3 ${statusColors[request.status] || statusColors.new}`}>
                    {request.status.replace("_", " ")}
                  </Badge>
                  {request.parsedData?.images && request.parsedData.images.length > 1 && (
                    <Badge className="absolute top-3 right-3 bg-black/60 text-white border-0">
                      <ImageIcon className="h-3 w-3 mr-1" />
                      {request.parsedData.images.length}
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {request.vehicle_interest}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-500">
                      {request.parsedData?.fuelType && (
                        <span className="flex items-center gap-1">
                          <Fuel className="h-3 w-3" />
                          {request.parsedData.fuelType}
                        </span>
                      )}
                      {request.parsedData?.kmDriven && (
                        <span className="flex items-center gap-1">
                          <Gauge className="h-3 w-3" />
                          {request.parsedData.kmDriven} km
                        </span>
                      )}
                      {request.parsedData?.owners && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {request.parsedData.owners} owner
                        </span>
                      )}
                    </div>
                  </div>

                  {request.parsedData?.expectedPrice && (
                    <p className="text-lg font-bold text-blue-600">
                      ₹{request.parsedData.expectedPrice}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <User className="h-4 w-4" />
                    <span>{request.customer_name}</span>
                    {request.city && (
                      <>
                        <span className="text-slate-300">•</span>
                        <MapPin className="h-3 w-3" />
                        <span>{request.city}</span>
                      </>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openDetail(request)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(`tel:${request.phone}`, "_self")}
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Vehicle Details</DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-6">
                {/* Images */}
                {selectedRequest.parsedData?.images && selectedRequest.parsedData.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {selectedRequest.parsedData.images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt=""
                        className="aspect-video rounded-lg object-cover"
                      />
                    ))}
                  </div>
                )}

                {/* Vehicle Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Vehicle</p>
                    <p className="font-semibold">{selectedRequest.vehicle_interest}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Expected Price</p>
                    <p className="font-semibold text-blue-600">
                      ₹{selectedRequest.parsedData?.expectedPrice || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Fuel Type</p>
                    <p className="font-medium">{selectedRequest.parsedData?.fuelType || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Transmission</p>
                    <p className="font-medium">{selectedRequest.parsedData?.transmission || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">KM Driven</p>
                    <p className="font-medium">{selectedRequest.parsedData?.kmDriven || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Owners</p>
                    <p className="font-medium">{selectedRequest.parsedData?.owners || "1"}</p>
                  </div>
                </div>

                {selectedRequest.parsedData?.description && (
                  <div>
                    <p className="text-sm text-slate-500">Description</p>
                    <p className="text-slate-700">{selectedRequest.parsedData.description}</p>
                  </div>
                )}

                {/* Seller Info */}
                <Card className="bg-slate-50 border-0">
                  <CardContent className="p-4 space-y-2">
                    <h4 className="font-semibold">Seller Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span>{selectedRequest.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <span>{selectedRequest.phone}</span>
                      </div>
                      {selectedRequest.email && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">@</span>
                          <span>{selectedRequest.email}</span>
                        </div>
                      )}
                      {selectedRequest.city && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span>{selectedRequest.city}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleStatusUpdate(selectedRequest.id, "contacted")}
                    className="flex-1"
                  >
                    Mark Contacted
                  </Button>
                  <Button
                    onClick={() => handleStatusUpdate(selectedRequest.id, "interested")}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Interested
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusUpdate(selectedRequest.id, "not_interested")}
                    className="text-slate-500"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default VehiclesForSale;
