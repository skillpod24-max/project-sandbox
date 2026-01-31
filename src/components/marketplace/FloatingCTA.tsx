import { useState, memo } from "react";
import { Phone, MessageCircle, X, Sparkles } from "lucide-react";

const FloatingCTA = memo(() => {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-6">
      {expanded ? (
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-xl p-4 w-72 animate-scale-in">
          <button
            onClick={() => setDismissed(true)}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-lg"
          >
            <X className="h-3 w-3" />
          </button>
          
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-amber-300" />
            <span className="text-white font-semibold">Need Help?</span>
          </div>
          
          <p className="text-white/90 text-sm mb-4">
            Our experts are available 24/7 to help you find your perfect vehicle.
          </p>
          
          <div className="flex gap-2">
            <a 
              href="tel:18001234567"
              className="flex-1 flex items-center justify-center gap-2 bg-white text-emerald-700 rounded-xl py-2.5 font-medium text-sm hover:bg-emerald-50 transition-colors"
            >
              <Phone className="h-4 w-4" />
              Call Now
            </a>
            <a 
              href="https://wa.me/918888888888?text=Hi, I need help finding a vehicle on VahanHub"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-white/20 text-white rounded-xl py-2.5 font-medium text-sm hover:bg-white/30 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="relative flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all group"
        >
          {/* Ping animation */}
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-amber-400 rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-amber-400 rounded-full" />
          
          <MessageCircle className="h-5 w-5" />
          <span className="font-medium text-sm">Need Help?</span>
        </button>
      )}
    </div>
  );
});

FloatingCTA.displayName = "FloatingCTA";

export default FloatingCTA;
