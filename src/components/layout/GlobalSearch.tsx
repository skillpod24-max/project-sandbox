import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Car, UsersRound, Receipt, FileText, Settings, X, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SearchResult {
  type: "vehicle" | "customer" | "sale" | "document" | "page" | "dealer";
  id: string;
  title: string;
  subtitle?: string;
  url: string;
}

const quickPages: SearchResult[] = [
  { type: "page", id: "dashboard", title: "Dashboard", url: "/dashboard" },
  { type: "page", id: "vehicles", title: "Vehicles", url: "/vehicles" },
  { type: "page", id: "customers", title: "Customers", url: "/customers" },
  { type: "page", id: "sales", title: "Sales", url: "/sales" },
  { type: "page", id: "purchases", title: "Purchases", url: "/purchases" },
  { type: "page", id: "reports", title: "Reports", url: "/reports" },
  { type: "page", id: "settings", title: "Settings", url: "/settings" },
  { type: "page", id: "leads", title: "Leads", url: "/leads" },
  { type: "page", id: "payments", title: "Payments", url: "/payments" },
  { type: "page", id: "expenses", title: "Expenses", url: "/expenses" },
  { type: "page", id: "documents", title: "Documents", url: "/documents" },
];

const getIcon = (type: string) => {
  switch (type) {
    case "vehicle": return Car;
    case "customer": return UsersRound;
    case "dealer": return Building2;
    case "sale": return Receipt;
    case "document": return FileText;
    default: return Settings;
  }
};

const GlobalSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      const filtered = quickPages.filter(p =>
        p.title.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
      setResults(filtered);
      setSelectedIdx(-1);
      return;
    }

    if (!user) return;

    setLoading(true);
    const controller = new AbortController();

    const searchData = async () => {
      try {
        const q = query.trim();
        const searchResults: SearchResult[] = [];

        // Run all searches in parallel
        const [vehiclesRes, leadsRes, salesRes, customersRes] = await Promise.all([
          supabase
            .from("vehicles")
            .select("id, brand, model, registration_number, manufacturing_year, code")
            .eq("user_id", user.id)
            .or(`brand.ilike.%${q}%,model.ilike.%${q}%,registration_number.ilike.%${q}%,code.ilike.%${q}%`)
            .limit(4),
          supabase
            .from("leads")
            .select("id, customer_name, phone, lead_number")
            .eq("user_id", user.id)
            .or(`customer_name.ilike.%${q}%,phone.ilike.%${q}%,lead_number.ilike.%${q}%`)
            .limit(4),
          supabase
            .from("sales")
            .select("id, sale_number, total_amount")
            .eq("user_id", user.id)
            .ilike("sale_number", `%${q}%`)
            .limit(3),
          supabase
            .from("customers")
            .select("id, full_name, phone, code")
            .eq("user_id", user.id)
            .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,code.ilike.%${q}%`)
            .limit(4),
        ]);

        vehiclesRes.data?.forEach(v => {
          searchResults.push({
            type: "vehicle", id: v.id,
            title: `${v.manufacturing_year} ${v.brand} ${v.model}`,
            subtitle: v.registration_number || v.code || undefined,
            url: `/vehicles?search=${v.id}`,
          });
        });

        leadsRes.data?.forEach(l => {
          searchResults.push({
            type: "customer", id: `lead-${l.id}`,
            title: l.customer_name,
            subtitle: `${l.lead_number} · ${l.phone}`,
            url: `/leads?search=${l.id}`,
          });
        });

        salesRes.data?.forEach(s => {
          searchResults.push({
            type: "sale", id: s.id,
            title: s.sale_number,
            subtitle: `₹${Number(s.total_amount).toLocaleString("en-IN")}`,
            url: `/sales?search=${s.id}`,
          });
        });

        customersRes.data?.forEach(c => {
          searchResults.push({
            type: "customer", id: c.id,
            title: c.full_name, subtitle: c.phone,
            url: `/customers?search=${c.id}`,
          });
        });

        // Add matching pages
        quickPages.forEach(p => {
          if (p.title.toLowerCase().includes(q.toLowerCase())) {
            searchResults.push(p);
          }
        });

        if (!controller.signal.aborted) {
          setResults(searchResults.slice(0, 12));
          setSelectedIdx(-1);
          setLoading(false);
        }
      } catch {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    const debounce = setTimeout(searchData, 250);
    return () => { clearTimeout(debounce); controller.abort(); };
  }, [query, user]);

  const handleSelect = useCallback((result: SearchResult) => {
    navigate(result.url);
    setQuery("");
    setIsOpen(false);
  }, [navigate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && selectedIdx >= 0 && results[selectedIdx]) {
      handleSelect(results[selectedIdx]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }, [results, selectedIdx, handleSelect]);

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search vehicles, customers..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-48 md:w-64 lg:w-80 pl-9 pr-8 h-9 bg-muted/50 border-transparent focus:border-primary focus:bg-background transition-colors"
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults(quickPages.slice(0, 5)); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded">
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>

      {isOpen && (query.length > 0 || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
          ) : results.length > 0 ? (
            <div className="max-h-80 overflow-y-auto">
              {results.map((result, idx) => {
                const Icon = getIcon(result.type);
                return (
                  <button
                    key={`${result.type}-${result.id}-${idx}`}
                    onClick={() => handleSelect(result)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left border-b border-border last:border-0 ${
                      idx === selectedIdx ? "bg-muted" : ""
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      result.type === "dealer" ? "bg-blue-100" : "bg-muted"
                    }`}>
                      <Icon className={`h-4 w-4 ${result.type === "dealer" ? "text-blue-600" : "text-muted-foreground"}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                      )}
                    </div>
                    <span className="text-[10px] uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {result.type}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No results found</div>
          ) : (
            <div className="p-3 text-xs text-muted-foreground">Type at least 2 characters to search</div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
