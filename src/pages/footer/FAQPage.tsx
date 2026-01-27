import { Link } from "react-router-dom";
import { Car, ArrowLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import { useState } from "react";

const FAQPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const faqCategories = [
    {
      title: "For Buyers",
      faqs: [
        {
          question: "How do I search for vehicles?",
          answer: "Use our search bar and filters on the marketplace page. You can filter by brand, price range, fuel type, transmission, and location to find your perfect vehicle."
        },
        {
          question: "Are all dealers verified?",
          answer: "Yes, all dealers on VahanHub go through a strict verification process. We verify their business documents, showroom, and track record before approving them on our platform."
        },
        {
          question: "How do I contact a dealer?",
          answer: "You can contact dealers through multiple channels - send an enquiry form, click on WhatsApp to chat directly, or call them using the provided phone number."
        },
        {
          question: "Can I compare multiple vehicles?",
          answer: "Yes! You can add up to 3 vehicles to compare side-by-side. Look for the 'Compare' button on vehicle cards to add them to your comparison list."
        },
        {
          question: "Is financing available?",
          answer: "Yes, most dealers offer EMI options. Use our built-in EMI calculator to estimate monthly payments. Dealers can also connect you with partner banks for financing."
        },
        {
          question: "What documents do I need to buy a vehicle?",
          answer: "Typically you need: Valid ID proof (Aadhaar/PAN), Address proof, Passport photos, and for financing: Income proof and bank statements."
        },
      ]
    },
    {
      title: "For Dealers",
      faqs: [
        {
          question: "How do I register as a dealer?",
          answer: "Click on 'Register as Dealer' and fill out the registration form. You'll need to provide business details, GST number, and showroom photos. Our team will verify and approve your account within 24-48 hours."
        },
        {
          question: "How much does it cost to list vehicles?",
          answer: "Basic listing is free for all verified dealers. We offer premium features like featured listings and priority placement for additional visibility at competitive prices."
        },
        {
          question: "How do I manage my listings?",
          answer: "Access your dealer dashboard to add, edit, or remove vehicle listings. You can also track enquiries, view analytics, and manage your profile from the dashboard."
        },
        {
          question: "Can I participate in auctions?",
          answer: "Yes! Once verified, you can participate in our real-time vehicle auctions. You'll receive notifications for new auctions matching your interests."
        },
        {
          question: "How do I get more visibility for my listings?",
          answer: "Ensure complete and accurate listings with high-quality photos. Featured listings appear at the top and get more views. You can also earn badges through good performance."
        },
      ]
    },
    {
      title: "About Auctions",
      faqs: [
        {
          question: "How do vehicle auctions work?",
          answer: "Vehicles are listed with a starting price and auction duration. Dealers can place bids in real-time. The highest bidder at the end wins. After winning, there's a post-bid confirmation process."
        },
        {
          question: "What happens after I win an auction?",
          answer: "After winning, both the seller and buyer go through a confirmation process. Once confirmed, payment is collected and the vehicle handover process begins."
        },
        {
          question: "Can I cancel my bid?",
          answer: "Bids cannot be cancelled once placed. Please bid responsibly. Repeated bid cancellations may affect your dealer rating."
        },
      ]
    },
    {
      title: "Payments & Security",
      faqs: [
        {
          question: "Is my data secure?",
          answer: "Yes, we use industry-standard encryption and security measures to protect your data. We never share your personal information without your consent."
        },
        {
          question: "What payment methods are accepted?",
          answer: "For vehicle purchases, dealers accept bank transfers, cheques, and cash. EMI options are available through partner banks."
        },
        {
          question: "What if I face issues with a dealer?",
          answer: "Contact our support team with details of the issue. We investigate all complaints and take action against dealers who violate our policies."
        },
      ]
    },
  ];

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq => 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0);

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
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-slate-600 mb-8">
            Find answers to common questions about buying, selling, and using VahanHub.
          </p>
          
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 rounded-xl"
            />
          </div>
        </div>

        {/* FAQ Sections */}
        <div className="max-w-3xl mx-auto space-y-8">
          {filteredCategories.map((category, i) => (
            <div key={i}>
              <h2 className="text-xl font-bold text-slate-900 mb-4">{category.title}</h2>
              <Accordion type="single" collapsible className="space-y-2">
                {category.faqs.map((faq, j) => (
                  <AccordionItem key={j} value={`${i}-${j}`} className="bg-white rounded-xl border-0 shadow-sm px-6">
                    <AccordionTrigger className="text-left font-medium hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}

          {filteredCategories.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <p className="text-lg">No FAQs found matching your search.</p>
              <p className="text-sm mt-2">Try different keywords or browse all questions.</p>
            </div>
          )}
        </div>

        {/* Still have questions */}
        <div className="text-center mt-16 bg-blue-50 rounded-3xl p-8 max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Still have questions?</h2>
          <p className="text-slate-600 mb-6">Can't find what you're looking for? Our support team is here to help.</p>
          <Link to="/contact" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium">
            Contact Support
          </Link>
        </div>
      </div>

      <MarketplaceFooter />
    </div>
  );
};

export default FAQPage;
