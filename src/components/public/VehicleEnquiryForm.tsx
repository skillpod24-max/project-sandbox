import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createPublicLead } from "@/lib/leads";
import { trackPublicEvent } from "@/lib/publicAnalytics";

export default function VehicleEnquiryForm({
  vehicle,
  dealer,
  compact = false,
}: {
  vehicle: any;
  dealer: any;
  compact?: boolean;
}) {
  const { toast } = useToast();

  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formOpened, setFormOpened] = useState(false);

  // Track form opened when user starts typing
  const handleFormFocus = useCallback(() => {
    if (!formOpened && vehicle?.user_id && dealer?.public_page_id) {
      setFormOpened(true);
      trackPublicEvent({
        eventType: "form_opened",
        dealerUserId: vehicle.user_id,
        publicPageId: dealer.public_page_id,
        vehicleId: vehicle.id,
      });
    }
  }, [formOpened, vehicle?.user_id, vehicle?.id, dealer?.public_page_id]);

  // Track form abandoned on unmount if opened but not submitted
  useEffect(() => {
    return () => {
      if (formOpened && !submitted && vehicle?.user_id && dealer?.public_page_id) {
        trackPublicEvent({
          eventType: "form_abandoned",
          dealerUserId: vehicle.user_id,
          publicPageId: dealer.public_page_id,
          vehicleId: vehicle.id,
        });
      }
    };
  }, [formOpened, submitted, vehicle?.user_id, vehicle?.id, dealer?.public_page_id]);

  const submit = async () => {
    if (!form.name || !form.phone) {
      toast({ title: "Name & phone required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await createPublicLead({
        dealerUserId: vehicle.user_id,
        customerName: form.name,
        phone: form.phone,
        email: form.email || undefined,
        vehicleInterest: `${vehicle.brand} ${vehicle.model}`,
        notes: form.message || undefined,
        source: "website",
      });

      await trackPublicEvent({
        eventType: "enquiry_submit",
        dealerUserId: vehicle.user_id,
        publicPageId: dealer.public_page_id,
        vehicleId: vehicle.id,
      });

      setSubmitted(true);
      toast({ title: "Enquiry sent" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-6">
        <CheckCircle className="h-10 w-10 mx-auto text-emerald-500 mb-2" />
        <p className="font-semibold">Enquiry submitted!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Get the Best Price for this Vehicle
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Share your details — we'll contact you shortly
        </p>
      </div>

      <Input
        placeholder="Name *"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        onFocus={handleFormFocus}
      />
      <Input
        placeholder="Phone *"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        onFocus={handleFormFocus}
      />
      <Input
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        onFocus={handleFormFocus}
      />
      <Textarea
        placeholder="Message"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        onFocus={handleFormFocus}
      />
      <Button onClick={submit} disabled={submitting} className="w-full">
        <Send className="h-4 w-4 mr-2" />
        {submitting ? "Sending..." : "Send Enquiry"}
      </Button>
    </div>
  );
}
