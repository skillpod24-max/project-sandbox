import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, Clock, User, Phone, Car, Mail, 
  CheckCircle, XCircle, Clock3, Search, Filter
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type TestDriveStatus = "pending" | "confirmed" | "completed" | "cancelled";

interface TestDriveRequest {
  id: string;
  customer_name: string;
  phone: string;
  email?: string;
  vehicle_interest?: string;
  test_drive_date?: string;
  test_drive_time?: string;
  status: TestDriveStatus;
  created_at: string;
  notes?: string;
}

const TestDriveRequests = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<TestDriveRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchTestDriveRequests();
  }, []);

  const fetchTestDriveRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch leads with test drive requests
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id", user.id)
        .ilike("notes", "%TEST DRIVE REQUESTED%")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Parse test drive info from notes
      const parsedRequests: TestDriveRequest[] = (data || []).map(lead => {
        const notes = lead.notes || "";
        const dateMatch = notes.match(/TEST DRIVE REQUESTED: (\d{4}-\d{2}-\d{2}) at ([\d:]+\s*[AP]M)/i);
        
        // Determine status based on lead status
        let testDriveStatus: TestDriveStatus = "pending";
        if (lead.status === "contacted") testDriveStatus = "confirmed";
        else if (lead.status === "converted") testDriveStatus = "completed";
        else if (lead.status === "lost") testDriveStatus = "cancelled";

        return {
          id: lead.id,
          customer_name: lead.customer_name,
          phone: lead.phone,
          email: lead.email || undefined,
          vehicle_interest: lead.vehicle_interest || undefined,
          test_drive_date: dateMatch?.[1] || undefined,
          test_drive_time: dateMatch?.[2] || undefined,
          status: testDriveStatus,
          created_at: lead.created_at,
          notes: notes.replace(/\[MARKETPLACE\]\s*/, "").replace(/\[TEST DRIVE REQUESTED:.*?\]/, "").trim() || undefined,
        };
      });

      setRequests(parsedRequests);
    } catch (error) {
      console.error("Error fetching test drive requests:", error);
      toast({ title: "Error loading requests", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (requestId: string, newStatus: TestDriveStatus) => {
    try {
      // Map test drive status to lead status
      let leadStatus = "new";
      if (newStatus === "confirmed") leadStatus = "contacted";
      else if (newStatus === "completed") leadStatus = "converted";
      else if (newStatus === "cancelled") leadStatus = "lost";

      const { error } = await supabase
        .from("leads")
        .update({ status: leadStatus })
        .eq("id", requestId);

      if (error) throw error;

      setRequests(prev => prev.map(r => 
        r.id === requestId ? { ...r, status: newStatus } : r
      ));

      toast({ title: `Status updated to ${newStatus}` });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({ title: "Error updating status", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: TestDriveStatus) => {
    const styles = {
      pending: "bg-amber-100 text-amber-700",
      confirmed: "bg-blue-100 text-blue-700",
      completed: "bg-emerald-100 text-emerald-700",
      cancelled: "bg-red-100 text-red-700",
    };
    
    const icons = {
      pending: Clock3,
      confirmed: CheckCircle,
      completed: CheckCircle,
      cancelled: XCircle,
    };
    
    const Icon = icons[status];
    
    return (
      <Badge className={`${styles[status]} gap-1 capitalize`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.phone.includes(searchTerm) ||
      (req.vehicle_interest || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    confirmed: requests.filter(r => r.status === "confirmed").length,
    completed: requests.filter(r => r.status === "completed").length,
  };

  return (
    <Layout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Test Drive Requests</h1>
          <p className="text-slate-500">Manage customer test drive bookings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Requests", value: stats.total, color: "bg-slate-100 text-slate-700" },
            { label: "Pending", value: stats.pending, color: "bg-amber-100 text-amber-700" },
            { label: "Confirmed", value: stats.confirmed, color: "bg-blue-100 text-blue-700" },
            { label: "Completed", value: stats.completed, color: "bg-emerald-100 text-emerald-700" },
          ].map((stat, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, phone, or vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredRequests.length > 0 ? (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Customer Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{request.customer_name}</h3>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Phone className="h-3 w-3" />
                            <a href={`tel:${request.phone}`} className="hover:text-blue-600">{request.phone}</a>
                            {request.email && (
                              <>
                                <span>•</span>
                                <Mail className="h-3 w-3" />
                                <a href={`mailto:${request.email}`} className="hover:text-blue-600">{request.email}</a>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {request.vehicle_interest && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 mt-2">
                          <Car className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">{request.vehicle_interest}</span>
                        </div>
                      )}
                    </div>

                    {/* Date & Time */}
                    <div className="flex items-center gap-4 text-sm">
                      {request.test_drive_date && (
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">
                            {new Date(request.test_drive_date).toLocaleDateString('en-IN', { 
                              day: 'numeric', month: 'short', year: 'numeric' 
                            })}
                          </span>
                        </div>
                      )}
                      {request.test_drive_time && (
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg">
                          <Clock className="h-4 w-4 text-emerald-600" />
                          <span className="font-medium">{request.test_drive_time}</span>
                        </div>
                      )}
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-3">
                      {getStatusBadge(request.status)}
                      
                      <Select 
                        value={request.status} 
                        onValueChange={(value) => updateStatus(request.id, value as TestDriveStatus)}
                      >
                        <SelectTrigger className="w-[130px] h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirm</SelectItem>
                          <SelectItem value="completed">Complete</SelectItem>
                          <SelectItem value="cancelled">Cancel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {request.notes && (
                    <p className="text-sm text-slate-500 mt-3 pl-13 border-t border-slate-100 pt-3">
                      <strong>Note:</strong> {request.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No test drive requests</h3>
              <p className="text-slate-500">Test drive requests from marketplace will appear here</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default TestDriveRequests;
