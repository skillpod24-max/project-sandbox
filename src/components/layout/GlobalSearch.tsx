import { useState, useEffect, useRef } from "react";
import { Search, Car, UsersRound, Receipt, FileText, Settings, X, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  type: "vehicle" | "customer" | "sale" | "document" | "page" | "dealer";
  id: string;
  title: string;
  subtitle?: string;
  url: string;
}

const GlobalSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const quickPages: SearchResult[] = [
    { type: "page", id: "dashboard", title: "Dashboard", url: "/dashboard" },
    { type: "page", id: "vehicles", title: "Vehicles", url: "/vehicles" },
    { type: "page", id: "customers", title: "Customers", url: "/customers" },
    { type: "page", id: "sales", title: "Sales", url: "/sales" },
    { type: "page", id: "purchases", title: "Purchases", url: "/purchases" },
    { type: "page", id: "reports", title: "Reports", url: "/reports" },
    { type: "page", id: "settings", title: "Settings", url: "/settings" },
  ];

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
    const searchData = async () => {
      if (query.length < 2) {
        setResults(quickPages.filter(p =>
          p.title.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5));
        return;
      }

      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const searchResults: SearchResult[] = [];

      // Search vehicles
      const { data: vehicles } = await supabase
        .from("vehicles")
        .select("id, brand, model, registration_number, manufacturing_year")
        .eq("user_id", user.id)
        .or(`brand.ilike.%${query}%,model.ilike.%${query}%,registration_number.ilike.%${query}%`)
        .limit(5);

      vehicles?.forEach(v => {
        searchResults.push({
          type: "vehicle",
          id: v.id,
          title: `${v.manufacturing_year} ${v.brand} ${v.model}`,
          subtitle: v.registration_number || undefined,
          url: `/vehicles?search=${v.id}`,
        });
      });

      // Search customers
      const { data: customers } = await supabase
        .from("customers")
        .select("id, full_name, phone, code")
        .eq("user_id", user.id)
        .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%,code.ilike.%${query}%`)
        .limit(5);

      customers?.forEach(c => {
        searchResults.push({
          type: "customer",
          id: c.id,
          title: c.full_name,
          subtitle: c.phone,
          url: `/customers?search=${c.id}`,
        });
      });

      // Search marketplace dealers
      const { data: dealers } = await supabase
        .from("settings")
        .select("user_id, dealer_name, dealer_address, public_page_id")
        .ilike("dealer_name", `%${query}%`)
        .eq("marketplace_enabled", true)
        .limit(3);

      dealers?.forEach(d => {
        searchResults.push({
          type: "dealer",
          id: d.user_id,
          title: d.dealer_name || "Dealer",
          subtitle: d.dealer_address || undefined,
          url: `/marketplace/dealer/${d.user_id}`,
        });
      });

      // Add matching pages
      quickPages.forEach(p => {
        if (p.title.toLowerCase().includes(query.toLowerCase())) {
          searchResults.push(p);
        }
      });

      setResults(searchResults.slice(0, 12));
      setLoading(false);
    };

    const debounce = setTimeout(searchData, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    setQuery("");
    setIsOpen(false);
  };

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

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search vehicles, customers, dealers..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-64 lg:w-80 pl-9 pr-8 h-9 bg-muted/50 border-transparent focus:border-primary focus:bg-background transition-colors"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded">
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
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left border-b border-border last:border-0"
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
