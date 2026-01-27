import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createPublicLead } from "@/lib/leads";
import { trackPublicEvent } from "@/lib/publicAnalytics";

interface DealerEnquiryFormProps {
  dealerInfo: any;
  pageId: string;
  compact?: boolean;
}

export default function DealerEnquiryForm({
  dealerInfo,
  pageId,
  compact = false,
}: DealerEnquiryFormProps) {
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    message: "",
    leadType: "buying",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    if (!form.name || !form.phone) {
      toast({ title: "Name & phone required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const notes = [
        `[${form.leadType.toUpperCase()}]`,
        form.city && `City: ${form.city}`,
        form.message,
      ]
        .filter(Boolean)
        .join(" | ");

      await createPublicLead({
        dealerUserId: dealerInfo.user_id,
        customerName: form.name,
        phone: form.phone,
        email: form.email || undefined,
        city: form.city || undefined,
        notes: notes || undefined,
        source: "website",
        lead_type: form.leadType,
      });

      await trackPublicEvent({
        eventType: "enquiry_submit",
        dealerUserId: dealerInfo.user_id,
        publicPageId: pageId,
      });

      setSubmitted(true);
      toast({ title: "Enquiry sent successfully" });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-6">
        <CheckCircle className="h-10 w-10 mx-auto text-emerald-500 mb-2" />
        <p className="font-semibold">Enquiry submitted!</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => {
            setSubmitted(false);
            setForm({
              name: "",
              phone: "",
              email: "",
              city: "",
              message: "",
              leadType: "buying",
            });
          }}
        >
          Send another
        </Button>
      </div>
    );
  }

  return (
    
    <Card className={compact ? "border-0 shadow-none" : ""}>
  <div className="mb-4 text-center">
    <h3 className="text-lg font-semibold text-gray-900">
      Get the Best Quote
    </h3>
    <p className="text-xs text-gray-500 mt-1">
      Fill this form and we’ll contact you shortly
    </p>
  </div>

      <CardContent className="space-y-3">
        <div className="flex gap-2">
          {["buying", "selling"].map((t) => (
            <Button
              key={t}
              size="sm"
              variant={form.leadType === t ? "default" : "outline"}
              onClick={() => setForm({ ...form, leadType: t })}
            >
              {t}
            </Button>
          ))}
        </div>

        <Input placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="Phone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Textarea placeholder="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />

        <Button onClick={submit} disabled={submitting} className="w-full">
          {submitting ? "Sending..." : "Send Enquiry"}
        </Button>
      </CardContent>
    </Card>
  );
}
