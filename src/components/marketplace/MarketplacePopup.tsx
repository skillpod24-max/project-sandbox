import { useState, useEffect, memo } from "react";
import { X, Phone, MessageCircle, Gift, Sparkles, Clock, ArrowRight, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const MarketplacePopup = memo(() => {
  const [showPopup, setShowPopup] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if popup was dismissed in this session
    const wasShown = sessionStorage.getItem("marketing_popup_shown");
    if (wasShown) return;

    // Show popup after 5 seconds
    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setShowPopup(false);
    setDismissed(true);
    sessionStorage.setItem("marketing_popup_shown", "true");
  };

  if (!showPopup || dismissed) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 z-[100] animate-fade-in"
        onClick={handleDismiss}
      />
      
      {/* Popup */}
      <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 z-[101] animate-slide-up">
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>

          {/* Content */}
          <div className="p-6 text-white">
            {/* Animated Badge */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1.5 bg-amber-400/20 px-3 py-1.5 rounded-full animate-pulse">
                <Gift className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-semibold text-amber-400">Limited Offer</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-white/70">
                <Clock className="h-3 w-3" />
                <span>Ends Soon</span>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold mb-2">
              Get ₹10,000 OFF on Your Dream Car! 🚗
            </h3>
            
            <p className="text-white/80 text-sm mb-4">
              Book a test drive today and unlock exclusive discounts from our verified dealers.
            </p>

            {/* Features */}
            <div className="space-y-2 mb-5">
              {[
                "Free doorstep test drive",
                "Complete vehicle inspection report",
                "Best-in-class prices guaranteed"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-white/90">
                  <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3">
              <Button 
                className="flex-1 bg-white text-blue-700 hover:bg-blue-50 font-semibold gap-2"
                onClick={handleDismiss}
              >
                <Tag className="h-4 w-4" />
                Claim Offer
              </Button>
              <Link 
                to="/sell-vehicle"
                className="flex items-center justify-center gap-1 px-4 text-white/90 hover:text-white text-sm font-medium"
                onClick={handleDismiss}
              >
                Sell Car <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Trust Badge */}
          <div className="bg-white/10 px-6 py-3 flex items-center justify-center gap-2 text-xs text-white/80">
            <Phone className="h-3.5 w-3.5" />
            <span>Call us: 1800-123-4567</span>
            <span className="mx-2">•</span>
            <MessageCircle className="h-3.5 w-3.5" />
            <span>24/7 Support</span>
          </div>
        </div>
      </div>
    </>
  );
});

MarketplacePopup.displayName = "MarketplacePopup";

export default MarketplacePopup;
