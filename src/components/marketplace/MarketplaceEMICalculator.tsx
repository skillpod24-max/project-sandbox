import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { formatCurrency, formatIndianNumber } from "@/lib/formatters";
import { Calculator, TrendingDown, Clock, IndianRupee, Percent } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  vehiclePrice?: number;
  vehicleName?: string;
}

export default function MarketplaceEMICalculator({ 
  open, 
  onOpenChange, 
  vehiclePrice = 500000,
  vehicleName 
}: Props) {
  const [price, setPrice] = useState(vehiclePrice);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [rate, setRate] = useState(9.5);
  const [tenure, setTenure] = useState(48);

  useEffect(() => {
    setPrice(vehiclePrice);
  }, [vehiclePrice]);

  const downPayment = Math.round((price * downPaymentPercent) / 100);
  const principal = Math.max(price - downPayment, 0);
  const monthlyRate = rate / 12 / 100;

  const emi =
    monthlyRate === 0
      ? principal / tenure
      : (principal *
          monthlyRate *
          Math.pow(1 + monthlyRate, tenure)) /
        (Math.pow(1 + monthlyRate, tenure) - 1);

  const totalPayable = emi * tenure;
  const totalInterest = totalPayable - principal;

  const tenureOptions = [12, 24, 36, 48, 60, 72, 84];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 md:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white text-xl">
              <Calculator className="h-6 w-6" />
              EMI Calculator
            </DialogTitle>
          </DialogHeader>
          {vehicleName && (
            <p className="text-blue-100 mt-2 text-sm">{vehicleName}</p>
          )}
          
          {/* EMI Result */}
          <div className="mt-6 text-center">
            <p className="text-blue-100 text-sm">Monthly EMI</p>
            <p className="text-4xl font-bold mt-1">
              ₹{formatIndianNumber(Math.round(emi))}
            </p>
            <p className="text-blue-100 text-xs mt-1">for {tenure} months</p>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Vehicle Price */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-slate-400" />
                Vehicle Price
              </label>
              <span className="text-sm font-semibold text-slate-900">
                {formatCurrency(price)}
              </span>
            </div>
            <Slider
              value={[price]}
              onValueChange={(v) => setPrice(v[0])}
              min={100000}
              max={5000000}
              step={10000}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>₹1L</span>
              <span>₹50L</span>
            </div>
          </div>

          {/* Down Payment */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-slate-400" />
                Down Payment ({downPaymentPercent}%)
              </label>
              <span className="text-sm font-semibold text-slate-900">
                {formatCurrency(downPayment)}
              </span>
            </div>
            <Slider
              value={[downPaymentPercent]}
              onValueChange={(v) => setDownPaymentPercent(v[0])}
              min={0}
              max={80}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>0%</span>
              <span>80%</span>
            </div>
          </div>

          {/* Interest Rate */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Percent className="h-4 w-4 text-slate-400" />
                Interest Rate
              </label>
              <span className="text-sm font-semibold text-slate-900">
                {rate}% p.a.
              </span>
            </div>
            <Slider
              value={[rate]}
              onValueChange={(v) => setRate(v[0])}
              min={7}
              max={18}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>7%</span>
              <span>18%</span>
            </div>
          </div>

          {/* Loan Tenure */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              Loan Tenure
            </label>
            <div className="flex flex-wrap gap-2">
              {tenureOptions.map((t) => (
                <button
                  key={t}
                  onClick={() => setTenure(t)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    tenure === t
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {t} mo
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Loan Amount</span>
              <span className="font-medium text-slate-900">{formatCurrency(principal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total Interest</span>
              <span className="font-medium text-amber-600">{formatCurrency(Math.round(totalInterest))}</span>
            </div>
            <div className="border-t border-slate-200 pt-3 flex justify-between">
              <span className="text-slate-700 font-medium">Total Payable</span>
              <span className="font-bold text-slate-900">{formatCurrency(Math.round(totalPayable + downPayment))}</span>
            </div>
          </div>

          {/* CTA */}
          <Button 
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl h-12"
            onClick={() => onOpenChange(false)}
          >
            Apply for Loan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
