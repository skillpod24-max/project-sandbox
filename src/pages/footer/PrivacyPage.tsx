import { Link } from "react-router-dom";
import { Car, ArrowLeft, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";

const PrivacyPage = () => {
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
          {/* Header Card */}
          <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white mb-8">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-4">
                <Shield className="h-12 w-12" />
                <div>
                  <h1 className="text-3xl font-bold">Privacy Policy</h1>
                  <p className="text-blue-200">Your privacy is important to us</p>
                </div>
              </div>
              <p className="text-blue-100">Last updated: January 2026</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-6 md:p-10 prose prose-slate max-w-none">
              <section className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">1. Information We Collect</h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  We collect information to provide better services to our users:
                </p>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Personal Information</h3>
                <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
                  <li>Name, email address, and phone number</li>
                  <li>Location and address details</li>
                  <li>Vehicle preferences and search history</li>
                  <li>Communication records with dealers</li>
                </ul>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">For Dealers</h3>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>Business registration details and GST number</li>
                  <li>Showroom photos and address</li>
                  <li>Bank account information for payments</li>
                  <li>Vehicle inventory and transaction history</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">2. How We Use Your Information</h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  We use collected information to:
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Connect buyers with relevant dealers</li>
                  <li>Process transactions and send confirmations</li>
                  <li>Send promotional communications (with consent)</li>
                  <li>Prevent fraud and enhance security</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">3. Information Sharing</h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  We do not sell your personal information. We may share information:
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>With dealers when you submit an enquiry</li>
                  <li>With service providers who assist our operations</li>
                  <li>When required by law or legal process</li>
                  <li>To protect our rights and prevent fraud</li>
                  <li>In aggregated, anonymized form for analytics</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">4. Data Security</h2>
                <p className="text-slate-600 leading-relaxed">
                  We implement industry-standard security measures including encryption, secure servers, 
                  and access controls to protect your data. However, no method of transmission over the 
                  internet is 100% secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">5. Cookies and Tracking</h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  We use cookies and similar technologies to:
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>Remember your preferences and settings</li>
                  <li>Understand how you use our platform</li>
                  <li>Improve user experience</li>
                  <li>Show relevant advertisements</li>
                </ul>
                <p className="text-slate-600 leading-relaxed mt-4">
                  You can control cookies through your browser settings.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">6. Your Rights</h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate data</li>
                  <li>Delete your account and data</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Export your data in a portable format</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">7. Data Retention</h2>
                <p className="text-slate-600 leading-relaxed">
                  We retain your information as long as your account is active or as needed to provide 
                  services. We may retain certain information for legal compliance, dispute resolution, 
                  and enforcement of agreements.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">8. Children's Privacy</h2>
                <p className="text-slate-600 leading-relaxed">
                  Our services are not intended for users under 18 years of age. We do not knowingly 
                  collect information from children.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">9. Updates to This Policy</h2>
                <p className="text-slate-600 leading-relaxed">
                  We may update this policy periodically. We will notify you of significant changes 
                  through email or a notice on our platform.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-900 mb-4">10. Contact Us</h2>
                <p className="text-slate-600 leading-relaxed">
                  For privacy-related questions or to exercise your rights, contact our Data Protection Officer at{" "}
                  <a href="mailto:privacy@vahanhub.com" className="text-blue-600 hover:underline">privacy@vahanhub.com</a>
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

export default PrivacyPage;
