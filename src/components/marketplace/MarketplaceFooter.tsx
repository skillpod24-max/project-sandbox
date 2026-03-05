import { Link } from "react-router-dom";
import { Car, Facebook, Twitter, Instagram, Youtube } from "lucide-react";

const MarketplaceFooter = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-10 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">VahanHub</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              India's most trusted vehicle marketplace. Buy & sell with confidence.
            </p>
            <div className="flex gap-3">
              <a href="#" className="h-9 w-9 rounded-full bg-muted hover:bg-blue-600 hover:text-white text-muted-foreground flex items-center justify-center transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-muted hover:bg-sky-500 hover:text-white text-muted-foreground flex items-center justify-center transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-muted hover:bg-pink-600 hover:text-white text-muted-foreground flex items-center justify-center transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-muted hover:bg-red-600 hover:text-white text-muted-foreground flex items-center justify-center transition-colors">
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* For Buyers */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">For Buyers</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/marketplace/vehicles" className="hover:text-foreground transition-colors">Browse All Vehicles</Link></li>
              <li><Link to="/marketplace/dealers" className="hover:text-foreground transition-colors">Browse Dealers</Link></li>
              <li><Link to="/marketplace/compare" className="hover:text-foreground transition-colors">Compare Cars</Link></li>
              <li><Link to="/how-it-works" className="hover:text-foreground transition-colors">How It Works</Link></li>
              <li><Link to="/faq" className="hover:text-foreground transition-colors">FAQs</Link></li>
            </ul>
          </div>

          {/* For Dealers */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">For Dealers</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/auth" className="hover:text-foreground transition-colors">Dealer Login</Link></li>
              <li><Link to="/auth" className="hover:text-foreground transition-colors">Register as Dealer</Link></li>
              <li><Link to="/sell-vehicle" className="hover:text-foreground transition-colors">List Your Vehicle</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Resources</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog & Guides</Link></li>
              <li><Link to="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              <li><Link to="/how-it-works" className="hover:text-foreground transition-colors">How It Works</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Support</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/faq" className="hover:text-foreground transition-colors">FAQs</Link></li>
              <li><Link to="/contact" className="hover:text-foreground transition-colors">Help Center</Link></li>
              <li><Link to="/contact#report" className="hover:text-foreground transition-colors">Report an Issue</Link></li>
              <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} VahanHub. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
              <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
              <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MarketplaceFooter;
