import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, BarChart3, TrendingUp, CreditCard, Package, Users, UserCheck, ShoppingCart, Wallet, LayoutDashboard } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

const categories = [
  { id: "business", label: "Business Overview", icon: LayoutDashboard, subs: [] as {id:string;label:string}[] },
  { id: "sales", label: "Sales & Revenue", icon: TrendingUp, subs: [
    { id: "summary", label: "Sales Summary" },
    { id: "profit", label: "Profit Analysis" },
    { id: "collection", label: "Payment Collection" },
  ]},
  { id: "emi", label: "EMI & Finance", icon: CreditCard, subs: [
    { id: "overview", label: "EMI Overview" },
    { id: "schedule", label: "EMI Due Schedule" },
    { id: "interest", label: "Interest & Principal" },
  ]},
  { id: "inventory", label: "Inventory & Vehicle", icon: Package, subs: [
    { id: "stock", label: "Stock Summary" },
    { id: "aging", label: "Vehicle Aging" },
    { id: "performance", label: "Vehicle Performance" },
  ]},
  { id: "leads", label: "Lead & Conversion", icon: Users, subs: [
    { id: "summary", label: "Lead Summary" },
    { id: "funnel", label: "Conversion Funnel" },
    { id: "publicpage", label: "Public Page Performance" },
  ]},
  { id: "customers", label: "Customer Reports", icon: UserCheck, subs: [
    { id: "ledger", label: "Customer Ledger" },
    { id: "clv", label: "Customer Lifetime Value" },
  ]},
  { id: "vendors", label: "Vendor & Purchase", icon: ShoppingCart, subs: [
    { id: "summary", label: "Vendor Summary" },
    { id: "margin", label: "Purchase vs Sale Margin" },
  ]},
  { id: "expenses", label: "Expense & Cash Flow", icon: Wallet, subs: [
    { id: "summary", label: "Expense Summary" },
    { id: "cashflow", label: "Cash Flow Statement" },
  ]},
];

interface Props {
  activeCategory: string;
  activeSubCategory: string;
  onChange: (cat: string, sub: string) => void;
}

export const ReportsSidebar = ({ activeCategory, activeSubCategory, onChange }: Props) => {
  const [expanded, setExpanded] = useState<string[]>([activeCategory]);
  const isMobile = useIsMobile();

  const toggleExpand = (id: string) => {
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  if (isMobile) {
    const activeCat = categories.find(c => c.id === activeCategory);
    return (
      <div className="w-full mb-4">
        <div className="overflow-x-auto pb-2 border-b border-border">
          <div className="flex gap-1 min-w-max px-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => { onChange(cat.id, cat.subs[0]?.id || ""); }}
                className={cn(
                  "px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                  activeCategory === cat.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        {activeCat && activeCat.subs.length > 0 && (
          <div className="flex gap-1 mt-2 px-1 overflow-x-auto">
            {activeCat.subs.map(sub => (
              <button
                key={sub.id}
                onClick={() => onChange(activeCategory, sub.id)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors",
                  activeSubCategory === sub.id ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-60 shrink-0 border border-border rounded-xl bg-card h-fit sticky top-4">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" /> Reports
        </h2>
      </div>
      <ScrollArea className="max-h-[calc(100vh-200px)]">
        <div className="p-2 space-y-0.5">
          {categories.map(cat => {
            const isActive = activeCategory === cat.id;
            const isExp = expanded.includes(cat.id);
            const Icon = cat.icon;
            return (
              <div key={cat.id}>
                <button
                  onClick={() => {
                    if (cat.subs.length === 0) { onChange(cat.id, ""); }
                    else { toggleExpand(cat.id); if (!isActive) onChange(cat.id, cat.subs[0].id); }
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left truncate text-xs">{cat.label}</span>
                  {cat.subs.length > 0 && (isExp ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />)}
                </button>
                {isExp && cat.subs.length > 0 && (
                  <div className="ml-6 mt-0.5 space-y-0.5">
                    {cat.subs.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => onChange(cat.id, sub.id)}
                        className={cn(
                          "w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors",
                          activeSubCategory === sub.id && isActive
                            ? "bg-accent text-accent-foreground font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
