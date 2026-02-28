import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { formatCurrency, formatIndianNumber } from "@/lib/formatters";

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  secondary?: string;
  isCurrency?: boolean;
}

export const ReportKPICard = ({ title, value, icon: Icon, color = "text-primary", secondary, isCurrency }: Props) => {
  const display = isCurrency
    ? formatCurrency(Number(value))
    : typeof value === "number"
    ? formatIndianNumber(value)
    : value;

  return (
    <Card className="border border-border bg-card hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <div className="text-lg font-bold text-foreground truncate">{display}</div>
        {secondary && <p className="text-[11px] text-muted-foreground mt-1 truncate">{secondary}</p>}
      </CardContent>
    </Card>
  );
};
