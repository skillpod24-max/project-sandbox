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
import { Plus, Pencil, Trash2, Search, Eye, Phone, Mail, User, Car, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { formatCurrency } from "@/lib/formatters";
import { PageSkeleton } from "@/components/ui/page-skeleton";

// Indian number formatting
const formatIndian = (value: string) => {
  if (!value) return "";
  const num = value.replace(/,/g, "");
  if (isNaN(Number(num))) return value;

  return Number(num).toLocaleString("en-IN");
};

const parseIndian = (value: string) => {
  const num = value.replace(/,/g, "");
  return num ? Number(num) : null;
};

const formatIST = (date: string | null | undefined) => {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};




interface Lead {
  id: string;
  user_id: string;
  lead_number: string;
  customer_name: string;
  phone: string;
  email: string | null;
  vehicle_interest: string | null;
  budget_min: number | null;
  budget_max: number | null;
  source: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  follow_up_date: string | null;
  last_contact_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  city?: string | null;
  lead_type?: string | null;
  last_viewed_at?: string | null;
  converted_from_lead?: boolean | null;
}

const leadSources = ["walk_in", "phone", "website", "referral", "social_media", "advertisement", "other"] as const;
const leadStatuses = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"] as const;
const leadPriorities = ["low", "medium", "high", "urgent"] as const;

const Leads = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [budgetMinInput, setBudgetMinInput] = useState("");
const [budgetMaxInput, setBudgetMaxInput] = useState("");
const [isConverting, setIsConverting] = useState(false);
  const [formData, setFormData] = useState<Partial<Lead>>({
    customer_name: "",
    phone: "",
    email: "",
    vehicle_interest: "",
    source: "walk_in",
    status: "new",
    priority: "medium",
    city: "",
    lead_type: "buying",
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateCustomerCode = () =>
  `CUS${Date.now().toString(36).toUpperCase()}`;


  const generateLeadNumber = () => `LD${Date.now().toString(36).toUpperCase()}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsSubmitting(false);
      return;
    }

    try {
      if (selectedLead) {
        const { error } = await supabase
          .from("leads")
          .update({
            customer_name: formData.customer_name,
            phone: formData.phone,
            email: formData.email,
            vehicle_interest: formData.vehicle_interest,
            budget_min: formData.budget_min,
            budget_max: formData.budget_max,
            source: formData.source,
            status: formData.status,
            priority: formData.priority,
            assigned_to: formData.assigned_to,
            follow_up_date: formData.follow_up_date,
            notes: formData.notes,
            city: formData.city,
            lead_type: formData.lead_type,
          })
          .eq("id", selectedLead.id);
        if (error) throw error;
        toast({ title: "Lead updated successfully" });
      } else {
        const { error } = await supabase
          .from("leads")
          .insert([{
            user_id: user.id,
            lead_number: generateLeadNumber(),
            customer_name: formData.customer_name || "",
            phone: formData.phone || "",
            email: formData.email || null,
            vehicle_interest: formData.vehicle_interest || null,
            budget_min: formData.budget_min || null,
            budget_max: formData.budget_max || null,
            source: formData.source || "walk_in",
            status: formData.status || "new",
            priority: formData.priority || "medium",
            assigned_to: formData.assigned_to || null,
            follow_up_date: formData.follow_up_date || null,
            notes: formData.notes || null,
            city: formData.city || null,
            lead_type: formData.lead_type || "buying",
          }]);
        if (error) throw error;
        toast({ title: "Lead added successfully" });
      }

      setDialogOpen(false);
      resetForm();
      fetchLeads();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
  if (!leadToDelete) return;

  try {
    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", leadToDelete);

    if (error) throw error;

    toast({ title: "Lead deleted successfully" });

    setDetailDialogOpen(false); // 👈 safety
    fetchLeads();
  } catch (error: any) {
    toast({ title: "Error", description: error.message, variant: "destructive" });
  } finally {
    setDeleteDialogOpen(false);
    setLeadToDelete(null);
  }
};


  const openDeleteDialog = (id: string) => {
    setLeadToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus, last_contact_date: new Date().toISOString() })
        .eq("id", leadId);
      if (error) throw error;
      toast({ title: "Status updated" });
      fetchLeads();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openEditDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setFormData(lead);

setBudgetMinInput(
  lead.budget_min ? formatIndian(String(lead.budget_min)) : ""
);
setBudgetMaxInput(
  lead.budget_max ? formatIndian(String(lead.budget_max)) : ""
);

    setDialogOpen(true);
  };

  const openDetailDialog = async (lead: Lead) => {
    setSelectedLead(lead);
    setDetailDialogOpen(true);
    
    // Mark as viewed - update last_viewed_at
    if (lead.status === "new" && !lead.last_viewed_at) {
      await supabase
        .from("leads")
        .update({ last_viewed_at: new Date().toISOString() })
        .eq("id", lead.id);
    }
  };

  const resetForm = () => {
    setSelectedLead(null);
    setFormData({
      customer_name: "",
      phone: "",
      email: "",
      vehicle_interest: "",
      source: "walk_in",
      status: "new",
      priority: "medium",
      city: "",
      lead_type: "buying",
    });

     setBudgetMinInput("");
  setBudgetMaxInput("");

  };

  const filteredLeads = leads.filter((l) => {
    const matchesSearch = `${l.customer_name} ${l.phone} ${l.lead_number} ${l.vehicle_interest || ""} ${l.city || ""}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportLeads = () => {
  if (leads.length === 0) {
    toast({ title: "No leads to export" });
    return;
  }

  const headers = [
    "Lead Number",
    "Customer Name",
    "Phone",
    "Email",
    "City",
    "Type",
    "Vehicle Interest",
    "Source",
    "Priority",
    "Status",
    "Created At",
  ];

  const rows = leads.map((l) => [
    l.lead_number,
    l.customer_name,
    l.phone,
    l.email ?? "",
    l.city ?? "",
    l.lead_type ?? "",
    l.vehicle_interest ?? "",
    l.source,
    l.priority,
    l.status,
    new Date(l.created_at).toLocaleDateString(),
  ]);

  const csvContent =
    [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();

  URL.revokeObjectURL(url);
};


  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "contacted": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "qualified": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "proposal": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      case "negotiation": return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400";
      case "won": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "lost": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-muted";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500 text-white";
      case "high": return "bg-orange-500 text-white";
      case "medium": return "bg-yellow-500 text-white";
      case "low": return "bg-gray-400 text-white";
      default: return "bg-muted";
    }
  };

  const getLeadTypeColor = (leadType: string | null | undefined) => {
    if (leadType === "selling") return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
  };

  const stats = {
  total: leads.length,
  new: leads.filter(l => l.status === "new").length,
  contacted: leads.filter(l => l.status === "contacted").length,
  qualified: leads.filter(l => l.status === "qualified").length,
  proposal: leads.filter(l => l.status === "proposal").length,
  negotiation: leads.filter(l => l.status === "negotiation").length,
  won: leads.filter(l => l.status === "won").length,
  lost: leads.filter(l => l.status === "lost").length,
};


  if (loading) {
    return <PageSkeleton />;
  }

const convertLead = async (lead: Lead) => {
  if (isConverting) return; // 🔒 hard lock
  setIsConverting(true);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    // 🚫 Prevent double conversion
    if (lead.status === "qualified") {
      toast({ title: "Lead already converted" });
      return;
    }

    if (lead.lead_type === "buying") {
      // ✅ Convert to CUSTOMER
      await supabase.from("customers").insert([{
        user_id: user.id,
        code: generateCustomerCode(),
        full_name: lead.customer_name,
        phone: lead.phone,
        email: lead.email,
        is_active: true,
        lead_id: lead.id,
        converted_from_lead: true,
      }]);

      toast({ title: "Lead converted to Customer 🎉" });
    }

    if (lead.lead_type === "selling") {
  const { data, error } = await supabase
    .from("vendors")
    .insert([{
      user_id: user.id,
      code: `VEN${Date.now().toString(36).toUpperCase()}`,
      name: lead.customer_name,
      contact_person: lead.customer_name,
      phone: lead.phone,
      email: lead.email,
      vendor_type: "individual",
      is_active: true,
      lead_id: lead.id,
      converted_from_lead: true,
    }])
    .select()
    .single();

  if (error) {
    console.error("Vendor insert failed:", error);
    throw error;
  }

  console.log("Vendor created:", data);

  toast({ title: "Lead converted to Vendor 🎉" });
}


    // 🔁 Mark lead as converted
    await supabase
  .from("leads")
  .update({
    status: "qualified",
    converted_from_lead: true,
  })
  .eq("id", lead.id);


    setDetailDialogOpen(false);
    window.dispatchEvent(new Event("vendor-updated"));
    fetchLeads();

  } catch (err: any) {
    setIsConverting(false);
    toast({
      title: "Conversion failed",
      description: err.message,
      variant: "destructive",
    });
  }
};


  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground">Manage your sales leads and follow-ups</p>
        </div>
        <div className="flex gap-2">
  <Button variant="outline" onClick={exportLeads}>
    Export
  </Button>

  <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-2">
    <Plus className="h-4 w-4" /> Add Lead
  </Button>
</div>

      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
        <Card className="border border-border">
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground uppercase">Total</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-chart-1">{stats.new}</p>
            <p className="text-xs text-muted-foreground uppercase">New</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-chart-3">{stats.contacted}</p>
            <p className="text-xs text-muted-foreground uppercase">Contacted</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
  <CardContent className="p-3 sm:p-4 text-center">
    <p className="text-xl sm:text-2xl font-bold text-orange-500">
      {stats.proposal}
    </p>
    <p className="text-xs text-muted-foreground uppercase">Proposal</p>
  </CardContent>
</Card>

        <Card className="border border-border">
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-chart-4">{stats.qualified}</p>
            <p className="text-xs text-muted-foreground uppercase">Qualified</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
  <CardContent className="p-3 sm:p-4 text-center">
    <p className="text-xl sm:text-2xl font-bold text-cyan-500">
      {stats.negotiation}
    </p>
    <p className="text-xs text-muted-foreground uppercase">Negotiation</p>
  </CardContent>
</Card>

        <Card className="border border-border">
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-chart-2">{stats.won}</p>
            <p className="text-xs text-muted-foreground uppercase">Won</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-destructive">{stats.lost}</p>
            <p className="text-xs text-muted-foreground uppercase">Lost</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle>All Leads ({filteredLeads.length})</CardTitle>
            <div className="flex gap-2">
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search leads..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {leadStatuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Vehicle Interest</TableHead>
                  <TableHead>Source</TableHead>
                   <TableHead>Priority</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead>Test Drive</TableHead>
                   <TableHead>Follow Up</TableHead>
                  
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetailDialog(lead)}>
                    <TableCell className="font-mono text-sm">{lead.lead_number}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{lead.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{lead.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getLeadTypeColor(lead.lead_type)}>
                        {lead.lead_type === "selling" ? "Selling" : "Buying"}
                      </Badge>
                    </TableCell>
                    <TableCell>{lead.city || "-"}</TableCell>
                    <TableCell>{lead.vehicle_interest || "-"}</TableCell>
                    <TableCell>
                      {lead.source === "marketplace" ? (
                        <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">Marketplace</Badge>
                      ) : lead.source === "website" ? (
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Website</Badge>
                      ) : lead.source === "public_dealer_page" ? (
                        <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">Catalogue</Badge>
                      ) : lead.source === "public_vehicle_page" ? (
                        <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">Vehicle Page</Badge>
                      ) : lead.source === "walk_in" ? (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Walk-in</Badge>
                      ) : lead.source === "referral" ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Referral</Badge>
                      ) : lead.source === "phone" ? (
                        <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">Phone</Badge>
                      ) : lead.source === "social_media" ? (
                        <Badge className="bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400">Social</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell><Badge className={getPriorityColor(lead.priority)}>{lead.priority}</Badge></TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
  <Select
    value={lead.status}
    onValueChange={(v) => handleStatusChange(lead.id, v)}
  >
    <SelectTrigger className="w-[130px] p-0 border-0 bg-transparent">
      <Badge className={getStatusColor(lead.status)}>
        {lead.status}
      </Badge>
    </SelectTrigger>

    <SelectContent>
      {leadStatuses.map((s) => (
        <SelectItem key={s} value={s} className="capitalize">
          <Badge className={getStatusColor(s)}>{s}</Badge>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</TableCell>

                    <TableCell>
                      {lead.source === "marketplace" ? (
                        lead.notes?.includes("TEST DRIVE REQUESTED") ? (
                          <div>
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">Yes</Badge>
                            {(() => {
                              const dateMatch = lead.notes?.match(/TEST DRIVE REQUESTED: (\d{4}-\d{2}-\d{2})/);
                              return dateMatch ? (
                                <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(dateMatch[1]), "dd MMM")}</p>
                              ) : null;
                            })()}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No</span>
                        )
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{lead.follow_up_date ? format(new Date(lead.follow_up_date), "dd MMM") : "-"}</TableCell>
                    
                  </TableRow>
                ))}
                {filteredLeads.length === 0 && (
                  <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No leads found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Lead"
        description="Are you sure you want to delete this lead? This action cannot be undone."
      />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedLead ? "Edit Lead" : "Add New Lead"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input value={formData.customer_name || ""} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input value={formData.phone || ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={formData.city || ""} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Enter city" />
              </div>
              <div className="space-y-2">
                <Label>Lead Type</Label>
                <Select value={formData.lead_type || "buying"} onValueChange={(v) => setFormData({ ...formData, lead_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buying">Buying</SelectItem>
                    <SelectItem value="selling">Selling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vehicle Interest</Label>
                <Input value={formData.vehicle_interest || ""} onChange={(e) => setFormData({ ...formData, vehicle_interest: e.target.value })} placeholder="e.g., Maruti Swift, Honda City" />
              </div>
              <div className="space-y-2">
                <Label>Budget Min</Label>
                <Input
  inputMode="numeric"
  placeholder="e.g. 5,00,000"
  value={budgetMinInput}
  onChange={(e) => {
    const raw = e.target.value.replace(/[^0-9,]/g, "");
    const formatted = formatIndian(raw);

    setBudgetMinInput(formatted);
    setFormData({
      ...formData,
      budget_min: parseIndian(formatted),
    });
  }}
/>

              </div>
              <div className="space-y-2">
                <Label>Budget Max</Label>
                <Input
  inputMode="numeric"
  placeholder="e.g. 8,00,000"
  value={budgetMaxInput}
  onChange={(e) => {
    const raw = e.target.value.replace(/[^0-9,]/g, "");
    const formatted = formatIndian(raw);

    setBudgetMaxInput(formatted);
    setFormData({
      ...formData,
      budget_max: parseIndian(formatted),
    });
  }}
/>

              </div>
              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={formData.source} onValueChange={(v) => setFormData({ ...formData, source: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{leadSources.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{leadStatuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{leadPriorities.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Follow Up Date</Label>
                <Input type="date" value={formData.follow_up_date?.split("T")[0] || ""} onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={formData.notes || ""} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : (selectedLead ? "Update" : "Add")} Lead
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedLead && (
            <>
              <DialogHeader>
  <DialogTitle className="flex items-center justify-between">
  <span>Lead Details - {selectedLead.lead_number}</span>

  <div className="flex items-center gap-2">
    {/* DELETE */}
    <Button
      variant="ghost"
      size="icon"
      onClick={() => {
        setDetailDialogOpen(false);
        setTimeout(() => openDeleteDialog(selectedLead.id), 50);
      }}
    >
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>

    
  </div>
</DialogTitle>

</DialogHeader>

              
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5" /> Customer Info</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-3 sm:px-6">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Name</p>
                      <p className="font-medium">{selectedLead.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Phone</p>
                      <p className="font-medium flex items-center gap-1"><Phone className="h-3 w-3" /> {selectedLead.phone}</p>
                    </div>
                    {selectedLead.email && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">Email</p>
                        <p className="font-medium flex items-center gap-1 break-all"><Mail className="h-3 w-3 shrink-0" /> {selectedLead.email}</p>
                      </div>
                    )}
                    {selectedLead.city && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">City</p>
                        <p className="font-medium flex items-center gap-1"><MapPin className="h-3 w-3" /> {selectedLead.city}</p>
                      </div>
                    )}
                    <div>
  <p className="text-xs text-muted-foreground uppercase">Created At</p>
  <p className="font-medium">
    {formatIST(selectedLead.created_at)}
  </p>
</div>

<div>
  <p className="text-xs text-muted-foreground uppercase">Last Updated</p>
  <p className="font-medium">
    {formatIST(selectedLead.updated_at)}
  </p>
</div>

                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2"><Car className="h-5 w-5" /> Interest</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-3 sm:px-6">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Vehicle Interest</p>
                      <p className="font-medium">{selectedLead.vehicle_interest || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Budget Range</p>
                      <p className="font-medium">
                        {selectedLead.budget_min || selectedLead.budget_max 
                          ? `${formatCurrency(selectedLead.budget_min || 0)} - ${selectedLead.budget_max ? formatCurrency(selectedLead.budget_max) : "∞"}`
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Source</p>
                      <p className="font-medium capitalize">{selectedLead.source.replace("_", " ")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Priority</p>
                      <Badge className={getPriorityColor(selectedLead.priority)}>{selectedLead.priority}</Badge>
                    </div>
                  </CardContent>
                </Card>

                {selectedLead.notes && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6">
                      <p className="whitespace-pre-wrap text-sm">{selectedLead.notes}</p>
                    </CardContent>
                  </Card>
                )}
                
                {!selectedLead.converted_from_lead && (
  <Button
    disabled={isConverting}
    onClick={() => convertLead(selectedLead)}
    className={`flex-1 text-white transition-all duration-300
      ${isConverting
        ? "bg-emerald-400 cursor-not-allowed opacity-70"
        : "bg-emerald-600 hover:bg-emerald-700"
      }`}
  >
    {isConverting ? (
      <span className="flex items-center gap-2">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        Converting…
      </span>
    ) : (
      selectedLead.lead_type === "selling"
        ? "Convert to Vendor"
        : "Convert to Customer"
    )}
  </Button>
)}
{selectedLead.converted_from_lead && (
  <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-700">
    <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
    <span className="text-sm font-medium">
      Lead already converted
    </span>
  </div>
)}




                <div className="flex flex-col sm:flex-row gap-2">
                  <Button className="flex-1" onClick={() => { setDetailDialogOpen(false); openEditDialog(selectedLead); }}>
                    <Pencil className="h-4 w-4 mr-2" /> Edit Lead
                  </Button>
                  <Select value={selectedLead.status} onValueChange={(v) => handleStatusChange(selectedLead.id, v)}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Change Status" /></SelectTrigger>
                    <SelectContent>
                      {leadStatuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leads;
