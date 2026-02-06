import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Car, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import FooterPageSkeleton from "@/components/marketplace/FooterPageSkeleton";

const TermsPage = () => {
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (pageLoading) {
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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Terms of Service</h1>
          <p className="text-slate-500 mb-8">Last updated: January 2026</p>

          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-6 md:p-10 prose prose-slate max-w-none">
              <section className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-slate-600 leading-relaxed">
                  By accessing and using VahanHub ("Platform"), you accept and agree to be bound by the terms and provisions 
                  of this agreement. If you do not agree to these terms, please do not use our services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">2. Description of Service</h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  VahanHub is an online marketplace that connects verified vehicle dealers with buyers. Our services include:
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>Vehicle listing and discovery platform</li>
                  <li>Dealer verification and management tools</li>
                  <li>Vehicle auctions and bidding system</li>
                  <li>Lead generation and enquiry management</li>
                  <li>Analytics and reporting tools for dealers</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">3. User Accounts</h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  To access certain features, you must register for an account. You agree to:
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>Provide accurate and complete registration information</li>
                  <li>Maintain the security of your password</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized use</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">4. Dealer Obligations</h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Registered dealers must:
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>Provide accurate and truthful vehicle information</li>
                  <li>Maintain valid business registration and licenses</li>
                  <li>Respond to buyer enquiries in a timely manner</li>
                  <li>Complete transactions in good faith</li>
                  <li>Comply with all applicable laws and regulations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">5. Buyer Responsibilities</h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Buyers agree to:
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>Conduct due diligence before purchasing</li>
                  <li>Physically inspect vehicles before finalizing transactions</li>
                  <li>Verify all documents independently</li>
                  <li>Complete payments through secure channels</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">6. Auctions and Bidding</h2>
                <p className="text-slate-600 leading-relaxed">
                  Participation in auctions is binding. Winning bidders must complete the purchase unless the seller 
                  fails to confirm. Repeated bid defaults may result in account suspension.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">7. Limitation of Liability</h2>
                <p className="text-slate-600 leading-relaxed">
                  VahanHub is a marketplace platform and does not own or sell vehicles. We are not responsible for:
                  vehicle condition, accuracy of listings, or disputes between buyers and dealers. All transactions 
                  are between the buyer and dealer directly.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">8. Intellectual Property</h2>
                <p className="text-slate-600 leading-relaxed">
                  All content on VahanHub, including logos, text, graphics, and software, is our property and protected 
                  by copyright laws. Users may not copy, modify, or distribute our content without permission.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">9. Termination</h2>
                <p className="text-slate-600 leading-relaxed">
                  We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent 
                  activity, or harm other users or our platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">10. Changes to Terms</h2>
                <p className="text-slate-600 leading-relaxed">
                  We may update these terms from time to time. Continued use of the platform after changes constitutes 
                  acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-900 mb-4">11. Contact Information</h2>
                <p className="text-slate-600 leading-relaxed">
                  For questions about these Terms of Service, please contact us at{" "}
                  <a href="mailto:legal@vahanhub.com" className="text-blue-600 hover:underline">legal@vahanhub.com</a>
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>

      <MarketplaceFooter />
    </div>
  );
};

export default TermsPage;
