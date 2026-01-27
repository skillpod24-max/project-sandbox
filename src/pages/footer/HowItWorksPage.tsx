import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, Search, MessageCircle, CheckCircle, ArrowLeft, ArrowRight, Shield, Gavel } from "lucide-react";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";

const HowItWorksPage = () => {
  const buyerSteps = [
    {
      icon: Search,
      title: "Search & Browse",
      description: "Browse thousands of verified vehicles from trusted dealers. Use filters to find your perfect match by brand, price, location, and more."
    },
    {
      icon: MessageCircle,
      title: "Connect with Dealers",
      description: "Send enquiries directly to dealers, chat on WhatsApp, or call them instantly. Get the best quotes and negotiate with confidence."
    },
    {
      icon: CheckCircle,
      title: "Inspect & Test Drive",
      description: "Schedule a test drive at the dealer's location. Check the vehicle's condition, documents, and service history."
    },
    {
      icon: Shield,
      title: "Buy with Confidence",
      description: "Complete your purchase with peace of mind. All dealers are verified and vehicles come with complete documentation."
    },
  ];

  const dealerSteps = [
    {
      icon: Car,
      title: "List Your Inventory",
      description: "Add your vehicles with detailed specifications, photos, and pricing. Our system makes listing easy and fast."
    },
    {
      icon: Search,
      title: "Get Discovered",
      description: "Your vehicles appear in search results. Featured listings get more visibility and attract more buyers."
    },
    {
      icon: MessageCircle,
      title: "Receive Enquiries",
      description: "Get leads directly from interested buyers. Track and manage all enquiries from your dealer dashboard."
    },
    {
      icon: Gavel,
      title: "Close Deals",
      description: "Convert leads into sales. Use our EMI calculator, comparison tools, and more to help close deals faster."
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Marketplace</span>
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <Car className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-slate-900">VahanHub</span>
          </Link>
          <div className="w-24" />
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">How VahanHub Works</h1>
          <p className="text-lg text-slate-600">
            Whether you're buying your dream vehicle or selling your inventory, VahanHub makes it simple, secure, and seamless.
          </p>
        </div>

        {/* For Buyers */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">For Buyers</h2>
          <p className="text-slate-500 text-center mb-10">Find and buy your perfect vehicle in 4 simple steps</p>
          
          <div className="grid md:grid-cols-4 gap-6 relative">
            {buyerSteps.map((step, i) => (
              <div key={i} className="relative">
                <Card className="border-0 shadow-sm rounded-xl p-6 h-full">
                  <div className="h-12 w-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-4">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold text-blue-600 mb-2 block">Step {i + 1}</span>
                  <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-500">{step.description}</p>
                </Card>
                {i < buyerSteps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300 z-10" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* For Dealers */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">For Dealers</h2>
          <p className="text-slate-500 text-center mb-10">Grow your business with VahanHub</p>
          
          <div className="grid md:grid-cols-4 gap-6">
            {dealerSteps.map((step, i) => (
              <div key={i} className="relative">
                <Card className="border-0 shadow-sm rounded-xl p-6 h-full bg-slate-900 text-white">
                  <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold text-blue-400 mb-2 block">Step {i + 1}</span>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-400">{step.description}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <Card className="border-0 shadow-lg rounded-3xl bg-gradient-to-br from-blue-50 to-blue-100 p-8 md:p-12 mb-16">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Why Choose VahanHub?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Verified Dealers Only", description: "All dealers go through a strict verification process" },
              { title: "Transparent Pricing", description: "No hidden charges, what you see is what you pay" },
              { title: "Complete Documentation", description: "All vehicles come with verified documents" },
              { title: "Easy EMI Options", description: "Flexible financing options from leading banks" },
              { title: "Vehicle Comparison", description: "Compare multiple vehicles side by side" },
              { title: "Real-time Auctions", description: "Participate in live vehicle auctions" },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                  <p className="text-sm text-slate-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to Get Started?</h2>
          <div className="flex justify-center gap-4">
            <Link to="/">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Browse Vehicles
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline">
                Register as Dealer
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <MarketplaceFooter />
    </div>
  );
};

export default HowItWorksPage;
