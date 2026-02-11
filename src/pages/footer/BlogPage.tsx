import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, User, ChevronRight, Car, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";

const blogPosts = [
  {
    id: "used-car-buying-guide",
    title: "Complete Guide to Buying a Used Car in India (2026)",
    excerpt: "Everything you need to know before purchasing a pre-owned vehicle — from inspection tips to negotiation strategies.",
    category: "Buying Guide",
    date: "Feb 8, 2026",
    readTime: "8 min read",
    author: "VahanHub Team",
  },
  {
    id: "best-cars-under-5-lakh",
    title: "Top 10 Best Used Cars Under ₹5 Lakh in 2026",
    excerpt: "Looking for an affordable ride? Here are the most value-for-money second-hand cars available in the Indian market.",
    category: "Top Picks",
    date: "Feb 5, 2026",
    readTime: "6 min read",
    author: "VahanHub Team",
  },
  {
    id: "ev-buying-guide",
    title: "Should You Buy a Used Electric Vehicle? Pros & Cons",
    excerpt: "Electric vehicles are gaining popularity. Here's what to consider before buying a pre-owned EV including battery health checks.",
    category: "Electric Vehicles",
    date: "Jan 28, 2026",
    readTime: "7 min read",
    author: "VahanHub Team",
  },
  {
    id: "car-insurance-tips",
    title: "Car Insurance for Used Vehicles: A Complete Guide",
    excerpt: "Understanding insurance transfer, renewal, and the best policies for second-hand car buyers in India.",
    category: "Insurance",
    date: "Jan 20, 2026",
    readTime: "5 min read",
    author: "VahanHub Team",
  },
  {
    id: "vehicle-inspection-checklist",
    title: "150-Point Vehicle Inspection Checklist for Buyers",
    excerpt: "Use this comprehensive checklist to evaluate any used car before making your purchase decision.",
    category: "Inspection",
    date: "Jan 15, 2026",
    readTime: "10 min read",
    author: "VahanHub Team",
  },
  {
    id: "sell-car-best-price",
    title: "How to Sell Your Car at the Best Price",
    excerpt: "Tips and strategies to maximize the resale value of your vehicle when listing it on a marketplace.",
    category: "Selling Tips",
    date: "Jan 10, 2026",
    readTime: "6 min read",
    author: "VahanHub Team",
  },
  {
    id: "emi-finance-guide",
    title: "EMI & Financing Options for Used Car Purchases",
    excerpt: "Compare interest rates, down payments, and loan tenures from top banks and NBFCs for pre-owned vehicles.",
    category: "Finance",
    date: "Jan 5, 2026",
    readTime: "7 min read",
    author: "VahanHub Team",
  },
  {
    id: "rto-transfer-process",
    title: "RTO Transfer Process: Step-by-Step Guide",
    excerpt: "Complete walkthrough of the vehicle ownership transfer process, required documents, and fees across Indian states.",
    category: "Legal",
    date: "Dec 28, 2025",
    readTime: "8 min read",
    author: "VahanHub Team",
  },
];

const BlogPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4">
          <div className="h-14 flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
                <ArrowLeft className="h-5 w-5" />
              </div>
            </Link>
            <div>
              <h1 className="font-bold text-lg text-foreground">Blog & Guides</h1>
              <p className="text-xs text-muted-foreground">Expert advice for buying & selling vehicles</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Featured Post */}
        <Card className="mb-8 overflow-hidden border-0 shadow-lg rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700">
          <CardContent className="p-8 text-white">
            <Badge className="bg-white/20 text-white border-0 mb-4">{blogPosts[0].category}</Badge>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">{blogPosts[0].title}</h2>
            <p className="text-blue-100 mb-4 max-w-2xl">{blogPosts[0].excerpt}</p>
            <div className="flex items-center gap-4 text-sm text-blue-200">
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{blogPosts[0].date}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{blogPosts[0].readTime}</span>
            </div>
          </CardContent>
        </Card>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.slice(1).map((post) => (
            <Card key={post.id} className="overflow-hidden border border-border hover:shadow-lg transition-shadow rounded-2xl group cursor-pointer">
              <div className="h-40 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                <Car className="h-12 w-12 text-muted-foreground/30 group-hover:scale-110 transition-transform" />
              </div>
              <CardContent className="p-5">
                <Badge variant="outline" className="mb-3 text-xs">{post.category}</Badge>
                <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">{post.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{post.date}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default BlogPage;
