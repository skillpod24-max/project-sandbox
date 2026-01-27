import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Palette, Building, FileText, Globe, Check, Bell, Smartphone, Store, Copy, ExternalLink, Upload, Star, Plus, Pencil, Trash2, Award } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import type { Database } from "@/integrations/supabase/types";
import CarLoader from "@/components/CarLoader";

type Settings = Database["public"]["Tables"]["settings"]["Row"];
type Testimonial = Database["public"]["Tables"]["dealer_testimonials"]["Row"];

const themeColors = [
  { name: "Default Dark", sidebar: "0 0% 8%", primary: "0 0% 12%", accent: "217 91% 60%", preview: { bg: "#141414", accent: "#3b82f6" } },
  { name: "Ocean Blue", sidebar: "210 50% 15%", primary: "210 100% 40%", accent: "199 89% 48%", preview: { bg: "#1a3347", accent: "#0ea5e9" } },
  { name: "Forest Green", sidebar: "150 30% 12%", primary: "142 71% 35%", accent: "142 71% 45%", preview: { bg: "#1a2e24", accent: "#22c55e" } },
  { name: "Royal Purple", sidebar: "270 30% 15%", primary: "262 83% 48%", accent: "262 83% 58%", preview: { bg: "#2d1f47", accent: "#a855f7" } },
  { name: "Sunset Orange", sidebar: "20 30% 12%", primary: "25 95% 45%", accent: "38 92% 50%", preview: { bg: "#2e211a", accent: "#f59e0b" } },
  { name: "Rose Pink", sidebar: "340 30% 15%", primary: "339 90% 41%", accent: "339 90% 51%", preview: { bg: "#3d1f2d", accent: "#ec4899" } },
  { name: "Midnight Blue", sidebar: "240 20% 8%", primary: "240 30% 20%", accent: "221 83% 53%", preview: { bg: "#151524", accent: "#3b82f6" } },
  { name: "Warm Gray", sidebar: "30 10% 12%", primary: "30 10% 25%", accent: "38 92% 50%", preview: { bg: "#222019", accent: "#f59e0b" } },
  { name: "Teal Modern", sidebar: "173 50% 12%", primary: "173 80% 35%", accent: "173 80% 40%", preview: { bg: "#102726", accent: "#14b8a6" } },
  { name: "Cherry Red", sidebar: "0 30% 12%", primary: "0 72% 45%", accent: "0 72% 51%", preview: { bg: "#2e1a1a", accent: "#ef4444" } },
  { name: "Indigo Night", sidebar: "245 30% 12%", primary: "245 58% 48%", accent: "245 58% 58%", preview: { bg: "#1f1d33", accent: "#6366f1" } },
  { name: "Emerald", sidebar: "160 30% 10%", primary: "160 84% 35%", accent: "160 84% 39%", preview: { bg: "#132620", accent: "#10b981" } },
];




