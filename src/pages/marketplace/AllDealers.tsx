import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Building2, Star, MapPin, Car, Search, ShieldCheck, Award, X, RefreshCw, Users } from "lucide-react";
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
  const [sortBy, setSortBy] = useState("rating");

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
            : 4.5,
          reviewCount: ratings[d.user_id]?.count || 0
        }))
      };
    },
    staleTime: 1000 * 60 * 5
  });

  const dealers = data?.dealers || [];

  const availableCities = useMemo(() => {
    const cities = dealers
      .map(d => {
        const parts = (d.dealer_address || "").split(",");
        return parts.length >= 2 ? parts[parts.length - 2]?.trim() : null;
      })
      .filter(Boolean);
    return [...new Set(cities)] as string[];
  }, [dealers]);

  const getDealerLocation = (address: string) => {
    const parts = address.split(",");
    if (parts.length >= 2) {
      const city = parts[parts.length - 2]?.trim();
      const state = parts[parts.length - 1]?.trim();
      return { city, state };
    }
    return { city: "Unknown", state: "" };
  };

  const filteredDealers = useMemo(() => {
    let result = dealers.filter(d => {
      const matchesSearch = !searchTerm || 
        (d.dealer_name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const { city } = getDealerLocation(d.dealer_address || "");
      const matchesCity = cityFilter === "all" || city === cityFilter;
      return matchesSearch && matchesCity;
    });

    // Sort
    switch (sortBy) {
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "vehicles":
        result.sort((a, b) => b.vehicleCount - a.vehicleCount);
        break;
      case "name":
        result.sort((a, b) => (a.dealer_name || "").localeCompare(b.dealer_name || ""));
        break;
    }

    return result;
  }, [dealers, searchTerm, cityFilter, sortBy]);

  const clearFilters = () => {
    setSearchTerm("");
    setCityFilter("all");
    setSortBy("rating");
  };

  if (isLoading) return <MarketplaceSkeleton />;

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </div>
            </Link>
            <div className="flex-1">
              <h1 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                All Dealers
              </h1>
              <p className="text-xs text-muted-foreground">{filteredDealers.length} verified dealers</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search dealers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 rounded-xl border-border bg-muted/30 focus:bg-background transition-colors"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-full sm:w-48 h-12 rounded-xl">
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
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-44 h-12 rounded-xl">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="vehicles">Most Vehicles</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filter Pills */}
        {(cityFilter !== "all" || searchTerm) && (
          <div className="flex gap-2 flex-wrap mb-4">
            {cityFilter !== "all" && (
              <Badge variant="secondary" className="rounded-full pl-3 pr-2 py-1 gap-1">
                {cityFilter}
                <button onClick={() => setCityFilter("all")} className="ml-1 hover:bg-muted rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {searchTerm && (
              <Badge variant="secondary" className="rounded-full pl-3 pr-2 py-1 gap-1">
                "{searchTerm}"
                <button onClick={() => setSearchTerm("")} className="ml-1 hover:bg-muted rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-primary h-7 text-xs">
              Clear All
            </Button>
          </div>
        )}

        {/* Dealers Grid - Enhanced Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredDealers.map((dealer, index) => {
            const location = getDealerLocation(dealer.dealer_address || "");
            return (
              <Link 
                key={dealer.id} 
                to={`/marketplace/dealer/${dealer.public_page_id}`}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-500 rounded-2xl border-0 shadow-sm group hover:-translate-y-1">
                  {/* Header with gradient */}
                  <div className="h-20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent relative">
                    {dealer.marketplace_featured && (
                      <Badge className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs">
                        <Award className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  
                  <CardContent className="p-5 -mt-10 relative">
                    <div className="flex items-start gap-4">
                      {dealer.shop_logo_url ? (
                        <img 
                          src={dealer.shop_logo_url} 
                          alt={dealer.dealer_name}
                          className="h-16 w-16 rounded-2xl object-cover border-4 border-background shadow-lg"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center border-4 border-background shadow-lg">
                          <Building2 className="h-8 w-8 text-primary-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 pt-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {dealer.dealer_name}
                          </h3>
                          <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                        </div>
                        {dealer.marketplace_badge && (
                          <Badge variant="outline" className="text-xs mt-1 rounded-md border-primary/30 text-primary">
                            {dealer.marketplace_badge}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-lg">
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">{dealer.rating?.toFixed(1)}</span>
                        </div>
                        {dealer.reviewCount > 0 && (
                          <span className="text-xs text-muted-foreground">({dealer.reviewCount})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Car className="h-4 w-4" />
                        <span className="font-medium text-foreground">{dealer.vehicleCount}</span>
                        <span>vehicles</span>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1.5 mt-3 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{location.city}{location.state ? `, ${location.state}` : ''}</span>
                    </div>

                    {/* CTA Button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-4 rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                    >
                      View Showroom
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Enhanced Empty State */}
        {filteredDealers.length === 0 && (
          <div className="text-center py-20">
            <div className="h-24 w-24 rounded-full bg-muted/50 mx-auto flex items-center justify-center mb-6">
              <Building2 className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No dealers found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              We couldn't find any dealers matching your search. Try a different keyword or city.
            </p>
            <Button onClick={clearFilters} variant="outline" className="rounded-xl gap-2">
              <RefreshCw className="h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      <MarketplaceFooter />
    </div>
  );
};

export default AllDealers;