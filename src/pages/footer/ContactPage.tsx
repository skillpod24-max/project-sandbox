import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, Phone, Mail, MapPin, ArrowLeft, Send, MessageCircle, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import FooterPageSkeleton from "@/components/marketplace/FooterPageSkeleton";
import { supabase } from "@/integrations/supabase/client";

const ContactPage = () => {
  const { toast } = useToast();
  const location = useLocation();
  const isReportMode = location.hash === "#report";
  const [pageLoading, setPageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"contact" | "report">(isReportMode ? "report" : "contact");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: isReportMode ? "complaint" : "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isReportMode) {
      setActiveTab("report");
      setForm(f => ({ ...f, subject: "complaint" }));
    }
  }, [isReportMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // Insert into support_tickets table
      const { error: insertError } = await supabase
        .from("support_tickets" as any)
        .insert({
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          subject: form.subject || "general",
          message: form.message,
          status: "open",
        } as any);

      if (insertError) throw insertError;

      // Send email notification to admin
      try {
        await supabase.functions.invoke("send-email", {
          body: {
            to: "upcurvinnovations@gmail.com",
            subject: `[VahanHub ${activeTab === "report" ? "Issue Report" : "Contact"}] ${form.subject || "General"} - ${form.name}`,
            html: `
              <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 16px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 32px 24px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">🚗 VahanHub</h1>
                  <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">
                    ${activeTab === "report" ? "⚠️ New Issue Report" : "📬 New Contact Message"}
                  </p>
                </div>
                <div style="padding: 24px;">
                  <div style="background: #ffffff; border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid #e2e8f0;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px; width: 120px;">Name</td><td style="padding: 8px 0; font-weight: 600; color: #1e293b;">${form.name}</td></tr>
                      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px;">Email</td><td style="padding: 8px 0; color: #1e293b;"><a href="mailto:${form.email}" style="color: #2563eb;">${form.email}</a></td></tr>
                      ${form.phone ? `<tr><td style="padding: 8px 0; color: #64748b; font-size: 13px;">Phone</td><td style="padding: 8px 0; color: #1e293b;"><a href="tel:${form.phone}" style="color: #2563eb;">${form.phone}</a></td></tr>` : ""}
                      <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px;">Subject</td><td style="padding: 8px 0; color: #1e293b;"><span style="background: #dbeafe; color: #1d4ed8; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">${form.subject || "General"}</span></td></tr>
                    </table>
                  </div>
                  <div style="background: #ffffff; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 8px; color: #64748b; font-size: 13px; font-weight: 600;">Message</p>
                    <p style="margin: 0; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">${form.message}</p>
                  </div>
                  <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 24px;">
                    Received at ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
                  </p>
                </div>
              </div>
            `,
          },
        });
      } catch (emailErr) {
        console.error("Email notification failed:", emailErr);
      }

      toast({ title: "Submitted successfully!", description: "We'll get back to you within 24 hours." });
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (error: any) {
      console.error("Submit error:", error);
      toast({ title: "Failed to submit", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

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
        {/* Tab Switcher */}
        <div className="flex justify-center gap-2 mb-8">
          <button
            onClick={() => setActiveTab("contact")}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${activeTab === "contact" ? "bg-blue-600 text-white shadow-md" : "bg-white text-slate-600 border hover:bg-slate-50"}`}
          >
            <Mail className="h-4 w-4 inline mr-2" />Contact Us
          </button>
          <button
            onClick={() => setActiveTab("report")}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${activeTab === "report" ? "bg-red-600 text-white shadow-md" : "bg-white text-slate-600 border hover:bg-slate-50"}`}
          >
            <AlertTriangle className="h-4 w-4 inline mr-2" />Report an Issue
          </button>
        </div>

        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            {activeTab === "report" ? "Report an Issue" : "Contact Us"}
          </h1>
          <p className="text-lg text-slate-600">
            {activeTab === "report"
              ? "Found a problem? Let us know and we'll fix it promptly."
              : "Have questions or need assistance? We're here to help you 24/7."}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Contact Info */}
          <div className="space-y-6">
            <Card className="border-0 shadow-sm rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Phone className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Phone Support</h3>
                  <p className="text-slate-600">+91 1800-123-4567</p>
                  <p className="text-sm text-slate-500">Mon-Sat: 9AM - 8PM</p>
                </div>
              </div>
            </Card>
            <Card className="border-0 shadow-sm rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <MessageCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">WhatsApp</h3>
                  <p className="text-slate-600">+91 98765-43210</p>
                  <p className="text-sm text-slate-500">Quick responses</p>
                </div>
              </div>
            </Card>
            <Card className="border-0 shadow-sm rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                  <Mail className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Email</h3>
                  <p className="text-slate-600">support@vahanhub.com</p>
                  <p className="text-sm text-slate-500">We reply within 24 hours</p>
                </div>
              </div>
            </Card>
            <Card className="border-0 shadow-sm rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <MapPin className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Office</h3>
                  <p className="text-slate-600">123 Tech Park, Sector 18</p>
                  <p className="text-sm text-slate-500">Gurugram, Haryana 122001</p>
                </div>
              </div>
            </Card>
            <Card className="border-0 shadow-sm rounded-xl p-6 bg-blue-600 text-white">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Business Hours</h3>
                  <p className="text-blue-100">Monday - Saturday</p>
                  <p className="text-sm text-blue-200">9:00 AM - 8:00 PM IST</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Contact / Report Form */}
          <Card className="border-0 shadow-lg rounded-2xl lg:col-span-2">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                {activeTab === "report" ? "📋 Describe Your Issue" : "Send us a Message"}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input type="email" placeholder="your@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                      <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                      <SelectContent>
                        {activeTab === "report" ? (
                          <>
                            <SelectItem value="complaint">Bug / Issue</SelectItem>
                            <SelectItem value="dealer_issue">Dealer Issue</SelectItem>
                            <SelectItem value="payment_issue">Payment / Fraud</SelectItem>
                            <SelectItem value="vehicle_issue">Vehicle Listing Issue</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="general">General Inquiry</SelectItem>
                            <SelectItem value="buying">Buying a Vehicle</SelectItem>
                            <SelectItem value="selling">Selling/Dealer Registration</SelectItem>
                            <SelectItem value="support">Technical Support</SelectItem>
                            <SelectItem value="complaint">Complaint</SelectItem>
                            <SelectItem value="partnership">Partnership</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{activeTab === "report" ? "Describe the issue *" : "Message *"}</Label>
                  <Textarea
                    placeholder={activeTab === "report" ? "Please describe the issue in detail..." : "How can we help you?"}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={5}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className={`w-full h-12 ${activeTab === "report" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}
                  disabled={submitting}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? "Submitting..." : activeTab === "report" ? "Submit Report" : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <MarketplaceFooter />
    </div>
  );
};

export default ContactPage;