const Settings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Partial<Settings & {
    public_page_enabled?: boolean;
    shop_logo_url?: string;
    shop_tagline?: string;
    gmap_link?: string;
    whatsapp_number?: string;
    public_page_id?: string;
    show_testimonials?: boolean;
    show_ratings?: boolean;
    show_vehicles_sold?: boolean;
    dealer_tag?: string;

  }>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // Testimonials management
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [testimonialDialogOpen, setTestimonialDialogOpen] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [testimonialForm, setTestimonialForm] = useState({ customer_name: "", rating: 5, review: "" });
  const [deleteTestimonialDialogOpen, setDeleteTestimonialDialogOpen] = useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  
  const [notifications, setNotifications] = useState({
    emailOverdueEMI: true,
    emailLowStock: true,
    emailDocExpiry: true,
    mobileEnabled: false,
    mobileOverdueEMI: false,
    mobileLowStock: false,
    mobileDocExpiry: false,
  });
  
  const [dealerAddress, setDealerAddress] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
  });

  useEffect(() => {
    fetchSettings();
    fetchTestimonials();
    const savedTheme = localStorage.getItem('theme-index');
    if (savedTheme) setSelectedTheme(parseInt(savedTheme));
    setDarkMode(document.documentElement.classList.contains('dark'));
    
    const savedNotifications = localStorage.getItem('dealer_notifications');
    if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
    
    const savedAddress = localStorage.getItem('dealer_address');
    if (savedAddress) setDealerAddress(JSON.parse(savedAddress));
  }, []);

  const fetchSettings = async () => {
    // Get current user for explicit filtering
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase.from("settings").select("*").eq("user_id", user.id).maybeSingle();
    setSettings(data || {});
    setLoading(false);
  };

  const resetAllChanges = async () => {
  setLoading(true);

  // 1. Reset DB-backed settings
  await fetchSettings();

  // 2. Reset notifications
  const savedNotifications = localStorage.getItem("dealer_notifications");
  setNotifications(
    savedNotifications
      ? JSON.parse(savedNotifications)
      : {
          emailOverdueEMI: true,
          emailLowStock: true,
          emailDocExpiry: true,
          mobileEnabled: false,
          mobileOverdueEMI: false,
          mobileLowStock: false,
          mobileDocExpiry: false,
        }
  );

  // 3. Reset dealer address
  const savedAddress = localStorage.getItem("dealer_address");
  setDealerAddress(
    savedAddress
      ? JSON.parse(savedAddress)
      : { street: "", city: "", state: "", postalCode: "" }
  );

  // 4. Reset theme
  const savedTheme = localStorage.getItem("theme-index");
  setSelectedTheme(savedTheme ? parseInt(savedTheme) : 0);

  // 5. Reset dark mode
  const dark = localStorage.getItem("dark-mode") === "true";
  setDarkMode(dark);

  toast({
    title: "Changes reset",
    description: "All unsaved changes have been reverted",
  });

  setLoading(false);
};


  const fetchTestimonials = async () => {
    // Get current user for explicit filtering
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.from("dealer_testimonials").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setTestimonials(data || []);
  };

  //const generatePublicPageId = () => `d${Date.now().toString(36)}${Math.random().toString(36).substr(2, 4)}`;

  

  const handleSave = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  setSaving(true); // ✅ START LOCK

  try {
    const settingsData = { ...settings };

    const formattedAddress = [
      dealerAddress.street,
      dealerAddress.city,
      dealerAddress.state,
      dealerAddress.postalCode,
    ].filter(Boolean).join(', ');

    settingsData.dealer_address = formattedAddress;

    if (settings.public_page_enabled) {
      if (!settings.dealer_name) {
        toast({
          title: "Dealer name required",
          description: "Please enter dealer name to generate public URL",
          variant: "destructive",
        });
        return;
      }

      const baseSlug = slugify(settings.dealer_name);

      if (!settings.public_page_id) {
        const uniqueSlug = await generateUniqueSlug(baseSlug);
        settingsData.public_page_id = uniqueSlug;
      }
    }

    if (settings.id) {
      await supabase
        .from("settings")
        .update(settingsData as any)
        .eq("id", settings.id);
    } else {
      await supabase.from("settings").insert([
        { ...settingsData, user_id: user.id } as any,
      ]);
    }

    localStorage.setItem("dealer_notifications", JSON.stringify(notifications));
    localStorage.setItem("dealer_address", JSON.stringify(dealerAddress));

    toast({ title: "Settings saved successfully" });
    fetchSettings();

  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
  } finally {
    setSaving(false); // ✅ ALWAYS UNLOCK
  }
};



  const handleTestimonialSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      if (selectedTestimonial) {
        await supabase.from("dealer_testimonials").update({
          customer_name: testimonialForm.customer_name,
          rating: testimonialForm.rating,
          review: testimonialForm.review || null,
        }).eq("id", selectedTestimonial.id);
        toast({ title: "Testimonial updated" });
      } else {
        await supabase.from("dealer_testimonials").insert({
          user_id: user.id,
          customer_name: testimonialForm.customer_name,
          rating: testimonialForm.rating,
          review: testimonialForm.review || null,
          is_verified: true,
        });
        toast({ title: "Testimonial added" });
      }
      setTestimonialDialogOpen(false);
      setSelectedTestimonial(null);
      setTestimonialForm({ customer_name: "", rating: 5, review: "" });
      fetchTestimonials();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteTestimonial = async () => {
    if (!testimonialToDelete) return;
    try {
      await supabase.from("dealer_testimonials").delete().eq("id", testimonialToDelete);
      toast({ title: "Testimonial deleted" });
      fetchTestimonials();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setDeleteTestimonialDialogOpen(false);
      setTestimonialToDelete(null);
    }
  };

  const openEditTestimonial = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setTestimonialForm({
      customer_name: testimonial.customer_name,
      rating: testimonial.rating,
      review: testimonial.review || "",
    });
    setTestimonialDialogOpen(true);
  };
  
  const handleNotificationChange = (key: string, value: boolean) => {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);
    localStorage.setItem('dealer_notifications', JSON.stringify(updated));
  };
  
  const requestMobilePermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        handleNotificationChange('mobileEnabled', true);
        toast({ title: "Mobile notifications enabled" });
      } else {
        toast({ title: "Permission denied", description: "Please enable notifications in browser settings", variant: "destructive" });
      }
    } else {
      toast({ title: "Not supported", description: "Your browser doesn't support notifications", variant: "destructive" });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("vehicle-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("vehicle-images")
        .getPublicUrl(fileName);

      setSettings({ ...settings, shop_logo_url: publicUrl });
      toast({ title: "Logo uploaded successfully" });
    } catch (error: any) {
      toast({ title: "Error uploading logo", description: error.message, variant: "destructive" });
    } finally {
      setUploadingLogo(false);
    }
  };

  const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const generateUniqueSlug = async (baseSlug: string) => {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const { data } = await supabase
      .from("settings")
      .select("id")
      .eq("public_page_id", slug)
      .maybeSingle();

    if (!data) break; // slug is free

    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
};



  const applyTheme = (index: number) => {
    const theme = themeColors[index];
    document.documentElement.style.setProperty('--sidebar-background', theme.sidebar);
    document.documentElement.style.setProperty('--primary', theme.primary);
    document.documentElement.style.setProperty('--chart-1', theme.accent);
    localStorage.setItem('theme-index', index.toString());
    setSelectedTheme(index);
    toast({ title: `Theme "${theme.name}" applied` });
  };

  const toggleDarkMode = (enabled: boolean) => {
    if (enabled) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('dark-mode', enabled.toString());
    setDarkMode(enabled);
  };

  const copyPublicLink = () => {
    if (settings.public_page_id) {
      const url = `${window.location.origin}/d/${settings.public_page_id}`;
      navigator.clipboard.writeText(url);
      toast({ title: "Link copied to clipboard" });
    }
  };

  if (loading) {
  return <CarLoader />;
}

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your dealership and preferences</p>
      </div>

      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList
  className="
    flex gap-2 overflow-x-auto 
    sm:grid sm:grid-cols-7 
    w-full max-w-4xl
    scrollbar-hide
  "
