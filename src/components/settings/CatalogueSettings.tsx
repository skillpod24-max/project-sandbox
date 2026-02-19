import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Store, Globe, Upload, Copy, ExternalLink, Eye, MessageCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CatalogueSettingsProps {
  settings: any;
  setSettings: (settings: any) => void;
  uploadingLogo: boolean;
  setUploadingLogo: (v: boolean) => void;
}

const CatalogueSettings = ({ settings, setSettings, uploadingLogo, setUploadingLogo }: CatalogueSettingsProps) => {
  const { toast } = useToast();

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

  const copyPublicLink = () => {
    if (settings.public_page_id) {
      const url = `${window.location.origin}/d/${settings.public_page_id}`;
      navigator.clipboard.writeText(url);
      toast({ title: "Link copied to clipboard" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Enable Catalogue Card */}
      <Card className="border-0 shadow-sm ring-1 ring-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Store className="h-5 w-5 text-blue-600" />
            Vehicle Catalogue
          </CardTitle>
          <CardDescription>Create a shareable catalogue with your vehicles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200/50 dark:border-blue-900/50">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Enable Catalogue</Label>
              <p className="text-sm text-muted-foreground">Share your vehicles with customers</p>
            </div>
            <Switch 
              checked={settings.public_page_enabled || false} 
              onCheckedChange={(v) => setSettings({ ...settings, public_page_enabled: v })} 
            />
          </div>

          {settings.public_page_enabled && settings.public_page_id && (
            <div className="flex flex-col sm:flex-row gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Globe className="h-5 w-5 text-emerald-600 shrink-0" />
                <code className="text-sm truncate font-mono">{window.location.origin}/d/{settings.public_page_id}</code>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copyPublicLink} className="gap-1.5">
                  <Copy className="h-4 w-4" /> Copy
                </Button>
                <a href={`/d/${settings.public_page_id}`} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <ExternalLink className="h-4 w-4" /> Preview
                  </Button>
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {settings.public_page_enabled && (
        <>
          {/* Catalogue Template Card */}
          <Card className="border-0 shadow-sm ring-1 ring-border/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Catalogue Design Template</CardTitle>
              <CardDescription>Choose a layout style for your catalogue page</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { id: "classic", name: "Classic", desc: "Clean grid layout with cards", preview: "🏛️" },
                  { id: "modern", name: "Modern", desc: "Full-width hero with floating cards", preview: "✨" },
                  { id: "minimal", name: "Minimal", desc: "List-style compact layout", preview: "📋" },
                  { id: "premium", name: "Premium", desc: "Dark theme with gradient accents", preview: "💎" },
                  { id: "showroom", name: "Showroom", desc: "Large images, carousel focus", preview: "🏪" },
                ].map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSettings({ ...settings, catalogue_template: template.id })}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      (settings.catalogue_template || "classic") === template.id
                        ? "border-foreground ring-2 ring-foreground/20 shadow-md bg-muted/50"
                        : "border-border hover:border-muted-foreground hover:bg-muted/30"
                    }`}
                  >
                    <span className="text-2xl mt-0.5">{template.preview}</span>
                    <div>
                      <p className="font-medium text-sm">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Branding Card */}
          <Card className="border-0 shadow-sm ring-1 ring-border/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Branding</CardTitle>
              <CardDescription>Customize your catalogue appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Shop Logo</Label>
                <div className="flex items-center gap-4">
                  {settings.shop_logo_url ? (
                    <img src={settings.shop_logo_url} alt="Shop logo" className="h-16 w-16 object-contain rounded-xl border" />
                  ) : (
                    <div className="h-16 w-16 bg-muted rounded-xl flex items-center justify-center">
                      <Store className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <Input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="catalogue-logo-upload" />
                    <label htmlFor="catalogue-logo-upload">
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
                  onChange={(e) => setSettings({ ...settings, dealer_tag: e.target.value })}
                  placeholder="Authorized Dealer / Trusted Seller"
                />
                <p className="text-xs text-muted-foreground">Badge displayed on your catalogue page</p>
              </div>

              <div className="space-y-2">
                <Label>Primary Accent Color</Label>
                <p className="text-xs text-muted-foreground mb-2">This color will be used as the accent for your catalogue page</p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { name: "Emerald", value: "emerald", preview: "#10b981" },
                    { name: "Blue", value: "blue", preview: "#3b82f6" },
                    { name: "Rose", value: "rose", preview: "#f43f5e" },
                    { name: "Amber", value: "amber", preview: "#f59e0b" },
                    { name: "Violet", value: "violet", preview: "#8b5cf6" },
                    { name: "Cyan", value: "cyan", preview: "#06b6d4" },
                    { name: "Indigo", value: "indigo", preview: "#6366f1" },
                    { name: "Orange", value: "orange", preview: "#f97316" },
                  ].map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setSettings({ ...settings, public_page_theme: color.value })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                        (settings.public_page_theme || "emerald") === color.value
                          ? "border-foreground ring-2 ring-foreground/20 shadow-md"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <div className="h-5 w-5 rounded-full" style={{ backgroundColor: color.preview }} />
                      <span className="text-sm font-medium">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact & Social Card */}
          <Card className="border-0 shadow-sm ring-1 ring-border/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Contact Info</CardTitle>
              <CardDescription>How customers can reach you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>WhatsApp Number</Label>
                <Input 
                  value={settings.whatsapp_number || ""} 
                  onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })} 
                  placeholder="+91 9876543210"
                />
                <p className="text-xs text-muted-foreground">Include country code</p>
              </div>

              <div className="space-y-2">
                <Label>Google Maps Link</Label>
                <Input 
                  value={settings.gmap_link || ""} 
                  onChange={(e) => setSettings({ ...settings, gmap_link: e.target.value })} 
                  placeholder="https://maps.google.com/..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Display Options Card */}
          <Card className="border-0 shadow-sm ring-1 ring-border/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Display Options</CardTitle>
              <CardDescription>Control what's shown on your catalogue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                    <Label className="text-sm">Show Testimonials</Label>
                  </div>
                  <Switch 
                    checked={settings.show_testimonials ?? true} 
                    onCheckedChange={(v) => setSettings({ ...settings, show_testimonials: v })} 
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-blue-500" />
                    <Label className="text-sm">Show Ratings</Label>
                  </div>
                  <Switch 
                    checked={settings.show_ratings ?? true} 
                    onCheckedChange={(v) => setSettings({ ...settings, show_ratings: v })} 
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-blue-500" />
                    <Label className="text-sm">Show Vehicles Sold</Label>
                  </div>
                  <Switch 
                    checked={settings.show_vehicles_sold ?? true} 
                    onCheckedChange={(v) => setSettings({ ...settings, show_vehicles_sold: v })} 
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-blue-500" />
                    <Label className="text-sm">Auto Lead Popup</Label>
                  </div>
                  <Switch 
                    checked={settings.enable_auto_lead_popup ?? false} 
                    onCheckedChange={(v) => setSettings({ ...settings, enable_auto_lead_popup: v })} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default CatalogueSettings;
