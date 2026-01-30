import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, TrendingDown, Car, Gauge, Calendar, Sparkles } from "lucide-react";
import { formatCurrency, formatIndianNumber } from "@/lib/formatters";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleData?: {
    vehicleType?: string;
    sellingPrice?: number;
    manufacturingYear?: number;
    odometerReading?: number;
    condition?: string;
    variant?: string;
  };
}

// Base prices by vehicle type and category (in lakhs)
const basePrices: Record<string, Record<string, number>> = {
  car: {
    hatchback: 600000,
    sedan: 1000000,
    suv: 1400000,
    luxury: 3500000,
  },
  bike: {
    commuter: 80000,
    sport: 150000,
    cruiser: 200000,
    premium: 500000,
  },
};

// Depreciation rates by age
const depreciationRates = [
  { year: 1, rate: 0.15 },
  { year: 2, rate: 0.12 },
  { year: 3, rate: 0.10 },
  { year: 4, rate: 0.08 },
  { year: 5, rate: 0.07 },
  { year: 6, rate: 0.06 },
  { year: 7, rate: 0.05 },
  { year: 8, rate: 0.04 },
  { year: 9, rate: 0.03 },
  { year: 10, rate: 0.02 },
];

// Condition multipliers
const conditionMultipliers: Record<string, number> = {
  excellent: 1.1,
  good: 1.0,
  fair: 0.85,
  poor: 0.65,
};

// Mileage impact (per 10,000 km over average)
const mileageImpact = 0.02;
const averageMileagePerYear = 12000; // km