>
          <TabsTrigger
  value="appearance"
  className="gap-2 min-w-[48px] sm:min-w-0 px-3"
><Palette className="h-4 w-4" /> <span className="hidden sm:inline">Theme</span></TabsTrigger>
          <TabsTrigger
  value="dealer"
  className="gap-2 min-w-[48px] sm:min-w-0 px-3"
><Building className="h-4 w-4" /> <span className="hidden sm:inline">Dealer</span></TabsTrigger>
          <TabsTrigger
  value="invoice"
  className="gap-2 min-w-[48px] sm:min-w-0 px-3"
><FileText className="h-4 w-4" /> <span className="hidden sm:inline">Invoice</span></TabsTrigger>
          <TabsTrigger
  value="notifications"
  className="gap-2 min-w-[48px] sm:min-w-0 px-3"
><Bell className="h-4 w-4" /> <span className="hidden sm:inline">Alerts</span></TabsTrigger>
          <TabsTrigger
  value="publicpage"
  className="gap-2 min-w-[48px] sm:min-w-0 px-3"
><Store className="h-4 w-4" /> <span className="hidden sm:inline">Public</span></TabsTrigger>
          <TabsTrigger
  value="testimonials"
  className="gap-2 min-w-[48px] sm:min-w-0 px-3"
