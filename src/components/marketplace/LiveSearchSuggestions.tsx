import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Car, Clock, TrendingUp, Building2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  variant?: string;
  manufacturing_year: number;
  selling_price: number;
  image_url?: string;
}

interface Dealer {
  id: string;
  user_id: string;
  dealer_name: string;
  dealer_address?: string;
  shop_logo_url?: string;
}

interface LiveSearchSuggestionsProps {
  vehicles: Vehicle[];
  dealers?: Dealer[];
  searchTerm: string;
  onSelect: (term: string) => void;
  onClose: () => void;
  visible: boolean;
}

const LiveSearchSuggestions = ({ 
  vehicles, 
  dealers = [],
  searchTerm, 
  onSelect, 
  onClose,
  visible 
}: LiveSearchSuggestionsProps) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (visible) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [visible, onClose]);

  const suggestions = useMemo((): { matchingVehicles: Vehicle[]; brandModelSuggestions: string[]; matchingDealers: Dealer[] } | null => {
    if (!searchTerm || searchTerm.length < 2) return null;
    
    const term = searchTerm.toLowerCase();
    
    // Get matching vehicles
    const matchingVehicles = vehicles
      .filter(v => 
        `${v.brand} ${v.model} ${v.variant || ""}`.toLowerCase().includes(term)
      )
      .slice(0, 5);

    // Get unique brand/model combinations for suggestions
    const brandModelSuggestions = [...new Set(
      vehicles
        .filter(v => v.brand.toLowerCase().includes(term) || v.model.toLowerCase().includes(term))
        .map(v => `${v.brand} ${v.model}`)
    )].slice(0, 3);

    // Get matching dealers
    const matchingDealers = dealers
      .filter(d => 
        d.dealer_name?.toLowerCase().includes(term) ||
        d.dealer_address?.toLowerCase().includes(term)
      )
      .slice(0, 3);

    return { matchingVehicles, brandModelSuggestions, matchingDealers };
  }, [vehicles, dealers, searchTerm]);

  // Recent searches from localStorage
  const recentSearches = useMemo(() => {
    try {
      const saved = localStorage.getItem("recent_vehicle_searches");
      return saved ? JSON.parse(saved).slice(0, 3) : [];
    } catch {
      return [];
    }
  }, []);

  // Popular searches
  const popularSearches = ["Maruti Swift", "Honda City", "Hyundai Creta", "Toyota Fortuner"];

  const handleVehicleClick = (vehicleId: string) => {
    const term = searchTerm;
    if (term) {
      const recent = [...new Set([term, ...recentSearches])].slice(0, 5);
      localStorage.setItem("recent_vehicle_searches", JSON.stringify(recent));
    }
    navigate(`/marketplace/vehicle/${vehicleId}`);
    onClose();
  };

  const handleDealerClick = (dealerId: string) => {
    navigate(`/marketplace/dealer/${dealerId}`);
    onClose();
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Save to recent searches
    const recent = [...new Set([suggestion, ...recentSearches])].slice(0, 5);
    localStorage.setItem("recent_vehicle_searches", JSON.stringify(recent));
    onSelect(suggestion);
  };

  if (!visible) return null;

  const hasResults = suggestions && (suggestions.matchingVehicles?.length > 0 || suggestions.brandModelSuggestions?.length > 0);
  const showNoSearchContent = searchTerm.length < 2;

  return (
    <div 
      ref={containerRef}
      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 max-h-[70vh] overflow-y-auto"
    >
      {showNoSearchContent ? (
        <div className="p-4 space-y-4">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Clock className="h-3 w-3" />
                Recent Searches
              </h4>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(term)}
                    className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-sm text-slate-600 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Popular Searches */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <TrendingUp className="h-3 w-3" />
              Popular Searches
            </h4>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((term, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(term)}
                  className="px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-sm text-blue-600 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : hasResults ? (
        <div>
          {/* Matching Dealers */}
          {suggestions.matchingDealers?.length > 0 && (
            <div className="p-3 border-b border-slate-100">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Building2 className="h-3 w-3" />
                Dealers
              </h4>
              {suggestions.matchingDealers.map((dealer) => (
                <button
                  key={dealer.id}
                  onClick={() => handleDealerClick(dealer.user_id)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 text-left transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center overflow-hidden shrink-0">
                    {dealer.shop_logo_url ? (
                      <img src={dealer.shop_logo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{dealer.dealer_name}</p>
                    {dealer.dealer_address && (
                      <p className="text-xs text-slate-500 truncate">{dealer.dealer_address}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Brand/Model Suggestions */}
          {suggestions.brandModelSuggestions?.length > 0 && (
            <div className="p-3 border-b border-slate-100">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Suggestions
              </h4>
              {suggestions.brandModelSuggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 text-left transition-colors"
                >
                  <Search className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-700">{suggestion}</span>
                </button>
              ))}
            </div>
          )}
          
          {/* Matching Vehicles */}
          {suggestions.matchingVehicles?.length > 0 && (
            <div className="p-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Vehicles
              </h4>
              {suggestions.matchingVehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  onClick={() => handleVehicleClick(vehicle.id)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 text-left transition-colors"
                >
                  <div className="h-12 w-16 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                    {vehicle.image_url ? (
                      <img src={vehicle.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Car className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {vehicle.manufacturing_year} {vehicle.brand} {vehicle.model}
                    </p>
                    <p className="text-sm text-blue-600 font-semibold">
                      {formatCurrency(vehicle.selling_price)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center">
          <Car className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No results found for "{searchTerm}"</p>
          <p className="text-sm text-slate-400 mt-1">Try a different search term</p>
        </div>
      )}
    </div>
  );
};

export default LiveSearchSuggestions;
