import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Car, DollarSign, CheckCircle, Shield, Clock, Users, ArrowRight,
  Camera, FileText, MapPin, Phone, TrendingUp, Star, Sparkles
} from "lucide-react";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";

const SellVehicle = () => {
  const steps = [
    {
      icon: FileText,
      title: "Enter Vehicle Details",
      description: "Share your car's info like brand, model, year, and kilometers driven"
    },
    {
      icon: Camera,
      title: "Upload Photos",
      description: "Add clear photos of your vehicle to attract more buyers"
    },
    {
      icon: MapPin,
      title: "Provide Location",
      description: "Tell us where your vehicle is located for pickup"
    },
    {
      icon: DollarSign,
      title: "Get Best Price",
      description: "Our network of verified dealers will contact you with offers"
    }
  ];

  const benefits = [
    { icon: Shield, title: "Safe & Secure", description: "Verified dealers only" },
    { icon: Clock, title: "Quick Response", description: "Get offers within 24 hours" },
    { icon: Users, title: "Multiple Dealers", description: "Compare offers from many dealers" },
    { icon: TrendingUp, title: "Best Price", description: "Competitive pricing guaranteed" },
  ];

  const stats = [
    { value: "50K+", label: "Cars Sold" },
    { value: "500+", label: "Verified Dealers" },
    { value: "24hrs", label: "Avg Response Time" },
    { value: "4.8★", label: "Customer Rating" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">VahanHub</span>
            </Link>
            <Link to="/">
              <Button variant="ghost">Back to Marketplace</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 1200 600" fill="none">
            <ellipse cx="200" cy="500" rx="400" ry="200" fill="white"/>
            <ellipse cx="1000" cy="100" rx="300" ry="150" fill="white"/>
          </svg>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Trusted by 50,000+ sellers</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Sell Your Car at the <span className="text-yellow-300">Best Price</span>
            </h1>
            
            <p className="text-xl md:text-2xl opacity-90 mb-8">
              Get instant offers from verified dealers. No haggling, no hassle.
            </p>

            <Link to="/sell-vehicle/form">
              <Button size="lg" className="bg-white text-emerald-600 hover:bg-slate-100 shadow-xl gap-2 rounded-full px-10 py-6 text-lg">
                Start Selling Now
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-2xl mx-auto">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                  <div className="text-sm opacity-80">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-600">Sell your car in 4 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {steps.map((step, i) => (
              <div key={i} className="text-center relative">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-10 w-10 text-emerald-600" />
                </div>
                <div className="absolute -top-2 -right-2 md:right-1/4 h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-600">{step.description}</p>
                
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 -right-4 w-8">
                    <ArrowRight className="h-6 w-6 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/sell-vehicle/form">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-8">
                Get Started <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Why Sell With VahanHub?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, i) => (
              <Card key={i} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{benefit.title}</h3>
                  <p className="text-sm text-slate-600">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Sell Your Vehicle?
            </h2>
            <p className="text-lg text-slate-300 mb-8">
              Join thousands of happy sellers who got the best price for their cars
            </p>
            <Link to="/sell-vehicle/form">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-10 py-6 text-lg">
                Sell My Car Now <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <MarketplaceFooter />
    </div>
  );
};

export default SellVehicle;
