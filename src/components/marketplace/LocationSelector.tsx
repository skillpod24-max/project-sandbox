import { useState, useEffect, useRef } from "react";
import { MapPin, ChevronDown, Loader2, Navigation, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface LocationSelectorProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
  availableCities: string[];
}

const LocationSelector = ({ selectedCity, onCityChange, availableCities }: LocationSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  const hasRequestedLocation = useRef(false);

  // Popular cities in India
  const popularCities = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Pune", "Kolkata", "Ahmedabad", "Coimbatore"];

  // Request location on first interaction
  useEffect(() => {
    if (!hasRequestedLocation.current && !selectedCity) {
      hasRequestedLocation.current = true;
      detectLocation();
    }
  }, []);

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      console.log("Geolocation not supported");
      return;
    }

    setDetecting(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Use a reverse geocoding API to get city name
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          
          // Extract city name from response
          const city = data.address?.city || 
                      data.address?.town || 
                      data.address?.village ||
                      data.address?.state_district ||
                      data.address?.county;
          
          if (city) {
            setDetectedCity(city);
            // Check if city exists in available cities
            const matchedCity = availableCities.find(
              c => c.toLowerCase().includes(city.toLowerCase()) || 
                   city.toLowerCase().includes(c.toLowerCase())
            );
            if (matchedCity) {
              onCityChange(matchedCity);
            } else {
              // Set detected city even if not in list
              onCityChange(city);
            }
          }
        } catch (error) {
          console.error("Error detecting location:", error);
        } finally {
          setDetecting(false);
        }
      },
      (error) => {
        console.log("Location permission denied:", error);
        setDetecting(false);
      },
      { timeout: 10000 }
    );
  };

  const filteredCities = searchTerm 
    ? [...new Set([...availableCities, ...popularCities])].filter(city => 
        city.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [...new Set([...availableCities, ...popularCities])];

  const displayCity = selectedCity === "all" ? "All Cities" : selectedCity || "Select City";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          className="gap-2 text-slate-700 hover:text-blue-600 hover:bg-blue-50 px-3"
        >
          <MapPin className="h-4 w-4 text-blue-600" />
          <span className="font-medium max-w-[80px] sm:max-w-[100px] truncate text-xs sm:text-sm">
            {detecting ? "..." : displayCity}
          </span>
          {detecting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-3 border-b border-slate-100">
          <div className="relative">
            <Input
              placeholder="Search city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 border-slate-200"
            />
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
        </div>

        {/* Detect Location Button */}
        <button
          onClick={detectLocation}
          disabled={detecting}
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-slate-100"
        >
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            {detecting ? (
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4 text-blue-600" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600">
              {detecting ? "Detecting location..." : "Use current location"}
            </p>
            {detectedCity && !detecting && (
              <p className="text-xs text-slate-500">Last: {detectedCity}</p>
            )}
          </div>
        </button>

        {/* All Cities Option */}
        <button
          onClick={() => { onCityChange("all"); setOpen(false); }}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors ${
            selectedCity === "all" ? "bg-blue-50 text-blue-700" : ""
          }`}
        >
          <span className="text-sm">All Cities</span>
          {selectedCity === "all" && <span className="ml-auto text-blue-600">✓</span>}
        </button>

        {/* City List */}
        <div className="max-h-48 overflow-y-auto">
          {filteredCities.length > 0 ? (
            filteredCities.map((city) => (
              <button
                key={city}
                onClick={() => { onCityChange(city); setOpen(false); setSearchTerm(""); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors ${
                  selectedCity === city ? "bg-blue-50 text-blue-700" : ""
                }`}
              >
                <MapPin className="h-3 w-3 text-slate-400" />
                <span className="text-sm">{city}</span>
                {selectedCity === city && <span className="ml-auto text-blue-600">✓</span>}
              </button>
            ))
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">No cities found</p>
          )}
        </div>

        {/* Clear Selection */}
        {selectedCity && selectedCity !== "all" && (
          <button
            onClick={() => { onCityChange("all"); setOpen(false); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-slate-500 hover:text-red-500 border-t border-slate-100"
          >
            <X className="h-3 w-3" />
            Clear selection
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default LocationSelector;
