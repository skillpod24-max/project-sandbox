import { useState, useEffect, useRef } from "react";
import { MapPin, ChevronDown, Loader2, Navigation, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

// Major Indian cities with approximate coordinates for distance calculation
export const MAJOR_CITIES: { name: string; lat: number; lng: number }[] = [
  { name: "Mumbai", lat: 19.076, lng: 72.8777 },
  { name: "Delhi", lat: 28.7041, lng: 77.1025 },
  { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
  { name: "Chennai", lat: 13.0827, lng: 80.2707 },
  { name: "Hyderabad", lat: 17.385, lng: 78.4867 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
  { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
  { name: "Coimbatore", lat: 11.0168, lng: 76.9558 },
  { name: "Jaipur", lat: 26.9124, lng: 75.7873 },
  { name: "Lucknow", lat: 26.8467, lng: 80.9462 },
  { name: "Kochi", lat: 9.9312, lng: 76.2673 },
  { name: "Chandigarh", lat: 30.7333, lng: 76.7794 },
  { name: "Indore", lat: 22.7196, lng: 75.8577 },
  { name: "Nagpur", lat: 21.1458, lng: 79.0882 },
  { name: "Surat", lat: 21.1702, lng: 72.8311 },
  { name: "Visakhapatnam", lat: 17.6868, lng: 83.2185 },
  { name: "Thiruvananthapuram", lat: 8.5241, lng: 76.9366 },
  { name: "Madurai", lat: 9.9252, lng: 78.1198 },
  { name: "Vijayawada", lat: 16.5062, lng: 80.648 },
  { name: "Bhopal", lat: 23.2599, lng: 77.4126 },
  { name: "Mysore", lat: 12.2958, lng: 76.6394 },
  { name: "Tiruchirappalli", lat: 10.7905, lng: 78.7047 },
  { name: "Salem", lat: 11.6643, lng: 78.146 },
  { name: "Erode", lat: 11.341, lng: 77.7172 },
  { name: "Tirunelveli", lat: 8.7139, lng: 77.7567 },
];

// Haversine distance in km
export function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Find the nearest major city for a given city name
export function findNearestMajorCity(cityName: string): { name: string; lat: number; lng: number } | null {
  const match = MAJOR_CITIES.find(c => c.name.toLowerCase() === cityName.toLowerCase());
  return match || null;
}

// Get cities within radius of a point
export function getCitiesWithinRadius(lat: number, lng: number, radiusKm: number): string[] {
  return MAJOR_CITIES.filter(c => getDistanceKm(lat, lng, c.lat, c.lng) <= radiusKm).map(c => c.name);
}

interface LocationSelectorProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
  availableCities: string[];
  onLocationDetected?: (lat: number, lng: number, city: string) => void;
}

const LocationSelector = ({ selectedCity, onCityChange, availableCities, onLocationDetected }: LocationSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  const hasRequestedLocation = useRef(false);

  const majorCityNames = MAJOR_CITIES.map(c => c.name);

  // Request location on first load
  useEffect(() => {
    if (!hasRequestedLocation.current && !selectedCity) {
      hasRequestedLocation.current = true;
      detectLocation();
    }
  }, []);

  const detectLocation = async () => {
    if (!navigator.geolocation) return;
    setDetecting(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.state_district ||
            data.address?.county;

          if (city) {
            setDetectedCity(city);
            // Match to nearest major city
            const nearestMajor = MAJOR_CITIES.reduce((best, c) => {
              const dist = getDistanceKm(latitude, longitude, c.lat, c.lng);
              return dist < best.dist ? { city: c, dist } : best;
            }, { city: MAJOR_CITIES[0], dist: Infinity });

            onCityChange(nearestMajor.city.name);
            onLocationDetected?.(latitude, longitude, nearestMajor.city.name);
          }
        } catch (error) {
          console.error("Error detecting location:", error);
        } finally {
          setDetecting(false);
        }
      },
      () => setDetecting(false),
      { timeout: 10000 }
    );
  };

  const filteredCities = searchTerm
    ? majorCityNames.filter(city => city.toLowerCase().includes(searchTerm.toLowerCase()))
    : majorCityNames;

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
          {detecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronDown className="h-3 w-3" />}
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

        <button
          onClick={detectLocation}
          disabled={detecting}
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-slate-100"
        >
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            {detecting ? <Loader2 className="h-4 w-4 text-blue-600 animate-spin" /> : <Navigation className="h-4 w-4 text-blue-600" />}
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600">
              {detecting ? "Detecting location..." : "Use current location"}
            </p>
            {detectedCity && !detecting && <p className="text-xs text-slate-500">Last: {detectedCity}</p>}
          </div>
        </button>

        <button
          onClick={() => { onCityChange("all"); setOpen(false); }}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors ${
            selectedCity === "all" ? "bg-blue-50 text-blue-700" : ""
          }`}
        >
          <span className="text-sm">All Cities</span>
          {selectedCity === "all" && <span className="ml-auto text-blue-600">✓</span>}
        </button>

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
