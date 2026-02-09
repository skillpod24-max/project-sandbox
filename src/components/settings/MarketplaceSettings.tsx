import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Globe, Building, Star, Clock, RefreshCw, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MarketplaceSettingsProps {
  settings: any;
  setSettings: (settings: any) => void;
  catalogueSettings: any;
}

const MarketplaceSettings = ({ settings, setSettings, catalogueSettings }: MarketplaceSettingsProps) => {
  const { toast } = useToast();
  const [syncEnabled, setSyncEnabled] = useState(false);

  const handleSyncFromCatalogue = () => {
    if (!catalogueSettings.public_page_enabled) {
      toast({
        title: "Catalogue not enabled",
        description: "Enable catalogue first to sync settings",
        variant: "destructive"
      });
      return;
    }

    setSettings({
      ...settings,
      marketplace_description: catalogueSettings.shop_tagline || settings.marketplace_description,
      marketplace_working_hours: settings.marketplace_working_hours,
    });
    
    toast({ title: "Settings synced from Catalogue" });
  };

  return (
    <div className="space-y-6">
      {/* Marketplace Toggle Card */}
      <Card className="border-0 shadow-sm ring-1 ring-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-blue-600" />
            VahanHub Marketplace
          </CardTitle>
          <CardDescription>List your dealership on the public marketplace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 rounded-xl border border-violet-200/50 dark:border-violet-900/50">
            <div className="space-y-0.5">
              <Label className="text-base font-medium flex items-center gap-2">
                <Building className="h-4 w-4 text-violet-600" />
                Enable Marketplace Listing
              </Label>
              <p className="text-sm text-muted-foreground">Show your dealership on VahanHub marketplace</p>
            </div>
            <Switch 
              checked={settings.marketplace_enabled || false} 
              onCheckedChange={(v) => setSettings({ ...settings, marketplace_enabled: v })} 
              disabled={!catalogueSettings?.public_page_enabled}
            />
          </div>

          {!catalogueSettings?.public_page_enabled && (
            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
              ⚠️ Enable Catalogue first to access marketplace settings
            </p>
          )}
        </CardContent>
      </Card>

      {/* Sync Option */}
      <Card className="border-0 shadow-sm ring-1 ring-border/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/10 dark:to-indigo-950/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Link2 className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Sync with Catalogue</p>
                <p className="text-xs text-muted-foreground">Copy settings from your catalogue</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSyncFromCatalogue}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Sync Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {settings.marketplace_enabled && (
        <>
          {/* Marketplace Details Card */}
          <Card className="border-0 shadow-sm ring-1 ring-border/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Marketplace Profile</CardTitle>
              <CardDescription>Details shown on the marketplace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Marketplace Description</Label>
                <Textarea
                  value={settings.marketplace_description || ""}
                  onChange={(e) => setSettings({ ...settings, marketplace_description: e.target.value })}
                  placeholder="Tell buyers why they should choose your dealership..."
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">Shown on your marketplace dealer page</p>
              </div>

              <div className="space-y-2">
                <Label>Marketplace Badge</Label>
                <Input
                  value={settings.marketplace_badge || ""}
                  onChange={(e) => setSettings({ ...settings, marketplace_badge: e.target.value })}
                  placeholder="e.g., Top Rated, Fast Response, EMI Available"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Top Rated", "EMI Available", "Fast Response", "Verified", "Premium"].map((badge) => (
                    <Badge 
                      key={badge}
                      variant="outline" 
                      className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                      onClick={() => setSettings({ ...settings, marketplace_badge: badge })}
                    >
                      {badge}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Working Hours
                </Label>
                <Input
                  value={settings.marketplace_working_hours || ""}
                  onChange={(e) => setSettings({ ...settings, marketplace_working_hours: e.target.value })}
                  placeholder="e.g., Mon-Sat 9AM-8PM"
                />
              </div>
            </CardContent>
          </Card>

          {/* Premium Features Info */}
          <Card className="border-0 shadow-sm ring-1 ring-amber-200/50 dark:ring-amber-900/50 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/10 dark:to-orange-950/10">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                Premium Features
              </CardTitle>
              <CardDescription>Boost your marketplace visibility</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Featured dealer status and premium placements are managed by marketplace admins. 
                Contact support to request featured status for your dealership.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default MarketplaceSettings;
