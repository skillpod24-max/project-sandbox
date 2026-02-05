import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Building2, Star, MapPin, Car, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarketplaceSkeleton } from "@/components/marketplace/ShimmerSkeleton";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";

const AllDealers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("all");

  // Fetch all marketplace dealers
  const { data, isLoading } = useQuery({
    queryKey: ['all-dealers'],
    queryFn: async () => {
      const { data: dealers } = await supabase
        .from("settings")
        .select("*")
        .eq("public_page_enabled", true)
        .eq("marketplace_enabled", true);

      const dealerIds = (dealers || []).map(d => d.user_id);

      // Fetch vehicle counts
      const { data: vehicles } = await supabase
        .from("vehicles")
        .select("user_id")
        .in("user_id", dealerIds)
        .eq("is_public", true)
        .eq("status", "in_stock");

      const vehicleCount: Record<string, number> = {};
      (vehicles || []).forEach(v => {
        vehicleCount[v.user_id] = (vehicleCount[v.user_id] || 0) + 1;
      });

      // Fetch testimonials for ratings
      const { data: testimonials } = await supabase
        .from("dealer_testimonials")
        .select("user_id, rating")
        .in("user_id", dealerIds)
        .eq("is_verified", true);

      const ratings: Record<string, { sum: number; count: number }> = {};
      (testimonials || []).forEach(t => {
        if (!ratings[t.user_id]) ratings[t.user_id] = { sum: 0, count: 0 };
        ratings[t.user_id].sum += t.rating;
        ratings[t.user_id].count += 1;
      });

      return {
        dealers: (dealers || []).map(d => ({
          ...d,
          vehicleCount: vehicleCount[d.user_id] || 0,
          rating: ratings[d.user_id] 
            ? ratings[d.user_id].sum / ratings[d.user_id].count 
            : 4.5
        }))
      };
    },
    staleTime: 1000 * 60 * 5
  });

  const dealers = data?.dealers || [];

  // Get cities from dealers
  const availableCities = useMemo(() => {
    const cities = dealers
      .map(d => {
        const parts = (d.dealer_address || "").split(",");
        return parts.length >= 2 ? parts[parts.length - 2]?.trim() : null;
      })
      .filter(Boolean);
    return [...new Set(cities)] as string[];
  }, [dealers]);

  const getDealerCity = (address: string) => {
    const parts = address.split(",");
    return parts.length >= 2 ? parts[parts.length - 2]?.trim() : "Unknown";
  };

  const filteredDealers = useMemo(() => {
    return dealers.filter(d => {
      const matchesSearch = !searchTerm || 
        (d.dealer_name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const city = getDealerCity(d.dealer_address || "");
      const matchesCity = cityFilter === "all" || city === cityFilter;
      return matchesSearch && matchesCity;
    });
  }, [dealers, searchTerm, cityFilter]);

  if (isLoading) return <MarketplaceSkeleton />;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-foreground">All Dealers</h1>
            <p className="text-xs text-muted-foreground">{filteredDealers.length} dealers</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search dealers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {availableCities.map(city => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dealers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDealers.map(dealer => (
            <Link key={dealer.id} to={`/marketplace/dealer/${dealer.public_page_id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-all rounded-2xl border-0 shadow-sm group">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {dealer.shop_logo_url ? (
                      <img 
                        src={dealer.shop_logo_url} 
                        alt={dealer.dealer_name}
                        className="h-16 w-16 rounded-xl object-cover border border-border"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">{dealer.dealer_name}</h3>
                        {dealer.marketplace_badge && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {dealer.marketplace_badge}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-medium">{dealer.rating?.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{getDealerCity(dealer.dealer_address || "")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Car className="h-4 w-4" />
                      <span>{dealer.vehicleCount} vehicles</span>
                    </div>
                    <Button size="sm" variant="ghost" className="text-primary">
                      View Dealer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {filteredDealers.length === 0 && (
          <div className="text-center py-16">
            <Building2 className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-foreground">No dealers found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
          </div>
        )}
      </div>

      <MarketplaceFooter />
    </div>
  );
};

export default AllDealers;
