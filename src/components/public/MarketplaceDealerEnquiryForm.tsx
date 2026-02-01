import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createPublicLead } from "@/lib/leads";
import { trackPublicEvent } from "@/lib/publicAnalytics";

interface MarketplaceDealerEnquiryFormProps {
  dealerInfo: {
    user_id: string;
    public_page_id?: string;
    dealer_name?: string;
  };
  compact?: boolean;
}

export default function MarketplaceDealerEnquiryForm({
  dealerInfo,
  compact = false,
}: MarketplaceDealerEnquiryFormProps) {
  const { toast } = useToast();

  const [form, setForm] = useState<{
    name: string;
    phone: string;
    email: string;
    city: string;
    message: string;
    leadType: "buying" | "selling";
  }>({
    name: "",
    phone: "",
    email: "",
    city: "",
    message: "",
    leadType: "buying",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formOpened, setFormOpened] = useState(false);

  // Track form opened when user starts typing
  const handleFormFocus = useCallback(() => {
    if (!formOpened && dealerInfo?.user_id) {
      setFormOpened(true);
      trackPublicEvent({
        eventType: "form_opened",
        dealerUserId: dealerInfo.user_id,
        publicPageId: "marketplace",
      });
    }
  }, [formOpened, dealerInfo?.user_id]);

  // Track form abandoned on unmount if opened but not submitted
  useEffect(() => {
    return () => {
      if (formOpened && !submitted && dealerInfo?.user_id) {
        trackPublicEvent({
          eventType: "form_abandoned",
          dealerUserId: dealerInfo.user_id,
          publicPageId: "marketplace",
        });
      }
    };
  }, [formOpened, submitted, dealerInfo?.user_id]);

  const submit = async () => {
    if (!form.name || !form.phone) {
      toast({ title: "Name & phone required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const notes = [
        "[MARKETPLACE]",
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
        source: "marketplace",
        lead_type: form.leadType,
      });

      await trackPublicEvent({
        eventType: "enquiry_submit",
        dealerUserId: dealerInfo.user_id,
        publicPageId: "marketplace",
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
            setFormOpened(false);
            setForm({
              name: "",
              phone: "",
              email: "",
              city: "",
              message: "",
              leadType: "buying" as const,
            });
          }}
        >
          Send another
        </Button>
      </div>
    );
  }

  return (
    <Card className={compact ? "border-0 shadow-none" : "border-0 shadow-lg rounded-2xl"}>
      <div className="mb-4 text-center pt-4 px-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Get the Best Quote
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Fill this form and we'll contact you shortly
        </p>
      </div>

      <CardContent className="space-y-3 px-4 pb-4">
        <div className="flex gap-2">
          {(["buying", "selling"] as const).map((t) => (
            <Button
              key={t}
              size="sm"
              variant={form.leadType === t ? "default" : "outline"}
              onClick={() => setForm({ ...form, leadType: t })}
              className="flex-1"
            >
              {t === "buying" ? "I want to Buy" : "I want to Sell"}
            </Button>
          ))}
        </div>

        <Input
          placeholder="Name *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          onFocus={handleFormFocus}
          className="rounded-xl h-11"
        />
        <Input
          placeholder="Phone *"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          onFocus={handleFormFocus}
          className="rounded-xl h-11"
        />
        <Input
          placeholder="City"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          onFocus={handleFormFocus}
          className="rounded-xl h-11"
        />
        <Input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          onFocus={handleFormFocus}
          className="rounded-xl h-11"
        />
        <Textarea
          placeholder="Message"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          onFocus={handleFormFocus}
          className="rounded-xl"
          rows={3}
        />

        <Button onClick={submit} disabled={submitting} className="w-full h-11 rounded-xl font-semibold">
          <Send className="h-4 w-4 mr-2" />
          {submitting ? "Sending..." : "Send Enquiry"}
        </Button>
      </CardContent>
    </Card>
  );
}
