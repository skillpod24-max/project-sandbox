import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/formatters";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function EMICalculatorDialog({ open, onOpenChange }: Props) {
  const [price, setPrice] = useState(500000);
  const [down, setDown] = useState(100000);
  const [rate, setRate] = useState(10);
  const [tenure, setTenure] = useState(36);

  const principal = Math.max(price - down, 0);
  const monthlyRate = rate / 12 / 100;

  const emi =
    monthlyRate === 0
      ? principal / tenure
      : (principal *
          monthlyRate *
          Math.pow(1 + monthlyRate, tenure)) /
        (Math.pow(1 + monthlyRate, tenure) - 1);

  const totalPayable = emi * tenure;
  const interest = totalPayable - principal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>EMI Calculator</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Vehicle Price</Label>
              <Input type="number" value={price} onChange={e => setPrice(+e.target.value || 0)} />
            </div>
            <div>
              <Label>Down Payment</Label>
              <Input type="number" value={down} onChange={e => setDown(+e.target.value || 0)} />
            </div>
            <div>
              <Label>Interest %</Label>
              <Input type="number" step="0.1" value={rate} onChange={e => setRate(+e.target.value || 0)} />
            </div>
            <div>
              <Label>Tenure (months)</Label>
              <Input type="number" value={tenure} onChange={e => setTenure(+e.target.value || 1)} />
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg space-y-1 text-sm">
            <p>Financed Amount: <b>{formatCurrency(principal)}</b></p>
            <p>Monthly EMI: <b>{formatCurrency(Math.round(emi))}</b></p>
            <p>Total Interest: <b>{formatCurrency(Math.round(interest))}</b></p>
            <p>Total Payable: <b>{formatCurrency(Math.round(totalPayable))}</b></p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
