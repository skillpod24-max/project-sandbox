import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatIndianNumber } from "@/lib/formatters";
import {
  Car, Clock, MapPin, Phone, User, Eye, CheckCircle, XCircle,
  Calendar, Fuel, Gauge, Image as ImageIcon, Tag, MessageSquare,
  BarChart3, TrendingUp, Timer, ArrowUpRight, ArrowDownRight, Mail
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Layout from "@/components/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, startOfDay } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

// Tab Types
type HubTab = "test-drives" | "analytics" | "vehicles-for-sale" | "enquiries";

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

interface TestDriveRequest {
  id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  vehicle_interest: string;
  notes: string | null;
  status: string;
  created_at: string;
  testDriveDate?: string;
  testDriveTime?: string;
}

const DealerMarketplaceHub = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<HubTab>("analytics");

  // Analytics state
  const [analyticsStats, setAnalyticsStats] = useState({
    totalViews: 0,
    totalEnquiries: 0,
    totalCalls: 0,
    totalWhatsapp: 0,
    publicVehicles: 0,
    conversionRate: 0,
  });
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [vehicleStats, setVehicleStats] = useState<any[]>([]);
  const [period, setPeriod] = useState("7d");

  // Test Drive state
  const [testDriveRequests, setTestDriveRequests] = useState<TestDriveRequest[]>([]);

  // Vehicles for Sale state
  const [sellRequests, setSellRequests] = useState<SellRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SellRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Enquiries state
  const [enquiries, setEnquiries] = useState<any[]>([]);

  useEffect(() => {
    fetchAllData();
  }, [period]);

  const fetchAllData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      await Promise.all([
        fetchAnalytics(user.id),
        fetchTestDrives(user.id),
        fetchSellRequests(user.id),
        fetchEnquiries(user.id)
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (userId: string) => {
    try {
      const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      const startDate = startOfDay(subDays(new Date(), days));

      // Fetch ONLY marketplace-specific events
      const { data: events } = await supabase
        .from("public_page_events")
        .select("*")
        .eq("dealer_user_id", userId)
        .eq("public_page_id", "marketplace")
        .gte("created_at", startDate.toISOString());

      const { count: publicVehiclesCount } = await supabase
        .from("vehicles")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_public", true)
        .eq("marketplace_status", "listed");

      const views = (events || []).filter(e => 
        e.event_type === "vehicle_view" || e.event_type === "dealer_view"
      ).length;
      const enquiriesCount = (events || []).filter(e => e.event_type === "enquiry_submit").length;
      const calls = (events || []).filter(e => e.event_type === "cta_call").length;
      const whatsapp = (events || []).filter(e => e.event_type === "cta_whatsapp").length;

      setAnalyticsStats({
        totalViews: views,
        totalEnquiries: enquiriesCount,
        totalCalls: calls,
        totalWhatsapp: whatsapp,
        publicVehicles: publicVehiclesCount || 0,
        conversionRate: views > 0 ? ((enquiriesCount + calls + whatsapp) / views) * 100 : 0,
      });

      const dailyMap: Record<string, { date: string; views: number; enquiries: number }> = {};
      for (let i = 0; i < days; i++) {
        const d = format(subDays(new Date(), i), "MMM dd");
        dailyMap[d] = { date: d, views: 0, enquiries: 0 };
      }

      (events || []).forEach(e => {
        const d = format(new Date(e.created_at), "MMM dd");
        if (dailyMap[d]) {
          if (e.event_type === "vehicle_view" || e.event_type === "dealer_view") dailyMap[d].views++;
          if (e.event_type === "enquiry_submit") dailyMap[d].enquiries++;
        }
      });

      setDailyData(Object.values(dailyMap).reverse());

      // Vehicle-wise stats
      const vehicleMap: Record<string, { id: string; views: number; enquiries: number }> = {};
      (events || []).filter(e => e.vehicle_id).forEach(e => {
        if (!vehicleMap[e.vehicle_id]) {
          vehicleMap[e.vehicle_id] = { id: e.vehicle_id, views: 0, enquiries: 0 };
        }
        if (e.event_type === "vehicle_view") vehicleMap[e.vehicle_id].views++;
        if (e.event_type === "enquiry_submit") vehicleMap[e.vehicle_id].enquiries++;
      });

      const vehicleIds = Object.keys(vehicleMap);
      if (vehicleIds.length > 0) {
        const { data: vehiclesData } = await supabase
          .from("vehicles")
          .select("id, brand, model, manufacturing_year, selling_price")
          .in("id", vehicleIds);

        const enriched = (vehiclesData || []).map(v => ({
          ...v,
          ...vehicleMap[v.id],
          name: `${v.manufacturing_year} ${v.brand} ${v.model}`,
        })).sort((a, b) => b.views - a.views);

        setVehicleStats(enriched.slice(0, 10));
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const fetchTestDrives = async (userId: string) => {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", userId)
      .eq("source", "marketplace")
      .ilike("notes", "%TEST DRIVE REQUESTED%")
      .order("created_at", { ascending: false });

    const parsed = (data || []).map(lead => {
      const notes = lead.notes || "";
      const dateMatch = notes.match(/TEST DRIVE REQUESTED: (\d{4}-\d{2}-\d{2})/);
      const timeMatch = notes.match(/at (\d{1,2}:\d{2} [AP]M)/);
      return {
        ...lead,
        testDriveDate: dateMatch?.[1],
        testDriveTime: timeMatch?.[1]
      };
    });

    setTestDriveRequests(parsed);
  };

  const fetchSellRequests = async (userId: string) => {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", userId)
      .eq("lead_type", "seller")
      .order("created_at", { ascending: false });

    const parsedRequests = (data || []).map(req => {
      let parsedData = {};
      try {
        if (req.notes) {
          parsedData = JSON.parse(req.notes);
        }
      } catch {}
      return { ...req, parsedData } as SellRequest;
    });

    setSellRequests(parsedRequests);
  };

  const fetchEnquiries = async (userId: string) => {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", userId)
      .eq("source", "marketplace")
      .not("notes", "ilike", "%TEST DRIVE REQUESTED%")
      .order("created_at", { ascending: false })
      .limit(50);

    setEnquiries(data || []);
  };

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      await supabase
        .from("leads")
        .update({ status: newStatus })
        .eq("id", requestId);

      toast({ title: `Status updated to ${newStatus}` });
      fetchAllData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const tabs: { id: HubTab; label: string; icon: any }[] = [
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "test-drives", label: "Test Drives", icon: Calendar },
    { id: "vehicles-for-sale", label: "Vehicles for Sale", icon: Tag },
    { id: "enquiries", label: "Enquiries", icon: MessageSquare },
  ];

  const statusColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-700",
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-emerald-100 text-emerald-700",
    completed: "bg-purple-100 text-purple-700",
    contacted: "bg-amber-100 text-amber-700",
    interested: "bg-emerald-100 text-emerald-700",
    not_interested: "bg-slate-100 text-slate-600",
    purchased: "bg-purple-100 text-purple-700",
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex gap-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80 rounded-lg" />
            <Skeleton className="h-80 rounded-lg" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              Marketplace Hub
            </h1>
            <p className="text-muted-foreground">Manage your marketplace presence</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6 animate-fade-in">
            {/* Period Selector */}
            <div className="flex gap-2">
              {["7d", "30d", "90d"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    period === p
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "90 Days"}
                </button>
              ))}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "Total Views", value: analyticsStats.totalViews, icon: Eye, color: "text-blue-600 bg-blue-50" },
                { label: "Enquiries", value: analyticsStats.totalEnquiries, icon: MessageSquare, color: "text-green-600 bg-green-50" },
                { label: "Calls", value: analyticsStats.totalCalls, icon: Phone, color: "text-purple-600 bg-purple-50" },
                { label: "WhatsApp", value: analyticsStats.totalWhatsapp, icon: MessageSquare, color: "text-emerald-600 bg-emerald-50" },
                { label: "Public Vehicles", value: analyticsStats.publicVehicles, icon: Car, color: "text-amber-600 bg-amber-50" },
                { label: "Conversion Rate", value: `${analyticsStats.conversionRate.toFixed(1)}%`, icon: TrendingUp, color: "text-rose-600 bg-rose-50" },
              ].map((stat, i) => (
                <Card key={i} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Views & Enquiries Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="date" fontSize={12} stroke="#9CA3AF" />
                        <YAxis fontSize={12} stroke="#9CA3AF" />
                        <Tooltip />
                        <Line type="monotone" dataKey="views" stroke="#3B82F6" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="enquiries" stroke="#10B981" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Top Performing Vehicles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {vehicleStats.map((v, i) => (
                      <div key={v.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground w-6">#{i + 1}</span>
                          <div>
                            <p className="text-sm font-medium text-foreground">{v.name}</p>
                            <p className="text-xs text-muted-foreground">{formatCurrency(v.selling_price)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-blue-600">
                            <Eye className="h-3 w-3" /> {v.views}
                          </span>
                          <span className="flex items-center gap-1 text-green-600">
                            <MessageSquare className="h-3 w-3" /> {v.enquiries}
                          </span>
                        </div>
                      </div>
                    ))}
                    {vehicleStats.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        No vehicle data available
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Test Drives Tab */}
        {activeTab === "test-drives" && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Pending", value: testDriveRequests.filter(r => r.status === "new" || r.status === "pending").length, color: "text-amber-600 bg-amber-50" },
                { label: "Confirmed", value: testDriveRequests.filter(r => r.status === "confirmed").length, color: "text-blue-600 bg-blue-50" },
                { label: "Completed", value: testDriveRequests.filter(r => r.status === "completed").length, color: "text-emerald-600 bg-emerald-50" },
                { label: "Total", value: testDriveRequests.length, color: "text-slate-600 bg-slate-100" },
              ].map((stat, i) => (
                <Card key={i} className="border-0 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {testDriveRequests.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Test Drive Requests</h3>
                  <p className="text-muted-foreground">When customers request test drives, they'll appear here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {testDriveRequests.map((request) => (
                  <Card key={request.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{request.customer_name}</p>
                            <p className="text-sm text-muted-foreground">{request.vehicle_interest}</p>
                            {request.testDriveDate && (
                              <p className="text-xs text-blue-600 mt-1">
                                📅 {request.testDriveDate} at {request.testDriveTime}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[request.status] || statusColors.new}>
                            {request.status.replace("_", " ")}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`tel:${request.phone}`, "_self")}
                          >
                            <Phone className="h-4 w-4 mr-1" />
                            Call
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(request.id, "confirmed")}
                          >
                            Confirm
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vehicles for Sale Tab */}
        {activeTab === "vehicles-for-sale" && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "New Requests", value: sellRequests.filter(r => r.status === "new").length, color: "text-blue-600 bg-blue-50" },
                { label: "Contacted", value: sellRequests.filter(r => r.status === "contacted").length, color: "text-amber-600 bg-amber-50" },
                { label: "Interested", value: sellRequests.filter(r => r.status === "interested").length, color: "text-emerald-600 bg-emerald-50" },
                { label: "Purchased", value: sellRequests.filter(r => r.status === "purchased").length, color: "text-purple-600 bg-purple-50" },
              ].map((stat, i) => (
                <Card key={i} className="border-0 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                      <Car className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {sellRequests.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <Car className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Vehicles Yet</h3>
                  <p className="text-muted-foreground">When sellers submit vehicles for sale, they'll appear here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sellRequests.map((request) => (
                  <Card key={request.id} className="border-0 shadow-sm overflow-hidden">
                    <div className="aspect-video bg-muted relative">
                      {request.parsedData?.images?.[0] ? (
                        <img src={request.parsedData.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                      )}
                      <Badge className={`absolute top-3 left-3 ${statusColors[request.status] || statusColors.new}`}>
                        {request.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold">{request.vehicle_interest}</h3>
                        {request.parsedData?.expectedPrice && (
                          <p className="text-lg font-bold text-blue-600">₹{request.parsedData.expectedPrice}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{request.customer_name}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                          setSelectedRequest(request);
                          setDetailOpen(true);
                        }}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button size="sm" className="flex-1" onClick={() => window.open(`tel:${request.phone}`, "_self")}>
                          <Phone className="h-4 w-4 mr-1" />
                          Call
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Enquiries Tab */}
        {activeTab === "enquiries" && (
          <div className="space-y-4 animate-fade-in">
            {enquiries.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Enquiries Yet</h3>
                  <p className="text-muted-foreground">Marketplace enquiries will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {enquiries.map((enquiry) => (
                  <Card key={enquiry.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-green-50 flex items-center justify-center">
                            <MessageSquare className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{enquiry.customer_name}</p>
                            <p className="text-sm text-muted-foreground">{enquiry.vehicle_interest}</p>
                            <p className="text-xs text-muted-foreground">{new Date(enquiry.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[enquiry.status] || statusColors.new}>
                            {enquiry.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`tel:${enquiry.phone}`, "_self")}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vehicle Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Vehicle Details</DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-6">
                {selectedRequest.parsedData?.images && selectedRequest.parsedData.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {selectedRequest.parsedData.images.map((img, i) => (
                      <img key={i} src={img} alt="" className="aspect-video rounded-lg object-cover" />
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Vehicle</p>
                    <p className="font-semibold">{selectedRequest.vehicle_interest}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Price</p>
                    <p className="font-semibold text-blue-600">₹{selectedRequest.parsedData?.expectedPrice || "Not specified"}</p>
                  </div>
                </div>

                <Card className="bg-muted border-0">
                  <CardContent className="p-4 space-y-2">
                    <h4 className="font-semibold">Seller Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedRequest.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedRequest.phone}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleStatusUpdate(selectedRequest.id, "contacted")} className="flex-1">
                    Mark Contacted
                  </Button>
                  <Button onClick={() => handleStatusUpdate(selectedRequest.id, "interested")} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Interested
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

export default DealerMarketplaceHub;
