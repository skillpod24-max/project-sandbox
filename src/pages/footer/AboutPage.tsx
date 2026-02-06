import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, Users, Shield, Award, Target, Heart, ArrowLeft } from "lucide-react";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import FooterPageSkeleton from "@/components/marketplace/FooterPageSkeleton";

const AboutPage = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <FooterPageSkeleton />;
  }

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
          <h1 className="text-4xl font-bold text-slate-900 mb-4">About VahanHub</h1>
          <p className="text-lg text-slate-600">
            India's trusted marketplace connecting verified dealers with buyers looking for quality pre-owned vehicles.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6">
              <Target className="h-10 w-10 text-white mb-4" />
              <h2 className="text-2xl font-bold text-white">Our Mission</h2>
            </div>
            <CardContent className="p-6">
              <p className="text-slate-600 leading-relaxed">
                To revolutionize the used vehicle market in India by bringing transparency, trust, and technology 
                to every transaction. We empower dealers with digital tools while giving buyers confidence in 
                their purchase decisions.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-6">
              <Heart className="h-10 w-10 text-white mb-4" />
              <h2 className="text-2xl font-bold text-white">Our Vision</h2>
            </div>
            <CardContent className="p-6">
              <p className="text-slate-600 leading-relaxed">
                To become India's most trusted platform for pre-owned vehicles, where every buyer finds their 
                perfect vehicle and every dealer grows their business with the power of technology.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Our Core Values</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: "Trust", description: "Verified dealers and transparent listings" },
              { icon: Users, title: "Community", description: "Building relationships that last" },
              { icon: Award, title: "Quality", description: "Only the best vehicles make it to our platform" },
              { icon: Target, title: "Innovation", description: "Constantly improving with technology" },
            ].map((value, i) => (
              <Card key={i} className="border-0 shadow-sm rounded-xl text-center p-6">
                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{value.title}</h3>
                <p className="text-sm text-slate-500">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 md:p-12 text-white mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "500+", label: "Verified Dealers" },
              { value: "10,000+", label: "Vehicles Listed" },
              { value: "50,000+", label: "Happy Customers" },
              { value: "100+", label: "Cities Covered" },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-4xl font-bold mb-2">{stat.value}</p>
                <p className="text-blue-200">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to Find Your Perfect Vehicle?</h2>
          <div className="flex justify-center gap-4">
            <Link to="/">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Browse Vehicles
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <MarketplaceFooter />
    </div>
  );
};

export default AboutPage;
