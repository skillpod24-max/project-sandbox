import { useState, useEffect, memo } from "react";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const MarketplacePopup = memo(() => {
  const [showPopup, setShowPopup] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [popupImage, setPopupImage] = useState("");
  const [popupLink, setPopupLink] = useState("");

  useEffect(() => {
    const wasShown = sessionStorage.getItem("marketing_popup_shown");
    if (wasShown) return;

    // Fetch popup settings
    const fetchPopupSettings = async () => {
      const { data } = await supabase
        .from("marketplace_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["popup_enabled", "popup_image_url", "popup_link_url"]);

      const settings: Record<string, string> = {};
      (data || []).forEach((s: any) => { settings[s.setting_key] = s.setting_value || ""; });

      if (settings.popup_enabled !== "true" || !settings.popup_image_url) return;

      setPopupImage(settings.popup_image_url);
      setPopupLink(settings.popup_link_url || "/marketplace/vehicles");

      // Show after 3 seconds
      setTimeout(() => setShowPopup(true), 3000);
    };

    fetchPopupSettings();
  }, []);

  const handleDismiss = () => {
    setShowPopup(false);
    setDismissed(true);
    sessionStorage.setItem("marketing_popup_shown", "true");
  };

  if (!showPopup || dismissed || !popupImage) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[100] animate-fade-in"
        onClick={handleDismiss}
      />
      
      {/* Popup - Image Only */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 animate-fade-in">
        <div className="relative max-w-md w-full">
          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute -top-3 -right-3 z-10 h-8 w-8 rounded-full bg-background shadow-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Image with link */}
          <Link to={popupLink} onClick={handleDismiss} className="block">
            <img 
              src={popupImage} 
              alt="Special Offer" 
              className="w-full rounded-2xl shadow-2xl object-cover max-h-[70vh]"
            />
          </Link>

          {/* Two option buttons below image */}
          <div className="flex gap-3 mt-3">
            <Link 
              to={popupLink} 
              onClick={handleDismiss}
              className="flex-1 bg-primary text-primary-foreground text-center py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-lg"
            >
              Explore Now
            </Link>
            <button 
              onClick={handleDismiss}
              className="flex-1 bg-muted text-muted-foreground text-center py-3 rounded-xl font-medium text-sm hover:bg-muted/80 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </>
  );
});

MarketplacePopup.displayName = "MarketplacePopup";

export default MarketplacePopup;
