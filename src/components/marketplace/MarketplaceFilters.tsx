import { useState, useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SlidersHorizontal, X, RotateCcw } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FiltersState {
  priceRange: [number, number];
  yearRange: [number, number];
  fuelTypes: string[];
  transmissions: string[];
  bodyTypes: string[];
  owners: string[];
  kmDriven: [number, number];
}

interface MarketplaceFiltersProps {
  vehicles: any[];
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
  vehicleType?: string;
}

const defaultFilters: FiltersState = {
  priceRange: [0, 5000000],
  yearRange: [2010, 2026],
  fuelTypes: [],
  transmissions: [],
  bodyTypes: [],
  owners: [],
  kmDriven: [0, 200000],
};

const MarketplaceFilters = memo(({ vehicles, filters, onFiltersChange, vehicleType = "car" }: MarketplaceFiltersProps) => {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FiltersState>(filters);

  // Compute available options from vehicles
  const filterOptions = useMemo(() => {
    const fuelTypes: Record<string, number> = {};
    const transmissions: Record<string, number> = {};
    const years: number[] = [];
    const prices: number[] = [];
    const kms: number[] = [];
    
    vehicles.forEach(v => {
      // Fuel types
      if (v.fuel_type) {
        fuelTypes[v.fuel_type] = (fuelTypes[v.fuel_type] || 0) + 1;
      }
      // Transmissions
      if (v.transmission) {
        transmissions[v.transmission] = (transmissions[v.transmission] || 0) + 1;
      }
      // Years
      if (v.manufacturing_year) years.push(v.manufacturing_year);
      // Prices
      if (v.selling_price) prices.push(v.selling_price);
      // KM Driven
      if (v.odometer_reading) kms.push(v.odometer_reading);
    });

    return {
      fuelTypes: Object.entries(fuelTypes).map(([value, count]) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1), count })),
      transmissions: Object.entries(transmissions).map(([value, count]) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1), count })),
      minYear: Math.min(...years, 2010),
      maxYear: Math.max(...years, 2026),
      minPrice: Math.min(...prices, 0),
      maxPrice: Math.max(...prices, 5000000),
      minKm: 0,
      maxKm: Math.max(...kms, 200000),
    };
  }, [vehicles]);

  const ownerOptions: FilterOption[] = [
    { value: "1", label: "1st Owner" },
    { value: "2", label: "2nd Owner" },
    { value: "3", label: "3rd Owner" },
    { value: "4+", label: "4+ Owners" },
  ];

  const bodyTypeOptions: FilterOption[] = vehicleType === "car" ? [
    { value: "sedan", label: "Sedan" },
    { value: "hatchback", label: "Hatchback" },
    { value: "suv", label: "SUV" },
    { value: "muv", label: "MUV" },
    { value: "compact-suv", label: "Compact SUV" },
    { value: "luxury", label: "Luxury" },
  ] : [
    { value: "commuter", label: "Commuter" },
    { value: "sports", label: "Sports" },
    { value: "cruiser", label: "Cruiser" },
    { value: "scooter", label: "Scooter" },
  ];

  const toggleArrayFilter = (array: string[], value: string): string[] => {
    if (array.includes(value)) {
      return array.filter(v => v !== value);
    }
    return [...array, value];
  };

  const updateLocalFilter = <K extends keyof FiltersState>(key: K, value: FiltersState[K]) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const resetFilters = () => {
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 5000000) count++;
    if (filters.yearRange[0] > 2010 || filters.yearRange[1] < 2026) count++;
    if (filters.fuelTypes.length > 0) count++;
    if (filters.transmissions.length > 0) count++;
    if (filters.bodyTypes.length > 0) count++;
    if (filters.owners.length > 0) count++;
    if (filters.kmDriven[0] > 0 || filters.kmDriven[1] < 200000) count++;
    return count;
  }, [filters]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 relative">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-blue-600 text-white">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <SheetTitle>Filters</SheetTitle>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-slate-500 gap-1">
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          </div>
        </SheetHeader>

        <div className="py-4 space-y-1">
          <Accordion type="multiple" defaultValue={["price", "fuel", "transmission"]} className="w-full">
            {/* Price Range */}
            <AccordionItem value="price">
              <AccordionTrigger className="text-sm font-semibold">
                Price Range
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-6">
                <div className="space-y-4">
                  <Slider
                    value={localFilters.priceRange}
                    onValueChange={(value) => updateLocalFilter("priceRange", value as [number, number])}
                    min={0}
                    max={5000000}
                    step={50000}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>{formatCurrency(localFilters.priceRange[0])}</span>
                    <span>{formatCurrency(localFilters.priceRange[1])}</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Manufacturing Year */}
            <AccordionItem value="year">
              <AccordionTrigger className="text-sm font-semibold">
                Manufacturing Year
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-6">
                <div className="space-y-4">
                  <Slider
                    value={localFilters.yearRange}
                    onValueChange={(value) => updateLocalFilter("yearRange", value as [number, number])}
                    min={2005}
                    max={2026}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>{localFilters.yearRange[0]}</span>
                    <span>{localFilters.yearRange[1]}</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Fuel Type */}
            <AccordionItem value="fuel">
              <AccordionTrigger className="text-sm font-semibold">
                Fuel Type
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <div className="grid grid-cols-2 gap-2">
                  {filterOptions.fuelTypes.map(option => (
                    <button
                      key={option.value}
                      onClick={() => updateLocalFilter("fuelTypes", toggleArrayFilter(localFilters.fuelTypes, option.value))}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-all ${
                        localFilters.fuelTypes.includes(option.value)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span>{option.label}</span>
                      {option.count && (
                        <span className="text-xs text-slate-400">({option.count})</span>
                      )}
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Transmission */}
            <AccordionItem value="transmission">
              <AccordionTrigger className="text-sm font-semibold">
                Transmission
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <div className="grid grid-cols-2 gap-2">
                  {filterOptions.transmissions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => updateLocalFilter("transmissions", toggleArrayFilter(localFilters.transmissions, option.value))}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-all ${
                        localFilters.transmissions.includes(option.value)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span>{option.label}</span>
                      {option.count && (
                        <span className="text-xs text-slate-400">({option.count})</span>
                      )}
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Body Type */}
            <AccordionItem value="bodyType">
              <AccordionTrigger className="text-sm font-semibold">
                Body Type
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <div className="flex flex-wrap gap-2">
                  {bodyTypeOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => updateLocalFilter("bodyTypes", toggleArrayFilter(localFilters.bodyTypes, option.value))}
                      className={`px-3 py-1.5 rounded-full border text-sm transition-all ${
                        localFilters.bodyTypes.includes(option.value)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* KM Driven */}
            <AccordionItem value="km">
              <AccordionTrigger className="text-sm font-semibold">
                KM Driven
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-6">
                <div className="space-y-4">
                  <Slider
                    value={localFilters.kmDriven}
                    onValueChange={(value) => updateLocalFilter("kmDriven", value as [number, number])}
                    min={0}
                    max={200000}
                    step={5000}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>{(localFilters.kmDriven[0] / 1000).toFixed(0)}K km</span>
                    <span>{(localFilters.kmDriven[1] / 1000).toFixed(0)}K km</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Number of Owners */}
            <AccordionItem value="owners">
              <AccordionTrigger className="text-sm font-semibold">
                Number of Owners
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <div className="space-y-2">
                  {ownerOptions.map(option => (
                    <div key={option.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`owner-${option.value}`}
                        checked={localFilters.owners.includes(option.value)}
                        onCheckedChange={() => updateLocalFilter("owners", toggleArrayFilter(localFilters.owners, option.value))}
                      />
                      <Label htmlFor={`owner-${option.value}`} className="text-sm cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <SheetFooter className="sticky bottom-0 bg-white pt-4 border-t border-slate-100 mt-auto">
          <div className="flex gap-3 w-full">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={applyFilters} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Apply Filters
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
});

MarketplaceFilters.displayName = "MarketplaceFilters";

export { defaultFilters };
export type { FiltersState };
export default MarketplaceFilters;