><Award className="h-4 w-4" /> <span className="hidden sm:inline">Reviews</span></TabsTrigger>
          <TabsTrigger
  value="regional"
  className="gap-2 min-w-[48px] sm:min-w-0 px-3"
><Globe className="h-4 w-4" /> <span className="hidden sm:inline">Regional</span></TabsTrigger>
        </TabsList>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="border border-border">
            <CardHeader>
              <CardTitle>Dark Mode</CardTitle>
              <CardDescription>Toggle between light and dark themes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Switch to a darker color scheme</p>
                </div>
                <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardHeader>
              <CardTitle>Theme Colors</CardTitle>
              <CardDescription>Choose a color theme for your application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {themeColors.map((theme, index) => (
                  <button
                    key={index}
                    onClick={() => applyTheme(index)}
                    className={`relative p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                      selectedTheme === index 
                        ? 'border-primary ring-2 ring-primary/20 shadow-lg' 
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    {selectedTheme === index && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center rounded-full">
                          <Check className="h-3 w-3" />
                        </Badge>
                      </div>
                    )}
                    <div className="space-y-2">
                      <div 
                        className="h-12 w-full rounded-lg flex items-end justify-center pb-2"
                        style={{ backgroundColor: theme.preview.bg }}
                      >
                        <div 
                          className="h-2 w-3/4 rounded-full"
                          style={{ backgroundColor: theme.preview.accent }}
                        />
                      </div>
                      <p className="text-xs font-medium text-center">{theme.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dealer Tab */}
        <TabsContent value="dealer" className="space-y-6">
          <Card className="border border-border">
            <CardHeader>
              <CardTitle>Dealer Information</CardTitle>
              <CardDescription>Your dealership details for invoices and documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dealer Name</Label>
                  <Input value={settings.dealer_name || ""} onChange={(e) => setSettings({ ...settings, dealer_name: e.target.value })} placeholder="Enter dealership name" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={settings.dealer_phone || ""} onChange={(e) => setSettings({ ...settings, dealer_phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={settings.dealer_email || ""} onChange={(e) => setSettings({ ...settings, dealer_email: e.target.value })} placeholder="dealer@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>GST Number</Label>
                  <Input value={settings.dealer_gst || ""} onChange={(e) => setSettings({ ...settings, dealer_gst: e.target.value })} placeholder="GSTIN" />
                </div>
              </div>
              
              <Separator className="my-4" />
              <p className="text-sm font-medium text-muted-foreground mb-2">Address Details</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Street Address</Label>
                  <Input value={dealerAddress.street} onChange={(e) => setDealerAddress({ ...dealerAddress, street: e.target.value })} placeholder="Street address, building name" />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={dealerAddress.city} onChange={(e) => setDealerAddress({ ...dealerAddress, city: e.target.value })} placeholder="City" />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input value={dealerAddress.state} onChange={(e) => setDealerAddress({ ...dealerAddress, state: e.target.value })} placeholder="State" />
                </div>
                <div className="space-y-2">
                  <Label>Postal Code</Label>
                  <Input value={dealerAddress.postalCode} onChange={(e) => setDealerAddress({ ...dealerAddress, postalCode: e.target.value })} placeholder="PIN Code" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoice Tab */}
        <TabsContent value="invoice" className="space-y-6">
          <Card className="border border-border">
            <CardHeader>
              <CardTitle>Invoice Settings</CardTitle>
              <CardDescription>Configure invoice numbering and tax settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Sale Prefix</Label>
                  <Input value={settings.sale_prefix || ""} onChange={(e) => setSettings({ ...settings, sale_prefix: e.target.value })} placeholder="SL" />
                  <p className="text-xs text-muted-foreground">e.g., SL-0001</p>
                </div>
                <div className="space-y-2">
                  <Label>Purchase Prefix</Label>
                  <Input value={settings.purchase_prefix || ""} onChange={(e) => setSettings({ ...settings, purchase_prefix: e.target.value })} placeholder="PUR" />
                  <p className="text-xs text-muted-foreground">e.g., PUR-0001</p>
                </div>
                <div className="space-y-2">
                  <Label>Invoice Prefix</Label>
                  <Input value={settings.invoice_prefix || ""} onChange={(e) => setSettings({ ...settings, invoice_prefix: e.target.value })} placeholder="INV" />
                  <p className="text-xs text-muted-foreground">e.g., INV-0001</p>
                </div>
                
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Email Notifications</CardTitle>
              <CardDescription>Configure email alerts for important events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Overdue EMI Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified when EMIs are overdue</p>
                </div>
                <Switch checked={notifications.emailOverdueEMI} onCheckedChange={(v) => handleNotificationChange('emailOverdueEMI', v)} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Low Stock Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified when inventory is low</p>
                </div>
                <Switch checked={notifications.emailLowStock} onCheckedChange={(v) => handleNotificationChange('emailLowStock', v)} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Document Expiry Reminders</Label>
                  <p className="text-sm text-muted-foreground">Get notified before documents expire</p>
                </div>
                <Switch checked={notifications.emailDocExpiry} onCheckedChange={(v) => handleNotificationChange('emailDocExpiry', v)} />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5" /> Mobile Notifications</CardTitle>
              <CardDescription>Enable push notifications on this device</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!notifications.mobileEnabled ? (
                <Button onClick={requestMobilePermission} variant="outline" className="gap-2">
                  <Bell className="h-4 w-4" /> Enable Mobile Notifications
                </Button>
              ) : (
                <>
                  <Badge variant="secondary" className="gap-1"><Check className="h-3 w-3" /> Notifications Enabled</Badge>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label>Overdue EMI Alerts</Label>
                    <Switch checked={notifications.mobileOverdueEMI} onCheckedChange={(v) => handleNotificationChange('mobileOverdueEMI', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Low Stock Alerts</Label>
                    <Switch checked={notifications.mobileLowStock} onCheckedChange={(v) => handleNotificationChange('mobileLowStock', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Document Expiry</Label>
                    <Switch checked={notifications.mobileDocExpiry} onCheckedChange={(v) => handleNotificationChange('mobileDocExpiry', v)} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Public Page Tab */}
        <TabsContent value="publicpage" className="space-y-6">
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Store className="h-5 w-5" /> Public Dealer Page</CardTitle>
              <CardDescription>Create a shareable page for your dealership</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-0.5">
                  <Label>Enable Public Page</Label>
                  <p className="text-sm text-muted-foreground">Create a shareable page with your vehicles and contact info</p>
                </div>
                <Switch 
                  checked={settings.public_page_enabled || false} 
                  onCheckedChange={(v) => setSettings({ ...settings, public_page_enabled: v })} 
                />
              </div>

              <p className="text-xs text-muted-foreground">
  Your public page URL is generated from your dealer name.
  If the name already exists, a number is added automatically.
</p>


              {settings.public_page_enabled && (
                <>
                  {settings.public_page_id && (
                    <div className="flex flex-col sm:flex-row gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Globe className="h-5 w-5 text-green-600 shrink-0" />
                        <code className="text-sm truncate">{window.location.origin}/d/{settings.public_page_id}</code>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={copyPublicLink} className="gap-1">
                          <Copy className="h-4 w-4" /> Copy
                        </Button>
                        <a href={`/d/${settings.public_page_id}`} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="gap-1">
                            <ExternalLink className="h-4 w-4" /> Preview
                          </Button>
                        </a>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <Label>Shop Logo</Label>
                    <div className="flex items-center gap-4">
                      {settings.shop_logo_url ? (
                        <img src={settings.shop_logo_url} alt="Shop logo" className="h-16 w-16 object-contain rounded-lg border" />
                      ) : (
                        <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center">
                          <Store className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <Input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-upload" />
                        <label htmlFor="logo-upload">
                          <Button variant="outline" size="sm" className="gap-2 cursor-pointer" asChild disabled={uploadingLogo}>
                            <span><Upload className="h-4 w-4" /> {uploadingLogo ? "Uploading..." : "Upload Logo"}</span>
                          </Button>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Shop Tagline</Label>
                    <Input 
                      value={settings.shop_tagline || ""} 
                      onChange={(e) => setSettings({ ...settings, shop_tagline: e.target.value })} 
                      placeholder="Your trusted partner for quality vehicles"
                    />
                  </div>

                  <div className="space-y-2">
  <Label>Dealer Trust Tag</Label>
  <Input
    value={settings.dealer_tag || ""}
    onChange={(e) =>
      setSettings({ ...settings, dealer_tag: e.target.value })
    }
    placeholder="Authorized Dealer / Trusted Seller / Premium Partner"
  />
  <p className="text-xs text-muted-foreground">
    This badge will appear on your public page next to Verified
  </p>
</div>


                  <div className="space-y-2">
                    <Label>WhatsApp Number</Label>
                    <Input 
                      value={settings.whatsapp_number || ""} 
                      onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })} 
                      placeholder="+91 9876543210"
                    />
                    <p className="text-xs text-muted-foreground">Include country code for WhatsApp button</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Google Maps Link</Label>
                    <Input 
                      value={settings.gmap_link || ""} 
                      onChange={(e) => setSettings({ ...settings, gmap_link: e.target.value })} 
                      placeholder="https://maps.google.com/..."
                    />
                  </div>

                  


                  <Separator />
                  <p className="text-sm font-medium">Display Options</p>

                  <Separator />

<p className="text-sm font-medium">Insights Visibility</p>

<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  {/* Dealer Page */}
  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
    <Label className="text-sm">Show Dealer Page Views</Label>
    <Switch
      checked={Boolean(settings.show_dealer_page_views)}
      onCheckedChange={(v) =>
        setSettings({ ...settings, show_dealer_page_views: v })
      }
    />
  </div>

  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
    <Label className="text-sm">Show Dealer Page Enquiries</Label>
<Switch
  checked={Boolean(settings.show_dealer_page_inquiries)}
  onCheckedChange={(v) =>
    setSettings({ ...settings, show_dealer_page_inquiries: v })
  }
/>

  </div>

  {/* Vehicle Page */}
  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
    <Label className="text-sm">Show Vehicle Page Enquiries</Label>
<Switch
  checked={Boolean(settings.show_vehicle_page_enquiries)}
  onCheckedChange={(v) =>
    setSettings({ ...settings, show_vehicle_page_enquiries: v })
  }
/>


  </div>

<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
  <Label className="text-sm">Show Vehicle Page Views</Label>
  <Switch
    checked={Boolean(settings.show_vehicle_page_views)}
    onCheckedChange={(v) =>
      setSettings({ ...settings, show_vehicle_page_views: v })
    }
  />
</div>

  
</div>


                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <Label className="text-sm">Show Vehicles Sold</Label>
                      <Switch 
                        checked={settings.show_vehicles_sold !== false} 
                        onCheckedChange={(v) => setSettings({ ...settings, show_vehicles_sold: v })} 
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <Label className="text-sm">Show Testimonials</Label>
                      <Switch 
                        checked={settings.show_testimonials !== false} 
                        onCheckedChange={(v) => setSettings({ ...settings, show_testimonials: v })} 
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <Label className="text-sm">Show Ratings</Label>
                      <Switch 
                        checked={settings.show_ratings !== false} 
                        onCheckedChange={(v) => setSettings({ ...settings, show_ratings: v })} 
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <Separator />
<p className="text-sm font-medium">Lead Capture</p>

<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
  <Label>Auto Enquiry Popup</Label>
  <Switch
    checked={Boolean(settings.enable_auto_lead_popup)}
    onCheckedChange={(v) =>
      setSettings({ ...settings, enable_auto_lead_popup: v })
    }
  />
</div>


        {/* Testimonials Tab */}
        <TabsContent value="testimonials" className="space-y-6">
          <Card className="border border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" /> Customer Reviews</CardTitle>
                <CardDescription>Manage testimonials displayed on your public page</CardDescription>
              </div>
              <Button onClick={() => { setSelectedTestimonial(null); setTestimonialForm({ customer_name: "", rating: 5, review: "" }); setTestimonialDialogOpen(true); }} className="gap-2">
                <Plus className="h-4 w-4" /> Add Review
              </Button>
            </CardHeader>
            <CardContent>
              {testimonials.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No testimonials yet. Add your first customer review.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Review</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testimonials.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.customer_name}</TableCell>
                        <TableCell>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className={`h-4 w-4 ${star <= t.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{t.review || "-"}</TableCell>
                        <TableCell><Badge variant={t.is_verified ? "default" : "secondary"}>{t.is_verified ? "Yes" : "No"}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditTestimonial(t)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => { setTestimonialToDelete(t.id); setDeleteTestimonialDialogOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Regional Tab */}
        <TabsContent value="regional" className="space-y-6">
          <Card className="border border-border">
            <CardHeader>
              <CardTitle>Regional Settings</CardTitle>
              <CardDescription>Currency and regional preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Input value={settings.currency || "INR"} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} placeholder="INR" />
                  <p className="text-xs text-muted-foreground">Currency code (INR, USD, EUR, etc.)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-4 pt-4">
        <Button
  onClick={handleSave}
  size="lg"
  disabled={saving}
  className="gap-2"
>
  {saving && (
    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
  )}
  {saving ? "Saving..." : "Save Settings"}
</Button>

        <Button variant="outline" size="lg" onClick={resetAllChanges}>
  Reset Changes
</Button>

      </div>

      {/* Testimonial Dialog */}
      <Dialog open={testimonialDialogOpen} onOpenChange={setTestimonialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTestimonial ? "Edit Review" : "Add New Review"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Customer Name *</Label>
              <Input 
                value={testimonialForm.customer_name} 
                onChange={(e) => setTestimonialForm({ ...testimonialForm, customer_name: e.target.value })}
                placeholder="Enter customer name"
              />
            </div>
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setTestimonialForm({ ...testimonialForm, rating: star })}
                    className="p-1"
                  >
                    <Star className={`h-8 w-8 transition-colors ${star <= testimonialForm.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground hover:text-yellow-400"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Review</Label>
              <Textarea 
                value={testimonialForm.review} 
                onChange={(e) => setTestimonialForm({ ...testimonialForm, review: e.target.value })}
                placeholder="Enter customer's review..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestimonialDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleTestimonialSubmit} disabled={!testimonialForm.customer_name}>
              {selectedTestimonial ? "Update" : "Add"} Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Testimonial Confirmation */}
      <DeleteConfirmDialog
        open={deleteTestimonialDialogOpen}
        onOpenChange={setDeleteTestimonialDialogOpen}
        onConfirm={handleDeleteTestimonial}
        title="Delete Review"
        description="Are you sure you want to delete this customer review?"
      />
    </div>
  );
};

export default Settings;