const VehicleValuationCalculator = ({ open, onOpenChange, vehicleData }: Props) => {
  // Calculate age from manufacturing year
  const currentYear = new Date().getFullYear();
  const defaultAge = vehicleData?.manufacturingYear 
    ? currentYear - vehicleData.manufacturingYear 
    : 3;

  const [vehicleType, setVehicleType] = useState<string>(vehicleData?.vehicleType || "car");
  const [category, setCategory] = useState<string>("sedan");
  const [age, setAge] = useState<number>(defaultAge);
  const [mileage, setMileage] = useState<number>(vehicleData?.odometerReading || 35000);
  const [condition, setCondition] = useState<string>(vehicleData?.condition === "new" ? "excellent" : "good");
  const [originalPrice, setOriginalPrice] = useState<string>(
    vehicleData?.sellingPrice ? String(Math.round(vehicleData.sellingPrice * 1.2)) : "1000000"
  );

  // Update state when vehicleData changes
  useEffect(() => {
    if (vehicleData) {
      if (vehicleData.vehicleType) setVehicleType(vehicleData.vehicleType);
      if (vehicleData.manufacturingYear) setAge(currentYear - vehicleData.manufacturingYear);
      if (vehicleData.odometerReading) setMileage(vehicleData.odometerReading);
      if (vehicleData.condition) setCondition(vehicleData.condition === "new" ? "excellent" : "good");
      if (vehicleData.sellingPrice) setOriginalPrice(String(Math.round(vehicleData.sellingPrice * 1.2)));
      
      // Guess category from variant
      if (vehicleData.variant) {
        const variant = vehicleData.variant.toLowerCase();
        if (variant.includes("suv") || ["creta", "seltos", "xuv"].some(m => variant.includes(m))) {
          setCategory("suv");
        } else if (variant.includes("hatchback") || ["i20", "swift", "polo"].some(m => variant.includes(m))) {
          setCategory("hatchback");
        } else if (variant.includes("luxury")) {
          setCategory("luxury");
        }
      }
    }
  }, [vehicleData, currentYear]);

  const categories = useMemo(() => {
    if (vehicleType === "car") {
      return [
        { value: "hatchback", label: "Hatchback" },
        { value: "sedan", label: "Sedan" },
        { value: "suv", label: "SUV / Crossover" },
        { value: "luxury", label: "Luxury" },
      ];
    }
    return [
      { value: "commuter", label: "Commuter" },
      { value: "sport", label: "Sports" },
      { value: "cruiser", label: "Cruiser" },
      { value: "premium", label: "Premium" },
    ];
  }, [vehicleType]);

  const valuation = useMemo(() => {
    const basePrice = parseFloat(originalPrice) || basePrices[vehicleType]?.[category] || 1000000;
    
    // Calculate depreciation
    let currentValue = basePrice;
    for (let i = 0; i < age && i < depreciationRates.length; i++) {
      currentValue *= (1 - depreciationRates[i].rate);
    }
    // For vehicles older than 10 years, apply 2% depreciation per additional year
    if (age > 10) {
      for (let i = 10; i < age; i++) {
        currentValue *= 0.98;
      }
    }

    // Apply mileage adjustment
    const expectedMileage = age * averageMileagePerYear;
    const excessMileage = Math.max(0, mileage - expectedMileage);
    const mileageDeduction = (excessMileage / 10000) * mileageImpact * currentValue;
    currentValue -= mileageDeduction;

    // Apply condition multiplier
    currentValue *= conditionMultipliers[condition] || 1;

    // Calculate ranges
    const lowValue = Math.round(currentValue * 0.9);
    const highValue = Math.round(currentValue * 1.1);
    const marketValue = Math.round(currentValue);

    // Calculate depreciation percentage
    const totalDepreciation = ((basePrice - marketValue) / basePrice) * 100;

    return {
      marketValue,
      lowValue,
      highValue,
      totalDepreciation: Math.round(totalDepreciation),
      originalPrice: basePrice,
    };
  }, [vehicleType, category, age, mileage, condition, originalPrice]);

  const getConditionColor = (cond: string) => {
    switch (cond) {
      case "excellent": return "bg-emerald-100 text-emerald-700";
      case "good": return "bg-blue-100 text-blue-700";
      case "fair": return "bg-amber-100 text-amber-700";
      case "poor": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            Vehicle Valuation Calculator
          </DialogTitle>
          <DialogDescription>
            Estimate fair market value based on age, mileage, and condition
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Input Section */}
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Vehicle Type</Label>
              <Select value={vehicleType} onValueChange={(v) => {
                setVehicleType(v);
                setCategory(v === "car" ? "sedan" : "commuter");
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="bike">Bike</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Original/Ex-Showroom Price</Label>
              <Input
                type="number"
                placeholder="e.g., 1000000"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Enter the original purchase price or ex-showroom price</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Vehicle Age</Label>
                <span className="text-sm font-semibold text-blue-600">{age} years</span>
              </div>
              <Slider
                value={[age]}
                onValueChange={(v) => setAge(v[0])}
                min={0}
                max={20}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Odometer Reading</Label>
                <span className="text-sm font-semibold text-blue-600">{formatIndianNumber(mileage)} km</span>
              </div>
              <Slider
                value={[mileage]}
                onValueChange={(v) => setMileage(v[0])}
                min={0}
                max={300000}
                step={5000}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Condition</Label>
              <div className="grid grid-cols-2 gap-2">
                {["excellent", "good", "fair", "poor"].map((cond) => (
                  <button
                    key={cond}
                    onClick={() => setCondition(cond)}
                    className={`p-3 rounded-xl border-2 transition-all capitalize text-sm font-medium ${
                      condition === cond 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result Section */}
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 shadow-xl">
              <CardContent className="p-6 text-center">
                <p className="text-blue-200 text-sm mb-1">Estimated Market Value</p>
                <p className="text-4xl font-bold mb-2">
                  {formatCurrency(valuation.marketValue)}
                </p>
                <p className="text-blue-200 text-sm">
                  Range: {formatCurrency(valuation.lowValue)} - {formatCurrency(valuation.highValue)}
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card className="border-0 shadow-sm bg-slate-50">
                <CardContent className="p-4 text-center">
                  <TrendingDown className="h-5 w-5 text-red-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-slate-900">{valuation.totalDepreciation}%</p>
                  <p className="text-xs text-slate-500">Total Depreciation</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-slate-50">
                <CardContent className="p-4 text-center">
                  <Badge className={getConditionColor(condition)}>
                    <Sparkles className="h-3 w-3 mr-1" />
                    {condition}
                  </Badge>
                  <p className="text-xs text-slate-500 mt-2">Vehicle Condition</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <h4 className="font-semibold text-sm text-slate-900">Valuation Breakdown</h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Original Price</span>
                    <span className="font-medium">{formatCurrency(parseFloat(originalPrice) || 0)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Age Depreciation ({age} yrs)</span>
                    <span>-{valuation.totalDepreciation}%</span>
                  </div>
                  <div className="flex justify-between text-amber-600">
                    <span>Mileage Adjustment</span>
                    <span>{mileage > age * averageMileagePerYear ? "-" : "+"}{Math.abs(Math.round((mileage - age * averageMileagePerYear) / 10000) * 2)}%</span>
                  </div>
                  <div className="flex justify-between text-blue-600">
                    <span>Condition ({condition})</span>
                    <span>{condition === "excellent" ? "+10%" : condition === "good" ? "0%" : condition === "fair" ? "-15%" : "-35%"}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Estimated Value</span>
                    <span className="text-blue-600">{formatCurrency(valuation.marketValue)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <p className="text-xs text-slate-500 text-center">
              * This is an estimate. Actual value may vary based on brand, model, service history, and market demand.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleValuationCalculator;
